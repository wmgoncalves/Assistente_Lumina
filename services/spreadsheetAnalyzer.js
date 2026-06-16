'use strict';
const xlsx = require('xlsx');

// ── Utilitários ───────────────────────────────────────────────────────────────
function colLetter(idx) {
  let s = ''; let n = idx + 1;
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function detectCol(headers, keywords) {
  const nh = headers.map(norm);
  for (const kw of keywords) {
    const i = nh.findIndex(h => h.includes(kw));
    if (i >= 0) return i;
  }
  return -1;
}

function parseValue(val) {
  if (val == null || val === '') return null;
  if (typeof val === 'number') return isFinite(val) ? val : null;
  let s = String(val).replace(/R\$\s*/gi, '').replace(/\s/g, '').trim();
  // Sufixo D/C de balancete (ex: "4.548.266,71D" ou "4.558.076,31C")
  // C = credor (passivo/receita) → negativo na convenção contábil brasileira
  let dcSign = 1;
  if (/[DC]$/i.test(s)) {
    if (s.slice(-1).toUpperCase() === 'C') dcSign = -1;
    s = s.slice(0, -1);
  }
  if (/^\d{1,3}(\.\d{3})*(,\d+)?%?$/.test(s)) {
    return parseFloat(s.replace(/\./g, '').replace(',', '.').replace('%', '')) * dcSign;
  }
  const n = parseFloat(s.replace(',', '.'));
  return isFinite(n) ? n * dcSign : null;
}

function parseDate(val) {
  if (val == null || val === '') return null;
  if (typeof val === 'number') {
    try {
      const d = xlsx.SSF.parse_date_code(val);
      if (d && d.y > 1900) return fmtDate(d.d, d.m, d.y);
    } catch { /* ignora */ }
  }
  const s = String(val).trim();
  const m1 = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (m1) {
    const [, d, mo, y] = m1;
    const year = y.length === 2 ? (parseInt(y) > 50 ? 1900 : 2000) + parseInt(y) : parseInt(y);
    return fmtDate(+d, +mo, year);
  }
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return fmtDate(+m2[3], +m2[2], +m2[1]);
  return null;
}

function fmtDate(d, m, y) {
  if (!d || !m || !y || y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return {
    d, m, y,
    str: `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`,
    iso: `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`,
  };
}

function normalizeStatus(val) {
  if (val == null) return '';
  const s = norm(val);
  if (/aber|pend|venc|atraso|nao pago|n.pago|nao liquid|a vencer/.test(s)) return 'ABERTO';
  if (/^pago$|liquid|baixa|cancel|quit|receb/.test(s)) return 'PAGO';
  return String(val).trim().toUpperCase();
}

function brl(n) {
  if (n == null || !isFinite(n)) return 'R$ 0,00';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function pct(n) {
  if (n == null || !isFinite(n)) return '0,0%';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
}

// ── Detecção de coluna de MÊS (Jan, Fev, Jan/26, 01/2026, etc.) ──────────────
const MONTH_NAMES_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const MONTH_NAMES_FULL = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

function detectMonthCol(header) {
  const h = norm(header);
  for (let i = 0; i < MONTH_NAMES_PT.length; i++) {
    if (h.startsWith(MONTH_NAMES_PT[i]) || h.startsWith(MONTH_NAMES_FULL[i])) {
      return { idx: i + 1, label: header.toString().trim() };
    }
  }
  // MM/YYYY ou YYYY-MM
  const m1 = h.match(/^(\d{1,2})[\/\-](\d{2,4})$/);
  if (m1) {
    const mo = parseInt(m1[1]);
    if (mo >= 1 && mo <= 12) return { idx: mo, label: header.toString().trim() };
  }
  const m2 = h.match(/^(\d{4})[\/\-](\d{2})$/);
  if (m2) {
    const mo = parseInt(m2[2]);
    if (mo >= 1 && mo <= 12) return { idx: mo, label: header.toString().trim() };
  }
  return null;
}

// ── Categorias de conta DRE ───────────────────────────────────────────────────
const DRE_CATS = {
  receita_bruta:      /receita bruta|faturamento bruto|receita total|receita operacional bruta/,
  deducoes:           /deducao|deducoes|imp.*receita|pis|cofins|iss|icms.*receita|(-)\s*deducao|imposto.*venda|total.*deducao|total.*imposto/,
  receita_liquida:    /receita liquida|receita liq\b|receita oper.*liq/,
  // só totais de custo — itens individuais ficam em accounts mas não em byCategory
  cmv:                /^cmv$|custo.*mercad|custo.*prod|custo.*servic|cpv|cogs|total.*custo.*oper|total.*custo/,
  lucro_bruto:        /lucro bruto|resultado bruto/,
  // só totais de despesa
  despesas_op:        /total.*despesa.*adm|total.*despesa.*comerci|total.*despesa.*vendas|total.*despesa.*oper|^despesa.*adm$|^despesa.*comerci$/,
  ebitda:             /^ebitda$|lajida|lucro.*antes.*juro.*imp.*amort/,
  ebit:               /^ebit$|laji\b|resultado.*operacional\b|lucro.*antes.*juro.*imp(?!.*amort)/,
  resultado_fin:      /resultado financ|receita financ|despesa financ/,
  lucro_antes_ir:     /lair|lucro.*antes.*ir|resultado.*antes.*ir/,
  ir_csll:            /^ir$|^csll$|ir.*csll|imposto.*renda|contrib.*social/,
  lucro_liquido:      /lucro liquido|resultado liquido|lucro liq\b|resultado final/,
};

function classifyDRERow(label) {
  const n = norm(label);
  for (const [cat, re] of Object.entries(DRE_CATS)) {
    if (re.test(n)) return cat;
  }
  return null;
}

// ── Análise DRE (estrutura: conta × mês) ─────────────────────────────────────
function analyzeDRESheet(ws, sheetName) {
  const raw = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
  if (raw.length < 3) return null;

  // Encontra linha de cabeçalho — procura linha com ao menos 2 colunas de mês
  let headerRow = -1;
  let monthCols = [];
  for (let i = 0; i < Math.min(20, raw.length); i++) {
    const cols = [];
    for (let j = 1; j < raw[i].length; j++) {
      const mc = detectMonthCol(raw[i][j]);
      if (mc) cols.push({ colIdx: j, ...mc });
    }
    if (cols.length >= 2) { headerRow = i; monthCols = cols; break; }
  }
  if (headerRow < 0 || monthCols.length === 0) return null;

  // Lê linhas de contas (abaixo do cabeçalho, coluna 0 = nome da conta)
  const accounts = [];
  for (let i = headerRow + 1; i < raw.length; i++) {
    const row = raw[i];
    const code = String(row[0] || '').trim();
    if (!code) continue;
    // col[1] costuma ter o nome descritivo da conta (ex: "Receita Bruta")
    const desc = String(row[1] || '').trim();
    const isDescText = desc && !/^\d/.test(desc) && isNaN(parseFloat(desc));
    const label = isDescText ? desc : code;

    const monthValues = {};
    let hasValue = false;
    for (const mc of monthCols) {
      const v = parseValue(row[mc.colIdx]);
      if (v !== null) { monthValues[mc.label] = v; hasValue = true; }
    }
    if (!hasValue) continue;

    const category = classifyDRERow(isDescText ? desc : code);
    const total = Object.values(monthValues).reduce((s, v) => s + v, 0);
    accounts.push({ label, code, category, monthValues, total, totalBrl: brl(total) });
  }

  if (accounts.length < 2) return null;

  // Extrai contas-chave por categoria
  const byCategory = {};
  for (const acc of accounts) {
    if (acc.category && !byCategory[acc.category]) byCategory[acc.category] = acc;
  }

  // Calcula variações mês a mês para a primeira conta de receita encontrada
  const mainRevenue = byCategory['receita_bruta'] || byCategory['receita_liquida'];
  const monthTrends = [];
  if (mainRevenue && monthCols.length >= 2) {
    const labels = monthCols.map(m => m.label);
    for (let i = 1; i < labels.length; i++) {
      const prev = mainRevenue.monthValues[labels[i - 1]];
      const curr = mainRevenue.monthValues[labels[i]];
      if (prev != null && curr != null && prev !== 0) {
        const var_ = ((curr - prev) / Math.abs(prev)) * 100;
        monthTrends.push({ from: labels[i-1], to: labels[i], varPct: var_, direction: var_ >= 0 ? '↑' : '↓' });
      }
    }
  }

  // Calcula margens se tiver receita líquida
  const margins = {};
  const recLiq = byCategory['receita_liquida'];
  if (recLiq) {
    const lb = byCategory['lucro_bruto'];
    const ebitda = byCategory['ebitda'];
    const ll = byCategory['lucro_liquido'];
    for (const mc of monthCols) {
      const rl = recLiq.monthValues[mc.label];
      if (!rl || rl === 0) continue;
      if (!margins[mc.label]) margins[mc.label] = {};
      if (lb?.monthValues[mc.label] != null) margins[mc.label].margem_bruta = (lb.monthValues[mc.label] / rl) * 100;
      if (ebitda?.monthValues[mc.label] != null) margins[mc.label].ebitda_pct = (ebitda.monthValues[mc.label] / rl) * 100;
      if (ll?.monthValues[mc.label] != null) margins[mc.label].margem_liquida = (ll.monthValues[mc.label] / rl) * 100;
    }
  }

  return {
    type: 'dre',
    sheet: sheetName,
    months: monthCols.map(m => m.label),
    accounts,
    byCategory,
    monthTrends,
    margins,
    totalAccounts: accounts.length,
  };
}

// ── Análise de contas a receber/pagar (estrutura original) ────────────────────
function analyzeARSheet(ws, sheetName) {
  const raw = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
  if (raw.length < 2) return null;

  let headerRow = 0;
  for (let i = 0; i < Math.min(15, raw.length); i++) {
    if (raw[i].filter(c => c !== '').length >= 2) { headerRow = i; break; }
  }
  const headers = raw[headerRow].map(h => String(h || ''));

  const dateIdx   = detectCol(headers, ['vencimento','dt venc','data venc','venc','dt_venc','data','dt','vencto','vcto']);
  const valueIdx  = detectCol(headers, ['valor','vl ','vl_','total','montante','vlr','r$','saldo','duplic','v.','val ']);
  const statusIdx = detectCol(headers, ['status','situacao','sit.','sit ','baixado','liquidado','pago','aberto','situac']);

  if (dateIdx < 0 && valueIdx < 0) return null;

  const rows = [];
  for (let i = headerRow + 1; i < raw.length; i++) {
    const row = raw[i];
    if (row.every(c => c === '')) continue;
    const date  = dateIdx  >= 0 ? parseDate(row[dateIdx])   : null;
    const value = valueIdx >= 0 ? parseValue(row[valueIdx])  : null;
    if (value === null || value === 0) continue;
    const rawStatus = statusIdx >= 0 ? row[statusIdx] : null;
    const status    = normalizeStatus(rawStatus);
    rows.push({ rowNum: i + 1, date, value, status, rawStatus: String(rawStatus ?? '') });
  }

  if (rows.length === 0) return null;

  const byDateStatus = {};
  for (const r of rows) {
    const key = `${r.date?.str ?? 'sem_data'}|${r.status}`;
    if (!byDateStatus[key]) byDateStatus[key] = { date: r.date?.str ?? null, dateIso: r.date?.iso ?? null, status: r.status, total: 0, count: 0 };
    byDateStatus[key].total += r.value;
    byDateStatus[key].count++;
  }

  const byStatus = {};
  for (const r of rows) {
    if (!byStatus[r.status]) byStatus[r.status] = { total: 0, count: 0 };
    byStatus[r.status].total += r.value;
    byStatus[r.status].count++;
  }

  const grandTotal = rows.reduce((s, r) => s + r.value, 0);
  let formula = '';
  if (valueIdx >= 0) {
    const vC = colLetter(valueIdx);
    const parts = [`${sheetName}!$${vC}:$${vC}`];
    if (dateIdx >= 0)   parts.push(`${sheetName}!$${colLetter(dateIdx)}:$${colLetter(dateIdx)}`, '$A1');
    if (statusIdx >= 0) parts.push(`${sheetName}!$${colLetter(statusIdx)}:$${colLetter(statusIdx)}`, '"ABERTO"');
    formula = `=SOMASES(${parts.join(';')})`;
  }

  return {
    type: 'ar',
    sheet: sheetName,
    totalRows: rows.length,
    columns: {
      date:   dateIdx   >= 0 ? { letter: colLetter(dateIdx),   header: headers[dateIdx]   } : null,
      value:  valueIdx  >= 0 ? { letter: colLetter(valueIdx),  header: headers[valueIdx]  } : null,
      status: statusIdx >= 0 ? { letter: colLetter(statusIdx), header: headers[statusIdx] } : null,
    },
    byDateStatus: Object.values(byDateStatus).sort((a, b) => {
      if (a.dateIso && b.dateIso) return a.dateIso.localeCompare(b.dateIso);
      return 0;
    }),
    byStatus,
    grandTotal,
    grandTotalBrl: brl(grandTotal),
    formula,
  };
}

// ── Análise de Balancete (Nível | Conta | Desc | Saldo Ant | Débito | Crédito | Saldo Atual) ──
function analyzeBalanceteSheet(ws, sheetName) {
  const raw = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
  if (raw.length < 5) return null;

  // Detecção por padrão de dados (encoding pode corromper headers):
  // Balancete tem: col0=nível(número), col1=conta(código), col2=descrição(texto), cols3-6=valores numéricos
  // Verifica nas primeiras 10 linhas de dados se o padrão bate
  let headerRow = -1;
  let colDesc = 2, colConta = 1, colSaldoAnt = 3, colDebito = 4, colCredito = 5, colSaldoAtual = 6;

  // Primeira tentativa: cabeçalho com "Saldo" (leitura sem encoding)
  for (let i = 0; i < Math.min(5, raw.length); i++) {
    const row = raw[i].map(c => String(c));
    const saldoCount = row.filter(c => c.toLowerCase().includes('saldo')).length;
    if (saldoCount >= 2) { headerRow = i; break; }
  }

  // Segunda tentativa: detecção por dados — linha 0 tem nível numérico + código contábil + grandes valores
  if (headerRow < 0) {
    for (let i = 0; i < Math.min(5, raw.length); i++) {
      const row = raw[i];
      const nivel = String(row[0] || '').trim();
      const conta = String(row[1] || '').trim();
      const desc  = String(row[2] || '').trim();
      const v3 = parseValue(row[3]), v4 = parseValue(row[4]), v5 = parseValue(row[5]);
      // Nível é número 1-9, conta é código contábil, e temos 3 valores numéricos grandes
      if (/^[1-9]$/.test(nivel) && /^\d[\d\.]*$/.test(conta) && desc && v3 != null && v4 != null && v5 != null) {
        headerRow = -1; // sem header — dados começam em i
        colDesc = 2; colConta = 1; colSaldoAnt = 3; colDebito = 4; colCredito = 5; colSaldoAtual = 6;
        // Usa como dataStart = i
        break;
      }
    }
  }

  // Detecta onde os dados começam (pula linhas de header)
  let dataStart = headerRow >= 0 ? headerRow + 1 : 0;
  // Confirma que pelo menos 3 linhas têm padrão nível+conta+valores
  let confirmedLines = 0;
  for (let i = dataStart; i < Math.min(dataStart + 10, raw.length); i++) {
    const row = raw[i];
    const nivel = String(row[0] || '').trim();
    const conta = String(row[1] || '').trim();
    if (/^[1-9S A]$/.test(nivel) && /^\d[\d\.]*$/.test(conta) && parseValue(row[colDebito]) != null) confirmedLines++;
  }
  if (confirmedLines < 2) return null;

  // Lê as contas de nível 1 e 2 (grupos principais)
  const accounts = [];
  let totalDebito = 0, totalCredito = 0;

  for (let i = headerRow + 1; i < raw.length; i++) {
    const row = raw[i];
    const desc     = colDesc     >= 0 ? String(row[colDesc]     || '').trim() : '';
    const conta    = colConta    >= 0 ? String(row[colConta]    || '').trim() : '';
    const nivel    = String(row[0] || '').trim();
    const debito   = parseValue(row[colDebito]);
    const credito  = parseValue(row[colCredito]);
    const saldoAnt = colSaldoAnt  >= 0 ? parseValue(row[colSaldoAnt])  : null;
    const saldoAt  = colSaldoAtual >= 0 ? parseValue(row[colSaldoAtual]) : null;

    if (!desc && !conta) continue;
    if (debito === null && credito === null && saldoAt === null) continue;

    // Só nível 1 e 2 para o resumo (grupos e subgrupos)
    const isTopLevel = /^[1-9]$/.test(nivel) || (conta && /^\d+(\.\d+)?$/.test(conta) && (conta.split('.').length <= 2));

    if (debito != null) totalDebito  += debito;
    if (credito != null) totalCredito += credito;

    accounts.push({
      nivel, conta, desc: desc || conta,
      saldoAnterior: saldoAnt,
      debito, credito,
      saldoAtual: saldoAt,
      isTopLevel,
    });
  }

  if (accounts.length < 3) return null;

  // Extrai grupos principais (ATIVO, PASSIVO, PL, RECEITA, DESPESA)
  const grupos = {};
  const GRUPO_MAP = {
    ativo:      /^ativo$/,
    passivo:    /^passivo$/,
    pl:         /patrimoni|patrimônio/,
    receita:    /^receita|^faturamento/,
    despesa:    /^despesa|^custo/,
    resultado:  /resultado/,
  };
  for (const acc of accounts) {
    const n = norm(acc.desc);
    for (const [key, re] of Object.entries(GRUPO_MAP)) {
      if (re.test(n) && !grupos[key]) { grupos[key] = acc; break; }
    }
  }

  // Top contas de nível 2 (subgrupos com saldo relevante)
  const subgrupos = accounts
    .filter(a => a.isTopLevel && a.saldoAtual != null && Math.abs(a.saldoAtual) > 0)
    .sort((a, b) => Math.abs(b.saldoAtual) - Math.abs(a.saldoAtual))
    .slice(0, 20);

  return {
    type: 'balancete',
    sheet: sheetName,
    totalAccounts: accounts.length,
    totalDebito,
    totalCredito,
    grupos,
    subgrupos,
    accounts,
  };
}

// ── Detecta tipo e analisa uma aba ───────────────────────────────────────────
function analyzeSheet(ws, sheetName) {
  // Tenta Balancete primeiro (formato mais específico com débito/crédito)
  const bal = analyzeBalanceteSheet(ws, sheetName);
  if (bal) return bal;
  // Tenta DRE
  const dre = analyzeDRESheet(ws, sheetName);
  if (dre) return dre;
  // Fallback: contas a receber/pagar
  return analyzeARSheet(ws, sheetName);
}

// ── Ponto de entrada ──────────────────────────────────────────────────────────
function analyzeSpreadsheet(buffer, filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  let workbook;
  if (ext === 'csv') {
    workbook = xlsx.read(buffer.toString('utf8'), { type: 'string' });
  } else {
    workbook = xlsx.read(buffer, { type: 'buffer', cellDates: false });
  }

  const sheets = [];
  for (const name of workbook.SheetNames) {
    // Pula abas de prompt/checklist (texto puro, não dados)
    const nn = norm(name);
    if (/prompt|checklist|instrucao|leia|readme|orientacao/.test(nn)) continue;
    const result = analyzeSheet(workbook.Sheets[name], name);
    if (result) sheets.push(result);
  }

  return { filename, sheets, analyzedAt: new Date().toISOString() };
}

// ── Contexto compacto para injetar no prompt da IA ────────────────────────────
function buildSheetContext(analysis) {
  if (!analysis || !analysis.sheets.length) return '';
  let ctx = `\n\n── PLANILHA CARREGADA: ${analysis.filename} ──`;

  for (const s of analysis.sheets) {
    ctx += `\nAba "${s.sheet}"`;

    if (s.type === 'balancete') {
      ctx += ` [BALANCETE] — ${s.totalAccounts} contas`;
      ctx += ` | Débitos: ${brl(s.totalDebito)} | Créditos: ${brl(s.totalCredito)}`;
      const GRUPO_LABELS = { ativo: 'ATIVO', passivo: 'PASSIVO', pl: 'PATRIMÔNIO LÍQUIDO', receita: 'RECEITAS', despesa: 'DESPESAS', resultado: 'RESULTADO' };
      for (const [key, label] of Object.entries(GRUPO_LABELS)) {
        const g = s.grupos[key];
        if (!g) continue;
        ctx += `\n  ${label}:`;
        if (g.saldoAnterior != null) ctx += ` Saldo Ant=${brl(g.saldoAnterior)}`;
        if (g.debito   != null) ctx += ` Déb=${brl(g.debito)}`;
        if (g.credito  != null) ctx += ` Cré=${brl(g.credito)}`;
        if (g.saldoAtual != null) ctx += ` Saldo Atual=${brl(g.saldoAtual)}`;
      }
      if (s.subgrupos.length) {
        ctx += `\n  Subgrupos com maior saldo:`;
        for (const sg of s.subgrupos.slice(0, 12)) {
          ctx += `\n    ${sg.desc}: Saldo=${brl(sg.saldoAtual)}`;
          if (sg.debito  != null) ctx += ` Déb=${brl(sg.debito)}`;
          if (sg.credito != null) ctx += ` Cré=${brl(sg.credito)}`;
        }
      }

    } else if (s.type === 'dre') {
      ctx += ` [DRE] — ${s.totalAccounts} contas | Meses: ${s.months.join(', ')}`;

      // Contas-chave
      const KEY_ORDER = ['receita_bruta','deducoes','receita_liquida','cmv','lucro_bruto','despesas_op','ebitda','ebit','resultado_fin','lucro_antes_ir','ir_csll','lucro_liquido'];
      for (const cat of KEY_ORDER) {
        const acc = s.byCategory[cat];
        if (!acc) continue;
        ctx += `\n  ${acc.label}:`;
        for (const [mes, val] of Object.entries(acc.monthValues)) {
          ctx += ` ${mes}=${brl(val)}`;
        }
      }

      // Margens
      if (Object.keys(s.margins).length) {
        ctx += `\n  Margens:`;
        for (const [mes, m] of Object.entries(s.margins)) {
          const parts = [];
          if (m.margem_bruta   != null) parts.push(`MB=${pct(m.margem_bruta)}`);
          if (m.ebitda_pct     != null) parts.push(`EBITDA=${pct(m.ebitda_pct)}`);
          if (m.margem_liquida != null) parts.push(`ML=${pct(m.margem_liquida)}`);
          if (parts.length) ctx += ` | ${mes}: ${parts.join(', ')}`;
        }
      }

      // Variações de receita mês a mês
      if (s.monthTrends.length) {
        ctx += `\n  Variação receita mês a mês:`;
        for (const t of s.monthTrends) {
          ctx += ` ${t.from}→${t.to}: ${t.direction}${pct(Math.abs(t.varPct))}`;
        }
      }

      // Demais contas (não classificadas) — breakdown mensal para permitir consulta por mês
      const classified = new Set(Object.values(s.byCategory).map(a => a.label));
      const others = s.accounts.filter(a => !classified.has(a.label));
      if (others.length) {
        ctx += `\n  Outras contas (${others.length}):`;
        for (const acc of others.slice(0, 15)) {
          ctx += `\n    ${acc.label}:`;
          for (const [mes, val] of Object.entries(acc.monthValues)) {
            ctx += ` ${mes}=${brl(val)}`;
          }
        }
      }

    } else {
      // AR/AP padrão
      ctx += ` — ${s.totalRows} linhas`;
      if (s.columns?.date)   ctx += ` | Vencimento=${s.columns.date.letter}`;
      if (s.columns?.value)  ctx += ` | Valor=${s.columns.value.letter}`;
      if (s.columns?.status) ctx += ` | Status=${s.columns.status.letter}`;
      ctx += `\n  Total geral: ${s.grandTotalBrl}`;
      for (const [st, ag] of Object.entries(s.byStatus)) {
        ctx += `\n  ${st}: ${brl(ag.total)} (${ag.count} títulos)`;
      }
      const top = s.byDateStatus.slice(0, 30);
      if (top.length) {
        ctx += `\n  Por data (top ${top.length}):`;
        for (const d of top) {
          if (d.date) ctx += `\n    ${d.date} ${d.status}: ${brl(d.total)} (${d.count})`;
        }
      }
      if (s.formula) ctx += `\n  Fórmula: ${s.formula}`;
    }
  }

  ctx += `\n\nREGRA GERAL: use APENAS os valores acima — nunca invente números.`;
  ctx += `\nREGRA DRE — OBRIGATÓRIA: Se a pergunta mencionar um mês específico (ex: "janeiro", "fevereiro"), responda SOMENTE com os dados desse mês — nunca liste todos os meses juntos. Formato: lista de contas com valor, depois as margens. Ex: "Em Janeiro: Receita Bruta: R$ X | Lucro Líquido: R$ Y | Margem Líquida: Z%".`;
  return ctx;
}

module.exports = { analyzeSpreadsheet, buildSheetContext, brl };
