'use strict';
// Gera lumina-dataset.jsonl com pares pergunta→resposta para fine-tuning do Llama.
// Fontes: (1) historico real do SQLite, (2) DEMO_QA extraído de app.js.
// Executar: node lumina-dataset-builder.js  (ou npm run build-dataset)

const Database = require('better-sqlite3');
const fs       = require('fs');
const path     = require('path');

const DB_FILE = path.join(__dirname, 'Lúmina.db');
const APP_JS  = path.join(__dirname, 'app.js');
const OUTPUT  = path.join(__dirname, 'lumina-dataset.jsonl');

const SYS_PROMPT = 'Você é Lúmina, assistente IA da Scapini Transportes. Responda sempre em português brasileiro, de forma direta e objetiva.';

function formatJSONL(pergunta, resposta) {
  const text = [
    '<|begin_of_text|><|start_header_id|>system<|end_header_id|>',
    '',
    SYS_PROMPT,
    '<|eot_id|><|start_header_id|>user<|end_header_id|>',
    '',
    pergunta.trim(),
    '<|eot_id|><|start_header_id|>assistant<|end_header_id|>',
    '',
    resposta.trim(),
    '<|eot_id|>',
  ].join('\n');
  return JSON.stringify({ text });
}

// ── Fonte 1: pares reais do banco SQLite ──────────────────────────────────────
function coletarHistorico() {
  if (!fs.existsSync(DB_FILE)) {
    console.log('[dataset] Lúmina.db não encontrada — pulando historico');
    return [];
  }
  const db = new Database(DB_FILE, { readonly: true });
  try {
    return db.prepare(`
      SELECT h1.conteudo AS pergunta, h2.conteudo AS resposta
      FROM historico h1
      JOIN historico h2 ON h2.id = h1.id + 1
      WHERE h1.role = 'user'
        AND h2.role = 'Lúmina'
        AND h2.source NOT IN ('error', 'demo')
        AND length(h1.conteudo) BETWEEN 10 AND 300
        AND length(h2.conteudo) BETWEEN 30 AND 800
      ORDER BY h1.id DESC
    `).all();
  } finally {
    db.close();
  }
}

// ── Fonte 2: pares do DEMO_QA em app.js ──────────────────────────────────────
function extrairDemoQA() {
  if (!fs.existsSync(APP_JS)) {
    console.log('[dataset] app.js não encontrado — pulando DEMO_QA');
    return [];
  }
  const src = fs.readFileSync(APP_JS, 'utf8');
  const blockMatch = src.match(/const DEMO_QA\s*=\s*\[([\s\S]*?)\n\];/);
  if (!blockMatch) {
    console.log('[dataset] DEMO_QA não localizado em app.js');
    return [];
  }
  const block = blockMatch[1];
  const result = [];

  // Captura cada entry { re: /.../, r: [...] }
  const ENTRY_RE = /re:\s*\/((?:[^/\\]|\\[\s\S])+)\/[gimu]*,\s*r:\s*\[([\s\S]*?)\]/g;
  let m;
  while ((m = ENTRY_RE.exec(block)) !== null) {
    const rePattern = m[1];
    const rBlock    = m[2];

    // Primeira string do array r (aceita aspas simples ou duplas)
    const strMatch = rBlock.match(/'((?:[^'\\]|\\.)*)'/) || rBlock.match(/"((?:[^"\\]|\\.)*)"/);
    if (!strMatch) continue;
    const resposta = strMatch[1]
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n');
    if (resposta.length < 30) continue;

    // Pergunta sintética a partir do primeiro trecho literal do regex
    const pergunta = rePattern
      .replace(/\((?:\?:)?([^)]+)\)/g, '$1')   // expande grupos não-captura
      .replace(/[\\^$*+?{}[\]|()]/g, ' ')        // remove metacaracteres
      .replace(/\s+/g, ' ')
      .split('|')[0]
      .trim()
      .slice(0, 120);
    if (pergunta.length < 5) continue;

    result.push({ pergunta, resposta });
  }
  return result;
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  const historico = coletarHistorico();
  const demoQA    = extrairDemoQA();

  const linhas = [
    ...historico.map(r => formatJSONL(r.pergunta, r.resposta)),
    ...demoQA.map(r    => formatJSONL(r.pergunta, r.resposta)),
  ];

  fs.writeFileSync(OUTPUT, linhas.join('\n') + '\n', 'utf8');
  console.log(`✅ lumina-dataset.jsonl gerado: ${linhas.length} exemplos`);
  console.log(`   historico: ${historico.length} | demo_qa: ${demoQA.length}`);
}

main();
