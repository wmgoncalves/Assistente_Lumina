'use strict';
const Database = require('better-sqlite3');
const path     = require('path');

const DATA_DIR = process.env.SKY_DATA_DIR || path.join(__dirname, '..');
const DB_FILE  = path.join(DATA_DIR, 'sky.db');
let _db = null;

function getDb() {
  if (_db) return _db;
  _db = new Database(DB_FILE);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _migrate(_db);
  return _db;
}

function _migrate(db) {
  db.exec(`
    -- Leads de prospecção
    CREATE TABLE IF NOT EXISTS leads (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      nome         TEXT    NOT NULL,
      segmento     TEXT,
      cidade       TEXT,
      telefone     TEXT,
      email        TEXT,
      site         TEXT,
      dor          TEXT,
      servico      TEXT,
      prioridade   TEXT    DEFAULT 'media',  -- alta / media / baixa
      status       TEXT    DEFAULT 'novo',   -- novo / contatado / proposta / fechado / perdido
      email_assunto TEXT,
      email_corpo  TEXT,
      whatsapp     TEXT,
      para         TEXT    DEFAULT 'Scapini Transportes',
      observacoes  TEXT,
      criado_em    TEXT    DEFAULT (datetime('now','localtime')),
      atualizado_em TEXT   DEFAULT (datetime('now','localtime'))
    );

    -- Cotações de frete
    CREATE TABLE IF NOT EXISTS cotacoes (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      origem          TEXT    NOT NULL,
      destino         TEXT    NOT NULL,
      distancia_km    INTEGER,
      duracao_h       REAL,
      dias_viagem     INTEGER,
      peso_kg         REAL    DEFAULT 0,
      tipo_carga      TEXT    DEFAULT 'seco',
      custo_combustivel REAL,
      custo_pedagio   REAL,
      custo_motorista REAL,
      custo_fixo      REAL,
      custo_total     REAL,
      margem_pct      REAL,
      preco_final     REAL,
      cliente_nome    TEXT,
      status          TEXT    DEFAULT 'rascunho', -- rascunho / enviada / aprovada / recusada
      observacoes     TEXT,
      criado_em       TEXT    DEFAULT (datetime('now','localtime')),
      atualizado_em   TEXT    DEFAULT (datetime('now','localtime'))
    );

    -- Contatos / clientes da Scapini
    CREATE TABLE IF NOT EXISTS contatos (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      nome         TEXT    NOT NULL,
      empresa      TEXT,
      cargo        TEXT,
      telefone     TEXT,
      email        TEXT,
      cidade       TEXT,
      segmento     TEXT,
      tipo         TEXT    DEFAULT 'cliente',  -- cliente / parceiro / fornecedor / prospecto
      observacoes  TEXT,
      criado_em    TEXT    DEFAULT (datetime('now','localtime')),
      atualizado_em TEXT   DEFAULT (datetime('now','localtime'))
    );

    -- Lembretes / tarefas agendadas
    CREATE TABLE IF NOT EXISTS lembretes (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      texto        TEXT    NOT NULL,
      data_hora    TEXT,
      recorrencia  TEXT,   -- diario / semanal / mensal / null
      concluido    INTEGER DEFAULT 0,
      criado_em    TEXT    DEFAULT (datetime('now','localtime'))
    );

    -- Histórico de conversas
    CREATE TABLE IF NOT EXISTS historico (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      role         TEXT    NOT NULL,  -- user / sky
      conteudo     TEXT    NOT NULL,
      source       TEXT,              -- gemini / ollama / local / demo
      ms           INTEGER,
      criado_em    TEXT    DEFAULT (datetime('now','localtime'))
    );

    -- Memória da Sky (migração futura do memory.json)
    CREATE TABLE IF NOT EXISTS fatos (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      conteudo     TEXT    NOT NULL,
      tags         TEXT,   -- JSON array de strings
      peso         REAL    DEFAULT 1.0,
      fonte        TEXT    DEFAULT 'usuario',
      criado_em    TEXT    DEFAULT (datetime('now','localtime')),
      atualizado_em TEXT   DEFAULT (datetime('now','localtime'))
    );
  `);
}

// ── Leads ─────────────────────────────────────────────────────────────────────
function inserirLead(lead) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO leads (nome, segmento, cidade, telefone, email, site, dor, servico,
      prioridade, email_assunto, email_corpo, whatsapp, para)
    VALUES (@nome, @segmento, @cidade, @telefone, @email, @site, @dor, @servico,
      @prioridade, @email_assunto, @email_corpo, @whatsapp, @para)
  `);
  return stmt.run(lead).lastInsertRowid;
}

function listarLeads({ status, prioridade, segmento, limit = 50 } = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM leads WHERE 1=1';
  const params = [];
  if (status)    { sql += ' AND status = ?';    params.push(status); }
  if (prioridade){ sql += ' AND prioridade = ?'; params.push(prioridade); }
  if (segmento)  { sql += ' AND segmento LIKE ?'; params.push(`%${segmento}%`); }
  sql += ' ORDER BY criado_em DESC LIMIT ?';
  params.push(limit);
  return db.prepare(sql).all(...params);
}

function atualizarStatusLead(id, status, observacoes) {
  const db = getDb();
  return db.prepare(`
    UPDATE leads SET status = ?, observacoes = ?, atualizado_em = datetime('now','localtime')
    WHERE id = ?
  `).run(status, observacoes || null, id);
}

// ── Cotações ──────────────────────────────────────────────────────────────────
function inserirCotacao(cotacao) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO cotacoes (origem, destino, distancia_km, duracao_h, dias_viagem,
      peso_kg, tipo_carga, custo_combustivel, custo_pedagio, custo_motorista,
      custo_fixo, custo_total, margem_pct, preco_final, cliente_nome)
    VALUES (@origem, @destino, @distancia_km, @duracao_h, @dias_viagem,
      @peso_kg, @tipo_carga, @custo_combustivel, @custo_pedagio, @custo_motorista,
      @custo_fixo, @custo_total, @margem_pct, @preco_final, @cliente_nome)
  `);
  return stmt.run(cotacao).lastInsertRowid;
}

function listarCotacoes({ status, limit = 50 } = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM cotacoes WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY criado_em DESC LIMIT ?';
  params.push(limit);
  return db.prepare(sql).all(...params);
}

// ── Lembretes ─────────────────────────────────────────────────────────────────
function inserirLembrete(texto, dataHora, recorrencia) {
  const db = getDb();
  return db.prepare(`INSERT INTO lembretes (texto, data_hora, recorrencia) VALUES (?, ?, ?)`)
    .run(texto, dataHora || null, recorrencia || null).lastInsertRowid;
}

function lembretesPendentes() {
  return getDb().prepare(`SELECT * FROM lembretes WHERE concluido = 0 ORDER BY data_hora ASC`).all();
}

function concluirLembrete(id) {
  return getDb().prepare(`UPDATE lembretes SET concluido = 1 WHERE id = ?`).run(id);
}

// ── Histórico ─────────────────────────────────────────────────────────────────
function salvarMensagem(role, conteudo, source, ms) {
  return getDb().prepare(`INSERT INTO historico (role, conteudo, source, ms) VALUES (?, ?, ?, ?)`)
    .run(role, conteudo, source || null, ms || null).lastInsertRowid;
}

function buscarHistorico(limit = 100) {
  return getDb().prepare(`SELECT * FROM historico ORDER BY criado_em DESC LIMIT ?`).all(limit);
}

// ── Busca geral (para tool consultarBanco) ────────────────────────────────────
function consultarBanco({ tabela, filtro, limit = 20 }) {
  const db = getDb();
  const TABELAS_OK = new Set(['leads','cotacoes','contatos','lembretes','historico','fatos']);
  if (!TABELAS_OK.has(tabela)) throw new Error(`Tabela inválida: ${tabela}`);

  let sql = `SELECT * FROM ${tabela} WHERE 1=1`;
  const params = [];
  if (filtro) {
    const col = tabela === 'leads'    ? 'nome, segmento, cidade, status, prioridade'
              : tabela === 'cotacoes' ? 'origem, destino, cliente_nome, status'
              : tabela === 'contatos' ? 'nome, empresa, cidade, tipo'
              : tabela === 'lembretes'? 'texto'
              : 'conteudo';
    const cols = col.split(', ');
    const conds = cols.map(c => `${c} LIKE ?`).join(' OR ');
    sql += ` AND (${conds})`;
    cols.forEach(() => params.push(`%${filtro}%`));
  }
  sql += ` ORDER BY ${tabela === 'lembretes' ? 'data_hora' : 'criado_em'} DESC LIMIT ?`;
  params.push(limit);
  return db.prepare(sql).all(...params);
}

function statsGeral() {
  const db = getDb();
  return {
    leads:    db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN status='novo' THEN 1 ELSE 0 END) as novos FROM leads`).get(),
    cotacoes: db.prepare(`SELECT COUNT(*) as total, SUM(preco_final) as volume FROM cotacoes`).get(),
    contatos: db.prepare(`SELECT COUNT(*) as total FROM contatos`).get(),
    lembretes:db.prepare(`SELECT COUNT(*) as total FROM lembretes WHERE concluido=0`).get(),
  };
}

module.exports = {
  getDb,
  // leads
  inserirLead, listarLeads, atualizarStatusLead,
  // cotações
  inserirCotacao, listarCotacoes,
  // lembretes
  inserirLembrete, lembretesPendentes, concluirLembrete,
  // histórico
  salvarMensagem, buscarHistorico,
  // geral
  consultarBanco, statsGeral,
};
