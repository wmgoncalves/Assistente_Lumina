/**
 * Lúmina Learner — aprendizado autônomo
 * Roda à meia-noite via Agendador de Tarefas do Windows.
 * Completamente separado de server.js e app.js — zero impacto na Lúmina.
 */

const fs   = require('fs');
const path = require('path');

const CONFIG_FILE  = path.join(__dirname, 'config.json');
const OBSIDIAN_DIR = path.join(process.env.USERPROFILE || 'C:\\Users\\Scapini', 'Documents', 'Lumina Vault', 'Aprendizado');
const LOG_FILE     = path.join(__dirname, 'learner.log');

// ── Config ────────────────────────────────────────────────────────────────────
const config = (() => {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); }
  catch { log('ERRO: config.json não encontrado'); process.exit(1); }
})();

const GEMINI_KEY = config.geminiKey;
if (!GEMINI_KEY) { log('ERRO: geminiKey não configurado'); process.exit(1); }

// ── Tópicos base (rotacionam por dia) ────────────────────────────────────────
const BASE_TOPICS = [
  'transporte rodoviário de cargas Brasil 2025',
  'preço diesel combustível caminhão Brasil',
  'ANTT regulamentação transportes novas regras',
  'logística Rio Grande do Sul mercado',
  'tecnologia rastreamento frota logística',
  'legislação trabalhista motoristas caminhoneiros',
  'economia Brasil impacto no setor de transportes',
  'mercado de frete caminhão Brasil tendências',
  'sustentabilidade transportadora ESG logística',
  'segurança roubo de cargas Brasil',
];

// ── Utilitários ───────────────────────────────────────────────────────────────
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch {}
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Google News RSS (sem scraping, sem API key) ───────────────────────────────
async function fetchNewsRSS(topic) {
  const q   = encodeURIComponent(topic);
  const url = `https://news.google.com/rss/search?q=${q}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const xml   = await res.text();
    const items = [];
    const re    = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = re.exec(xml)) !== null && items.length < 4) {
      const b     = m[1];
      const title = (/<title><!\[CDATA\[(.*?)\]\]>/.exec(b) || /<title>(.*?)<\/title>/.exec(b))?.[1]?.trim() || '';
      const link  = (/<link>(.*?)<\/link>/.exec(b))?.[1]?.trim() || '';
      const desc  = (/<description><!\[CDATA\[(.*?)\]\]>/.exec(b) || /<description>(.*?)<\/description>/.exec(b))?.[1]
        ?.replace(/<[^>]+>/g, '').trim() || '';
      const date  = (/<pubDate>(.*?)<\/pubDate>/.exec(b))?.[1]?.trim() || '';
      if (title) items.push({ title, link, desc, date });
    }
    return items;
  } catch (e) {
    log(`  RSS falhou (${topic}): ${e.message}`);
    return [];
  }
}

// ── Gemini: sugere tópicos extras para hoje ───────────────────────────────────
async function generateExtraTopics() {
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text:
            `Você é a Lúmina, assistente IA da Scapini Transportes (transportadora do RS, Brasil).
Hoje é ${new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}.
Sugira 3 tópicos específicos e atuais para pesquisar hoje, relevantes para uma transportadora brasileira.
Considere: combustível, pedágio, legislação, economia BR, tecnologia logística, mercado de fretes, segurança, clima (que afeta rotas).
Responda APENAS com JSON: ["tópico 1","tópico 2","tópico 3"]` }] }],
          generationConfig: { maxOutputTokens: 150, temperature: 0.9 },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );
    const d    = await r.json();
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const m    = /\[[\s\S]*?\]/.exec(text);
    return m ? JSON.parse(m[0]) : [];
  } catch { return []; }
}

// ── Gemini: resume artigos sobre um tópico ────────────────────────────────────
async function summarize(topic, articles) {
  if (!articles.length) return null;
  const artText = articles.map((a, i) => `${i+1}. ${a.title}\n${a.desc}`).join('\n\n');
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text:
            `Você é a Lúmina, assistente IA da Scapini Transportes.
Analise estas notícias sobre "${topic}" e escreva um resumo em português de 3-5 linhas, direto ao ponto, destacando apenas o que impacta uma transportadora do RS.
Sem introdução. Comece com a informação diretamente. Termine com uma frase de insight: "💡 Para a Scapini: ..."

NOTÍCIAS:
${artText}` }] }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.3 },
        }),
        signal: AbortSignal.timeout(20000),
      }
    );
    const d = await r.json();
    return d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (e) {
    log(`  Gemini falhou (${topic}): ${e.message}`);
    return null;
  }
}

// ── Salva nota no Obsidian ────────────────────────────────────────────────────
function saveNote(date, sections) {
  if (!fs.existsSync(OBSIDIAN_DIR)) fs.mkdirSync(OBSIDIAN_DIR, { recursive: true });

  const dateStr  = date.toISOString().split('T')[0];
  const filePath = path.join(OBSIDIAN_DIR, `${dateStr}.md`);
  const dateHR   = date.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const lines = [
    '---',
    `tags: [lumina, aprendizado, diário]`,
    `data: ${dateStr}`,
    `gerado: ${date.toLocaleString('pt-BR')}`,
    '---',
    `# 🧠 Lúmina aprendeu — ${dateHR}`,
    '',
    '> Conhecimento coletado e resumido autonomamente pela Lúmina.',
    '',
  ];

  for (const { topic, summary, sources } of sections) {
    if (!summary) continue;
    lines.push(`## ${topic}`);
    lines.push('');
    lines.push(summary);
    lines.push('');
    if (sources.length) {
      lines.push('**Fontes:**');
      sources.slice(0, 3).forEach(s => lines.push(`- [${s.title}](${s.link})`));
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(`*Gerado automaticamente pela Lúmina às ${date.toLocaleTimeString('pt-BR')}*`);
  lines.push(`← [[índice]]`);

  fs.writeFileSync(filePath, '﻿' + lines.join('\n'), 'utf8');
  log(`Nota salva: ${filePath}`);
  return dateStr;
}

// ── Atualiza índice de aprendizado ────────────────────────────────────────────
function updateIndex(dateStr) {
  const indexPath = path.join(OBSIDIAN_DIR, 'índice.md');
  const link = `- [[${dateStr}]]`;

  let content = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : [
    '---',
    'tags: [lumina, aprendizado]',
    'updated: ' + dateStr,
    '---',
    '# 📚 O que a Lúmina Aprendeu',
    '',
    '> Tudo que a Lúmina pesquisou e aprendeu autonomamente, noite após noite.',
    '',
    '← [[../Cérebro]]',
    '',
  ].join('\n');

  if (content.includes(dateStr)) return; // já registrado
  content = content.trimEnd() + '\n' + link + '\n';
  content = content.replace(/^(updated: ).+$/m, `$1${dateStr}`);
  fs.writeFileSync(indexPath, content, 'utf8');
}

// ── Atualiza Cérebro.md com link para Aprendizado ────────────────────────────
function linkCerebro() {
  const cerebroPath = path.join(OBSIDIAN_DIR, '..', 'Cérebro.md');
  if (!fs.existsSync(cerebroPath)) return;
  let c = fs.readFileSync(cerebroPath, 'utf8');
  if (c.includes('Aprendizado/índice')) return;
  c = c.replace(
    /## Conhecimento/,
    '## Aprendizado Autônomo\n- [[Aprendizado/índice]] — o que a Lúmina aprendeu sozinha\n\n## Conhecimento'
  );
  fs.writeFileSync(cerebroPath, c, 'utf8');
  log('Cérebro.md atualizado com link de Aprendizado');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  log('=== Lúmina Learner — iniciando ===');
  const now = new Date();

  // Tópicos do dia: 4 base rotacionados + 3 sugeridos pelo Gemini
  const dayIdx    = now.getDate() % BASE_TOPICS.length;
  const baseToday = [0,1,2,3].map(i => BASE_TOPICS[(dayIdx + i) % BASE_TOPICS.length]);
  const extra     = await generateExtraTopics();
  const topics    = [...baseToday, ...extra].slice(0, 6);

  log(`Tópicos: ${topics.join(' | ')}`);

  const sections = [];
  for (const topic of topics) {
    log(`→ Pesquisando: ${topic}`);
    const articles = await fetchNewsRSS(topic);
    log(`  ${articles.length} artigo(s) encontrado(s)`);
    if (articles.length) {
      const summary = await summarize(topic, articles);
      if (summary) sections.push({ topic, summary, sources: articles });
    }
    await sleep(2500);
  }

  log(`${sections.length} tópico(s) com conteúdo`);

  if (sections.length) {
    const dateStr = saveNote(now, sections);
    updateIndex(dateStr);
    linkCerebro();
    log('=== Lúmina Learner — concluído ✓ ===');
  } else {
    log('=== Lúmina Learner — sem conteúdo (verifique conexão) ===');
  }
}

main().catch(e => { log(`ERRO FATAL: ${e.stack || e.message}`); process.exit(1); });
