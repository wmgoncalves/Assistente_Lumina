'use strict';

/**
 * Apollo / Rastreamento — cliente de leitura somente
 * Status: STUB — não conectado. Configure APOLLO_BASE_URL e APOLLO_API_TOKEN
 * quando a integração real for habilitada.
 */

const { writeLog } = require('../logger');

const APOLLO_BASE  = process.env.APOLLO_BASE_URL  || '';
const APOLLO_TOKEN = process.env.APOLLO_API_TOKEN || '';

const ENABLED = Boolean(APOLLO_BASE && APOLLO_TOKEN);

async function _get(endpoint, params = {}) {
  if (!ENABLED) throw new Error('Integração Apollo não configurada (APOLLO_BASE_URL ausente).');
  const url = new URL(endpoint, APOLLO_BASE);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const t0 = Date.now();
  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${APOLLO_TOKEN}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Apollo HTTP ${res.status} — ${endpoint}`);
    const data = await res.json();
    writeLog({ source: 'integration', tool: 'apollo', endpoint, ms: Date.now() - t0 });
    return data;
  } catch (err) {
    writeLog({ source: 'integration', tool: 'apollo', endpoint, error: err.message, ms: Date.now() - t0 });
    throw err;
  }
}

/** Posição atual de um veículo (placa ex: ABC-1234) */
async function getVeiculoPosicao(placa) {
  return _get('/api/veiculo/posicao', { placa });
}

/** Histórico de posições (datas: DD/MM/AAAA) */
async function getHistoricoRota(placa, dataInicio, dataFim) {
  return _get('/api/veiculo/historico', { placa, dataInicio, dataFim });
}

/** Ocorrências registradas de um veículo */
async function getOcorrencias(placa) {
  return _get('/api/veiculo/ocorrencias', { placa });
}

/** Lista todos os veículos em trânsito agora */
async function getFrotaAtiva() {
  return _get('/api/frota/ativa');
}

/** Retorna se a integração está habilitada */
function isEnabled() { return ENABLED; }

module.exports = { getVeiculoPosicao, getHistoricoRota, getOcorrencias, getFrotaAtiva, isEnabled };
