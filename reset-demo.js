#!/usr/bin/env node
/**
 * reset-demo.js — Prepara o banco de dados da Lúmina para demonstração/workshop
 *
 * O que faz:
 *   1. Limpa historico (conversas de teste)
 *   2. Limpa leads, contatos, lembretes, cotacoes
 *   3. Popula leads de exemplo (prospecção comercial)
 *   4. Popula contatos clientes da Scapini
 *   5. Popula lembretes de exemplo
 *   6. Popula cotacoes de frete de exemplo
 *
 * Uso: node reset-demo.js
 */

'use strict';
const path    = require('path');
const fs      = require('fs');
const Database = require('better-sqlite3');

const DB_FILE = path.join(__dirname, 'Lúmina.db');

if (!fs.existsSync(DB_FILE)) {
  console.error(`[reset-demo] Banco não encontrado: ${DB_FILE}`);
  console.error('Inicie o servidor pelo menos uma vez antes de rodar este script.');
  process.exit(1);
}

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── 1. Limpa tabelas ──────────────────────────────────────────────────────────
console.log('[reset-demo] Limpando banco...');
db.exec(`
  DELETE FROM historico;
  DELETE FROM leads;
  DELETE FROM contatos;
  DELETE FROM lembretes;
  DELETE FROM cotacoes;
  DELETE FROM fatos;
`);
// Reinicia auto-increment
db.exec(`
  DELETE FROM sqlite_sequence WHERE name IN ('historico','leads','contatos','lembretes','cotacoes','fatos');
`);
console.log('[reset-demo] Banco limpo.');

// ── 2. Leads de prospecção ───────────────────────────────────────────────────
const LEADS_DEMO = [
  {
    nome: 'Frigorífico Pampa Sul',
    segmento: 'Frigorífico / Alimentos',
    cidade: 'Pelotas - RS',
    telefone: '(53) 9 9111-2233',
    email: 'logistica@pampasul.com.br',
    site: 'www.pampasul.com.br',
    dor: 'Atrasos nas entregas refrigeradas para o litoral gaúcho',
    servico: 'Frete refrigerado Pelotas → Porto Alegre e litoral',
    prioridade: 'alta',
    status: 'novo',
    para: 'Scapini Transportes',
  },
  {
    nome: 'Distribuidora Caxias Atacado',
    segmento: 'Distribuição / Atacado',
    cidade: 'Caxias do Sul - RS',
    telefone: '(54) 9 9222-5544',
    email: 'compras@caxiasatacado.com.br',
    site: 'www.caxiasatacado.com.br',
    dor: 'Custo alto com fretes terceirizados para São Paulo e Paraná',
    servico: 'Carga seca Caxias do Sul → SP e Curitiba',
    prioridade: 'alta',
    status: 'contatado',
    para: 'Scapini Transportes',
  },
  {
    nome: 'Cerealista Planaltina',
    segmento: 'Agronegócio / Grãos',
    cidade: 'Passo Fundo - RS',
    telefone: '(54) 9 9333-7788',
    email: 'operacoes@planaltina.agr.br',
    site: 'www.planaltina.agr.br',
    dor: 'Sazonalidade da safra cria gargalo de transporte em out/nov',
    servico: 'Transporte de grãos Passo Fundo → Uruguaiana e Pelotas',
    prioridade: 'media',
    status: 'novo',
    para: 'Scapini Transportes',
  },
  {
    nome: 'Madeireira Planalto Forte',
    segmento: 'Madeira / Construção',
    cidade: 'Erechim - RS',
    telefone: '(54) 9 9444-1122',
    email: 'frete@planaltoforte.com.br',
    site: 'www.planaltoforte.com.br',
    dor: 'Necessita transportador confiável para cargas longas (madeira serrada)',
    servico: 'Cargas pesadas Erechim → Santa Catarina e Paraná',
    prioridade: 'media',
    status: 'proposta',
    para: 'Scapini Transportes',
  },
  {
    nome: 'Metalúrgica Sul Peças',
    segmento: 'Indústria Metalúrgica',
    cidade: 'Porto Alegre - RS',
    telefone: '(51) 9 9555-9900',
    email: 'expedicao@sulpecas.com.br',
    site: 'www.sulpecas.com.br',
    dor: 'Urgência em entregas de peças para clientes em SP e MG',
    servico: 'Carga fracionada urgente Porto Alegre → São Paulo',
    prioridade: 'alta',
    status: 'novo',
    para: 'Scapini Transportes',
  },
];

const insLead = db.prepare(`
  INSERT INTO leads (nome, segmento, cidade, telefone, email, site, dor, servico, prioridade, status, para)
  VALUES (@nome, @segmento, @cidade, @telefone, @email, @site, @dor, @servico, @prioridade, @status, @para)
`);
const insertLeads = db.transaction(() => LEADS_DEMO.forEach(l => insLead.run(l)));
insertLeads();
console.log(`[reset-demo] ${LEADS_DEMO.length} leads inseridos.`);

// ── 3. Contatos / clientes ───────────────────────────────────────────────────
const CONTATOS_DEMO = [
  {
    nome: 'Carlos Mendonça',
    empresa: 'Frigorífico Pampa Sul',
    cargo: 'Gerente de Logística',
    telefone: '(53) 9 9111-2233',
    email: 'carlos.mendonca@pampasul.com.br',
    cidade: 'Pelotas - RS',
    segmento: 'Frigorífico',
    tipo: 'prospecto',
  },
  {
    nome: 'Ana Paula Ritter',
    empresa: 'Distribuidora Caxias Atacado',
    cargo: 'Diretora de Compras',
    telefone: '(54) 9 9222-5544',
    email: 'anapaula@caxiasatacado.com.br',
    cidade: 'Caxias do Sul - RS',
    segmento: 'Atacado',
    tipo: 'cliente',
  },
  {
    nome: 'João Luís Figueiredo',
    empresa: 'Cerealista Planaltina',
    cargo: 'Diretor Operacional',
    telefone: '(54) 9 9333-7788',
    email: 'joao@planaltina.agr.br',
    cidade: 'Passo Fundo - RS',
    segmento: 'Agronegócio',
    tipo: 'prospecto',
  },
  {
    nome: 'Roberto Tavares',
    empresa: 'Petrobras Distribuidora',
    cargo: 'Coordenador de Fretes',
    telefone: '(51) 9 9000-3344',
    email: 'roberto.tavares@br.com',
    cidade: 'Porto Alegre - RS',
    segmento: 'Petróleo / Energia',
    tipo: 'parceiro',
  },
];

const insContato = db.prepare(`
  INSERT INTO contatos (nome, empresa, cargo, telefone, email, cidade, segmento, tipo)
  VALUES (@nome, @empresa, @cargo, @telefone, @email, @cidade, @segmento, @tipo)
`);
const insertContatos = db.transaction(() => CONTATOS_DEMO.forEach(c => insContato.run(c)));
insertContatos();
console.log(`[reset-demo] ${CONTATOS_DEMO.length} contatos inseridos.`);

// ── 4. Lembretes ─────────────────────────────────────────────────────────────
const hoje = new Date();
const dataLembrete = (offsetDias, hora = '09:00') => {
  const d = new Date(hoje);
  d.setDate(d.getDate() + offsetDias);
  return `${d.toISOString().split('T')[0]} ${hora}`;
};

const LEMBRETES_DEMO = [
  { texto: 'Ligar para Carlos Mendonça (Pampa Sul) — fechar proposta de frete refrigerado',  data_hora: dataLembrete(1, '09:00'), recorrencia: null },
  { texto: 'Enviar proposta formal para Madeireira Planalto Forte',                           data_hora: dataLembrete(1, '14:00'), recorrencia: null },
  { texto: 'Reunião com time comercial — revisão pipeline de leads',                           data_hora: dataLembrete(2, '10:00'), recorrencia: null },
  { texto: 'Verificar vencimento de contratos de fretes ativos',                               data_hora: dataLembrete(3, '08:30'), recorrencia: null },
  { texto: 'Follow-up Ana Paula (Caxias Atacado) — status da proposta enviada',               data_hora: dataLembrete(4, '11:00'), recorrencia: null },
];

const insLembrete = db.prepare(`
  INSERT INTO lembretes (texto, data_hora, recorrencia) VALUES (@texto, @data_hora, @recorrencia)
`);
const insertLembretes = db.transaction(() => LEMBRETES_DEMO.forEach(l => insLembrete.run(l)));
insertLembretes();
console.log(`[reset-demo] ${LEMBRETES_DEMO.length} lembretes inseridos.`);

// ── 5. Cotações de frete ──────────────────────────────────────────────────────
const COTACOES_DEMO = [
  {
    origem: 'Porto Alegre - RS',
    destino: 'São Paulo - SP',
    distancia_km: 1110,
    duracao_h: 14,
    dias_viagem: 2,
    peso_kg: 22000,
    tipo_carga: 'seco',
    custo_combustivel: 1850.00,
    custo_pedagio: 420.00,
    custo_motorista: 380.00,
    custo_fixo: 320.00,
    custo_total: 2970.00,
    margem_pct: 25,
    preco_final: 3712.50,
    cliente_nome: 'Distribuidora Caxias Atacado',
    status: 'aprovada',
  },
  {
    origem: 'Caxias do Sul - RS',
    destino: 'Curitiba - PR',
    distancia_km: 420,
    duracao_h: 6,
    dias_viagem: 1,
    peso_kg: 18000,
    tipo_carga: 'seco',
    custo_combustivel: 700.00,
    custo_pedagio: 180.00,
    custo_motorista: 210.00,
    custo_fixo: 180.00,
    custo_total: 1270.00,
    margem_pct: 20,
    preco_final: 1524.00,
    cliente_nome: 'Metalúrgica Sul Peças',
    status: 'enviada',
  },
  {
    origem: 'Passo Fundo - RS',
    destino: 'Uruguaiana - RS',
    distancia_km: 480,
    duracao_h: 7,
    dias_viagem: 1,
    peso_kg: 27000,
    tipo_carga: 'granel',
    custo_combustivel: 790.00,
    custo_pedagio: 90.00,
    custo_motorista: 230.00,
    custo_fixo: 200.00,
    custo_total: 1310.00,
    margem_pct: 22,
    preco_final: 1598.20,
    cliente_nome: 'Cerealista Planaltina',
    status: 'rascunho',
  },
];

const insCotacao = db.prepare(`
  INSERT INTO cotacoes (origem, destino, distancia_km, duracao_h, dias_viagem, peso_kg,
    tipo_carga, custo_combustivel, custo_pedagio, custo_motorista, custo_fixo, custo_total,
    margem_pct, preco_final, cliente_nome, status)
  VALUES (@origem, @destino, @distancia_km, @duracao_h, @dias_viagem, @peso_kg,
    @tipo_carga, @custo_combustivel, @custo_pedagio, @custo_motorista, @custo_fixo, @custo_total,
    @margem_pct, @preco_final, @cliente_nome, @status)
`);
const insertCotacoes = db.transaction(() => COTACOES_DEMO.forEach(c => insCotacao.run(c)));
insertCotacoes();
console.log(`[reset-demo] ${COTACOES_DEMO.length} cotações inseridas.`);

// ── 6. Limpa arquivos JSON de dados do app ────────────────────────────────────
const jsonStores = ['tasks.json', 'habits.json', 'finances.json', 'notes.json'];
for (const fname of jsonStores) {
  const fpath = path.join(__dirname, fname);
  if (fs.existsSync(fpath)) {
    fs.writeFileSync(fpath, '[]', 'utf8');
    console.log(`[reset-demo] ${fname} limpo.`);
  }
}

// ── 7. Limpa candidaturas de recrutamento ─────────────────────────────────────
const recrutaPath = path.join(__dirname, 'data', 'recrutamento.db');
if (fs.existsSync(recrutaPath)) {
  const recrutaDB = new Database(recrutaPath);
  try {
    recrutaDB.exec(`DELETE FROM candidaturas; DELETE FROM sqlite_sequence WHERE name='candidaturas';`);
    console.log('[reset-demo] candidaturas (recrutamento.db) limpas.');
  } catch (_) {}
  recrutaDB.close();
}

// ── Finaliza ──────────────────────────────────────────────────────────────────
db.close();
console.log('\n[reset-demo] ✓ Banco resetado e populado para demo.');
console.log('  Leads:     ' + LEADS_DEMO.length);
console.log('  Contatos:  ' + CONTATOS_DEMO.length);
console.log('  Lembretes: ' + LEMBRETES_DEMO.length);
console.log('  Cotações:  ' + COTACOES_DEMO.length);
console.log('\nInicie o servidor normalmente: npm start');
