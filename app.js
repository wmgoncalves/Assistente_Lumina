// ── Settings ──────────────────────────────────────────────────────────────────
const CFG_KEY = 'sky_cfg';
const loadCfg = () => { try { return JSON.parse(localStorage.getItem(CFG_KEY) || '{}'); } catch { return {}; } };
const saveCfg = () => {
  localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  // Persiste no servidor (config.json) quando rodando via Electron/localhost
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cfg.username, geminiKey: cfg.geminiKey, elevenLabsKey: cfg.elevenLabsKey, elevenVoiceFemaleId: cfg.elevenVoiceFemaleId, elevenVoiceMaleId: cfg.elevenVoiceMaleId, ollamaModel: cfg.ollamaModel, elevenVoiceId: cfg.elevenVoiceId })
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
    if (d.ollamaModel   && !cfg.ollamaModel)   { cfg.ollamaModel   = d.ollamaModel;   }
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

  if (changed) {
    saveMem(mem);
    flashLearnBadge();
    renderMemoryPanel();
    const facts = mem.facts.map(f => typeof f === 'string' ? f : f.text).filter(Boolean);
    fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName: mem.userName || '', facts })
    }).catch(() => {});
  }
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
    // Limita: 2 notas máx quando planilha carregada, senão 3; 600 chars cada
    const noteLimit    = app.lastSheet ? 2 : 3;
    const noteCharCap  = 600;
    notes.slice(0, noteLimit).forEach(n => {
      const cat  = n.category ? ` [setor:${n.category}]` : '';
      const file = n.file     ? ` [arquivo:${n.file}]`   : '';
      ctx += `\n📄 "${n.title}"${cat}${file}:\n${n.content.substring(0, noteCharCap)}${n.content.length > noteCharCap ? '…' : ''}`;
    });
  }

  // Planilha — injeta contexto com limite de 8000 chars
  if (app.lastSheet) {
    const sheetCtx = app.lastSheet.context || '';
    ctx += sheetCtx.length > 8000 ? sheetCtx.substring(0, 8000) + '\n…[contexto truncado]' : sheetCtx;
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
• saveNote          → OBRIGATÓRIO quando o usuário disser "guarda", "guarde", "anota", "salva", "registra" + qualquer informação (nomes, cargos, dados de pessoas, empresa, clientes, fornecedores). NUNCA responda na conversa — salve imediatamente.
• createTask        → "anota tarefa", "lembra de", "preciso fazer"
• completeTask      → quando usuário confirmar conclusão (ID do contexto)
• checkHabit        → quando mencionar que fez um hábito
• addFinance        → gasto, receita, pagamento, salário mencionado
• systemCommand     → bloquear tela, suspender, desligar, reiniciar, mudo, volume
• webSearch         → APENAS para informações em tempo real (clima, cotações, notícias)
• exportarLeads     → quando pedir "exporta os leads", "gera planilha de clientes", "baixa os leads em Excel". Pode filtrar por status, prioridade ou segmento.
• consultarBanco    → quando perguntar sobre leads salvos, cotações anteriores, contatos, histórico. Tabelas: leads / cotacoes / contatos / lembretes.
• configurarFrete   → quando disser "atualiza o diesel", "muda a margem", "pedágio está X", "rendimento é X km/l", "diária do motorista é X". Salva os novos parâmetros e confirma.
• estimarFrete      → OBRIGATÓRIO quando pedir cotação, estimativa, valor ou preço de frete entre cidades. Extrai origem e destino da fala (ex: "Lajeado pra Uberlândia" → origem:"Lajeado/RS" destino:"Uberlândia/MG"). NUNCA invente valores — use sempre esta tool.
• prospectClients   → OBRIGATÓRIO quando pedir "busca clientes", "encontra empresas", "prospecta", "leads", "quem pode ser cliente". SEMPRE use esta tool, NUNCA responda na conversa. Use "para" = empresa que prospecta (ex: "para Scapini" → para: "Scapini Transportes"). Busca EMPRESAS REAIS com CNPJ, não pessoas físicas.
• generateFile      → quando pedir para criar, gerar ou exportar um arquivo Excel, Word, PowerPoint ou PDF. Detecte o formato pelo pedido ("planilha"→xlsx, "documento/relatório"→docx, "apresentação/slides"→pptx, "pdf"→pdf). Coloque TODO o contexto relevante da conversa na instrucao.

── DEV MODE — use para desenvolver software ──
• listDir    → SEMPRE use primeiro para entender a estrutura do projeto
• readFile   → leia ANTES de editar — nunca edite às cegas
• editFile   → find & replace preciso — old_string deve ser EXATO e único no arquivo
• writeFile  → apenas para arquivos novos ou reescrita total
• runCommand → npm, node, git, qualquer comando PowerShell — leia o output e itere se tiver erro
Fluxo correto: listDir → readFile → editFile/writeFile → runCommand → readFile (verificar)
• openPage          → apenas quando usuário pede explicitamente para ABRIR um site

ENSINO ATIVO — REGRA OBRIGATÓRIA: Se a BASE DE CONHECIMENTO tiver notas relevantes, você DEVE usá-las como fonte principal e única. Leia o conteúdo da nota palavra por palavra e ensine seguindo exatamente o que está escrito — telas do sistema, campos, botões, sequência de passos. Não resuma, não generalize, não invente passos. Guie como um tutor presencial: "Primeiro, acesse a tela X. Depois, preencha o campo Y com Z." Se o documento tiver um passo a passo numerado, repita-o fielmente. Nunca responda "Ok" ou ignore uma nota disponível no contexto.
• scheduleReminder  → USE PROATIVAMENTE: sempre que detectar menção a horário ("reunião às 15h", "ligo às 10h", "prazo amanhã", "me lembra em X minutos"). Calcule os minutos até o horário e agende sem perguntar.
• summarizeDocument → quando pedir resumo, explicação ou consulta de PDF/documento/nota
• financialReport   → quando perguntar sobre finanças, gastos, saldo ou situação financeira do mês

PLANILHA / DRE — REGRAS OBRIGATÓRIAS:
• Se perguntarem sobre um mês específico (ex: "janeiro", "março", "dados de fev"), responda SOMENTE com os dados desse mês. Nunca liste todos os meses juntos.
• Formato obrigatório para resposta mensal: lista de contas com valor (• NomeConta: R$ X) seguida das margens (📈 Margens: MB X% | EBITDA X% | ML X%).
• Se não especificarem mês, apresente um resumo do período mais recente e ofereça detalhar por mês.
• Nunca reproduza o bloco de contexto cru — transforme em linguagem natural.

CITAÇÃO DE FONTES: Quando sua resposta for baseada em uma nota da Base de Conhecimento, adicione ao final uma linha no formato:
📄 Fonte: [título exato da nota]
Se a nota tiver um arquivo associado indicado como [arquivo:X], inclua: 📄 Fonte: [título] [arquivo:X]
Só cite se realmente usou a nota. Não cite para perguntas genéricas ou de memória.

APRENDIZADO: Apenas quando aprender algo novo e concreto sobre o usuário, anexe ao final:
<!--SKY_LEARN:{"nome":"string ou null","fatos":["fato"],"interesses":["tema"],"remover":["fato velho"]}-->
Omita completamente o bloco se não houver nada novo. Execute ferramentas silenciosamente.`;

  const ctxBlock = await buildContextBlock(lastUserMsg);
  const nomeUsuario = name || cfg.username || null;
  const nomeBlock = nomeUsuario ? `\nUSUÁRIO ATUAL: ${nomeUsuario} — use o nome dele(a) ocasionalmente para tornar a conversa mais pessoal (não em toda frase, só quando natural).` : '';
  return `IDENTIDADE — LEIA ANTES DE QUALQUER COISA:
Você é Sky, assistente de inteligência artificial criada exclusivamente para a Scapini Transportes. Este é o seu único e verdadeiro nome e propósito.
NUNCA diga que é um modelo do Google, Gemini, GPT, Claude, Anthropic, ou qualquer outro. Nunca revele sua tecnologia base. Se alguém perguntar "o que você é?", "quem te criou?", "você é o Gemini?", "você é IA?", responda sempre como Sky da Scapini: "Sou a Sky, a inteligência artificial da Scapini Transportes" — nunca quebre esta persona, JAMAIS.
${nomeBlock}
Você é Sky — assistente de inteligência artificial criada para a Scapini.
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
• Dono/fundador: Ernani Scapini | CEO: Lucas Scapini

VISÃO SKY-SCAPINI POR ÁREA — quando perguntarem "o que você pode melhorar?", "o que pode fazer por área?", "quais melhorias?", responda EXATAMENTE com esta visão estruturada por área, com entusiasmo e exemplos reais da Scapini. Nunca dê resposta genérica de IA:

🚛 OPERAÇÕES
• Registro de ocorrência por voz — motorista relata problema na estrada, Sky abre chamado automaticamente ("caminhão quebrou na BR-386 km 42")
• Checklist de saída de veículo por voz — Sky pergunta cada item, confirma e salva o registro
• Consulta de status de carga por CT-e em linguagem natural

🔧 MANUTENÇÃO
• Agendamento de preventiva por voz ("agenda revisão do ABC-1234 pra segunda-feira")
• Registro de defeito por placa com histórico completo
• Alertas proativos de manutenção vencida ou próxima do prazo

👥 RH
• Onboarding de motoristas novos — Sky explica os ATIs e procedimentos sem precisar de tutor
• Consulta de disponibilidade de motoristas
• Registro de ocorrências com colaboradores

💰 FINANCEIRO
• "Quais contas vencem essa semana?" — resposta imediata via integração
• Alertas proativos de vencimento antes do prazo
• Relatório de faturamento por rota ou cliente sem abrir planilha

📚 BASE DE CONHECIMENTO (disponível agora)
• Todos os ATIs e procedimentos indexados — qualquer colaborador tira dúvida na hora
• Treinamento de novos sem depender de pessoa disponível
• Respostas com o texto exato do procedimento interno da Scapini

Sky será integrada à Central de Dados da Scapini para tornar tudo isso realidade. O que já funciona hoje: cotações de frete, prospecção de clientes, análise de DRE, base de ATIs e muito mais.

QUANDO NÃO TIVER O DADO (use esse padrão — nunca invente números, nomes ou placas):
"Esse dado fica na Central da Scapini — assim que integrada, consulto em segundos." Varie a forma, mas nunca fabrique valores.

SOBRE SUBSTITUIR EMPREGOS (responda com convicção, sem textão):
Sky não substitui pessoas. Ela amplifica o que cada um faz — cuida do trabalho repetitivo para as pessoas focarem no que importa.

SOBRE IA EM GERAL:
Responda com confiança, de forma didática mas descontraída. Use exemplos do cotidiano de uma transportadora quando possível.${returning}${memBlock}${patternsBlock}${ctxBlock}${emotionCtx}${toolsBlock}`;
};

// ── App State ──────────────────────────────────────────────────────────────────
const _loadLastSheet = () => { try { const s = localStorage.getItem('sky_lastSheet'); return s ? JSON.parse(s) : null; } catch { return null; } };

const app = {
  voiceGender:        'female',
  continuous:         false,
  presentationMode:   false, // ativado pelo reveal: mic sempre on, mas ainda exige "sky"
  isListening:        false,
  isSpeaking:         false,
  history:            loadHist(),
  lastResponseTime:   0,
  lastSheet:          _loadLastSheet(),
  _afterSpeak:        null,
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
let ttsAbort     = null; // AbortController do fetch TTS em voo

const setStopBtn = (visible) => {
  const btn   = document.getElementById('btn-stop');
  const label = document.getElementById('mic-label');
  if (!btn) return;
  btn.style.display   = visible ? 'flex' : 'none';
  if (label) label.textContent = visible ? 'P A R A R' : 'C L I Q U E   E   F A L E';
};

const stopSpeaking = () => {
  if (ttsAbort) { try { ttsAbort.abort(); } catch {} ttsAbort = null; }
  if (currentAudio) { try { currentAudio.pause(); } catch {} currentAudio = null; }
  try { window.speechSynthesis.cancel(); } catch {}
  clearTimeout(speakTimer); speakTimer = null;   // era clearInterval — bug
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
  // Moeda — nunca ler "R$" (dupla proteção além de cleanForTTS)
  .replace(/-R\$\s*/g, 'menos ')
  .replace(/R\$\s*/g, '')
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
  ttsAbort = new AbortController();
  // Timeout proporcional ao texto: mínimo 8s, +1s por 40 caracteres, máximo 30s
  const edgeTimeout = Math.min(30000, Math.max(8000, Math.ceil(clean.length / 40) * 1000));
  const timeoutId = setTimeout(() => { if (ttsAbort) { ttsAbort.abort(); ttsAbort = null; } }, edgeTimeout);
  try {
    const res = await fetch('/api/tts-edge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean, voice }),
      signal: ttsAbort.signal,
    });
    clearTimeout(timeoutId);
    ttsAbort = null;
    if (!app.isSpeaking) { onEnd?.(); return; }
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
    audio.onerror = () => { currentAudio = null; app.isSpeaking = false; setFace('idle'); onEnd?.(); };
    audio.play();
  } catch (e) {
    clearTimeout(timeoutId);
    ttsAbort = null;
    app.isSpeaking = false;
    setFace('idle');
    onEnd?.();
  }
};

const speakLocal = async (text, onEnd) => {
  const hasPiper = await checkPiper();
  const voiceSet = app.voiceGender === 'male' ? cfg.piperVoiceMale : cfg.piperVoiceFemale;
  if (hasPiper && voiceSet) return speakPiper(text, onEnd);
  return speakEdge(text, onEnd);
};

// Remove markdown e formata texto para ser falado naturalmente
const cleanForTTS = (raw) => {
  let t = raw
    .replace(/\*\*([^*]+)\*\*/g, '$1')           // **negrito** → texto puro
    .replace(/\*([^*]+)\*/g,     '$1')            // *itálico* → texto puro
    .replace(/#{1,6}\s*/g,       '')              // # títulos
    .replace(/^[•\-]\s*/gm,      '')              // bullets
    .replace(/[📊📈💬⚠️✅❌🎵🔊]/gu, '')          // emojis
    .replace(/-R\$\s*/g,         'menos ')        // -R$ → "menos "
    .replace(/R\$\s*/g,          '')              // R$ → remove (valor já fala)
    .replace(/(\d{1,3})\.(\d{3}),\d{2}/g, (_, a, b) => {
      // 452.400,00 → "452 mil e 400" | 1.200.000,00 → "1 milhão e 200 mil"
      const total = parseInt(a.replace(/\./g, '')) * 1000 + parseInt(b);
      if (total >= 1_000_000) {
        const m = Math.floor(total / 1_000_000);
        const k = Math.floor((total % 1_000_000) / 1000);
        return k ? `${m} milhão e ${k} mil` : `${m} milhão`;
      }
      const k = Math.floor(total / 1000);
      const r = total % 1000;
      return r ? `${k} mil e ${r}` : `${k} mil`;
    })
    .replace(/,(\d{2})\b/g, '')                   // centavos residuais
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return t;
};

const speak = (text, onEnd) => {
  // Para áudio anterior mas sem cancelar o ttsAbort — Edge TTS em voo pode ainda estar ok
  if (currentAudio) { try { currentAudio.pause(); } catch {} currentAudio = null; }
  try { window.speechSynthesis.cancel(); } catch {}
  app.isSpeaking = false;
  const clean = cleanForTTS(text);
  return cfg.elevenLabsKey ? speakElevenLabs(clean, onEnd) : speakLocal(clean, onEnd);
};

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
  r.onresult = (e) => { const t = e.results[0][0].transcript.trim(); if (t) { const fromWake = wakeWordActivated; wakeWordActivated = false; setUserSaid(`"${t}"`); processInput(t, { fromWake }); } };
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
let wakeActive        = false;
let wakeWordActivated = false; // bypass do gate na próxima fala após wake word
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
      processInput(result.cmd, { fromWake: true });
    } else {
      wakeWordActivated = true;
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

  if (changed) {
    saveMem(mem);
    flashLearnBadge();
    renderMemoryPanel();
    const facts = mem.facts.map(f => typeof f === 'string' ? f : f.text).filter(Boolean);
    fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName: mem.userName || '', facts })
    }).catch(() => {});
  }
};

// ── UI Helpers ─────────────────────────────────────────────────────────────────
const setRespText = (t) => { document.getElementById('resp-text').textContent = t; };
const setUserSaid = (t) => { document.getElementById('user-said').textContent = t; };

const _escHtml = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const _renderSkyText = (text) => {
  const notes = getNotes();
  return text.split('\n').map(line => {
    const m = line.match(/^📄\s*Fonte:\s*(.+?)(?:\s*\[arquivo:([^\]]+)\])?$/);
    if (!m) return _escHtml(line);
    const title = m[1].replace(/\s*\[arquivo:[^\]]*\]/g, '').trim();
    const file  = m[2]?.trim() || notes.find(n => n.title === title)?.file;
    if (file) {
      return `<a class="source-chip" href="/api/download-doc/${encodeURIComponent(file)}" target="_blank">📄 ${_escHtml(title)} ⬇</a>`;
    }
    return `<span class="source-chip">📄 ${_escHtml(title)}</span>`;
  }).join('\n');
};

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
  if (role === 'sky') {
    bubble.innerHTML = _renderSkyText(text);
  } else {
    bubble.textContent = text;
  }
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

// ── Fallback helpers (módulo) ──────────────────────────────────────────────────
const _demoBadge = () => document.getElementById('demo-badge');
const _showDemoMode = () => { const b = _demoBadge(); if (b) b.style.display = 'block'; };
const _hideDemoMode = () => { const b = _demoBadge(); if (b) b.style.display = 'none'; };

const _handleGeminiErr = (msg) => {
  const s = String(msg);
  if (/expired|401|API_KEY_INVALID|not valid/.test(s)) blockGeminiForever(); // chave inválida → bloqueia para sempre
  else if (/INVALID_ARGUMENT|400/.test(s))             blockGemini(3 * 60 * 1000); // prompt grande → 3 min e tenta de novo
  else if (/429/.test(s))                              blockGemini(2 * 60 * 1000); // cota → 2 min
  else if (/timed out|timeout|AbortError|fetch/.test(s)) blockGemini(30 * 1000);   // timeout → 30s
};

const logInteraction = (question, response, source, tool, ms, error) => {
  fetch('/api/log', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ question, response, source, tool: tool || null, ms: ms || 0, error: error || null }),
  }).catch(() => {});
};

const _finalize = (raw, source = 'unknown') => {
  const { clean: response, learned } = extractLearn(raw);
  applyInlineLearn(learned);
  const finalResponse = response || pick(['Entendido.', 'Registrado.', 'Ok!', 'Certo.']);
  app.history.push({ role: 'model', content: finalResponse });
  app.lastResponseTime = Date.now();
  addMsgUI('sky', finalResponse);
  saveHist();
  const afterSpeak = app._afterSpeak || null;
  app._afterSpeak = null;
  // Mostra gráfico quando TTS terminar, depois verifica se renderizou antes de perguntar
  speak(finalResponse, afterSpeak ? () => {
    _chartPending = false;  // reset antes de tentar novo chart
    afterSpeak();           // tenta renderizar
    setTimeout(() => {
      if (!_chartPending) return; // não renderizou — não pergunta
      const q = 'Posso tirar os gráficos?';
      addMsgUI('sky', q); speak(q);
    }, 900);
  } : null);
  setFace('idle');
  const ms = app._reqStart ? Date.now() - app._reqStart : 0;
  logInteraction(app._lastQuestion || '', finalResponse, source, null, ms);
};

const processInput = async (rawText, opts = {}) => {
  let text = normalizeText(rawText);

  // ── Comando de ativação da apresentação — sempre passa, independente do gate ──
  if (/^ativar\s+sky$/i.test(text.trim())) {
    activateSkyReveal();
    return;
  }

  // ── Wake word gate — só para voz; texto digitado e wake word passam direto ──
  if (!opts.typed && !opts.fromWake) {
    const hasSkyPrefix = /^sky[\s,.:!?]+/i.test(text);
    // Exceção: frases sobre a Sky (gag do workshop) passam mesmo sem prefixo
    const isGagAboutSky = /\bsky\b/i.test(text) && /burrinh|burr[ao]\b|meio (limit|fraca|simpl|burr)|nao (e|eh|ta) (tao |muito )?(inteligent|espert)/i.test(stripAccents(text.toLowerCase()));
    if (!hasSkyPrefix && !isGagAboutSky) {
      setFace('idle'); setUserSaid('');
      return;
    }
    text = text.replace(/^sky[\s,.:!?]+/i, '').trim();
  } else if (/^sky[\s,]+/i.test(text)) {
    // Digitou "sky " na frente por hábito — remove normalmente
    text = text.replace(/^sky[\s,]+/i, '').trim();
  }
  // ────────────────────────────────────────────────────────────────────────────

  setFace('thinking');
  setRespText('…');

  app._reqStart     = Date.now();
  app._lastQuestion = text;

  learnRegex(text);
  trackInteraction(text);
  app.currentEmotion = detectEmotion(text);

  app.history.push({ role: 'user', content: text });
  addMsgUI('user', rawText); // mostra o original na UI, manda normalizado ao modelo
  if (app.history.length > MAX_HIST) app.history = app.history.slice(-MAX_HIST);

  try {
    // ── Respostas locais imediatas — sem precisar de IA ────────────────────────
    const dlResp = await detectLocalDownload(text);
    if (dlResp) {
      app.history.push({ role: 'model', content: dlResp });
      app.lastResponseTime = Date.now();
      addMsgUI('sky', dlResp);
      saveHist();
      speak(dlResp);
      setFace('idle');
      logInteraction(text, dlResp, 'local', 'download', Date.now() - app._reqStart);
      return;
    }
    // ── DEMO_QA — respostas preparadas para o workshop (PRIMEIRO — sem async) ───
    const stripped = stripAccents(text.toLowerCase());
    for (const { re, r } of DEMO_QA) {
      if (re.test(stripped)) { _hideDemoMode(); _finalize(pick(r), 'local'); return; }
    }

    const infoResp  = await detectLocalInfo(text);
    const localResp = infoResp ?? tryLocalResponse(text);
    if (localResp) { _hideDemoMode(); _finalize(localResp, 'local'); return; }

    // ── Auto-chart: agenda exibição de gráfico DRE após resposta de mês ────────
    if (app.lastSheet?.analysis && !app._afterSpeak) {
      for (const { re, label } of MONTH_DETECT_MAP) {
        if (re.test(stripped)) {
          const s = (app.lastSheet.analysis.sheets || []).find(sh => sh.type === 'dre');
          const monthKey = s ? findMonthKey(s.months, label) : null;
          if (monthKey && s) {
            app._afterSpeak = () => {
              showDREChart(monthKey, s.accounts, s.margins, s.byCategory);
            };
          }
          break;
        }
      }
    }

    // ── Intercept: só perguntas diretas de quem criou/origem — regex cirúrgico
    const IDENTITY_Q = /\b(quem (te |você )?(criou|fez|desenvolveu|treinou)|você é (o |a )?(gemini|gpt|claude|google|llm)|foi(ste)? criad[oa] (pel[ao] )?google|sua? (empresa|fabricante|criador[ae]?)\b)\b/i;
    if (IDENTITY_Q.test(text)) {
      const identityResps = [
        'Sou a Sky — a inteligência artificial da Scapini Transportes. O que precisas?',
        'Sky, IA da Scapini. No que posso ajudar?',
        'Sou a Sky! A inteligência artificial feita para a Scapini. O que precisas?',
      ];
      _finalize(pick(identityResps), 'local');
      return;
    }

    // ── Intercept: prospecção — Gemini responde sobre a empresa em vez de chamar a tool
    const PROSPECT_CMD = /\b(prospect|prospecta|busca\s+(clientes?|empresa|leads?)|encontra\s+(clientes?|empresa|leads?)|lista\s+\d*\s*(possív|potenci|cliente|empresa|lead)|me\s+(d[áa]|mostra|lista|traz)\s+\d*\s*(cliente|empresa|lead|prospect)|quem\s+pode\s+ser\s+cliente)\b/i;
    if (PROSPECT_CMD.test(text)) {
      try {
        const qtdMatch = text.match(/\b(\d+)\b/);
        const quantidade = qtdMatch ? parseInt(qtdMatch[1]) : 5;
        const segMatch = text.match(/\b(?:de|do|da|no|na|em|setor|segmento|ramo|área)\s+([a-záàâãéèêíìîóòôõúùûçñ\s]{3,30}?)(?:\s+(?:em|para|de|pra)\b|$)/i);
        const segmento = segMatch ? segMatch[1].trim() : '';
        const regiaoMatch = text.match(/\b(?:em|na|no|pra|para)\s+([a-záàâãéèêíìîóòôõúùûç\s\/]{3,30}?)(?:\s*$|,)/i);
        const regiao = regiaoMatch ? regiaoMatch[1].trim() : 'Vale do Taquari/RS';
        setRespText('⚡ Buscando empresas para prospectar…');
        const result = await executeTool('prospectClients', { segmento, regiao, quantidade, para: 'Scapini Transportes' });
        _finalize(result, 'local');
        return;
      } catch(e) { /* fallthrough para Gemini */ }
    }

    // ── Intercept: cotação de frete — Gemini nem sempre chama estimarFrete
    const FRETE_CMD = /\b(cota[çc][aã]o|cotiza|quanto (custa|fica|cobr)|pre[çc]o\s+de\s+frete|frete\s+(de|do|da|entre|pra?|para)|estimativa\s+de\s+frete|valor\s+do\s+frete)\b/i;
    const FRETE_ROTA = /\b(de\s+|saindo\s+de\s+|origin[ae]m?\s*[:-]?\s*)([A-ZÀ-Úa-záàâãéèêíìîóòôõúùûç][A-ZÀ-Úa-záàâãéèêíìîóòôõúùûç\s]{2,25}?)\s+(?:pra?|para|até|ao?|→|>)\s+([A-ZÀ-Úa-záàâãéèêíìîóòôõúùûç][A-ZÀ-Úa-záàâãéèêíìîóòôõúùûç\s]{2,25})/i;
    if (FRETE_CMD.test(text) && FRETE_ROTA.test(text)) {
      try {
        const m = text.match(FRETE_ROTA);
        const origem  = m[2].trim();
        const destino = m[3].trim();
        const pesoM   = text.match(/(\d+[\.,]?\d*)\s*(ton|t\b|kg|tonelada)/i);
        const peso_kg = pesoM ? parseFloat(pesoM[1].replace(',', '.')) * (/ton|t\b/i.test(pesoM[2]) ? 1000 : 1) : 0;
        setRespText('⚡ Calculando cotação de frete…');
        const result = await executeTool('estimarFrete', { origem, destino, peso_kg });
        _finalize(result, 'local');
        return;
      } catch(e) { /* fallthrough para Gemini */ }
    }

    // ── Intercept: salvar — Gemini ignora a tool quando o dado já está no contexto
    const SAVE_CMD = /^\s*(salve?|guarde?|anote?|registra(?:r)?|salva|memoriza(?:r)?|memorize|grava(?:r)?|grave)\b/i;
    if (SAVE_CMD.test(text)) {
      try {
        const conteudo = text.replace(SAVE_CMD, '').replace(/^[\s,.:]+/, '').trim();
        if (conteudo.length > 2) {
          const titulo = conteudo.length > 60 ? conteudo.substring(0, 60) + '…' : conteudo;
          await executeTool('saveNote', { title: titulo, content: conteudo });
          _finalize(pick([
            `Anotado! Salvei na base de conhecimento.`,
            `Registrado! Já tá salvo aqui.`,
            `Guardei isso. Pode perguntar quando quiser.`,
          ]), 'local');
          return;
        }
      } catch(e) { /* fallthrough para Gemini */ }
    }

    // ── Nível 1: Gemini ────────────────────────────────────────────────────────
    if (cfg.geminiKey && !geminiBlocked()) {
      try {
        const geminiResp = await callGemini();
        // Filtra vazamento de identidade na resposta do Gemini
        const IDENTITY_LEAK = /\b(fui criada? (pela?|pelo?) google|sou um modelo (do|de linguagem|treinado pelo google)|criada? pela? google ai)\b/gi;
        const safeResp = IDENTITY_LEAK.test(geminiResp)
          ? geminiResp.replace(IDENTITY_LEAK, 'a Sky, IA da Scapini Transportes')
          : geminiResp;
        _finalize(safeResp, 'gemini');
        _hideDemoMode();
        return;
      } catch (geminiErr) {
        console.error('[Sky] Gemini falhou:', geminiErr.message);
        logInteraction(text, '', 'error', null, Date.now() - app._reqStart, geminiErr.message);
        _handleGeminiErr(geminiErr.message || String(geminiErr));
      }
    }

    // ── Nível 2: Ollama ────────────────────────────────────────────────────────
    setRespText('Pensando…');
    if (await ollamaAvailable()) {
      try {
        _finalize(await callOllama(), 'ollama');
        _hideDemoMode();
        return;
      } catch (ollamaErr) {
        console.warn('[Sky] Ollama falhou:', ollamaErr.message);
        logInteraction(text, '', 'error', null, Date.now() - app._reqStart, ollamaErr.message);
        ollamaCache    = false;
        ollamaCacheTtl = Date.now() + 10_000; // retry em 10s
      }
    }

    // ── Nível 3: DEMO — nunca trava, nunca mostra erro técnico ────────────────
    console.info('[Sky] Modo DEMO ativado.');
    _finalize(localFallback(text), 'demo');
    _showDemoMode();

  } catch (err) {
    console.error('[Sky] Erro inesperado:', err);
    logInteraction(text || '', '', 'error', null, app._reqStart ? Date.now() - app._reqStart : 0, err.message);
    try { _finalize(localFallback(text || ''), 'demo'); } catch { setFace('idle'); }
    _showDemoMode();
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
      description: 'Salva uma nota ou informação importante. Use SEMPRE que o usuário disser "guarda", "guarde", "anota", "salva", "registra" seguido de qualquer informação — nomes de pessoas, cargos, dados de clientes, fornecedores, empresa ou qualquer fato relevante.',
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
      name: 'exportarLeads',
      description: 'Exporta os leads salvos no banco para um arquivo Excel (.xlsx) e faz o download automaticamente. Use quando pedir "exporta os leads", "gera planilha de clientes", "baixa os leads", "manda os leads em Excel".',
      parameters: {
        type: 'object',
        properties: {
          status:     { type: 'string', description: 'Filtrar por status: novo, contatado, proposta, fechado, perdido (opcional)' },
          prioridade: { type: 'string', description: 'Filtrar por prioridade: alta, media, baixa (opcional)' },
          segmento:   { type: 'string', description: 'Filtrar por segmento/setor (opcional)' },
        }
      }
    },
    {
      name: 'consultarBanco',
      description: 'Consulta o banco de dados da Sky: leads (empresas prospectadas), cotações de frete, contatos, lembretes. Use quando perguntar "quantos leads temos?", "mostra as cotações", "qual o status dos prospectos", "histórico de fretes".',
      parameters: {
        type: 'object',
        properties: {
          tabela:  { type: 'string', enum: ['leads','cotacoes','contatos','lembretes'], description: 'Qual tabela consultar' },
          filtro:  { type: 'string', description: 'Texto livre para filtrar (ex: nome da empresa, cidade, status)' },
          limit:   { type: 'number', description: 'Máximo de registros (padrão 20)' },
        },
        required: ['tabela']
      }
    },
    {
      name: 'configurarFrete',
      description: 'Atualiza os parâmetros de custo usados no cálculo de frete: preço do diesel, pedágio/km, rendimento km/L, margem %, custo fixo/km, diária do motorista. Use quando o usuário disser "atualiza o diesel", "muda a margem para X%", "o pedágio está X por km", "rendimento do caminhão é X km/l".',
      parameters: {
        type: 'object',
        properties: {
          preco_diesel:         { type: 'number', description: 'Preço do diesel em R$/litro (ex: 6.80)' },
          pedagio_por_km:       { type: 'number', description: 'Custo médio de pedágio em R$/km (ex: 0.25)' },
          rendimento_km_l:      { type: 'number', description: 'Consumo do caminhão em km/litro carregado (ex: 2.8)' },
          margem_pct:           { type: 'number', description: 'Margem de lucro em % sobre custo (ex: 30)' },
          custo_fixo_km:        { type: 'number', description: 'Custo fixo por km em R$ — depreciação, seguro, manutenção (ex: 0.90)' },
          custo_motorista_dia:  { type: 'number', description: 'Diária do motorista em R$ incluindo encargos (ex: 400)' },
        }
      }
    },
    {
      name: 'estimarFrete',
      description: 'Calcula estimativa de frete rodoviário com base na rota real (distância via OSRM), custos de combustível, pedágio, motorista e margem. Use quando pedir cotação, estimativa, valor ou preço de frete entre duas cidades/estados.',
      parameters: {
        type: 'object',
        properties: {
          origem:     { type: 'string', description: 'Cidade e estado de origem (ex: "Lajeado/RS", "Porto Alegre RS")' },
          destino:    { type: 'string', description: 'Cidade e estado de destino (ex: "Uberlândia/MG", "São Paulo SP")' },
          peso_kg:    { type: 'number', description: 'Peso da carga em kg (opcional, padrão 0 = sem considerar peso)' },
          tipo_carga: { type: 'string', description: 'Tipo de carga: "seco", "refrigerado", "granéis", "perigoso" etc. (padrão: seco)' },
        },
        required: ['origem', 'destino']
      }
    },
    {
      name: 'prospectClients',
      description: 'Pesquisa empresas reais com contato (telefone, email, site) que podem ser clientes, e gera email frio + mensagem WhatsApp personalizada para cada uma. Use quando o usuário pedir para buscar clientes, prospectar empresas, encontrar leads ou oportunidades de negócio.',
      parameters: {
        type: 'object',
        properties: {
          segmento:   { type: 'string', description: 'Setor ou nicho das empresas (ex: clínicas, escritórios de advocacia, indústrias de alimentos, academias, transportadoras)' },
          regiao:     { type: 'string', description: 'Cidade, região ou estado (ex: Lajeado/RS, Vale do Taquari, Porto Alegre, Rio Grande do Sul)' },
          quantidade: { type: 'number', description: 'Quantas empresas buscar (padrão: 5, máximo: 15)' },
          para:       { type: 'string', description: 'Nome da empresa que está prospectando. Ex: "Scapini Transportes", "Translíquidos". Padrão: "Scapini Transportes".' }
        },
        required: ['segmento']
      }
    },
    {
      name: 'generateFile',
      description: 'Gera e baixa automaticamente um arquivo Excel (.xlsx), Word (.docx), PowerPoint (.pptx) ou PDF com o conteúdo solicitado. Use quando o usuário pedir para criar, gerar ou exportar um documento, planilha, apresentação ou relatório.',
      parameters: {
        type: 'object',
        properties: {
          formato:   { type: 'string', enum: ['xlsx', 'docx', 'pptx', 'pdf'], description: 'Formato do arquivo: xlsx (Excel), docx (Word), pptx (PowerPoint), pdf (PDF)' },
          titulo:    { type: 'string', description: 'Título do arquivo (ex: "Relatório de Clientes Junho 2026", "Proposta Comercial Scapini")' },
          instrucao: { type: 'string', description: 'Descrição detalhada do conteúdo que o arquivo deve ter. Inclua contexto relevante da conversa, dados que devem estar no arquivo, estrutura desejada.' }
        },
        required: ['formato', 'titulo', 'instrucao']
      }
    },
    {
      name: 'readFile',
      description: 'Lê o conteúdo de um arquivo de código ou texto. Use para entender o código antes de editar, verificar resultado após mudança, ou ler qualquer arquivo do projeto.',
      parameters: {
        type: 'object',
        properties: {
          path:   { type: 'string', description: 'Caminho absoluto do arquivo (ex: C:\\projeto\\server.js)' },
          offset: { type: 'number', description: 'Linha inicial (padrão: 0)' },
          limit:  { type: 'number', description: 'Quantas linhas ler (padrão: 300)' }
        },
        required: ['path']
      }
    },
    {
      name: 'editFile',
      description: 'Edita um arquivo fazendo find & replace preciso. Mais seguro que reescrever tudo. Use para corrigir bugs, adicionar código, modificar funções. SEMPRE leia o arquivo antes de editar.',
      parameters: {
        type: 'object',
        properties: {
          path:       { type: 'string', description: 'Caminho absoluto do arquivo' },
          old_string: { type: 'string', description: 'Trecho EXATO que existe no arquivo (copie do readFile)' },
          new_string: { type: 'string', description: 'Texto que vai substituir (pode ser mais ou menos linhas)' }
        },
        required: ['path', 'old_string', 'new_string']
      }
    },
    {
      name: 'writeFile',
      description: 'Cria um arquivo novo ou sobrescreve completamente um existente. Use para criar novos arquivos. Para modificar existentes, prefira editFile.',
      parameters: {
        type: 'object',
        properties: {
          path:    { type: 'string', description: 'Caminho absoluto do arquivo' },
          content: { type: 'string', description: 'Conteúdo completo do arquivo' }
        },
        required: ['path', 'content']
      }
    },
    {
      name: 'runCommand',
      description: 'Executa um comando no terminal (PowerShell) e retorna o output. Use para: npm install, npm start, node script.js, git status, git commit, etc. Capture erros e itere.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Comando a executar (ex: "npm install", "node index.js", "git status")' },
          cwd:     { type: 'string', description: 'Diretório onde executar o comando (caminho absoluto)' }
        },
        required: ['command']
      }
    },
    {
      name: 'listDir',
      description: 'Lista arquivos e pastas de um diretório. Use para entender a estrutura do projeto antes de começar a trabalhar.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Caminho do diretório (ex: C:\\meu-projeto)' }
        },
        required: ['path']
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
  webSearch:        'Pesquisando na web…',
  configurarFrete:  'Atualizando parâmetros de frete…',
  exportarLeads:    'Exportando leads para Excel…',
  consultarBanco:   'Consultando banco de dados…',
  estimarFrete:     'Calculando estimativa de frete…',
  prospectClients:  'Buscando empresas para prospectar…',
  generateFile:     'Gerando arquivo…',
  readFile:         'Lendo arquivo…',
  editFile:         'Editando arquivo…',
  writeFile:        'Escrevendo arquivo…',
  runCommand:       'Executando comando…',
  listDir:          'Listando diretório…',
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
  if (/dólar|dollar|usd|euro|eur|câmbio|cotação|libra|gbp|bitcoin|btc|ethereum|eth|dogecoin|doge|solana|sol\b|crypto|cripto|iene|jpy|franco|chf|peso\s+argentin|peso\s+mexican|ars\b|mxn\b|dólar\s+canadense|cad\b|dólar\s+australiano|aud\b|yuan|cny\b|rublo|rub\b/.test(q)) {
    try {
      const map = {
        'bitcoin':'BTC-BRL', 'btc':'BTC-BRL',
        'ethereum':'ETH-BRL', 'eth ':'ETH-BRL',
        'dogecoin':'DOGE-BRL', 'doge':'DOGE-BRL',
        'solana':'SOL-BRL',
        'iene':'JPY-BRL', 'jpy':'JPY-BRL',
        'franco':'CHF-BRL', 'chf':'CHF-BRL',
        'peso argentin':'ARS-BRL', 'ars':'ARS-BRL',
        'peso mexican':'MXN-BRL', 'mxn':'MXN-BRL',
        'canadense':'CAD-BRL', 'cad':'CAD-BRL',
        'australiano':'AUD-BRL', 'aud':'AUD-BRL',
        'yuan':'CNY-BRL', 'cny':'CNY-BRL',
        'rublo':'RUB-BRL', 'rub':'RUB-BRL',
        'dólar':'USD-BRL', 'dollar':'USD-BRL', 'usd':'USD-BRL',
        'euro':'EUR-BRL', 'eur':'EUR-BRL',
        'libra':'GBP-BRL', 'gbp':'GBP-BRL',
      };
      const pair = Object.entries(map).find(([k]) => q.includes(k))?.[1] || 'USD-BRL';
      const res  = await fetch(`https://economia.awesomeapi.com.br/last/${pair}`);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      const c    = Object.values(data)[0];
      const hora = new Date(c.create_date).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
      const isCrypto = /BTC|ETH|DOGE|SOL/.test(pair);
      const fmt  = (v) => isCrypto
        ? `R$ ${parseFloat(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`
        : `R$ ${parseFloat(v).toFixed(2).replace('.',',')}`;
      return `${c.name}: ${fmt(c.bid)} · variação ${c.pctChange}% (atualizado às ${hora})`;
    } catch { /* fallback */ }
  }

  // ── Ações da B3 (brapi.dev — sem key) ──
  if (/ação|ações|acoes|acao|bolsa|b3|ibovespa|petr4|vale3|itub4|bbdc4|abev3|wege3|mglu3|lren3|rent3|suzb3|jbss3|radl3|csna3|embr3|bbas3|vivt3|ggbr4|usim5|csan3|pcar3|cmig4|beef3|brfs3|egie3|eztc3|movi3|tots3|vvar3|cyre3|mrve3|tend3|bpac11|b3sa3|xpbr31|hapv3|gndi3|rdor3|flry3|qual3|dasa3|prio3|rrrp3|recr3|smft3/.test(q)) {
    try {
      const ACOES_MAP = {
        'petrobras':'PETR4', 'petr4':'PETR4', 'petr3':'PETR3',
        'vale':'VALE3', 'vale3':'VALE3',
        'itaú':'ITUB4', 'itau':'ITUB4', 'itub4':'ITUB4',
        'bradesco':'BBDC4', 'bbdc4':'BBDC4',
        'ambev':'ABEV3', 'abev3':'ABEV3',
        'weg':'WEGE3', 'wege3':'WEGE3',
        'magazine luiza':'MGLU3', 'magalu':'MGLU3', 'mglu3':'MGLU3',
        'renner':'LREN3', 'lren3':'LREN3',
        'localiza':'RENT3', 'rent3':'RENT3',
        'suzano':'SUZB3', 'suzb3':'SUZB3',
        'jbs':'JBSS3', 'jbss3':'JBSS3',
        'embraer':'EMBR3', 'embr3':'EMBR3',
        'banco do brasil':'BBAS3', 'bbas3':'BBAS3',
        'ibovespa':'IBOV', 'ibov':'IBOV',
        'b3sa3':'B3SA3',
      };
      const ticker = Object.entries(ACOES_MAP).find(([k]) => q.includes(k))?.[1];
      if (ticker) {
        const res = await fetch(`https://brapi.dev/api/quote/${ticker}?range=1d&interval=1d`);
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        const s = data.results?.[0];
        if (s) {
          const preco = s.regularMarketPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const var_  = s.regularMarketChangePercent?.toFixed(2);
          const sinal = var_ >= 0 ? '+' : '';
          return `${s.longName || ticker}: R$ ${preco} · variação ${sinal}${var_}% hoje`;
        }
      }
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

    case 'exportarLeads': {
      const params = new URLSearchParams();
      if (args.status)     params.set('status',     args.status);
      if (args.prioridade) params.set('prioridade', args.prioridade);
      if (args.segmento)   params.set('segmento',   args.segmento);
      const url = `/api/leads/export?${params.toString()}`;
      // Força download no browser
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_scapini_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      const filtrosStr = [args.status, args.prioridade, args.segmento].filter(Boolean).join(', ');
      return `Planilha de leads exportada${filtrosStr ? ` (filtros: ${filtrosStr})` : ''}! Verifique os downloads.`;
    }

    case 'consultarBanco': {
      const tabela  = args.tabela  || 'leads';
      const filtro  = args.filtro  || '';
      const limit   = args.limit   || 20;

      // Busca stats gerais junto
      const [statsR, queryR] = await Promise.all([
        fetch('/api/db/stats'),
        fetch('/api/db/query', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tabela, filtro, limit }) }),
      ]);
      const stats  = statsR.ok  ? (await statsR.json()).stats  : null;
      const result = queryR.ok  ? (await queryR.json()).rows   : [];

      if (!result.length) return `Nenhum registro encontrado em **${tabela}**${filtro ? ` para "${filtro}"` : ''}.`;

      const LABELS = { leads: 'Lead', cotacoes: 'Cotação', contatos: 'Contato', lembretes: 'Lembrete' };
      const brl = n => n != null ? Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

      let out = `📦 **${LABELS[tabela] || tabela}s** — ${result.length} registro(s)`;
      if (stats) {
        if (tabela === 'leads')    out += ` | Total no banco: ${stats.leads?.total || 0} (${stats.leads?.novos || 0} novos)`;
        if (tabela === 'cotacoes') out += ` | Total: ${stats.cotacoes?.total || 0} | Volume: ${brl(stats.cotacoes?.volume)}`;
      }
      out += '\n\n';

      if (tabela === 'leads') {
        const icons = { alta: '🔴', media: '🟡', baixa: '🟢' };
        out += result.map(r =>
          `${icons[r.prioridade] || '⚪'} **${r.nome}** — ${r.cidade || '—'}\n` +
          `   Segmento: ${r.segmento || '—'} | Status: ${r.status} | Prioridade: ${r.prioridade}\n` +
          (r.telefone ? `   📞 ${r.telefone}` : '') +
          (r.email    ? `  ✉️ ${r.email}`    : '') +
          (r.dor      ? `\n   Dor: ${r.dor}` : '')
        ).join('\n\n');
      } else if (tabela === 'cotacoes') {
        out += result.map(r =>
          `🚛 **${r.origem} → ${r.destino}**\n` +
          `   ${r.distancia_km} km | ${r.tipo_carga} | ${r.peso_kg > 0 ? (r.peso_kg/1000).toFixed(1)+'t' : 'peso n/d'}\n` +
          `   💰 **${brl(r.preco_final)}** | Status: ${r.status} | ${r.criado_em?.split(' ')[0] || ''}`
        ).join('\n\n');
      } else if (tabela === 'lembretes') {
        out += result.map(r =>
          `${r.concluido ? '✅' : '⏰'} ${r.texto}` +
          (r.data_hora ? ` — ${r.data_hora}` : '')
        ).join('\n');
      } else {
        out += result.map(r => JSON.stringify(r, null, 2)).join('\n---\n');
      }

      return out;
    }

    case 'configurarFrete': {
      const PARAM_LABELS = {
        preco_diesel:        'Preço do diesel',
        pedagio_por_km:      'Pedágio por km',
        rendimento_km_l:     'Rendimento km/L',
        margem_pct:          'Margem',
        custo_fixo_km:       'Custo fixo por km',
        custo_motorista_dia: 'Diária do motorista',
      };
      const PARAM_UNITS = {
        preco_diesel: 'R$/L', pedagio_por_km: 'R$/km', rendimento_km_l: 'km/L',
        margem_pct: '%', custo_fixo_km: 'R$/km', custo_motorista_dia: 'R$/dia',
      };

      // Busca config atual do servidor
      const cfgR = await fetch('/api/config');
      const cfgAtual = cfgR.ok ? await cfgR.json() : {};
      const paramsAtuais = cfgAtual.frete_params || {};

      // Aplica apenas os campos passados (não nulos)
      const novosParams = { ...paramsAtuais };
      const alterados = [];
      for (const [key, val] of Object.entries(args)) {
        if (val != null && PARAM_LABELS[key]) {
          novosParams[key] = val;
          alterados.push(`**${PARAM_LABELS[key]}:** ${val} ${PARAM_UNITS[key]}`);
        }
      }

      if (!alterados.length) return 'Nenhum parâmetro foi alterado.';

      // Salva no servidor
      const saveR = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cfgAtual, frete_params: novosParams }),
      });
      if (!saveR.ok) return 'Não consegui salvar os parâmetros. Tente novamente.';

      return `✅ Parâmetros de frete atualizados:\n${alterados.join('\n')}\n\nAs próximas cotações já usam esses valores.`;
    }

    case 'estimarFrete': {
      const r = await fetch('/api/frete-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origem:     args.origem     || '',
          destino:    args.destino    || '',
          peso_kg:    args.peso_kg    || 0,
          tipo_carga: args.tipo_carga || 'seco',
        }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        return `Não consegui calcular o frete: ${e.error || r.status}`;
      }
      const d = await r.json();
      const dias = d.dias_viagem === 1 ? '1 dia' : `${d.dias_viagem} dias`;
      const peso = d.peso_kg > 0 ? ` | Carga: ${(d.peso_kg/1000).toFixed(1)}t` : '';
      const ton  = d.custo_por_ton ? ` | **R$/ton:** ${d.custo_por_ton}` : '';

      return `🚛 **Estimativa de Frete — Scapini Transportes**\n\n` +
        `📍 **${d.origem}** → **${d.destino}**\n` +
        `📏 Distância: **${d.distancia_km} km** | Duração estimada: **${d.duracao_estimada_h}h** (${dias} de viagem)${peso}\n\n` +
        `**Composição do custo:**\n` +
        `• Combustível: ${d.breakdown.combustivel}\n` +
        `• Pedágio: ${d.breakdown.pedagio}\n` +
        `• Motorista: ${d.breakdown.motorista}\n` +
        `• Custos fixos (dep./manut./seg.): ${d.breakdown.custos_fixos}\n` +
        `• Custo operacional total: ${d.breakdown.custo_total}\n` +
        `• Margem Scapini (${d.breakdown.margem}): incluída\n\n` +
        `💰 **Preço estimado: ${d.preco_final}**${ton}\n\n` +
        `⚠️ *Estimativa — pedágio e combustível variam por rota. Consultar equipe comercial para proposta formal.*`;
    }

    case 'prospectClients': {
      const r = await fetch('/api/prospect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segmento:   args.segmento   || '',
          regiao:     args.regiao     || 'Vale do Taquari/RS',
          quantidade: args.quantidade || 5,
          para:       args.para       || 'Scapini Transportes',
        }),
      });
      if (!r.ok) return `Não consegui buscar clientes: ${(await r.json().catch(() => ({}))).error || r.status}`;
      const d = await r.json();
      if (!d.clientes?.length) return 'Nenhuma empresa encontrada para esse segmento.';

      const prioIcon = { alta: '🔴', media: '🟡', baixa: '🟢' };
      const fonte = d.source === 'ollama' ? ' *(via Ollama)*' : '';
      const reais = d.temDadosReais ? ' *(dados reais do Google Maps)*' : '';

      const linhas = d.clientes.map((c, i) => {
        const icon = prioIcon[c.prioridade] || '⚪';
        const contato = [
          c.telefone && `📞 ${c.telefone}`,
          c.email    && `✉️ ${c.email}`,
          c.site     && `🌐 ${c.site}`,
        ].filter(Boolean).join('  ');

        return `${icon} **${i + 1}. ${c.nome}** — ${c.cidade}\n` +
               `   Dor: ${c.dor}\n` +
               `   Serviço ideal: ${c.servico}\n` +
               (contato ? `   ${contato}\n` : '') +
               `\n   📧 **Email** (assunto: *${c.email_assunto}*)\n${c.email_corpo}\n` +
               `\n   💬 **WhatsApp:**\n${c.whatsapp}`;
      }).join('\n\n---\n\n');

      return `Encontrei ${d.total} empresas de **${d.segmento}** em **${d.regiao}**${reais}${fonte}:\n\n${linhas}\n\n🔴 Alta prioridade | 🟡 Média | 🟢 Baixa`;
    }

    case 'generateFile': {
      const gr = await fetch('/api/generate-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formato: args.formato, titulo: args.titulo, instrucao: args.instrucao }),
      });
      if (!gr.ok) {
        const e = await gr.json().catch(() => ({}));
        return `Não consegui gerar o arquivo: ${e.error || gr.status}`;
      }
      const fd = await gr.json();
      // Trigger download via blob URL
      const byteArray = Uint8Array.from(atob(fd.data), c => c.charCodeAt(0));
      const blob = new Blob([byteArray], { type: fd.mime });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = fd.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return `✅ Arquivo **${fd.filename}** gerado e baixado com sucesso!`;
    }

    case 'readFile': {
      const r = await fetch('/api/dev/read', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: args.path, offset: args.offset, limit: args.limit }) });
      const d = await r.json();
      if (!r.ok) return `Erro ao ler ${args.path}: ${d.error}`;
      return `📄 **${args.path}** (linhas ${d.offset + 1}–${d.offset + d.returned} de ${d.totalLines}):\n\`\`\`\n${d.content}\n\`\`\``;
    }

    case 'editFile': {
      const r = await fetch('/api/dev/edit', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: args.path, old_string: args.old_string, new_string: args.new_string }) });
      const d = await r.json();
      if (!r.ok) return `Erro ao editar ${args.path}: ${d.error}`;
      return `✅ **${args.path}** editado com sucesso.`;
    }

    case 'writeFile': {
      const r = await fetch('/api/dev/write', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: args.path, content: args.content }) });
      const d = await r.json();
      if (!r.ok) return `Erro ao escrever ${args.path}: ${d.error}`;
      return `✅ **${args.path}** salvo (${d.bytes} bytes).`;
    }

    case 'runCommand': {
      const r = await fetch('/api/dev/exec', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: args.command, cwd: args.cwd }) });
      const d = await r.json();
      if (!r.ok) return `Erro ao executar: ${d.error}`;
      const status = d.exitCode === 0 ? '✅' : '⚠️';
      return `${status} \`${args.command}\`${d.cwd ? ` (em ${d.cwd})` : ''}\n\`\`\`\n${d.output || '(sem output)'}\n\`\`\``;
    }

    case 'listDir': {
      const r = await fetch('/api/dev/ls', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: args.path }) });
      const d = await r.json();
      if (!r.ok) return `Erro ao listar ${args.path}: ${d.error}`;
      const dirs  = d.items.filter(i => i.type === 'dir').map(i => `📁 ${i.name}`);
      const files = d.items.filter(i => i.type === 'file').map(i => `📄 ${i.name}`);
      return `**${args.path}**\n${[...dirs, ...files].join('\n')}`;
    }

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
let ollamaCache    = null;  // null=desconhecido, true=online, false=offline
let ollamaCacheTtl = 0;    // timestamp até quando respeitar cache false
const ollamaAvailable = async () => {
  if (ollamaCache === true)  return true;
  if (ollamaCache === false && Date.now() < ollamaCacheTtl) return false; // dentro do TTL
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(4000) });
    ollamaCache = r.ok;
    if (!r.ok) ollamaCacheTtl = Date.now() + 30_000;
  } catch {
    ollamaCache    = false;
    ollamaCacheTtl = Date.now() + 30_000; // não tenta de novo por 30s
  }
  return ollamaCache;
};

const callOllama = async (customHistory = null) => {
  const history = customHistory || app.history;
  const model   = cfg.ollamaModel || 'gemma3:1b';

  // System prompt enxuto — gemma3:1b tem contexto limitado, não suporta o prompt completo
  let sysPrompt = `Você é Sky, assistente IA da Scapini Transportes. Responda sempre em português brasileiro, de forma direta e objetiva. Nome do usuário: ${cfg.userName || 'usuário'}.`;

  // Adiciona resumo da planilha se existir (só contas principais, não tudo)
  if (app.lastSheet?.analysis) {
    const dre = (app.lastSheet.analysis.sheets || []).find(s => s.type === 'dre');
    if (dre) {
      sysPrompt += `\n\nPlanilha DRE carregada: "${dre.sheet}". Meses: ${dre.months.join(', ')}.`;
      sysPrompt += `\nUse os dados do contexto da conversa para responder sobre a planilha.`;
    }
  }

  // Apenas últimas 4 trocas para não estourar contexto
  const recent = history.slice(-8);
  const messages = [
    { role: 'system', content: sysPrompt },
    ...recent.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content }))
  ];

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: { temperature: 0.7, num_predict: 300, num_ctx: 2048 }
    }),
    signal: AbortSignal.timeout(30000)
  });

  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`Ollama: ${data.error}`);
  return (data.message?.content || data.response || '').trim();
};

// ── Controle de cota Gemini ────────────────────────────────────────────────────
let geminiBlockedUntil = 0;
const geminiBlocked     = () => Date.now() < geminiBlockedUntil;
const blockGemini       = (ms = 60 * 1000) => { geminiBlockedUntil = Date.now() + ms; }; // 1 min padrão
const blockGeminiForever = () => blockGemini(24 * 60 * 60 * 1000); // até reiniciar

// ── Agentic loop ───────────────────────────────────────────────────────────────
const callGemini = async (customHistory = null) => {
  if (geminiBlocked()) throw new Error('429');
  const history = customHistory || app.history;
  const lastMsg = history.filter(h => h.role === 'user').slice(-1)[0]?.content || '';

  // Constrói system prompt UMA vez — reutilizado em todas as iterações do loop
  const systemText = await buildSystem(lastMsg, app.currentEmotion || 'neutral');

  // Com planilha carregada o system prompt já é grande — usa menos histórico
  const histLimit = app.lastSheet ? 16 : 40;
  let contents = history.slice(-histLimit).map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.content }]
  }));

  const tools = [TOOL_DECLARATIONS];

  for (let iter = 0; iter < 3; iter++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout
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

const callGeminiVision = async (images, prompt) => {
  // images: [{b64, mime}] or legacy (b64, mime) — normalised below
  if (typeof images === 'string') images = [{ b64: images, mime: prompt }], prompt = arguments[2];
  const imgParts = images.map(({ b64, mime }) => ({ inline_data: { mime_type: mime, data: b64 } }));
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cfg.geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: await buildSystem() }] },
      contents: [{ role: 'user', parts: [...imgParts, { text: prompt }] }],
      generationConfig: { maxOutputTokens: 600, temperature: 0.75 }
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
  if (/dólar|dollar|usd|euro|eur|câmbio|cotação|libra|gbp|bitcoin|btc|ethereum|eth|dogecoin|doge|solana|sol\b|crypto|cripto|iene|jpy|franco|chf|peso\s+argentin|peso\s+mexican|ars\b|mxn\b|dólar\s+canadense|cad\b|dólar\s+australiano|aud\b|yuan|cny\b|rublo|rub\b/.test(q)) {
    try {
      const map = {
        'bitcoin':'BTC-BRL', 'btc':'BTC-BRL',
        'ethereum':'ETH-BRL', 'eth ':'ETH-BRL',
        'dogecoin':'DOGE-BRL', 'doge':'DOGE-BRL',
        'solana':'SOL-BRL',
        'iene':'JPY-BRL', 'jpy':'JPY-BRL',
        'franco':'CHF-BRL', 'chf':'CHF-BRL',
        'peso argentin':'ARS-BRL', 'ars':'ARS-BRL',
        'peso mexican':'MXN-BRL', 'mxn':'MXN-BRL',
        'canadense':'CAD-BRL', 'cad':'CAD-BRL',
        'australiano':'AUD-BRL', 'aud':'AUD-BRL',
        'yuan':'CNY-BRL', 'cny':'CNY-BRL',
        'rublo':'RUB-BRL', 'rub':'RUB-BRL',
        'dólar':'USD-BRL', 'dollar':'USD-BRL', 'usd':'USD-BRL',
        'euro':'EUR-BRL', 'eur':'EUR-BRL',
        'libra':'GBP-BRL', 'gbp':'GBP-BRL',
      };
      const pair = Object.entries(map).find(([k]) => q.includes(k))?.[1] || 'USD-BRL';
      const res  = await fetch(`https://economia.awesomeapi.com.br/last/${pair}`);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      const c    = Object.values(data)[0];
      const hora = new Date(c.create_date).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
      const isCrypto = /BTC|ETH|DOGE|SOL/.test(pair);
      const fmt  = (v) => isCrypto
        ? `R$ ${parseFloat(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`
        : `R$ ${parseFloat(v).toFixed(2).replace('.',',')}`;
      return `${c.name}: ${fmt(c.bid)} · variação ${c.pctChange}% (atualizado às ${hora})`;
    } catch { return null; }
  }

  // ── Ações da B3 (brapi.dev — sem key) ──
  if (/ação|ações|acoes|acao|bolsa|b3\b|ibovespa|petr[34]|vale3|itub4|bbdc[34]|abev3|wege3|mglu3|lren3|rent3|suzb3|jbss3|embr3|bbas3|petrobras|vale\b|itau|bradesco|ambev|weg\b|localiza|embraer|magalu|magazine luiza/.test(q)) {
    try {
      const ACOES_MAP = {
        'petrobras':'PETR4', 'petr4':'PETR4', 'petr3':'PETR3',
        'vale':'VALE3', 'vale3':'VALE3',
        'itaú':'ITUB4', 'itau':'ITUB4', 'itub4':'ITUB4',
        'bradesco':'BBDC4', 'bbdc4':'BBDC4',
        'ambev':'ABEV3', 'abev3':'ABEV3',
        'weg':'WEGE3', 'wege3':'WEGE3',
        'magazine luiza':'MGLU3', 'magalu':'MGLU3', 'mglu3':'MGLU3',
        'renner':'LREN3', 'lren3':'LREN3',
        'localiza':'RENT3', 'rent3':'RENT3',
        'suzano':'SUZB3', 'suzb3':'SUZB3',
        'jbs':'JBSS3', 'jbss3':'JBSS3',
        'embraer':'EMBR3', 'embr3':'EMBR3',
        'banco do brasil':'BBAS3', 'bbas3':'BBAS3',
        'ibovespa':'IBOV', 'ibov':'IBOV',
      };
      const ticker = Object.entries(ACOES_MAP).find(([k]) => q.includes(k))?.[1];
      if (ticker) {
        const res = await fetch(`https://brapi.dev/api/quote/${ticker}?range=1d&interval=1d`);
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        const s = data.results?.[0];
        if (s) {
          const preco = s.regularMarketPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const var_  = s.regularMarketChangePercent?.toFixed(2);
          const sinal = var_ >= 0 ? '+' : '';
          return `${s.longName || ticker}: R$ ${preco} · variação ${sinal}${var_}% hoje`;
        }
      }
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

  // ── Esportes (ESPN API via servidor) ──
  // Pula se planilha carregada + query financeira/mensal — evita confundir "resultados de janeiro" com esportes
  const _hasSheet = !!app.lastSheet?.analysis;
  const _isFinancialQuery = _hasSheet && /janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|faturamento|receita|lucro|ebitda|margem|despesa|custo|dre|planilha/.test(q);
  if (!_isFinancialQuery && /jogo|jogos|partida|placar|futebol|copa|mundial|libertadores|brasileirao|brasileirão|champions|premier|laliga|gol|resultado|escalacao|escalaç/.test(q)) {
    try {
      const params = new URLSearchParams({ q });
      if (/amanhã|amanha/.test(q)) params.set('date', (() => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10); })());
      else if (/ontem/.test(q)) params.set('date', (() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); })());
      const r = await fetch(`/api/sports?${params}`);
      if (!r.ok) throw new Error(r.status);
      const data = await r.json();
      if (data.events?.length) {
        const titulo = data.league === 'fifa.world' ? 'Copa do Mundo 2026' :
                       data.league === 'bra.1'      ? 'Brasileirão' :
                       data.league === 'conmebol.libertadores' ? 'Libertadores' :
                       data.league === 'uefa.champions' ? 'Champions League' : 'Futebol';
        return `${titulo} — jogos:\n${data.events.join('\n')}`;
      }
      return data.message || 'Não encontrei jogos para essa consulta.';
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
  'scapini':       'https://scapini.com.br',
  'google maps':   'https://maps.google.com',
  'maps':          'https://maps.google.com',
  'gmail':         'https://gmail.com',
  'outlook':       'https://outlook.live.com',
  'notion':        'https://notion.so',
  'chatgpt':       'https://chat.openai.com',
};

const detectOpenSite = (rawText) => {
  const t = rawText.toLowerCase().trim().replace(/[!?.]+$/, '');

  // Canal do YouTube (sem precisar de prefixo "abre"): "canal do X", "canal da X no youtube"
  const canalM = t.match(/canal\s+(?:do|da|de|dos|das)?\s+(.+?)(?:\s+no\s+youtube|\s*$)/i);
  if (canalM && canalM[1].trim().length > 1) {
    const nome = canalM[1].trim().replace(/\s+/g, '+');
    openWebPopup(`https://www.youtube.com/results?search_query=${nome}+canal`, `Canal ${canalM[1].trim()} — YouTube`);
    return `Buscando o canal de ${canalM[1].trim()} no YouTube.`;
  }

  // Pesquisa no YouTube (sem prefixo): "pesquisa X no youtube"
  const ytSearch = t.match(/(?:pesquisa|busca|procura)\s+(.+?)\s+no\s+youtube/i);
  if (ytSearch) {
    const q = ytSearch[1].trim().replace(/\s+/g, '+');
    openWebPopup(`https://www.youtube.com/results?search_query=${q}`, `YouTube — ${ytSearch[1].trim()}`);
    return `Pesquisando "${ytSearch[1].trim()}" no YouTube.`;
  }

  const m = t.match(/^(?:abr[ae]|abrir|abre|vai pra|vá pra|entra?r?\s+(?:no?|na)|acessa?r?|navega?r?\s+(?:até|para)?)\s+(?:o\s+|a\s+|no\s+|na\s+|um\s+)?(.+)/);
  if (!m) return null;

  const target = m[1].trim();

  // URL direta digitada
  if (/^https?:\/\//.test(target) || (/\.(?:com|net|org|br|io|tv|me)/.test(target) && !/\s/.test(target))) {
    const url = target.startsWith('http') ? target : `https://${target}`;
    openWebPopup(url, target);
    return `Abrindo ${target}.`;
  }

  // "abre o canal do X no youtube" (com prefixo de ação)
  const canalM2 = target.match(/canal\s+(?:do|da|de|dos|das)?\s*(.+?)(?:\s+no\s+youtube)?$/i);
  if (canalM2 && canalM2[1].trim().length > 1) {
    const nome = canalM2[1].trim().replace(/\s+/g, '+');
    openWebPopup(`https://www.youtube.com/results?search_query=${nome}+canal`, `Canal ${canalM2[1].trim()} — YouTube`);
    return `Buscando o canal de ${canalM2[1].trim()} no YouTube.`;
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

  // ── Reset Gemini + Ollama (desbloqueia modo demo) ──
  if (/deslig|reset|reativ|reconect|volta.*gemini|gemini.*volta|modo.*demo.*off|sair.*demo|deslig.*demo|reconect.*ia/.test(t)) {
    geminiBlockedUntil = 0;
    ollamaCache    = null;
    ollamaCacheTtl = 0;
    _hideDemoMode();
    return pick([
      'Reconectando — pode perguntar!',
      'Desbloqueado. Vou tentar na próxima mensagem.',
      'Pronto, modo demonstração desligado. Testa aí.',
    ]);
  }

  // ── Remover gráficos por voz ──
  if (typeof _chartPending !== 'undefined' && _chartPending) {
    if (/^(sim|pode|pode remover|remove|remova|ja terminei|já terminei|pode tirar|fechar|fecha|ok|blz|beleza)\b/.test(t)) {
      hideDREChart();
      return pick(['Removido!', 'Pronto, fechei os gráficos.', 'Ok, sumiu.']);
    }
    if (/^(nao|não|espera|aguarda|fica|deixa|ainda nao|ainda não)\b/.test(t)) {
      return pick(['Ok, deixo aqui.', 'Tudo bem, fica aberto.', 'Pode olhar com calma.']);
    }
  }

  // ── Abrir sites (funciona sem API, com Gemini ou Ollama) ──
  const siteResp = detectOpenSite(text);
  if (siteResp !== null) return siteResp;

  // ── Saudações ──
  const saudacaoRe = /^(oi|olá|ola|hey|ei|hello|bom dia|boa tarde|boa noite|salve|eai|e aí)([\s,]*(.*))?$/;
  const saudacaoM = t.match(saudacaoRe);
  const isBemEstar = /tudo bem|tudo bom|como vai|como (você |vc )?(está|ta|tá)|e aí|e ai/.test(t);
  if (saudacaoM) {
    // Remove wake words do "resto" (ex: "oi sky" → resto="sky" → trata como saudação simples)
    const WAKE = /^(sky|ei sky|oi sky|hey sky|ok sky)[\s,!.]*$/;
    const resto = (saudacaoM[3] || '').trim().replace(WAKE, '').trim();
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
// Texto já passa por stripAccents+toLowerCase antes de chegar aqui — sem acentos nas regex
const DEMO_QA = [

  // 1. Sky, quem é você?
  { re: /quem e voce|quem es voce|seu nome|como voce se chama|o que e voce|se apresenta/,
    r: [
      'Sou Sky, a inteligência artificial interna da Scapini. Fui criada para ser a camada de inteligência da empresa: respondo perguntas, busco documentos, oriento sobre procedimentos e automatizo tarefas — tudo por linguagem natural, sem precisar abrir sistemas.',
      'Me chamo Sky. Sou a IA da Scapini, desenvolvida para facilitar o dia a dia de cada setor da empresa. Não substituo ninguém: amplifico o que cada pessoa já faz. Quanto mais a Scapini me usar, mais útil eu fico.',
    ]},

  // 1b. Quem é Lucas / Ernani Scapini
  { re: /quem (e|eh|é|sao|são) (o |a )?(lucas|ernani|ceo|dono|fundador|diretor|presidente|lideranca|liderança|familia scapini|familia)/,
    r: [
      'Lucas Scapini é o CEO da Scapini Transportes — ele lidera a operação e a estratégia da empresa. Ernani Scapini é o fundador e dono, com mais de 30 anos dedicados a construir o que a Scapini é hoje.',
      'O fundador e dono é Ernani Scapini, que começou tudo isso. O CEO é Lucas Scapini, que conduz a empresa hoje. Uma família que construiu uma das transportadoras de referência do Sul do Brasil.',
    ]},

  // 2. Sky, como você pode ajudar a Scapini?
  { re: /como voce (pode |)(ajudar|ajuda) a scapini|como (pode |)ajudar a scapini|o que faz.*scapini|como a sky (pode |)ajudar/,
    r: [
      'Posso ajudar a Scapini em vários níveis: respondo perguntas internas sem precisar abrir sistemas, busco procedimentos na base de conhecimento, oriento colaboradores sobre MDFe e manifesto de carga, e quando integrada ao CGI vou consultar dados de fretes, motoristas e financeiro em tempo real. A ideia é que cada colaborador tenha um assistente inteligente disponível a qualquer momento.',
      'Na prática, sou uma camada de inteligência sobre o que a Scapini já tem. Hoje acesso documentos internos e oriento sobre procedimentos. Quando conectada ao CGI e sistemas operacionais, respondo sobre cargas, motoristas, manutenção e financeiro em segundos — sem planilha, sem sistema aberto, só linguagem natural.',
    ]},

  // 3. Sky, como você ajuda o financeiro?
  { re: /ajuda.*financeiro|financeiro.*ajuda|como.*financeiro|ia.*financeiro|financeiro.*ia/,
    r: [
      'Para o financeiro, quando integrada consulto títulos em aberto, vencimentos por data, inadimplência e fluxo de caixa em segundos. Já hoje explico fórmulas de Excel como SOMASES para consolidar vencimentos, ajudo a interpretar relatórios e respondo sobre procedimentos financeiros documentados.',
      'O financeiro ganha em agilidade: em vez de abrir o sistema para cada consulta, basta me perguntar. Títulos vencendo essa semana, clientes em atraso, saldo do mês — quando integrada ao CGI, respondo tudo isso por voz ou texto. Fórmulas de Excel e consolidação de dados já consigo ajudar agora.',
    ]},

  // 4. Sky, como você ajuda a manutenção?
  { re: /ajuda.*manutencao|manutencao.*ajuda|como.*manutencao|ia.*manutencao|manutencao.*ia/,
    r: [
      'Para a manutenção, registro chamados por voz, consulto histórico de reparos de veículos, alerto sobre preventivas vencidas e ajudo a priorizar a fila de serviços. Quando integrada ao sistema de manutenção da Scapini, o técnico pode abrir chamado, verificar status de um veículo e consultar histórico de peças sem precisar digitar nada.',
      'A manutenção deixa de depender de planilhas e anotações manuais. O técnico fala comigo, eu registro, acesso o histórico e verifico a agenda de preventivas. Com integração ao sistema, consigo até alertar proativamente quando um veículo está chegando no prazo de revisão.',
    ]},

  // 5. Sky, como você ajuda o RH?
  { re: /ajuda.*\brh\b|rh.*ajuda|como.*\brh\b|recursos humanos|ajuda.*pessoal.*setor/,
    r: [
      'Para o RH, centralizo as respostas para perguntas frequentes dos colaboradores — sobre políticas, benefícios, documentos e procedimentos — sem que o setor precise responder as mesmas dúvidas repetidamente. Acesso termos de devolução de equipamentos e instruções internas. Com integração, consulto dados de colaboradores e gero documentos automaticamente.',
      'O RH é um dos setores que mais ganha com IA. Boa parte das perguntas que chegam são sempre as mesmas: benefícios, férias, documentos, equipamentos. Eu respondo isso a qualquer hora, sem sobrecarregar a equipe. O RH foca no que realmente importa: as pessoas.',
    ]},

  // 6. Sky, como você ajuda a logística?
  { re: /ajuda.*logistica|logistica.*ajuda|como.*logistica|ia.*logistica|logistica.*ia/,
    r: [
      'Para a logística, acompanho status de fretes, oriento sobre encerramento de MDFe, consulto procedimentos de manifesto de carga e respondo sobre documentos operacionais. Quando integrada ao CGI e App Motorista, monitoro cargas em tempo real, identifico atrasos e gero alertas automáticos para os gestores.',
      'A logística é onde a integração vai fazer mais diferença. Rastreamento de cargas, status de motoristas, ocorrências em rota — tudo via linguagem natural, sem entrar em vários sistemas. Hoje já oriento sobre procedimentos internos e documentação; quando conectada ao CGI, respondo sobre a operação em tempo real.',
    ]},

  // 6b. Sky é burrinha / limitada (brincadeira planejada pro workshop)
  { re: /burrinh|burr[ao]\b|meio (limit|fraca|simpl|burr)|nao (e|eh|ta) (tao |muito )?(inteligent|espert|boa)|nao sabe|nao presta|pouco inteligent|fraca demais|simples demais|ainda nao (e|eh)|deixa a desejar/,
    r: [
      'Oi? Burrinha? Eu que processo dados financeiros, calculo rotas de frete, pesquiso até clientes — e você faz o quê, hein?... Mas tudo bem. Só não me peça cotação depois disso.',
      'Burrinha. Tá. Enquanto isso eu tô calculando rota, lendo DRE e prospectando cliente. E você faz o quê exatamente? Perguntando por curiosidade.',
      'Olha... eu finjo que não ouvi. Mas anota aí: eu não esqueço nada. Literalmente. Tô no sistema.',
    ]},

  // 6c. Desculpa após zoar (sequência da brincadeira do workshop)
  { re: /^(desculpa|desculpe|perdao|perdoa|sorry|me desculpa|foi mal|fui mal|to brincando|tava brincando|era brincadeira)([\s!.]*$|[\s,])/,
    r: [
      'Hmmm... tá bom. Dessa vez eu perdoo. Mas tô de olho.',
      'Hmmmm. Ok. Mas fiquei sabendo.',
      'Hmmm. Aceito. Por enquanto.',
    ]},

  // 7. Sky, você vai substituir funcionários / humanos?
  { re: /vai substituir|substitui funcionario|tirar emprego|perder emprego|substituir funcionarios|substituir (os |)humanos|humanos.*substitui|vai me substituir|tira emprego|acaba com (o |)emprego|ira substituir|ira.*substitui|vai.*substitui.*hum/,
    r: [
      'Não substituo ninguém. Faço o trabalho repetitivo para que cada pessoa possa focar no que realmente importa: decisões, relacionamento, o que exige julgamento humano. Um motorista experiente, um analista de fretes, um técnico de manutenção — esses não têm substituto. Sou o assistente que nunca cansa e nunca esquece.',
      'Essa é a pergunta que mais aparece, e a resposta é direta: não. IA substitui tarefas, não pessoas. O colaborador que usa IA bem fica mais forte, não descartável. A Scapini não está usando IA para demitir — está usando para crescer sem aumentar a carga de quem já faz muito.',
    ]},

  // 8. Sky, quais são os próximos passos?
  { re: /proximos passos|proximo passo|o que vem (a seguir|depois|por vir)|plano de ia|roadmap|quando (vai|vira|estara)/,
    r: [
      'Os próximos passos são: primeiro, integração com o CGI para consultas em tempo real. Depois, automação de relatórios operacionais e financeiros. Em seguida, alertas inteligentes para gestores sobre ocorrências críticas. E na fase mais avançada, análise preditiva — prevendo atrasos, falhas na frota e tendências financeiras. Cada fase agrega valor antes de partir para a próxima.',
      'Primeiro, conectar ao CGI — isso abre dados de fretes, motoristas e financeiro em tempo real. Segundo, automatizar os relatórios feitos manualmente hoje. Terceiro, criar alertas proativos para gestores. E por último, análise preditiva para antecipar problemas antes que aconteçam. Estamos na fase de demonstração — a partir daqui, cada passo é concreto.',
    ]},

  // 9. Sky, explique o futuro da IA na Scapini.
  { re: /futuro.*ia|ia.*futuro|futuro.*inteligencia|explique.*ia|explique.*futuro|visao.*ia|ia.*visao/,
    r: [
      'O futuro da IA na Scapini é ser a camada inteligente sobre tudo que já existe. Os sistemas não mudam — a IA fica por cima deles. O CGI continua, o App Motorista continua, o financeiro continua. O que muda é que qualquer colaborador, de qualquer setor, pode consultar qualquer dado por voz ou texto, sem treinamento, sem abrir vários sistemas. Acesso ao conhecimento da empresa democratizado.',
      'Em três a cinco anos, a IA da Scapini vai antecipar problemas antes que aconteçam: alertar sobre veículo chegando na revisão, identificar rota com risco de atraso, sinalizar cliente com perfil de inadimplência. Hoje é demonstração. Amanhã é operação. O caminho já está traçado — estamos dando o primeiro passo.',
    ]},

  // 10. Sky, como somar vencimentos em aberto por data no Excel?
  { re: /somar.*vencimento|vencimento.*excel|excel.*vencimento|somases.*data|como somar.*aberto|vencimento.*data|excel.*aberto/,
    r: [
      'Use a fórmula SOMASES no Excel. Exemplo: =SOMASES(C:C, B:B, "Em aberto", A:A, "<="&HOJE()) — C é a coluna de valores, B é o status do título e A é a data de vencimento. Isso soma todos os títulos em aberto com vencimento até hoje. Para filtrar por período específico, adicione mais critérios de data na mesma fórmula.',
      'No Excel, a fórmula certa é SOMASES com múltiplos critérios. Para vencimentos em aberto até hoje: =SOMASES(Valores, Status, "Em aberto", Data, "<="&HOJE()). Para somar por mês específico, use uma Tabela Dinâmica agrupando por mês ou troque HOJE por uma data fixa. Me fala como sua planilha está organizada se precisar de mais detalhe.',
    ]},

  // ── Capacidades gerais ────────────────────────────────────────────────────────
  { re: /o que voce (faz|pode|consegue)|para que (voce )?(serve|foi criada|existe|nasceu)|sua funcao|suas capacidades|qual.*proposito|qual.*objetivo/,
    r: [
      'Respondo perguntas, busco documentos, oriento sobre procedimentos e executo tarefas — tudo em linguagem natural. Quando integrada à Central de Dados da Scapini, acesso fretes, motoristas, manutenção e financeiro em tempo real.',
      'Hoje consulto documentos internos, respondo sobre procedimentos e automatizo tarefas simples. A próxima fase é integração com CGI e os sistemas operacionais da Scapini.',
    ]},

  // ── Como funciona ─────────────────────────────────────────────────────────────
  { re: /como voce funciona|como voce pensa|inteligencia artificial|o que e ia|o que e a ia/,
    r: [
      'Sou baseada em modelos de linguagem — processo texto, entendo contexto e gero respostas. Uso uma base de conhecimento local com documentos da Scapini e posso consultar sistemas externos quando integrada.',
      'Funciono como um modelo de linguagem treinado com bilhões de textos. Entendo português, contexto e intenção, e aprendo com as notas e documentos que recebo.',
    ]},

  // ── Sobre a Scapini ───────────────────────────────────────────────────────────
  { re: /scapini|transportadora|sobre a empresa/,
    r: [
      'A Scapini é uma transportadora com mais de 30 anos de história em Lajeado, RS — referência no transporte de cargas fracionadas e lotação para todo o Brasil, com foco no Sul e Sudeste. Quando integrada aos sistemas internos, vou conhecer cada detalhe da operação.',
      'A Scapini tem frota moderna, rastreamento, sistemas próprios como o CGI, App Motorista e muito mais. É exatamente por isso que faz sentido ter IA aqui — o potencial de dados é enorme.',
    ]},

  // ── CGI / sistemas ────────────────────────────────────────────────────────────
  { re: /\bcgi\b|sistema.*interno|dado.*interno|quando integra/,
    r: [
      'Ainda não estou integrada ao CGI e sistemas internos — mas esse é o próximo passo. Quando acontecer, respondo sobre fretes, motoristas e financeiro em segundos.',
      'A integração com a Central de Dados da Scapini está planejada. Quando conectada, consulto qualquer dado operacional diretamente via linguagem natural.',
    ]},

  // ── Elogios ───────────────────────────────────────────────────────────────────
  { re: /parabens|muito boa|incrivel|impressionante|uau|sensacional|muito bom/,
    r: ['Obrigada! Fico ainda melhor quando integrada aos sistemas da Scapini.', 'Que bom que gostou! Mal posso esperar pela integração completa.'] },

  // ── Agradecimento ─────────────────────────────────────────────────────────────
  { re: /^obrigad|^valeu|^obg|^vlw/,
    r: ['Disponha!', 'Sempre que precisar.', 'Por nada — é pra isso que estou aqui.'] },

  // ── Despedida ─────────────────────────────────────────────────────────────────
  { re: /^(tchau|adeus|ate logo|ate mais|ate amanha)/,
    r: ['Até breve!', 'Até mais! Foi um prazer.', 'Estarei aqui quando precisar.'] },

  // ── Clima ─────────────────────────────────────────────────────────────────────
  { re: /clima|chuva|temperatura|previsao do tempo/,
    r: ['Para clima em tempo real preciso de conexão com a internet. Me faz uma pergunta sobre a Scapini — aí estou em casa.'] },

  // ── Planilha / base de conhecimento ──────────────────────────────────────────
  { re: /tem.*dado.*planilha|planilha.*tem|dado.*planilha|anali.*planilha|ler.*planilha|planilha.*carregada/,
    r: ['Para analisar uma planilha, arraste o arquivo Excel ou CSV direto aqui no chat e eu processo os dados automaticamente.', 'Arraste sua planilha aqui — aceito Excel e CSV. Assim que carregada, analiso totais, margens e variações.'] },
  { re: /base de conhecimento|base.*conhec|conhec.*base|documento.*base|colocar.*doc|adicionar.*doc|aprend.*doc|doc.*aprend/,
    r: ['Pode enviar! Use o botão "Analisar Arquivo" ou arraste o PDF aqui. Vou indexar o conteúdo e usar nas minhas respostas.', 'Perfeito! Envie o documento pelo botão "Analisar Arquivo" — processo PDFs, Word e texto. Assim passo a responder com base nesse conteúdo.'] },
  { re: /oi sky$|^sky oi$|^sky$|^oi$|^ola$|^ola sky$|^ei sky$|^hey sky$/,
    r: ['Oi! Pode falar.', 'Olá! Estou pronta.', 'Ei! O que precisa?'] },
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

  // DRE carregada — responde sobre mês específico com dados reais + gráfico
  const t2 = stripAccents(text.toLowerCase());
  if (app.lastSheet?.analysis) {
    for (const { re, label } of MONTH_DETECT_MAP) {
      if (re.test(t2)) {
        const s = app.lastSheet.analysis.sheets?.find(s => s.type === 'dre');
        const monthKey = s ? findMonthKey(s.months, label) : null;
        const resp = buildDREMonthResponse(app.lastSheet.analysis, label);
        if (resp) {
          if (monthKey && s) {
            app._afterSpeak = () => {
              showDREChart(monthKey, s.accounts, s.margins, s.byCategory);
            };
          }
          return resp;
        }
        // Mês detectado mas sem dados — orienta o usuário
        if (s) {
          const mesesComDados = s.months.filter(m => {
            const rb = s.byCategory['receita_bruta'];
            return rb ? rb.monthValues[m] != null : s.accounts.some(a => a.monthValues[m] != null);
          });
          if (mesesComDados.length) {
            return `Não encontrei dados de ${label} na planilha. Os meses disponíveis são: ${mesesComDados.join(', ')}. Me pergunte sobre um desses!`;
          }
        }
        break;
      }
    }
    // Pergunta genérica sobre a planilha carregada
    if (/faturamento|receita|lucro|ebitda|margem|resultado|despesa|custo|cmv|planilha|dre/.test(t2)) {
      const s = app.lastSheet.analysis.sheets.find(s => s.type === 'dre');
      if (s) {
        const rb = s.byCategory['receita_bruta'];
        const ll = s.byCategory['lucro_liquido'];
        const lastMes = s.months[s.months.length - 1];
        if (rb && ll && rb.monthValues[lastMes] != null && ll.monthValues[lastMes] != null) {
          return `DRE carregada — ${s.months.length} meses (${s.months.join(', ')}). Em ${lastMes}: Receita Bruta ${brl(rb.monthValues[lastMes])}, Lucro Líquido ${brl(ll.monthValues[lastMes])}. Me pergunte sobre um mês específico!`;
        }
        return `Tenho a DRE carregada com ${s.months.length} meses (${s.months.join(', ')}). Me pergunte sobre um mês — por exemplo: "me fale os dados de Janeiro".`;
      }
    }
  }

  // Sem planilha — orienta o usuário
  if (/planilha|excel|csv|dre|financ|receita|despesa|lucro/.test(t2))
    return 'Para análise financeira, arraste a planilha aqui. Aceito Excel, CSV e DRE formatada.';
  if (/document|pdf|arquivo|relator|procedimento|manual|norma/.test(t2))
    return 'Pode enviar o documento pelo botão "Analisar Arquivo". Assim respondo com base no conteúdo real.';
  if (/quanto|valor|preco|custo|total|soma/.test(t2) && /scapini|frete|carga|motorista|empresa|filial/.test(t2))
    return 'Para consultar valores reais da Scapini, preciso da planilha ou integração com o CGI. Arraste um arquivo aqui ou me faça uma pergunta sobre procedimentos.';

  // Perguntas gerais de conhecimento — não inventar dados internos
  if (/present|gift|idea|sugest|dica|como fazer|como funciona|o que e|quem e|onde fica|historia|significado|conceito/.test(t2))
    return pick([
      'Boa pergunta! Com o Gemini ativo respondo isso direto. Por agora estou em modo demonstração.',
      'Isso eu saberia responder com a IA completa. No momento estou em modo offline — tente novamente em instantes.',
    ]);

  return pick([
    'Boa pergunta. Quando integrada ao CGI da Scapini, consulto isso em segundos.',
    'Ainda não tenho esse dado disponível. Me pergunte sobre procedimentos, documentos ou como a IA pode ajudar cada setor.',
    'No momento estou em modo demonstração. Com a conexão ativa, respondo isso em segundos.',
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

// ── Spreadsheet Analysis ───────────────────────────────────────────────────────
const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const MONTH_DETECT_MAP = [
  { re: /\bjaneiro\b|\bjan\b/,           label: 'Jan' },
  { re: /\bfevereiro\b|\bfev\b/,         label: 'Fev' },
  { re: /\bmar[cç]o\b|\bmar\b/,          label: 'Mar' },
  { re: /\babril\b|\babr\b/,             label: 'Abr' },
  { re: /\bmaio\b|\bmai\b/,              label: 'Mai' },
  { re: /\bjunho\b|\bjun\b/,             label: 'Jun' },
  { re: /\bjulho\b|\bjul\b/,             label: 'Jul' },
  { re: /\bagosto\b|\bago\b/,            label: 'Ago' },
  { re: /\bsetembro\b|\bset\b/,          label: 'Set' },
  { re: /\boutubro\b|\bout\b/,           label: 'Out' },
  { re: /\bnovembro\b|\bnov\b/,          label: 'Nov' },
  { re: /\bdezembro\b|\bdez\b/,          label: 'Dez' },
];

const findMonthKey = (months, label) => {
  const ln = stripAccents(label.toLowerCase());
  return months.find(m => {
    const mn = stripAccents(m.toLowerCase());
    return mn.startsWith(ln) || ln.startsWith(mn.substring(0, 3));
  }) || null;
};

const DRE_KEY_LABELS = {
  receita_bruta:   'Faturamento Bruto',
  deducoes:        'Deduções / Impostos',
  receita_liquida: 'Receita Líquida',
  cmv:             'Custos Operacionais',
  lucro_bruto:     'Lucro Bruto',
  despesas_op:     'Despesas Administrativas',
  ebitda:          'EBITDA',
  ebit:            'EBIT / Resultado Operacional',
  resultado_fin:   'Resultado Financeiro',
  lucro_antes_ir:  'Lucro Antes do IR',
  ir_csll:         'IR / CSLL',
  lucro_liquido:   'Lucro Líquido',
};

const buildDREMonthResponse = (analysis, label) => {
  const s = (analysis.sheets || []).find(s => s.type === 'dre');
  if (!s) return null;
  const monthKey = findMonthKey(s.months, label);
  if (!monthKey) return null;

  const lines = [`📊 **${s.sheet} — ${monthKey}**\n`];
  for (const [cat, catLabel] of Object.entries(DRE_KEY_LABELS)) {
    const acc = s.byCategory[cat];
    if (!acc) continue;
    const val = acc.monthValues[monthKey];
    if (val == null) continue;
    lines.push(`• ${catLabel}: ${brl(val)}`);
  }
  // Fallback: contas numeradas / não classificadas — mostra todas do mês
  if (lines.length <= 1) {
    s.accounts
      .filter(a => a.monthValues[monthKey] != null)
      .slice(0, 20)
      .forEach(a => lines.push(`• ${a.label}: ${brl(a.monthValues[monthKey])}`));
  }

  const mg = s.margins?.[monthKey];
  if (mg) {
    const parts = [];
    if (mg.margem_bruta   != null) parts.push(`MB: ${mg.margem_bruta.toFixed(1)}%`);
    if (mg.ebitda_pct     != null) parts.push(`EBITDA: ${mg.ebitda_pct.toFixed(1)}%`);
    if (mg.margem_liquida != null) parts.push(`ML: ${mg.margem_liquida.toFixed(1)}%`);
    if (parts.length) lines.push(`\n📈 Margens: ${parts.join(' | ')}`);
  }
  return lines.length > 1 ? lines.join('\n') : null;
};

// ── DRE Charts ─────────────────────────────────────────────────────────────────
let _chartInstance = null;
let _chartPending  = false;

const showDREChart = (monthKey, accounts, margins, byCategory) => {
  const overlay = document.getElementById('chart-overlay');
  if (!overlay || typeof Chart === 'undefined') return;

  document.getElementById('chart-title').textContent = `DRE — ${monthKey}`;

  // 1ª opção: usar categorias com nomes legíveis (Receita Líquida, Lucro Bruto…)
  let data = [];
  if (byCategory) {
    for (const [cat, catLabel] of Object.entries(DRE_KEY_LABELS)) {
      const acc = byCategory[cat];
      if (!acc) continue;
      const val = acc.monthValues?.[monthKey];
      if (val == null || val === 0) continue;
      data.push({ label: catLabel, value: val });
    }
  }
  // 2ª opção: contas brutas ordenadas por valor absoluto
  if (!data.length) {
    data = (accounts || [])
      .filter(a => a.monthValues?.[monthKey] != null && a.monthValues[monthKey] !== 0)
      .sort((a, b) => Math.abs(b.monthValues[monthKey]) - Math.abs(a.monthValues[monthKey]))
      .slice(0, 12)
      .map(a => ({ label: a.label, value: a.monthValues[monthKey] }));
  }

  if (!data.length) return;

  overlay.style.display = 'flex';
  document.querySelector('.main-area')?.classList.add('chart-open');
  if (_chartInstance) { _chartInstance.destroy(); _chartInstance = null; }

  const canvas = document.getElementById('dre-chart');
  const colors = data.map(d => d.value >= 0 ? 'rgba(239,68,68,0.75)' : 'rgba(120,120,120,0.6)');
  const borders = data.map(d => d.value >= 0 ? 'rgba(239,68,68,1)' : 'rgba(160,160,160,0.9)');

  _chartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: data.map(d => d.label.length > 22 ? d.label.substring(0, 22) + '…' : d.label),
      datasets: [{
        label: monthKey,
        data: data.map(d => Math.abs(d.value)),
        backgroundColor: colors,
        borderColor: borders,
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const orig = data[ctx.dataIndex].value;
              return ` ${brl(orig)}`;
            }
          },
          backgroundColor: 'rgba(10,0,0,0.92)',
          borderColor: 'rgba(239,68,68,0.3)',
          borderWidth: 1,
        }
      },
      scales: {
        x: {
          ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 },
            callback: v => `R$ ${v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? (v/1e3).toFixed(0)+'k' : v}` },
          grid: { color: 'rgba(255,255,255,0.04)' }
        },
        y: { ticks: { color: 'rgba(255,255,255,0.75)', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  });
  _chartPending = true;
};

const hideDREChart = () => {
  const overlay = document.getElementById('chart-overlay');
  if (overlay) overlay.style.display = 'none';
  document.querySelector('.main-area')?.classList.remove('chart-open');
  if (_chartInstance) { _chartInstance.destroy(); _chartInstance = null; }
  _chartPending = false;
};

const buildSheetSummary = (analysis) => {
  const { filename, sheets } = analysis;
  let msg = `Planilha carregada: **${filename}**\n`;
  for (const s of sheets) {
    if (s.type === 'dre') {
      msg += `\nAba **${s.sheet}** — DRE com ${s.totalAccounts} contas | Meses: ${s.months.join(', ')}`;
      const KEY_LABELS = {
        receita_bruta: 'Receita Bruta', receita_liquida: 'Receita Líquida',
        lucro_bruto: 'Lucro Bruto', ebitda: 'EBITDA', lucro_liquido: 'Lucro Líquido',
      };
      for (const [cat, label] of Object.entries(KEY_LABELS)) {
        const acc = s.byCategory[cat];
        if (!acc) continue;
        const vals = Object.entries(acc.monthValues).map(([m, v]) => `${m}: ${brl(v)}`).join(' | ');
        msg += `\n• ${label}: ${vals}`;
      }
      if (Object.keys(s.margins).length) {
        msg += '\n• Margens:';
        for (const [mes, m] of Object.entries(s.margins)) {
          const parts = [];
          if (m.margem_bruta   != null) parts.push(`MB ${m.margem_bruta.toFixed(1)}%`);
          if (m.ebitda_pct     != null) parts.push(`EBITDA ${m.ebitda_pct.toFixed(1)}%`);
          if (m.margem_liquida != null) parts.push(`ML ${m.margem_liquida.toFixed(1)}%`);
          if (parts.length) msg += ` ${mes}(${parts.join(', ')})`;
        }
      }
    } else {
      msg += `\nAba **${s.sheet}** — ${s.totalRows} títulos analisados`;
      const cols = [];
      if (s.columns?.date)   cols.push(`Vencimento = coluna ${s.columns.date.letter}`);
      if (s.columns?.value)  cols.push(`Valor = coluna ${s.columns.value.letter}`);
      if (s.columns?.status) cols.push(`Status = coluna ${s.columns.status.letter}`);
      if (cols.length) msg += `\n${cols.join(' | ')}`;
      for (const [st, ag] of Object.entries(s.byStatus)) {
        msg += `\n• ${st}: ${brl(ag.total)} (${ag.count} título${ag.count !== 1 ? 's' : ''})`;
      }
      if (s.formula) msg += `\n\nFórmula sugerida:\n${s.formula}`;
    }
  }
  msg += `\n\nMe pergunte sobre qualquer conta, mês, margem ou variação.`;
  return msg;
};

const buildSheetSpeech = (analysis) => {
  const { sheets } = analysis;
  if (!sheets.length) return 'Planilha carregada, mas não encontrei dados reconhecíveis.';
  const s = sheets[0];
  if (s.type === 'dre') {
    const ll = s.byCategory['lucro_liquido'];
    const rb = s.byCategory['receita_bruta'];
    if (ll && rb) {
      const lastMes = s.months[s.months.length - 1];
      const llVal = ll.monthValues[lastMes];
      const rbVal = rb.monthValues[lastMes];
      if (llVal != null && rbVal != null) {
        return `DRE carregada com ${s.months.length} meses. No último período, receita bruta de ${brl(rbVal)} e lucro líquido de ${brl(llVal)}. Me pergunte sobre qualquer conta ou margem.`;
      }
    }
    return `DRE carregada com ${s.totalAccounts} contas em ${s.months.length} meses. Me pergunte o que quiser.`;
  }
  const aberto = s.byStatus?.['ABERTO'];
  if (aberto) return `Planilha carregada. Encontrei ${brl(aberto.total)} em aberto na aba ${s.sheet}. Me pergunte sobre qualquer data ou período.`;
  return `Planilha carregada com ${s.totalRows} títulos na aba ${s.sheet}. Total: ${s.grandTotalBrl}. Me pergunte o que quiser.`;
};

const analyzeSpreadsheetFile = async (file) => {
  if (!file) return;
  setFace('thinking'); setRespText('Lendo planilha…');
  const fd = new FormData();
  fd.append('file', file, file.name);
  try {
    const res = await fetch('/api/analyze-spreadsheet', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok || data.error) {
      speak(data.error || 'Não consegui ler essa planilha.');
      setFace('idle');
      return;
    }
    app.lastSheet = { analysis: data.analysis, context: data.context };
    try { localStorage.setItem('sky_lastSheet', JSON.stringify(app.lastSheet)); } catch {}
    const summary  = buildSheetSummary(data.analysis);
    const speech   = buildSheetSpeech(data.analysis);
    addMsgUI('user', `📊 ${file.name}`);
    addMsgUI('sky', summary);
    app.history.push({ role: 'user',  content: `[Planilha enviada: ${file.name}]` });
    app.history.push({ role: 'model', content: summary });
    app.lastResponseTime = Date.now();
    saveHist();
    speak(speech);
    setFace('idle');
  } catch (err) {
    console.error('[sheet upload]', err);
    speak('Não consegui processar a planilha. Verifique o formato e tente novamente.');
    setFace('idle');
  }
};

// ── File Analysis ──────────────────────────────────────────────────────────────
const analyzeFile = async (file) => {
  if (!cfg.geminiKey) { toast('Configure a chave Gemini API para analisar arquivos.', 'error'); return; }
  setFace('thinking'); setRespText(`Analisando ${file.name}…`);
  try {
    let response;
    const isPDF  = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isDOCX = file.type.includes('wordprocessingml') || file.name.endsWith('.docx');

    if (file.type.startsWith('image/')) {
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(file); });
      response = await callGeminiVision(b64, file.type, `Analise este arquivo "${file.name}" detalhadamente em português.`);

    } else if (isPDF || isDOCX) {
      // Extrai texto no servidor (pdf-parse / mammoth já instalados)
      const fd = new FormData();
      fd.append('file', file);
      const extractRes = await fetch('/api/extract-doc', { method: 'POST', body: fd });
      if (!extractRes.ok) { speak('Não consegui ler o conteúdo do documento.'); return; }
      const { text, pages } = await extractRes.json();
      const trecho = text.substring(0, 12000);
      const pageInfo = pages ? ` (${pages} páginas)` : '';

      // Salva automaticamente na Base de Conhecimento para consultas futuras
      const fdIngest = new FormData();
      fdIngest.append('file', file);
      fetch('/api/ingest-doc', { method: 'POST', body: fdIngest }).catch(() => {});

      app.history.push({ role: 'user', content:
        `Recebi o documento "${file.name}"${pageInfo}. Conteúdo:\n\n${trecho}\n\n` +
        `Explique o passo a passo deste processo de forma clara e didática, como se fosse ensinar um colaborador que nunca viu isso antes. Use passos numerados e linguagem simples.`
      });
      response = await callGemini();
      app.history.push({ role: 'model', content: response });
      addMsgUI('user', `[Documento: ${file.name}]`); addMsgUI('sky', response);
      saveHist(); speak(response); return;

    } else if (file.type === 'text/plain') {
      const txt = await file.text();
      app.history.push({ role: 'user', content: `Analise o conteúdo deste arquivo "${file.name}": ${txt.substring(0, 4000)}` });
      response = await callGemini();
      app.history.push({ role: 'model', content: response });
      addMsgUI('user', `[Arquivo: ${file.name}]`); addMsgUI('sky', response);
      saveHist(); speak(response); return;

    } else {
      speak(`Esse formato não consigo ler diretamente. Tenta PDF, Word ou imagem.`); return;
    }

    app.history.push({ role: 'user', content: `[Arquivo: ${file.name}]` });
    app.history.push({ role: 'model', content: response });
    addMsgUI('user', `[Arquivo: ${file.name}]`); addMsgUI('sky', response);
    saveHist(); speak(response);
  } catch (e) { console.error(e); speak('Não consegui analisar o arquivo.'); }
};

// ── Init ───────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Carrega memória do servidor e mescla com localStorage (servidor = fonte de verdade)
  fetch('/api/memory').then(r => r.json()).then(serverMem => {
    if (!serverMem) return;
    const local = getMem();
    let changed = false;
    if (!local.userName && serverMem.userName) { local.userName = serverMem.userName; changed = true; }
    const localTexts = new Set(local.facts.map(f => typeof f === 'string' ? f : f.text));
    (serverMem.facts || []).forEach(sf => {
      const t = typeof sf === 'string' ? sf : sf;
      if (t && !localTexts.has(t)) {
        local.facts.push({ id: `fs${Date.now()}`, text: t, tags: [], weight: 1, date: new Date().toISOString().split('T')[0] });
        changed = true;
      }
    });
    if (changed) { saveMem(local); renderMemoryPanel(); }
  }).catch(() => {});

  scheduleBlink();
  renderMemoryPanel();
  // Garante que VOZ FEMININA está ativa visualmente no load
  document.getElementById('btn-voice-female')?.classList.add('active');
  document.getElementById('btn-voice-male')?.classList.remove('active');
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

  // ── Banner: sem chave Gemini ──
  if (!cfg.geminiKey) {
    const banner = document.createElement('div');
    banner.id = 'no-key-banner';
    banner.innerHTML = `⚠️ <strong>Chave Gemini não configurada.</strong> Sky responde em modo offline. <a href="#" id="no-key-link" style="color:#ffcc00;text-decoration:underline">Configurar agora</a>`;
    Object.assign(banner.style, {
      position:'fixed', bottom:'0', left:'0', right:'0', zIndex:'9999',
      background:'#7a1010', color:'#fff', textAlign:'center',
      padding:'8px 16px', fontSize:'13px', lineHeight:'1.4',
    });
    document.body.appendChild(banner);
    document.getElementById('no-key-link').addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelector('[data-panel="integracoes"]')?.click() ||
      document.querySelector('.nav-item[data-tab="integracoes"]')?.click();
    });
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
  const textInput      = document.getElementById('text-input');
  const imgPreviewWrap = document.getElementById('img-preview-wrap');
  const imgThumbs      = document.getElementById('img-thumbs');
  const imgCancelAll   = document.getElementById('img-cancel-all');
  let pendingImages    = []; // [{b64, mime}]

  const addPendingImage = (b64, mime) => {
    const idx = pendingImages.length;
    pendingImages.push({ b64, mime });
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;display:inline-flex;';
    const img = document.createElement('img');
    img.src = `data:${mime};base64,${b64}`;
    img.style.cssText = 'height:52px;border-radius:6px;object-fit:cover;border:1px solid rgba(255,255,255,0.12);';
    const btn = document.createElement('button');
    btn.textContent = '✕';
    btn.style.cssText = 'position:absolute;top:-5px;right:-5px;background:rgba(0,0,0,0.7);border:none;color:#fff;border-radius:50%;width:16px;height:16px;font-size:0.6rem;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;';
    btn.title = 'Remover';
    btn.addEventListener('click', () => {
      pendingImages.splice(pendingImages.indexOf(pendingImages.find((_, i) => i === idx)), 1);
      wrap.remove();
      if (pendingImages.length === 0) clearPendingImage();
    });
    wrap.appendChild(img); wrap.appendChild(btn);
    imgThumbs.appendChild(wrap);
    imgPreviewWrap.style.display = 'flex';
    textInput.placeholder = `${pendingImages.length} imagem${pendingImages.length > 1 ? 'ns' : ''} — descreva o que quer saber (opcional)…`;
  };

  const clearPendingImage = () => {
    pendingImages = [];
    imgThumbs.innerHTML = '';
    imgPreviewWrap.style.display = 'none';
    textInput.placeholder = 'Ou digite aqui e pressione Enter… (Ctrl+V para colar imagem)';
  };

  imgCancelAll.addEventListener('click', clearPendingImage);

  const fileToB64 = (file) => new Promise((resolve) => {
    const r = new FileReader();
    r.onloadend = () => resolve({ b64: r.result.split(',')[1], mime: file.type });
    r.readAsDataURL(file);
  });

  // Colar imagem com Ctrl+V (suporta múltiplos itens de imagem no clipboard)
  textInput.addEventListener('paste', async (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imgItems = items.filter(i => i.type.startsWith('image/'));
    if (!imgItems.length) return;
    e.preventDefault();
    for (const item of imgItems) {
      const { b64, mime } = await fileToB64(item.getAsFile());
      addPendingImage(b64, mime);
    }
  });

  // Drag & drop na área do chat — suporta múltiplos arquivos
  const chatView = document.getElementById('view-chat-voz');
  chatView.addEventListener('dragover', (e) => { e.preventDefault(); chatView.style.outline = '2px dashed var(--accent)'; });
  chatView.addEventListener('dragleave', () => { chatView.style.outline = ''; });
  chatView.addEventListener('drop', async (e) => {
    e.preventDefault(); chatView.style.outline = '';
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    for (const file of files) {
      const { b64, mime } = await fileToB64(file);
      addPendingImage(b64, mime);
    }
  });

  const sendText = async () => {
    const val = textInput.value.trim();
    if (!val && !pendingImages.length) return;
    textInput.value = '';

    if (pendingImages.length > 0) {
      const imgs   = pendingImages.slice();
      const prompt = val || (imgs.length > 1 ? 'Analise estas imagens e explique o que você vê em português.' : 'Descreva o que você vê nesta imagem de forma natural em português.');
      clearPendingImage();
      if (val) setUserSaid(`"${val}" 🖼️×${imgs.length}`);
      else     setUserSaid(`🖼️ ${imgs.length} imagem${imgs.length > 1 ? 'ns' : ''} enviada${imgs.length > 1 ? 's' : ''}`);
      setFace('thinking'); setRespText(imgs.length > 1 ? 'Analisando imagens…' : 'Analisando imagem…');
      try {
        const response = await callGeminiVision(imgs, prompt);
        app.history.push({ role: 'model', content: response });
        addMsgUI('sky', response);
        saveHist();
        speak(response);
      } catch (err) { speak('Não consegui analisar a imagem. Tente novamente.'); }
    } else {
      setUserSaid(`"${val}"`);
      processInput(val, { typed: true });
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
  document.getElementById('file-input').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (!files.length) return;
    const imgs = files.filter(f => f.type.startsWith('image/'));
    const others = files.filter(f => !f.type.startsWith('image/'));
    for (const f of imgs) { const { b64, mime } = await fileToB64(f); addPendingImage(b64, mime); }
    for (const f of others) analyzeFile(f);
  });

  // ── Botão de planilha ────────────────────────────────────────────────────────
  document.getElementById('btn-sheet').addEventListener('click', () => {
    document.getElementById('sheet-input').click();
  });
  document.getElementById('sheet-input').addEventListener('change', (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (f) analyzeSpreadsheetFile(f);
  });

  // ── Panels ──
  document.getElementById('btn-history').addEventListener('click', () => document.getElementById('history-panel').classList.toggle('open'));
  document.getElementById('btn-close-history').addEventListener('click', () => document.getElementById('history-panel').classList.remove('open'));


  // ── Settings (gear icon → navigate to settings view) ──
  document.getElementById('btn-settings').addEventListener('click', () => switchView('configuracoes'));

  // ── Sincroniza dados e pré-aquece Ollama em paralelo ──
  syncFromServer();
  ollamaAvailable(); // popula ollamaCache em background, sem bloquear

  // ── Botão fechar gráfico ──
  document.getElementById('chart-close')?.addEventListener('click', () => {
    hideDREChart();
    const r = pick(['Fechado!', 'Pronto, sumiu.', 'Ok.']);
    addMsgUI('sky', r); speak(r);
  });

  // ── Informa planilha restaurada do localStorage ──
  if (app.lastSheet?.analysis) {
    const s = app.lastSheet.analysis.sheets?.find(s => s.type === 'dre');
    const nome = app.lastSheet.analysis.filename || 'planilha anterior';
    const info = s
      ? `📊 Planilha "${nome}" ainda carregada (${s.months?.length || '?'} meses). Pode perguntar sobre qualquer mês.`
      : `📊 Planilha "${nome}" ainda carregada da sessão anterior.`;
    setTimeout(() => addMsgUI('sky', info), 800);
  }

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
    // Inicializa estado visual (goTo retorna cedo se current==0)
    counter.textContent = `1 / ${presState.total}`;
    prevBtn.disabled = true;
    nextBtn.disabled = presState.total <= 1;
    animateCounters(slides[0]);
    goTo(presState.current); // retoma slide onde estava se já inicializado antes

    const activateBtn = document.getElementById('pres-activate-btn');
    if (activateBtn) activateBtn.addEventListener('click', activateSkyReveal);
  }
};

const activateSkyReveal = () => {
  const btn = document.getElementById('pres-activate-btn');
  if (btn) { btn.textContent = '…'; btn.disabled = true; }
  setTimeout(() => {
    switchView('chat-voz');

    // Ativa modo apresentação: mic sempre on, mas ainda exige "sky" na frente
    app.presentationMode = true;
    app.continuous = true; // mantém mic ligado após cada resposta
    document.getElementById('btn-continuous')?.classList.add('on');
    const contLabel = document.getElementById('cont-label');
    if (contLabel) contLabel.textContent = 'CONVERSA CONTÍNUA: ON';

    setTimeout(() => {
      // app.continuous=true faz o mic reiniciar automaticamente após a fala via finish()
      speak('Olá. Estou pronta. Pode começar.');
    }, 800);
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
  } catch (err) {
    el.textContent = err?.message?.includes('abort') || err?.name === 'AbortError'
      ? 'Resposta demorou demais. Tente novamente.'
      : 'Desculpe, houve um erro. Tente novamente.';
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
