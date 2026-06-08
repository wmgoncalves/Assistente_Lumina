const express    = require('express');
const path       = require('path');
const fs         = require('fs');
const { exec }   = require('child_process');
const os         = require('os');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const PIPER_DIR    = path.join(__dirname, 'piper');
const PIPER_EXE    = path.join(PIPER_DIR, 'piper.exe');
const PIPER_VOICES = path.join(PIPER_DIR, 'voices');
const multer   = require('multer');
const mammoth  = require('mammoth');
const pdfParse = require('pdf-parse');

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
  m.history = (req.body.history || []).slice(-30);
  writeJSON(MEMORY_FILE, m);
  res.json({ ok: true });
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
          generationConfig: { maxOutputTokens: 500, temperature: 0.82 }
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
        if (f && !m.facts.includes(f) && m.facts.length < 80) { m.facts.push(f); changed = true; }
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
      .replace(/([a-záéíóúàâêôãõç])([A-ZÁÉÍÓÚÀÂÊÔÃÕÇ])/g, '$1 $2')
      .replace(/([.,;:!?])([^\s])/g, '$1 $2')
      .replace(/\s+/g, ' ')
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
    data.forEach(t => {
      const status = t.done ? '✅ Concluída' : '⏳ Pendente';
      const tag    = t.done ? 'concluida' : 'pendente';
      writeVault(`Tarefas/${safeSlug(t.text)}.md`,
`---
tags: [sky, tarefa, ${tag}]
status: ${tag}
id: "${t.id}"
---
# ${t.text}

**Status:** ${status}
`);
    });
  }

  if (store === 'habits') {
    data.forEach(h => {
      const streak = (h.dates || []).length;
      writeVault(`Hábitos/${safeSlug(h.name)}.md`,
`---
tags: [sky, habito]
streak: ${streak}
---
# ${h.name}

**Sequência:** ${streak} dias registrados
**Datas:** ${(h.dates || []).slice(-10).join(', ') || 'nenhuma ainda'}
`);
    });
  }

  if (store === 'finances') {
    const total = data.reduce((s, f) => f.type === 'rec' ? s + f.val : s - f.val, 0);
    const linhas = data.slice(0, 30).map(f =>
      `| ${f.date} | ${f.desc} | ${f.type === 'rec' ? '+' : '-'}R$ ${Number(f.val).toFixed(2)} |`
    ).join('\n');
    writeVault('Finanças/Resumo.md',
`---
tags: [sky, financas]
updated: ${now()}
---
# Finanças

**Saldo atual:** R$ ${total.toFixed(2)}

## Últimas transações
| Data | Descrição | Valor |
|------|-----------|-------|
${linhas}
`);
  }

  if (store === 'notes') {
    data.forEach(n => {
      writeVault(`Conhecimento/${safeSlug(n.title)}.md`,
`---
tags: [sky, conhecimento]
source: "${n.source || 'manual'}"
date: "${(n.date || '').split('T')[0]}"
---
# ${n.title}

${n.content}
`);
    });
  }
};

const syncMemoryToObsidian = (mem) => {
  if (!mem) return;
  const fatos = (mem.facts || []).map(f => `- ${f}`).join('\n') || '- nenhum ainda';
  writeVault('Memória/Perfil.md',
`---
tags: [sky, memoria, perfil]
updated: ${now()}
sessions: ${mem.sessions || 0}
---
# Perfil — ${mem.userName || 'Usuário'}

**Nome:** ${mem.userName || 'desconhecido'}
**Sessões:** ${mem.sessions || 0}
**Último acesso:** ${mem.lastSeen || now()}

## O que a Sky sabe sobre você
${fatos}
`);

  const hist = (mem.history || []).slice(-20);
  if (hist.length) {
    const linhas = hist.map(h =>
      `**${h.role === 'user' ? '🧑 Você' : '🤖 Sky'}:** ${String(h.content).substring(0, 200)}`
    ).join('\n\n');
    writeVault(`Conversas/${now()}.md`,
`---
tags: [sky, conversa]
date: ${now()}
---
# Conversa — ${now()}

${linhas}
`);
  }
};

app.post('/api/memory', (req, res) => {
  const m = getMem();
  const updated = { ...m, ...req.body };
  writeJSON(MEMORY_FILE, updated);
  syncMemoryToObsidian(updated);
  res.json({ ok: true });
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

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log(`║  Emerald  →  http://localhost:${PORT}    ║`);
  console.log('╚═══════════════════════════════════════╝\n');
  console.log('  Pressione Ctrl+C para encerrar.\n');
});
