'use strict';

/**
 * CGI ERP — cliente de leitura somente
 * Status: STUB — não conectado. Configure CGI_BASE_URL e CGI_API_TOKEN
 * quando a integração real for habilitada.
 */

const { writeLog } = require('../logger');

const CGI_BASE  = process.env.CGI_BASE_URL  || '';
const CGI_TOKEN = process.env.CGI_API_TOKEN || '';

const ENABLED = Boolean(CGI_BASE && CGI_TOKEN);

async function _get(endpoint, params = {}) {
  if (!ENABLED) throw new Error('Integração CGI não configurada (CGI_BASE_URL ausente).');
  const url = new URL(endpoint, CGI_BASE);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const t0 = Date.now();
  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${CGI_TOKEN}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`CGI HTTP ${res.status} — ${endpoint}`);
    const data = await res.json();
    writeLog({ source: 'integration', tool: 'cgi', endpoint, ms: Date.now() - t0 });
    return data;
  } catch (err) {
    writeLog({ source: 'integration', tool: 'cgi', endpoint, error: err.message, ms: Date.now() - t0 });
    throw err;
  }
}

/** Situação de um CT-e */
async function getCte(numero, serie) {
  return _get('/api/cte', { numero, serie });
}

/** Dados de um manifesto MDF-e */
async function getManifesto(numero) {
  return _get('/api/manifesto', { numero });
}

/** Contrato/recibo de frete */
async function getContratoFrete(recibo, serie) {
  return _get('/api/contrato-frete', { recibo, serie });
}

/** Embarques do dia (data: DD/MM/AAAA) */
async function getEmbarquesDia(data) {
  return _get('/api/embarques', { data });
}

/** Retorna se a integração está habilitada */
function isEnabled() { return ENABLED; }

module.exports = { getCte, getManifesto, getContratoFrete, getEmbarquesDia, isEnabled };
