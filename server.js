const express   = require('express');
const path      = require('path');
const fs        = require('fs');
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
app.get('/',          (_, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/style.css', (_, res) => res.sendFile(path.join(__dirname, 'style.css')));
app.get('/app.js',    (_, res) => res.sendFile(path.join(__dirname, 'app.js')));
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
    hasGemini:     !!c.geminiKey,
    hasElevenLabs: !!c.elevenLabsKey,
  });
});

app.post('/api/config', (req, res) => {
  const c = getCfg();
  const { username, geminiKey, elevenLabsKey } = req.body;
  if (username     !== undefined)          c.username      = username;
  if (geminiKey    && geminiKey.trim())    c.geminiKey     = geminiKey.trim();
  if (elevenLabsKey && elevenLabsKey.trim()) c.elevenLabsKey = elevenLabsKey.trim();
  writeJSON(CONFIG_FILE, c);
  res.json({ ok: true, hasGemini: !!c.geminiKey, hasElevenLabs: !!c.elevenLabsKey });
});

// ── Memory ────────────────────────────────────────────────────────────────────
app.get('/api/memory', (req, res) => {
  const m = getMem();
  res.json({ userName: m.userName, facts: m.facts || [], sessions: m.sessions || 0 });
});

app.post('/api/memory', (req, res) => {
  const m = getMem();
  writeJSON(MEMORY_FILE, { ...m, ...req.body });
  res.json({ ok: true });
});

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

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log(`║  Emerald  →  http://localhost:${PORT}    ║`);
  console.log('╚═══════════════════════════════════════╝\n');
  console.log('  Pressione Ctrl+C para encerrar.\n');
});
