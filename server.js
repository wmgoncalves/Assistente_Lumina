const express    = require('express');
const path       = require('path');
const fs         = require('fs');
const { exec }   = require('child_process');
const os         = require('os');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const PIPER_DIR    = path.join(__dirname, 'piper');
const PIPER_EXE    = path.join(PIPER_DIR, 'piper.exe');
const PIPER_VOICES = path.join(PIPER_DIR, 'voices');
const multer    = require('multer');
const mammoth   = require('mammoth');
const pdfParse  = require('pdf-parse');
const notifier   = require('node-notifier');
const puppeteer  = require('puppeteer');

// Node 18+ required (built-in fetch)
if (!globalThis.fetch) {
  console.error('\n[ERRO] Node.js 18+ é necessário. Atualize em https://nodejs.org\n');
  process.exit(1);
}

const PORT        = process.env.PORT || 8080;
const CONFIG_FILE = path.join(__dirname, 'config.json');
const MEMORY_FILE = path.join(__dirname, 'memory.json');

// ── Helpers ───────────────────────────────────────────────────────────────────
const readJSON = (file, def) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return def; }
};

const writeJSON = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

const getCfg = () => readJSON(CONFIG_FILE, { geminiKey: '', elevenLabsKey: '', username: '' });
const getMem = () => readJSON(MEMORY_FILE, { userName: null, facts: [], sessions: 0, lastSeen: null, history: [] });

// ── Express ───────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '20mb' }));
// Serve arquivos da raiz (versão atual da Sky) antes do public/
const noCache = (res) => res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
app.get('/',          (_, res) => { noCache(res); res.sendFile(path.join(__dirname, 'index.html')); });
app.get('/style.css', (_, res) => { noCache(res); res.sendFile(path.join(__dirname, 'style.css')); });
app.get('/app.js',    (_, res) => { noCache(res); res.sendFile(path.join(__dirname, 'app.js')); });
app.use(express.static(path.join(__dirname, 'public')));

// ── Config ────────────────────────────────────────────────────────────────────
app.get('/api/config', (req, res) => {
  const c = getCfg();
  // Expõe chaves apenas para localhost (app local, sem risco)
  const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
  res.json({
    username:      c.username      || '',
    geminiKey:     isLocal ? (c.geminiKey     || '') : '',
    elevenLabsKey: isLocal ? (c.elevenLabsKey || '') : '',
    elevenVoiceId: isLocal ? (c.elevenVoiceId || '') : '',
    hasGemini:     !!c.geminiKey,
    hasElevenLabs: !!c.elevenLabsKey,
  });
});

app.post('/api/config', (req, res) => {
  const c = getCfg();
  const { username, geminiKey, elevenLabsKey, elevenVoiceId } = req.body;
  if (username      !== undefined)             c.username      = username;
  if (geminiKey     && geminiKey.trim())       c.geminiKey     = geminiKey.trim();
  if (elevenLabsKey && elevenLabsKey.trim())   c.elevenLabsKey = elevenLabsKey.trim();
  if (elevenVoiceId !== undefined)             c.elevenVoiceId = elevenVoiceId.trim();
  writeJSON(CONFIG_FILE, c);
  res.json({ ok: true, hasGemini: !!c.geminiKey, hasElevenLabs: !!c.elevenLabsKey });
});

// ── Memory ────────────────────────────────────────────────────────────────────
app.get('/api/memory', (req, res) => {
  const m = getMem();
  res.json({ userName: m.userName, facts: m.facts || [], sessions: m.sessions || 0 });
});

// /api/memory POST — definido abaixo junto com o sync Obsidian

app.delete('/api/memory', (req, res) => {
  const m = getMem();
  writeJSON(MEMORY_FILE, { userName: null, facts: [], sessions: 0, lastSeen: null, history: m.history || [] });
  res.json({ ok: true });
});

// ── History ───────────────────────────────────────────────────────────────────
app.get('/api/history', (req, res) => {
  res.json({ history: getMem().history || [] });
});

app.post('/api/history', (req, res) => {
  const m = getMem();
  m.history = (req.body.history || []).slice(-200);
  writeJSON(MEMORY_FILE, m);
  res.json({ ok: true });
});

// ── Memory: relate two facts ──────────────────────────────────────────────────
app.post('/api/memory/relate', (req, res) => {
  const { a, b, type = 'related_to' } = req.body;
  if (!a || !b) return res.status(400).json({ error: 'a and b required' });
  const m = getMem();
  if (!m.relationships) m.relationships = [];
  const exists = m.relationships.find(r => (r.a === a && r.b === b) || (r.a === b && r.b === a));
  if (!exists) m.relationships.push({ a, b, type });
  writeJSON(MEMORY_FILE, m);
  res.json({ ok: true });
});

// ── Memory: consolidate via Gemini ────────────────────────────────────────────
app.post('/api/memory/consolidate', async (req, res) => {
  const c = getCfg();
  if (!c.geminiKey) return res.status(400).json({ error: 'no_key' });
  const m = getMem();
  const rawFacts = (m.facts || []).map(f => typeof f === 'string' ? f : f.text).filter(Boolean);
  if (rawFacts.length < 2) return res.json({ ok: true, message: 'Poucos fatos para consolidar.' });

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${c.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Analise estes fatos sobre um usuário e retorne JSON enriquecido.
Fatos: ${JSON.stringify(rawFacts)}
Retorne APENAS JSON válido:
{
  "facts": [{"id":"f1","text":"fato limpo","tags":["categoria"],"weight":1}],
  "relationships": [{"a":"f1","b":"f2","type":"related_to"}]
}
Regras: remova duplicatas, corrija contradições, adicione tags (trabalho/saúde/família/hobby/preferência/habilidade), peso 1-3 por importância, máx 60 fatos.` }] }],
          generationConfig: { maxOutputTokens: 2000, temperature: 0.1 }
        })
      }
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d   = await r.json();
    const raw = d.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
    const enriched = JSON.parse(raw);
    m.facts         = enriched.facts         || m.facts;
    m.relationships = enriched.relationships || m.relationships || [];
    writeJSON(MEMORY_FILE, m);
    syncMemoryToObsidian(m);
    res.json({ ok: true, facts: m.facts.length, relationships: m.relationships.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Gemini Chat ───────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const c = getCfg();
  if (!c.geminiKey) return res.status(400).json({ error: 'no_key', message: 'Chave Gemini não configurada.' });

  const { messages, system } = req.body;
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${c.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: messages,
          generationConfig: { maxOutputTokens: 2000, temperature: 0.82 }
        })
      }
    );
    if (!r.ok) { const e = await r.json().catch(() => ({})); return res.status(r.status).json({ error: e.error?.message || `HTTP ${r.status}` }); }
    const d = await r.json();
    res.json({ text: d.candidates[0].content.parts[0].text.trim() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Gemini Vision ─────────────────────────────────────────────────────────────
app.post('/api/vision', async (req, res) => {
  const c = getCfg();
  if (!c.geminiKey) return res.status(400).json({ error: 'no_key' });

  const { base64, mimeType, prompt } = req.body;
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${c.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ inline_data: { mime_type: mimeType, data: base64 } }, { text: prompt }] }],
          generationConfig: { maxOutputTokens: 450, temperature: 0.7 }
        })
      }
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    res.json({ text: d.candidates[0].content.parts[0].text.trim() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ElevenLabs TTS ────────────────────────────────────────────────────────────
app.post('/api/tts', async (req, res) => {
  const c = getCfg();
  if (!c.elevenLabsKey) return res.status(400).json({ error: 'no_key' });

  const { text, voiceId = 'pNInz6obpgDQGcFmaJgB' } = req.body;
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': c.elevenLabsKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.48, similarity_boost: 0.78, style: 0.25, use_speaker_boost: true }
      })
    });
    if (!r.ok) throw new Error(`ElevenLabs ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    res.set('Content-Type', 'audio/mpeg');
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Learn (extracts user facts via Gemini) ────────────────────────────────────
app.post('/api/learn', async (req, res) => {
  const c = getCfg();
  if (!c.geminiKey) return res.json({ updated: false });

  const { text } = req.body;
  if (!text || text.length < 10) return res.json({ updated: false });

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${c.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Extraia fatos concretos sobre o USUÁRIO desta mensagem. Apenas fatos claros e úteis de recordar.
Mensagem: "${text.substring(0, 300)}"
Responda APENAS JSON: {"nome":"X ou null","fatos":["fato"]} — máx 2 fatos em português.` }] }],
          generationConfig: { maxOutputTokens: 80, temperature: 0.1 }
        })
      }
    );
    if (!r.ok) return res.json({ updated: false });

    const d    = await r.json();
    const raw  = d.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const json = JSON.parse(raw.replace(/```json|```/g, '').trim());
    const m    = getMem();
    let changed = false;

    if (json.nome && !m.userName)         { m.userName = json.nome; changed = true; }
    if (Array.isArray(json.fatos)) {
      for (const f of json.fatos) {
        if (!f) continue;
        const exists = (m.facts || []).some(x => (typeof x === 'string' ? x : x.text) === f);
        if (!exists && (m.facts || []).length < 80) {
          if (!m.facts) m.facts = [];
          m.facts.push({ id: `f${Date.now()}_${m.facts.length}`, text: f, tags: [], weight: 1, date: new Date().toISOString().split('T')[0] });
          changed = true;
        }
      }
    }
    if (changed) writeJSON(MEMORY_FILE, m);
    res.json({ updated: changed, memory: { userName: m.userName, facts: m.facts } });
  } catch { res.json({ updated: false }); }
});

// ── Piper TTS (local, offline, sem internet) ─────────────────────────────────
app.get('/api/piper-available', (_, res) => {
  res.json({ available: fs.existsSync(PIPER_EXE) });
});

app.post('/api/tts-piper', (req, res) => {
  const { text, voice = 'pt_BR-cadu-medium' } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  if (!fs.existsSync(PIPER_EXE)) return res.status(503).json({ error: 'Piper não instalado em C:\\Sky\\piper\\piper.exe' });

  const modelPath = path.join(PIPER_VOICES, `${voice}.onnx`);
  if (!fs.existsSync(modelPath)) return res.status(503).json({ error: `Modelo não encontrado: ${voice}.onnx` });

  const tmpFile = path.join(os.tmpdir(), `sky_tts_${Date.now()}.wav`);
  const clean   = text.replace(/"/g, "'").replace(/\n/g, ' ').substring(0, 1000);
  const cmd     = `echo "${clean}" | "${PIPER_EXE}" --model "${modelPath}" --output_file "${tmpFile}"`;

  exec(cmd, (err) => {
    if (err || !fs.existsSync(tmpFile)) {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
      return res.status(500).json({ error: err?.message || 'Piper falhou' });
    }
    res.set('Content-Type', 'audio/wav');
    const stream = fs.createReadStream(tmpFile);
    stream.pipe(res);
    stream.on('end', () => { try { fs.unlinkSync(tmpFile); } catch {} });
    stream.on('error', () => res.status(500).end());
  });
});

// ── Edge TTS (Microsoft Neural — gratuito, sem API key) ──────────────────────
app.post('/api/tts-edge', async (req, res) => {
  const { text, voice = 'pt-BR-FranciscaNeural' } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  try {
    const tts    = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const chunks = [];
    const stream = tts.toStream(text);
    stream.on('data',  c => chunks.push(c));
    stream.on('end',   () => { res.set('Content-Type', 'audio/mpeg'); res.send(Buffer.concat(chunks)); });
    stream.on('error', e => { if (!res.headersSent) res.status(500).json({ error: e.message }); });
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: e.message });
  }
});

// ── Ingestão de Documentos (PDF / DOCX / TXT) ────────────────────────────────
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const chunkText = (text, size = 800, overlap = 100) => {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return chunks.filter(c => c.trim().length > 60);
};

app.post('/api/ingest-doc', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  const { originalname, mimetype, buffer } = req.file;
  let text = '';
  try {
    if (mimetype === 'application/pdf' || originalname.endsWith('.pdf')) {
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (mimetype.includes('wordprocessingml') || originalname.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      text = buffer.toString('utf8');
    }
    // Corrige espaços perdidos na extração de PDF
    text = text
      // camelCase / PascalCase: minúscula seguida de maiúscula
      .replace(/([a-záéíóúàâêôãõç])([A-ZÁÉÍÓÚÀÂÊÔÃÕÇ])/g, '$1 $2')
      // pontuação grudada em letra
      .replace(/([.,;:!?])([^\s\d])/g, '$1 $2')
      // letra minúscula grudada em dígito e vice-versa
      .replace(/([a-záéíóúàâêôãõç])(\d)/g, '$1 $2')
      .replace(/(\d)([a-záéíóúàâêôãõç])/g, '$1 $2')
      // palavras em ALLCAPS coladas: sequência caps seguida de caps+minúscula (ex: "PIXFormade" → "PIX Formade")
      .replace(/([A-ZÁÉÍÓÚÀÂÊÔÃÕÇ]{2,})([A-ZÁÉÍÓÚÀÂÊÔÃÕÇ][a-záéíóúàâêôãõç])/g, '$1 $2')
      // remove hifens de quebra de linha
      .replace(/-\n\s*/g, '')
      // normaliza múltiplos espaços/quebras
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (!text) return res.status(422).json({ error: 'Não foi possível extrair texto do arquivo.' });
    const baseName = originalname.replace(/\.[^.]+$/, '');
    const chunks   = chunkText(text);
    const notes    = chunks.map((c, i) => ({
      id:      `doc_${Date.now()}_${i}`,
      title:   `${baseName} (${i + 1}/${chunks.length})`,
      content: c,
      source:  originalname,
      date:    new Date().toISOString()
    }));
    res.json({ ok: true, chunks: notes.length, notes });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Dados persistentes (tarefas, hábitos, finanças, notas) ───────────────────
const DATA_STORES = ['tasks', 'habits', 'finances', 'notes'];
const dataFile = (store) => path.join(__dirname, `${store}.json`);

DATA_STORES.forEach(store => {
  app.get(`/api/data/${store}`, (_, res) => {
    res.json(readJSON(dataFile(store), []));
  });
  app.post(`/api/data/${store}`, (req, res) => {
    writeJSON(dataFile(store), req.body);
    syncStoreToObsidian(store, req.body).catch(() => {});
    if (store === 'notes') setTimeout(triggerReindex, 2000);
    res.json({ ok: true });
  });
});

// ── Obsidian Sync ─────────────────────────────────────────────────────────────
const VAULT_PATH = path.join(os.homedir(), 'Documents', 'Sky Vault');

const vaultDir  = (...parts) => path.join(VAULT_PATH, ...parts);
const safeSlug  = (s) => String(s).replace(/[\\/:*?"<>|]/g, '-').trim().substring(0, 80);
const now       = () => new Date().toISOString().split('T')[0];

const writeVault = (relPath, content) => {
  const full = vaultDir(relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
};

const syncStoreToObsidian = async (store, data) => {
  if (!Array.isArray(data)) return;

  if (store === 'tasks') {
    const slugs = [];
    data.forEach(t => {
      const status = t.done ? '✅ Concluída' : '⏳ Pendente';
      const tag    = t.done ? 'concluida' : 'pendente';
      const slug   = safeSlug(t.text);
      slugs.push(slug);
      writeVault(`Tarefas/${slug}.md`,
`---
tags: [sky, tarefa, ${tag}]
status: ${tag}
id: "${t.id}"
---
# ${t.text}

**Status:** ${status}

---
← [[Cérebro]]
`);
    });
    writeVault('Tarefas/Tarefas.md',
`---
tags: [sky, index]
---
# Tarefas

← [[Cérebro]]

${slugs.map(s => `- [[Tarefas/${s}]]`).join('\n') || '- nenhuma ainda'}
`);
  }

  if (store === 'habits') {
    const slugs = [];
    data.forEach(h => {
      const streak = (h.dates || []).length;
      const slug   = safeSlug(h.name);
      slugs.push(slug);
      writeVault(`Hábitos/${slug}.md`,
`---
tags: [sky, habito]
streak: ${streak}
---
# ${h.name}

**Sequência:** ${streak} dias registrados
**Datas:** ${(h.dates || []).slice(-10).join(', ') || 'nenhuma ainda'}

---
← [[Cérebro]]
`);
    });
    writeVault('Hábitos/Hábitos.md',
`---
tags: [sky, index]
---
# Hábitos

← [[Cérebro]]

${slugs.map(s => `- [[Hábitos/${s}]]`).join('\n') || '- nenhum ainda'}
`);
  }

  if (store === 'finances') {
    const total  = data.reduce((s, f) => f.type === 'rec' ? s + f.val : s - f.val, 0);
    const linhas = data.slice(0, 30).map(f =>
      `| ${f.date} | ${f.desc} | ${f.type === 'rec' ? '+' : '-'}R$ ${Number(f.val).toFixed(2)} |`
    ).join('\n');
    writeVault('Finanças/Resumo.md',
`---
tags: [sky, financas]
updated: ${now()}
---
# Finanças

← [[Cérebro]]

**Saldo atual:** R$ ${total.toFixed(2)}

## Últimas transações
| Data | Descrição | Valor |
|------|-----------|-------|
${linhas}
`);
  }

  if (store === 'notes') {
    const slugs = [];
    data.forEach(n => {
      const slug = safeSlug(n.title);
      slugs.push(slug);
      writeVault(`Conhecimento/${slug}.md`,
`---
tags: [sky, conhecimento]
source: "${n.source || 'manual'}"
date: "${(n.date || '').split('T')[0]}"
---
# ${n.title}

${n.content}

---
← [[Cérebro]]
`);
    });
    writeVault('Conhecimento/Conhecimento.md',
`---
tags: [sky, index]
---
# Base de Conhecimento

← [[Cérebro]]

${slugs.map(s => `- [[Conhecimento/${s}]]`).join('\n') || '- nenhuma ainda'}
`);
  }
};

const syncMemoryToObsidian = (mem) => {
  if (!mem) return;
  const fatos = (mem.facts || []).map(f => `- ${typeof f === 'string' ? f : f.text}`).join('\n') || '- nenhum ainda';

  writeVault('Memória/Perfil.md',
`---
tags: [sky, memoria, perfil]
updated: ${now()}
sessions: ${mem.sessions || 0}
---
# Perfil — ${mem.userName || 'Usuário'}

← [[Cérebro]]

**Nome:** ${mem.userName || 'desconhecido'}
**Sessões:** ${mem.sessions || 0}
**Último acesso:** ${mem.lastSeen || now()}

## O que a Sky sabe sobre você
${fatos}

## Conversas recentes
→ [[Conversas/Conversas]]
`);

  const hist = (mem.history || []).slice(-20);
  const dateSlug = now();
  if (hist.length) {
    const linhas = hist.map(h =>
      `**${h.role === 'user' ? '🧑 Você' : '🤖 Sky'}:** ${String(h.content).substring(0, 200)}`
    ).join('\n\n');
    writeVault(`Conversas/${dateSlug}.md`,
`---
tags: [sky, conversa]
date: ${dateSlug}
---
# Conversa — ${dateSlug}

← [[Conversas/Conversas]] | [[Memória/Perfil]]

${linhas}
`);
  }

  // Reconstrói o índice de conversas a partir dos arquivos existentes
  try {
    const convDir = path.join(VAULT_PATH, 'Conversas');
    if (fs.existsSync(convDir)) {
      const files = fs.readdirSync(convDir)
        .filter(f => f.endsWith('.md') && f !== 'Conversas.md')
        .sort().reverse().slice(0, 30);
      writeVault('Conversas/Conversas.md',
`---
tags: [sky, index]
---
# Conversas

← [[Cérebro]] | [[Memória/Perfil]]

${files.map(f => `- [[Conversas/${f.replace('.md', '')}]]`).join('\n') || '- nenhuma ainda'}
`);
    }
  } catch {}

  // Nó central — Cérebro da Sky
  writeVault('Cérebro.md',
`---
tags: [sky, cerebro, hub]
updated: ${now()}
---
# 🧠 Cérebro da Sky

> Mapa central de tudo que a Sky conhece e registra.

## Usuário
- [[Memória/Perfil]]

## Atividades
- [[Tarefas/Tarefas]]
- [[Hábitos/Hábitos]]
- [[Finanças/Resumo]]

## Conhecimento
- [[Conhecimento/Conhecimento]]

## Conversas
- [[Conversas/Conversas]]
`);
};

app.post('/api/memory', (req, res) => {
  const m = getMem();
  const updated = { ...m, ...req.body };
  writeJSON(MEMORY_FILE, updated);
  syncMemoryToObsidian(updated);
  res.json({ ok: true });
});

// ── Import de vault Obsidian externo → Base de Conhecimento da Sky ───────────
app.post('/api/import-vault', (req, res) => {
  const vaultRoot = req.body.path;
  if (!vaultRoot || !fs.existsSync(vaultRoot)) {
    return res.status(400).json({ error: 'Caminho não encontrado: ' + vaultRoot });
  }

  const IGNORE_DIRS  = new Set(['.obsidian', '.trash', '.git', 'node_modules']);
  const IGNORE_FILES = new Set(['MEMORY.md']);

  const readAllMd = (dir, results = []) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.has(entry.name)) readAllMd(path.join(dir, entry.name), results);
      } else if (entry.name.endsWith('.md') && !IGNORE_FILES.has(entry.name)) {
        results.push(path.join(dir, entry.name));
      }
    }
    return results;
  };

  const stripFrontmatter = (text) => text.replace(/^---[\s\S]*?---\n?/, '').trim();

  try {
    const files   = readAllMd(vaultRoot);
    const notes   = [];
    let   skipped = 0;

    for (const filePath of files) {
      const raw     = fs.readFileSync(filePath, 'utf8');
      const content = stripFrontmatter(raw);
      if (content.length < 30) { skipped++; continue; }

      const title = path.basename(filePath, '.md');
      const rel   = path.relative(vaultRoot, filePath).replace(/\\/g, '/');

      notes.push({
        id:      `vault_${Date.now()}_${notes.length}`,
        title:   title,
        content: content.substring(0, 3000),
        source:  rel,
        date:    new Date().toISOString()
      });
    }

    const existing  = readJSON(dataFile('notes'), []);
    const merged    = [...notes, ...existing.filter(n => !n.source?.startsWith('vault_') && !notes.some(nn => nn.title === n.title))];
    writeJSON(dataFile('notes'), merged);
    syncStoreToObsidian('notes', merged).catch(() => {});
    setTimeout(triggerReindex, 3000);

    res.json({ ok: true, imported: notes.length, skipped, total: merged.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── RAG: Embeddings Vetoriais ─────────────────────────────────────────────────
const EMBED_FILE = path.join(__dirname, 'embeddings.json');
const readEmbed  = () => readJSON(EMBED_FILE, {});

const cosineSim = (a, b) => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
};

const geminiEmbed = async (key, texts) => {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: texts.map(t => ({
          model: 'models/text-embedding-004',
          content: { parts: [{ text: String(t).substring(0, 2000) }] }
        }))
      })
    }
  );
  if (!r.ok) throw new Error(`Embed HTTP ${r.status}`);
  const d = await r.json();
  return d.embeddings.map(e => e.values);
};

app.post('/api/index-notes', async (req, res) => {
  const c = getCfg();
  if (!c.geminiKey) return res.status(400).json({ error: 'no_key' });
  const notes = readJSON(dataFile('notes'), []);
  if (!notes.length) return res.json({ ok: true, indexed: 0 });

  const embed  = readEmbed();
  const toIdx  = notes.filter(n => !embed[n.id]);
  if (!toIdx.length) return res.json({ ok: true, indexed: 0, cached: Object.keys(embed).length });

  const BATCH = 50;
  let indexed = 0;
  try {
    for (let i = 0; i < toIdx.length; i += BATCH) {
      const batch  = toIdx.slice(i, i + BATCH);
      const texts  = batch.map(n => `${n.title}: ${n.content}`);
      const vecs   = await geminiEmbed(c.geminiKey, texts);
      batch.forEach((n, j) => { embed[n.id] = vecs[j]; });
      indexed += batch.length;
    }
    writeJSON(EMBED_FILE, embed);
    res.json({ ok: true, indexed, cached: Object.keys(embed).length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/search-notes', async (req, res) => {
  const c = getCfg();
  if (!c.geminiKey) return res.status(400).json({ error: 'no_key' });
  const { query = '', topK = 5 } = req.body;
  if (!query) return res.json({ ids: [] });

  try {
    const [qVec]  = await geminiEmbed(c.geminiKey, [query]);
    const embed   = readEmbed();
    const scores  = Object.entries(embed)
      .map(([id, vec]) => ({ id, score: cosineSim(qVec, vec) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
    res.json({ ids: scores.map(s => s.id), scores });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Reindexar automaticamente quando notas são salvas já está coberto pelo POST /api/data/notes
// que chama syncStoreToObsidian — adicionamos trigger aqui também:
const triggerReindex = () => {
  const c = getCfg();
  if (!c.geminiKey) return;
  fetch(`http://localhost:${PORT}/api/index-notes`, { method: 'POST' }).catch(() => {});
};

// ── Windows Notifications ─────────────────────────────────────────────────────
app.post('/api/notify', (req, res) => {
  const { title = 'Sky', message = '', sound = true } = req.body;
  notifier.notify({ title, message, sound, icon: path.join(__dirname, 'public', 'icon.png'), wait: false });
  res.json({ ok: true });
});

// ── Browser Automation (Puppeteer) ───────────────────────────────────────────
let browserInstance = null;

const getBrowser = async () => {
  if (!browserInstance || !browserInstance.connected) {
    browserInstance = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  }
  return browserInstance;
};

const pageText = async (page) => {
  return page.evaluate(() => {
    document.querySelectorAll('script,style,noscript,nav,footer,header').forEach(el => el.remove());
    return (document.body?.innerText || '').replace(/\s+/g, ' ').trim().substring(0, 4000);
  });
};

app.post('/api/browser', async (req, res) => {
  const { action, url, selectors = [], submit = false } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setDefaultNavigationTimeout(30000);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const title = await page.title();

    if (action === 'navigate' || action === 'extract') {
      const text = selectors.length
        ? (await Promise.all(selectors.map(sel =>
            page.$eval(sel, el => el.innerText).catch(() => '')
          ))).join('\n')
        : await pageText(page);
      res.json({ ok: true, title, text });

    } else if (action === 'fill') {
      for (const { css, value } of selectors) {
        await page.$eval(css, (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, value).catch(() => {});
      }
      if (submit) {
        await Promise.all([page.keyboard.press('Enter'), page.waitForNavigation({ timeout: 10000 }).catch(() => {})]);
      }
      const text = await pageText(page);
      res.json({ ok: true, title: await page.title(), text });

    } else {
      res.status(400).json({ error: 'action must be navigate, extract or fill' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    if (page) await page.close().catch(() => {});
  }
});

// ── VS Code Integration ───────────────────────────────────────────────────────
app.post('/api/vscode', (req, res) => {
  const { file = '', line } = req.body;
  if (!file) return res.status(400).json({ error: 'file required' });
  const target = line ? `"${file}:${line}"` : `"${file}"`;
  exec(`code --goto ${target}`, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

app.get('/api/export-obsidian', (req, res) => {
  try {
    fs.mkdirSync(VAULT_PATH, { recursive: true });
    DATA_STORES.forEach(store => {
      const data = readJSON(dataFile(store), []);
      syncStoreToObsidian(store, data);
    });
    syncMemoryToObsidian(getMem());
    res.json({ ok: true, vault: VAULT_PATH });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── News RSS (G1 + BBC Brasil — sem API key) ──────────────────────────────────
const RSS_FEEDS = [
  { url: 'https://g1.globo.com/rss/g1/',                     source: 'G1'       },
  { url: 'https://feeds.bbci.co.uk/portuguese/rss.xml',      source: 'BBC'      },
  { url: 'https://www.uol.com.br/rss.xml',                   source: 'UOL'      },
];

const parseRssTitles = (xml) => {
  const items = [...xml.matchAll(/<item[\s\S]*?<\/item>/g)].slice(0, 6);
  return items.map(m => {
    const titleMatch = m[0].match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    return titleMatch ? titleMatch[1].trim() : null;
  }).filter(Boolean);
};

app.get('/api/news', async (_, res) => {
  const headlines = [];
  for (const feed of RSS_FEEDS) {
    try {
      const r = await fetch(feed.url, {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SkyBot/1.0)' }
      });
      if (!r.ok) continue;
      const xml    = await r.text();
      const titles = parseRssTitles(xml, feed.source);
      titles.forEach(t => headlines.push({ title: t, source: feed.source }));
      if (headlines.length >= 10) break;
    } catch { continue; }
  }
  if (!headlines.length) return res.status(503).json({ error: 'Não foi possível buscar notícias.' });
  res.json({ headlines: headlines.slice(0, 8) });
});

// ── Modo Proativo — SSE + Scheduler ──────────────────────────────────────────
const sseClients = new Set();

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);
  sseClients.add(res);

  req.on('close', () => { clearInterval(heartbeat); sseClients.delete(res); });
});

const pushEvent = (type, message, action = null) => {
  const data = JSON.stringify({ type, message, action });
  sseClients.forEach(client => {
    try { client.write(`data: ${data}\n\n`); } catch {}
  });
  // também dispara toast Windows
  notifier.notify({ title: 'Sky', message, sound: true, wait: false });
};

const checkProactive = () => {
  const now     = new Date();
  const hour    = now.getHours();
  const todayKey = now.toISOString().split('T')[0];

  // Hábitos não feitos às 21h+
  if (hour >= 21) {
    const habits = readJSON(path.join(__dirname, 'habits.json'), []);
    const pending = habits.filter(h => !(h.dates || []).includes(todayKey));
    if (pending.length > 0 && sseClients.size > 0) {
      const names = pending.map(h => h.name).join(', ');
      pushEvent('reminder', `Você ainda não registrou: ${names}`, 'checkHabits');
    }
  }

  // Tarefas com prazo — notifica às 9h se houver pendentes
  if (hour === 9) {
    const tasks = readJSON(path.join(__dirname, 'tasks.json'), []);
    const pending = tasks.filter(t => !t.done);
    if (pending.length > 0 && sseClients.size > 0) {
      pushEvent('reminder', `Bom dia! Você tem ${pending.length} tarefa(s) pendente(s).`, 'openTasks');
    }
  }
};

// Roda a cada 60 segundos
setInterval(checkProactive, 60 * 1000);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log(`║  Emerald  →  http://localhost:${PORT}    ║`);
  console.log('╚═══════════════════════════════════════╝\n');
  console.log('  Pressione Ctrl+C para encerrar.\n');
});
