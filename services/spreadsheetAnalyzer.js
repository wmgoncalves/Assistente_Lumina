'use strict';
const xlsx = require('xlsx');

// ── Letra de coluna Excel (0-based index → 'A', 'B', … 'AA' …) ──────────────
function colLetter(idx) {
  let s = ''; let n = idx + 1;
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

// ── Remove acentos ────────────────────────────────────────────────────────────
function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

// ── Detecta índice de coluna pelo cabeçalho ───────────────────────────────────
function detectCol(headers, keywords) {
  const nh = headers.map(norm);
  for (const kw of keywords) {
    const i = nh.findIndex(h => h.includes(kw));
    if (i >= 0) return i;
  }
  return -1;
}

// ── Normaliza data para { dd, mm, yyyy, iso } ─────────────────────────────────
function parseDate(val) {
  if (val == null || val === '') return null;

  // Número serial do Excel
  if (typeof val === 'number') {
    try {
      const d = xlsx.SSF.parse_date_code(val);
      if (d && d.y > 1900) return fmtDate(d.d, d.m, d.y);
    } catch { /* ignora */ }
  }

  const s = String(val).trim();

  // DD/MM/YYYY ou DD-MM-YYYY
  const m1 = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (m1) {
    const [, d, mo, y] = m1;
    const year = y.length === 2 ? (parseInt(y) > 50 ? 1900 : 2000) + parseInt(y) : parseInt(y);
    return fmtDate(+d, +mo, year);
  }

  // YYYY-MM-DD (ISO)
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

// ── Normaliza valor financeiro brasileiro ─────────────────────────────────────
function parseValue(val) {
  if (val == null || val === '') return null;
  if (typeof val === 'number') return isFinite(val) ? val : null;
  const s = String(val)
    .replace(/R\$\s*/gi, '')
    .replace(/\s/g, '')
    .trim();
  // Formato BR: 1.234,56
  if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(s)) {
    return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  }
  // Formato US: 1234.56
  const n = parseFloat(s.replace(',', '.'));
  return isFinite(n) ? n : null;
}

// ── Normaliza status ──────────────────────────────────────────────────────────
const STATUS_ABERTO = /aber|pend|venc|atraso|nao pago|n.pago|nao liquid|a vencer/;
const STATUS_PAGO   = /^pago$|liquid|baixa|cancel|quit|receb/;

function normalizeStatus(val) {
  if (val == null) return '';
  const s = norm(val);
  if (STATUS_ABERTO.test(s)) return 'ABERTO';
  if (STATUS_PAGO.test(s))   return 'PAGO';
  return String(val).trim().toUpperCase();
}

// ── Formata moeda BR ──────────────────────────────────────────────────────────
function brl(n) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ── Analisa uma aba da planilha ───────────────────────────────────────────────
function analyzeSheet(ws, sheetName) {
  const raw = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
  if (raw.length < 2) return null;

  // Encontra a linha de cabeçalho (primeira com mais de 2 células preenchidas)
  let headerRow = 0;
  for (let i = 0; i < Math.min(15, raw.length); i++) {
    if (raw[i].filter(c => c !== '').length >= 2) { headerRow = i; break; }
  }
  const headers = raw[headerRow].map(h => String(h || ''));

  // Detecta colunas
  const dateIdx   = detectCol(headers, ['vencimento','dt venc','data venc','venc','dt_venc','data','dt','vencto','vcto']);
  const valueIdx  = detectCol(headers, ['valor','vl ','vl_','total','montante','vlr','r$','saldo','duplic','v.','val ']);
  const statusIdx = detectCol(headers, ['status','situacao','sit.','sit ','baixado','liquidado','pago','aberto','situac']);

  if (dateIdx < 0 && valueIdx < 0) return null;

  // Processa linhas de dados
  const rows = [];
  for (let i = headerRow + 1; i < raw.length; i++) {
    const row = raw[i];
    if (row.every(c => c === '')) continue; // linha vazia

    const date  = dateIdx  >= 0 ? parseDate(row[dateIdx])   : null;
    const value = valueIdx >= 0 ? parseValue(row[valueIdx])  : null;
    if (value === null || value === 0) continue;

    const rawStatus = statusIdx >= 0 ? row[statusIdx] : null;
    const status    = normalizeStatus(rawStatus);

    rows.push({ rowNum: i + 1, date, value, status, rawStatus: String(rawStatus ?? '') });
  }

  if (rows.length === 0) return null;

  // ── Agrega por data + status ──────────────────────────────────────────────
  const byDateStatus = {};
  for (const r of rows) {
    const key = `${r.date?.str ?? 'sem_data'}|${r.status}`;
    if (!byDateStatus[key]) {
      byDateStatus[key] = { date: r.date?.str ?? null, dateIso: r.date?.iso ?? null, status: r.status, total: 0, count: 0 };
    }
    byDateStatus[key].total += r.value;
    byDateStatus[key].count++;
  }

  // ── Agrega por status ─────────────────────────────────────────────────────
  const byStatus = {};
  for (const r of rows) {
    if (!byStatus[r.status]) byStatus[r.status] = { total: 0, count: 0 };
    byStatus[r.status].total += r.value;
    byStatus[r.status].count++;
  }

  const grandTotal = rows.reduce((s, r) => s + r.value, 0);

  // ── Monta fórmula SOMASES ─────────────────────────────────────────────────
  let formula = '';
  if (valueIdx >= 0) {
    const vC = colLetter(valueIdx);
    const parts = [`${sheetName}!$${vC}:$${vC}`];
    if (dateIdx >= 0)   parts.push(`${sheetName}!$${colLetter(dateIdx)}:$${colLetter(dateIdx)}`, '$A1');
    if (statusIdx >= 0) parts.push(`${sheetName}!$${colLetter(statusIdx)}:$${colLetter(statusIdx)}`, '"ABERTO"');
    formula = `=SOMASES(${parts.join(';')})`;
  }

  return {
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

// ── Ponto de entrada principal ────────────────────────────────────────────────
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
    const result = analyzeSheet(workbook.Sheets[name], name);
    if (result) sheets.push(result);
  }

  return { filename, sheets, analyzedAt: new Date().toISOString() };
}

// ── Texto de contexto compacto para injetar no prompt da IA ──────────────────
function buildSheetContext(analysis) {
  if (!analysis || !analysis.sheets.length) return '';
  let ctx = `\n\n── PLANILHA CARREGADA: ${analysis.filename} ──`;
  for (const s of analysis.sheets) {
    ctx += `\nAba "${s.sheet}" — ${s.totalRows} linhas`;
    if (s.columns.date)   ctx += ` | Vencimento=${s.columns.date.letter}`;
    if (s.columns.value)  ctx += ` | Valor=${s.columns.value.letter}`;
    if (s.columns.status) ctx += ` | Status=${s.columns.status.letter}`;
    ctx += `\n  Total geral: ${s.grandTotalBrl}`;
    for (const [st, ag] of Object.entries(s.byStatus)) {
      ctx += `\n  ${st}: ${brl(ag.total)} (${ag.count} títulos)`;
    }
    // Top 30 datas para responder perguntas específicas
    const top = s.byDateStatus.slice(0, 30);
    if (top.length) {
      ctx += `\n  Por data (top ${top.length}):`;
      for (const d of top) {
        if (d.date) ctx += `\n    ${d.date} ${d.status}: ${brl(d.total)} (${d.count})`;
      }
    }
    if (s.formula) ctx += `\n  Fórmula: ${s.formula}`;
  }
  ctx += `\n\nREGRA: use APENAS os valores acima para responder — nunca invente números.`;
  return ctx;
}

module.exports = { analyzeSpreadsheet, buildSheetContext, brl };
