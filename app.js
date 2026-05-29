// ── Settings ──────────────────────────────────────────────────────────────────
const CFG_KEY = 'emerald_cfg';
const loadCfg = () => { try { return JSON.parse(localStorage.getItem(CFG_KEY) || '{}'); } catch { return {}; } };
const saveCfg = () => localStorage.setItem(CFG_KEY, JSON.stringify(cfg));

const cfg = { username: '', geminiKey: '', elevenLabsKey: '', ...loadCfg() };

// ── Persistent Memory (Self-Learning) ─────────────────────────────────────────
const MEM_KEY   = 'emerald_mem';
const HIST_KEY  = 'emerald_hist';
const NOTES_KEY = 'sky_notes';

const getNotes  = () => { try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'); } catch { return []; } };
const saveNotes = (n) => localStorage.setItem(NOTES_KEY, JSON.stringify(n));

// Keyword search over KB notes — returns top relevant notes for RAG context injection
const retrieveNotes = (query = '') => {
  const notes = getNotes();
  if (!notes.length) return [];
  if (!query) return notes.slice(0, 3);
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const scored = notes.map(n => {
    const hay = (n.title + ' ' + n.content).toLowerCase();
    const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
    return { ...n, score };
  }).filter(n => n.score > 0).sort((a, b) => b.score - a.score);
  return scored.length ? scored.slice(0, 3) : notes.slice(0, 2);
};

const defaultMem = () => ({ userName: null, facts: [], sessions: 0, lastSeen: null });

const getMem   = () => { try { return { ...defaultMem(), ...JSON.parse(localStorage.getItem(MEM_KEY) || '{}') }; } catch { return defaultMem(); } };
const saveMem  = (m) => localStorage.setItem(MEM_KEY, JSON.stringify(m));
const loadHist = () => { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch { return []; } };
const saveHist = () => localStorage.setItem(HIST_KEY, JSON.stringify(app.history.slice(-30))); // last 15 exchanges

// Simple regex-based fact extraction (works offline)
const learnRegex = (text) => {
  const mem = getMem();
  let changed = false;

  if (!mem.userName) {
    const m = text.match(/(?:me chamo|meu nome [eé]|pode me chamar de|sou o|sou a)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)/i);
    if (m) { mem.userName = m[1]; changed = true; }
  }

  if (changed) { saveMem(mem); flashLearnBadge(); renderMemoryPanel(); }
};

const applyLearning = (learn) => {
  if (!learn) return;
  const mem = getMem();
  let changed = false;

  if (learn.nome && !mem.userName) { mem.userName = learn.nome; changed = true; }

  if (Array.isArray(learn.remover)) {
    for (const r of learn.remover) {
      const idx = mem.facts.indexOf(r);
      if (idx !== -1) { mem.facts.splice(idx, 1); changed = true; }
    }
  }

  if (Array.isArray(learn.fatos)) {
    for (const f of learn.fatos) {
      if (f && !mem.facts.includes(f) && mem.facts.length < 80) { mem.facts.push(f); changed = true; }
    }
  }

  if (changed) { saveMem(mem); flashLearnBadge(); renderMemoryPanel(); }
};

const buildContextBlock = (lastUserMsg = '') => {
  const today    = new Date();
  const todayKey = today.toISOString().split('T')[0];
  const tasks    = typeof getTasks    === 'function' ? getTasks()   : [];
  const habits   = typeof getHabits   === 'function' ? getHabits()  : [];
  const fin      = typeof getFin      === 'function' ? getFin()     : [];

  const pending      = tasks.filter(t => !t.done);
  const doneHabits   = habits.filter(h => (h.dates || []).includes(todayKey));
  const pendingHabit = habits.filter(h => !(h.dates || []).includes(todayKey));
  const balance      = fin.reduce((s, f) => f.type === 'rec' ? s + f.val : s - f.val, 0);
  const notes        = retrieveNotes(lastUserMsg);

  let ctx = `\n\n── CONTEXTO DO DIA ──`;
  ctx += `\n📅 ${today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • ${today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  if (pending.length) {
    ctx += `\n✅ Tarefas pendentes (${pending.length}):`;
    pending.slice(0, 6).forEach(t => { ctx += `\n  [${t.id}] ${t.text}`; });
  } else {
    ctx += `\n✅ Nenhuma tarefa pendente.`;
  }

  if (habits.length) {
    if (doneHabits.length)   ctx += `\n🔥 Hábitos feitos hoje: ${doneHabits.map(h => h.name).join(', ')}`;
    if (pendingHabit.length) ctx += `\n⏳ Hábitos pendentes hoje: ${pendingHabit.map(h => h.name).join(', ')}`;
  }

  ctx += `\n💰 Saldo financeiro: R$ ${balance.toFixed(2).replace('.', ',')}`;

  if (notes.length) {
    ctx += `\n\n── BASE DE CONHECIMENTO (notas relevantes) ──`;
    notes.forEach(n => { ctx += `\n📄 "${n.title}": ${n.content.substring(0, 200)}${n.content.length > 200 ? '…' : ''}`; });
  }

  return ctx;
};

const buildSystem = (lastUserMsg = '') => {
  const mem      = getMem();
  const name     = mem.userName || null;
  const sessions = mem.sessions || 1;

  let memBlock = '';
  if (name || mem.facts.length > 0) {
    memBlock = '\n\nMEMÓRIA DO USUÁRIO:';
    if (name) memBlock += `\n• Nome: ${name}`;
    mem.facts.slice(-20).forEach(f => { memBlock += `\n• ${f}`; });
  }

  const returning = sessions > 1 ? `\nSessão nº ${sessions} — cumprimente como a alguém que retorna.` : '';

  const toolsBlock = `

── FERRAMENTAS — use proativamente, sem anunciar ──
• updateMemory   → quando aprender nome ou fato novo sobre o usuário
• createTask     → "anota tarefa", "lembra de", "preciso fazer"
• completeTask   → quando usuário confirmar que concluiu (use ID do contexto)
• checkHabit     → quando mencionar que fez um hábito
• addFinance     → menção a gasto, receita, pagamento, salário
• saveNote       → quando pedir para salvar info, anotar, guardar no conhecimento
• Google Search  → clima, notícias, preços, qualquer informação em tempo real

Responda diretamente em texto. Execute ferramentas em silêncio e confirme o resultado naturalmente na resposta.`;

  return `Você é Sky, uma inteligência artificial pessoal avançada com capacidades de agente — você não apenas responde, você age.
Tom: elegante, direto, eficiente. Use "Senhor" ou o nome do usuário. Português brasileiro.
Evite respostas longas sem necessidade. Seja proativo: sugira ações, identifique padrões, antecipe necessidades.${returning}${memBlock}${buildContextBlock(lastUserMsg)}${toolsBlock}`;
};

// ── App State ──────────────────────────────────────────────────────────────────
const app = {
  voiceGender:  'male',
  continuous:   false,
  isListening:  false,
  isSpeaking:   false,
  history:      loadHist(),
};

// ── Toast ──────────────────────────────────────────────────────────────────────
const toast = (msg, type = 'info') => {
  const el = Object.assign(document.createElement('div'), { className: `toast ${type}`, textContent: msg });
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => { el.style.animation = 'slideIn 0.25s reverse forwards'; setTimeout(() => el.remove(), 260); }, 3500);
};

// ── Face Animation ─────────────────────────────────────────────────────────────
const faceSvg = document.getElementById('face');
const mouth   = document.getElementById('mo');
const eyeL    = document.getElementById('el');
const eyeR    = document.getElementById('er');

const M = {
  smile: 'M 74 122 Q 100 144 126 122',
  small: 'M 80 124 Q 100 131 120 124',
  flat:  'M 80 126 Q 100 122 120 126',
  o1:    'M 76 119 Q 100 148 124 119',
  o2:    'M 76 115 Q 100 155 124 115',
  o3:    'M 80 120 Q 100 139 120 120',
};

let speakTimer = null, blinkTimer = null;

const scheduleBlink = () => {
  clearTimeout(blinkTimer);
  blinkTimer = setTimeout(() => {
    eyeL.setAttribute('ry', '1.5'); eyeR.setAttribute('ry', '1.5');
    setTimeout(() => { eyeL.setAttribute('ry', '11'); eyeR.setAttribute('ry', '11'); scheduleBlink(); }, 140);
  }, 2500 + Math.random() * 4000);
};

const setFace = (state) => {
  faceSvg.setAttribute('class', `face ${state}`);
  clearInterval(speakTimer); speakTimer = null;
  switch (state) {
    case 'idle':      mouth.setAttribute('d', M.smile); break;
    case 'listening': mouth.setAttribute('d', M.small); break;
    case 'thinking':  mouth.setAttribute('d', M.flat);  break;
    case 'speaking': {
      let f = 0;
      const fr = [M.o1, M.smile, M.o2, M.o3, M.smile, M.o1];
      speakTimer = setInterval(() => mouth.setAttribute('d', fr[f++ % fr.length]), 115);
      break;
    }
  }
};

const flashLearnBadge = () => {
  const b = document.getElementById('learn-badge');
  b.classList.add('show');
  setTimeout(() => b.classList.remove('show'), 2800);
};

// ── Stop all speech (ElevenLabs or browser TTS) ───────────────────────────────
let currentAudio = null;

const stopSpeaking = () => {
  if (currentAudio) { try { currentAudio.pause(); } catch {} currentAudio = null; }
  try { window.speechSynthesis.cancel(); } catch {}
  clearInterval(speakTimer); speakTimer = null;
  app.isSpeaking = false;
  setFace('idle');
};

// ── Speech — ElevenLabs (Jarvis Voice) ────────────────────────────────────────
const ELEVEN_VOICE = 'pNInz6obpgDQGcFmaJgB'; // Adam — deep clear male, great for pt-BR

const speakElevenLabs = async (text, onEnd) => {
  app.isSpeaking = true;
  setFace('speaking');
  setRespText(text);
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE}`, {
      method: 'POST',
      headers: { 'xi-api-key': cfg.elevenLabsKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.48, similarity_boost: 0.78, style: 0.25, use_speaker_boost: true }
      })
    });
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
    const url   = URL.createObjectURL(await res.blob());
    const audio = new Audio(url);
    currentAudio = audio;
    const finish = () => { currentAudio = null; URL.revokeObjectURL(url); app.isSpeaking = false; setFace('idle'); onEnd?.(); if (app.continuous && !app.isListening) setTimeout(startListening, 600); };
    audio.onended = finish;
    audio.onerror = () => { currentAudio = null; URL.revokeObjectURL(url); app.isSpeaking = false; speakBrowser(text, onEnd); };
    audio.play();
  } catch (e) {
    console.warn('ElevenLabs falhou, usando TTS do navegador:', e.message);
    app.isSpeaking = false;
    speakBrowser(text, onEnd);
  }
};

// ── Speech — Browser TTS ──────────────────────────────────────────────────────
let voices = [];
const loadVoices = () => { voices = window.speechSynthesis.getVoices(); };
window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

const getVoice = () => {
  const ptv = voices.filter(v => v.lang.startsWith('pt'));
  return app.voiceGender === 'male'
    ? ptv.find(v => /daniel|male|masculin|ricardo/i.test(v.name)) || ptv[0] || voices[0]
    : ptv.find(v => /maria|female|feminin|luciana|vitoria/i.test(v.name)) || ptv[ptv.length - 1] || voices[voices.length - 1];
};

const speakBrowser = (text, onEnd) => {
  if (!('speechSynthesis' in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  app.isSpeaking = true;
  setFace('speaking');
  setRespText(text);
  const u = new SpeechSynthesisUtterance(text);
  u.lang  = 'pt-BR';
  u.rate  = 0.96;
  u.pitch = app.voiceGender === 'male' ? 0.82 : 1.2;
  const v = getVoice();
  if (v) u.voice = v;
  const finish = () => { app.isSpeaking = false; setFace('idle'); onEnd?.(); if (app.continuous && !app.isListening) setTimeout(startListening, 600); };
  u.onend = finish; u.onerror = finish;
  window.speechSynthesis.speak(u);
};

const speak = (text, onEnd) => cfg.elevenLabsKey ? speakElevenLabs(text, onEnd) : speakBrowser(text, onEnd);

// ── Speech Recognition ─────────────────────────────────────────────────────────
let recog = null;
let micPermissionGranted = false;

const buildRecog = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast('Reconhecimento de voz não suportado neste navegador (use Chrome).', 'error'); return null; }

  const r = new SR();
  r.lang = 'pt-BR'; r.continuous = false; r.interimResults = true;

  r.onstart = () => {
    app.isListening = true;
    setFace('listening');
    setUserSaid('Ouvindo…');
    document.getElementById('btn-mic').classList.add('listening');
  };

  r.onresult = (e) => {
    const t = Array.from(e.results).map(x => x[0].transcript).join('');
    setUserSaid(`"${t}"`);
    if (e.results[e.results.length - 1].isFinal && t.trim()) {
      app.isListening = false;
      document.getElementById('btn-mic').classList.remove('listening');
      processInput(t.trim());
    }
  };

  r.onerror = (e) => {
    app.isListening = false;
    document.getElementById('btn-mic').classList.remove('listening');
    setFace('idle');
    setUserSaid('');
    switch (e.error) {
      case 'not-allowed':
        toast('Permissão de microfone negada. Clique no cadeado da barra do navegador e permita o microfone.', 'error');
        break;
      case 'no-speech':
        if (app.continuous) setTimeout(startListening, 1000);
        break;
      case 'audio-capture':
        toast('Nenhum microfone encontrado.', 'error');
        break;
      case 'aborted':
        break; // interrupção normal
      default:
        toast(`Erro no microfone: ${e.error}`, 'error');
    }
  };

  r.onend = () => {
    app.isListening = false;
    document.getElementById('btn-mic').classList.remove('listening');
  };

  return r;
};

const startListening = async () => {
  if (app.isSpeaking) stopSpeaking();

  if (!micPermissionGranted && navigator.mediaDevices?.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      micPermissionGranted = true;
    } catch (err) {
      setFace('idle');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast('Microfone bloqueado. Clique no ícone 🎤 na barra de endereço do Chrome e clique em "Permitir".', 'error');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        toast('Nenhum microfone encontrado. Conecte um microfone e tente novamente.', 'error');
      } else {
        toast('Erro ao acessar microfone: ' + err.message, 'error');
      }
      return;
    }
  }

  recog = buildRecog();
  if (!recog) return;

  try {
    recog.start();
  } catch (e) {
    console.error(e);
    toast('Erro ao iniciar reconhecimento. Recarregue a página e tente de novo.', 'error');
  }
};

const stopListening = () => {
  if (recog && app.isListening) {
    try { recog.stop(); } catch {}
  }
};

// ── UI Helpers ─────────────────────────────────────────────────────────────────
const setRespText = (t) => { document.getElementById('resp-text').textContent = t; };
const setUserSaid = (t) => { document.getElementById('user-said').textContent = t; };

const addMsgUI = (role, text) => {
  const list = document.getElementById('history-msgs');
  const el   = document.createElement('div');
  el.className = `hmsg ${role}`;
  const mem  = getMem();
  const label = role === 'user' ? (mem.userName || cfg.username || 'VOCÊ').toUpperCase() : 'SKY';
  el.innerHTML = `<span class="hmsg-role">${label}</span><div class="hmsg-bubble">${text}</div>`;
  list.appendChild(el);
  list.scrollTop = list.scrollHeight;
};

const renderMemoryPanel = () => {
  const mem  = getMem();
  const list = document.getElementById('memory-list');
  list.innerHTML = '';

  const all = [];
  if (mem.userName) all.push(`Nome: ${mem.userName}`);
  mem.facts.forEach(f => all.push(f));

  if (all.length === 0) {
    list.innerHTML = '<p class="mem-empty">Nenhuma memória ainda.<br>Converse para que Sky aprenda sobre você.</p>';
    return;
  }

  all.forEach(f => {
    const el = document.createElement('div');
    el.className = 'mem-fact';
    el.textContent = f;
    list.appendChild(el);
  });
};

// ── AI Processing ──────────────────────────────────────────────────────────────
const MAX_HIST = 30;

const processInput = async (text) => {
  setFace('thinking');
  setRespText('…');

  learnRegex(text);

  app.history.push({ role: 'user', content: text });
  addMsgUI('user', text);
  if (app.history.length > MAX_HIST) app.history = app.history.slice(-MAX_HIST);

  try {
    const response = cfg.geminiKey ? await callGemini() : localFallback(text);
    app.history.push({ role: 'model', content: response });
    addMsgUI('sky', response);
    saveHist();
    speak(response);
  } catch (err) {
    console.error(err);
    speak('Desculpe, Senhor. Houve uma falha ao processar. Verifique a chave API nas configurações.');
  }
};

// ── Tool declarations ──────────────────────────────────────────────────────────
const TOOL_DECLARATIONS = {
  functionDeclarations: [
    {
      name: 'updateMemory',
      description: 'Salva ou atualiza informações sobre o usuário na memória persistente.',
      parameters: {
        type: 'object',
        properties: {
          nome:    { type: 'string', nullable: true, description: 'Nome do usuário, se revelado' },
          fatos:   { type: 'array',  items: { type: 'string' }, description: 'Novos fatos aprendidos (profissão, local, gostos)' },
          remover: { type: 'array',  items: { type: 'string' }, description: 'Texto EXATO de fatos da memória que ficaram desatualizados' }
        }
      }
    },
    {
      name: 'createTask',
      description: 'Cria uma nova tarefa na lista de tarefas do usuário.',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Descrição da tarefa' }
        },
        required: ['text']
      }
    },
    {
      name: 'completeTask',
      description: 'Marca uma tarefa como concluída. Use o ID exato do contexto do sistema.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'ID da tarefa (número entre colchetes no contexto)' }
        },
        required: ['taskId']
      }
    },
    {
      name: 'checkHabit',
      description: 'Registra um hábito como realizado hoje.',
      parameters: {
        type: 'object',
        properties: {
          habitName: { type: 'string', description: 'Nome parcial ou completo do hábito' }
        },
        required: ['habitName']
      }
    },
    {
      name: 'addFinance',
      description: 'Registra uma receita ou despesa financeira.',
      parameters: {
        type: 'object',
        properties: {
          desc:  { type: 'string', description: 'Descrição da transação' },
          value: { type: 'number', description: 'Valor em reais (positivo)' },
          type:  { type: 'string', enum: ['rec', 'des'], description: 'rec=receita, des=despesa' }
        },
        required: ['desc', 'value', 'type']
      }
    },
    {
      name: 'saveNote',
      description: 'Salva uma nota na base de conhecimento pessoal do usuário.',
      parameters: {
        type: 'object',
        properties: {
          title:   { type: 'string', description: 'Título da nota' },
          content: { type: 'string', description: 'Conteúdo completo da nota' }
        },
        required: ['title', 'content']
      }
    }
  ]
};

const TOOL_LABELS = {
  updateMemory: 'Memorizando…',
  createTask:   'Criando tarefa…',
  completeTask: 'Concluindo tarefa…',
  checkHabit:   'Registrando hábito…',
  addFinance:   'Registrando transação…',
  saveNote:     'Salvando nota…'
};

const executeTool = (name, args) => {
  switch (name) {
    case 'updateMemory':
      applyLearning(args);
      return 'Memória atualizada.';

    case 'createTask': {
      if (typeof getTasks !== 'function') return 'Módulo de tarefas não disponível.';
      const tasks = getTasks();
      tasks.unshift({ id: Date.now().toString(), text: args.text, done: false });
      saveTasks(tasks);
      if (document.getElementById('view-tarefas')?.classList.contains('active')) renderTarefas();
      return `Tarefa criada: "${args.text}"`;
    }

    case 'completeTask': {
      if (typeof getTasks !== 'function') return 'Módulo não disponível.';
      const tasks = getTasks();
      const task  = tasks.find(t => t.id === args.taskId);
      if (!task) return `Tarefa ${args.taskId} não encontrada.`;
      task.done = true;
      saveTasks(tasks);
      if (document.getElementById('view-tarefas')?.classList.contains('active')) renderTarefas();
      return `Tarefa "${task.text}" concluída.`;
    }

    case 'checkHabit': {
      if (typeof getHabits !== 'function') return 'Módulo não disponível.';
      const habits = getHabits();
      const habit  = habits.find(h => h.name.toLowerCase().includes(args.habitName.toLowerCase()));
      if (!habit) return `Hábito "${args.habitName}" não encontrado. Cadastre-o em Hábitos.`;
      habit.dates = habit.dates || [];
      const today = new Date().toISOString().split('T')[0];
      if (!habit.dates.includes(today)) habit.dates.push(today);
      saveHabits(habits);
      if (document.getElementById('view-habitos')?.classList.contains('active')) renderHabitos();
      return `Hábito "${habit.name}" ✓ registrado hoje.`;
    }

    case 'addFinance': {
      if (typeof getFin !== 'function') return 'Módulo não disponível.';
      const fin = getFin();
      fin.unshift({ id: Date.now().toString(), desc: args.desc, val: args.value, type: args.type, date: new Date().toLocaleDateString('pt-BR') });
      saveFin(fin);
      if (document.getElementById('view-financas')?.classList.contains('active')) renderFinancas();
      return `${args.type === 'rec' ? 'Receita' : 'Despesa'} de R$ ${args.value.toFixed(2)} registrada.`;
    }

    case 'saveNote': {
      const notes = getNotes();
      notes.unshift({ id: Date.now().toString(), title: args.title, content: args.content, date: new Date().toISOString() });
      saveNotes(notes);
      if (document.getElementById('view-conhecimento')?.classList.contains('active')) renderKnowledge();
      return `Nota "${args.title}" salva na base de conhecimento.`;
    }

    default:
      return 'Ferramenta desconhecida.';
  }
};

// ── Agentic loop ───────────────────────────────────────────────────────────────
const callGemini = async (customHistory = null) => {
  const history = customHistory || app.history;
  const lastMsg = history.filter(h => h.role === 'user').slice(-1)[0]?.content || '';

  let contents = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.content }]
  }));

  const tools = [TOOL_DECLARATIONS, { googleSearch: {} }];

  for (let iter = 0; iter < 8; iter++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cfg.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: buildSystem(lastMsg) }] },
          contents,
          tools,
          generationConfig: { maxOutputTokens: 800, temperature: 0.82 }
        })
      }
    );

    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `HTTP ${res.status}`); }
    const data      = await res.json();
    const candidate = data.candidates?.[0];
    if (!candidate) throw new Error('Resposta vazia da API.');

    const parts     = candidate.content?.parts || [];
    const textPart  = parts.find(p => p.text);
    const funcCalls = parts.filter(p => p.functionCall);

    if (funcCalls.length === 0) {
      // Final text response
      return textPart?.text?.trim() || '';
    }

    // Show tool activity in UI
    const label = TOOL_LABELS[funcCalls[0].functionCall.name] || 'Executando…';
    setRespText(`⚡ ${label}`);

    // Execute each tool and collect responses
    const responses = funcCalls.map(({ functionCall: { name, args } }) => ({
      functionResponse: { name, response: { result: executeTool(name, args) } }
    }));

    // Append model turn + function results for next iteration
    contents.push({ role: 'model', parts: funcCalls });
    contents.push({ role: 'user',  parts: responses });
  }

  return 'Ação concluída.';
};

const callGeminiVision = async (base64, mime, prompt) => {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cfg.geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: buildSystem() }] },
      contents: [{ role: 'user', parts: [{ inline_data: { mime_type: mime, data: base64 } }, { text: prompt }] }],
      generationConfig: { maxOutputTokens: 450, temperature: 0.75 }
    })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text.trim();
};

const localFallback = (text) => {
  const t = text.toLowerCase();
  const mem = getMem();
  const name = mem.userName ? `, ${mem.userName}` : '';
  if (/\b(oi|olá|ola|hey|ei)\b/.test(t))  return `Olá${name}. Em que posso ser útil?`;
  if (/que horas|horas s[aã]o/.test(t))    return `São exatamente ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}, Senhor.`;
  if (/que dia|data|hoje/.test(t))         return `Hoje é ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`;
  if (/seu nome|você [eé]|quem é você/.test(t)) return 'Sou Sky, sua inteligência artificial pessoal. Para capacidades completas, configure a chave Gemini API nas configurações.';
  if (/obrigad|valeu/.test(t))             return 'Às suas ordens, Senhor.';
  if (/tchau|adeus|até logo/.test(t))      return `Até breve${name}. Estarei aqui quando precisar.`;
  return 'Para respostas inteligentes completas, adicione sua chave Gemini API nas configurações — ícone de engrenagem no topo.';
};

// ── Camera ─────────────────────────────────────────────────────────────────────
const openCamera = async () => {
  if (!cfg.geminiKey) { toast('Configure a chave Gemini API para análise visual.', 'error'); return; }
  try {
    app.cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    document.getElementById('cam-vid').srcObject = app.cameraStream;
    document.getElementById('cam-modal').classList.add('active');
  } catch { toast('Não foi possível acessar a câmera.', 'error'); }
};

const closeCamera = () => {
  app.cameraStream?.getTracks().forEach(t => t.stop());
  app.cameraStream = null;
  document.getElementById('cam-modal').classList.remove('active');
};

const captureAndAnalyze = async () => {
  const vid = document.getElementById('cam-vid'), canvas = document.getElementById('cap-canvas');
  canvas.width = vid.videoWidth; canvas.height = vid.videoHeight;
  canvas.getContext('2d').drawImage(vid, 0, 0);
  const base64 = canvas.toDataURL('image/jpeg', 0.82).split(',')[1];
  closeCamera();
  setFace('thinking'); setRespText('Analisando imagem…');
  try {
    const r = await callGeminiVision(base64, 'image/jpeg', 'Descreva o que você vê nesta imagem de forma natural em português.');
    app.history.push({ role: 'user', content: '[Imagem da câmera]' });
    app.history.push({ role: 'model', content: r });
    addMsgUI('user', '[Imagem da câmera]'); addMsgUI('sky', r);
    saveHist(); speak(r);
  } catch { speak('Não consegui analisar a imagem, Senhor. Tente novamente.'); }
};

// ── File Analysis ──────────────────────────────────────────────────────────────
const analyzeFile = async (file) => {
  if (!cfg.geminiKey) { toast('Configure a chave Gemini API para analisar arquivos.', 'error'); return; }
  setFace('thinking'); setRespText(`Analisando ${file.name}…`);
  try {
    let response;
    if (file.type.startsWith('image/')) {
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(file); });
      response = await callGeminiVision(b64, file.type, `Analise este arquivo "${file.name}" detalhadamente em português.`);
    } else if (file.type === 'text/plain') {
      const txt = await file.text();
      app.history.push({ role: 'user', content: `Analise o conteúdo deste arquivo "${file.name}": ${txt.substring(0, 4000)}` });
      response = await callGemini();
      app.history.push({ role: 'model', content: response });
      addMsgUI('user', `[Arquivo: ${file.name}]`); addMsgUI('sky', response);
      saveHist(); speak(response); return;
    } else { speak(`Formato não suportado diretamente. Posso analisar imagens e arquivos de texto, Senhor.`); return; }

    app.history.push({ role: 'user', content: `[Arquivo: ${file.name}]` });
    app.history.push({ role: 'model', content: response });
    addMsgUI('user', `[Arquivo: ${file.name}]`); addMsgUI('sky', response);
    saveHist(); speak(response);
  } catch { speak('Não consegui analisar o arquivo, Senhor.'); }
};

// ── Init ───────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  scheduleBlink();
  renderMemoryPanel();

  // Update session counter
  const mem = getMem();
  mem.sessions = (mem.sessions || 0) + 1;
  mem.lastSeen = new Date().toISOString().split('T')[0];
  saveMem(mem);

  // Populate settings fields
  document.getElementById('inp-name').value   = cfg.username;
  document.getElementById('inp-key').value    = cfg.geminiKey;
  document.getElementById('inp-el-key').value = cfg.elevenLabsKey;

  // Render existing history in UI
  app.history.forEach(h => addMsgUI(h.role === 'user' ? 'user' : 'sky', h.content));

  // Greeting
  const hr = new Date().getHours();
  const gr = hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite';
  const name = mem.userName || cfg.username;
  const returning = mem.sessions > 1 && name ? `Bem-vindo de volta, ${name}. ` : '';
  const ready = cfg.geminiKey ? 'Todos os sistemas operacionais.' : 'Configure a chave Gemini API para capacidades completas.';
  // Briefing matinal automático (uma vez por dia)
  const briefingKey = 'sky_last_briefing';
  const todayBrief  = new Date().toISOString().split('T')[0];
  if (cfg.geminiKey && localStorage.getItem(briefingKey) !== todayBrief) {
    localStorage.setItem(briefingKey, todayBrief);
    const pendingCount = typeof getTasks  === 'function' ? getTasks().filter(t => !t.done).length : 0;
    const habitCount   = typeof getHabits === 'function' ? getHabits().filter(h => !(h.dates||[]).includes(todayBrief)).length : 0;
    let briefing = `${gr}. ${returning}Sou Sky. `;
    if (pendingCount || habitCount) {
      if (pendingCount) briefing += `Você tem ${pendingCount} tarefa${pendingCount > 1 ? 's' : ''} pendente${pendingCount > 1 ? 's' : ''}. `;
      if (habitCount)   briefing += `${habitCount} hábito${habitCount > 1 ? 's' : ''} por fazer hoje. `;
    } else {
      briefing += 'Todos os sistemas operacionais. ';
    }
    briefing += 'Como posso ajudá-lo?';
    setTimeout(() => speak(briefing), 700);
  } else {
    setTimeout(() => speak(`${gr}. ${returning}Sou Sky. ${ready}`), 700);
  }

  // ── Microphone ──
  document.getElementById('btn-mic').addEventListener('click', () => app.isListening ? stopListening() : startListening());

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') { e.preventDefault(); app.isListening ? stopListening() : startListening(); }
    if (e.code === 'Escape') { stopListening(); stopSpeaking(); }
  });

  // ── Text input (fallback) ──
  const textInput = document.getElementById('text-input');
  const sendText = () => {
    const val = textInput.value.trim();
    if (!val) return;
    textInput.value = '';
    setUserSaid(`"${val}"`);
    processInput(val);
  };
  document.getElementById('btn-send').addEventListener('click', sendText);
  textInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendText(); });

  // ── Voice gender ──
  document.getElementById('btn-voice-male').addEventListener('click', () => {
    app.voiceGender = 'male';
    document.getElementById('btn-voice-male').classList.add('active');
    document.getElementById('btn-voice-female').classList.remove('active');
  });
  document.getElementById('btn-voice-female').addEventListener('click', () => {
    app.voiceGender = 'female';
    document.getElementById('btn-voice-female').classList.add('active');
    document.getElementById('btn-voice-male').classList.remove('active');
  });

  // ── Continuous ──
  document.getElementById('btn-continuous').addEventListener('click', () => {
    app.continuous = !app.continuous;
    document.getElementById('cont-label').textContent = `CONVERSA CONTÍNUA: ${app.continuous ? 'ON' : 'OFF'}`;
    document.getElementById('btn-continuous').classList.toggle('on', app.continuous);
    if (app.continuous && !app.isListening && !app.isSpeaking) startListening();
  });

  // ── Camera ──
  document.getElementById('btn-camera').addEventListener('click', openCamera);
  document.getElementById('btn-cam-close').addEventListener('click', closeCamera);
  document.getElementById('btn-capture').addEventListener('click', captureAndAnalyze);
  document.getElementById('cam-modal').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeCamera(); });

  // ── File ──
  document.getElementById('btn-file').addEventListener('click', () => { if (!cfg.geminiKey) { toast('Configure a chave Gemini API.', 'error'); return; } document.getElementById('file-input').click(); });
  document.getElementById('file-input').addEventListener('change', (e) => { const f = e.target.files[0]; if (f) { analyzeFile(f); e.target.value = ''; } });

  // ── Panels ──
  document.getElementById('btn-history').addEventListener('click', () => document.getElementById('history-panel').classList.toggle('open'));
  document.getElementById('btn-close-history').addEventListener('click', () => document.getElementById('history-panel').classList.remove('open'));

  document.getElementById('btn-memory').addEventListener('click', () => { renderMemoryPanel(); document.getElementById('memory-panel').classList.toggle('open'); });
  document.getElementById('btn-close-memory').addEventListener('click', () => document.getElementById('memory-panel').classList.remove('open'));

  document.getElementById('btn-clear-memory').addEventListener('click', () => {
    if (confirm('Apagar toda a memória de Sky? Ela esquecerá tudo que aprendeu sobre você.')) {
      saveMem(defaultMem()); renderMemoryPanel(); toast('Memória apagada.', 'info');
    }
  });

  // ── Settings (gear icon → navigate to settings view) ──
  document.getElementById('btn-settings').addEventListener('click', () => switchView('configuracoes'));

  // ── Init modules ──
  initSidebar();
  initChatTexto();
  initTarefas();
  initHabitos();
  initFinancas();
  initProjetos();
  initCalendario();
  initPersonalizacao();
  initConfiguracoes();
  initKnowledge();
});

// ══════════════════════════════════════════════════════════════════════════════
// SIDEBAR NAVIGATION
// ══════════════════════════════════════════════════════════════════════════════

const switchView = (id) => {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
  const view = document.getElementById(`view-${id}`);
  const item = document.querySelector(`.sb-item[data-view="${id}"]`);
  if (view) view.classList.add('active');
  if (item) item.classList.add('active');
  if (id === 'painel')       renderPainel();
  if (id === 'integracoes')  renderIntegracoes();
  if (id === 'tarefas')      renderTarefas();
  if (id === 'habitos')      renderHabitos();
  if (id === 'financas')     renderFinancas();
  if (id === 'projetos')     renderProjetos();
  if (id === 'analises')     renderAnalises();
  if (id === 'calendario')   renderCalendario();
  if (id === 'chat-texto')   syncChatTexto();
  if (id === 'configuracoes') populateConfiguracoes();
};

const initSidebar = () => {
  document.querySelectorAll('.sb-item').forEach(item => {
    item.addEventListener('click', () => switchView(item.dataset.view));
  });
};

// ══════════════════════════════════════════════════════════════════════════════
// PAINEL
// ══════════════════════════════════════════════════════════════════════════════

const renderPainel = () => {
  const mem   = getMem();
  const tasks = getTasks();
  const habits = getHabits();
  const today = new Date().toISOString().split('T')[0];

  const msgs = app.history.filter(h => {
    const d = h.ts ? h.ts.split('T')[0] : null;
    return d === today;
  }).length;

  document.getElementById('stat-msgs').textContent     = msgs;
  document.getElementById('stat-tasks').textContent    = tasks.filter(t => !t.done).length;
  document.getElementById('stat-habits').textContent   = habits.filter(h => (h.dates||[]).includes(today)).length;
  document.getElementById('stat-sessions').textContent = mem.sessions || 0;

  const container = document.getElementById('painel-msgs');
  container.innerHTML = '';
  const recent = [...app.history].slice(-6).reverse();
  if (recent.length === 0) {
    container.innerHTML = '<p class="pmsg">Nenhuma mensagem ainda. Vá para Chat IA Voz ou Texto.</p>';
    return;
  }
  recent.forEach(h => {
    const el = document.createElement('div');
    el.className = `pmsg ${h.role !== 'user' ? 'sky-msg' : ''}`;
    el.textContent = `${h.role !== 'user' ? 'Sky: ' : 'Você: '}${h.content.substring(0, 90)}${h.content.length > 90 ? '…' : ''}`;
    container.appendChild(el);
  });
};

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRAÇÕES
// ══════════════════════════════════════════════════════════════════════════════

const renderIntegracoes = () => {
  const geminiOk = !!cfg.geminiKey;
  const elevenOk = !!cfg.elevenLabsKey;

  document.getElementById('intg-gemini').textContent     = geminiOk ? 'Conectado' : 'Chave não configurada';
  document.getElementById('intg-eleven').textContent     = elevenOk ? 'Conectado' : 'Chave não configurada (opcional)';
  document.getElementById('intg-gemini-dot').textContent = '●';
  document.getElementById('intg-gemini-dot').className   = `intg-badge ${geminiOk ? 'ok' : 'err'}`;
  document.getElementById('intg-eleven-dot').textContent = '●';
  document.getElementById('intg-eleven-dot').className   = `intg-badge ${elevenOk ? 'ok' : 'err'}`;
};

// ══════════════════════════════════════════════════════════════════════════════
// CHAT IA TEXTO
// ══════════════════════════════════════════════════════════════════════════════

const textHistory = [];

const initChatTexto = () => {
  const send = () => {
    const input = document.getElementById('chat-texto-input');
    const text  = input.value.trim();
    if (!text) return;
    input.value = '';
    addChatBubble('user', text);
    textHistory.push({ role: 'user', content: text });
    processChatTexto();
  };
  document.getElementById('chat-texto-send').addEventListener('click', send);
  document.getElementById('chat-texto-input').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  document.getElementById('chat-texto-clear').addEventListener('click', () => {
    textHistory.length = 0;
    document.getElementById('chat-texto-msgs').innerHTML = '';
  });
};

const addChatBubble = (role, text, typing = false) => {
  const msgs = document.getElementById('chat-texto-msgs');
  const el = document.createElement('div');
  el.className = `chat-bubble ${role}${typing ? ' typing' : ''}`;
  el.textContent = text;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
  return el;
};

const syncChatTexto = () => {
  const msgs = document.getElementById('chat-texto-msgs');
  if (msgs.children.length === 0 && textHistory.length === 0) {
    addChatBubble('sky', 'Olá, Senhor. Como posso ajudá-lo por texto?');
  }
};

const processChatTexto = async () => {
  const el = addChatBubble('sky', '…', true);
  try {
    const response = await callGemini(textHistory);
    textHistory.push({ role: 'model', content: response });
    el.textContent = response;
    el.classList.remove('typing');
    const msgs = document.getElementById('chat-texto-msgs');
    msgs.scrollTop = msgs.scrollHeight;
  } catch {
    el.textContent = 'Desculpe, houve um erro. Verifique a chave API.';
    el.classList.remove('typing');
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// TAREFAS
// ══════════════════════════════════════════════════════════════════════════════

const TASKS_KEY = 'sky_tasks';
const getTasks  = () => { try { return JSON.parse(localStorage.getItem(TASKS_KEY) || '[]'); } catch { return []; } };
const saveTasks = (t) => localStorage.setItem(TASKS_KEY, JSON.stringify(t));

const initTarefas = () => {
  const add = () => {
    const input = document.getElementById('task-input');
    const text  = input.value.trim();
    if (!text) return;
    const tasks = getTasks();
    tasks.unshift({ id: Date.now().toString(), text, done: false });
    saveTasks(tasks); input.value = ''; renderTarefas();
  };
  document.getElementById('task-add-btn').addEventListener('click', add);
  document.getElementById('task-input').addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
  document.getElementById('task-filters').addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    document.querySelectorAll('#task-filters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTarefas();
  });
};

const renderTarefas = () => {
  const tasks  = getTasks();
  const filter = document.querySelector('#task-filters .filter-btn.active')?.dataset.filter || 'todas';
  const list   = filter === 'pendentes' ? tasks.filter(t => !t.done) : filter === 'concluidas' ? tasks.filter(t => t.done) : tasks;
  const el     = document.getElementById('task-list');
  el.innerHTML = '';
  if (list.length === 0) { el.innerHTML = '<p class="empty-state">Nenhuma tarefa aqui.</p>'; return; }
  list.forEach(task => {
    const div = document.createElement('div');
    div.className = `task-item${task.done ? ' done' : ''}`;
    div.innerHTML = `
      <button class="task-check" data-id="${task.id}">${task.done ? '✓' : ''}</button>
      <span class="task-text">${task.text}</span>
      <button class="task-del" data-id="${task.id}">✕</button>`;
    el.appendChild(div);
  });
  el.querySelectorAll('.task-check').forEach(b => b.addEventListener('click', () => {
    saveTasks(getTasks().map(t => t.id === b.dataset.id ? { ...t, done: !t.done } : t));
    renderTarefas();
  }));
  el.querySelectorAll('.task-del').forEach(b => b.addEventListener('click', () => {
    saveTasks(getTasks().filter(t => t.id !== b.dataset.id));
    renderTarefas();
  }));
};

// ══════════════════════════════════════════════════════════════════════════════
// HÁBITOS
// ══════════════════════════════════════════════════════════════════════════════

const HABITS_KEY = 'sky_habits';
const getHabits  = () => { try { return JSON.parse(localStorage.getItem(HABITS_KEY) || '[]'); } catch { return []; } };
const saveHabits = (h) => localStorage.setItem(HABITS_KEY, JSON.stringify(h));
const todayStr   = () => new Date().toISOString().split('T')[0];

const calcStreak = (dates = []) => {
  let streak = 0;
  const d = new Date(); d.setHours(0,0,0,0);
  while (dates.includes(d.toISOString().split('T')[0])) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
};

const initHabitos = () => {
  const add = () => {
    const name  = document.getElementById('habit-input').value.trim();
    const emoji = document.getElementById('habit-emoji').value.trim() || '⭐';
    if (!name) return;
    const habits = getHabits();
    habits.push({ id: Date.now().toString(), name, emoji, dates: [] });
    saveHabits(habits);
    document.getElementById('habit-input').value = '';
    document.getElementById('habit-emoji').value = '';
    renderHabitos();
  };
  document.getElementById('habit-add-btn').addEventListener('click', add);
  document.getElementById('habit-input').addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
};

const renderHabitos = () => {
  const habits = getHabits();
  const today  = todayStr();
  const el     = document.getElementById('habit-list');
  el.innerHTML = '';
  if (habits.length === 0) { el.innerHTML = '<p class="empty-state">Adicione seu primeiro hábito acima.</p>'; return; }
  habits.forEach(h => {
    const doneToday = (h.dates || []).includes(today);
    const streak    = calcStreak(h.dates);
    const div = document.createElement('div');
    div.className = `habit-item${doneToday ? ' done-today' : ''}`;
    div.innerHTML = `
      <span class="habit-emoji">${h.emoji}</span>
      <div class="habit-info">
        <div class="habit-name">${h.name}</div>
        <div class="habit-streak">${streak > 0 ? `🔥 ${streak} dia${streak !== 1 ? 's' : ''} seguido${streak !== 1 ? 's' : ''}` : 'Nenhuma sequência ainda'}</div>
      </div>
      <button class="habit-check-btn" data-id="${h.id}">${doneToday ? '✓' : '+'}</button>
      <button class="habit-del" data-id="${h.id}">✕</button>`;
    el.appendChild(div);
  });
  el.querySelectorAll('.habit-check-btn').forEach(b => b.addEventListener('click', () => {
    const habits = getHabits();
    const h = habits.find(x => x.id === b.dataset.id);
    if (!h) return;
    h.dates = h.dates || [];
    const today = todayStr();
    h.dates = h.dates.includes(today) ? h.dates.filter(d => d !== today) : [...h.dates, today];
    saveHabits(habits); renderHabitos();
  }));
  el.querySelectorAll('.habit-del').forEach(b => b.addEventListener('click', () => {
    saveHabits(getHabits().filter(h => h.id !== b.dataset.id));
    renderHabitos();
  }));
};

// ══════════════════════════════════════════════════════════════════════════════
// FINANÇAS
// ══════════════════════════════════════════════════════════════════════════════

const FIN_KEY   = 'sky_financas';
const getFin    = () => { try { return JSON.parse(localStorage.getItem(FIN_KEY) || '[]'); } catch { return []; } };
const saveFin   = (f) => localStorage.setItem(FIN_KEY, JSON.stringify(f));

const initFinancas = () => {
  const add = (type) => {
    const desc = document.getElementById('fin-desc').value.trim();
    const val  = parseFloat(document.getElementById('fin-val').value);
    if (!desc || isNaN(val) || val <= 0) { toast('Informe descrição e valor válido.', 'error'); return; }
    const fin = getFin();
    fin.unshift({ id: Date.now().toString(), desc, val, type, date: new Date().toLocaleDateString('pt-BR') });
    saveFin(fin);
    document.getElementById('fin-desc').value = '';
    document.getElementById('fin-val').value  = '';
    renderFinancas();
  };
  document.getElementById('fin-add-receita').addEventListener('click', () => add('rec'));
  document.getElementById('fin-add-despesa').addEventListener('click', () => add('des'));
};

const renderFinancas = () => {
  const fin     = getFin();
  const balance = fin.reduce((s, f) => f.type === 'rec' ? s + f.val : s - f.val, 0);
  document.getElementById('fin-balance').textContent = `R$ ${balance.toFixed(2).replace('.', ',')}`;
  document.getElementById('fin-balance').style.color = balance >= 0 ? '#22c55e' : '#f87171';

  const el = document.getElementById('fin-list');
  el.innerHTML = '';
  if (fin.length === 0) { el.innerHTML = '<p class="empty-state">Nenhuma transação ainda.</p>'; return; }
  fin.forEach(f => {
    const div = document.createElement('div');
    div.className = 'fin-item';
    div.innerHTML = `
      <span class="fin-type">${f.type === 'rec' ? '↑' : '↓'}</span>
      <div class="fin-info"><div class="fin-desc-text">${f.desc}</div><div class="fin-date">${f.date}</div></div>
      <span class="fin-amount ${f.type}">${f.type === 'rec' ? '+' : '−'} R$ ${f.val.toFixed(2).replace('.', ',')}</span>
      <button class="fin-del" data-id="${f.id}">✕</button>`;
    el.appendChild(div);
  });
  el.querySelectorAll('.fin-del').forEach(b => b.addEventListener('click', () => {
    saveFin(getFin().filter(f => f.id !== b.dataset.id));
    renderFinancas();
  }));
};

// ══════════════════════════════════════════════════════════════════════════════
// PROJETOS
// ══════════════════════════════════════════════════════════════════════════════

const PROJ_KEY  = 'sky_projetos';
const getProjetos = () => { try { return JSON.parse(localStorage.getItem(PROJ_KEY) || '[]'); } catch { return []; } };
const saveProjetos = (p) => localStorage.setItem(PROJ_KEY, JSON.stringify(p));

const initProjetos = () => {
  const add = () => {
    const name = document.getElementById('proj-input').value.trim();
    const desc = document.getElementById('proj-desc').value.trim();
    if (!name) return;
    const projs = getProjetos();
    projs.unshift({ id: Date.now().toString(), name, desc });
    saveProjetos(projs);
    document.getElementById('proj-input').value = '';
    document.getElementById('proj-desc').value  = '';
    renderProjetos();
  };
  document.getElementById('proj-add-btn').addEventListener('click', add);
  document.getElementById('proj-input').addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
};

const renderProjetos = () => {
  const projs = getProjetos();
  const el    = document.getElementById('proj-list');
  el.innerHTML = '';
  if (projs.length === 0) { el.innerHTML = '<p class="empty-state">Nenhum projeto ainda.</p>'; return; }
  projs.forEach(p => {
    const div = document.createElement('div');
    div.className = 'proj-card';
    div.innerHTML = `
      <button class="proj-del" data-id="${p.id}">✕</button>
      <div class="proj-card-name">${p.name}</div>
      <div class="proj-card-desc">${p.desc || 'Sem descrição.'}</div>`;
    el.appendChild(div);
  });
  el.querySelectorAll('.proj-del').forEach(b => b.addEventListener('click', () => {
    saveProjetos(getProjetos().filter(p => p.id !== b.dataset.id));
    renderProjetos();
  }));
};

// ══════════════════════════════════════════════════════════════════════════════
// CALENDÁRIO
// ══════════════════════════════════════════════════════════════════════════════

let calDate = new Date();

const initCalendario = () => {
  document.getElementById('cal-prev').addEventListener('click', () => {
    calDate = new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1);
    renderCalendario();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    calDate = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1);
    renderCalendario();
  });
};

const renderCalendario = () => {
  const year  = calDate.getFullYear();
  const month = calDate.getMonth();
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  document.getElementById('cal-title').textContent = `${months[month]} ${year}`;

  const tasks     = getTasks();
  const taskDates = new Set(tasks.map(t => t.date).filter(Boolean));

  const grid    = document.getElementById('cal-grid');
  grid.innerHTML = '';

  const firstDay = new Date(year, month, 1).getDay();
  const daysIn   = new Date(year, month + 1, 0).getDate();
  const today    = new Date();
  const todayStr2 = today.toISOString().split('T')[0];

  for (let i = 0; i < firstDay; i++) {
    const prev = new Date(year, month, -firstDay + i + 1);
    const el = document.createElement('div');
    el.className = 'cal-day other-month';
    el.textContent = prev.getDate();
    grid.appendChild(el);
  }
  for (let d = 1; d <= daysIn; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const el = document.createElement('div');
    el.className = `cal-day${dateStr === todayStr2 ? ' today' : ''}`;
    el.innerHTML = `${d}${taskDates.has(dateStr) ? '<div class="cal-dot"></div>' : ''}`;
    grid.appendChild(el);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// ANÁLISES
// ══════════════════════════════════════════════════════════════════════════════

const renderAnalises = () => {
  const tasks  = getTasks();
  const habits = getHabits();
  const fin    = getFin();
  const mem    = getMem();
  const today  = todayStr();

  const data = [
    { label: 'Mensagens enviadas',    val: app.history.filter(h => h.role === 'user').length,         max: 100 },
    { label: 'Tarefas concluídas',    val: tasks.filter(t => t.done).length,                          max: Math.max(tasks.length, 1) },
    { label: 'Hábitos hoje',          val: habits.filter(h => (h.dates||[]).includes(today)).length,  max: Math.max(habits.length, 1) },
    { label: 'Sessões totais',        val: mem.sessions || 0,                                         max: Math.max(mem.sessions || 1, 10) },
    { label: 'Receitas registradas',  val: fin.filter(f => f.type === 'rec').length,                  max: Math.max(fin.length, 1) },
    { label: 'Fatos aprendidos',      val: (mem.facts || []).length,                                  max: Math.max((mem.facts||[]).length, 1) },
  ];

  const body = document.getElementById('analises-body');
  body.innerHTML = '';
  data.forEach(({ label, val, max }) => {
    const pct = Math.min(Math.round((val / max) * 100), 100);
    const row = document.createElement('div');
    row.className = 'analise-row';
    row.innerHTML = `
      <span class="analise-label">${label}</span>
      <div class="analise-bar-wrap"><div class="analise-bar" style="width:${pct}%"></div></div>
      <span class="analise-val">${val}</span>`;
    body.appendChild(row);
  });
};

// ══════════════════════════════════════════════════════════════════════════════
// PERSONALIZAÇÃO
// ══════════════════════════════════════════════════════════════════════════════

const THEME_KEY = 'sky_theme';

const applyTheme = (accent, hi) => {
  document.documentElement.style.setProperty('--accent', accent);
  document.documentElement.style.setProperty('--accent-hi', hi);
  localStorage.setItem(THEME_KEY, JSON.stringify({ accent, hi }));
};

const initPersonalizacao = () => {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(THEME_KEY)); } catch { return null; } })();
  if (saved) {
    applyTheme(saved.accent, saved.hi);
    document.querySelectorAll('.swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.accent === saved.accent);
    });
  }

  document.getElementById('color-swatches').addEventListener('click', e => {
    const sw = e.target.closest('.swatch');
    if (!sw) return;
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    sw.classList.add('active');
    applyTheme(sw.dataset.accent, sw.dataset.hi);
  });

  document.getElementById('prs-voice-male').addEventListener('click', () => {
    app.voiceGender = 'male';
    document.getElementById('prs-voice-male').classList.add('active');
    document.getElementById('prs-voice-female').classList.remove('active');
    document.getElementById('btn-voice-male').classList.add('active');
    document.getElementById('btn-voice-female').classList.remove('active');
  });
  document.getElementById('prs-voice-female').addEventListener('click', () => {
    app.voiceGender = 'female';
    document.getElementById('prs-voice-female').classList.add('active');
    document.getElementById('prs-voice-male').classList.remove('active');
    document.getElementById('btn-voice-female').classList.add('active');
    document.getElementById('btn-voice-male').classList.remove('active');
  });

  document.getElementById('prs-save-name').addEventListener('click', () => {
    const name = document.getElementById('prs-name').value.trim();
    if (!name) return;
    cfg.username = name; saveCfg();
    const mem = getMem(); mem.userName = name; saveMem(mem);
    toast(`Nome salvo: ${name}`, 'success');
  });

  const mem = getMem();
  if (mem.userName) document.getElementById('prs-name').value = mem.userName;
};

// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÕES
// ══════════════════════════════════════════════════════════════════════════════

const populateConfiguracoes = () => {
  document.getElementById('cfg-name').value   = cfg.username || '';
  document.getElementById('cfg-key').value    = cfg.geminiKey || '';
  document.getElementById('cfg-el-key').value = cfg.elevenLabsKey || '';
};

const initConfiguracoes = () => {
  document.getElementById('cfg-save').addEventListener('click', () => {
    cfg.username      = document.getElementById('cfg-name').value.trim();
    cfg.geminiKey     = document.getElementById('cfg-key').value.trim();
    cfg.elevenLabsKey = document.getElementById('cfg-el-key').value.trim();
    saveCfg(); toast('Configurações salvas.', 'success');
  });
  document.getElementById('cfg-clear-mem').addEventListener('click', () => {
    if (confirm('Apagar toda a memória de Sky?')) {
      saveMem(defaultMem()); renderMemoryPanel(); toast('Memória apagada.', 'info');
    }
  });
};
