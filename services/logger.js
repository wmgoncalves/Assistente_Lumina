'use strict';
const fs   = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'sky-logs.jsonl');
const MAX_KEEP = 10000;

let _lineCount = -1; // -1 = não inicializado

const _getLineCount = () => {
  if (_lineCount >= 0) return _lineCount;
  try {
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    _lineCount = content.trim().split('\n').filter(Boolean).length;
  } catch { _lineCount = 0; }
  return _lineCount;
};

function writeLog(entry) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
  fs.appendFile(LOG_FILE, line, 'utf8', (err) => {
    if (err) return;
    _lineCount = _getLineCount() + 1;
    if (_lineCount > MAX_KEEP) _pruneIfNeeded();
  });
}

function _pruneIfNeeded() {
  try {
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines   = content.trim().split('\n').filter(Boolean);
    if (lines.length > MAX_KEEP) {
      fs.writeFileSync(LOG_FILE, lines.slice(-MAX_KEEP).join('\n') + '\n', 'utf8');
      _lineCount = MAX_KEEP;
    }
  } catch { /* ignore */ }
}

function readLogs({ limit = 500, source = '', q = '' } = {}) {
  try {
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    let entries = content.trim().split('\n').filter(Boolean).map(l => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);

    if (source) entries = entries.filter(e => e.source === source);
    if (q) {
      const lq = q.toLowerCase();
      entries = entries.filter(e =>
        (e.question || '').toLowerCase().includes(lq) ||
        (e.response  || '').toLowerCase().includes(lq) ||
        (e.error     || '').toLowerCase().includes(lq)
      );
    }

    return entries.slice(-limit).reverse();
  } catch { return []; }
}

function clearLogs() {
  try { fs.writeFileSync(LOG_FILE, '', 'utf8'); _lineCount = 0; } catch { /* ignore */ }
}

function countBySource() {
  try {
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const counts  = { total: 0 };
    for (const l of content.trim().split('\n').filter(Boolean)) {
      try {
        const e = JSON.parse(l);
        const s = e.source || 'unknown';
        counts[s]    = (counts[s]    || 0) + 1;
        counts.total = (counts.total || 0) + 1;
      } catch { /* skip malformed */ }
    }
    _lineCount = counts.total;
    return counts;
  } catch { return { total: 0 }; }
}

module.exports = { writeLog, readLogs, clearLogs, countBySource };
