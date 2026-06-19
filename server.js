const express    = require('express');
const path       = require('path');
const fs         = require('fs');
const crypto     = require('crypto');
const { exec, execFile, spawn } = require('child_process');
const os         = require('os');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

// Quando rodando como filho do Electron: encerra junto com o pai
if (process.channel) {
  process.on('disconnect', () => process.exit(0));
}

const PIPER_DIR    = path.join(__dirname, 'piper');
const PIPER_EXE    = path.join(PIPER_DIR, 'piper.exe');
const PIPER_VOICES = path.join(PIPER_DIR, 'voices');
const multer    = require('multer');
const mammoth   = require('mammoth');
const pdfParse  = require('pdf-parse');
const notifier   = require('node-notifier');
let puppeteer = null; // lazy load — carregado só quando /api/browser for usado

const LUMINA_PRINTS_DIR    = path.join(os.homedir(), 'Pictures', 'Lumina Prints');
const LUMINA_GRAVACOES_DIR = path.join(os.homedir(), 'Pictures', 'Lumina Gravacoes');
[LUMINA_PRINTS_DIR, LUMINA_GRAVACOES_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

let activeRecording = { page: null, recorder: null, filePath: null };
const { analyzeSpreadsheet, buildSheetContext } = require('./services/spreadsheetAnalyzer');
const { writeLog, readLogs, clearLogs, countBySource } = require('./services/logger');
const db = require('./services/db');

// Node 18+ required (built-in fetch)
if (!globalThis.fetch) {
  console.error('\n[ERRO] Node.js 18+ é necessário. Atualize em https://nodejs.org\n');
  process.exit(1);
}

const PORT        = Number(process.env.PORT || 8080);
const HOST        = process.env.HOST || '127.0.0.1';
const CONFIG_FILE = path.join(__dirname, 'config.json');
const MEMORY_FILE = path.join(__dirname, 'memory.json');
const WORKSPACE_ROOT = path.resolve(__dirname);
const DEV_TOOLS_ENABLED = process.env.LUMINA_DEV === '1';
const ALLOW_SYSTEM_FILES = process.env.LUMINA_ALLOW_SYSTEM_FILES === '1';

// ── Helpers ───────────────────────────────────────────────────────────────────
const readJSON = (file, def) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return def; }
};

const writeJSON = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

let _cfgCache  = null;
let _memCache  = null;
let _embedCache = null;

const getCfg  = () => _cfgCache  || (_cfgCache  = readJSON(CONFIG_FILE,  { geminiKey: '', elevenLabsKey: '', username: '' }));
const getMem  = () => {
  if (!_memCache) {
    _memCache = readJSON(MEMORY_FILE, { userName: null, facts: [], sessions: 0, lastSeen: null, history: [] });
    if (!Array.isArray(_memCache.facts)) _memCache.facts = [];
  }
  return _memCache;
};
const readEmbed = () => _embedCache || (_embedCache = readJSON(EMBED_FILE, {}));

const saveCfg  = (data) => { _cfgCache  = data; writeJSON(CONFIG_FILE,  data); };
const saveMem  = (data) => { _memCache  = data; writeJSON(MEMORY_FILE,  data); };
const saveEmbed = (data) => { _embedCache = data; writeJSON(EMBED_FILE, data); };

const getLocalApiToken = () => {
  const c = getCfg();
  if (!c.localApiToken || typeof c.localApiToken !== 'string' || c.localApiToken.length < 32) {
    c.localApiToken = crypto.randomBytes(32).toString('hex');
    saveCfg(c);
  }
  return c.localApiToken;
};

const isLoopbackAddress = (addr = '') =>
  addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1';

const isTrustedHost = (hostname = '') =>
  ['localhost', '127.0.0.1', '[::1]', '::1'].includes(String(hostname).toLowerCase());

const isTrustedOrigin = (origin = '') => {
  try {
    const u = new URL(origin);
    return (u.protocol === 'http:' || u.protocol === 'https:') && isTrustedHost(u.hostname);
  } catch {
    return false;
  }
};

const hasValidLocalToken = (req) => {
  const provided = req.get('x-lumina-token') || req.get('x-lumina-dev-token') || '';
  const expected = getLocalApiToken();
  if (!provided || provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
};

const PUBLIC_GET_ENDPOINTS = [
  /^\/api\/local-session$/,
  /^\/api\/events$/,
  /^\/api\/download-doc\//,
  /^\/api\/leads\/export$/,
  /^\/api\/piper-available$/,
  /^\/api\/news$/,
  /^\/api\/sports$/,
];

const SENSITIVE_GET_ENDPOINTS = [
  /^\/api\/config$/,
  /^\/api\/memory$/,
  /^\/api\/history$/,
  /^\/api\/logs$/,
  /^\/api\/db\/stats$/,
  /^\/api\/data\//,
];

const requiresLocalToken = (req) => {
  if (!req.path.startsWith('/api/')) return false;
  if (req.method === 'GET' && PUBLIC_GET_ENDPOINTS.some(re => re.test(req.path))) return false;
  if (req.method !== 'GET') return true;
  return SENSITIVE_GET_ENDPOINTS.some(re => re.test(req.path)) || req.path.startsWith('/api/dev/');
};

const resolveWorkspacePath = (inputPath = '.') => {
  const raw = String(inputPath || '.');
  const resolved = path.resolve(path.isAbsolute(raw) ? raw : path.join(WORKSPACE_ROOT, raw));
  if (!ALLOW_SYSTEM_FILES && resolved !== WORKSPACE_ROOT && !resolved.startsWith(WORKSPACE_ROOT + path.sep)) {
    throw new Error('Caminho fora do workspace bloqueado. Defina LUMINA_ALLOW_SYSTEM_FILES=1 para liberar conscientemente.');
  }
  return resolved;
};

const ensureDevToolsEnabled = (res) => {
  if (DEV_TOOLS_ENABLED) return true;
  res.status(403).json({ error: 'Ferramentas de desenvolvimento bloqueadas. Inicie com LUMINA_DEV=1 para liberar write/edit/exec.' });
  return false;
};

// ── Express ───────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '20mb' }));
// Serve arquivos da raiz (versão atual da Lúmina) antes do public/
const noCache = (res) => res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
app.get('/',          (_, res) => { noCache(res); res.sendFile(path.join(__dirname, 'index.html')); });
app.get('/style.css', (_, res) => { noCache(res); res.sendFile(path.join(__dirname, 'style.css')); });
app.get('/app.js',    (_, res) => { noCache(res); res.sendFile(path.join(__dirname, 'app.js')); });
app.get('/admin',     (_, res) => { noCache(res); res.sendFile(path.join(__dirname, 'admin.html')); });
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) return next();

  if (!isLoopbackAddress(req.socket.remoteAddress)) {
    return res.status(403).json({ error: 'local_only' });
  }

  const origin = req.get('origin');
  if (origin && !isTrustedOrigin(origin)) {
    return res.status(403).json({ error: 'origin_blocked' });
  }

  const fetchSite = req.get('sec-fetch-site');
  if (fetchSite && !['same-origin', 'same-site', 'none'].includes(fetchSite)) {
    return res.status(403).json({ error: 'cross_site_blocked' });
  }

  if (requiresLocalToken(req) && !hasValidLocalToken(req)) {
    return res.status(401).json({ error: 'local_token_required' });
  }

  next();
});

app.get('/api/local-session', (req, res) => {
  noCache(res);
  res.json({
    ok: true,
    token: getLocalApiToken(),
    devToolsEnabled: DEV_TOOLS_ENABLED,
    workspaceOnly: !ALLOW_SYSTEM_FILES,
  });
});

// ── Config ────────────────────────────────────────────────────────────────────
app.get('/api/config', (req, res) => {
  const c = getCfg();
  const canExposeSecrets = hasValidLocalToken(req);
  res.json({
    username:      c.username      || '',
    geminiKey:     canExposeSecrets ? (c.geminiKey     || '') : '',
    elevenLabsKey: canExposeSecrets ? (c.elevenLabsKey || '') : '',
    elevenVoiceId: c.elevenVoiceId || '',
    elevenVoiceFemaleId: c.elevenVoiceFemaleId || '',
    elevenVoiceMaleId: c.elevenVoiceMaleId || '',
    ollamaModel:   c.ollamaModel   || 'gemma3:1b',
    hasGemini:     !!c.geminiKey,
    hasElevenLabs: !!c.elevenLabsKey,
    devToolsEnabled: DEV_TOOLS_ENABLED,
  });
});

app.post('/api/config', (req, res) => {
  const c = getCfg();
  const { username, geminiKey, elevenLabsKey, elevenVoiceId, elevenVoiceFemaleId, elevenVoiceMaleId, ollamaModel, frete_params } = req.body;
  if (username      !== undefined)             c.username      = username;
  if (geminiKey     && geminiKey.trim())       c.geminiKey     = geminiKey.trim();
  if (elevenLabsKey && elevenLabsKey.trim())   c.elevenLabsKey = elevenLabsKey.trim();
  if (elevenVoiceId !== undefined)             c.elevenVoiceId = elevenVoiceId;
  if (elevenVoiceFemaleId !== undefined)       c.elevenVoiceFemaleId = elevenVoiceFemaleId;
  if (elevenVoiceMaleId   !== undefined)       c.elevenVoiceMaleId   = elevenVoiceMaleId;
  if (ollamaModel   && ollamaModel.trim())     c.ollamaModel   = ollamaModel.trim();
  if (frete_params  && typeof frete_params === 'object') {
    const ALLOWED = ['preco_diesel','pedagio_por_km','rendimento_km_l','margem_pct',
                     'custo_fixo_km','custo_motorista_dia','velocidade_media_kmh','fator_rota'];
    const current = c.frete_params || {};
    for (const key of ALLOWED) {
      if (frete_params[key] != null && typeof frete_params[key] === 'number') {
        current[key] = frete_params[key];
      }
    }
    c.frete_params = current;
  }
  saveCfg(c);
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
  saveMem({ userName: null, facts: [], sessions: 0, lastSeen: null, history: m.history || [] });
  res.json({ ok: true });
});

// ── History ───────────────────────────────────────────────────────────────────
app.get('/api/history', (req, res) => {
  res.json({ history: getMem().history || [] });
});

app.post('/api/history', (req, res) => {
  const m = getMem();
  m.history = (req.body.history || []).slice(-200);
  saveMem(m);
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
  saveMem(m);
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
    m.facts         = enriched.facts?.length  ? enriched.facts  : m.facts;
    m.relationships = enriched.relationships?.length ? enriched.relationships : (m.relationships || []);
    saveMem(m);
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
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    if (!text) return res.status(502).json({ error: 'Resposta vazia do Gemini' });
    res.json({ text });
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
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    if (!text) return res.status(502).json({ error: 'Resposta vazia do Gemini Vision' });
    res.json({ text });
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
    if (changed) saveMem(m);
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
  if (!fs.existsSync(PIPER_EXE)) return res.status(503).json({ error: 'Piper não instalado' });
  if (!/^[a-zA-Z0-9_\-]+$/.test(voice)) return res.status(400).json({ error: 'Voice inválido' });

  const modelPath = path.join(PIPER_VOICES, `${voice}.onnx`);
  if (!fs.existsSync(modelPath)) return res.status(503).json({ error: `Modelo não encontrado: ${voice}.onnx` });

  const tmpFile = path.join(os.tmpdir(), `lumina_tts_${Date.now()}.wav`);
  const child   = spawn(PIPER_EXE, ['--model', modelPath, '--output_file', tmpFile], { stdio: ['pipe', 'pipe', 'pipe'] });

  child.stdin.write(text.substring(0, 1000), 'utf8');
  child.stdin.end();

  child.on('close', (code) => {
    if (code !== 0 || !fs.existsSync(tmpFile)) {
      try { fs.unlinkSync(tmpFile); } catch {}
      return res.status(500).json({ error: 'Piper falhou' });
    }
    res.set('Content-Type', 'audio/wav');
    const stream = fs.createReadStream(tmpFile);
    stream.pipe(res);
    stream.on('end', () => { try { fs.unlinkSync(tmpFile); } catch {} });
    stream.on('error', () => { if (!res.headersSent) res.status(500).end(); else res.destroy(); });
  });

  child.on('error', () => { if (!res.headersSent) res.status(500).json({ error: 'Piper não encontrado' }); });
});

// ── Edge TTS (Microsoft Neural — gratuito, sem API key) ──────────────────────
app.post('/api/tts-edge', async (req, res) => {
  const { text, voice = 'pt-BR-ThalitaNeural' } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  try {
    const tts    = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const chunks = [];
    const { audioStream } = tts.toStream(text);
    audioStream.on('data',  c => chunks.push(c));
    audioStream.on('end',   () => { res.set('Content-Type', 'audio/mpeg'); res.send(Buffer.concat(chunks)); });
    audioStream.on('error', e => { if (!res.headersSent) res.status(500).json({ error: e.message }); });
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: e.message });
  }
});

// ── Ingestão de Documentos (PDF / DOCX / TXT) ────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const fileExt = (name = '') => path.extname(String(name)).toLowerCase().replace('.', '');
const hasMagic = (buffer, ext) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return false;
  if (['txt', 'csv'].includes(ext)) return !buffer.subarray(0, Math.min(buffer.length, 4096)).includes(0);
  if (buffer.length < 4) return false;
  if (ext === 'pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  if (['docx', 'xlsx'].includes(ext)) return buffer[0] === 0x50 && buffer[1] === 0x4b;
  if (ext === 'xls') return buffer.subarray(0, 8).equals(Buffer.from([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]));
  return false;
};
const validateUpload = (file, allowedExts) => {
  const ext = fileExt(file.originalname);
  if (!allowedExts.includes(ext)) throw new Error(`Formato não suportado: .${ext || 'sem_extensao'}`);
  if (!hasMagic(file.buffer, ext)) throw new Error(`Arquivo .${ext} inválido ou disfarçado.`);
  return ext;
};
const safeUploadName = (originalname) => {
  const cleaned = path.basename(String(originalname)).replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 120) || 'arquivo';
  return `${Date.now()}_${crypto.randomBytes(4).toString('hex')}_${cleaned}`;
};

const chunkText = (text, size = 800, overlap = 100) => {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return chunks.filter(c => c.trim().length > 60);
};

// Extrai texto de PDF/DOCX sem indexar na base de conhecimento (para análise on-the-fly)
app.post('/api/extract-doc', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  const { originalname, mimetype, buffer } = req.file;
  try {
    const ext = validateUpload(req.file, ['pdf', 'docx', 'txt']);
    let text = '', pages = null;
    if (ext === 'pdf') {
      const data = await pdfParse(buffer);
      text  = data.text;
      pages = data.numpages;
    } else if (ext === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (ext === 'txt') {
      text = buffer.toString('utf8');
    } else {
      return res.status(422).json({ error: 'Formato não suportado. Use PDF, DOCX ou TXT.' });
    }
    res.json({ ok: true, text: text.trim(), pages, chars: text.length });
  } catch (e) {
    const status = /Formato|disfarçado|inválido/i.test(e.message) ? 422 : 500;
    res.status(status).json({ error: e.message });
  }
});

app.post('/api/ingest-doc', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  const { originalname, mimetype, buffer } = req.file;
  let text = '';
  try {
    const ext = validateUpload(req.file, ['pdf', 'docx', 'txt']);
    if (ext === 'pdf') {
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (ext === 'docx') {
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

    // Salva arquivo original para download posterior
    const safeName = safeUploadName(originalname);
    fs.writeFileSync(path.join(UPLOADS_DIR, safeName), buffer);

    const baseName = originalname.replace(/\.[^.]+$/, '');
    const chunks   = chunkText(text);
    const notes    = chunks.map((c, i) => ({
      id:      `doc_${Date.now()}_${i}`,
      title:   `${baseName} (${i + 1}/${chunks.length})`,
      content: c,
      source:  originalname,
      file:    safeName,
      date:    new Date().toISOString()
    }));
    res.json({ ok: true, chunks: notes.length, notes });
  } catch (e) {
    const status = /Formato|disfarçado|inválido/i.test(e.message) ? 422 : 500;
    res.status(status).json({ error: e.message });
  }
});

// ── Download de arquivo original da base de conhecimento ─────────────────────
app.get('/api/download-doc/:filename', (req, res) => {
  const safeName = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = path.join(UPLOADS_DIR, safeName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Arquivo não encontrado.' });
  res.download(filePath, req.params.filename);
});

// ── Análise de planilha ────────────────────────────────────────────────────────
const buildRawSheetText = (buffer, filename) => {
  const xlsx = require('xlsx');
  const wb = xlsx.read(buffer, { type: 'buffer', cellDates: true });
  let out = '';
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (!rows.length) continue;
    out += `\nAba: ${sheetName}\n`;
    const maxCols = Math.max(...rows.map(r => r.length));
    // header separator
    const header = rows[0].map(c => String(c)).join(' | ');
    out += header + '\n' + '-'.repeat(Math.min(header.length, 120)) + '\n';
    for (let i = 1; i < Math.min(rows.length, 300); i++) {
      const row = rows[i];
      const cells = [];
      for (let j = 0; j < maxCols; j++) {
        let v = row[j] ?? '';
        if (v instanceof Date) v = v.toLocaleDateString('pt-BR');
        cells.push(String(v));
      }
      out += cells.join(' | ') + '\n';
    }
    if (rows.length > 300) out += `...(${rows.length - 300} linhas omitidas)\n`;
  }
  return out.substring(0, 14000);
};

app.post('/api/analyze-spreadsheet', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  const { originalname, buffer } = req.file;
  try {
    validateUpload(req.file, ['xlsx', 'xls', 'csv']);
    const result = analyzeSpreadsheet(buffer, originalname);
    if (!result.sheets.length) {
      return res.status(422).json({ error: 'Nenhuma aba com dados de valor/data foi detectada.' });
    }
    const rawText = buildRawSheetText(buffer, originalname);
    res.json({ ok: true, analysis: result, context: buildSheetContext(result), rawText });
  } catch (err) {
    console.error('[analyze-spreadsheet]', err);
    const status = /Formato|disfarçado|inválido/i.test(err.message) ? 422 : 500;
    res.status(status).json({ error: 'Erro ao processar planilha: ' + err.message });
  }
});

// ── Audit Log ─────────────────────────────────────────────────────────────────
app.post('/api/log', (req, res) => {
  const { question, response, source, tool, error, ms } = req.body || {};
  writeLog({
    question: String(question || '').substring(0, 500),
    response: String(response || '').substring(0, 1000),
    source:   source || 'unknown',
    tool:     tool   || null,
    error:    error  || null,
    ms:       ms     || 0,
  });
  res.json({ ok: true });
});

app.get('/api/logs', (req, res) => {
  const limit  = Math.min(Number(req.query.limit) || 500, 2000);
  const source = req.query.source || '';
  const q      = req.query.q      || '';
  res.json({ logs: readLogs({ limit, source, q }), stats: countBySource() });
});

app.delete('/api/logs', (req, res) => {
  clearLogs();
  res.json({ ok: true });
});

// ── Banco de Dados — consulta / stats ─────────────────────────────────────────
app.get('/api/db/stats', (req, res) => {
  try { res.json({ ok: true, stats: db.statsGeral() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/db/query', (req, res) => {
  const { tabela, filtro, limit = 20 } = req.body;
  try { res.json({ ok: true, rows: db.consultarBanco({ tabela, filtro, limit }) }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.patch('/api/db/leads/:id', (req, res) => {
  const { status, observacoes } = req.body;
  try {
    db.atualizarStatusLead(Number(req.params.id), status, observacoes);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/leads/export', (req, res) => {
  try {
    const { status, prioridade, segmento } = req.query;
    const leads = db.listarLeads({ status, prioridade, segmento, limit: 500 });
    if (!leads.length) return res.status(404).json({ error: 'Nenhum lead encontrado com esses filtros.' });

    const XLSX = require('xlsx');
    const headers = ['Empresa', 'Segmento', 'Cidade', 'Telefone', 'Email', 'Site', 'WhatsApp', 'Prioridade', 'Status', 'Serviço', 'Observações', 'Criado em'];
    const rows = leads.map(l => [
      l.nome, l.segmento || '', l.cidade || '', l.telefone || '', l.email || '',
      l.site || '', l.whatsapp || '', l.prioridade || '', l.status || '',
      l.servico || '', l.observacoes || '',
      l.criado_em ? l.criado_em.substring(0, 10) : '',
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [30,20,20,18,30,30,30,12,14,20,30,12].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="leads_scapini_${new Date().toISOString().slice(0,10)}.xlsx"`);
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── KB: auto-categorizar notas ───────────────────────────────────────────────
const KB_CATEGORIES = {
  'TI':         ['cgi','sistema','instalação','configurar','software','servidor','fre','mdfe','sefaz','xml','schema','atslog','enterprise','rastreamento','apollo','it.ti','network','windows','suporte'],
  'Operação':   ['manifesto','embarque','cte','carga','rota','it.ope','atf','entrega','coleta','romaneio','motorista','frota','viagem','ocorrencia'],
  'Financeiro': ['nota fiscal','financeiro','pagamento','conta','fatura','boleto','remessa','cobrança','duplic','vencimento','titulo','contas','nf ','nfe'],
  'Manutenção': ['veículo','manutenção','pneu','motor','oficina','preventiva','caminhão','semirreboque','mecânico','lubrif','correti'],
  'RH':         ['colaborador','contrato','recursos humanos','admissão','demissão','folha','funcionário','férias','ponto','\brh\b','treinamento','beneficio'],
  'Diretoria':  ['estratégia','diretoria','gestão','meta','kpi','indicador','gerencial','diretor','reunião diretoria'],
};

function detectCategory(note) {
  const hay = ((note.title || '') + ' ' + (note.content || '') + ' ' + (note.tags || []).join(' ')).toLowerCase();
  let best = { cat: 'Geral', score: 0 };
  for (const [cat, kws] of Object.entries(KB_CATEGORIES)) {
    const score = kws.reduce((s, kw) => s + (hay.includes(kw) ? 1 : 0), 0);
    if (score > best.score) best = { cat, score };
  }
  return best.cat;
}

app.post('/api/notes/categorize', (req, res) => {
  try {
    const notesFile = path.join(__dirname, 'notes.json');
    const notes     = readJSON(notesFile, []);
    let   updated   = 0;
    for (const n of notes) {
      const cat = detectCategory(n);
      if (n.category !== cat) { n.category = cat; updated++; }
    }
    writeJSON(notesFile, notes);
    res.json({ ok: true, total: notes.length, updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Dados persistentes (tarefas, hábitos, finanças, notas) ───────────────────
const DATA_STORES = ['tasks', 'habits', 'finances', 'notes'];
const dataFile = (store) => path.join(__dirname, `${store}.json`);

DATA_STORES.forEach(store => {
  app.get(`/api/data/${store}`, (_, res) => {
    const raw = readJSON(dataFile(store), []);
    res.json(Array.isArray(raw) ? raw : []);
  });
  app.post(`/api/data/${store}`, (req, res) => {
    const data = Array.isArray(req.body) ? req.body : (req.body?.data ?? req.body);
    writeJSON(dataFile(store), data);
    syncStoreToObsidian(store, data).catch(() => {});
    if (store === 'notes') setTimeout(triggerReindex, 2000);
    res.json({ ok: true });
  });
});

// ── Obsidian Sync ─────────────────────────────────────────────────────────────
const VAULT_PATH = path.join(os.homedir(), 'Documents', 'Lumina Vault');

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
tags: [lumina,tarefa, ${tag}]
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
tags: [lumina,index]
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
tags: [lumina,habito]
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
tags: [lumina,index]
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
tags: [lumina,financas]
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
tags: [lumina,conhecimento]
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
tags: [lumina,index]
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
tags: [lumina,memoria, perfil]
updated: ${now()}
sessions: ${mem.sessions || 0}
---
# Perfil — ${mem.userName || 'Usuário'}

← [[Cérebro]]

**Nome:** ${mem.userName || 'desconhecido'}
**Sessões:** ${mem.sessions || 0}
**Último acesso:** ${mem.lastSeen || now()}

## O que a Lúmina sabe sobre você
${fatos}

## Conversas recentes
→ [[Conversas/Conversas]]
`);

  const hist = (mem.history || []).slice(-20);
  const dateSlug = now();
  if (hist.length) {
    const linhas = hist.map(h =>
      `**${h.role === 'user' ? '🧑 Você' : '🤖 Lúmina'}:** ${String(h.content).substring(0, 200)}`
    ).join('\n\n');
    writeVault(`Conversas/${dateSlug}.md`,
`---
tags: [lumina,conversa]
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
tags: [lumina,index]
---
# Conversas

← [[Cérebro]] | [[Memória/Perfil]]

${files.map(f => `- [[Conversas/${f.replace('.md', '')}]]`).join('\n') || '- nenhuma ainda'}
`);
    }
  } catch {}

  // Nó central — Cérebro da Lúmina
  writeVault('Cérebro.md',
`---
tags: [lumina,cerebro, hub]
updated: ${now()}
---
# 🧠 Cérebro da Lúmina

> Mapa central de tudo que a Lúmina conhece e registra.

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
  const body = { ...req.body };
  // Garante que facts seja sempre array
  if ('facts' in body && !Array.isArray(body.facts)) delete body.facts;
  const updated = { ...m, ...body };
  if (!Array.isArray(updated.facts)) updated.facts = [];
  saveMem(updated);
  syncMemoryToObsidian(updated);
  res.json({ ok: true });
});

// ── Import de vault Obsidian externo → Base de Conhecimento da Lúmina ───────────
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
    // Remove notas de vault anterior (id começa com vault_) e evita títulos duplicados
    const merged    = [...notes, ...existing.filter(n => !n.id?.startsWith('vault_') && !notes.some(nn => nn.title === n.title))];
    writeJSON(dataFile('notes'), merged);
    syncStoreToObsidian('notes', merged).catch(() => {});
    setTimeout(triggerReindex, 3000);

    res.json({ ok: true, imported: notes.length, skipped, total: merged.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── RAG: Embeddings Vetoriais ─────────────────────────────────────────────────
const EMBED_FILE = path.join(__dirname, 'embeddings.json');

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
    saveEmbed(embed);
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
  fetch(`http://${HOST}:${PORT}/api/index-notes`, {
    method: 'POST',
    headers: { 'X-Lumina-Token': getLocalApiToken() },
  }).catch(() => {});
};

// ── Windows Notifications ─────────────────────────────────────────────────────
app.post('/api/notify', (req, res) => {
  const { title = 'Lúmina', message = '', sound = true } = req.body;
  notifier.notify({ title, message, sound, icon: path.join(__dirname, 'public', 'icon.png'), wait: false });
  res.json({ ok: true });
});

// ── Lembretes agendados (timer server-side → SSE + toast) ─────────────────────
app.post('/api/remind', (req, res) => {
  const { message = '', delayMs = 60000 } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  const capped = Math.min(Math.max(delayMs, 5000), 24 * 60 * 60 * 1000); // 5s a 24h
  setTimeout(() => {
    pushEvent('reminder', message, 'reminder');
  }, capped);
  res.json({ ok: true, firesIn: capped });
});

// ── Browser Automation (Puppeteer) ───────────────────────────────────────────
let browserInstance = null;

const getBrowser = async () => {
  if (!puppeteer) puppeteer = require('puppeteer');
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

    } else if (action === 'screenshot') {
      const domain    = new URL(url).hostname.replace(/^www\./, '').replace(/\./g, '_');
      const stamp     = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
      const fileName  = `lumina_${stamp}_${domain}.png`;
      const filePath  = path.join(LUMINA_PRINTS_DIR, fileName);
      await page.setViewport({ width: 1280, height: 800 });
      await page.screenshot({ path: filePath, fullPage: false });
      res.json({ ok: true, title, filePath, fileName });

    } else if (action === 'recordStart') {
      if (activeRecording.recorder) return res.status(409).json({ error: 'Gravação já em andamento. Diga "Lúmina, para de gravar" primeiro.' });
      const domain   = new URL(url).hostname.replace(/^www\./, '').replace(/\./g, '_');
      const stamp    = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
      const fileName = `lumina_${stamp}_${domain}.webm`;
      const filePath = path.join(LUMINA_GRAVACOES_DIR, fileName);
      await page.setViewport({ width: 1280, height: 800 });
      const recorder = await page.screencast({ path: filePath });
      activeRecording = { page, recorder, filePath };
      page = null; // impede fechamento no finally
      res.json({ ok: true, title, filePath, fileName });

    } else if (action === 'recordStop') {
      if (!activeRecording.recorder) return res.status(409).json({ error: 'Nenhuma gravação em andamento.' });
      await activeRecording.recorder.stop();
      const { filePath } = activeRecording;
      await activeRecording.page.close().catch(() => {});
      activeRecording = { page: null, recorder: null, filePath: null };
      res.json({ ok: true, filePath });

    } else {
      res.status(400).json({ error: 'action deve ser navigate, extract, fill, screenshot, recordStart ou recordStop' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    if (page) await page.close().catch(() => {});
  }
});

// ── Estimativa de Frete ───────────────────────────────────────────────────────
const FRETE_DEFAULTS = {
  rendimento_km_l:      3.0,   // km por litro (caminhão carregado)
  preco_diesel:         6.50,  // R$/litro
  pedagio_por_km:       0.22,  // R$/km (média Brasil rodovias federais)
  custo_fixo_km:        0.85,  // R$/km (depreciação, seguro, manutenção)
  custo_motorista_dia:  350,   // R$/dia (diária + encargos)
  velocidade_media_kmh: 70,    // km/h (média com paradas)
  margem_pct:           28,    // % de margem sobre custo
  fator_rota:           1.12,  // correção OSRM vs distância real BR (~12%)
};

const ESTADOS_BR = {
  AC:'Acre', AL:'Alagoas', AP:'Amapá', AM:'Amazonas', BA:'Bahia', CE:'Ceará',
  DF:'Distrito Federal', ES:'Espírito Santo', GO:'Goiás', MA:'Maranhão',
  MT:'Mato Grosso', MS:'Mato Grosso do Sul', MG:'Minas Gerais', PA:'Pará',
  PB:'Paraíba', PR:'Paraná', PE:'Pernambuco', PI:'Piauí', RJ:'Rio de Janeiro',
  RN:'Rio Grande do Norte', RS:'Rio Grande do Sul', RO:'Rondônia', RR:'Roraima',
  SC:'Santa Catarina', SP:'São Paulo', SE:'Sergipe', TO:'Tocantins',
};

async function geocode(local) {
  // "Lajeado/RS" ou "Lajeado RS" → "Lajeado, Rio Grande do Sul"
  const normalized = local.replace(/\//g, ' ').trim()
    .replace(/\b([A-Z]{2})\b/, (_, uf) => ESTADOS_BR[uf] ? ', ' + ESTADOS_BR[uf] : '');

  const queries = [normalized, local.replace(/\//g, ' ').trim() + ', Brasil'];
  for (const query of queries) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
    const r = await fetch(url, { headers: { 'User-Agent': 'LuminaScapini/1.0' }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) continue;
    const d = await r.json();
    if (!d.length) continue;
    // Prefere relation/boundary (município) depois administrative, depois qualquer
    const best = d.find(x => x.osm_type === 'R' && x.class === 'boundary')
               || d.find(x => x.class === 'boundary' || x.type === 'administrative')
               || d[0];
    const nome = best.display_name.split(',').slice(0, 2).join(',').trim();
    return { lat: parseFloat(best.lat), lon: parseFloat(best.lon), nome };
  }
  throw new Error(`Local não encontrado: ${local}`);
}

async function calcRoute(lat1, lon1, lat2, lon2) {
  const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
  const r = await fetch(url, { headers: { 'User-Agent': 'LuminaScapini/1.0' }, signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`OSRM HTTP ${r.status}`);
  const d = await r.json();
  if (d.code !== 'Ok' || !d.routes.length) throw new Error('Rota não encontrada');
  return {
    distancia_km: Math.round(d.routes[0].distance / 1000),
    duracao_h:    Math.round(d.routes[0].duration / 3600 * 10) / 10,
  };
}

app.post('/api/frete-estimate', async (req, res) => {
  const { origem, destino, peso_kg = 0, tipo_carga = 'seco' } = req.body;
  if (!origem || !destino) return res.status(400).json({ error: 'origem e destino são obrigatórios' });

  const c = getCfg();
  const p = { ...FRETE_DEFAULTS, ...(c.frete_params || {}) };

  try {
    // Geocoding + rota
    const [geo1, geo2] = await Promise.all([geocode(origem), geocode(destino)]);
    const rota = await calcRoute(geo1.lat, geo1.lon, geo2.lat, geo2.lon);
    const km = Math.round(rota.distancia_km * p.fator_rota);

    // Fator de peso (>20t aumenta consumo em até 15%)
    const fatorPeso = peso_kg > 20000 ? 1.15 : peso_kg > 10000 ? 1.07 : 1.0;
    // Fator tipo de carga (refrigerado +20%)
    const fatorTipo = /refrig|frigor|temp.*contro/i.test(tipo_carga) ? 1.20 : 1.0;

    const consumo_l      = (km / p.rendimento_km_l) * fatorPeso * fatorTipo;
    const custo_combust  = consumo_l * p.preco_diesel;
    const custo_pedagio  = km * p.pedagio_por_km;
    const dias_viagem    = Math.ceil(km / (p.velocidade_media_kmh * 10)); // ~10h dirigindo/dia
    const custo_motorist = dias_viagem * p.custo_motorista_dia;
    const custo_fixo     = km * p.custo_fixo_km;
    const custo_total    = custo_combust + custo_pedagio + custo_motorist + custo_fixo;
    const preco_final    = custo_total * (1 + p.margem_pct / 100);
    const custo_ton      = peso_kg > 0 ? preco_final / (peso_kg / 1000) : null;

    const brl = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    res.json({
      ok: true,
      origem: geo1.nome.split(',').slice(0, 2).join(',').trim(),
      destino: geo2.nome.split(',').slice(0, 2).join(',').trim(),
      distancia_km: km,
      duracao_estimada_h: rota.duracao_h,
      dias_viagem,
      peso_kg,
      tipo_carga,
      breakdown: {
        combustivel:  brl(custo_combust),
        pedagio:      brl(custo_pedagio),
        motorista:    brl(custo_motorist),
        custos_fixos: brl(custo_fixo),
        custo_total:  brl(custo_total),
        margem:       `${p.margem_pct}%`,
      },
      preco_final:     brl(preco_final),
      preco_final_num: Math.round(preco_final),
      custo_por_ton:   custo_ton ? brl(custo_ton) : null,
      params_usados:   p,
    });

    // Salva cotação no banco
    try {
      db.inserirCotacao({
        origem: geo1.nome, destino: geo2.nome,
        distancia_km: km, duracao_h: rota.duracao_h, dias_viagem,
        peso_kg, tipo_carga,
        custo_combustivel: Math.round(custo_combust * 100) / 100,
        custo_pedagio:     Math.round(custo_pedagio * 100) / 100,
        custo_motorista:   Math.round(custo_motorist * 100) / 100,
        custo_fixo:        Math.round(custo_fixo * 100) / 100,
        custo_total:       Math.round(custo_total * 100) / 100,
        margem_pct:        p.margem_pct,
        preco_final:       Math.round(preco_final * 100) / 100,
        cliente_nome:      null,
      });
    } catch (dbErr) { console.warn('[frete-estimate] db insert:', dbErr.message); }
  } catch (e) {
    console.error('[frete-estimate]', e);
    res.status(500).json({ error: e.message });
  }
});

// ── Prospecção de Clientes ────────────────────────────────────────────────────
app.post('/api/prospect', async (req, res) => {
  const c = getCfg();
  if (!c.geminiKey) return res.status(400).json({ error: 'no_key' });

  const { segmento: _seg = '', regiao = 'Vale do Taquari/RS', quantidade = 5, para = 'Scapini Transportes' } = req.body;
  const segmento = _seg || 'indústria e logística';

  const qtd = Math.min(Math.max(1, Number(quantidade) || 5), 15);

  // Phase 1: Puppeteer → Google Maps para dados reais de contato
  let scrapedText = '';
  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setDefaultNavigationTimeout(15000);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9' });

    const q = encodeURIComponent(`${segmento} ${regiao}`);
    await page.goto(`https://www.google.com/maps/search/${q}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2500));

    scrapedText = await page.evaluate(() => {
      for (const sel of ['[role="feed"]', 'div[aria-label*="Resultados"]', 'div[aria-label*="Results"]', '#searchresultbox']) {
        const el = document.querySelector(sel);
        if (el && el.innerText.length > 100) return el.innerText.substring(0, 6000);
      }
      return document.body.innerText.substring(0, 6000);
    });
  } catch (e) {
    console.warn('[prospect] Maps scrape failed:', e.message);
  } finally {
    if (page) await page.close().catch(() => {});
  }

  // Phase 2: Prompt adaptado ao contexto
  const isScapini = /scapini/i.test(para);
  const paraInfo = isScapini
    ? `A empresa que está prospectando é a **Scapini Transportes** — transportadora com sede em Lajeado/RS, especializada em transporte rodoviário de cargas, logística e distribuição no sul do Brasil.`
    : `A empresa que está prospectando é **${para}**, localizada em Lajeado/RS, buscando novos clientes no segmento "${segmento}".`;

  const scrapedSection = scrapedText.length > 100
    ? `\n\nDADOS REAIS COLETADOS (Google Maps — priorize nomes, telefones e sites encontrados aqui):\n---\n${scrapedText.substring(0, 5000)}\n---`
    : '';

  const prompt = `Você é especialista em prospecção B2B no Brasil.

${paraInfo}${scrapedSection}

REGRAS IMPORTANTES:
- Retorne APENAS EMPRESAS com CNPJ (pessoas jurídicas), NUNCA pessoas físicas ou perfis de consumidores
- Os clientes devem ser empresas que realmente precisariam dos serviços de ${para}
- Use nomes de empresas reais e conhecidas quando possível (ex: redes de supermercados, indústrias, distribuidoras, construtoras, cooperativas, frigoríficos, transportadoras concorrentes menores, atacadistas, etc.)
- Se tiver dados do Google Maps acima, priorize as empresas encontradas lá

Gere uma lista de **${qtd} empresas** do segmento **"${segmento}"** na região **"${regiao}"** que poderiam ser clientes de ${para}.

Para cada empresa, retorne um objeto JSON com exatamente estes campos:
- "nome": nome da empresa (real e conhecida se possível, senão realista para o setor)
- "segmento": nicho específico (ex: "Supermercado", "Frigorífico", "Distribuidora de bebidas")
- "cidade": cidade onde provavelmente está localizada
- "telefone": telefone se encontrado nos dados do Google Maps, senão ""
- "site": site se encontrado nos dados, senão ""
- "email": email de contato se encontrado, senão ""
- "dor": principal dor logística/operacional que provavelmente tem (específica e realista para o setor)
- "servico": qual serviço específico de ${para} seria ideal para essa empresa
- "prioridade": "alta", "media" ou "baixa" (baseado no volume estimado de carga/demanda)
- "email_assunto": assunto para email frio (curto, direto, personalizado para a empresa)
- "email_corpo": email completo de prospecção (3 parágrafos: dor específica do setor → como ${para} resolve → CTA com contato. Tom profissional, sem jargões. Assine como ${para}.)
- "whatsapp": mensagem curta para WhatsApp (2-3 linhas, direta, com CTA)

Retorne APENAS um array JSON válido. Sem markdown, sem explicações, sem \`\`\`.`;

  // Phase 3: Gemini com fallback automático para Ollama
  const callGemini = async () => {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${c.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 4000, temperature: 0.7, responseMimeType: 'application/json' },
          thinkingConfig: { thinkingBudget: 0 }
        }),
        signal: AbortSignal.timeout(45000)
      }
    );
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error?.message || `Gemini HTTP ${r.status}`); }
    const d = await r.json();
    const txt = d.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!txt) throw new Error('Resposta vazia do Gemini');
    return txt;
  };

  const callOllama = async () => {
    const r = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: c.ollamaModel || 'llama3.2', prompt, stream: false }),
      signal: AbortSignal.timeout(60000)
    });
    if (!r.ok) throw new Error(`Ollama HTTP ${r.status}`);
    const d = await r.json();
    return d.response || '';
  };

  try {
    let raw, source = 'gemini';
    try {
      raw = await callGemini();
    } catch (ge) {
      console.warn('[prospect] Gemini falhou, usando Ollama:', ge.message);
      source = 'ollama';
      raw = await callOllama();
    }

    const cleaned = raw.replace(/```json|```/g, '').trim();
    const start = cleaned.indexOf('[');
    const end   = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1) throw new Error('Resposta não contém array JSON válido');
    const jsonStr = cleaned.slice(start, end + 1)
      .replace(/,\s*([}\]])/g, '$1')          // trailing commas
      .replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":')  // chaves com aspas simples
      .replace(/:\s*'([^']*)'/g, ': "$1"');   // valores com aspas simples
    const list = JSON.parse(jsonStr);

    // Salva cada lead no banco (evita duplicatas por nome+segmento+cidade)
    for (const c of list) {
      try {
        const existe = db.getDb().prepare(
          'SELECT id FROM leads WHERE nome = ? AND segmento = ? AND para = ?'
        ).get(c.nome || '', c.segmento || '', para);
        if (!existe) {
          db.inserirLead({
            nome: c.nome || '', segmento: c.segmento || '', cidade: c.cidade || '',
            telefone: c.telefone || '', email: c.email || '', site: c.site || '',
            dor: c.dor || '', servico: c.servico || '', prioridade: c.prioridade || 'media',
            email_assunto: c.email_assunto || '', email_corpo: c.email_corpo || '',
            whatsapp: c.whatsapp || '', para,
          });
        }
      } catch (dbErr) { console.warn('[prospect] db insert:', dbErr.message); }
    }

    res.json({ ok: true, segmento, regiao, para, total: list.length, clientes: list, source, temDadosReais: scrapedText.length > 100 });
  } catch (e) {
    console.error('[prospect]', e);
    const isTimeout = /timeout|abort/i.test(e.message);
    res.status(isTimeout ? 504 : 500).json({
      error: isTimeout
        ? 'A busca demorou demais. Tente com menos empresas ou um segmento mais específico.'
        : e.message
    });
  }
});

// ── Captação de Candidatos / RH ──────────────────────────────────────────────
app.post('/api/prospect-candidatos', async (req, res) => {
  const c = getCfg();
  if (!c.geminiKey) return res.status(400).json({ error: 'no_key' });

  const { cargo: _cargo = '', regiao = 'Vale do Taquari/RS', quantidade = 5, para = 'Scapini Transportes' } = req.body;
  const cargo = _cargo || 'motorista';
  const qtd = Math.min(Math.max(1, Number(quantidade) || 5), 10);

  const prompt = `Você é especialista em recrutamento e seleção no Brasil.

A empresa contratante é **${para}**, localizada em Lajeado/RS, buscando **${qtd} candidatos** para a vaga de **${cargo}** na região **${regiao}**.

Gere uma lista de **${qtd} candidatos fictícios mas realistas** para a vaga de "${cargo}" nessa região.

Para cada candidato, retorne um objeto JSON com exatamente estes campos:
- "nome": nome completo brasileiro (fictício mas realista)
- "cargo_atual": cargo ou função atual do candidato
- "experiencia_anos": número inteiro de anos de experiência na área
- "cidade": cidade onde mora (na região ${regiao})
- "telefone": telefone celular brasileiro fictício (ex: "(51) 9 9999-9999")
- "email": email fictício mas realista (ex: joao.silva@gmail.com)
- "linkedin": perfil LinkedIn fictício (ex: "linkedin.com/in/joao-silva-motorista")
- "pontos_fortes": 2-3 pontos fortes relevantes para a vaga (string curta)
- "fit_score": número inteiro de 1 a 10 indicando o fit estimado para a vaga
- "mensagem_contato": mensagem curta e direta para primeiro contato via WhatsApp (2-3 linhas, personalizada para o cargo)

Retorne APENAS um array JSON válido. Sem markdown, sem explicações, sem \`\`\`.`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${c.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 3000, temperature: 0.7, responseMimeType: 'application/json' },
          thinkingConfig: { thinkingBudget: 0 }
        }),
        signal: AbortSignal.timeout(45000)
      }
    );
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error?.message || `Gemini HTTP ${r.status}`); }
    const d = await r.json();
    const raw = d.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!raw) throw new Error('Resposta vazia do Gemini');

    const cleaned = raw.replace(/```json|```/g, '').trim();
    const start = cleaned.indexOf('[');
    const end   = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1) throw new Error('Resposta não contém array JSON válido');
    const jsonStr = cleaned.slice(start, end + 1)
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":')
      .replace(/:\s*'([^']*)'/g, ': "$1"');
    const list = JSON.parse(jsonStr);

    // Salvar no banco na tabela contatos se existir
    try {
      const tbl = db.getDb().prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='contatos'").get();
      if (tbl) {
        for (const cand of list) {
          try {
            const existe = db.getDb().prepare('SELECT id FROM contatos WHERE nome = ? AND cargo = ?').get(cand.nome || '', cargo);
            if (!existe) {
              db.getDb().prepare(
                'INSERT INTO contatos (nome, cargo, cidade, telefone, email, linkedin, pontos_fortes, fit_score, mensagem_contato, para) VALUES (?,?,?,?,?,?,?,?,?,?)'
              ).run(cand.nome||'', cargo, cand.cidade||'', cand.telefone||'', cand.email||'', cand.linkedin||'', cand.pontos_fortes||'', cand.fit_score||0, cand.mensagem_contato||'', para);
            }
          } catch (dbErr) { console.warn('[prospect-candidatos] db insert:', dbErr.message); }
        }
      }
    } catch (dbCheckErr) { /* tabela não existe, ignora */ }

    res.json({ ok: true, cargo, regiao, para, total: list.length, candidatos: list, source: 'gemini' });
  } catch (e) {
    console.error('[prospect-candidatos]', e);
    const isTimeout = /timeout|abort/i.test(e.message);
    res.status(isTimeout ? 504 : 500).json({
      error: isTimeout
        ? 'A busca demorou demais. Tente com menos candidatos ou um cargo mais específico.'
        : e.message
    });
  }
});

// ── Auditoria Contábil ────────────────────────────────────────────────────────
app.post('/api/auditoria-contabil', async (req, res) => {
  const c = getCfg();
  if (!c.geminiKey) return res.status(400).json({ error: 'no_key' });
  const { context, rawText } = req.body;
  if (!context && !rawText) return res.status(400).json({ error: 'context obrigatório' });

  const dadosPlanilha = rawText
    ? `DADOS COMPLETOS DA PLANILHA (todas as colunas):\n${rawText.substring(0, 12000)}\n\nRESUMO ESTRUTURADO:\n${context.substring(0, 3000)}`
    : `DADOS DA PLANILHA:\n${context.substring(0, 12000)}`;

  const prompt = `Você é um auditor contábil sênior especializado em empresas de transporte rodoviário de cargas. Analise criticamente os dados financeiros abaixo e faça uma auditoria detalhada.

${dadosPlanilha}

Estruture sua resposta EXATAMENTE assim:

## 📊 CONSOLIDADO REAL
Liste os totais reais encontrados na planilha: receitas, despesas por categoria, impostos, resultado líquido. Use R$ com formatação brasileira.

## ⚠️ PONTOS DE ATENÇÃO
Para cada inconsistência ou suspeita, use o formato:
🔴 [CRÍTICO] — descrição do problema, onde está e por que é suspeito
🟡 [ATENÇÃO] — descrição do ponto que merece verificação
🟢 [OK] — confirmações positivas (se houver)

Verifique especialmente:
- Valores redondos excessivos (ex: R$ 10.000,00 exatos) podem indicar estimativa em vez de lançamento real
- Duplicidade de lançamentos (mesma data, mesmo valor)
- Categorias vagas com valores altos ("diversos", "outros", "serviços gerais")
- Variações mensais acima de 30% sem justificativa óbvia
- Impostos com percentual atípico para o setor (transporte: Simples ~6%, Lucro Presumido ~11-13%)
- Despesas sem descrição ou com descrição genérica
- Receita declarada muito abaixo do volume operacional esperado

## ❓ PERGUNTAS PARA O CONTADOR
Liste de 5 a 10 perguntas diretas e objetivas para questionar o contador. Numere cada uma. Seja específico — cite valores e datas encontrados na planilha.

## ✅ RESUMO EXECUTIVO
Em 3 linhas: situação geral da contabilidade, nível de confiança nos dados (baixo/médio/alto) e recomendação principal.

Se os dados forem insuficientes para alguma análise, aponte o que está faltando na planilha.`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${c.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.25 }
        })
      }
    );
    if (!r.ok) throw new Error(`Gemini ${r.status}`);
    const d = await r.json();
    res.json({ ok: true, audit: d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Month-End Closer ─────────────────────────────────────────────────────────
app.post('/api/fechamento-mensal', async (req, res) => {
  const c = getCfg();
  if (!c.geminiKey) return res.status(400).json({ error: 'no_key' });
  const { context, rawText, mesAtual, mesAnterior } = req.body;
  if (!context && !rawText) return res.status(400).json({ error: 'context obrigatório' });

  const dados = rawText
    ? `DADOS COMPLETOS:\n${rawText.substring(0, 12000)}\n\nRESUMO:\n${(context||'').substring(0, 3000)}`
    : `DADOS:\n${(context||'').substring(0, 12000)}`;

  const refMes = mesAtual ? `Mês de referência: ${mesAtual}` : '';
  const refAnt = mesAnterior ? `\nMês anterior para comparação: ${mesAnterior}` : '';

  const prompt = `Você é um especialista em fechamento contábil mensal de transportadoras rodoviárias. Analise os dados abaixo e faça o fechamento do mês.
${refMes}${refAnt}

${dados}

Estruture sua resposta EXATAMENTE assim:

## 📅 FECHAMENTO MENSAL

### Receitas do Mês
Liste todas as receitas encontradas com valores. Total geral.

### Despesas do Mês
Liste as despesas por categoria (combustível, manutenção, salários, pedágios, administrativo, outros). Total por categoria e total geral.

### Resultado
- Receita Total: R$ X
- Despesa Total: R$ X
- **Resultado Líquido: R$ X (margem X%)**

## 📈 VARIAÇÕES vs MÊS ANTERIOR
Para cada item com variação acima de 15%, analise:
🔴 [ALTA VARIAÇÃO] — item, variação em % e R$, possível causa
🟡 [VARIAÇÃO MODERADA] — item, variação em % e R$
🟢 [ESTÁVEL] — itens sem variação relevante

## 📋 ACCRUALS E PENDÊNCIAS
Aponte lançamentos que provavelmente deveriam existir mas não aparecem:
- Férias e 13º provisionados?
- Manutenções recorrentes lançadas?
- Impostos a pagar?

## ✅ PARECER DO FECHAMENTO
Em 2-3 linhas: o fechamento está completo? Há pendências críticas? Pode ser aprovado ou precisa de ajustes?`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${c.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.2 }
        })
      }
    );
    if (!r.ok) throw new Error(`Gemini ${r.status}`);
    const d = await r.json();
    res.json({ ok: true, fechamento: d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Statement Auditor ─────────────────────────────────────────────────────────
app.post('/api/conferir-demonstrativo', async (req, res) => {
  const c = getCfg();
  if (!c.geminiKey) return res.status(400).json({ error: 'no_key' });
  const { context, rawText, tipo } = req.body;
  if (!context && !rawText) return res.status(400).json({ error: 'context obrigatório' });

  const dados = rawText
    ? `DADOS COMPLETOS:\n${rawText.substring(0, 12000)}\n\nRESUMO:\n${(context||'').substring(0, 3000)}`
    : `DADOS:\n${(context||'').substring(0, 12000)}`;

  const tipoDoc = tipo || 'demonstrativo financeiro';

  const prompt = `Você é um auditor especializado em conferência de demonstrativos financeiros de transportadoras. Confira matematicamente e logicamente o ${tipoDoc} abaixo antes de aceitá-lo como correto.

${dados}

Estruture sua resposta EXATAMENTE assim:

## 🔍 CONFERÊNCIA MATEMÁTICA

### Soma das Linhas
Verifique se a soma das linhas bate com os totais declarados. Para cada discrepância:
❌ [DIVERGÊNCIA] — linha X: declarado R$ Y, calculado R$ Z, diferença R$ W
✅ [CONFERE] — total da seção X bate

### Equação Fundamental
- Balancete: Saldo Inicial + Débitos - Créditos = Saldo Final → confere?
- DRE: Receita - Despesas = Resultado → confere?
- Diferença encontrada: R$ X (se houver)

### Consistência entre Demonstrativos
Se houver mais de uma demonstração, cruzar os valores entre elas.

## 🚩 ALERTAS DE QUALIDADE

🔴 [ERRO MATEMÁTICO] — discrepâncias que não fecham
🟡 [SUSPEITO] — valores redondos demais, categorias vagas, lançamentos sem data
🟢 [OK] — seções que conferem corretamente

Verifique especialmente:
- Mais de 30% dos valores são números redondos (múltiplos de 1.000 ou 5.000)?
- Há categorias "Outros" ou "Diversos" com valores acima de 10% do total?
- Existe algum mês zerado ou com valor idêntico ao mês anterior?
- Há lançamentos duplicados (mesma data + mesmo valor)?

## ✅ PARECER FINAL
- **Integridade matemática:** [Aprovado / Reprovado / Aprovado com ressalvas]
- **Confiabilidade:** [Alta / Média / Baixa]
- **Recomendação:** aceitar, devolver para correção ou solicitar documentação de suporte?`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${c.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.15 }
        })
      }
    );
    if (!r.ok) throw new Error(`Gemini ${r.status}`);
    const d = await r.json();
    res.json({ ok: true, conferencia: d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Dev Mode — Agente de Desenvolvimento ─────────────────────────────────────
const BLOCKED_CMDS = /rm\s+-rf\s+\/|format\s+[a-z]:|del\s+\/[sq]/i;
const DEV_SEARCH_SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.codex', '.agents', '.claude']);

const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function collectSearchFiles(root, fileGlob, out = []) {
  if (out.length >= 1000) return out;
  const suffix = String(fileGlob || '**/*').replace(/^\*\*\//, '').startsWith('*.')
    ? String(fileGlob).replace(/^\*\*\//, '').slice(1)
    : '';

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (out.length >= 1000) break;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (!DEV_SEARCH_SKIP_DIRS.has(entry.name)) collectSearchFiles(full, fileGlob, out);
    } else if (!suffix || entry.name.endsWith(suffix)) {
      out.push(full);
    }
  }
  return out;
}

function searchFiles({ pattern, dir, glob, caseSensitive }) {
  if (String(pattern).length > 200) throw new Error('pattern muito grande');
  const root = resolveWorkspacePath(dir || '.');
  const flags = caseSensitive ? '' : 'i';
  let re;
  try { re = new RegExp(pattern, flags); }
  catch { re = new RegExp(escapeRegExp(pattern), flags); }

  const matches = [];
  for (const file of collectSearchFiles(root, glob || '**/*')) {
    if (matches.length >= 200) break;
    let content = '';
    try { content = fs.readFileSync(file, 'utf8'); } catch { continue; }
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length && matches.length < 200; i++) {
      if (re.test(lines[i])) {
        matches.push(`${path.relative(WORKSPACE_ROOT, file) || path.basename(file)}:${i + 1}: ${lines[i].trim().substring(0, 500)}`);
      }
      re.lastIndex = 0;
    }
  }
  return matches;
}

app.post('/api/dev/grep', (req, res) => {
  const { pattern, dir = '.', glob: fileGlob = '**/*', caseSensitive = false } = req.body;
  if (!pattern) return res.status(400).json({ error: 'pattern required' });
  try {
    const matches = searchFiles({ pattern, dir, glob: fileGlob, caseSensitive });
    res.json({ ok: true, pattern, matches, count: matches.length });
  } catch (e) {
    const status = /Formato|disfarçado|inválido/i.test(e.message) ? 422 : 500;
    res.status(status).json({ error: e.message });
  }
});

app.post('/api/dev/read', (req, res) => {
  const { path: filePath, offset = 0, limit = 300 } = req.body;
  if (!filePath) return res.status(400).json({ error: 'path required' });
  try {
    const safePath = resolveWorkspacePath(filePath);
    const content = fs.readFileSync(safePath, 'utf8');
    const lines   = content.split('\n');
    const slice   = lines.slice(offset, offset + limit);
    res.json({ ok: true, path: safePath, content: slice.join('\n'), totalLines: lines.length, offset, returned: slice.length });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

app.post('/api/dev/write', (req, res) => {
  const { path: filePath, content = '' } = req.body;
  if (!filePath) return res.status(400).json({ error: 'path required' });
  if (!ensureDevToolsEnabled(res)) return;
  try {
    const safePath = resolveWorkspacePath(filePath);
    fs.mkdirSync(path.dirname(safePath), { recursive: true });
    fs.writeFileSync(safePath, content, 'utf8');
    res.json({ ok: true, path: safePath, bytes: Buffer.byteLength(content, 'utf8') });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/dev/edit', (req, res) => {
  const { path: filePath, old_string, new_string } = req.body;
  if (!filePath || old_string == null || new_string == null) return res.status(400).json({ error: 'path, old_string e new_string são obrigatórios' });
  if (!ensureDevToolsEnabled(res)) return;
  try {
    const safePath = resolveWorkspacePath(filePath);
    const content = fs.readFileSync(safePath, 'utf8');
    const count   = (content.split(old_string).length - 1);
    if (!count) return res.status(400).json({ error: 'old_string não encontrado no arquivo' });
    if (count > 1) return res.status(400).json({ error: `old_string encontrado ${count}x — seja mais específico` });
    const updated = content.replace(old_string, new_string);
    fs.writeFileSync(safePath, updated, 'utf8');
    res.json({ ok: true, path: safePath });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/dev/ls', (req, res) => {
  const { path: dirPath = '.' } = req.body;
  try {
    const safePath = resolveWorkspacePath(dirPath);
    const entries = fs.readdirSync(safePath, { withFileTypes: true });
    const items   = entries.map(e => ({ name: e.name, type: e.isDirectory() ? 'dir' : 'file' }));
    res.json({ ok: true, path: safePath, items });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

app.post('/api/dev/exec', (req, res) => {
  const { command, cwd = process.cwd() } = req.body;
  if (!command) return res.status(400).json({ error: 'command required' });
  if (!ensureDevToolsEnabled(res)) return;
  if (String(command).length > 500) return res.status(400).json({ error: 'Comando muito grande' });
  if (BLOCKED_CMDS.test(command)) return res.status(403).json({ error: 'Comando bloqueado por segurança' });

  let safeCwd;
  try { safeCwd = resolveWorkspacePath(cwd); }
  catch (e) { return res.status(400).json({ error: e.message }); }

  exec(command, { cwd: safeCwd, timeout: 30000, maxBuffer: 1024 * 512, shell: 'powershell.exe' }, (err, stdout, stderr) => {
    const output = (stdout + (stderr ? '\n[stderr]\n' + stderr : '')).trim().substring(0, 6000);
    res.json({ ok: !err || !!stdout, exitCode: err?.code ?? 0, output, error: err && !stdout ? err.message : null });
  });
});

// ── Geração de Arquivos (Excel / Word / PowerPoint / PDF) ────────────────────
app.post('/api/generate-file', async (req, res) => {
  const c = getCfg();
  if (!c.geminiKey) return res.status(400).json({ error: 'no_key' });

  const { formato, titulo, instrucao } = req.body;
  if (!formato || !titulo || !instrucao) return res.status(400).json({ error: 'formato, titulo e instrucao são obrigatórios' });
  if (!['xlsx', 'docx', 'pptx', 'pdf'].includes(formato)) return res.status(400).json({ error: 'formato inválido' });

  // Step 1: Gemini gera o conteúdo estruturado
  const schemaByFormat = {
    xlsx: `{ "sheets": [ { "nome": "string", "headers": ["col1","col2",...], "rows": [["val1","val2",...], ...] } ] }`,
    docx: `{ "secoes": [ { "tipo": "h1"|"h2"|"h3"|"paragrafo"|"lista"|"tabela", "conteudo": "string ou array de strings ou {headers,rows}" } ] }`,
    pptx: `{ "slides": [ { "titulo": "string", "pontos": ["string",...], "nota": "string" } ] }`,
    pdf:  `{ "secoes": [ { "tipo": "titulo"|"subtitulo"|"paragrafo"|"lista", "conteudo": "string ou array de strings" } ] }`,
  };

  const structPrompt = `Você é um assistente que gera conteúdo estruturado para arquivos de escritório.

Título do arquivo: "${titulo}"
Formato: ${formato.toUpperCase()}
Instrução: ${instrucao}

Gere o conteúdo completo em português, estruturado no seguinte formato JSON:
${schemaByFormat[formato]}

Seja detalhado e profissional. Retorne APENAS o JSON válido, sem markdown, sem explicações.`;

  let estrutura;
  try {
    const gr = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${c.geminiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: structPrompt }] }], generationConfig: { maxOutputTokens: 4000, temperature: 0.4, responseMimeType: 'application/json' }, thinkingConfig: { thinkingBudget: 0 } }) }
    );
    if (!gr.ok) { const e = await gr.json().catch(() => ({})); throw new Error(e.error?.message || `Gemini HTTP ${gr.status}`); }
    const gd   = await gr.json();
    const rawText = gd.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!rawText) throw new Error('Resposta vazia do Gemini');
    const raw  = rawText.replace(/```json|```/g, '').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Gemini não retornou JSON válido');
    estrutura = JSON.parse(match[0]);
  } catch (e) {
    return res.status(500).json({ error: `Erro ao gerar conteúdo: ${e.message}` });
  }

  // Step 2: Gera o arquivo no formato solicitado
  try {
    let buffer, mime, ext;

    if (formato === 'xlsx') {
      const XLSX = require('xlsx');
      const wb = XLSX.utils.book_new();
      for (const sheet of (estrutura.sheets || [])) {
        const rows = [sheet.headers || [], ...(sheet.rows || [])];
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, (sheet.nome || 'Dados').substring(0, 31));
      }
      buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      ext  = 'xlsx';

    } else if (formato === 'docx') {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } = require('docx');
      const children = [];
      for (const s of (estrutura.secoes || [])) {
        if (s.tipo === 'h1') {
          children.push(new Paragraph({ text: s.conteudo, heading: HeadingLevel.HEADING_1 }));
        } else if (s.tipo === 'h2') {
          children.push(new Paragraph({ text: s.conteudo, heading: HeadingLevel.HEADING_2 }));
        } else if (s.tipo === 'h3') {
          children.push(new Paragraph({ text: s.conteudo, heading: HeadingLevel.HEADING_3 }));
        } else if (s.tipo === 'paragrafo') {
          children.push(new Paragraph({ children: [new TextRun(s.conteudo || '')] }));
        } else if (s.tipo === 'lista') {
          const items = Array.isArray(s.conteudo) ? s.conteudo : [s.conteudo];
          for (const item of items) children.push(new Paragraph({ text: `• ${item}`, indent: { left: 400 } }));
        } else if (s.tipo === 'tabela' && s.conteudo?.headers) {
          const allRows = [s.conteudo.headers, ...(s.conteudo.rows || [])];
          const tableRows = allRows.map((row, ri) =>
            new TableRow({ children: row.map(cell => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(cell || ''), bold: ri === 0 })] })] })) })
          );
          children.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
          children.push(new Paragraph(''));
        }
      }
      const doc = new Document({ sections: [{ children }] });
      buffer = await Packer.toBuffer(doc);
      mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      ext  = 'docx';

    } else if (formato === 'pptx') {
      const PptxGenJS = require('pptxgenjs');
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_WIDE';
      for (const slide of (estrutura.slides || [])) {
        const s = pptx.addSlide();
        s.addText(slide.titulo || '', { x: 0.5, y: 0.3, w: 9, h: 1.2, fontSize: 28, bold: true, color: '363636' });
        const pontos = (slide.pontos || []).map(p => ({ text: `• ${p}`, options: { fontSize: 16, bullet: false } }));
        if (pontos.length) s.addText(pontos, { x: 0.5, y: 1.7, w: 9, h: 4.5, fontSize: 16, color: '444444', valign: 'top' });
      }
      buffer = await pptx.write({ outputType: 'nodebuffer' });
      mime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      ext  = 'pptx';

    } else if (formato === 'pdf') {
      const PDFDocument = require('pdfkit');
      buffer = await new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        doc.on('data', c => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.registerFont('Helvetica', 'Helvetica');
        for (const s of (estrutura.secoes || [])) {
          if (s.tipo === 'titulo') {
            doc.fontSize(22).font('Helvetica-Bold').text(s.conteudo || '', { align: 'center' }).moveDown(0.5);
          } else if (s.tipo === 'subtitulo') {
            doc.fontSize(16).font('Helvetica-Bold').text(s.conteudo || '').moveDown(0.3);
          } else if (s.tipo === 'paragrafo') {
            doc.fontSize(12).font('Helvetica').text(s.conteudo || '').moveDown(0.5);
          } else if (s.tipo === 'lista') {
            const items = Array.isArray(s.conteudo) ? s.conteudo : [s.conteudo];
            doc.fontSize(12).font('Helvetica');
            for (const item of items) doc.text(`• ${item}`, { indent: 20 });
            doc.moveDown(0.3);
          }
        }
        doc.end();
      });
      mime = 'application/pdf';
      ext  = 'pdf';
    }

    const safeTitle = titulo.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_').substring(0, 50) || 'arquivo';
    const filename  = `${safeTitle}.${ext}`;

    res.json({ ok: true, filename, data: buffer.toString('base64'), mime });
  } catch (e) {
    console.error('[generate-file]', e);
    res.status(500).json({ error: e.message });
  }
});

// ── Relatório de KPIs — PDF institucional Scapini ────────────────────────────
app.post('/api/relatorio-kpi', async (req, res) => {
  const c = getCfg();
  if (!c.geminiKey) return res.status(400).json({ error: 'no_key' });

  const { periodo, areas, kpisExtra, sheetContext } = req.body;
  const areasAlvo = (areas && areas.length) ? areas : ['Operacional', 'Financeiro', 'Frota', 'RH'];

  const prompt = `Você é um analista sênior de transportadoras gerando um relatório executivo de KPIs para a Scapini Transportes.

Período: ${periodo}
Áreas solicitadas: ${areasAlvo.join(', ')}
${kpisExtra ? `Dados/KPIs adicionais mencionados: ${kpisExtra}` : ''}
${sheetContext ? `Dados da planilha carregada:\n${sheetContext.substring(0, 3000)}` : ''}

Gere um relatório executivo completo em JSON com a seguinte estrutura:
{
  "titulo": "Relatório de KPIs — Scapini Transportes",
  "periodo": "${periodo}",
  "secoes": [
    {
      "nome": "NomeÁrea",
      "kpis": [
        { "indicador": "Nome do KPI", "valor": "valor real ou referência", "meta": "meta ideal", "status": "ok|atencao|critico", "comentario": "1 linha de contexto" }
      ],
      "parecer": "2-3 linhas de análise executiva da área"
    }
  ],
  "conclusao": "Parágrafo executivo de 3-4 linhas com os pontos mais críticos e próximos passos."
}

Use KPIs reais do setor de transporte rodoviário brasileiro. Se não houver dados da planilha, use benchmarks do setor como referência. Retorne APENAS o JSON válido.`;

  let estrutura;
  try {
    const gr = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${c.geminiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 4000, temperature: 0.3, responseMimeType: 'application/json' }, thinkingConfig: { thinkingBudget: 0 } }) }
    );
    if (!gr.ok) throw new Error(`Gemini HTTP ${gr.status}`);
    const gd  = await gr.json();
    const rawText2 = gd.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!rawText2) throw new Error('Resposta vazia do Gemini');
    const raw = rawText2.replace(/```json|```/g, '').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON inválido');
    estrutura = JSON.parse(match[0]);
  } catch (e) {
    return res.status(500).json({ error: `Erro ao gerar conteúdo: ${e.message}` });
  }

  try {
    const PDFDocument = require('pdfkit');
    const buffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const AZUL   = '#1a3d6e';
      const CINZA  = '#5a5a5a';
      const VERDE  = '#1a7a3e';
      const AMARELO= '#b87a00';
      const VERMELHO='#8b1a1a';
      const LINHA  = '#d0d8e4';

      // ── Cabeçalho institucional ──
      doc.rect(0, 0, 595, 80).fill(AZUL);
      doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
         .text('SCAPINI TRANSPORTES', 50, 22, { align: 'left' });
      doc.fontSize(11).font('Helvetica')
         .text('Relatório Executivo de KPIs — ' + (estrutura.periodo || periodo), 50, 50, { align: 'left' });
      doc.fontSize(9).text('Gerado por Lúmina IA  •  ' + new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' }), 50, 65);

      doc.fillColor('#333').moveDown(3);

      // ── Seções por área ──
      for (const sec of (estrutura.secoes || [])) {
        // Verifica espaço para a seção (estimativa simples)
        if (doc.y > 680) doc.addPage();

        // Título da área
        doc.rect(50, doc.y, 495, 24).fill(AZUL);
        doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
           .text(sec.nome || '', 58, doc.y - 19);
        doc.moveDown(0.8);

        // Tabela de KPIs
        const colX = [50, 180, 290, 360, 430];
        const headers = ['Indicador', 'Valor', 'Meta', 'Status', 'Comentário'];
        // Header da tabela
        doc.fillColor(CINZA).fontSize(8.5).font('Helvetica-Bold');
        headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: colX[i+1] ? colX[i+1]-colX[i]-4 : 115, continued: i < 4 }));
        doc.moveDown(0.3);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(LINHA).stroke();
        doc.moveDown(0.2);

        for (const kpi of (sec.kpis || [])) {
          const statusColor = kpi.status === 'ok' ? VERDE : kpi.status === 'critico' ? VERMELHO : AMARELO;
          const statusLabel = kpi.status === 'ok' ? '● OK' : kpi.status === 'critico' ? '● Crítico' : '● Atenção';
          const rowY = doc.y;
          doc.fillColor('#222').fontSize(8).font('Helvetica')
             .text(kpi.indicador || '', colX[0], rowY, { width: 126 });
          doc.text(kpi.valor || '—', colX[1], rowY, { width: 106 });
          doc.text(kpi.meta || '—', colX[2], rowY, { width: 66 });
          doc.fillColor(statusColor).font('Helvetica-Bold')
             .text(statusLabel, colX[3], rowY, { width: 66 });
          doc.fillColor(CINZA).font('Helvetica').fontSize(7.5)
             .text(kpi.comentario || '', colX[4], rowY, { width: 115 });
          doc.moveDown(0.15);
          doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(LINHA).lineWidth(0.3).stroke();
          doc.moveDown(0.15);
        }

        // Parecer da área
        if (sec.parecer) {
          doc.moveDown(0.3);
          doc.fillColor(CINZA).fontSize(8).font('Helvetica-Bold').text('Análise: ', { continued: true });
          doc.font('Helvetica').fillColor('#333').text(sec.parecer);
        }
        doc.moveDown(1.2);
      }

      // ── Conclusão ──
      if (estrutura.conclusao) {
        if (doc.y > 680) doc.addPage();
        doc.rect(50, doc.y, 495, 20).fill('#eef2f8');
        doc.fillColor(AZUL).fontSize(11).font('Helvetica-Bold').text('Conclusão Executiva', 58, doc.y - 15);
        doc.moveDown(0.6);
        doc.fillColor('#222').fontSize(9.5).font('Helvetica').text(estrutura.conclusao, { width: 495 });
      }

      // ── Rodapé ──
      const pages = doc.bufferedPageRange ? doc.bufferedPageRange().count : 1;
      doc.rect(0, 800, 595, 42).fill(AZUL);
      doc.fillColor('white').fontSize(8).font('Helvetica')
         .text('Scapini Transportes  •  Confidencial  •  Gerado por Lúmina IA', 50, 812, { align: 'center', width: 495 });

      doc.end();
    });

    const safePeriodo = (periodo || 'relatorio').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const filename = `KPIs_Scapini_${safePeriodo}.pdf`;
    res.json({ ok: true, filename, data: buffer.toString('base64') });
  } catch (e) {
    console.error('[relatorio-kpi]', e);
    res.status(500).json({ error: e.message });
  }
});

// ── VS Code Integration ───────────────────────────────────────────────────────
app.post('/api/vscode', (req, res) => {
  const { file = '', line } = req.body;
  if (!file) return res.status(400).json({ error: 'file required' });
  let safeFile;
  try { safeFile = resolveWorkspacePath(file); }
  catch (e) { return res.status(400).json({ error: e.message }); }
  const safeLine = Number(line);
  const target = Number.isFinite(safeLine) && safeLine > 0 ? `${safeFile}:${Math.floor(safeLine)}` : safeFile;
  execFile('code', ['--goto', target], (err) => {
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

const RSS_TRANSPORTE = [
  { url: 'https://logweb.com.br/feed/',                      source: 'Logweb'   },
  { url: 'https://www.transportabrasil.com.br/feed/',        source: 'TransBR'  },
  { url: 'https://g1.globo.com/economia/rss/feed.xml',       source: 'G1 Econ'  },
];

app.get('/api/news/transporte', async (_, res) => {
  const headlines = [];
  const TRANSPORT_KW = /transporte|logística|logistica|frete|caminhão|caminhao|frota|rodovia|diesel|combustível|combustivel|antt|motorista|carga|br-|km \d|pedágio|pedagio|exportação|exportacao|agronegócio|agronegocio/i;
  for (const feed of [...RSS_TRANSPORTE, ...RSS_FEEDS]) {
    try {
      const r = await fetch(feed.url, { signal: AbortSignal.timeout(5000), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LuminaBot/1.0)' } });
      if (!r.ok) continue;
      const xml   = await r.text();
      const items = [...xml.matchAll(/<item[\s\S]*?<\/item>/g)].slice(0, 15);
      for (const m of items) {
        const titleMatch = m[0].match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
        const title = titleMatch ? titleMatch[1].trim() : null;
        if (title && TRANSPORT_KW.test(title)) headlines.push({ title, source: feed.source });
        if (headlines.length >= 8) break;
      }
      if (headlines.length >= 8) break;
    } catch { continue; }
  }
  if (!headlines.length) return res.status(503).json({ error: 'Sem notícias de transporte no momento.' });
  res.json({ headlines: headlines.slice(0, 8) });
});

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
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LuminaBot/1.0)' }
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

// ── Esportes — ESPN API (sem key) ────────────────────────────────────────────
const ESPN_LEAGUES = {
  copa:    'fifa.world',
  mundial: 'fifa.world',
  libertadores: 'conmebol.libertadores',
  brasileirao: 'bra.1',
  champions: 'uefa.champions',
  premier: 'eng.1',
  laliga: 'esp.1',
  nba: null, // tratado separado
};

const TEAM_PT = {
  'Brazil':'Brasil','Argentina':'Argentina','France':'França','England':'Inglaterra',
  'Germany':'Alemanha','Spain':'Espanha','Portugal':'Portugal','Italy':'Itália',
  'Netherlands':'Holanda','Uruguay':'Uruguai','Colombia':'Colômbia','Chile':'Chile',
  'Mexico':'México','United States':'Estados Unidos','Canada':'Canadá',
  'Japan':'Japão','South Korea':'Coreia do Sul','Australia':'Austrália',
  'Morocco':'Marrocos','Senegal':'Senegal','Nigeria':'Nigéria',
  'South Africa':'África do Sul','Ivory Coast':'Costa do Marfim',
  'Saudi Arabia':'Arábia Saudita','Iran':'Irã','Qatar':'Catar',
  'Poland':'Polônia','Croatia':'Croácia','Serbia':'Sérvia','Switzerland':'Suíça',
  'Belgium':'Bélgica','Denmark':'Dinamarca','Sweden':'Suécia','Norway':'Noruega',
  'Austria':'Áustria','Czechia':'República Tcheca','Slovakia':'Eslováquia',
  'Hungary':'Hungria','Romania':'Romênia','Ukraine':'Ucrânia','Turkey':'Turquia',
  'Greece':'Grécia','Scotland':'Escócia','Wales':'País de Gales','Ireland':'Irlanda',
  'Ecuador':'Equador','Peru':'Peru','Venezuela':'Venezuela','Bolivia':'Bolívia',
  'Paraguay':'Paraguai','Costa Rica':'Costa Rica','Panama':'Panamá',
  'Jamaica':'Jamaica','Honduras':'Honduras','El Salvador':'El Salvador',
  'New Zealand':'Nova Zelândia','Cameroon':'Camarões','Ghana':'Gana',
  'Tunisia':'Tunísia','Algeria':'Argélia','Egypt':'Egito',
  'Flamengo':'Flamengo','Palmeiras':'Palmeiras','São Paulo':'São Paulo',
};
const teamPt = (name) => TEAM_PT[name] || name;

const espnSoccer = async (league, dateStr) => {
  const url = dateStr
    ? `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${dateStr}`
    : `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard`;
  const r = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(r.status);
  return r.json();
};

const formatEvent = (ev) => {
  const comp = ev.competitions?.[0];
  const home = comp?.competitors?.find(c => c.homeAway === 'home');
  const away = comp?.competitors?.find(c => c.homeAway === 'away');
  if (!home || !away) return null;
  const hn = teamPt(home.team.displayName);
  const an = teamPt(away.team.displayName);
  const status = ev.status?.type;
  const score  = status?.completed
    ? `${home.score} x ${away.score} (encerrado)`
    : status?.inProgress
      ? `${home.score} x ${away.score} 🔴 ao vivo (${ev.status?.displayClock || ''})`
      : `${ev.date ? new Date(ev.date).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit', timeZone:'America/Sao_Paulo' }) : 'horário a confirmar'}`;
  return `${hn} ${score} ${an}`;
};

app.get('/api/sports', async (req, res) => {
  try {
    const { q = '', date = '' } = req.query;
    const qt = q.toLowerCase();

    // Determina a liga
    let league = 'fifa.world'; // default: Copa do Mundo
    for (const [key, val] of Object.entries(ESPN_LEAGUES)) {
      if (qt.includes(key) && val) { league = val; break; }
    }

    // Determina a data: "hoje", "amanhã", data específica ou vazia (hoje)
    let dateStr = '';
    const today = new Date();
    const toDateStr = (d) => d.toISOString().slice(0,10).replace(/-/g,'');
    if (/amanhã|amanha/.test(qt)) {
      const d = new Date(today); d.setDate(d.getDate() + 1); dateStr = toDateStr(d);
    } else if (/ontem/.test(qt)) {
      const d = new Date(today); d.setDate(d.getDate() - 1); dateStr = toDateStr(d);
    } else if (date) {
      dateStr = date.replace(/-/g,'');
    } else {
      dateStr = toDateStr(today);
    }

    const data   = await espnSoccer(league, dateStr);
    const events = (data.events || []).map(formatEvent).filter(Boolean);

    if (!events.length) return res.json({ events: [], message: 'Nenhum jogo encontrado para essa data.' });
    res.json({ events, league, date: dateStr });
  } catch (e) {
    res.status(503).json({ error: e.message });
  }
});

// ── Consulta CNPJ (BrasilAPI → publica.cnpj.ws → ReceitaWS) ─────────────────
const _normalizeCnpj = (d, src) => {
  if (src === 'brasilapi') return {
    cnpj: d.cnpj, razaoSocial: d.razao_social,
    nomeFantasia: d.nome_fantasia || d.razao_social,
    situacao: d.descricao_situacao_cadastral,
    atividade: d.cnae_fiscal_descricao,
    cidade: d.municipio, estado: d.uf,
    telefone: d.ddd_telefone_1 ? `(${d.ddd_telefone_1.substring(0,2)}) ${d.ddd_telefone_1.substring(2)}` : null,
    email: d.email || null, abertura: d.data_inicio_atividade, porte: d.porte,
    socios: (d.qsa || []).slice(0, 3).map(s => s.nome_socio),
  };
  if (src === 'cnpjws') return {
    cnpj: d.estabelecimento?.cnpj || d.cnpj,
    razaoSocial: d.razao_social,
    nomeFantasia: d.estabelecimento?.nome_fantasia || d.razao_social,
    situacao: d.estabelecimento?.situacao_cadastral?.descricao || '',
    atividade: d.estabelecimento?.atividade_principal?.descricao || '',
    cidade: d.estabelecimento?.cidade?.nome || '', estado: d.estabelecimento?.estado?.sigla || '',
    telefone: d.estabelecimento?.telefone1 || null, email: d.estabelecimento?.email || null,
    abertura: d.estabelecimento?.data_inicio_atividade || null, porte: d.porte?.descricao || '',
    socios: (d.socios || []).slice(0, 3).map(s => s.nome),
  };
  // receitaws
  return {
    cnpj: d.cnpj, razaoSocial: d.nome, nomeFantasia: d.fantasia || d.nome,
    situacao: d.situacao, atividade: d.atividade_principal?.[0]?.text || '',
    cidade: d.municipio, estado: d.uf,
    telefone: d.telefone || null, email: d.email || null,
    abertura: d.abertura || null, porte: d.porte || '',
    socios: (d.qsa || []).slice(0, 3).map(s => s.nome),
  };
};

app.get('/api/cnpj/:cnpj', async (req, res) => {
  const cnpj = req.params.cnpj.replace(/\D/g, '');
  if (cnpj.length !== 14) return res.status(400).json({ error: 'CNPJ inválido' });
  const sources = [
    { url: `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, src: 'brasilapi', ms: 5000 },
    { url: `https://receitaws.com.br/v1/cnpj/${cnpj}`, src: 'receitaws', ms: 6000 },
    { url: `https://publica.cnpj.ws/cnpj/${cnpj}`, src: 'cnpjws', ms: 6000 },
  ];
  for (const { url, src, ms } of sources) {
    try {
      const r = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(ms) });
      if (!r.ok) continue;
      const d = await r.json();
      if (d.status === 'ERROR' || d.error) continue;
      return res.json(_normalizeCnpj(d, src));
    } catch { continue; }
  }
  res.status(404).json({ error: 'CNPJ não encontrado em nenhuma fonte' });
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
  res.on('error', () => { clearInterval(heartbeat); sseClients.delete(res); });
});

const pushEvent = (type, message, action = null) => {
  const data = JSON.stringify({ type, message, action });
  sseClients.forEach(client => {
    try { client.write(`data: ${data}\n\n`); } catch {}
  });
  // também dispara toast Windows
  notifier.notify({ title: 'Lúmina', message, sound: true, wait: false });
};

// Guarda a última data em que cada tipo de notificação foi enviada
const proactiveLastSent = {};

const checkProactive = () => {
  const now      = new Date();
  const hour     = now.getHours();
  const todayKey = now.toISOString().split('T')[0];

  // Hábitos não feitos — notifica 1x após as 21h
  if (hour >= 21 && proactiveLastSent.habits !== todayKey) {
    const habits  = readJSON(path.join(__dirname, 'habits.json'), []);
    const pending = habits.filter(h => !(h.dates || []).includes(todayKey));
    if (pending.length > 0 && sseClients.size > 0) {
      proactiveLastSent.habits = todayKey;
      const names = pending.map(h => h.name).join(', ');
      pushEvent('reminder', `Você ainda não registrou: ${names}`, 'checkHabits');
    }
  }

  // Tarefas pendentes — notifica 1x às 9h
  if (hour === 9 && proactiveLastSent.tasks !== todayKey) {
    const tasks   = readJSON(path.join(__dirname, 'tasks.json'), []);
    const pending = tasks.filter(t => !t.done);
    if (pending.length > 0 && sseClients.size > 0) {
      proactiveLastSent.tasks = todayKey;
      pushEvent('reminder', `Bom dia! Você tem ${pending.length} tarefa(s) pendente(s).`, 'openTasks');
    }
  }

  // Lembretes agendados do banco — dispara quando data_hora <= agora
  try {
    const agora = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const vencidos = db.getDb().prepare(
      `SELECT * FROM lembretes WHERE concluido = 0 AND data_hora IS NOT NULL AND data_hora <= ?`
    ).all(agora);
    for (const lembrete of vencidos) {
      db.concluirLembrete(lembrete.id);
      pushEvent('reminder', lembrete.texto, 'openReminders');
    }
  } catch (_) {}
};

// Roda a cada 60 segundos
setInterval(checkProactive, 60 * 1000);

// ── Start — libera a porta antes de subir ─────────────────────────────────────
const killPort = (port) => new Promise(resolve => {
  exec(`powershell -c "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`, () => resolve());
});

killPort(PORT).then(() => app.listen(PORT, HOST, () => {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log(`║  Lúmina  →  http://${HOST}:${PORT}    ║`);
  console.log('╚═══════════════════════════════════════╝\n');
  console.log('  Pressione Ctrl+C para encerrar.\n');
}));
