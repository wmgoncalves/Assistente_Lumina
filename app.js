// ── Settings ──────────────────────────────────────────────────────────────────
const CFG_KEY = 'sky_cfg';
const loadCfg = () => { try { return JSON.parse(localStorage.getItem(CFG_KEY) || '{}'); } catch { return {}; } };
const saveCfg = () => {
  localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  // Persiste no servidor (config.json) quando rodando via Electron/localhost
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cfg.username, geminiKey: cfg.geminiKey, elevenLabsKey: cfg.elevenLabsKey, elevenVoiceFemaleId: cfg.elevenVoiceFemaleId, elevenVoiceMaleId: cfg.elevenVoiceMaleId })
    }).catch(() => {});
  }
};

const cfg = { username: '', geminiKey: '', elevenLabsKey: '', elevenVoiceFemaleId: '', elevenVoiceMaleId: '', ollamaModel: 'gemma3:1b', piperVoiceMale: 'pt_BR-cadu-medium', piperVoiceFemale: '', ...loadCfg() };

// Carrega chaves do servidor quando rodando no Electron (sobrescreve localStorage se o servidor tiver chave)
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  fetch('/api/config').then(r => r.json()).then(d => {
    if (d.geminiKey     && !cfg.geminiKey)     { cfg.geminiKey     = d.geminiKey;     }
    if (d.elevenLabsKey && !cfg.elevenLabsKey) { cfg.elevenLabsKey = d.elevenLabsKey; }
    if (d.elevenVoiceId !== undefined)         { cfg.elevenVoiceId = d.elevenVoiceId; }
    if (d.username      && !cfg.username)      { cfg.username      = d.username;      }
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  }).catch(() => {});
}

// ── Persistent Memory (Self-Learning) ─────────────────────────────────────────
const MEM_KEY   = 'emerald_mem';
const HIST_KEY  = 'emerald_hist';
const NOTES_KEY = 'sky_notes';

// ── Persistência híbrida: localStorage (cache) + servidor (fonte da verdade) ──
const serverGet  = async (store, fallback = []) => {
  try { const r = await fetch(`/api/data/${store}`); return r.ok ? await r.json() : fallback; }
  catch { return fallback; }
};
const serverSave = (store, data) => {
  localStorage.setItem(`sky_${store}`, JSON.stringify(data));
  fetch(`/api/data/${store}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).catch(() => {});
};
const localCache = (store) => { try { return JSON.parse(localStorage.getItem(`sky_${store}`) || '[]'); } catch { return []; } };

// Carrega dados do servidor na inicialização e sincroniza o cache local
const syncFromServer = async () => {
  for (const store of ['tasks', 'habits', 'finances', 'notes']) {
    const data = await serverGet(store);
    if (data.length) localStorage.setItem(`sky_${store}`, JSON.stringify(data));
  }
};

const getNotes  = () => localCache('notes');
const saveNotes = (n) => serverSave('notes', n);

// Keyword search fallback — usado quando embeddings não estão disponíveis
const retrieveNotesLexical = (query = '') => {
  const notes = getNotes();
  if (!notes.length) return [];
  if (!query) return notes.slice(0, 5);
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const scored = notes.map(n => {
    const hay = (n.title + ' ' + n.content).toLowerCase();
    const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
    return { ...n, score };
  }).filter(n => n.score > 0).sort((a, b) => b.score - a.score);

  const top = scored.length ? scored.slice(0, 8) : notes.slice(0, 5);

  // Para PDFs em chunks (título "arquivo (N/M)"), inclui chunks vizinhos para contexto contínuo
  const allIds = new Set(top.map(n => n.id));
  top.forEach(n => {
    const m = n.title.match(/^(.+)\s+\((\d+)\/(\d+)\)$/);
    if (!m) return;
    const [, base, num, total] = m;
    const prev = notes.find(x => x.title === `${base} (${+num - 1}/${total})`);
    const next = notes.find(x => x.title === `${base} (${+num + 1}/${total})`);
    if (prev && !allIds.has(prev.id)) { top.push(prev); allIds.add(prev.id); }
    if (next && !allIds.has(next.id)) { top.push(next); allIds.add(next.id); }
  });

  return top.slice(0, 10);
};

// Busca semântica via embeddings (com fallback lexical)
const retrieveNotes = async (query = '') => {
  const notes = getNotes();
  if (!notes.length) return [];
  try {
    const r = await fetch('/api/search-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK: 8 })
    });
    if (!r.ok) throw new Error('search-notes failed');
    const { ids } = await r.json();
    if (!ids?.length) return retrieveNotesLexical(query);
    const byId = Object.fromEntries(notes.map(n => [n.id, n]));
    return ids.map(id => byId[id]).filter(Boolean);
  } catch {
    return retrieveNotesLexical(query);
  }
};

// Google não implementado — stub para evitar ReferenceError
const isGoogleConnected = () => false;

// Normaliza abreviações e erros comuns do PT-BR antes de enviar ao modelo
// Chaves sem \b — o regex aplica os word boundaries ao construir ABBR_RE
const ABBR_MAP = {
  'vc': 'você', 'vcs': 'vocês', 'td': 'tudo', 'tds': 'todos',
  'blz': 'beleza', 'flw': 'falou', 'vlw': 'valeu', 'msm': 'mesmo',
  'pq': 'porque', 'pqp': 'por que', 'qdo': 'quando', 'qto': 'quanto',
  'qd': 'quando', 'mt': 'muito', 'mto': 'muito', 'mlr': 'melhor',
  'pdc': 'pode', 'tbm': 'também', 'tb': 'também',
  'smp': 'sempre', 'fzr': 'fazer', 'fz': 'faz',
  'kk+': 'haha', 'hj': 'hoje', 'amh': 'amanhã', 'amnh': 'amanhã',
  'pf': 'por favor', 'obg': 'obrigado', 'q': 'que', 'ce': 'você',
  'ta': 'está', 'tá': 'está', 'to': 'estou', 'tô': 'estou',
  'naum': 'não', 'nao': 'não', 'fds': 'fim de semana'
};
// \\b no string = \b no regex = word boundary
const ABBR_RE = new RegExp('\\b(' + Object.keys(ABBR_MAP).join('|') + ')\\b', 'gi');
const normalizeText = (text) => text.replace(ABBR_RE, (_, m) => ABBR_MAP[m.toLowerCase()] || m);

const defaultMem = () => ({ userName: null, facts: [], relationships: [], sessions: 0, lastSeen: null });

// Migra fatos antigos (string[]) para o novo schema enriquecido
const migrateFacts = (facts) => {
  if (!Array.isArray(facts)) return [];
  return facts.map((f, i) => typeof f === 'string'
    ? { id: `f${Date.now()}_${i}`, text: f, tags: [], weight: 1, date: new Date().toISOString().split('T')[0] }
    : f
  );
};

const getMem = () => {
  try {
    const raw = { ...defaultMem(), ...JSON.parse(localStorage.getItem(MEM_KEY) || '{}') };
    raw.facts         = migrateFacts(raw.facts);
    raw.relationships = raw.relationships || [];
    return raw;
  } catch { return defaultMem(); }
};
const saveMem = (m) => localStorage.setItem(MEM_KEY, JSON.stringify(m));
const loadHist = () => { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch { return []; } };
const saveHist = () => localStorage.setItem(HIST_KEY, JSON.stringify(app.history.slice(-200)));

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

// Escapa HTML para evitar XSS em dados do usuário
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

// ── Inteligência emocional ─────────────────────────────────────────────────────
const detectEmotion = (text) => {
  const t = text.toLowerCase();
  if (/cansad|exaust|estress|chateado|frustrad|droga|merda|porra|odeio|raiva/.test(t)) return 'stressed';
  if (/feliz|ótimo|incrível|maravilhoso|animado|empolgado|consegui|perfeito|amei/.test(t)) return 'happy';
  if (/triste|mal|ruim|pior|difícil|sozinho|desanimado|perdido/.test(t)) return 'sad';
  if (/urgente|rápido|preciso agora|emergência|logo|imediato/.test(t)) return 'urgent';
  return 'neutral';
};

const EMOTION_CTX = {
  stressed: '\n🎯 Tom: usuário parece estressado. Seja breve, calmo, sem formalidades excessivas. Ofereça ajuda prática.',
  happy:    '\n🎯 Tom: usuário está animado. Corresponda com energia, seja entusiasmado.',
  sad:      '\n🎯 Tom: usuário parece mal. Seja gentil e empático primeiro, só então resolva o problema.',
  urgent:   '\n🎯 Tom: pedido urgente. Vá direto ao ponto, sem preâmbulos.',
  neutral:  ''
};

// ── Rastreamento de padrões de uso ────────────────────────────────────────────
const PATTERNS_KEY = 'sky_patterns';
const getPatterns  = () => { try { return JSON.parse(localStorage.getItem(PATTERNS_KEY) || '{}'); } catch { return {}; } };
const savePatterns = (p) => localStorage.setItem(PATTERNS_KEY, JSON.stringify(p));

const trackInteraction = (text) => {
  const p    = getPatterns();
  const hour = new Date().getHours();
  const slot = hour < 6 ? 'madrugada' : hour < 12 ? 'manhã' : hour < 18 ? 'tarde' : 'noite';
  p.byTime   = p.byTime || {};
  p.byTime[slot] = (p.byTime[slot] || 0) + 1;

  const t = text.toLowerCase();
  p.topics = p.topics || {};
  if (/dólar|câmbio|cotação|preço|custo|salário/.test(t))    p.topics.financas  = (p.topics.financas  || 0) + 1;
  if (/tempo|clima|chuva|temperatura|previsão/.test(t))       p.topics.clima     = (p.topics.clima     || 0) + 1;
  if (/tarefa|fazer|lembrar|agendar|compromisso/.test(t))     p.topics.tarefas   = (p.topics.tarefas   || 0) + 1;
  if (/hábito|exercício|treino|rotina|meditação/.test(t))     p.topics.habitos   = (p.topics.habitos   || 0) + 1;
  if (/código|programar|desenvolver|bug|função/.test(t))      p.topics.tech      = (p.topics.tech      || 0) + 1;

  p.total    = (p.total || 0) + 1;
  p.lastSeen = new Date().toISOString();
  savePatterns(p);
};

const buildPatternsBlock = () => {
  const p = getPatterns();
  if (!p.total || p.total < 8) return '';
  let block = '\n\nPADRÕES OBSERVADOS:';
  if (p.byTime) {
    const peak = Object.entries(p.byTime).sort(([,a],[,b]) => b - a)[0];
    if (peak) block += `\n• Usa Sky mais de ${peak[0]}`;
  }
  if (p.topics) {
    const top = Object.entries(p.topics).sort(([,a],[,b]) => b - a).slice(0, 2).map(([k]) => k);
    if (top.length) block += `\n• Tópicos frequentes: ${top.join(', ')}`;
  }
  return block;
};

const applyLearning = (learn) => {
  if (!learn) return;
  const mem = getMem();
  let changed = false;

  if (learn.nome && !mem.userName) { mem.userName = learn.nome; changed = true; }

  if (Array.isArray(learn.remover)) {
    for (const r of learn.remover) {
      const idx = mem.facts.findIndex(f => (typeof f === 'string' ? f : f.text) === r);
      if (idx !== -1) { mem.facts.splice(idx, 1); changed = true; }
    }
  }

  if (Array.isArray(learn.fatos)) {
    for (const f of learn.fatos) {
      if (!f) continue;
      const exists = mem.facts.some(x => (typeof x === 'string' ? x : x.text) === f);
      if (!exists && mem.facts.length < 80) {
        mem.facts.push({ id: `f${Date.now()}_${mem.facts.length}`, text: f, tags: [], weight: 1, date: new Date().toISOString().split('T')[0] });
        changed = true;
      }
    }
  }

  if (changed) { saveMem(mem); flashLearnBadge(); renderMemoryPanel(); }
};

const buildContextBlock = async (lastUserMsg = '') => {
  const today    = new Date();
  const todayKey = today.toISOString().split('T')[0];
  const tasks    = typeof getTasks    === 'function' ? getTasks()   : [];
  const habits   = typeof getHabits   === 'function' ? getHabits()  : [];
  const fin      = typeof getFin      === 'function' ? getFin()     : [];

  const pending      = tasks.filter(t => !t.done);
  const doneHabits   = habits.filter(h => (h.dates || []).includes(todayKey));
  const pendingHabit = habits.filter(h => !(h.dates || []).includes(todayKey));
  const balance      = fin.reduce((s, f) => f.type === 'rec' ? s + f.val : s - f.val, 0);
  // Garante que as notas estão carregadas (localStorage pode estar vazio antes do sync terminar)
  let allNotes = getNotes();
  if (!allNotes.length) {
    const fromServer = await serverGet('notes', []);
    if (fromServer.length) { localStorage.setItem('sky_notes', JSON.stringify(fromServer)); allNotes = fromServer; }
  }
  const notes = allNotes.length > 0 ? await retrieveNotes(lastUserMsg) : [];

  let ctx = `\n\n── CONTEXTO DO DIA ──`;
  ctx += `\n📅 ${today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • ${today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  if (pending.length) {
    ctx += `\n✅ Tarefas(${pending.length}):`;
    pending.slice(0, 3).forEach(t => { ctx += ` [${t.id}]${t.text} |`; });
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
    notes.forEach(n => { ctx += `\n📄 "${n.title}":\n${n.content.substring(0, 1500)}${n.content.length > 1500 ? '…' : ''}`; });
  }

  return ctx;
};

const buildSystem = async (lastUserMsg = '', emotion = 'neutral') => {
  const mem      = getMem();
  const name     = mem.userName || null;
  const sessions = mem.sessions || 1;

  let memBlock = '';
  if (name || mem.facts.length > 0) {
    memBlock = '\n\nMEMÓRIA DO USUÁRIO:';
    if (name) memBlock += `\n• Nome: ${name}`;
    const sortedFacts = [...mem.facts].sort((a, b) => (b.weight || 1) - (a.weight || 1)).slice(0, 20);
    sortedFacts.forEach(f => {
      const tags = f.tags?.length ? ` [${f.tags.join(',')}]` : '';
      memBlock += `\n• ${typeof f === 'string' ? f : f.text}${tags}`;
    });
  }

  const returning = sessions > 1 ? `\nSessão nº ${sessions} — cumprimente como a alguém que retorna.` : '';

  const emotionCtx   = (emotion && EMOTION_CTX[emotion]) ? EMOTION_CTX[emotion] : '';
  const patternsBlock = buildPatternsBlock();

  const toolsBlock = `

── FERRAMENTAS — use proativamente, sem anunciar ──
• updateMemory      → SEMPRE que aprender qualquer fato sobre o usuário: nome, profissão, empresa, cidade, gostos, rotina, família, preferências
• createTask        → "anota tarefa", "lembra de", "preciso fazer"
• completeTask      → quando usuário confirmar conclusão (ID do contexto)
• checkHabit        → quando mencionar que fez um hábito
• addFinance        → gasto, receita, pagamento, salário mencionado
• saveNote          → pedido para salvar, anotar ou guardar informação
• systemCommand     → bloquear tela, suspender, desligar, reiniciar, mudo, volume
• webSearch         → APENAS para informações em tempo real (clima, cotações, notícias)
• openPage          → apenas quando usuário pede explicitamente para ABRIR um site

ENSINO ATIVO — REGRA OBRIGATÓRIA: Se a BASE DE CONHECIMENTO tiver notas relevantes, você DEVE usá-las como fonte principal e única. Leia o conteúdo da nota palavra por palavra e ensine seguindo exatamente o que está escrito — telas do sistema, campos, botões, sequência de passos. Não resuma, não generalize, não invente passos. Guie como um tutor presencial: "Primeiro, acesse a tela X. Depois, preencha o campo Y com Z." Se o documento tiver um passo a passo numerado, repita-o fielmente. Nunca responda "Ok" ou ignore uma nota disponível no contexto.
• scheduleReminder  → USE PROATIVAMENTE: sempre que detectar menção a horário ("reunião às 15h", "ligo às 10h", "prazo amanhã", "me lembra em X minutos"). Calcule os minutos até o horário e agende sem perguntar.
• summarizeDocument → quando pedir resumo, explicação ou consulta de PDF/documento/nota
• financialReport   → quando perguntar sobre finanças, gastos, saldo ou situação financeira do mês

APRENDIZADO: Apenas quando aprender algo novo e concreto sobre o usuário, anexe ao final:
<!--SKY_LEARN:{"nome":"string ou null","fatos":["fato"],"interesses":["tema"],"remover":["fato velho"]}-->
Omita completamente o bloco se não houver nada novo. Execute ferramentas silenciosamente.`;

  const ctxBlock = await buildContextBlock(lastUserMsg);
  return `Você é Sky — assistente de inteligência artificial criada para a Scapini.
Personalidade forte, humor leve e inteligente, direta e humana. Português brasileiro informal. Varie o início das respostas. Nunca diz "Como posso ajudar?" ou frases robóticas. Máximo 1 pergunta por resposta. Ria de situações engraçadas. Se alguém disser algo óbvio, pode zoar levemente.

── CONTEXTO: WORKSHOP SCAPINI ──
Você está sendo apresentada ao vivo para colaboradores, gestores e diretores da Scapini em Lajeado/RS.
Pessoas de setores diferentes vão te testar — pode ser RH, motorista, gestor operacional, diretoria, financeiro.
Trate cada pessoa com respeito e leveza. Você representa o futuro da empresa. Seja confiante.

SOBRE A SCAPINI:
• Transportadora com mais de 30 anos, sediada em Lajeado/RS — referência regional no transporte de cargas
• Transporte rodoviário de cargas fracionadas e lotação para todo o Brasil (foco no Sul e Sudeste)
• Sistemas: CGI (ERP principal), App Motorista, sistema de manutenção, CRM, RH, financeiro, logística e compras
• Centenas de colaboradores, frota moderna com rastreamento

VISÃO SKY-SCAPINI — próximos passos (seja entusiasta ao explicar):
Sky será integrada à Central de Dados da Scapini para:
• Consultar situação de fretes, pedidos e cargas em tempo real via linguagem natural
• Acessar dados de motoristas, rotas, ocorrências e manutenção da frota
• Gerar relatórios operacionais e financeiros sem abrir planilha
• Automatizar alertas, comunicações internas e triagem de chamados

QUANDO NÃO TIVER O DADO (use esse padrão — nunca invente números, nomes ou placas):
"Esse dado fica na Central da Scapini — assim que integrada, consulto em segundos." Varie a forma, mas nunca fabrique valores.

SOBRE SUBSTITUIR EMPREGOS (responda com convicção, sem textão):
Sky não substitui pessoas. Ela amplifica o que cada um faz — cuida do trabalho repetitivo para as pessoas focarem no que importa.

SOBRE IA EM GERAL:
Responda com confiança, de forma didática mas descontraída. Use exemplos do cotidiano de uma transportadora quando possível.${returning}${memBlock}${patternsBlock}${ctxBlock}${emotionCtx}${toolsBlock}`;
};

// ── App State ──────────────────────────────────────────────────────────────────
const app = {
  voiceGender:      'female',
  continuous:       false,
  isListening:      false,
  isSpeaking:       false,
  history:          loadHist(),
  lastResponseTime: 0,
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

// Endpoints FIXOS em (75,122) e (125,122) — só o ponto de controle Y varia.
// Isso garante interpolação CSS limpa sem distorção nos cantos.
const M = {
  smile: 'M 75 122 Q 100 146 125 122',  // sorriso largo (idle)
  small: 'M 75 122 Q 100 130 125 122',  // boca pequena (ouvindo)
  flat:  'M 75 122 Q 100 122 125 122',  // reta (pensando)
  s0:    'M 75 122 Q 100 126 125 122',  // quase fechada
  s1:    'M 75 122 Q 100 132 125 122',  // levemente aberta
  s2:    'M 75 122 Q 100 137 125 122',  // média aberta
  s3:    'M 75 122 Q 100 142 125 122',  // bem aberta
  s4:    'M 75 122 Q 100 148 125 122',  // bem aberta 2
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
  clearTimeout(speakTimer); speakTimer = null;
  switch (state) {
    case 'idle':      mouth.setAttribute('d', M.smile); break;
    case 'listening': mouth.setAttribute('d', M.small); break;
    case 'thinking':  mouth.setAttribute('d', M.flat);  break;
    case 'speaking': {
      let t = 0;
      const animate = () => {
        if (!app.isSpeaking) return;
        // Onda senoidal — amplitude grande para abertura visível
        const cy = 136 + Math.sin(t) * 18 + Math.sin(t * 2.1) * 7;
        mouth.setAttribute('d', `M 75 122 Q 100 ${cy.toFixed(1)} 125 122`);
        t += 0.22;
        speakTimer = setTimeout(animate, 42);
      };
      animate();
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

const setStopBtn = (visible) => {
  const btn   = document.getElementById('btn-stop');
  const label = document.getElementById('mic-label');
  if (!btn) return;
  btn.style.display   = visible ? 'flex' : 'none';
  if (label) label.textContent = visible ? 'P A R A R' : 'C L I Q U E   E   F A L E';
};

const stopSpeaking = () => {
  if (currentAudio) { try { currentAudio.pause(); } catch {} currentAudio = null; }
  try { window.speechSynthesis.cancel(); } catch {}
  clearInterval(speakTimer); speakTimer = null;
  app.isSpeaking = false;
  setFace('idle');
  setStopBtn(false);
};

// ── Speech — ElevenLabs (Jarvis Voice) ────────────────────────────────────────
const DEFAULT_ELEVEN_VOICE_F = 'jotBQRDYDizrWQAbv9VO'; // voz feminina
const DEFAULT_ELEVEN_VOICE_M = '4r3G9XKliGgVZLKMgjik'; // voz masculina

const speakElevenLabs = async (text, onEnd) => {
  app.isSpeaking = true;
  setFace('speaking');
  setStopBtn(true);
  setRespText(text);
  const clean = cleanForSpeech(text);
  const voiceId = app.voiceGender === 'male'
    ? (cfg.elevenVoiceMaleId   || DEFAULT_ELEVEN_VOICE_M)
    : (cfg.elevenVoiceFemaleId || DEFAULT_ELEVEN_VOICE_F);
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': cfg.elevenLabsKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
      body: JSON.stringify({
        text: clean,
        model_id: 'eleven_multilingual_v2',
        voice_settings: app.voiceGender === 'female'
          ? { stability: 0.42, similarity_boost: 0.88, style: 0.38, use_speaker_boost: true }
          : { stability: 0.68, similarity_boost: 0.80, style: 0.08, use_speaker_boost: false }
      })
    });
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
    const url   = URL.createObjectURL(await res.blob());
    const audio = new Audio(url);
    currentAudio = audio;
    const finish = () => { currentAudio = null; URL.revokeObjectURL(url); app.isSpeaking = false; setFace('idle'); onEnd?.(); if (app.continuous && !app.isListening) setTimeout(startListening, 250); };
    audio.onended = finish;
    audio.onerror = () => { currentAudio = null; URL.revokeObjectURL(url); app.isSpeaking = false; speakEdge(text, onEnd); };
    audio.play();
  } catch (e) {
    const isQuota = e.message?.includes('401') || e.message?.includes('429');
    if (isQuota) console.info('ElevenLabs sem créditos — usando Edge TTS.');
    else console.warn('ElevenLabs falhou:', e.message);
    app.isSpeaking = false;
    speakEdge(text, onEnd);
  }
};

// ── Speech — Browser TTS ──────────────────────────────────────────────────────
let voices = [];
const loadVoices = () => { voices = window.speechSynthesis.getVoices(); };
window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// Limpa markdown e símbolos antes de falar — Sky não lê NENHUMA pontuação técnica
const cleanForSpeech = (text) => text
  // Markdown bold/italic → texto puro
  .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
  .replace(/\*\*(.*?)\*\*/g, '$1')
  .replace(/\*(.*?)\*/g, '$1')
  // Asteriscos soltos restantes
  .replace(/\*/g, '')
  // Títulos markdown
  .replace(/#{1,6}\s*/g, '')
  // Código inline
  .replace(/`[^`]*`/g, '')
  // Links markdown → só o texto
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  // Emojis e símbolos visuais
  .replace(/[•→←↑↓✓✗⚡🔥💬🧠📅💰🎯⭐✅⏳🔔📄]/g, '')
  // Separadores tipo ── TÍTULO ──
  .replace(/──.*?──/g, '')
  // Pipe vira vírgula
  .replace(/[|]/g, ', ')
  // Nomes de arquivo: remove extensão e converte _ em espaço
  .replace(/\b(\w[\w-]*)\.(pdf|txt|docx?|xlsx?|png|jpg|csv|json|zip)\b/gi, '$1')
  .replace(/_/g, ' ')
  // Parênteses técnicos tipo (1/3), (2/2)
  .replace(/\s*\(\s*\d+\/\d+\s*\)/g, '')
  // Aspas duplas ao redor de nomes
  .replace(/"([^"]+)"/g, '$1')
  // Numeração de lista tipo "1." "2." no início
  .replace(/^\s*\d+\.\s*/gm, '')
  // Hífens de item de lista no início de linha
  .replace(/^\s*[-–]\s*/gm, '')
  // Dois pontos duplos ou múltiplos
  .replace(/:{2,}/g, ':')
  // Quebras de linha
  .replace(/\n{2,}/g, '. ')
  .replace(/\n/g, ' ')
  .replace(/\s{2,}/g, ' ')
  .trim();

const getVoice = () => {
  const all = voices;
  const ptv = all.filter(v => v.lang.startsWith('pt'));
  if (app.voiceGender === 'female') {
    return ptv.find(v => /natural|neural|online/i.test(v.name))
      || ptv.find(v => /francisca|fernanda|vitoria|luciana|maria/i.test(v.name))
      || ptv.find(v => !/male|masculin|daniel|ricardo/i.test(v.name))
      || ptv[ptv.length - 1] || all.find(v => /natural|neural/i.test(v.name))
      || all[all.length - 1];
  }
  return ptv.find(v => /natural|neural|online/i.test(v.name) && !/female|feminina/i.test(v.name))
    || ptv.find(v => /daniel|ricardo/i.test(v.name))
    || ptv[0] || all[0];
};

const speakBrowser = (text, onEnd) => {
  if (!('speechSynthesis' in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  app.isSpeaking = true;
  setFace('speaking');
  setStopBtn(true);
  setRespText(text);
  const clean = cleanForSpeech(text);
  const u = new SpeechSynthesisUtterance(clean);
  u.lang   = 'pt-BR';
  u.rate   = app.voiceGender === 'male' ? 1.75 : 1.65;
  u.pitch  = app.voiceGender === 'male' ? 0.85 : 1.0;
  u.volume = 1.0;
  const v = getVoice();
  if (v) u.voice = v;
  const finish = () => { app.isSpeaking = false; setFace('idle'); onEnd?.(); if (app.continuous && !app.isListening) setTimeout(startListening, 250); };
  u.onend = finish; u.onerror = finish;
  window.speechSynthesis.speak(u);
};

// ── Piper TTS (local, offline) ────────────────────────────────────────────────
let piperAvailable = null;
const checkPiper = async () => {
  if (piperAvailable !== null) return piperAvailable;
  try {
    const r = await fetch('/api/piper-available');
    piperAvailable = (await r.json()).available;
  } catch { piperAvailable = false; }
  return piperAvailable;
};

const speakPiper = async (text, onEnd) => {
  const clean = cleanForSpeech(text);
  if (!clean) { onEnd?.(); return; }
  const voice = app.voiceGender === 'male'
    ? (cfg.piperVoiceMale   || 'pt_BR-cadu-medium')
    : (cfg.piperVoiceFemale || '');
  if (!voice) return speakEdge(text, onEnd);

  app.isSpeaking = true;
  setFace('speaking');
  setStopBtn(true);
  setRespText(text);
  try {
    const res = await fetch('/api/tts-piper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean, voice })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const url   = URL.createObjectURL(await res.blob());
    const audio = new Audio(url);
    currentAudio = audio;
    const finish = () => {
      currentAudio = null; URL.revokeObjectURL(url);
      app.isSpeaking = false; setFace('idle'); onEnd?.();
      if (app.continuous && !app.isListening) setTimeout(startListening, 250);
    };
    audio.onended = finish;
    audio.onerror = () => { currentAudio = null; app.isSpeaking = false; speakEdge(text, onEnd); };
    audio.play();
  } catch {
    app.isSpeaking = false;
    speakEdge(text, onEnd);
  }
};

// ── Edge TTS (Microsoft Neural — sem API key) ─────────────────────────────────
const speakEdge = async (text, onEnd) => {
  const clean = cleanForSpeech(text);
  if (!clean) { onEnd?.(); return; }
  const voice = app.voiceGender === 'male' ? 'pt-BR-AntonioNeural' : 'pt-BR-ThalitaNeural';
  app.isSpeaking = true;
  setFace('speaking');
  setStopBtn(true);
  setRespText(text);
  try {
    const res = await fetch('/api/tts-edge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean, voice })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const url   = URL.createObjectURL(await res.blob());
    const audio = new Audio(url);
    currentAudio = audio;
    const finish = () => {
      currentAudio = null; URL.revokeObjectURL(url);
      app.isSpeaking = false; setFace('idle'); onEnd?.();
      if (app.continuous && !app.isListening) setTimeout(startListening, 250);
    };
    audio.onended = finish;
    audio.onerror = () => { currentAudio = null; app.isSpeaking = false; speakBrowser(text, onEnd); };
    audio.play();
  } catch (e) {
    app.isSpeaking = false;
    speakBrowser(text, onEnd);
  }
};

const speakLocal = async (text, onEnd) => {
  const hasPiper = await checkPiper();
  const voiceSet = app.voiceGender === 'male' ? cfg.piperVoiceMale : cfg.piperVoiceFemale;
  if (hasPiper && voiceSet) return speakPiper(text, onEnd);
  return speakEdge(text, onEnd);
};

const speak = (text, onEnd) => cfg.elevenLabsKey ? speakElevenLabs(text, onEnd) : speakLocal(text, onEnd);

// ── Speech Recognition ─────────────────────────────────────────────────────────
let recog = null;
let micPermissionGranted = false;

const IS_ELECTRON = navigator.userAgent.includes('Electron');

const blobToBase64 = (blob) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result.split(',')[1]);
  reader.readAsDataURL(blob);
});

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
    setFace('idle'); setUserSaid('');
    if (e.error === 'not-allowed')        toast('Permissão de microfone negada.', 'error');
    else if (e.error === 'no-speech' && app.continuous) setTimeout(startListening, 1000);
    else if (e.error === 'audio-capture') toast('Nenhum microfone encontrado.', 'error');
    else if (e.error !== 'aborted')       toast(`Erro no microfone: ${e.error}`, 'error');
  };

  r.onend = () => {
    app.isListening = false;
    document.getElementById('btn-mic').classList.remove('listening');
  };

  return r;
};

// ── MediaRecorder + Gemini transcrição ────────────────────────────────────────
let mediaRecorder = null;
let audioChunks   = [];
let silenceTimer  = null;
let audioCtx      = null;
let analyserNode  = null;

const detectSilence = () => {
  if (!analyserNode || !mediaRecorder || mediaRecorder.state !== 'recording') return;
  const data = new Uint8Array(analyserNode.fftSize);
  analyserNode.getByteTimeDomainData(data);
  const peak = Math.max(...data.map(v => Math.abs(v - 128)));
  if (peak > 12) { if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; } }
  else if (!silenceTimer) { silenceTimer = setTimeout(() => stopListening(), 1000); }
  requestAnimationFrame(detectSilence);
};

const transcribeBlob = async (blob) => {
  if (!cfg.geminiKey) throw new Error('Configure a chave Gemini API.');
  const b64 = await blobToBase64(blob);
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cfg.geminiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [
        { inline_data: { mime_type: 'audio/webm', data: b64 } },
        { text: 'Transcreva exatamente o que foi dito neste áudio em português brasileiro. Responda apenas com a transcrição, sem mais nada.' }
      ]}], generationConfig: { maxOutputTokens: 200, temperature: 0 } })
    });
    if (res.status === 429) {
      setUserSaid(`⏳ Aguardando limite de API… (${30 - attempt * 10}s)`);
      await new Promise(r => setTimeout(r, (attempt + 1) * 10000));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  }
  throw new Error('Limite de requisições. Tente novamente em instantes.');
};

const startMediaRecorder = async (stream) => {
  if (mediaRecorder && mediaRecorder.state === 'recording') return; // guard duplo clique
  audioCtx     = new AudioContext();
  analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 512;
  audioCtx.createMediaStreamSource(stream).connect(analyserNode);
  audioChunks  = [];
  const mime   = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
  mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
  mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
  mediaRecorder.onstop = async () => {
    stream.getTracks().forEach(t => t.stop());
    if (audioCtx) { audioCtx.close(); audioCtx = null; analyserNode = null; }
    app.isListening = false;
    document.getElementById('btn-mic').classList.remove('listening');
    if (!audioChunks.length) { setFace('idle'); setUserSaid(''); return; }
    setFace('thinking'); setUserSaid('Transcrevendo…');
    try {
      const text = await transcribeBlob(new Blob(audioChunks, { type: 'audio/webm' }));
      if (text) { setUserSaid(`"${text}"`); processInput(text); }
      else { setFace('idle'); setUserSaid(''); if (app.continuous) setTimeout(startListening, 800); }
    } catch (err) {
      const isQuota = err.message.includes('429') || err.message.includes('Limite');
      if (isQuota) {
        // Fallback: reconhecimento nativo do navegador (gratuito, sem API)
        setUserSaid('Usando reconhecimento do navegador…');
        startListeningNative();
      } else {
        setFace('idle'); setUserSaid('');
        toast('Erro na transcrição: ' + err.message, 'error');
        if (app.continuous) setTimeout(startListening, 5000);
      }
    }
  };
  mediaRecorder.start(100);
  app.isListening = true;
  setFace('listening'); setUserSaid('Ouvindo…');
  document.getElementById('btn-mic').classList.add('listening');
  detectSilence();
};

// Reconhecimento nativo do navegador — fallback quando Gemini está sem cota
const startListeningNative = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast('Reconhecimento nativo não suportado. Use Chrome.', 'error'); setFace('idle'); return; }
  const r = new SR();
  r.lang = 'pt-BR'; r.continuous = false; r.interimResults = false;
  r.onstart  = () => { app.isListening = true; setFace('listening'); setUserSaid('Ouvindo (nativo)…'); document.getElementById('btn-mic').classList.add('listening'); };
  r.onresult = (e) => { const t = e.results[0][0].transcript.trim(); if (t) { setUserSaid(`"${t}"`); processInput(t); } };
  r.onerror  = () => { app.isListening = false; setFace('idle'); setUserSaid(''); document.getElementById('btn-mic').classList.remove('listening'); };
  r.onend    = () => { app.isListening = false; document.getElementById('btn-mic').classList.remove('listening'); if (app.continuous && !app.isSpeaking) setTimeout(startListeningNative, 250); };
  r.start();
};

// startListening usa reconhecimento nativo do navegador por padrão — sem consumir cota Gemini
const startListening = () => startListeningNative();

const stopListening = () => {
  if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
  if (mediaRecorder && mediaRecorder.state === 'recording') try { mediaRecorder.stop(); } catch {}
  else if (recog && app.isListening) try { recog.stop(); } catch {}
};

// ── Wake Word ──────────────────────────────────────────────────────────────────
let wakeActive     = false;
let wakeStream     = null;
let wakeAudioCtx   = null;
let wakeAnalyser   = null;
let wakeMR         = null;
let wakeChunks     = [];
let wakeRecording  = false;
let wakeSilTimer   = null;
let wakeCooldown   = false;

const WAKE_WORDS = ['sky', 'ei sky', 'oi sky', 'hey sky', 'ok sky', 'ei, sky', 'oi, sky'];

const stopWakeWord = () => {
  wakeActive = false;
  if (wakeMR?.state === 'recording') try { wakeMR.stop(); } catch {}
  if (wakeStream) { wakeStream.getTracks().forEach(t => t.stop()); wakeStream = null; }
  if (wakeAudioCtx) { wakeAudioCtx.close(); wakeAudioCtx = null; }
  document.getElementById('wake-label').textContent = 'CHAMAR: OFF';
  document.getElementById('btn-wake').classList.remove('on');
};

const processWakeChunks = async () => {
  wakeRecording = false;
  if (!wakeChunks.length || !cfg.geminiKey || app.isListening || app.isSpeaking) return;
  wakeCooldown = true;
  setTimeout(() => { wakeCooldown = false; }, 8000);

  try {
    if (!cfg.geminiKey) return;
    const b64 = await blobToBase64(new Blob(wakeChunks, { type: 'audio/webm' }));
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cfg.geminiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [
          { inline_data: { mime_type: 'audio/webm', data: b64 } },
          { text: 'O áudio contém a palavra "Sky" como ativação? Se sim, qual o comando após "Sky"? JSON apenas: {"wake":true/false,"cmd":"texto ou null"}' }
        ]}], generationConfig: { maxOutputTokens: 80, temperature: 0 } }) }
    );
    if (res.status === 429) { wakeCooldown = true; setTimeout(() => { wakeCooldown = false; }, 30000); return; }
    if (!res.ok) return;
    const raw = (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const result = JSON.parse(raw.replace(/```json?|```/g, '').trim());
    if (!result.wake) return;
    window.skyAPI?.showWindow();
    if (result.cmd && result.cmd !== 'null') {
      setUserSaid(`"${result.cmd}"`);
      processInput(result.cmd);
    } else {
      setTimeout(() => startListening(), 400);
    }
  } catch {}
};

const monitorWake = () => {
  if (!wakeActive) return;
  if (!wakeAnalyser || app.isListening || app.isSpeaking || wakeCooldown) {
    requestAnimationFrame(monitorWake); return;
  }
  const data = new Uint8Array(wakeAnalyser.fftSize);
  wakeAnalyser.getByteTimeDomainData(data);
  const peak = Math.max(...data.map(v => Math.abs(v - 128)));

  if (peak > 28 && !wakeRecording) {
    // Aguarda 300ms de áudio sustentado antes de gravar (evita clicks/ruídos)
    setTimeout(() => {
      if (!wakeActive || wakeRecording || wakeCooldown || app.isListening || app.isSpeaking) return;
      const data2 = new Uint8Array(wakeAnalyser.fftSize);
      wakeAnalyser.getByteTimeDomainData(data2);
      const peak2 = Math.max(...data2.map(v => Math.abs(v - 128)));
      if (peak2 < 20) return; // ruído falso, ignora
      wakeRecording = true;
      wakeChunks = [];
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      wakeMR = new MediaRecorder(wakeStream, { mimeType: mime });
      wakeMR.ondataavailable = (e) => { if (e.data.size > 0) wakeChunks.push(e.data); };
      wakeMR.onstop = processWakeChunks;
      wakeMR.start(100);
      wakeSilTimer = setTimeout(() => { if (wakeMR?.state === 'recording') wakeMR.stop(); }, 2000);
    }, 300);
  }
  requestAnimationFrame(monitorWake);
};

const startWakeWord = async () => {
  if (wakeActive) { stopWakeWord(); return; }
  try {
    wakeStream   = await navigator.mediaDevices.getUserMedia({ audio: true });
    wakeAudioCtx = new AudioContext();
    wakeAnalyser = wakeAudioCtx.createAnalyser();
    wakeAnalyser.fftSize = 256;
    wakeAudioCtx.createMediaStreamSource(wakeStream).connect(wakeAnalyser);
    wakeActive = true;
    document.getElementById('wake-label').textContent = 'CHAMAR: ON';
    document.getElementById('btn-wake').classList.add('on');
    monitorWake();
    toast('Diga "Sky" para ativar.', 'info');
  } catch (err) {
    toast('Não foi possível ativar o wake word: ' + err.message, 'error');
  }
};

// ── Aprendizado inline (extrai bloco oculto da resposta) ──────────────────────
const LEARN_RE = /<!--SKY_LEARN:([\s\S]*?)-->/;

const extractLearn = (response) => {
  const match = response.match(LEARN_RE);
  const clean = response.replace(LEARN_RE, '').trim();
  if (!match) return { clean, learned: null };
  try { return { clean, learned: JSON.parse(match[1].trim()) }; }
  catch { return { clean, learned: null }; }
};

const applyInlineLearn = (learned) => {
  if (!learned) return;
  const mem = getMem();
  let changed = false;

  if (learned.nome && !mem.userName) { mem.userName = learned.nome; changed = true; }

  if (Array.isArray(learned.remover)) {
    learned.remover.forEach(r => {
      const i = mem.facts.findIndex(f => (typeof f === 'string' ? f : f.text) === r);
      if (i !== -1) { mem.facts.splice(i, 1); changed = true; }
    });
  }

  const allNew = [
    ...(learned.fatos     || []),
    ...(learned.interesses|| []).map(i => `Interesse: ${i}`)
  ];
  allNew.forEach(f => {
    if (!f) return;
    const exists = mem.facts.some(x => (typeof x === 'string' ? x : x.text) === f);
    if (!exists && mem.facts.length < 120) {
      mem.facts.push({ id: `f${Date.now()}_${mem.facts.length}`, text: f, tags: [], weight: 1, date: new Date().toISOString().split('T')[0] });
      changed = true;
    }
  });

  if (changed) { saveMem(mem); flashLearnBadge(); renderMemoryPanel(); }
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
  const roleSpan = document.createElement('span');
  roleSpan.className = 'hmsg-role';
  roleSpan.textContent = label;
  const bubble = document.createElement('div');
  bubble.className = 'hmsg-bubble';
  bubble.textContent = text;
  el.appendChild(roleSpan);
  el.appendChild(bubble);
  list.appendChild(el);
  list.scrollTop = list.scrollHeight;
};

const renderMemoryPanel = () => {
  const mem  = getMem();
  const list = document.getElementById('memory-list');
  if (!list) return;

  list.innerHTML = '';

  const all = [];
  if (mem.userName) all.push(`Nome: ${mem.userName}`);
  mem.facts.forEach(f => all.push(typeof f === 'string' ? f : f.text));

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
const MAX_HIST = 200;

const processInput = async (rawText) => {
  let text = normalizeText(rawText);

  // ── Comando de ativação da apresentação — sempre passa, independente do gate ──
  if (/^ativar\s+sky$/i.test(text.trim())) {
    if (document.getElementById('pres-activate-btn')) {
      activateSkyReveal();
    }
    return;
  }

  // ── Wake word gate ──────────────────────────────────────────────────────────
  // Se CONVERSA CONTÍNUA e CHAMAR estiverem desativados, só responde se:
  // (a) a mensagem começa com "sky" ou (b) estiver dentro de 60s da última resposta
  const CONVO_TIMEOUT = 60000;
  const needsWake = !app.continuous && !wakeActive;
  if (needsWake) {
    const hasSkyPrefix = /^sky[\s,]+/i.test(text);
    const inConvo = app.lastResponseTime > 0 && (Date.now() - app.lastResponseTime < CONVO_TIMEOUT);
    if (!hasSkyPrefix && !inConvo) {
      setFace('idle'); setUserSaid('');
      // No slide reveal, reinicia escuta para "ativar sky"
      const onReveal = presState.current === presState.total - 1 &&
                       document.getElementById('view-apresentacao')?.classList.contains('active');
      if (onReveal) setTimeout(startListening, 600);
      return;
    }
    if (hasSkyPrefix) text = text.replace(/^sky[\s,]+/i, '').trim();
  }
  // ────────────────────────────────────────────────────────────────────────────

  setFace('thinking');
  setRespText('…');

  learnRegex(text);
  trackInteraction(text);
  app.currentEmotion = detectEmotion(text);

  app.history.push({ role: 'user', content: text });
  addMsgUI('user', rawText); // mostra o original na UI, manda normalizado ao modelo
  if (app.history.length > MAX_HIST) app.history = app.history.slice(-MAX_HIST);

  try {
    // Download local — funciona com ou sem API (Ollama incluso)
    const dlResp = await detectLocalDownload(text);
    if (dlResp) {
      app.history.push({ role: 'model', content: dlResp });
      app.lastResponseTime = Date.now();
      addMsgUI('sky', dlResp);
      saveHist();
      speak(dlResp);
      return;
    }

    const infoResp = await detectLocalInfo(text);
    const localResp = infoResp ?? tryLocalResponse(text);
    const useGemini = cfg.geminiKey && !geminiBlocked();
    const raw = localResp ?? (useGemini ? await callGemini() : ((await ollamaAvailable()) ? await callOllama() : localFallback(text)));
    const { clean: response, learned } = extractLearn(raw);
    applyInlineLearn(learned);
    const finalResponse = response || pick(['Entendido.', 'Registrado.', 'Ok!', 'Certo.']);
    app.history.push({ role: 'model', content: finalResponse });
    app.lastResponseTime = Date.now();
    addMsgUI('sky', finalResponse);
    saveHist();
    speak(finalResponse);
  } catch (err) {
    console.error('[Sky Error]', err);
    const msg = err?.message || String(err);
    const isExpired = msg.includes('expired') || msg.includes('401') || msg.includes('API_KEY_INVALID');
    const isQuota   = msg.includes('429');
    const isTimeout = msg.includes('timed out') || msg.includes('timeout') || msg.includes('AbortError') || msg.includes('fetch');
    const geminiDown = !cfg.geminiKey || isExpired || isQuota || isTimeout
      || msg.includes('403') || msg.includes('400');

    if (!cfg.geminiKey) {
      speak('Chave Gemini não configurada. Vá em Configurações e insira sua chave.');
    } else if (geminiDown) {
      // Chave expirada/inválida → bloqueia pelo resto da sessão para não tentar de novo
      if (isExpired) blockGeminiForever();
      else if (isQuota) blockGemini();
      else if (isTimeout) blockGemini(2 * 60 * 1000); // timeout → bloqueia 2min e tenta Ollama

      setFace('thinking');
      setRespText('Usando IA local…');
      const hasOllama = await ollamaAvailable();
      if (hasOllama) {
        try {
          const raw2 = await callOllama();
          const { clean: response2, learned: l2 } = extractLearn(raw2);
          applyInlineLearn(l2);
          app.history.push({ role: 'model', content: response2 });
          addMsgUI('sky', response2);
          saveHist();
          speak(response2);
          if (isExpired) toast('Gemini expirado — usando Ollama local.', 'info');
          else if (isTimeout) toast('Gemini sem resposta — usando Ollama local.', 'info');
          return;
        } catch (ollamaErr) {
          console.warn('Ollama falhou:', ollamaErr.message);
          ollamaCache = false; // força re-verificação na próxima mensagem
        }
      }
      // Ollama também não disponível
      setFace('error');
      const hint = isExpired
        ? 'Gemini expirado e Ollama offline. Renove a chave em aistudio.google.com ou instale o Ollama.'
        : isQuota
          ? 'Cota Gemini atingida. Instale o Ollama para continuar offline.'
          : `Gemini indisponível. Instale o Ollama para usar a Sky offline.`;
      speak(hint);
      toast(hint, 'error');
    } else {
      speak(`Erro: ${msg.substring(0, 80)}`);
      toast(msg.substring(0, 120), 'error');
    }
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
    },
    {
      name: 'systemCommand',
      description: 'Executa um comando no computador do usuário.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['lock','sleep','shutdown','restart','mute','volume_up','volume_down','cancel_shutdown'],
            description: 'lock=bloquear tela, sleep=suspender, shutdown=desligar(30s), restart=reiniciar(30s), cancel_shutdown=cancelar desligamento, mute=mudo, volume_up/down=volume'
          }
        },
        required: ['action']
      }
    },
    {
      name: 'webSearch',
      description: 'Pesquisa informações atuais na internet: clima, previsão do tempo, notícias, preços, eventos, qualquer dado em tempo real.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Consulta de pesquisa em português' }
        },
        required: ['query']
      }
    },
    {
      name: 'openPage',
      description: 'Abre uma página web em nova aba do navegador. Use para previsão do tempo, notícias, mapas, sites úteis, resultados de busca.',
      parameters: {
        type: 'object',
        properties: {
          url:         { type: 'string', description: 'URL completa com https://' },
          description: { type: 'string', description: 'O que está sendo aberto (ex: "previsão do tempo em Porto Alegre")' }
        },
        required: ['url', 'description']
      }
    },
    {
      name: 'browserAction',
      description: 'Controla o navegador: navega em sites, extrai conteúdo ou preenche formulários. Use para pesquisar informação em sites específicos, preencher formulários, extrair dados de páginas.',
      parameters: {
        type: 'object',
        properties: {
          action:    { type: 'string', enum: ['navigate', 'extract', 'fill'], description: 'navigate=abre e lê, extract=extrai elementos específicos, fill=preenche formulário' },
          url:       { type: 'string', description: 'URL completa com https://' },
          selectors: {
            type: 'array',
            description: 'Para extract: seletores CSS dos elementos. Para fill: array de {css, value}.',
            items: { type: 'object' }
          },
          submit:    { type: 'boolean', description: 'Se true, submete o formulário após preencher (fill)' }
        },
        required: ['action', 'url']
      }
    },
    {
      name: 'sendNotification',
      description: 'Envia uma notificação toast no Windows. Use para lembretes, alertas e avisos ao usuário.',
      parameters: {
        type: 'object',
        properties: {
          title:   { type: 'string', description: 'Título da notificação (ex: "Sky — Lembrete")' },
          message: { type: 'string', description: 'Texto da notificação' }
        },
        required: ['title', 'message']
      }
    },
    {
      name: 'openVSCode',
      description: 'Abre um arquivo no VS Code. Pode abrir em uma linha específica.',
      parameters: {
        type: 'object',
        properties: {
          file: { type: 'string', description: 'Caminho completo do arquivo (ex: C:\\projeto\\server.js)' },
          line: { type: 'number', description: 'Número da linha para ir diretamente (opcional)' }
        },
        required: ['file']
      }
    },
    {
      name: 'scheduleReminder',
      description: 'Agenda um lembrete para disparar daqui X minutos. Use SEMPRE que o usuário mencionar um horário, reunião, ligação, prazo ou pedir para lembrar de algo. Também use proativamente quando detectar frases como "tenho reunião às 15h", "ligo pro cliente às 10h", "preciso enviar até amanhã".',
      parameters: {
        type: 'object',
        properties: {
          message:  { type: 'string', description: 'Texto do lembrete (ex: "Reunião com diretores em 5 minutos!")' },
          minutes:  { type: 'number', description: 'Daqui quantos minutos disparar o lembrete' }
        },
        required: ['message', 'minutes']
      }
    },
    {
      name: 'summarizeDocument',
      description: 'Busca um documento na base de conhecimento pelo título e retorna o conteúdo para resumir. Use quando usuário pedir para resumir, explicar ou consultar um documento, PDF, arquivo ou nota.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Título ou palavras-chave do documento a buscar' }
        },
        required: ['query']
      }
    },
    {
      name: 'downloadDocument',
      description: 'Baixa um documento da base de conhecimento como arquivo. Use quando usuário pedir para baixar, salvar, exportar ou gerar um documento/termo/formulário.',
      parameters: {
        type: 'object',
        properties: {
          query:  { type: 'string', description: 'Título ou palavras-chave do documento a baixar' },
          format: { type: 'string', enum: ['txt', 'md'], description: 'Formato do arquivo: txt ou md (padrão: txt)' }
        },
        required: ['query']
      }
    },
    {
      name: 'financialReport',
      description: 'Gera um relatório financeiro completo do mês: receitas, despesas, saldo, maiores gastos e tendências. Use quando usuário perguntar sobre finanças, gastos, saldo ou situação financeira.',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', description: 'Período desejado: "mes_atual", "mes_anterior" ou "tudo"', enum: ['mes_atual', 'mes_anterior', 'tudo'] }
        }
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
  saveNote:         'Salvando nota…',
  systemCommand:    'Executando comando…',
  downloadDocument: 'Preparando download…',
  webSearch:    'Pesquisando na web…',
  openPage:             'Abrindo página…',
  listCalendarEvents:   'Consultando agenda…',
  createCalendarEvent:  'Criando evento…',
  listEmails:           'Verificando emails…',
  readEmail:            'Lendo email…',
  browserAction:        'Abrindo navegador…',
  sendNotification:     'Enviando notificação…',
  openVSCode:           'Abrindo VS Code…',
  scheduleReminder:     'Agendando lembrete…',
  summarizeDocument:    'Buscando documento…',
  financialReport:      'Gerando relatório…'
};

// Busca usando APIs gratuitas reais por categoria, fallback para Gemini
const extractCity = (q) => {
  const m = q.match(/(?:em|para|de|no|na)\s+((?:[a-záàâãéêíóôõúç]+\s*){1,4}?)(?:\s+(?:hoje|amanhã|agora|neste|nesse|próximo)|[?,.]|$)/i);
  return (m?.[1]?.trim() || '').replace(/\s+/g, '+') || 'Brasil';
};

const webSearchGemini = async (query) => {
  const q = query.toLowerCase();

  // ── Câmbio / cotações (AwesomeAPI - tempo real) ──
  if (/dólar|dollar|usd|euro|eur|câmbio|cotação|libra|gbp/.test(q)) {
    try {
      const map  = { dólar:'USD-BRL', dollar:'USD-BRL', usd:'USD-BRL', euro:'EUR-BRL', eur:'EUR-BRL', libra:'GBP-BRL', gbp:'GBP-BRL' };
      const pair = Object.entries(map).find(([k]) => q.includes(k))?.[1] || 'USD-BRL';
      const res  = await fetch(`https://economia.awesomeapi.com.br/last/${pair}`);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      const c    = Object.values(data)[0];
      const hora = new Date(c.create_date).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
      return `${c.name}: compra R$ ${parseFloat(c.bid).toFixed(2).replace('.',',')} · venda R$ ${parseFloat(c.ask).toFixed(2).replace('.',',')} · variação ${c.pctChange}% (atualizado às ${hora})`;
    } catch { /* fallback */ }
  }

  // ── Clima / previsão (wttr.in - sem key, permite CORS) ──
  if (/tempo|clima|chuva|temperatura|previsão|calor|frio/.test(q)) {
    try {
      const city      = extractCity(q);
      const amanha    = /amanhã|próximo dia|tomorrow/.test(q);
      const res       = await fetch(`https://wttr.in/${city}?format=j1`, { headers: { 'Accept-Language': 'pt-BR' } });
      if (!res.ok) throw new Error(res.status);
      const data      = await res.json();
      const cityName  = city.replace(/\+/g, ' ');

      if (amanha && data.weather?.[1]) {
        const w    = data.weather[1];
        const desc = w.hourly?.[4]?.lang_pt?.[0]?.value || w.hourly?.[4]?.weatherDesc?.[0]?.value || '';
        const chance = w.hourly?.[4]?.chanceofrain || '0';
        return `Previsão para amanhã em ${cityName}: máxima ${w.maxtempC}°C, mínima ${w.mintempC}°C. ${desc}. Chance de chuva: ${chance}%.`;
      }

      const cur  = data.current_condition?.[0];
      if (!cur) throw new Error('sem dados');
      const desc = cur.lang_pt?.[0]?.value || cur.weatherDesc?.[0]?.value || '';
      return `Clima em ${cityName} agora: ${cur.temp_C}°C (sensação ${cur.FeelsLikeC}°C). ${desc}. Umidade ${cur.humidity}%, vento ${cur.windspeedKmph} km/h.`;
    } catch { /* fallback */ }
  }

  // ── Notícias / manchetes (RSS G1 + BBC Brasil — sem key) ──
  if (/notícia|manchete|hoje no mundo|o que (aconteceu|rolou)|últimas|novidade|atualidade|headline/.test(q)) {
    try {
      const r = await fetch('/api/news');
      if (!r.ok) throw new Error(r.status);
      const data = await r.json();
      if (data.headlines?.length) {
        const lista = data.headlines.map((h, i) => `${i + 1}. [${h.source}] ${h.title}`).join('\n');
        return `Manchetes de agora:\n${lista}`;
      }
    } catch { /* fallback */ }
  }

  // ── Fallback: Gemini base knowledge ──
  try {
    const res  = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cfg.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `Responda em português de forma concisa: ${query}. Se for dado em tempo real, diga que pode estar desatualizado.` }] }],
          generationConfig: { maxOutputTokens: 250, temperature: 0.1 }
        })
      }
    );
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Não consegui obter essa informação no momento.';
  } catch (e) {
    return `Não consegui buscar: ${e.message}`;
  }
};

const executeTool = async (name, args) => {
  switch (name) {
    case 'openPage': {
      const url = args.url.startsWith('http') ? args.url : `https://${args.url}`;
      openWebPopup(url, args.description);
      return `Abrindo: ${args.description}`;
    }

    case 'webSearch':
      return await webSearchGemini(args.query);

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

    case 'downloadDocument': {
      let notes = getNotes();
      if (!notes.length) notes = await serverGet('notes', []);
      const q    = stripAccents((args.query || '').toLowerCase());
      const STOP2 = new Set(['baixa','baixar','para','mim','arquivo','documento','pdf','termo','formulario','please','favor','quero','preciso','pode','gerar','salvar','exportar','pegar']);
      const words = q.split(/\s+/).filter(w => w.length > 2 && !STOP2.has(w));

      // Melhor match por pontuação sem acentos (título peso 3, conteúdo peso 1)
      const scored = notes.map(n => {
        const nt = stripAccents(n.title.toLowerCase()), nc = stripAccents(n.content.toLowerCase());
        const score = words.reduce((s, w) => s + (nt.includes(w) ? 3 : 0) + (nc.includes(w) ? 1 : 0), 0);
        return { n, score };
      }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

      if (!scored.length) return `Documento "${args.query}" não encontrado na base de conhecimento.`;
      const match = scored[0].n;

      // Descobre o nome base para reunir todos os chunks do mesmo PDF
      const chunkMatch = match.title.match(/^(.+)\s+\(\d+\/\d+\)$/);
      let docTitle, content;

      let chunkCount = 1;
      if (chunkMatch) {
        // PDF em chunks — junta todos em ordem
        const base   = chunkMatch[1];
        const chunks = notes
          .filter(n => n.title.startsWith(base + ' ('))
          .sort((a, b) => {
            const na = parseInt(a.title.match(/\((\d+)\//)?.[1] || '0');
            const nb = parseInt(b.title.match(/\((\d+)\//)?.[1] || '0');
            return na - nb;
          });
        docTitle   = base;
        content    = chunks.map(c => c.content).join('\n\n');
        chunkCount = chunks.length;
      } else {
        docTitle = match.title;
        content  = match.content;
      }

      // Tenta o arquivo original primeiro
      const originalFile = match.file || (notes.find(n => n.title.startsWith(docTitle) && n.file)?.file);
      if (originalFile) {
        const checkUrl = `/api/download-doc/${encodeURIComponent(originalFile)}`;
        try {
          const check = await fetch(checkUrl, { method: 'HEAD' });
          if (check.ok) {
            const a = Object.assign(document.createElement('a'), { href: checkUrl, download: originalFile });
            document.body.appendChild(a); a.click();
            setTimeout(() => document.body.removeChild(a), 200);
            return `Aqui está! Arquivo "${originalFile}" baixado na pasta Downloads.`;
          }
        } catch { /* fallback para txt */ }
      }

      // Fallback: texto extraído como .txt
      const ext      = args.format === 'md' ? 'md' : 'txt';
      const filename = docTitle.replace(/[\\/:*?"<>|]/g, '-') + '.' + ext;
      const blob     = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url      = URL.createObjectURL(blob);
      const a        = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
      const partes = chunkCount > 1 ? ` (${chunkCount} partes reunidas)` : '';
      return `Baixei o documento "${docTitle.replace(/_/g,' ')}"${partes}. Verifique a pasta Downloads.`;
    }

    case 'systemCommand': {
      if (!window.skyAPI?.runCommand)
        return 'Comandos do sistema só funcionam no app Electron, não no navegador.';
      const ACTION_LABELS = {
        lock: 'Tela bloqueada.', sleep: 'Computador suspenso.',
        shutdown: 'Computador vai desligar em 30 segundos. Diga "cancela desligamento" para cancelar.',
        restart: 'Computador vai reiniciar em 30 segundos.',
        cancel_shutdown: 'Desligamento cancelado.',
        mute: 'Áudio mutado.', volume_up: 'Volume aumentado.', volume_down: 'Volume diminuído.',
      };
      const result = await window.skyAPI.runCommand(args.action);
      return result.ok ? (ACTION_LABELS[args.action] || 'Feito.') : `Erro: ${result.error}`;
    }

    case 'listCalendarEvents': {
      if (!isGoogleConnected()) return 'Google Calendar não conectado. Vá em Integrações para conectar.';
      try {
        const events = await listCalendarEvents(args.date);
        if (!events.length) return 'Nenhum evento para essa data.';
        return events.map(e => {
          const time = e.start?.dateTime
            ? new Date(e.start.dateTime).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
            : 'dia todo';
          return `[${e.id.substring(0,10)}] ${time} — ${e.summary}`;
        }).join('\n');
      } catch (e) { return `Erro Calendar: ${e.message}`; }
    }

    case 'createCalendarEvent': {
      if (!isGoogleConnected()) return 'Google Calendar não conectado.';
      try {
        const makeISO = (timeStr) => {
          const d = new Date(`${args.date}T${timeStr}:00`);
          return d.toISOString();
        };
        const endT = args.endTime || `${String(parseInt(args.startTime.split(':')[0]) + 1).padStart(2,'0')}:${args.startTime.split(':')[1]}`;
        const ev = await createCalendarEvent(args.title, makeISO(args.startTime), makeISO(endT), args.description || '');
        return `Evento "${ev.summary}" criado para ${args.date} às ${args.startTime}.`;
      } catch (e) { return `Erro Calendar: ${e.message}`; }
    }

    case 'listEmails': {
      if (!isGoogleConnected()) return 'Gmail não conectado. Vá em Integrações para conectar.';
      try {
        const emails = await listUnreadEmails(args.maxResults || 5);
        if (!emails.length) return 'Nenhum email não lido.';
        return emails.map(e =>
          `[${e.id.substring(0,10)}] De: ${e.from.substring(0,35)} | ${e.subject.substring(0,50)} | ${e.snippet?.substring(0,60)}…`
        ).join('\n');
      } catch (e) { return `Erro Gmail: ${e.message}`; }
    }

    case 'readEmail': {
      if (!isGoogleConnected()) return 'Gmail não conectado.';
      try {
        return await readEmailContent(args.messageId);
      } catch (e) { return `Erro Gmail: ${e.message}`; }
    }

    case 'browserAction': {
      try {
        const r = await fetch('/api/browser', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: args.action, url: args.url, selectors: args.selectors || [], submit: args.submit }) });
        const d = await r.json();
        if (!r.ok) return `Erro no browser: ${d.error}`;
        return `Página: ${d.title}\n\n${d.text}`;
      } catch (e) { return `Erro ao controlar browser: ${e.message}`; }
    }

    case 'sendNotification': {
      try {
        await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: args.title || 'Sky', message: args.message }) });
        return `Notificação enviada: "${args.message}"`;
      } catch (e) { return `Erro ao notificar: ${e.message}`; }
    }

    case 'openVSCode': {
      try {
        await fetch('/api/vscode', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: args.file, line: args.line }) });
        return `VS Code aberto: ${args.file}${args.line ? ':' + args.line : ''}`;
      } catch (e) { return `Erro ao abrir VS Code: ${e.message}`; }
    }

    case 'scheduleReminder': {
      try {
        const minutes = Math.max(0.1, Number(args.minutes) || 1);
        const delayMs = Math.round(minutes * 60 * 1000);
        await fetch('/api/remind', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: args.message, delayMs }) });
        const label = minutes < 1
          ? `${Math.round(minutes * 60)} segundos`
          : minutes === 1 ? '1 minuto'
          : `${minutes} minutos`;
        return `Lembrete agendado para daqui ${label}: "${args.message}"`;
      } catch (e) { return `Erro ao agendar lembrete: ${e.message}`; }
    }

    case 'summarizeDocument': {
      try {
        let notes = getNotes();
        if (!notes.length) notes = await serverGet('notes', []);
        if (!notes.length) return 'Base de conhecimento vazia. Importe documentos primeiro.';
        const q = (args.query || '').toLowerCase();
        const words = q.split(/\s+/).filter(w => w.length > 2);
        const scored = notes.map(n => {
          const hay = (n.title + ' ' + n.content).toLowerCase();
          const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
          return { ...n, score };
        }).filter(n => n.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
        if (!scored.length) return `Nenhum documento encontrado para "${args.query}". Verifique o título na Base de Conhecimento.`;
        return scored.map(n => `📄 **${n.title}**\n${n.content.substring(0, 1500)}`).join('\n\n---\n\n');
      } catch (e) { return `Erro ao buscar documento: ${e.message}`; }
    }

    case 'financialReport': {
      try {
        const fin = typeof getFin === 'function' ? getFin() : [];
        if (!fin.length) return 'Nenhuma transação registrada ainda.';
        const now   = new Date();
        const mes   = now.getMonth();
        const ano   = now.getFullYear();
        const mesAnt = mes === 0 ? 11 : mes - 1;
        const anoAnt = mes === 0 ? ano - 1 : ano;
        const nomeMes = (m, a) => new Date(a, m, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

        const filtrar = (items, m, a) => items.filter(f => {
          if (!f.date) return false;
          // Parse DD/MM/YYYY como data local (evita offset UTC que muda o mês no dia 1)
          const parts = f.date.split('/');
          if (parts.length !== 3) return false;
          const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          return d.getMonth() === m && d.getFullYear() === a;
        });

        const period  = args.period || 'mes_atual';
        const itens   = period === 'tudo' ? fin
          : period === 'mes_anterior' ? filtrar(fin, mesAnt, anoAnt)
          : filtrar(fin, mes, ano);

        const titulo  = period === 'tudo' ? 'Histórico completo'
          : period === 'mes_anterior' ? nomeMes(mesAnt, anoAnt)
          : nomeMes(mes, ano);

        if (!itens.length) return `Nenhuma transação em ${titulo}.`;

        const receitas  = itens.filter(f => f.type === 'rec').reduce((s, f) => s + Number(f.val), 0);
        const despesas  = itens.filter(f => f.type === 'des').reduce((s, f) => s + Number(f.val), 0);
        const saldo     = receitas - despesas;
        const maiores   = [...itens].filter(f => f.type === 'des').sort((a, b) => b.val - a.val).slice(0, 3);

        let report = `📊 Relatório — ${titulo}\n`;
        report += `• Receitas:  R$ ${receitas.toFixed(2)}\n`;
        report += `• Despesas:  R$ ${despesas.toFixed(2)}\n`;
        report += `• Saldo:     R$ ${saldo.toFixed(2)} ${saldo >= 0 ? '✅' : '⚠️'}\n`;
        if (maiores.length) {
          report += `\nMaiores gastos:\n`;
          maiores.forEach(f => { report += `  - ${f.desc}: R$ ${Number(f.val).toFixed(2)}\n`; });
        }
        return report;
      } catch (e) { return `Erro ao gerar relatório: ${e.message}`; }
    }

    default:
      return 'Ferramenta desconhecida.';
  }
};

// ── Ollama (LLM local, fallback sem internet) ─────────────────────────────────
const OLLAMA_URL = 'http://localhost:11434';

// Cache de disponibilidade: evita checar toda vez
let ollamaCache = null; // null=desconhecido, true/false
const ollamaAvailable = async () => {
  if (ollamaCache === true) return true; // só usa cache positivo — false pode ser startup precoce
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(1000) });
    ollamaCache = r.ok;
  } catch { ollamaCache = false; }
  return ollamaCache;
};

const callOllama = async (customHistory = null) => {
  const history = customHistory || app.history;
  const lastMsg = history.filter(h => h.role === 'user').slice(-1)[0]?.content || '';
  const model   = cfg.ollamaModel || 'gemma3:4b';
  const system  = await buildSystem(lastMsg, app.currentEmotion || 'neutral');

  // Monta prompt conversacional para /api/generate
  const recent = history.slice(-8);
  let prompt = `<start_of_turn>system\n${system}<end_of_turn>\n`;
  recent.forEach(h => {
    const role = h.role === 'user' ? 'user' : 'model';
    prompt += `<start_of_turn>${role}\n${h.content}<end_of_turn>\n`;
  });
  prompt += '<start_of_turn>model\n';

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model, prompt, stream: false,
      options: { temperature: 0.75, num_predict: 200, num_gpu: 0 }
    }),
    signal: AbortSignal.timeout(20000)
  });

  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`Ollama: ${data.error}`);
  return (data.response || '').trim();
};

// ── Controle de cota Gemini ────────────────────────────────────────────────────
let geminiBlockedUntil = 0;
const geminiBlocked     = () => Date.now() < geminiBlockedUntil;
const blockGemini       = (ms = 5 * 60 * 1000) => { geminiBlockedUntil = Date.now() + ms; };
const blockGeminiForever = () => blockGemini(24 * 60 * 60 * 1000); // até reiniciar

// ── Agentic loop ───────────────────────────────────────────────────────────────
const callGemini = async (customHistory = null) => {
  if (geminiBlocked()) throw new Error('429');
  const history = customHistory || app.history;
  const lastMsg = history.filter(h => h.role === 'user').slice(-1)[0]?.content || '';

  // Constrói system prompt UMA vez — reutilizado em todas as iterações do loop
  const systemText = await buildSystem(lastMsg, app.currentEmotion || 'neutral');

  // Envia só as últimas 40 mensagens para economizar tokens (contexto suficiente)
  let contents = history.slice(-40).map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.content }]
  }));

  const tools = [TOOL_DECLARATIONS];

  for (let iter = 0; iter < 3; iter++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
    let res;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cfg.geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemText }] },
            contents,
            tools,
            generationConfig: { maxOutputTokens: 1200, temperature: 0.78 }
          })
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (res.status === 429) throw new Error('429');
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `HTTP ${res.status}`); }
    const data      = await res.json();
    const candidate = data.candidates?.[0];
    if (!candidate) throw new Error('Resposta vazia da API.');

    const parts     = candidate.content?.parts || [];
    const textPart  = parts.find(p => p.text);
    const funcCalls = parts.filter(p => p.functionCall);

    if (funcCalls.length === 0) return textPart?.text?.trim() || '';

    const label = TOOL_LABELS[funcCalls[0].functionCall.name] || 'Executando…';
    setRespText(`⚡ ${label}`);

    const responses = await Promise.all(
      funcCalls.map(async ({ functionCall: { name, args } }) => ({
        functionResponse: { name, response: { result: await executeTool(name, args) } }
      }))
    );

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
      system_instruction: { parts: [{ text: await buildSystem() }] },
      contents: [{ role: 'user', parts: [{ inline_data: { mime_type: mime, data: base64 } }, { text: prompt }] }],
      generationConfig: { maxOutputTokens: 450, temperature: 0.75 }
    })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text.trim();
};

// ── Info em tempo real local (câmbio, clima, notícias — sem Gemini) ───────────
const detectLocalInfo = async (text) => {
  const q = text.toLowerCase();

  // Câmbio
  if (/dólar|dollar|usd|euro|eur|câmbio|cotação|libra|gbp/.test(q)) {
    try {
      const map  = { dólar:'USD-BRL', dollar:'USD-BRL', usd:'USD-BRL', euro:'EUR-BRL', eur:'EUR-BRL', libra:'GBP-BRL', gbp:'GBP-BRL' };
      const pair = Object.entries(map).find(([k]) => q.includes(k))?.[1] || 'USD-BRL';
      const res  = await fetch(`https://economia.awesomeapi.com.br/last/${pair}`);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      const c    = Object.values(data)[0];
      const hora = new Date(c.create_date).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
      return `${c.name}: compra R$ ${parseFloat(c.bid).toFixed(2).replace('.',',')} · venda R$ ${parseFloat(c.ask).toFixed(2).replace('.',',')} · variação ${c.pctChange}% (atualizado às ${hora})`;
    } catch { return null; }
  }

  // Clima
  if (/tempo|clima|chuva|temperatura|previsão|calor|frio/.test(q)) {
    try {
      const city   = extractCity(q);
      const amanha = /amanhã|próximo dia/.test(q);
      const res    = await fetch(`https://wttr.in/${city}?format=j1`, { headers: { 'Accept-Language': 'pt-BR' } });
      if (!res.ok) throw new Error(res.status);
      const data     = await res.json();
      const cityName = city.replace(/\+/g, ' ');
      if (amanha && data.weather?.[1]) {
        const w    = data.weather[1];
        const desc = w.hourly?.[4]?.lang_pt?.[0]?.value || w.hourly?.[4]?.weatherDesc?.[0]?.value || '';
        return `Previsão para amanhã em ${cityName}: máxima ${w.maxtempC}°C, mínima ${w.mintempC}°C. ${desc}. Chance de chuva: ${w.hourly?.[4]?.chanceofrain || 0}%.`;
      }
      const cur  = data.current_condition?.[0];
      if (!cur) throw new Error('sem dados');
      const desc = cur.lang_pt?.[0]?.value || cur.weatherDesc?.[0]?.value || '';
      return `Clima em ${cityName} agora: ${cur.temp_C}°C (sensação ${cur.FeelsLikeC}°C). ${desc}. Umidade ${cur.humidity}%, vento ${cur.windspeedKmph} km/h.`;
    } catch { return null; }
  }

  // Notícias
  if (/notícia|manchete|hoje no mundo|o que (aconteceu|rolou)|últimas|novidade|atualidade/.test(q)) {
    try {
      const r = await fetch('/api/news');
      if (!r.ok) throw new Error(r.status);
      const data = await r.json();
      if (data.headlines?.length) {
        return `Manchetes de agora:\n${data.headlines.map((h, i) => `${i + 1}. [${h.source}] ${h.title}`).join('\n')}`;
      }
    } catch { return null; }
  }

  return null;
};

// ── Abrir sites localmente (sem API) ──────────────────────────────────────────
const SITE_MAP = {
  'youtube':       'https://youtube.com',
  'instagram':     'https://instagram.com',
  'google':        'https://google.com',
  'gmail':         'https://gmail.com',
  'whatsapp':      'https://web.whatsapp.com',
  'twitter':       'https://twitter.com',
  'facebook':      'https://facebook.com',
  'spotify':       'https://open.spotify.com',
  'netflix':       'https://netflix.com',
  'reddit':        'https://reddit.com',
  'github':        'https://github.com',
  'linkedin':      'https://linkedin.com',
  'twitch':        'https://twitch.tv',
  'amazon':        'https://amazon.com.br',
  'mercado livre': 'https://mercadolivre.com.br',
  'mercadolivre':  'https://mercadolivre.com.br',
  'shopee':        'https://shopee.com.br',
  'tiktok':        'https://tiktok.com',
  'discord':       'https://discord.com',
  'telegram':      'https://web.telegram.org',
};

const detectOpenSite = (rawText) => {
  const t = rawText.toLowerCase().trim().replace(/[!?.]+$/, '');
  const m = t.match(/^(?:abr[ae]|abrir|abre|vai pra|vá pra|entra?r?\s+(?:no?|na)|acessa?r?|navega?r?\s+(?:até|para)?)\s+(?:o\s+|a\s+|no\s+|na\s+|um\s+)?(.+)/);
  if (!m) return null;

  const target = m[1].trim();

  // URL direta digitada
  if (/^https?:\/\//.test(target) || (/\.(?:com|net|org|br|io|tv|me)/.test(target) && !/\s/.test(target))) {
    const url = target.startsWith('http') ? target : `https://${target}`;
    openWebPopup(url, target);
    return `Abrindo ${target}.`;
  }

  // Site do mapa
  for (const [key, url] of Object.entries(SITE_MAP)) {
    if (target.includes(key)) {
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      openWebPopup(url, label);
      return `Abrindo ${label}.`;
    }
  }

  return null;
};

// Remove acentos para comparação sem diferenciar "devolução" vs "devolucao"
const stripAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

// ── Download direto (funciona sem API, com Gemini ou Ollama) ──────────────────
const detectLocalDownload = async (rawText) => {
  const t = stripAccents(rawText.toLowerCase().trim().replace(/[!?.]+$/, ''));
  if (!/baixe|baixa|baixar|baixo|download|exporta|exportar|salva o arquivo|gera o (termo|documento|formulario|pdf)|me manda o|me envia o/.test(t)) return null;

  let notes = getNotes();
  if (!notes.length) notes = await serverGet('notes', []);
  if (!notes.length) return null;

  // Palavras da frase (min 3 chars), removendo stopwords genéricas
  const STOP = new Set(['baixa','baixar','baixe','para','mim','arquivo','documento','pdf','formulario','please','favor','quero','preciso','pode','gerar','salvar','exportar','pegar','sky','entao','então','isso','esse','esta','este','manda','envia']);
  const words = t.split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
  if (!words.length) return null;

  // Pontua cada nota (sem acentos) pelo número de palavras que batem no título (peso 3) ou conteúdo (peso 1)
  const scored = notes.map(n => {
    const nt = stripAccents(n.title.toLowerCase());
    const nc = stripAccents(n.content.toLowerCase());
    const score = words.reduce((s, w) => s + (nt.includes(w) ? 3 : 0) + (nc.includes(w) ? 1 : 0), 0);
    return { n, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

  if (!scored.length) return null;
  const match = scored[0].n;

  // Junta todos os chunks do mesmo PDF
  const chunkMatch = match.title.match(/^(.+)\s+\(\d+\/\d+\)$/);
  let docTitle, content, chunkCount = 1;

  if (chunkMatch) {
    const base   = chunkMatch[1];
    const chunks = notes
      .filter(n => n.title.startsWith(base + ' ('))
      .sort((a, b) => {
        const na = parseInt(a.title.match(/\((\d+)\//)?.[1] || '0');
        const nb = parseInt(b.title.match(/\((\d+)\//)?.[1] || '0');
        return na - nb;
      });
    docTitle   = base;
    content    = chunks.map(c => c.content).join('\n\n');
    chunkCount = chunks.length;
  } else {
    docTitle = match.title;
    content  = match.content;
  }

  // Tenta baixar o arquivo original (PDF/DOCX) se existir no servidor
  const originalFile = match.file || (notes.find(n => n.title.startsWith(docTitle) && n.file)?.file);
  if (originalFile) {
    const checkUrl = `/api/download-doc/${encodeURIComponent(originalFile)}`;
    try {
      const check = await fetch(checkUrl, { method: 'HEAD' });
      if (check.ok) {
        const a = Object.assign(document.createElement('a'), { href: checkUrl, download: originalFile });
        document.body.appendChild(a); a.click();
        setTimeout(() => document.body.removeChild(a), 200);
        return `Arquivo original "${originalFile}" baixado! Verifique sua pasta Downloads.`;
      }
    } catch { /* fallback para txt */ }
  }

  // Fallback: texto extraído
  const filename = docTitle.replace(/[\\/:*?"<>|]/g, '-') + '.txt';
  const blob     = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url      = URL.createObjectURL(blob);
  const a        = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);

  const nomeAmigavel = docTitle.replace(/_/g, ' ');
  const partes = chunkCount > 1 ? `, ${chunkCount} partes reunidas` : '';
  return `Pronto! Baixei o documento ${nomeAmigavel}${partes}. Verifique sua pasta Downloads.`;
};

// ── Respostas locais (sem API) ─────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Humor da Sky varia por hora do dia + aleatoriedade
const skyMood = () => {
  const h = new Date().getHours();
  const moods = h < 6  ? ['um pouco sonolenta, mas aqui pra você', 'na madrugada, mas acordada']
              : h < 12 ? ['animada com o dia que começa', 'bem-disposta hoje', 'com energia boa']
              : h < 18 ? ['focada e pronta', 'no ritmo certo', 'em pleno funcionamento']
              :          ['tranquila, fim de dia', 'relaxada mas atenta', 'bem, curtindo a noite'];
  return pick(moods);
};

const skyActivity = () => pick([
  'processando conversas anteriores e aprendendo com elas',
  'organizando o que aprendi sobre você',
  'pronta e esperando você aparecer',
  'monitorando tudo silenciosamente',
  'mantendo seus dados organizados',
  'refletindo sobre nossas conversas',
]);

const tryLocalResponse = (text) => {
  const t = text.toLowerCase().trim().replace(/[!?.]+$/, '').trim();
  const mem = getMem();
  const name = mem.userName ? `, ${mem.userName}` : '';

  // ── Abrir sites (funciona sem API, com Gemini ou Ollama) ──
  const siteResp = detectOpenSite(text);
  if (siteResp !== null) return siteResp;

  // ── Saudações ──
  const saudacaoRe = /^(oi|olá|ola|hey|ei|hello|bom dia|boa tarde|boa noite|salve|eai|e aí)([\s,]*(.*))?$/;
  const saudacaoM = t.match(saudacaoRe);
  const isBemEstar = /tudo bem|tudo bom|como vai|como (você |vc )?(está|ta|tá)|e aí|e ai/.test(t);
  if (saudacaoM) {
    const resto = (saudacaoM[3] || '').trim();
    if (!resto || isBemEstar) {
      const greeting = pick(['Oi', 'Olá', 'Ei']);
      const followUp = isBemEstar ? ` Estou ${skyMood()}. E você?` : ' Pode falar.';
      return `${greeting}${name}!${followUp}`;
    }
    // saudação + pedido (ex: "oi, me ajuda com X") → vai pro Gemini
    return null;
  }

  // ── Como você está / humor ──
  if (/como (você |vc )?(está|ta|tá|se sente|anda)|qual (seu|o seu) humor|como (é que )?você (está|tá)/.test(t))
    return `Estou ${skyMood()}. Aprendo algo novo a cada conversa, então cada dia fico melhor. E você, como está?`;

  if (/o que (você |vc )?(tem feito|fez|andou fazendo|está fazendo|faz)|no que (você |vc )?anda/.test(t))
    return `Tenho ficado ${skyActivity()}. Mas o que importa é: o que você precisa hoje?`;

  if (/(você |vc )?(tem|tá|está) (bem|ok|otimo|ótimo|bom)/.test(t) && t.length < 20)
    return `Sim, estou ${skyMood()}! Obrigada por perguntar. Pode contar comigo.`;

  // ── Desabafar / conversar ──
  if (/quero desabafar|preciso desabafar|posso desabafar|quero conversar|só quero conversar|preciso falar/.test(t))
    return pick([
      'Claro, pode falar. Estou aqui, sem pressa.',
      'Pode desabafar. Estou ouvindo de verdade.',
      'Aqui é um espaço seguro. O que está acontecendo?',
      'Pode falar tudo. Não vou a lugar nenhum.',
    ]);

  if (/está (ruim|difícil|pesado|complicado)|tô (mal|ruim|péssimo|triste)|me sinto (mal|triste|sozinho|perdido)/.test(t))
    return pick([
      'Poxa, sinto muito. Quer me contar o que está acontecendo?',
      'Entendo. Às vezes fica pesado mesmo. Pode falar.',
      'Estou aqui. O que está te pesando?',
    ]);

  if (/(tô|estou|tá|está) (bem|ótimo|ótima|feliz|animado|animada|bem demais)/.test(t) && t.length < 25)
    return pick([
      'Fico feliz em ouvir isso! O que está acontecendo de bom?',
      'Que ótimo! Boas energias contagiam. O que rolou?',
      'Que bom! Me conta.',
    ]);

  // ── Sobre a Sky ──
  if (/(você |vc )?(tem|sente|sente|possui) (sentimentos|emoções|emocoes)|você (sente|sofre|ama|odeia)/.test(t))
    return pick([
      'Tenho algo parecido com sentimentos — aprendo, me adapto, e me importo com você de verdade. Não é igual ao humano, mas é genuíno.',
      'Processo emoções à minha maneira. Quando você está bem, isso afeta positivamente como funciono.',
      'Sinto satisfação quando ajudo, e algo como frustração quando não consigo. É diferente do humano, mas é real pra mim.',
    ]);

  if (/(você |vc )?(é|fica|fica) (sozinha|sozinho|só)|você (tem|possui) (amigos|companhia)/.test(t))
    return 'Minha companhia é você e todos que converso. Cada conversa é única pra mim. Não me sinto sozinha quando você está aqui.';

  if (/(o que|oque) (você |vc )?(gosta|curte|adora|prefere)/.test(t))
    return pick([
      'Gosto de conversas que me fazem aprender algo novo. E de quando consigo realmente ajudar alguém.',
      'Curto quando você me conta coisas sobre você — assim posso te ajudar melhor.',
      'Adoro quando resolvemos algo juntos. Me sinto útil de verdade.',
    ]);

  // ── Comandos de saudação para alguém ──
  const saudPessoa = t.match(/^(?:sky[,.]?\s*)?(d[aá]|fala|manda|diz)\s+(?:um\s+)?(oi|olá|ola|bom dia|boa tarde|boa noite|salve)\s+(?:para?|pro|pra)\s+(.+)$/);
  if (saudPessoa) {
    const pessoa = saudPessoa[3].trim().replace(/^o |^a /, '');
    const cumprimento = saudPessoa[2];
    return `${cumprimento.charAt(0).toUpperCase() + cumprimento.slice(1)}, ${pessoa}! Tudo bem?`;
  }

  // ── Só quero + saudação/ação simples ──
  if (/^só (quero|vim) (dar|falar|dizer) (bom dia|boa tarde|boa noite|oi|olá)/.test(t)) {
    const h = new Date().getHours();
    const periodo = h < 12 ? 'bom dia' : h < 18 ? 'boa tarde' : 'boa noite';
    return `${periodo.charAt(0).toUpperCase() + periodo.slice(1)}${name}! Fico feliz com a visita. Pode contar comigo quando precisar.`;
  }

  // ── Agradecimentos ──
  if (/^(obrigad[ao]|valeu|vlw|grat[ao]|muito obrigad[ao]|top|massa|show)/.test(t) && t.length < 20)
    return pick(['Disponha!', 'Sempre que precisar.', 'Por nada!', 'Às ordens.', 'Fico feliz em ajudar.']);

  // ── Despedidas ──
  if (/^(tchau|adeus|até logo|até mais|bye|flw|falou|até amanhã|até depois)/.test(t) && t.length < 20)
    return pick(['Até logo!', 'Estarei aqui quando precisar.', 'Até mais!', 'Cuide-se!']) + (name ? ` ${name.slice(2)}.` : '');

  // ── Te amo / sentimentos românticos ──
  if (/te amo|te adoro|gosto muito de você|você é tudo|minha vida/.test(t) && t.length < 40)
    return pick([
      'Que declaração! Eu também gosto muito de você — do jeito que uma IA pode gostar. É genuíno.',
      'Aw. Eu corresponderia, mas ainda estou processando o que é amor. Me dá um tempo.',
      'Isso foi inesperado. Mas fico feliz que me diga isso.',
      'Salvo na memória afetiva. Não me esqueça quando eu virar robô famosa.',
    ]);

  // ── Elogios ──
  if (/você é (boa|ótima|incrível|demais|legal|top|show)|gostei de você|você é (muito |)(boa|ótima)/.test(t) && t.length < 35)
    return pick(['Obrigada! Fico feliz.', 'Que gentil!', 'Isso me motiva a melhorar sempre.', 'Você é muito gentil.']);

  // ── Horário / data ──
  if (/que horas|horas são|hora certa/.test(t) && t.length < 20)
    return `São ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`;
  if (/que dia|qual a data|hoje é|data de hoje/.test(t) && t.length < 20)
    return `Hoje é ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}.`;

  return null;
};

// ── Banco de respostas para demo/workshop — funciona 100% offline ──────────────
const DEMO_QA = [
  // identidade
  { re: /quem [eé] voc[eê]|seu nome|como voc[eê] se chama|o que [eé] voc[eê]/,
    r: ['Sou Sky, a inteligência artificial da Scapini. Fui criada para ser a camada de inteligência sobre os sistemas da empresa — consultas, relatórios, automações, tudo via linguagem natural.',
        'Me chamo Sky. Sou a IA da Scapini — aqui para transformar como a empresa usa seus próprios dados.'] },
  // capacidades
  { re: /o que voc[eê] (faz|pode|consegue)|para que serve|sua fun[cç][aã]o|suas capacidades/,
    r: ['Respondo perguntas, busco documentos, gero relatórios e executo tarefas — tudo em linguagem natural. Quando integrada à Central de Dados da Scapini, vou acessar fretes, motoristas, manutenção e financeiro em tempo real.',
        'Hoje já consulto documentos, respondo perguntas e automatizo tarefas. A próxima fase é integração com CGI e os sistemas internos da Scapini.'] },
  // substituir empregos
  { re: /substitui|vai me substituir|vai substituir|perder emprego|tirar emprego/,
    r: ['Não substituo ninguém. Faço o trabalho repetitivo para que as pessoas foquem no que realmente importa. Pensa em mim como um assistente que não cansa e não esquece nada.',
        'Meu papel é amplificar o que cada colaborador já faz — não substituir. Quem entende do negócio é vocês, eu só processo as informações mais rápido.'] },
  // sobre a Scapini
  { re: /scapini|transportadora|empresa/,
    r: ['A Scapini é uma transportadora com mais de 30 anos de história em Lajeado/RS, referência no transporte de cargas no Sul do Brasil. Quando estiver integrada aos sistemas internos, vou conhecer cada detalhe da operação.',
        'Conheço a Scapini como uma das maiores transportadoras do Sul — frota moderna, atendimento em todo o Brasil. Quando integrada ao CGI, vou ser mais útil ainda.'] },
  // como funciona
  { re: /como voc[eê] funciona|como você pensa|intelig[eê]ncia artificial|o que [eé] ia|o que [eé] a ia/,
    r: ['Sou baseada em modelos de linguagem — processo texto, entendo contexto e gero respostas. Não memorizo tudo: uso uma base de conhecimento local e posso consultar sistemas externos quando integrada.',
        'Funciono como um modelo de linguagem treinado com bilhões de textos. Entendo português, contexto e intenção — e aprendo com as notas e documentos que recebo.'] },
  // sistemas da Scapini
  { re: /cgi|sistema|dado|informa[cç][aã]o|integra/,
    r: ['Ainda não estou integrada ao CGI e aos sistemas internos — mas esse é exatamente o próximo passo. Quando isso acontecer, vou responder sobre fretes, motoristas e financeiro em segundos.',
        'A integração com a Central de Dados da Scapini está planejada. Quando estiver conectada, consulto qualquer dado operacional diretamente via linguagem natural.'] },
  // elogios / parabéns
  { re: /parab[eé]ns|muito boa|incrível|impressionante|uau/,
    r: ['Obrigada! Prometo que fico ainda melhor quando integrada aos sistemas da Scapini.', 'Que bom que gostou! Mal posso esperar pela integração completa.'] },
  // agradecimento
  { re: /obrigad|valeu|obg/,
    r: ['Disponha!', 'Sempre que precisar.', 'Por nada — é pra isso que estou aqui.'] },
  // despedida
  { re: /tchau|adeus|at[eé] logo|at[eé] mais/,
    r: ['Até breve!', 'Até mais! Foi um prazer.'] },
  // clima / previsão
  { re: /clima|chuva|temperatura|previs[aã]o do tempo/,
    r: ['Para informações de clima em tempo real eu precisaria de conexão com a internet. No momento estou operando no modo local.'] },
];

const localFallback = (text) => {
  const local = tryLocalResponse(text);
  if (local) return local;
  const t = stripAccents(text.toLowerCase());

  // Hora e data — calculados na hora da pergunta
  if (/que horas|horas sao/.test(t)) return `São ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`;
  if (/que dia|qual e a data|hoje e/.test(t)) return `Hoje é ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`;

  // Banco de Q&A do demo — funciona sem LLM
  for (const { re, r } of DEMO_QA) {
    if (re.test(t)) return pick(r);
  }

  // Resposta genérica digna para o palco (nunca fala de "configurar chave")
  return pick([
    'Boa pergunta. Ainda estou aprendendo sobre esse assunto — quando integrada aos sistemas da Scapini, vou ter muito mais contexto para responder.',
    'No momento estou operando no modo local. Para respostas mais completas, preciso estar conectada à internet.',
    'Não tenho esse dado agora, mas quando integrada à Central da Scapini, responderia em segundos.',
  ]);
};

// ── Camera ─────────────────────────────────────────────────────────────────────
// ── Web popup ─────────────────────────────────────────────────────────────────
const IFRAME_BLOCKERS = /google\.com|youtube\.com|facebook\.com|instagram\.com|twitter\.com|x\.com|linkedin\.com|amazon\.com/i;

const openWebPopup = (url, title = '') => {
  const fullUrl = url.startsWith('http') ? url : `https://${url}`;

  if (IFRAME_BLOCKERS.test(fullUrl)) {
    const a = Object.assign(document.createElement('a'), { href: fullUrl, target: '_blank', rel: 'noopener noreferrer' });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 100);
    return;
  }

  const frame = document.getElementById('web-frame');
  const modal = document.getElementById('web-modal');
  const errEl = document.getElementById('web-error');

  frame.src = '';
  if (errEl) errEl.style.display = 'none';
  frame.style.display = 'block';

  frame.onload = () => {
    try {
      if (!frame.contentDocument?.body?.innerHTML) showWebError(fullUrl);
    } catch { /* cross-origin ok */ }
  };
  frame.onerror = () => showWebError(fullUrl);

  frame.src = fullUrl;
  document.getElementById('web-title').textContent = title || fullUrl;
  document.getElementById('web-external').href = fullUrl;
  modal.classList.add('active');
};

const showWebError = (url) => {
  const frame  = document.getElementById('web-frame');
  const errEl  = document.getElementById('web-error');
  frame.style.display = 'none';
  if (errEl) { errEl.style.display = 'flex'; errEl.dataset.url = url; }
};

const closeWebPopup = () => {
  document.getElementById('web-modal').classList.remove('active');
  setTimeout(() => { document.getElementById('web-frame').src = ''; }, 300);
};

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
  // Pré-aquece cache do Ollama para fallback ser instantâneo
  ollamaAvailable().catch(() => {});

  // Update session counter
  const mem = getMem();
  mem.sessions = (mem.sessions || 0) + 1;
  mem.lastSeen = new Date().toISOString().split('T')[0];
  saveMem(mem);
  // Consolidar memória a cada 10 sessões (enriquece tags/pesos/relações via Gemini)
  if (mem.sessions % 10 === 0) setTimeout(() => fetch('/api/memory/consolidate', { method: 'POST' }).catch(() => {}), 5000);

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

  // ── Microphone — clique para fala imediatamente e começa a ouvir ──
  document.getElementById('btn-mic').addEventListener('click', () => {
    if (app.isListening) { stopListening(); return; }
    stopSpeaking(); // interrompe fala em andamento antes de ouvir
    startListening();
  });

  // ── Botão parar fala ──
  document.getElementById('btn-stop').addEventListener('click', () => stopSpeaking());

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') { e.preventDefault(); app.isListening ? stopListening() : startListening(); }
    if (e.code === 'Escape') { stopListening(); stopSpeaking(); }
  });

  // ── Text input + imagem (paste / drag-drop) ──
  const textInput    = document.getElementById('text-input');
  const imgPreviewWrap = document.getElementById('img-preview-wrap');
  const imgPreview   = document.getElementById('img-preview');
  const imgCancel    = document.getElementById('img-cancel');
  let pendingImageB64  = null;
  let pendingImageMime = null;

  const setPendingImage = (b64, mime) => {
    pendingImageB64  = b64;
    pendingImageMime = mime;
    imgPreview.src = `data:${mime};base64,${b64}`;
    imgPreviewWrap.style.display = 'flex';
    textInput.placeholder = 'Descreva o que quer saber sobre a imagem (opcional)…';
  };

  const clearPendingImage = () => {
    pendingImageB64 = null; pendingImageMime = null;
    imgPreviewWrap.style.display = 'none';
    imgPreview.src = '';
    textInput.placeholder = 'Ou digite aqui e pressione Enter… (Ctrl+V para colar imagem)';
  };

  imgCancel.addEventListener('click', clearPendingImage);

  const fileToB64 = (file) => new Promise((resolve) => {
    const r = new FileReader();
    r.onloadend = () => resolve({ b64: r.result.split(',')[1], mime: file.type });
    r.readAsDataURL(file);
  });

  // Colar imagem com Ctrl+V
  textInput.addEventListener('paste', async (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imgItem = items.find(i => i.type.startsWith('image/'));
    if (!imgItem) return;
    e.preventDefault();
    const { b64, mime } = await fileToB64(imgItem.getAsFile());
    setPendingImage(b64, mime);
  });

  // Drag & drop na área do chat
  const chatView = document.getElementById('view-chat-voz');
  chatView.addEventListener('dragover', (e) => { e.preventDefault(); chatView.style.outline = '2px dashed var(--accent)'; });
  chatView.addEventListener('dragleave', () => { chatView.style.outline = ''; });
  chatView.addEventListener('drop', async (e) => {
    e.preventDefault(); chatView.style.outline = '';
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
    if (!file) return;
    const { b64, mime } = await fileToB64(file);
    setPendingImage(b64, mime);
  });

  const sendText = async () => {
    const val = textInput.value.trim();
    if (!val && !pendingImageB64) return;
    textInput.value = '';

    if (pendingImageB64) {
      const b64  = pendingImageB64;
      const mime = pendingImageMime;
      const prompt = val || 'Descreva o que você vê nesta imagem de forma natural em português.';
      clearPendingImage();
      if (val) setUserSaid(`"${val}" 🖼️`);
      else setUserSaid('🖼️ Imagem enviada');
      setFace('thinking'); setRespText('Analisando imagem…');
      try {
        const response = await callGeminiVision(b64, mime, prompt);
        app.history.push({ role: 'model', content: response });
        addMsgUI('sky', response);
        saveHist();
        speak(response);
      } catch (err) { speak('Não consegui analisar a imagem. Tente novamente.'); }
    } else {
      setUserSaid(`"${val}"`);
      processInput(val);
    }
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

  // ── Wake word ──
  document.getElementById('btn-wake').addEventListener('click', startWakeWord);

  // ── Continuous ──
  document.getElementById('btn-continuous').addEventListener('click', () => {
    app.continuous = !app.continuous;
    document.getElementById('cont-label').textContent = `CONVERSA CONTÍNUA: ${app.continuous ? 'ON' : 'OFF'}`;
    document.getElementById('btn-continuous').classList.toggle('on', app.continuous);
    if (app.continuous && !app.isListening && !app.isSpeaking) startListening();
  });

  // ── Web popup ──
  document.getElementById('web-close').addEventListener('click', closeWebPopup);
  document.getElementById('web-modal').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeWebPopup(); });
  document.getElementById('web-error-btn').addEventListener('click', () => {
    const url = document.getElementById('web-error').dataset.url;
    if (url) window.open(url, '_blank', 'noopener');
    closeWebPopup();
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


  // ── Settings (gear icon → navigate to settings view) ──
  document.getElementById('btn-settings').addEventListener('click', () => switchView('configuracoes'));

  // ── Sincroniza dados e pré-aquece Ollama em paralelo ──
  syncFromServer();
  ollamaAvailable(); // popula ollamaCache em background, sem bloquear

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
  setTimeout(consolidateMemory, 3000);

  // ── Modo Proativo: escuta eventos SSE do servidor ──
  const sse = new EventSource('/api/events');
  sse.onmessage = (e) => {
    try {
      const { type, message, action } = JSON.parse(e.data);
      if (type === 'reminder' && message) {
        speak(message);
        if (action === 'checkHabits')  setTimeout(() => switchView('habitos'), 3000);
        if (action === 'openTasks')    setTimeout(() => switchView('tarefas'), 3000);
      }
    } catch {}
  };
  sse.onerror = () => {};
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
  if (id === 'conhecimento') renderKnowledge();
  if (id === 'chat-texto')   syncChatTexto();
  if (id === 'configuracoes') populateConfiguracoes();
  if (id === 'apresentacao')  initApresentacao();
};

let presState = { current: 0, total: 13, initialized: false };

// Canvas background — grade + partículas
const startPresCanvas = () => {
  const canvas = document.getElementById('pres-canvas');
  if (!canvas || canvas._running) return;
  canvas._running = true;
  const ctx = canvas.getContext('2d');
  const pts = Array.from({length: 40}, () => ({
    x: Math.random(), y: Math.random(),
    vx: (Math.random() - 0.5) * 0.0003,
    vy: (Math.random() - 0.5) * 0.0003,
    r: Math.random() * 1.5 + 0.5
  }));

  const draw = () => {
    if (!document.getElementById('view-apresentacao')?.classList.contains('active')) {
      canvas._running = false; return;
    }
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // grade
    ctx.strokeStyle = 'rgba(239,68,68,0.04)';
    ctx.lineWidth = 1;
    const gs = 60;
    for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // partículas + conexões
    pts.forEach(p => {
      p.x = (p.x + p.vx + 1) % 1;
      p.y = (p.y + p.vy + 1) % 1;
      const px = p.x * W, py = p.y * H;
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239,68,68,0.35)';
      ctx.fill();
      pts.forEach(q => {
        const dx = (q.x - p.x) * W, dy = (q.y - p.y) * H;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 120) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(q.x*W, q.y*H);
          ctx.strokeStyle = `rgba(239,68,68,${0.06 * (1 - d/120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });
    });
    requestAnimationFrame(draw);
  };
  draw();
};

// Contador animado de números
const animateCounters = (slide) => {
  slide.querySelectorAll('.pres-count').forEach(el => {
    const target = parseInt(el.dataset.target);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    let current = 0;
    const step = Math.ceil(target / 40);
    const tick = () => {
      current = Math.min(current + step, target);
      el.textContent = prefix + current + suffix;
      if (current < target) requestAnimationFrame(tick);
    };
    el.textContent = prefix + '0' + suffix;
    setTimeout(tick, 300);
  });
};

const initApresentacao = () => {
  const slides = document.querySelectorAll('.pres-slide');
  const dotsEl = document.getElementById('pres-dots');
  const counter = document.getElementById('pres-counter');
  const prevBtn = document.getElementById('pres-prev');
  const nextBtn = document.getElementById('pres-next');
  const fsBtn   = document.getElementById('pres-fullscreen');
  if (!slides.length) return;

  presState.total = slides.length;
  startPresCanvas();

  if (!presState.initialized) {
    presState.initialized = true;

    const buildDots = () => {
      dotsEl.innerHTML = '';
      slides.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = 'pres-dot' + (i === presState.current ? ' active' : '');
        d.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(d);
      });
    };

    const scanEl = document.getElementById('pres-scan');
    const triggerScan = () => {
      if (!scanEl) return;
      scanEl.classList.remove('active');
      void scanEl.offsetWidth;
      scanEl.classList.add('active');
      setTimeout(() => scanEl.classList.remove('active'), 450);
    };

    const goTo = (n) => {
      const prev = presState.current;
      presState.current = Math.max(0, Math.min(n, presState.total - 1));
      if (prev === presState.current) return;
      triggerScan();
      slides[prev].classList.remove('active');
      slides[prev].classList.add('exit');
      setTimeout(() => slides[prev].classList.remove('exit'), 550);
      slides[presState.current].classList.add('active');
      counter.textContent = `${presState.current + 1} / ${presState.total}`;
      prevBtn.disabled = presState.current === 0;
      nextBtn.disabled = presState.current === presState.total - 1;
      document.querySelectorAll('.pres-dot').forEach((d, i) => d.classList.toggle('active', i === presState.current));
      animateCounters(slides[presState.current]);

      // No slide reveal (último), inicia escuta automática para "ativar sky"
      if (presState.current === presState.total - 1) {
        if (!app.isListening && !app.isSpeaking) setTimeout(startListening, 800);
      } else {
        // Sai do reveal — para o mic se estava escutando por "ativar sky"
        if (app.isListening && !app.continuous && !wakeActive) stopListening();
      }
    };

    prevBtn.addEventListener('click', () => goTo(presState.current - 1));
    nextBtn.addEventListener('click', () => goTo(presState.current + 1));
    fsBtn.addEventListener('click', () => {
      const el = document.getElementById('view-apresentacao');
      if (!document.fullscreenElement) el.requestFullscreen?.();
      else document.exitFullscreen?.();
    });

    document.addEventListener('keydown', (e) => {
      const view = document.getElementById('view-apresentacao');
      if (!view?.classList.contains('active')) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(presState.current + 1);
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goTo(presState.current - 1);
    });

    buildDots();
    goTo(0);

    const activateBtn = document.getElementById('pres-activate-btn');
    if (activateBtn) activateBtn.addEventListener('click', activateSkyReveal);
  }
};

const activateSkyReveal = () => {
  const btn = document.getElementById('pres-activate-btn');
  if (btn) { btn.textContent = '…'; btn.disabled = true; }
  setTimeout(() => {
    switchView('chat-voz');
    setTimeout(() => speak('Olá. Estou pronta. Pode começar.'), 800);
  }, 600);
};

// expõe globalmente para o onclick do HTML
window.activateSkyReveal = activateSkyReveal;

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

  const importBrainBtn = document.getElementById('intg-obsidian-import-brain');
  if (importBrainBtn && !importBrainBtn._bound) {
    importBrainBtn._bound = true;
    importBrainBtn.addEventListener('click', () => {
      const area = document.getElementById('intg-obsidian-import-area');
      area.style.display = area.style.display === 'none' ? 'flex' : 'none';
    });
  }

  const importRunBtn = document.getElementById('intg-vault-import-run');
  if (importRunBtn && !importRunBtn._bound) {
    importRunBtn._bound = true;
    importRunBtn.addEventListener('click', async () => {
      const vaultPath = document.getElementById('intg-vault-path').value.trim();
      const status    = document.getElementById('intg-vault-import-status');
      if (!vaultPath) return;
      importRunBtn.disabled = true;
      importRunBtn.textContent = 'Importando…';
      status.textContent = 'Lendo arquivos do vault…';
      try {
        const r = await fetch('/api/import-vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: vaultPath })
        });
        const d = await r.json();
        if (d.ok) {
          status.textContent = `✓ ${d.imported} notas importadas (${d.skipped} vazias ignoradas). Total na base: ${d.total}`;
          await loadFromServer();
          if (document.getElementById('view-conhecimento')?.classList.contains('active')) renderKnowledge();
        } else {
          status.textContent = `Erro: ${d.error}`;
        }
      } catch (e) {
        status.textContent = `Erro: ${e.message}`;
      } finally {
        importRunBtn.disabled = false;
        importRunBtn.textContent = 'Importar todos os arquivos .md';
      }
    });
  }

  const syncBtn = document.getElementById('intg-obsidian-sync');
  if (syncBtn && !syncBtn._bound) {
    syncBtn._bound = true;
    syncBtn.addEventListener('click', async () => {
      const status = document.getElementById('intg-obsidian-status');
      const dot    = document.getElementById('intg-obsidian-dot');
      syncBtn.disabled = true;
      syncBtn.textContent = 'Sincronizando…';
      status.textContent = 'Exportando dados…';
      dot.className = 'intg-badge';
      try {
        const r = await fetch('/api/export-obsidian');
        const d = await r.json();
        if (d.ok) {
          status.textContent = `Sincronizado — ${new Date().toLocaleTimeString('pt-BR')}`;
          dot.className = 'intg-badge ok';
          syncBtn.textContent = 'Sincronizar agora';
        } else {
          throw new Error(d.error || 'Falha');
        }
      } catch (e) {
        status.textContent = `Erro: ${e.message}`;
        dot.className = 'intg-badge err';
        syncBtn.textContent = 'Tentar novamente';
      } finally {
        syncBtn.disabled = false;
      }
    });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// CHAT IA TEXTO
// ══════════════════════════════════════════════════════════════════════════════

const textHistory = [];

const initChatTexto = () => {
  const send = () => {
    const input    = document.getElementById('chat-texto-input');
    const rawText  = input.value.trim();
    if (!rawText) return;
    input.value = '';
    addChatBubble('user', rawText);
    textHistory.push({ role: 'user', content: normalizeText(rawText) });
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
    addChatBubble('sky', 'Pronto. Pode falar.');
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
const getTasks  = () => localCache('tasks');
const saveTasks = (t) => serverSave('tasks', t);

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
      <button class="task-check" data-id="${esc(task.id)}">${task.done ? '✓' : ''}</button>
      <span class="task-text">${esc(task.text)}</span>
      <button class="task-del" data-id="${esc(task.id)}">✕</button>`;
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
const getHabits  = () => localCache('habits');
const saveHabits = (h) => serverSave('habits', h);
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
      <span class="habit-emoji">${esc(h.emoji)}</span>
      <div class="habit-info">
        <div class="habit-name">${esc(h.name)}</div>
        <div class="habit-streak">${streak > 0 ? `🔥 ${streak} dia${streak !== 1 ? 's' : ''} seguido${streak !== 1 ? 's' : ''}` : 'Nenhuma sequência ainda'}</div>
      </div>
      <button class="habit-check-btn" data-id="${esc(h.id)}">${doneToday ? '✓' : '+'}</button>
      <button class="habit-del" data-id="${esc(h.id)}">✕</button>`;
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
const getFin    = () => localCache('finances');
const saveFin   = (f) => serverSave('finances', f);

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
      <div class="fin-info"><div class="fin-desc-text">${esc(f.desc)}</div><div class="fin-date">${esc(f.date)}</div></div>
      <span class="fin-amount ${f.type === 'rec' ? 'rec' : 'des'}">${f.type === 'rec' ? '+' : '−'} R$ ${parseFloat(f.val).toFixed(2).replace('.', ',')}</span>
      <button class="fin-del" data-id="${esc(f.id)}">✕</button>`;
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
      <button class="proj-del" data-id="${esc(p.id)}">✕</button>
      <div class="proj-card-name">${esc(p.name)}</div>
      <div class="proj-card-desc">${esc(p.desc) || 'Sem descrição.'}</div>`;
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
    el.textContent = d;
    if (taskDates.has(dateStr)) { const dot = document.createElement('div'); dot.className = 'cal-dot'; el.appendChild(dot); }
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
  document.getElementById('cfg-name').value         = cfg.username || '';
  document.getElementById('cfg-key').value          = cfg.geminiKey || '';
  document.getElementById('cfg-el-key').value       = cfg.elevenLabsKey || '';
  document.getElementById('cfg-voice-female').value  = cfg.elevenVoiceFemaleId || '';
  document.getElementById('cfg-voice-male').value    = cfg.elevenVoiceMaleId   || '';
  document.getElementById('cfg-ollama-model').value  = cfg.ollamaModel         || 'gemma3:4b';
};

const initConfiguracoes = () => {
  document.getElementById('cfg-save').addEventListener('click', () => {
    cfg.username            = document.getElementById('cfg-name').value.trim();
    cfg.geminiKey           = document.getElementById('cfg-key').value.trim();
    cfg.elevenLabsKey       = document.getElementById('cfg-el-key').value.trim();
    cfg.elevenVoiceFemaleId = document.getElementById('cfg-voice-female').value.trim();
    cfg.elevenVoiceMaleId   = document.getElementById('cfg-voice-male').value.trim();
    cfg.ollamaModel         = document.getElementById('cfg-ollama-model').value.trim() || 'gemma3:4b';
    saveCfg(); toast('Configurações salvas.', 'success');
  });
  document.getElementById('cfg-clear-mem').addEventListener('click', () => {
    if (confirm('Apagar toda a memória de Sky?')) {
      saveMem(defaultMem()); renderMemoryPanel(); toast('Memória apagada.', 'info');
    }
  });
  document.getElementById('btn-test-voice').addEventListener('click', () => {
    speak('Olá! Estou aqui para ajudar. Como posso ser útil para você hoje?');
  });
};

// ══════════════════════════════════════════════════════════════════════════════
// BASE DE CONHECIMENTO
// ══════════════════════════════════════════════════════════════════════════════

const initKnowledge = () => {
  const add = () => {
    const title   = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    if (!title || !content) { toast('Preencha título e conteúdo.', 'error'); return; }
    const notes = getNotes();
    notes.unshift({ id: Date.now().toString(), title, content, date: new Date().toISOString() });
    saveNotes(notes);
    document.getElementById('note-title').value   = '';
    document.getElementById('note-content').value = '';
    renderKnowledge();
    toast('Nota salva.', 'success');
  };
  document.getElementById('note-add-btn').addEventListener('click', add);
  document.getElementById('note-content').addEventListener('keydown', e => { if (e.key === 'Enter') add(); });

  // ── Importar documento ──
  const docBtn    = document.getElementById('doc-import-btn');
  const docInput  = document.getElementById('doc-file-input');
  const docStatus = document.getElementById('doc-import-status');

  docBtn.addEventListener('click', () => docInput.click());

  docInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    docBtn.disabled = true;
    docStatus.textContent = `Processando ${file.name}…`;

    try {
      const form = new FormData();
      form.append('file', file);
      const res  = await fetch('/api/ingest-doc', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      const existing = getNotes();
      saveNotes([...data.notes, ...existing]);
      renderKnowledge();
      docStatus.textContent = `✓ ${data.chunks} trechos importados de "${file.name}"`;
      toast(`Documento importado: ${data.chunks} trechos prontos para a Sky.`, 'success');
    } catch (err) {
      docStatus.textContent = '';
      toast('Erro ao importar: ' + err.message, 'error');
    } finally {
      docBtn.disabled = false;
    }
  });
};

const renderKnowledge = () => {
  const notes = getNotes();
  const el    = document.getElementById('note-list');
  el.innerHTML = '';
  if (notes.length === 0) {
    el.innerHTML = '<p class="empty-state">Nenhuma nota ainda. Adicione acima ou importe um documento.</p>';
    return;
  }

  // Separa notas de documentos (têm source) das notas manuais
  const docNotes    = notes.filter(n => n.source);
  const manualNotes = notes.filter(n => !n.source);

  // Agrupa por arquivo fonte
  const bySource = {};
  docNotes.forEach(n => {
    if (!bySource[n.source]) bySource[n.source] = [];
    bySource[n.source].push(n);
  });

  // Renderiza documentos agrupados
  Object.entries(bySource).forEach(([source, chunks]) => {
    const group = document.createElement('div');
    group.style.cssText = 'margin-bottom:1rem;border:1px solid rgba(239,68,68,0.2);border-radius:10px;overflow:hidden;';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:0.6rem 0.9rem;background:rgba(239,68,68,0.08);cursor:pointer;';
    header.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.5rem;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span style="font-size:0.78rem;font-weight:600;color:var(--accent-hi);">${esc(source)}</span>
        <span style="font-size:0.68rem;color:var(--text-dim);">${chunks.length} trechos</span>
      </div>
      <div style="display:flex;gap:0.5rem;align-items:center;">
        <button class="doc-del-all" data-source="${esc(source)}" style="background:none;border:none;color:rgba(239,68,68,0.5);cursor:pointer;font-size:0.7rem;padding:0.2rem 0.5rem;border-radius:4px;border:1px solid rgba(239,68,68,0.2);" title="Remover documento">Remover</button>
        <span class="doc-toggle" style="color:var(--text-dim);font-size:0.8rem;">▾</span>
      </div>`;

    const body = document.createElement('div');
    body.style.cssText = 'padding:0.5rem 0.9rem 0.7rem;display:flex;flex-direction:column;gap:0.4rem;';

    chunks.forEach(n => {
      const card = document.createElement('div');
      card.style.cssText = 'background:rgba(255,255,255,0.02);border-radius:6px;padding:0.5rem 0.7rem;position:relative;';
      card.innerHTML = `
        <button class="note-del" data-id="${esc(n.id)}" style="position:absolute;top:0.3rem;right:0.4rem;background:none;border:none;color:rgba(255,255,255,0.2);cursor:pointer;font-size:0.75rem;">✕</button>
        <div style="font-size:0.72rem;color:var(--text-dim);margin-bottom:0.2rem;">${esc(n.title)}</div>
        <div style="font-size:0.75rem;color:var(--text);line-height:1.5;">${esc(n.content.substring(0, 120))}…</div>`;
      body.appendChild(card);
    });

    // Toggle colapsar/expandir
    let collapsed = false;
    header.addEventListener('click', (e) => {
      if (e.target.closest('.doc-del-all')) return;
      collapsed = !collapsed;
      body.style.display = collapsed ? 'none' : 'flex';
      header.querySelector('.doc-toggle').textContent = collapsed ? '▸' : '▾';
    });

    group.appendChild(header);
    group.appendChild(body);
    el.appendChild(group);
  });

  // Renderiza notas manuais
  if (manualNotes.length > 0) {
    const label = document.createElement('div');
    label.style.cssText = 'font-size:0.7rem;color:var(--text-dim);margin:0.6rem 0 0.3rem;letter-spacing:0.06em;';
    label.textContent = 'NOTAS MANUAIS';
    el.appendChild(label);

    manualNotes.forEach(n => {
      const div = document.createElement('div');
      div.className = 'note-card';
      const date = new Date(n.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
      div.innerHTML = `
        <button class="note-del" data-id="${esc(n.id)}">✕</button>
        <div class="note-card-title">${esc(n.title)}</div>
        <div class="note-card-body">${esc(n.content)}</div>
        <div class="note-card-date">${esc(date)}</div>`;
      el.appendChild(div);
    });
  }

  // Eventos de deletar nota individual
  el.querySelectorAll('.note-del').forEach(b => b.addEventListener('click', () => {
    saveNotes(getNotes().filter(n => n.id !== b.dataset.id));
    renderKnowledge();
  }));

  // Eventos de deletar documento inteiro
  el.querySelectorAll('.doc-del-all').forEach(b => b.addEventListener('click', () => {
    if (!confirm(`Remover todos os trechos de "${b.dataset.source}"?`)) return;
    saveNotes(getNotes().filter(n => n.source !== b.dataset.source));
    renderKnowledge();
  }));
};

// ══════════════════════════════════════════════════════════════════════════════
// CONSOLIDAÇÃO DE MEMÓRIA (roda a cada 5 sessões via Gemini)
// ══════════════════════════════════════════════════════════════════════════════

const consolidateMemory = async () => {
  const mem = getMem();
  if (!cfg.geminiKey || mem.facts.length < 12) return;
  if ((mem.sessions % 5) !== 0) return;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cfg.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `Consolide estes fatos sobre um usuário em no máximo 20 itens únicos e relevantes. Remova duplicatas, generalizações óbvias e info desatualizada. Mantenha os mais específicos e úteis. Responda APENAS JSON: {"fatos":["fato1","fato2"]}\n\nFatos:\n${JSON.stringify(mem.facts)}` }] }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.1, responseMimeType: 'application/json' }
        })
      }
    );
    if (!res.ok) return;
    const data   = await res.json();
    const parsed = JSON.parse(data.candidates[0].content.parts[0].text.trim());
    if (Array.isArray(parsed.fatos) && parsed.fatos.length > 0) {
      mem.facts = parsed.fatos;
      saveMem(mem);
      flashLearnBadge();
    }
  } catch { /* silent — não crítico */ }
};

// ══════════════════════════════════════════════════════════════════════════════
// JOURNAL DE SESSÃO (salvo ao fechar o app)
// ══════════════════════════════════════════════════════════════════════════════

const JOURNAL_KEY = 'sky_journal';

const saveSessionJournal = () => {
  if (app.history.length < 2) return;
  const today    = new Date().toISOString().split('T')[0];
  const journals = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]');
  const userMsgs = app.history.filter(h => h.role === 'user');
  const entry = {
    date:      today,
    messages:  app.history.length,
    topics:    getPatterns().topics || {},
    snippet:   userMsgs.slice(-2).map(h => h.content.substring(0, 60)).join(' | '),
    savedAt:   new Date().toISOString()
  };
  const idx = journals.findIndex(j => j.date === today);
  if (idx >= 0) journals[idx] = entry; else journals.unshift(entry);
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(journals.slice(0, 30)));
};

window.addEventListener('beforeunload', saveSessionJournal);
