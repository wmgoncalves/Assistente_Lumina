const express    = require('express');
const path       = require('path');
const fs         = require('fs');
const { exec, spawn } = require('child_process');
const os         = require('os');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const PIPER_DIR    = path.join(__dirname, 'piper');
const PIPER_EXE    = path.join(PIPER_DIR, 'piper.exe');
const PIPER_VOICES = path.join(PIPER_DIR, 'voices');
const multer    = require('multer');
const mammoth   = require('mammoth');
const pdfParse  = require('pdf-parse');
const notifier   = require('node-notifier');
let puppeteer = null; // lazy load — carregado só quando /api/browser for usado

const SKY_PRINTS_DIR    = path.join(os.homedir(), 'Pictures', 'Sky Prints');
const SKY_GRAVACOES_DIR = path.join(os.homedir(), 'Pictures', 'Sky Gravacoes');
[SKY_PRINTS_DIR, SKY_GRAVACOES_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

let activeRecording = { page: null, recorder: null, filePath: null };
const { analyzeSpreadsheet, buildSheetContext } = require('./services/spreadsheetAnalyzer');
const { writeLog, readLogs, clearLogs, countBySource } = require('./services/logger');
const db = require('./services/db');

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

// ── Express ───────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '20mb' }));
// Serve arquivos da raiz (versão atual da Sky) antes do public/
const noCache = (res) => res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
app.get('/',          (_, res) => { noCache(res); res.sendFile(path.join(__dirname, 'index.html')); });
app.get('/style.css', (_, res) => { noCache(res); res.sendFile(path.join(__dirname, 'style.css')); });
app.get('/app.js',    (_, res) => { noCache(res); res.sendFile(path.join(__dirname, 'app.js')); });
app.get('/admin',     (_, res) => { noCache(res); res.sendFile(path.join(__dirname, 'admin.html')); });
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
    ollamaModel:   c.ollamaModel   || 'gemma3:1b',
    hasGemini:     !!c.geminiKey,
    hasElevenLabs: !!c.elevenLabsKey,
  });
});

app.post('/api/config', (req, res) => {
  const c = getCfg();
  const { username, geminiKey, elevenLabsKey, elevenVoiceId, ollamaModel, frete_params } = req.body;
  if (username      !== undefined)             c.username      = username;
  if (geminiKey     && geminiKey.trim())       c.geminiKey     = geminiKey.trim();
  if (elevenLabsKey && elevenLabsKey.trim())   c.elevenLabsKey = elevenLabsKey.trim();
  if (elevenVoiceId !== undefined)             c.elevenVoiceId = elevenVoiceId;
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

  const tmpFile = path.join(os.tmpdir(), `sky_tts_${Date.now()}.wav`);
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
    let text = '', pages = null;
    if (mimetype === 'application/pdf' || originalname.endsWith('.pdf')) {
      const data = await pdfParse(buffer);
      text  = data.text;
      pages = data.numpages;
    } else if (mimetype.includes('wordprocessingml') || originalname.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (mimetype === 'text/plain') {
      text = buffer.toString('utf8');
    } else {
      return res.status(422).json({ error: 'Formato não suportado. Use PDF, DOCX ou TXT.' });
    }
    res.json({ ok: true, text: text.trim(), pages, chars: text.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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

    // Salva arquivo original para download posterior
    const safeName = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
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
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Download de arquivo original da base de conhecimento ─────────────────────
app.get('/api/download-doc/:filename', (req, res) => {
  const safeName = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = path.join(UPLOADS_DIR, safeName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Arquivo não encontrado.' });
  res.download(filePath, req.params.filename);
});

// ── Análise de planilha ────────────────────────────────────────────────────────
app.post('/api/analyze-spreadsheet', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  const { originalname, buffer } = req.file;
  const ext = (originalname.split('.').pop() || '').toLowerCase();
  if (!['xlsx', 'xls', 'csv'].includes(ext)) {
    return res.status(422).json({ error: `Formato não suportado: .${ext}. Use .xlsx, .xls ou .csv.` });
  }
  try {
    const result = analyzeSpreadsheet(buffer, originalname);
    if (!result.sheets.length) {
      return res.status(422).json({ error: 'Nenhuma aba com dados de valor/data foi detectada.' });
    }
    res.json({ ok: true, analysis: result, context: buildSheetContext(result) });
  } catch (err) {
    console.error('[analyze-spreadsheet]', err);
    res.status(500).json({ error: 'Erro ao processar planilha: ' + err.message });
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
  const body = { ...req.body };
  // Garante que facts seja sempre array
  if ('facts' in body && !Array.isArray(body.facts)) delete body.facts;
  const updated = { ...m, ...body };
  if (!Array.isArray(updated.facts)) updated.facts = [];
  saveMem(updated);
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
  fetch(`http://localhost:${PORT}/api/index-notes`, { method: 'POST' }).catch(() => {});
};

// ── Windows Notifications ─────────────────────────────────────────────────────
app.post('/api/notify', (req, res) => {
  const { title = 'Sky', message = '', sound = true } = req.body;
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
      const fileName  = `sky_${stamp}_${domain}.png`;
      const filePath  = path.join(SKY_PRINTS_DIR, fileName);
      await page.setViewport({ width: 1280, height: 800 });
      await page.screenshot({ path: filePath, fullPage: false });
      res.json({ ok: true, title, filePath, fileName });

    } else if (action === 'recordStart') {
      if (activeRecording.recorder) return res.status(409).json({ error: 'Gravação já em andamento. Diga "Sky, para de gravar" primeiro.' });
      const domain   = new URL(url).hostname.replace(/^www\./, '').replace(/\./g, '_');
      const stamp    = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
      const fileName = `sky_${stamp}_${domain}.webm`;
      const filePath = path.join(SKY_GRAVACOES_DIR, fileName);
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
    const r = await fetch(url, { headers: { 'User-Agent': 'SkyScapini/1.0' }, signal: AbortSignal.timeout(8000) });
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
  const r = await fetch(url, { headers: { 'User-Agent': 'SkyScapini/1.0' }, signal: AbortSignal.timeout(10000) });
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

  const { segmento = '', regiao = 'Brasil', quantidade = 5, para = 'Scapini Transportes' } = req.body;
  if (!segmento) return res.status(400).json({ error: 'segmento required' });

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
          generationConfig: { maxOutputTokens: 4000, temperature: 0.7 }
        }),
        signal: AbortSignal.timeout(45000)
      }
    );
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error?.message || `Gemini HTTP ${r.status}`); }
    const d = await r.json();
    return d.candidates[0].content.parts[0].text;
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

    const match = raw.replace(/```json|```/g, '').match(/\[[\s\S]*\]/);
    if (!match) throw new Error('Resposta não contém array JSON válido');
    const list = JSON.parse(match[0]);

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

// ── Auditoria Contábil ────────────────────────────────────────────────────────
app.post('/api/auditoria-contabil', async (req, res) => {
  const c = getCfg();
  if (!c.geminiKey) return res.status(400).json({ error: 'no_key' });
  const { context } = req.body;
  if (!context) return res.status(400).json({ error: 'context obrigatório' });

  const prompt = `Você é um auditor contábil sênior especializado em empresas de transporte rodoviário de cargas. Analise criticamente os dados financeiros abaixo e faça uma auditoria detalhada.

DADOS DA PLANILHA:
${context.substring(0, 12000)}

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
          generationConfig: { maxOutputTokens: 3500, temperature: 0.25 }
        })
      }
    );
    if (!r.ok) throw new Error(`Gemini ${r.status}`);
    const d = await r.json();
    res.json({ ok: true, audit: d.candidates[0].content.parts[0].text.trim() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Dev Mode — Agente de Desenvolvimento ─────────────────────────────────────
const BLOCKED_CMDS = /rm\s+-rf\s+\/|format\s+[a-z]:|del\s+\/[sq]/i;

app.post('/api/dev/grep', (req, res) => {
  const { pattern, dir = '.', glob: fileGlob = '**/*', caseSensitive = false } = req.body;
  if (!pattern) return res.status(400).json({ error: 'pattern required' });
  try {
    const flags = caseSensitive ? '' : '/i';
    const cmd   = `Get-ChildItem -Path "${dir}" -Recurse -Include "${fileGlob.replace('**/', '')}" -File | Select-String -Pattern "${pattern.replace(/"/g, '`"')}" ${caseSensitive ? '' : '-CaseSensitive:$false'} | Select-Object -First 200 | ForEach-Object { "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }`;
    exec(cmd, { timeout: 15000, maxBuffer: 1024 * 512, shell: 'powershell.exe' }, (err, stdout) => {
      const lines = stdout.trim().split('\n').filter(Boolean);
      res.json({ ok: true, pattern, matches: lines, count: lines.length });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/dev/read', (req, res) => {
  const { path: filePath, offset = 0, limit = 300 } = req.body;
  if (!filePath) return res.status(400).json({ error: 'path required' });
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines   = content.split('\n');
    const slice   = lines.slice(offset, offset + limit);
    res.json({ ok: true, path: filePath, content: slice.join('\n'), totalLines: lines.length, offset, returned: slice.length });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

app.post('/api/dev/write', (req, res) => {
  const { path: filePath, content = '' } = req.body;
  if (!filePath) return res.status(400).json({ error: 'path required' });
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    res.json({ ok: true, path: filePath, bytes: Buffer.byteLength(content, 'utf8') });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/dev/edit', (req, res) => {
  const { path: filePath, old_string, new_string } = req.body;
  if (!filePath || old_string == null || new_string == null) return res.status(400).json({ error: 'path, old_string e new_string são obrigatórios' });
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const count   = (content.split(old_string).length - 1);
    if (!count) return res.status(400).json({ error: 'old_string não encontrado no arquivo' });
    if (count > 1) return res.status(400).json({ error: `old_string encontrado ${count}x — seja mais específico` });
    const updated = content.replace(old_string, new_string);
    fs.writeFileSync(filePath, updated, 'utf8');
    res.json({ ok: true, path: filePath });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/dev/ls', (req, res) => {
  const { path: dirPath = '.' } = req.body;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const items   = entries.map(e => ({ name: e.name, type: e.isDirectory() ? 'dir' : 'file' }));
    res.json({ ok: true, path: dirPath, items });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

app.post('/api/dev/exec', (req, res) => {
  const { command, cwd = process.cwd() } = req.body;
  if (!command) return res.status(400).json({ error: 'command required' });
  if (BLOCKED_CMDS.test(command)) return res.status(403).json({ error: 'Comando bloqueado por segurança' });

  exec(command, { cwd, timeout: 30000, maxBuffer: 1024 * 512, shell: 'powershell.exe' }, (err, stdout, stderr) => {
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
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: structPrompt }] }], generationConfig: { maxOutputTokens: 4000, temperature: 0.4 } }) }
    );
    if (!gr.ok) { const e = await gr.json().catch(() => ({})); throw new Error(e.error?.message || `Gemini HTTP ${gr.status}`); }
    const gd   = await gr.json();
    const raw  = gd.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
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
  notifier.notify({ title: 'Sky', message, sound: true, wait: false });
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

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log(`║  Emerald  →  http://localhost:${PORT}    ║`);
  console.log('╚═══════════════════════════════════════╝\n');
  console.log('  Pressione Ctrl+C para encerrar.\n');
});
