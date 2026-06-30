#!/usr/bin/env node
/**
 * gerar-planilha-demo.js — Cria DRE_Scapini_Demo.xlsx para uso na apresentação
 * Uso: node gerar-planilha-demo.js
 */
'use strict';
const XLSX = require('xlsx');
const path = require('path');

const wb = XLSX.utils.book_new();

// ── Aba 1: DRE ────────────────────────────────────────────────────────────────
const dreData = [
  ['SCAPINI TRANSPORTES — DRE SIMPLIFICADA', '', '', '', '', '', ''],
  ['Competência: Jan–Jun 2025', '', '', '', '', '', ''],
  ['', '', '', '', '', '', ''],
  ['CONTA', 'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN'],
  ['RECEITA BRUTA DE FRETES', 980000, 1020000, 1150000, 1080000, 1210000, 1340000],
  ['(-) Impostos sobre serviços', -68600, -71400, -80500, -75600, -84700, -93800],
  ['RECEITA LÍQUIDA', 911400, 948600, 1069500, 1004400, 1125300, 1246200],
  ['', '', '', '', '', '', ''],
  ['CUSTOS OPERACIONAIS', '', '', '', '', '', ''],
  ['Combustível (Diesel)', -310000, -322000, -368000, -341000, -385000, -430000],
  ['Manutenção e pneus', -87000, -91000, -103000, -96000, -108000, -120000],
  ['Pedágios', -42000, -44000, -49500, -46500, -52000, -57800],
  ['Salários motoristas (CLT)', -185000, -185000, -185000, -185000, -185000, -185000],
  ['Encargos trabalhistas', -74000, -74000, -74000, -74000, -74000, -74000],
  ['Seguros de carga (RCTR-C + RCTA)', -18000, -18700, -21100, -19800, -22200, -24700],
  ['TOTAL CUSTOS OPERACIONAIS', -716000, -734700, -800600, -762300, -826200, -891500],
  ['', '', '', '', '', '', ''],
  ['LUCRO BRUTO', 195400, 213900, 268900, 242100, 299100, 354700],
  ['Margem Bruta %', '21,5%', '22,5%', '25,1%', '24,1%', '26,6%', '28,5%'],
  ['', '', '', '', '', '', ''],
  ['DESPESAS ADMINISTRATIVAS', '', '', '', '', '', ''],
  ['Salários administrativos', -65000, -65000, -65000, -65000, -65000, -65000],
  ['Encargos administrativos', -26000, -26000, -26000, -26000, -26000, -26000],
  ['Aluguel e infraestrutura', -18000, -18000, -18000, -18000, -18000, -18000],
  ['Tecnologia e sistemas (CGI, rastreamento)', -8500, -8500, -8500, -8500, -8500, -8500],
  ['Despesas financeiras', -12000, -12500, -14100, -13200, -14800, -16400],
  ['Outras despesas', -9000, -9300, -10400, -9700, -10900, -12100],
  ['TOTAL DESPESAS ADMIN.', -138500, -139300, -142000, -140400, -143200, -146000],
  ['', '', '', '', '', '', ''],
  ['EBITDA', 56900, 74600, 126900, 101700, 155900, 208700],
  ['Depreciação da frota', -42000, -42000, -42000, -42000, -42000, -42000],
  ['EBIT (Lucro Operacional)', 14900, 32600, 84900, 59700, 113900, 166700],
  ['IR e CSLL estimados (estimativa)', -5066, -11084, -28866, -20298, -38726, -56678],
  ['LUCRO LÍQUIDO', 9834, 21516, 56034, 39402, 75174, 110022],
  ['Margem Líquida %', '1,1%', '2,3%', '5,2%', '3,9%', '6,7%', '8,8%'],
];

const ws1 = XLSX.utils.aoa_to_sheet(dreData);

// Largura de colunas
ws1['!cols'] = [
  { wch: 40 }, // CONTA
  { wch: 14 }, // JAN
  { wch: 14 }, // FEV
  { wch: 14 }, // MAR
  { wch: 14 }, // ABR
  { wch: 14 }, // MAI
  { wch: 14 }, // JUN
];

// Mescla células do título
ws1['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
  { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
];

XLSX.utils.book_append_sheet(wb, ws1, 'DRE Jan-Jun 2025');

// ── Aba 2: Fretes por Rota ────────────────────────────────────────────────────
const fretesData = [
  ['SCAPINI TRANSPORTES — FRETES POR ROTA (JAN–JUN 2025)', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['ROTA', 'VIAGENS', 'RECEITA TOTAL', 'CUSTO MÉDIO/VIAGEM', 'MARGEM', 'MARGEM %'],
  ['Porto Alegre → São Paulo',     142, 890000, 4720, 218640, '24,6%'],
  ['Porto Alegre → Curitiba',       98, 412000, 2980, 120308, '29,2%'],
  ['Caxias do Sul → São Paulo',     76, 380000, 3650, 92820,  '24,4%'],
  ['RS → Santa Catarina (mix)',    210, 520000, 1680, 147680, '28,4%'],
  ['Porto Alegre → Rio de Janeiro', 34, 248000, 5820, 50280,  '20,3%'],
  ['Interior RS (fracionado)',      310, 330000,  740, 100980, '30,6%'],
  ['TOTAL',                         870, 2780000, 3195, 730708, '26,3%'],
];

const ws2 = XLSX.utils.aoa_to_sheet(fretesData);
ws2['!cols'] = [
  { wch: 38 },
  { wch: 10 },
  { wch: 16 },
  { wch: 20 },
  { wch: 14 },
  { wch: 12 },
];
ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

XLSX.utils.book_append_sheet(wb, ws2, 'Fretes por Rota');

// ── Aba 3: Frota ──────────────────────────────────────────────────────────────
const frotaData = [
  ['SCAPINI TRANSPORTES — FROTA ATIVA', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['PLACA', 'TIPO', 'ANO', 'KM RODADOS (1º SEM)', 'CUSTO MANUTENÇÃO', 'STATUS'],
  ['IXO-4521', 'Carreta Bitrem',    2021, 148000,  8200,  'Ativo'],
  ['JKL-8834', 'Carreta Simples',   2022, 132000,  6100,  'Ativo'],
  ['MNP-3317', 'Caminhão Truck',    2019, 89000,  14300,  'Manutenção'],
  ['QRS-7741', 'Carreta Bitrem',    2023, 155000,  4900,  'Ativo'],
  ['TUV-2209', 'Caminhão Truck',    2020, 97000,   9800,  'Ativo'],
  ['WXY-5502', 'Carreta Simples',   2021, 141000,  7400,  'Ativo'],
  ['ZAB-9913', 'Carreta Bitrem',    2018, 76000,  18600,  'Revisão preventiva'],
  ['CDE-1127', 'Caminhão Truck',    2022, 112000,  5300,  'Ativo'],
  ['FGH-4438', 'Carreta Simples',   2023, 128000,  3800,  'Ativo'],
  ['IJK-7750', 'Carreta Bitrem',    2020, 138000, 11200,  'Ativo'],
  ['TOTAL', '', '', 1216000, 89600, '9 ativos, 1 manutenção, 1 revisão'],
];

const ws3 = XLSX.utils.aoa_to_sheet(frotaData);
ws3['!cols'] = [
  { wch: 14 },
  { wch: 20 },
  { wch: 8 },
  { wch: 22 },
  { wch: 20 },
  { wch: 22 },
];
ws3['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

XLSX.utils.book_append_sheet(wb, ws3, 'Frota');

// ── Salvar ────────────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, 'DRE_Scapini_Demo.xlsx');
XLSX.writeFile(wb, outPath);
console.log(`[gerar-planilha-demo] ✓ Planilha criada: ${outPath}`);
console.log('Abas: DRE Jan-Jun 2025 | Fretes por Rota | Frota');
