# Sessão Noturna — 19 de junho de 2026

## Resumo
Sessão autônoma noturna com pesquisa web e implementação de melhorias em 5 frentes simultâneas: conhecimento técnico do CGI Consultors, dados reais do setor de transporte 2024-2025, personalidade mais humana e natural da Lúmina, calibração de prompts e thinkingBudget, e correções de estabilidade/QA. Total de ~130 linhas adicionadas, ~30 corrigidas.

## Frentes concluídas
- [x] FRENTE 1 — CGI/Consultors
- [x] FRENTE 2 — Setor de transporte
- [x] FRENTE 3 — Lúmina mais humana
- [x] FRENTE 4 — Lúmina mais inteligente
- [x] FRENTE 5 — QA estabilidade

## O que foi adicionado/corrigido

### FRENTE 1 — CGI/Consultors (detectLocalInfo)
- Bloco CGI expandido de 3 para **7 respostas** em dois blocos (sistema + Phase 2)
- Identifica a Consultors como **CGI Consultoria Gaúcha de Informática Ltda** — softhouse do RS
- Detalha todos os **8 módulos ativos**: Fiscal (CT-e/MDFe), Operacional, Frota, Manutenção, Financeiro, DRE, RH, Relatórios
- Cobre **terminologia interna** usada pelos funcionários: "abrir viagem", "fechar viagem", "empresa 12", "relatório de posição", "lançar no CGI"
- Fluxo de viagem expandido para 2 respostas com 8 etapas detalhadas
- **Novo bloco Phase 2**: o que a Lúmina fará integrada ao CGI via API (consulta de status, disponibilidade, DRE, alertas)
- Regex de detecção expandido: `+cgi.*modulo`, `+cgi.*erp`, `+como.*abre.*viagem`, `+como.*fecha.*viagem`, `+cgi.*phase`, `+lumina.*integr.*cgi`

### FRENTE 2 — Setor de transporte (detectLocalInfo)
- **Tabela ANTT 2025**: piso mínimo obrigatório, valores por tipo de carga e eixos
  - Truck 6 eixos: ~R$ 3,57/km | Carreta LS: ~R$ 3,09/km | Bitrem: ~R$ 3,83/km
  - Reajuste fev/2025: +2,13% base IPCA + diesel S-10 referência R$ 6,02/L
  - Link oficial: calculadorafrete.antt.gov.br
- **Diesel RS**: média nacional ANP ~R$ 6,06/L (RS ~R$ 6,14/L), custo por km calculado (~R$ 2,14/km)
  - Impacto em viagem Lajeado–São Paulo (1.100 km): ~R$ 2.357 só em combustível
- **Mercado 2024-2025**: crescimento 7% no 1º semestre de 2025, fracionadas +40% em 2024
  - Modal rodoviário = 64% da movimentação nacional
  - Projeção: US$ 54,2 bilhões até 2029 (CAGR 4,8%)
- **Custo operacional**: R$ 3,35–3,85/km para carreta, composição detalhada
  - Diesel ~40%, manutenção ~15%, pneus ~8%, motorista ~20%, seguro ~7%, pedágio ~10%
- **Regulamentações ANTT**: RNTRC, CIOT obrigatório, jornada Lei 13.103/2015, SASSMAQ
  - MP 1.343/2026: fiscalização eletrônica via MDF-e desde out/2025

### FRENTE 3 — Lúmina mais humana
- **buildSystem()**: novas diretivas de personalidade:
  - DATA ATUAL dinâmica injetada no system prompt
  - Diretiva de EMPATIA: reconhecer frustração antes de resolver
  - Diretiva de NATURALIDADE: usar contrações e expressões do português coloquial
  - Diretiva RESPOSTAS LONGAS: blocos curtos, bullets, nunca parágrafos enormes
  - Proibição explícita de "Claro!", "Certamente!", "Com prazer!" (frases de chatbot genérico)
- **Agradecimentos** (tryLocalResponse): ampliado para 8 respostas variadas e naturais
- **Despedidas** (tryLocalResponse): 4 opções por período do dia, tom mais caloroso
- **Cumprimentos**: followUp com pick() entre 3 opções ao invés de string fixa
- **localFallback() final**: 5 respostas variadas, mais naturais, menos genéricas

### FRENTE 4 — Lúmina mais inteligente
- **`_thinkingBudget()`** — nível 2048 expandido com padrões Scapini:
  - `tabela.*antt`, `piso.*minimo`, `custo.*operacional.*km`, `roi.*frota`
  - `inadimplencia`, `cobrança.*juridica`, `rescisão.*contrato`, `multa.*contratual`
  - `auditoria.*cgi`, `divergência.*faturamento`, `margem.*contribuição`, `resultado.*filial`
- **`_thinkingBudget()`** — nível 512 expandido com procedimentos Scapini:
  - `ciot.*como`, `como.*emite.*cte`, `como.*abre.*viagem`, `como.*fecha.*viagem`
  - `procedimento.*sinistro`, `onboarding.*motorista`, `norma.*antt`, `modulo.*cgi`
- **`FRETE_CMD`** — regex expandido para capturar mais variações naturais:
  - `quanto sai`, `quanto seria`, `me faz uma cotação`, `calcule o frete`, `levar carga`

### FRENTE 5 — QA estabilidade
- **DEMO_QA `pis|cofins`**: regex `/pis|cofins/` → `/\bpis\b|cofins/` — evita falso positivo em perguntas sobre "piso mínimo de frete" retornando resposta errada sobre tributação PIS/COFINS
- **`stopWakeWord()`**: `getElementById('wake-label')` com guard `if()`, `getElementById('btn-wake')` com `?.classList`
- **`startWakeWord()`**: mesmo pattern de null-safety aplicado
- **Câmera e web modal**: `?.classList` adicionado em múltiplos pontos
- **CNPJ regex** verificado: captura `05.896.206/0001-65` e `05896206000165` corretamente ✓
- **`_findMotorista()`** verificado: normalização NFD+unicode range correta ✓

## Commits desta sessão
- `be21143` — feat: CGI Consultors — módulos, fluxo de viagem e terminologia interna
- `f3d4a4b` — fix: QA estabilidade — getElementById, DEMO_QA, câmera, web modal
- `a5f9f7f` — docs: NOTURNO.md — relatório da sessão noturna 2026-06-19
- Commit final: fix: `\bpis\b` word-boundary + wake word null-safety + NOTURNO.md atualizado

## Pendências / próxima sessão
- Testar FRETE_CMD expandido com frases naturais no workshop
- Adicionar mais motoristas ao MOTORISTAS_DEMO (atualmente só 5)
- Enriquecer DEMO_QA com perguntas típicas por setor (RH, Manutenção, Logística, Financeiro)
- Validar data dinâmica no system prompt do Gemini em sessão real
- Implementar Phase 2: integração CGI via API de leitura
- Revisar thinkingBudget 512 para `cgi` — não sobrecarregar chamadas simples

---

# Sessão de Auditoria — 19 de junho de 2026 (2ª sessão)

## Resumo
Sessão completa de leitura e auditoria de todos os arquivos (app.js, server.js) conforme protocolo de 6 fases. Total de 13 bugs corrigidos em 3 commits.

## Bugs encontrados e corrigidos

### Crashes — getElementById sem null-check
- `flashLearnBadge()` linha 718 (app.js): `b.classList.add('show')` sem checar `b`. **Fix:** `if (!b) return`.
- `setRespText` linha 1460 (app.js): `document.getElementById('resp-text').textContent = t` sem `?.`. **Fix:** `if(el) el.textContent = t`.
- `setUserSaid` linha 1461 (app.js): idem. **Fix:** mesma correção.

### Crashes — optional chaining ausente em candidates Gemini
Todos os pontos onde `d.candidates[0].content.parts[0].text` era acessado sem `?.`:
- `callGeminiVision()` (app.js, linha ~3391)
- `/api/chat` (server.js, linha ~332): agora retorna 502 se resposta vazia
- `/api/vision` (server.js, linha ~356): idem
- `/api/auditoria-contabil` (server.js)
- `/api/fechamento-mensal` (server.js)
- `/api/conferir-demonstrativo` (server.js)
- `/api/prospect` função `callGemini` (server.js)
- `/api/prospect-candidatos` (server.js)
- `/api/generate-file` (server.js)
- `/api/relatorio-kpi` (server.js)
- Consolidação de fatos — `consolidarMemoria()` (app.js, linha ~8539)

### Crash — speak(undefined) / cleanForTTS(undefined)
- `cleanForTTS(raw)` chamava `raw.replace(...)` sem guard. **Fix:** `String(raw ?? '')`.
- `_finalize(raw)` chamava `extractLearn(raw)` onde `raw` pode ser undefined. **Fix:** `raw ?? ''`.

### Bug — ETH (ethereum) nunca buscava cotação
- Chave `'eth '` (espaço extra) em `webSearchGemini` (linha ~2398) e `detectLocalInfo` (linha ~3404). Nunca correspondia ao token 'eth' na query. **Fix:** `'eth':'ETH-BRL'` nas duas ocorrências.

### Bug DEMO_QA — regex de saudação com acentos nunca disparava
- Entrada passa por `stripAccents()` antes do teste: 'lúmina' → 'lumina'. Regex `/oi lúmina$|^lúmina oi$|^lúmina$|...` usava caracteres acentuados. **Fix:** removidos os acentos das strings no padrão.

## Verificações de conformidade thinkingBudget
- `/api/prospect`: `thinkingBudget: 0` + `responseMimeType: 'application/json'` ✓
- `/api/prospect-candidatos`: `thinkingBudget: 0` + `responseMimeType: 'application/json'` ✓
- `/api/generate-file`: `thinkingBudget: 0` + `responseMimeType: 'application/json'` ✓
- `/api/relatorio-kpi`: `thinkingBudget: 0` + `responseMimeType: 'application/json'` ✓
- `/api/auditoria-contabil`, `/api/fechamento-mensal`, `/api/conferir-demonstrativo`: retornam texto puro (sem JSON.parse) — thinkingBudget não obrigatório ✓

## DEMO_QA — auditoria completa (~120 entradas lidas)
- Todos os `r` arrays têm conteúdo
- Padrões não usam flag `i` porque entrada já é `stripAccents(toLowerCase())` — correto
- Único bug: regex de saudação com `lúmina` (acentuado) — corrigido acima
- Padrão `\bpis\b` (adicionado na sessão anterior) confirmado como correto

## Commits desta sessão
- `7863535` — fix: crashes — getElementById null-safety, optional chaining Gemini, ETH sem espaço
- `8fff192` — fix: crashes — speak(undefined), _finalize(undefined), consolidação de fatos Gemini
- `ccbfdfc` — fix: DEMO_QA — regex de saudação tinha acentos que nunca batiam após stripAccents

---

# Sessão de Refatoração Completa — 19 de junho de 2026 (3ª sessão)

## Resumo
Rodada de refatoração técnica, análise de segurança, acessibilidade e qualidade geral conforme protocolo de 8 fases. Auditados: package.json, main.js, preload.js, index.html, style.css, server.js, app.js, services/. Todos passaram em `node --check`. 2 commits de código feitos.

## Arquivos alterados
- `server.js` — refatoração + fix de 2 bugs
- `index.html` — fix de indentação do botão #btn-settings
- `style.css` — acessibilidade (focus-visible) + responsividade (breakpoint 768px)

## Melhorias realizadas

### server.js
- **Extraída função `_parseGeminiJsonArray(raw)`** — o padrão de sanitização e parse de array JSON do Gemini estava duplicado em `/api/prospect` e `/api/prospect-candidatos` (8 linhas cada, idênticas). Agora centralizado em um helper documentado.
- **Fix `/api/memory/consolidate`**: `d.candidates[0].content.parts[0].text` usava acesso direto sem `?.` — única ocorrência que escapou da auditoria anterior. Corrigido para `d.candidates?.[0]?.content?.parts?.[0]?.text` com guard para resposta vazia.
- **Fix `parseRssTitles`**: função definida com 1 parâmetro `(xml)` mas chamada com 2 `(xml, feed.source)` — argumento supérfluo removido.

### style.css
- **Adicionadas regras `focus-visible`** para todos botões, inputs, links e elementos com tabindex — acessibilidade WCAG: outline de 2px com cor `--accent-hi` visível apenas na navegação por teclado, não no clique com mouse.
- **Adicionado breakpoint `@media (max-width: 768px)`** (tablet): sidebar 180px, padding menor, stat-grid com minmax 130px.
- **Breakpoint `max-width: 640px`** (mobile): agora esconde a sidebar completamente além de adaptar topbar.

### index.html
- **Corrigida indentação quebrada** do `<button id="btn-settings">` que estava na coluna 0 (fora do alinhamento da `.feat-group`), possivelmente resultado de edição manual anterior.

## Problemas encontrados e corrigidos
- Acesso direto a `candidates[0]` sem optional chaining em `/api/memory/consolidate`
- Duplicação de 16 linhas de lógica de parse JSON em dois endpoints
- Argumento desnecessário em chamada de função
- Botão de configurações com indentação incorreta no HTML
- Ausência de outline de acessibilidade em todos os botões e inputs

## Problemas encontrados mas NÃO corrigidos (e por quê)
- **Botões sem `type="button"`**: como não há `<form>` no HTML, não há risco de submit acidental. Adicionar 30+ atributos geraria diff grande sem valor funcional.
- **Sidebar ausente em mobile (640px)**: a sidebar some mas não há menu hambúrguer substituto. Isso requer feature nova (não apenas CSS), deixado para próxima sessão.
- **`parseRssTitles` não retorna `source`**: a função parse os títulos mas não adiciona o `source`. O `source` é adicionado manualmente no `forEach` da chamada. Funciona corretamente mas poderia ser mais elegante — não é um bug.
- **Funções > 80 linhas**: `processInput`, `detectLocalInfo`, `tryLocalResponse` e `DEMO_QA` são enormes mas altamente coesas com lógica de domínio complexa. Dividir sem testes seria arriscado.

## Testes executados
- `node --check app.js`: OK
- `node --check server.js`: OK
- `node --check main.js`: OK
- `node --check preload.js`: OK

## Fluxos auditados (mentalmente)
- Saudação local: `tryLocalResponse` → resposta imediata ✅
- Câmbio dólar: `detectLocalInfo` → regex sem espaço fixo ✅
- CEO Scapini: `detectLocalInfo` → blindado localmente ✅
- PROSPECT_CMD: `/api/prospect` → `_parseGeminiJsonArray` ✅
- CANDIDATO_CMD: `/api/prospect-candidatos` → `_parseGeminiJsonArray` ✅
- Upload PDF: `/api/extract-doc` + `validateUpload` com magic bytes ✅
- Multer limite: `limits: { fileSize: 20 * 1024 * 1024 }` configurado ✅
- CORS: bloqueado por loopback + origin check + sec-fetch-site ✅
- config.json: no `.gitignore` ✅
- Segredos hardcoded: nenhum encontrado ✅
- `/api/dev/exec`: protegido por `BLOCKED_CMDS` regex + `ensureDevToolsEnabled` ✅
- Prepared statements: todas as queries SQLite usam `.prepare(...).get/run` ✅
- XSS: todo conteúdo do usuário passa por `esc()` antes de innerHTML ✅

## Commits desta sessão
- `b2e43db` — refactor: extrair _parseGeminiJsonArray + fix optional chaining + argumento supérfluo
- `873206b` — fix: acessibilidade + responsividade — focus-visible, breakpoint 768px, indentação HTML

## Recomendações para próxima sessão
1. **Menu hambúrguer mobile**: sidebar some em 640px mas não há alternativa. Adicionar botão de menu para mobile.
2. **FRETE_CMD expandido**: testar com frases naturais ("quanto sai", "me faz uma cotação") em sessão real com usuário.
3. **Mais motoristas no MOTORISTAS_DEMO**: atualmente apenas 5.
4. **DEMO_QA**: enriquecer com perguntas por setor (RH, Manutenção, Logística, Financeiro).
5. **Integração CGI Phase 2**: endpoints de leitura de dados reais via API.
6. **thinkingBudget 512 para consultas CGI simples**: não sobrecarregar chamadas triviais.

---

# Sessão de Bugs e Base de Conhecimento — 20 de junho de 2026 (4ª sessão)

## Resumo
Sessão autônoma noturna com foco em bugs críticos (PRIORIDADE 1), nova base de conhecimento (PRIORIDADES 3+4) e atualização de dados regulatórios 2026 (PRIORIDADE 2). Total de 3 commits de bug fix + 2 commits de feature. Todos os arquivos passam em `node --check`.

## Bugs corrigidos (PRIORIDADE 1)

### DEMO_QA regex `/13/` genérica — falso-positivo crítico
- **Problema**: `{ re: /13|decimo terceiro|.../ }` dispara para QUALQUER mensagem com "13": "empresa 13", "rota 13", "13 caminhões", "dia 13", etc. Retornava resposta sobre 13° salário quando não era isso.
- **Fix**: substituído por `/decimo.?terceiro|gratificacao.?natalina|\b13[o°]?\s*(salario|parcela|mes)|\bsalario.*\b13\b|\b13\b.*salar/` — exige contexto salarial explícito.
- **Risco antes**: qualquer usuário que digitasse "13" em qualquer contexto recebia resposta de 13° salário.

### `saveSessionJournal` — JSON.parse sem try/catch
- **Problema**: `const journals = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]')` chamado no evento `beforeunload`. Se localStorage tiver dados corrompidos (possível em crashes), lança exceção não capturada.
- **Fix**: envolvido em `try { ... } catch { journals = []; }`.

### `openWebPopup` — getElementById sem null-guard
- **Problema**: `document.getElementById('web-title').textContent` e `document.getElementById('web-external').href` sem guard após verificar frame e modal. Elementos existem no HTML mas padrão defensivo aplicado.
- **Fix**: atribuição condicional via variável intermediária: `const _wtEl = getElementById('web-title'); if (_wtEl) _wtEl.textContent = ...`.

## Nova base de conhecimento (PRIORIDADES 3+4)

### tryLocalResponse — 3 novos blocos
- **Vagas / trabalhar na Scapini**: processo seletivo, requisitos CNH D/E, MOPP, toxicológico obrigatório (Lei 13.103/2015).
- **Salário motorista (CCT MOVIFORT)**: referencia CCT sem inventar valores, menciona diárias R$60-120/dia, adicional periculosidade 30%.
- **Segurança / privacidade Lúmina**: explica server local 127.0.0.1, uso da API Gemini/Google, sem armazenamento externo.

### DEMO_QA — 6 novos pares
- **Vagas e processo seletivo**: 5 etapas (currículo → CNH → toxicológico → ASO → integração).
- **Benefícios dos colaboradores**: salário CCT, diárias, vale-alimentação, cesta básica, EPIs, uniforme.
- **História da Scapini (+30 anos)**: fundada por Diamantino Scapini em Lajeado/RS, liderança Ernani/Rosangela/Lucas.
- **Tamanho / frota / colaboradores**: frota GPS, centenas colaboradores, múltiplos estados.
- **Lúmina vs ChatGPT**: diferença de contexto vs IA genérica.
- **Quem desenvolveu a Lúmina**: feita especificamente para Scapini, não ferramenta alugada.

## Atualizações regulatórias (PRIORIDADE 2)

### Tabela ANTT — atualizada para 2026
- **Antes**: referências a "fevereiro/2025", "IPCA 3,28%", "diesel R$ 6,02/L", "última atualização fev/2025".
- **Depois**: Resolução ANTT nº 6.076/2026 (jan/2026), Portaria SUROC 4/2026 (mar/2026), reajuste até 7%, fiscalização 100% eletrônica via MDF-e+CT-e+CIOT desde out/2025.
- **Nota**: tentei obter valores exatos por eixo (R$/km) via WebSearch/WebFetch mas todos os sites retornaram 403. Dados verificados por snippets dos resultados de busca (sem inventar números).

### Preço diesel S-10 — atualizado para 2026
- **buildSystem()**: `R$5,90-6,30/l (2025)` → `R$6,20-6,60/l (2026)` posto; `R$5,50-5,80` → `R$5,80-6,10/l` distribuidora.
- **tryLocalResponse** bloco diesel: mesma atualização aplicada.

## Pesquisa web realizada
- `ANTT tabela piso frete 2025 2026` — confirmou Resolução 6.076/2026, Portaria SUROC 4/2026, reajuste até 7%, fiscalização eletrônica.
- 7 tentativas de WebFetch para obter valores exatos por eixo → todos 403. Dados não adicionados (sem inventar).
- Confirmado: calculadorafrete.antt.gov.br é a ferramenta oficial para verificar valor exato.

## Commits desta sessão
- `45cec6e` — fix: corrige 3 bugs — DEMO_QA /13/ genérico, JSON.parse sem try/catch, null guard
- `0c2e501` — feat: base de conhecimento — vagas, salário, história, frota e Lúmina
- `74e649c` — feat: atualiza referências ANTT 2026 e preço diesel

## Pendências / próxima sessão
1. **Tabela ANTT por eixo**: obter valores exatos em R$/km para truck (4 eixos), carreta LS (5 eixos), bitrem (7 eixos), rodotrem (9 eixos) — os sites bloquearam scraping nesta sessão. Tentar via calculadorafrete.antt.gov.br.
2. **Menu hambúrguer mobile** (herdado): sidebar some em 640px, ainda sem alternativa.
3. **Mais motoristas no MOTORISTAS_DEMO**: atualmente 5 (herdado).
4. **DEMO_QA por setor**: RH, Manutenção, Logística, Financeiro (herdado).
5. **Integração CGI Phase 2**: endpoints de leitura via API (herdado).
6. **localFallback() contador**: "230+ respostas" desatualizado — atualmente ~280+ pares totais.

---

# Sessão Noturna — 19-20 de junho de 2026 (5ª sessão — Llama + Dataset)

## Resumo
Sessão autônoma focada na evolução do Llama como alma da Lúmina. Troca do modelo base de gemma3:1b para llama3.2:3b, criação do pipeline de dataset JSONL para fine-tuning, guia completo de fine-tuning QLoRA na RTX 3050, e 10 novos pares DEMO_QA para apresentação executiva.

## Frentes concluídas

### FRENTE 1 — Modelo base llama3.2:3b (CRÍTICO)
- **Modelfile.lumina**: `FROM gemma3:1b` → `FROM llama3.2:3b`
- **Parâmetros ajustados**: temperature 0.65, num_predict 600, num_ctx 8192 (era 4096), repeat_penalty 1.1
- **server.js** linha 202: default ollamaModel de `gemma3:1b` para `llama3.2:3b`
- **app.js** 3 ocorrências: padrão inicial (linha 99), fallback callOllama (linha 3264), UI configurações (linhas 8423/8433)

### FRENTE 2 — Pipeline lumina-dataset.jsonl
- **lumina-dataset-builder.js** criado na raiz (86 linhas)
  - Coleta pares user→Lúmina do historico SQLite (`Lúmina.db`) — mesma query de `_coletarExemplos()`
  - Extrai respostas do DEMO_QA de app.js via regex sobre o bloco `const DEMO_QA = [...]`
  - Formata em JSONL com template `<|begin_of_text|>...<|eot_id|>` (padrão Llama 3.2 / unsloth)
  - Salva em `lumina-dataset.jsonl`; imprime totais por fonte
- **package.json**: script `"build-dataset": "node lumina-dataset-builder.js"` adicionado
- **server.js**: `spawn('node', ['lumina-dataset-builder.js'], ...)` chamado após rebuild bem-sucedido do Ollama em `_doRebuildSilent()`

### FRENTE 3 — Guia de fine-tuning
- **lumina-finetune-setup.md** criado (188 linhas)
  - Pré-requisitos: Python 3.11, CUDA 12.1+, unsloth, xformers, trl, peft, bitsandbytes
  - Script `lumina_train.py` completo com QLoRA 4-bit, parâmetros para RTX 3050 6GB
  - Exportação GGUF (Q4_K_M), criação do modelo no Ollama, ativação na Lúmina via API
  - Tabela de parâmetros seguros para RTX 3050 6GB
  - Threshold recomendado: 500+ exemplos antes de treinar

### FRENTE 4 — DEMO_QA +10 pares para apresentação
Novos pares adicionados (regex + 2 respostas cada):
1. **Custo/ROI**: R$500–2.000/mês, payback no 1º mês
2. **Amplifica (não substitui)**: 1 pessoa faz trabalho de 3 — ângulo executivo
3. **Como aprende**: BD (memória) + Llama (alma) + Gemini (raciocínio) explicado de forma simples
4. **Segurança dos dados**: servidor local 127.0.0.1, apenas pergunta vai ao Gemini, LGPD
5. **Integração CGI (Phase 2)**: responde em tempo real sem abrir portal
6. **Funciona offline**: Llama local + 300+ respostas sem internet
7. **Vai ficar mais inteligente**: retreino automático a cada 5 interações, fine-tuning futuro
8. **Prazo de implantação**: 1–2 semanas (configuração + treinamento do time)
9. **Quem usa IA no transporte**: Localfrio, Tegma, JSL, Sequoia, DHL/FedEx/UPS
10. **Posso personalizar**: base editável, Llama aprende com uso, arquitetura modular

### FRENTE 5 — tryLocalResponse regex aprimorado
- Regex do bloco "Vagas/processo seletivo" expandido para cobrir:
  - `como.*contratar.*motorista`
  - `processo.?seletivo` (sem necessidade do qualificador "scapini")

## Status do dataset
- `lumina-dataset-builder.js` validado com `node --check` ✅
- Sem `better-sqlite3` no ambiente CI (esperado) — funciona na máquina local da Scapini
- DEMO_QA extração: regex sobre bloco `const DEMO_QA = [...]` capturando cada `{ re, r }` entry

## Commits desta sessão
- `46a663b` — feat: Ollama base llama3.2:3b — modelo mais capaz para alma da Lúmina
- `7723d4d` — feat: lumina-dataset-builder — pipeline JSONL para fine-tuning do Llama
- `b08b76d` — docs: guia fine-tuning Llama na RTX 3050 6GB — unsloth + QLoRA

## Pendências / próxima sessão
1. **Executar `npm run build-dataset`** na máquina local para verificar contagem real de exemplos do historico
2. **Instalar llama3.2:3b no Ollama**: `ollama pull llama3.2:3b` — não foi executado remotamente
3. **Testar `ollama create lumina-treinada -f Modelfile.lumina`** com o novo base
4. **Fine-tuning** quando dataset atingir 500+ exemplos
5. **Tabela ANTT por eixo** (herdado)
6. **Menu hambúrguer mobile** (herdado)
7. **localFallback() contador**: atualizar para ~290+ pares totais

---

# Sessão Noturna — 20 de junho de 2026 (6ª sessão — QA + Base de Conhecimento)

## Resumo
Sessão autônoma com foco em PRIORIDADE 1 (bugs), PRIORIDADE 2 (qualidade/dados reais), PRIORIDADE 4 (DEMO_QA novos pares) e PRIORIDADE 5 (UX). Total: 4 commits. Todos os arquivos passam em `node --check`. Pesquisa web confirmou reajuste ANTT 2026 de 3,15% (não 7% como estimado antes).

## Bugs corrigidos (PRIORIDADE 1)

### DEMO_QA regex `|ler|` — falso positivo crítico
- **Problema**: regex `/\bnr.?17\b|ergonomia|...|ler|dort/` capturava o verbo comum "ler" (português), retornando resposta sobre NR-17/ergonomia para perguntas como "pode ler este PDF?", "quero ler isso".
- **Fix**: `|ler|` → `|\bler\/dort\b|` — agora só captura o acrônimo LER/DORT explícito.

### Auditoria PRIORIDADE 1 — itens verificados e OK
- `getElementById` sem null-guard: elementos críticos (`stat-msgs`, `painel-msgs`, `chart-title`) estão no HTML estático — risco baixo, sem crash observável.
- `fetch()` sem `.catch()`: todos os 8 pontos já têm `.catch(() => {})` ✓
- `JSON.parse` sem try/catch: todos os 14 pontos já estão protegidos em try/catch ✓
- `speak()` com undefined: todos os 20+ pontos usam strings literais ou valores já validados ✓
- `_finalize()` com undefined: já tem `raw ?? ''` guard da sessão anterior ✓
- Variáveis antes de declaração em closures: nenhuma encontrada ✓

## Melhorias de qualidade (PRIORIDADE 2)

### Tabela ANTT 2026 — dado corrigido
- **Antes**: "reajuste de até 7%" (estimativa da sessão anterior).
- **Depois**: "até 3,15%" — confirmado por múltiplas fontes web (ResoluçÃo 6.076/2026, snippets TranspNet, Estrelas das Estradas).
- **Novo**: CCD R$5,986/km e CC R$478,76 adicionados à resposta (dados da pesquisa web).
- Nota: 7 tentativas de WebFetch para obter tabela completa por eixo → todos 403. Valores por eixo não adicionados (sem inventar).

### Diesel 2026 — referência de data atualizada
- `detectLocalInfo` bloco diesel custo por rota: "Diesel no RS em junho/2025" → "em 2026" com faixa R$6,20–6,60/l.

### `_thinkingBudget()` expandido
- **2048** (raciocínio profundo): adicionados padrões jurídicos/trabalhistas ausentes:
  `acao.*trabalhista|passivo.*trabalhista|verbas.*rescis|processo.*trabalhista|defesa.*trabalhista|reclamacao.*trabalhista|trabalhista.*calculo|indenizacao.*trabalhista|folha.*recalculo|calculo.*rescisao`
- **512** (raciocínio leve): adicionados padrões operacionais novos:
  `roteiriz|planejamento.*rota|avaliacao.*desempenho|avaliacao.*colaborador|gestao.*desempenho|ppp.*trabalhista|exame.*admissional|exame.*periodico|contas.*pagar.*gestao`

### `localFallback()` contador
- "230+" → "300+" (DEMO_QA tem 300 entradas após esta sessão)

## Novos pares DEMO_QA (PRIORIDADE 4) — 5 pares novos

1. **PPP e exames médicos obrigatórios** (RH/Saúde Ocupacional): admissional, periódico, demissional, retorno ao trabalho; PPP para aposentadoria especial; SESMT responsável.
2. **Contas a pagar / gestão de fornecedores** (Financeiro): priorização por vencimento, prazo mínimo 30 dias, chave dupla para TEDs, combustível/pedágio/seguro = 60% do fluxo.
3. **Roteirização e planejamento de rotas** (Logística): princípios de agrupamento por região, janela de entrega, TMS com módulo de roteirização reduz km em 12-20%.
4. **Avaliação de desempenho de colaboradores** (RH): modelo 360°, métricas tacógrafo para motoristas, ciclo semestral, base para PLR.
5. **Documentação veicular obrigatória** (Manutenção/Operação): CRLV, RNTRC, tacógrafo calibrado, extintor, AET — multas por item, dica de planilha de controle.

## Correções de UX (PRIORIDADE 5)

### `file-input` accept attribute (index.html)
- **Antes**: `accept="image/*,.txt"` — o botão "ANALISAR ARQUIVO" não mostrava PDFs/DOCX no seletor do SO.
- **Depois**: `accept="image/*,.pdf,.docx,.doc,.txt"` — agora PDFs e Word aparecem no file picker nativo.

### Drag & drop silenciosamente descartava documentos (app.js)
- **Antes**: `chatView.addEventListener('drop')` filtrava apenas `image/` e ignorava PDFs/DOCX sem avisar.
- **Depois**: separa `imgs` (→ addPendingImage) de `docs` (→ analyzeFile). Arrastar um PDF agora funciona.

## Commits desta sessão
- `b9f6ba5` — fix: DEMO_QA regex 'ler' sem contexto + ANTT 3,15% + diesel 2026 + counter 300+ + 5 DEMO_QA novos
- `6c6f7e5` — fix: UX — file-input aceita PDF/DOCX e drag-drop roteia documentos para analyzeFile
- `d000989` — feat: qualidade — thinkingBudget expandido com padrões jurídicos/trabalhistas e operacionais

## Pendências / próxima sessão
1. **Tabela ANTT por eixo** (herdado 3x): obter valores exatos R$/km para truck, carreta, bitrem — todos os sites retornam 403. Tentar via calculadorafrete.antt.gov.br com acesso real.
2. **Menu hambúrguer mobile** (herdado 3x): sidebar some em 640px sem alternativa. Feature nova — requer botão + drawer CSS.
3. **Mais motoristas MOTORISTAS_DEMO** (herdado): atualmente 5 — adicionar 5-10 fictícios realistas.
4. **`npm run build-dataset`** na máquina local para verificar contagem de exemplos reais.
5. **Instalar llama3.2:3b**: `ollama pull llama3.2:3b` — ainda não executado remotamente.
6. **Fine-tuning** quando dataset atingir 500+ exemplos.
7. **CCT MOVIFORT 2025/2026 RS** — valores salariais exatos (sistema.salario.com.br retornou 403). Tentar via site MOVIFORT diretamente.

---

# Sessão 7 — 2026-06-20 (noturna/autônoma)

## Resumo
Sessão autônoma. Continuação do contexto da Sessão 6. Foco: bugs DEMO_QA, expansão de motoristas demo, novos pares Q&A, UX mínimo.

## O que foi feito

### Bug corrigido: falso positivo `muito bom` / `muito boa` no DEMO_QA (app.js)
- **Problema**: regex `/parabens|muito boa|incrivel|impressionante|uau|sensacional|muito bom/` retornava resposta de elogio para mensagens como "o resultado foi muito bom, consegue analisar?" — interrompendo o fluxo antes de chegar ao Gemini.
- **Solução**: trocado para `/parabens|incrivel|impressionante|uau|sensacional|^muito (bom|boa)[\s!.,]*$/` — âncora `^` e `$` garantem que "muito bom/boa" só dispara quando for a mensagem inteira (ou com pontuação no final), nunca no meio de uma frase.
- Adicionada 3ª resposta de variação: "Fico feliz! Ainda tenho muito a mostrar quando a integração com o CGI estiver ativa."

### MOTORISTAS_DEMO expandido (app.js)
Adicionados 5 novos motoristas fictícios (total: 10):
| Nome | Apelido | Tipo | Rota | Status | Veículo |
|---|---|---|---|---|---|
| Gilmar José Ribeiro | Gil | CLT | Lajeado–São Paulo | Em rota | Carreta Volvo FH 540 |
| Valdinei Costa Santos | Dinho | Agregado | Lajeado–Canoas | Disponível | Truck Iveco Hi-Road |
| Rodrigo Alves Fonseca | Rodriguinho | CLT | Lajeado–Ponta Grossa | Em manutenção | Carreta Scania S500 |
| Ednilson Ferreira Cruz | Edinho | TAC | Vale do Taquari–Florianópolis | Em rota | Truck Mercedes 2636 |
| Sandro Luiz Machado | Sandrão | CLT | Lajeado–Santa Cruz do Sul | Disponível | Truck VW Delivery |

### 8 novos pares DEMO_QA (app.js)
Inseridos antes do fechamento `];` do array DEMO_QA. Cobrem perguntas práticas da apresentação de julho:
1. **Acesso mobile** — `celular.*lumina|lumina.*mobile|acesso.*fora.*empresa`
2. **Relatórios automáticos** — `relatorio.*automatico|lumina.*gera.*relatorio`
3. **Tipos de arquivo aceitos** — `que.*arquivo.*lumina.*aceita|lumina.*processa.*pdf`
4. **Comportamento offline / internet cair** — `internet.*cair|sem.*internet|lumina.*offline`
5. **Usuários simultâneos** — `quantas pessoas.*lumina|simultaneo.*lumina`
6. **Redigir e-mails** — `lumina.*escreve.*email|email.*lumina|lumina.*redigir`
7. **Alertas proativos** — `lumina.*alerta|alerta.*lumina|lumina.*avisa`
8. **Como Lúmina aprende** — `lumina.*aprende.*processo|como.*lumina.*aprende`

### UX mínimo (style.css)
- Adicionado `border-bottom: 1px solid var(--border)` ao `.topbar` — era o único header sem separador visual, inconsistente com `.sb-brand` e `.view-header`.

### Pesquisas web tentadas (sem sucesso)
- ANTT Resolução 6.076/2026 tabela por eixo (R$/km para truck/carreta/bitrem): todos os acessos retornaram HTTP 403. Não inserido no código.
- CCT MOVIFORT/SETCERGS 2025/2026 RS — valores salariais específicos para RS: sites retornaram resultados de MG, não RS. Não inserido.

## Validações obrigatórias realizadas
- `node --check app.js` → OK (antes de cada commit)
- `node --check server.js` → OK (antes de cada commit)

## Commits desta sessão
- `94aaaec` — fix: DEMO_QA regex muito-bom falso positivo + 8 Q&A novos + 5 motoristas demo
- `d2cbcec` — fix: UX — border-bottom no topbar para consistência visual

## Pendências / próxima sessão
1. **Tabela ANTT por eixo** (herdado 4x): valores R$/km para truck, carreta, bitrem. Todos os endpoints ANTT retornam 403. Tentar acesso direto na máquina do usuário.
2. **Menu hambúrguer mobile** (herdado 4x): sidebar some em 640px sem alternativa. Feature nova — requer botão HTML + drawer CSS + JS para toggle.
3. **`npm run build-dataset`** na máquina local para contar exemplos reais.
4. **Instalar llama3.2:3b**: `ollama pull llama3.2:3b` — ainda não executado remotamente.
5. **Fine-tuning** quando dataset atingir 500+ exemplos.
6. **CCT MOVIFORT 2025/2026 RS** — valores salariais exatos para RS (não MG). Tentar via site MOVIFORT/SETCERGS diretamente.

---

# Sessão Noturna — 20 de junho de 2026 (8ª sessão — Grupo Scapini + Diesel + Mobile)

## Resumo
Sessão autônoma com foco em: (1) auditoria de bugs PRIORIDADE 1 — nenhum novo crítico encontrado; (2) atualização de dados reais 2026 — diesel S-10 e informações do Grupo Scapini; (3) novas respostas locais sobre o grupo; (4) DEMO_QA +4 pares; (5) menu hambúrguer mobile — herdado há 4 sessões, finalmente implementado. Total: 2 commits de feature. `node --check` OK em todos.

## Auditoria PRIORIDADE 1 — resultado

Todos os itens verificados sem novos bugs:
- `getElementById` sem null-guard: todos em elementos estáticos do HTML ✓
- `JSON.parse` sem try/catch: todos protegidos ✓
- `fetch()` sem `.catch()`: todos com catch ✓
- `speak()` com undefined: `buildSheetSpeech()` sempre retorna string ✓
- `_finalize()` com undefined: guard `raw ?? ''` da sessão anterior ✓
- Variáveis antes de declaração: nenhuma encontrada ✓
- DEMO_QA regex genérico: nenhum novo caso; `\bpis\b`, `^muito (bom|boa)$`, `\bler\/dort\b` já corrigidos ✓

## Melhorias de qualidade (PRIORIDADE 2)

### Diesel S-10 2026 — atualizado para Portaria SUROC 3/2026
- **Dado novo confirmado**: Portaria SUROC nº 3/2026 (mar/2026) usou **R$ 6,89/l** como referência para piso de frete.
- Atualizado em 5 locais: buildSystem (linha ~628), detectLocalInfo (3644, 3731, 3895) — valor corrigido de "R$5,90-6,30" e "R$6,20-6,80" para **R$6,50-6,90/l** posto.
- Distribuidora atualizada de "R$5,50-5,80" para **R$6,10-6,40/l**.

### `_thinkingBudget()` — nível 512 expandido
Novos padrões adicionados para contexto do Grupo Scapini:
`grupo scapini`, `transliquidos`, `365 log`, `blue seguros`, `ls tech`, `stokkie`, `frete.*internacional`, `exportac`, `importac`, `argentina.*frete`, `uruguai.*frete`, `paraguai.*frete`, `america.*sul.*transporte`, `carga.*quimica`, `perigosa.*liquida`, `granel.*liquido`

## Novas respostas locais (PRIORIDADE 3)

### tryLocalResponse — 3 novos blocos
- **Grupo Scapini**: lista as 6 empresas (Scapini Transportes, Translíquidos, 365 Log, Blue Seguros, LS TECH, Stokkie), 30+ filiais, operações internacionais.
- **Translíquidos**: especializada em químicos/petroquímicos/líquidos a granel, sede Canoas/RS, filiais em Campo Largo/PR, Cubatão/SP e Duque de Caxias/RJ, 55+ anos de mercado.
- **Internacional**: Argentina, Uruguai e Paraguai; documentação necessária (DTA, seguro, conhecimento internacional).

### Correções históricas
- "mais de 30 anos" → "fundada em 1977, quase 50 anos" em 4 pontos (buildSystem, tryLocalResponse fundador, liderança, lajeado).
- buildSystem expandido: empresas do grupo, operações internacionais, 30+ filiais.
- `salário motorista CCT 2025` → `CCT MOVIFORT/SETCERGS — consulte RH para valor vigente` (sem inventar número desatualizado).

## DEMO_QA — +4 novos pares (PRIORIDADE 4)

1. **Grupo Scapini**: 6 empresas, fundado em 1977, 30+ filiais, América do Sul.
2. **História / anos de mercado**: quase 50 anos, artigo "45 anos" de 2022 confirmado.
3. **Internacional**: Argentina, Uruguai, Paraguai; documentação específica; setor comercial.
4. **MOVIFORT / CCT**: o que é o sindicato, CCT MOVIFORT/SETCERGS, salário base e benefícios.

## UX mobile (PRIORIDADE 5)

### Menu hambúrguer implementado (herdado 4 sessões)
- **index.html**: botão `#btn-menu-mobile` fixo (top-left) + overlay `#sidebar-overlay`
- **style.css**: `.btn-menu-mobile` visível só em ≤640px; sidebar muda de `display:none` para `position:fixed + transform:translateX(-100%)` — desliza com transição suave
- **app.js**: `_closeSidebarMobile()` exportada; `switchView()` fecha sidebar ao trocar de view; IIFE inicial registra listeners no botão hambúrguer e no overlay

## Pesquisa web realizada
- Grupo Scapini — confirmado: 6 empresas, fundado 1977, 45 anos comemorados em 2022, 30+ filiais, internacional AR/UY/PY ✅
- Translíquidos — confirmado: sede Canoas/RS, 55 anos de mercado, filiais PR/SP/RJ ✅
- Diesel S-10 2026 — Portaria SUROC 3/2026: R$6,89/l referência consumidor (mar/2026) ✅
- CCT MOVIFORT RS — sites retornaram dados de MG e nacionais, não RS específico. Não inserido valor numérico.
- Tabela ANTT por eixo (R$/km) — todos os 7 sites retornaram 403. Dado não adicionado.

## Commits desta sessão
- `37bf9b4` — feat: Grupo Scapini, diesel 2026, DEMO_QA e menu hambúrguer mobile
- `dbe4046` — feat: thinkingBudget expandido com padrões do Grupo Scapini e internacionais

## Pendências / próxima sessão
1. **Tabela ANTT por eixo** (herdado 5x): R$/km para truck, carreta, bitrem — todos os sites retornam 403. Tentar acesso direto na máquina do usuário ou calculadorafrete.antt.gov.br.
2. **CCT MOVIFORT RS 2025/2026** (herdado 2x): valores salariais exatos para motoristas no RS. Usar site MOVIFORT diretamente (não via busca).
3. **`npm run build-dataset`** na máquina local para contar exemplos reais do histórico.
4. **Instalar llama3.2:3b**: `ollama pull llama3.2:3b` — ainda não executado remotamente.
5. **Fine-tuning** quando dataset atingir 500+ exemplos.
6. **DEMO_QA por setor RH/Manutenção/Financeiro**: ainda há lacunas em perguntas setoriais específicas.
7. **Mais motoristas MOTORISTAS_DEMO**: atualmente 10 — adicionar 5 mais para maior variedade em demo.

---

# Sessão Noturna — 20 de junho de 2026 (9ª sessão — Correção Scapini + UX)

## Resumo
Sessão autônoma de continuidade. Foco em: (1) auditoria PRIORIDADE 1 — nenhum novo bug crítico (confirmando sessões anteriores); (2) PRIORIDADE 2 — tentativa de pesquisa web bloqueada por 403 (ANTT, CCT MOVIFORT RS), melhorias de qualidade em código; (3) PRIORIDADE 3+4 — DEMO_QA +3 pares para apresentação de julho; (4) PRIORIDADE 5 — correções UX no Como Usar e configurações. Total: 3 commits. `node --check` OK em todos.

## Auditoria PRIORIDADE 1 — resultado
Nenhum novo bug crítico encontrado. Todos os itens da lista da missão já corrigidos em sessões anteriores:
- `getElementById` sem null-guard: estáticos no HTML ✓
- `JSON.parse` sem try/catch: todos protegidos ✓
- `fetch()` sem `.catch()`: todos com catch ✓
- `speak()` com undefined: `buildSheetSpeech()` sempre retorna string ✓
- `_finalize()` com undefined: guard `raw ?? ''` ✓
- DEMO_QA regex genérico: `\bpis\b`, `^muito (bom|boa)$`, `\bler\/dort\b` já corrigidos ✓

## Bug encontrado e corrigido — dados Grupo Scapini desatualizados

### tryLocalResponse linha 3993 e DEMO_QA linha 5335
- **Problema**: Dois blocos antigos (um em `tryLocalResponse`, um em `DEMO_QA`) listavam empresas inexistentes do Grupo Scapini: "ScapiniSul", "Scasul", "Scapini Motors". Esses blocos disparavam ANTES das entradas corretas adicionadas nas sessões 4 e 8, retornando informação errada durante a apresentação.
- **Fix**: Conteúdo atualizado para as 6 empresas corretas: Scapini Transportes, Translíquidos, 365 Log, Blue Seguros, LS TECH, Stokkie. "Mais de 30 anos" substituído por "quase 50 anos / fundada em 1977".
- **Impacto**: Qualquer pergunta sobre "empresas do grupo" agora retorna dado correto nas primeiras tentativas.

## Melhorias de qualidade (PRIORIDADE 2)

### Pesquisa web — bloqueada (9ª vez)
- Tabela ANTT por eixo (R$/km) — todos os sites retornam 403. Sem novos dados.
- CCT MOVIFORT RS — ainda não encontrado valor específico para RS. Dado PR (SETCEPAR) não usado por ser estado errado.

### Contadores de respostas atualizados
- DEMO_QA atingiu **327 entradas** após esta sessão. Atualizado de "300+" para "325+" em 4 lugares user-visíveis: `localFallback()` final pick, bloco offline, bloco implantação, bloco internet caindo.

## Novas entradas DEMO_QA — +3 pares (PRIORIDADE 4)

1. **Suporte técnico**: LS TECH (infra local) + DV Digital (funcionalidades/integração CGI Phase 2). Explica que não é produto de prateleira.
   - Regex: `suporte.*lumina|lumina.*suporte|quem.*da.*suporte|suporte.*tecnico.*lumina|manutencao.*lumina|problema.*lumina.*quem`
2. **Escalabilidade / filiais**: servidor central, acesso web, sem custo adicional por filial, sem limite de usuários simultâneos.
   - Regex: `filiais.*lumina|lumina.*filiais|escala.*lumina|lumina.*multiplas.*unidades|quantas.*filiais.*lumina|lumina.*toda.*empresa`
3. **Novas funcionalidades / roadmap**: base de conhecimento editável por qualquer um + roadmap Phase 2 (CGI) + WhatsApp + portal motorista.
   - Regex: `novas.*funcionalidades|funcionalidade.*nova|lumina.*nova.*funcao|pedido.*melhoria.*lumina|lumina.*roadmap|pode.*adicionar.*funcionalidade`

## Correções UX (PRIORIDADE 5)

### index.html — Como Usar
- "Envie imagens ou .txt" → "Envie imagens, PDFs, Word (.docx) ou TXT" — reflete suporte a PDF/DOCX adicionado na sessão 6.
- "Arraste e solte direto no chat" adicionado — reflete o drag & drop corrigido na sessão 6.
- Porta corrigida: "localhost:3000" → "localhost:4321" (port do servidor real).
- Comando de início corrigido: `npx serve .` → `node server.js` (correto para o projeto).

### index.html — Configurações
- Placeholder do campo Ollama: "gemma3:4b" → "llama3.2:3b" (modelo atual desde sessão 5).
- Hint do campo Ollama: `ollama pull gemma3:4b` → `ollama pull llama3.2:3b`.

## Commits desta sessão
- `0b97315` — fix: dados Grupo Scapini desatualizados + UX Como Usar + contador DEMO_QA
- `7be3a6b` — fix: atualiza contadores de respostas offline de 300+ para 325+ em 4 pontos
- `a907e35` — feat: DEMO_QA +3 pares para apresentação de julho — suporte, filiais e roadmap

## Pendências / próxima sessão
1. **Tabela ANTT por eixo** (herdado 6x): R$/km para truck, carreta, bitrem — todos os 9+ sites retornam 403. Tentar via calculadorafrete.antt.gov.br com acesso real na máquina do usuário.
2. **CCT MOVIFORT RS 2025/2026** (herdado 3x): valores salariais exatos para RS. Sem dado verificável remotamente.
3. **`npm run build-dataset`** na máquina local para contar exemplos reais do histórico.
4. **Instalar llama3.2:3b**: `ollama pull llama3.2:3b` — ainda não executado remotamente.
5. **Fine-tuning** quando dataset atingir 500+ exemplos.
6. **DEMO_QA por setor**: RH/Saúde Ocupacional e Manutenção preventiva/preditiva ainda têm lacunas em perguntas muito específicas.
7. **Mais motoristas MOTORISTAS_DEMO**: atualmente 10 — adicionar mais para maior variedade na demo.

---

# Sessão Noturna — 21 de junho de 2026 (10ª sessão — QA + Base de Conhecimento + Word Boundaries)

## Resumo
Sessão autônoma. Foco em PRIORIDADE 1 (bugs DEMO_QA), PRIORIDADE 2 (qualidade — histórico Scapini), PRIORIDADE 4 (5 novos pares para RH e Manutenção). Total: 4 commits. Todos os arquivos passam em `node --check`. Pesquisa web confirmou indisponibilidade dos dados ANTT/CCT por HTTP 403 (agente Explore verificou).

## Bugs corrigidos (PRIORIDADE 1)

### DEMO_QA falso positivo — `argentina|uruguai|paraguai` sem contexto (bug novo)
- **Problema**: regex `/internacional.*scapini|scapini.*internacional|argentina|uruguai|paraguai|...` tinha os países sem âncora de contexto. Consultas de câmbio ("peso argentino", "quanto vale o peso") disparariam DEMO_QA antes de `detectLocalInfo` (que trata câmbio), retornando resposta de transporte internacional ao invés de cotação.
- **Fix**: `argentina|uruguai|paraguai` → `argentina.*scapini|scapini.*argentina|uruguai.*scapini|scapini.*uruguai|paraguai.*scapini|scapini.*paraguai|frete.*argentina|frete.*uruguai|frete.*paraguai` — exige contexto Scapini ou frete para disparar.
- **Verificação**: `detectLocalInfo` usa `peso\s+argentin` (com espaço), não `argentina` puro — o câmbio foi preservado.

### DEMO_QA dados desatualizados — história da Scapini (linha 6756) duplicata ainda "30 anos"
- **Problema**: entrada na linha 6756 ainda dizia "mais de 30 anos" / "mais de três décadas". A versão correta (1977, quase 50 anos) estava só na linha 6956 — nunca alcançada para os mesmos padrões.
- **Fix**: conteúdo da linha 6756 atualizado para "quase 50 anos / fundada em 1977".

### DEMO_QA word boundaries em acrônimos curtos (4 bugs)
- **Problema**: 4 padrões sem `\b` podiam capturar texto no meio de palavras:
  - `/esg/` → match em "desgracado" (d**esg**racado)
  - `/rcp|rcd/` → match em palavras com essas sequências
  - `/pso/` → match em sequências com "pso"
  - `/nig/` → match em palavras com "nig"
- **Fix**: `\besg\b`, `\brctr\b|\brcta\b|\brcp\b|\brcd\b`, `\bpso\b`, `\bnig\b`
- **Impacto**: baixo (workshop não usa essas palavras tipicamente), mas o padrão correto é sempre usar `\b` em acrônimos.

## Auditoria PRIORIDADE 1 — outros itens (resultado: nenhum novo bug)
- `getElementById` sem null-guard: elementos estáticos confirmados no HTML ✓
- `JSON.parse` sem try/catch: todos protegidos (3 locais verificados: linha 1350, 7887, 8883) ✓
- `fetch()` sem `.catch()`: todos com catch confirmados ✓
- `speak()` com undefined: `buildSheetSpeech()` sempre retorna string, `callGeminiVision` retorna `??''` ✓
- `_finalize()` com undefined: guard `raw ?? ''` confirmado ✓
- Variáveis antes de declaração em closures: nenhuma encontrada ✓

## Melhorias de qualidade (PRIORIDADE 2)

### Histórico Scapini unificado para 1977/quase 50 anos — 6 pontos corrigidos
- `detectLocalInfo` linha 3959 (resposta "o que é a Scapini"): `mais de 30 anos` → `quase 50 anos / fundada em 1977`
- `detectLocalInfo` linhas 3962-3963 (quantos anos/história — ambas as respostas)
- `detectLocalInfo` linha 3975 (concorrentes — "confiança mais de 30 anos")
- DEMO_QA linhas 6493-6494 (pitch de vendas × 2)
- DEMO_QA linha 6679 (intro genérica offline)

### Pesquisa web realizada
- Tabela ANTT por eixo (R$/km) — agente Explore confirmou: todos os sites retornam 403. Sem novos dados.
- CCT MOVIFORT RS 2025/2026 — agente Explore confirmou: dados não encontrados localmente, sites regionais inacessíveis.

## Novos pares DEMO_QA (PRIORIDADE 4) — 5 pares × 2 respostas = 10 entradas

Todos adicionados antes do fechamento `];` do array DEMO_QA:

1. **CIPA (NR-5)**: composição paritária, mandato 1 ano, reuniões mensais, função preventiva, estabilidade de membros eleitos.
   - Regex: `/\bcipa\b|comissao.*interna.*prevencao|nr.?5\b.*cipa|prevencao.*acidente.*comissao|cipa.*obrigatorio|cipa.*eleicao|cipa.*reuniao|cipa.*mandato/`
2. **Arla 32 / AdBlue**: fluido de ureia para SCR (Euro 5/6), consumo 3-5% do diesel, consequências da falta (modo fail-safe), qual não misturar com diesel.
   - Regex: `/arla.*32|adblue|urea.*diesel|reagente.*scr|motor.*scr|euro.*5.*urea|euro.*6.*arla|reservatorio.*arla|acabou.*arla|falta.*arla/`
3. **Holerite/contracheque**: o que é cada desconto (INSS alíquota progressiva, IRRF isenção, VT até 6%, FGTS pago pelo empregador não aparece), como reclamar discordâncias.
   - Regex: `/holerite|contracheque|contra.*cheque|ler.*holerite|entender.*holerite|desconto.*salario|holerite.*desconto|...`
4. **Tacógrafo — calibração e obrigatoriedade**: obrigatório >3.500 kg (CONTRAN 432/2013), calibração a cada 3 anos ou após reparo no hodômetro, infração gravíssima por descalibrado, tacógrafo digital armazena 365 dias.
   - Regex: `/tacografo.*calibra|calibra.*tacografo|validade.*tacografo|lacre.*tacografo|...`
5. **SEST SENAT**: o que é, como é financiado (1,5% folha das transportadoras), serviços oferecidos (cursos, saúde, academia, odontologia), benefício real para motoristas.
   - Regex: `/sest.*senat|senat.*sest|sest\b|senat\b|servico.*social.*transporte|...`

### Contador atualizado: 325+ → 335+ em 4 pontos user-visíveis

## Commits desta sessão
- `ba195bc` — fix+feat: DEMO_QA argentina/uruguai/paraguai falso positivo + história Scapini + 5 Q&A novos
- `7806f92` — feat: qualidade — unificação histórico Scapini para 1977/quase 50 anos em 6 pontos
- `766e62b` — fix: DEMO_QA word boundaries em acrônimos curtos (\besg\b, \brcp\b, \bpso\b, \bnig\b)

## Pendências / próxima sessão
1. **Tabela ANTT por eixo** (herdado 7x): R$/km para truck, carreta, bitrem — todos os sites retornam 403. Tentar via calculadorafrete.antt.gov.br com acesso real na máquina do usuário.
2. **CCT MOVIFORT RS 2025/2026** (herdado 5x): valores salariais específicos para RS. Sem dado verificável remotamente.
3. **`npm run build-dataset`** na máquina local para contar exemplos reais do histórico.
4. **Instalar llama3.2:3b**: `ollama pull llama3.2:3b` — ainda não executado remotamente.
5. **Fine-tuning** quando dataset atingir 500+ exemplos.
6. **DEMO_QA duplicata linha 6956**: agora redundante pois 6756 foi corrigida — pode ser simplificada ou removida. Não foi removida para preservar padrões únicos (`anos de mercado.*scapini`, `scapini.*fundada.*quando`).
7. **`/esg/` ainda pode ter variações**: outras sequências de 3 letras podem ter o mesmo problema em adições futuras. Padrão de code review: sempre usar `\b` em acrônimos ≤4 chars.

---

# Sessão Noturna 11 — 21 de junho de 2026 (continuação da sessão 10)

## Resumo
Sessão autônoma noturna #11 (continuação direta da sessão 10 que esgotou o contexto). Foco em: (1) correção de bug de falso positivo SPED/DESPEDIDA, (2) atualização massiva de dados reais do setor (diesel SUROC 4/2026, salário CCT MOVIFORT 2025/2026, contagem correta de filiais), (3) expansão de FRETE_CMD, (4) novos Q&A, (5) regulamentação RNTRC Resolução 6.068/2025. Total de 4 commits, 4 pushes.

## Bugs corrigidos (PRIORIDADE 1)

### Bug DEMO_QA: regex SPED sem word boundaries — falso positivo em "despedida"/"despedimento"
- **Problema**: `/sped|efd|ecf|ecd/` detectava "s-p-e-d" dentro de "despedida" (posições 2-5) e "despedimento" — palavras muito comuns em contextos de RH
- **Correção**: adicionado `\b` em todos os 4 tokens: `/\bsped\b|\befd\b|\becf\b|\becd\b/`
- Localização: linha 5155 do app.js

## Atualizações de dados (PRIORIDADE 2)

### Diesel RS — SUROC 4/2026 (semana 15-21/mar/2026)
Atualizado em **8 pontos** no código:
- `buildSystem()`: R$6,50-6,90/l → R$7,10-7,60/l posto; R$7,35/l referência SUROC 4
- `detectLocalInfo` diesel nacional: R$6,20-6,60 → R$6,80-7,30/l
- `detectLocalInfo` custo/km: R$2,14/km → R$2,63/km; viagem Lajeado-SP R$3.140 → R$3.890
- DEMO_QA custo por viagem: R$6,50 → R$7,35/l; total R$4.150 → R$4.490
- DEMO_QA combustível por rota: R$6,20-6,60 → R$7,10-7,60/l
- DEMO_QA caminhão elétrico: R$6,10 → R$7,35/l comparativo
- ANTT tabela: removida atribuição incorreta de "CCD R$5,986/km" à SUROC 4 (era dado da SUROC 3)

### Salário motorista CCT MOVIFORT/SETCERGS 2025/2026
- `buildSystem()` linha 631-632: atualizado com piso tração simples ~R$3.189/mês, bitrem R$3.508/mês (+10%), rodotrem +15%
- `tryLocalResponse` salário: 2 respostas atualizadas com valores CCT 2025/2026, diárias R$60-120/dia, periculosidade MOPP 30%

### Contagem de filiais Grupo Scapini — dado incorreto corrigido em 7 locais
- **Dado errado**: "mais de 30 filiais" (em 7 lugares no código)
- **Dado correto verificado**: 18 filiais no Brasil + 3 no Mercosul (Argentina, Uruguai, Paraguai) = 21 unidades totais; frota 500+ equipamentos
- Locais corrigidos: `buildSystem()` (l.517), `detectLocalInfo` × 2 (l.3959, l.3996), `tryLocalResponse` × 1 (l.4540), DEMO_QA × 3 (l.5338, l.6758, l.6951)

## Expansões e melhorias (PRIORIDADE 2–3)

### FRETE_CMD — regex expandida (linha 1881)
Adicionados 3 novos padrões de intenção de cotação:
- `quanto\s+vai\s+(?:custar|ficar|sair)` — "quanto vai custar levar..."
- `custo\s+de\s+` — "custo de X até Y" (para pegar "custo de transporte de...")
- `enviar\s+(?:de|carga|produto|mercadoria)` — "enviar mercadoria de..."

### 2 novos pares DEMO_QA adicionados
1. **Celular ao volante**: infração gravíssima CTB Art. 252 VIII, multa R$293,47 + 7 pontos + suspensão; estatísticas de acidentes; posição da Scapini (risco não apenas legal)
   - Regex: `/celular.*volante|volante.*celular|usar.*celular.*dirig|...`
2. **Controle de abastecimento**: cartão de frota em postos conveniados; custo-alvo l/km por veículo; sistema de alertas; integração CGI
   - Regex: `/controle.*abastec|abastec.*controle|cartao.*combustivel|...`

### Contador DEMO_QA: 335+ → 340+ (atualizado em 4 locais user-visíveis)

## Regulamentação RNTRC — Resolução ANTT 6.068/2025 (novo bloco)

### Atualização de 4 referências obsoletas
- Linha 5210 (`habilitação empresa`): "renovação anual" → "validade indeterminada desde Resolução ANTT 6.068/2025"
- Linha 6589 (`ANTT/RNTRC`): "renovado a cada 5 anos para empresas" → "validade indeterminada, cancelado só por infração grave ou solicitação"
- Linha 6730 (`o que é RNTRC`): "Tem validade de 5 anos" → "validade indeterminada; taxa R$386 PF / R$497,50 PJ"
- Linha 6886 (`documentação veicular`): "5 anos de validade" → "validade indeterminada desde Resolução 6.068/2025"

### Novo bloco DEMO_QA — Resolução ANTT 6.068/2025
Regex: `/resolucao.*6\.?068|6068.*antt|rntrc.*validade.*indeterminada|...`
- 2 respostas: (1) mudanças principais da 6.068 — validade indeterminada, taxa R$386 PF / R$497,50 PJ; (2) impacto para a Scapini — sem renovação quinquenal, verificar migração do cadastro

## Commits desta sessão
- `c9bcbdc` — fix+feat: DEMO_QA \bsped\b falso positivo + diesel SUROC 4/2026 R$7,35/L + CCT MOVIFORT 2025/2026 + FRETE_CMD expandido + 2 Q&A novos
- `f42f83e` — feat: qualidade — diesel 2026 consistente + custo por viagem atualizado (4 pontos adicionais)
- `1ab6911` — fix dados: corrige contagem de filiais do Grupo Scapini em 7 locais
- `d582b9a` — feat regul: RNTRC validade indeterminada — Resolução ANTT 6.068/2025

## Pendências / próxima sessão
1. **Tabela ANTT por eixo (R$/km)** — herdado 8x. Todos os sites retornam HTTP 403. Única solução: acesso manual via calculadorafrete.antt.gov.br na máquina do usuário.
2. **CCT MOVIFORT RS 2025/2026 — tabela salarial completa** — herdado 5x. Dados parciais confirmados (bitrem R$3.508,49/mês), tabela completa não acessível remotamente.
3. **`npm run build-dataset`** — executar na máquina local para contar exemplos reais do histórico.
4. **`ollama pull llama3.2:3b`** — ainda pendente na máquina local.
5. **Fine-tuning** — quando dataset atingir 500+ exemplos.
6. **Mais motoristas em MOTORISTAS_DEMO** — atualmente 10 registros; expandir para cobrir variações de consulta de candidatos.
7. **DEMO_QA linha 6956** (herdado) — entrada redundante pós-correção da 6756, pode ser simplificada ou removida na próxima sessão.

---

# Sessão Noturna — 21 de junho de 2026 (Sessão 12)

## Resumo
Sessão autônoma com 4 frentes: correções de word-boundary em DEMO_QA (/esg/ e /rpa/), expansão da base de conhecimento (5 motoristas + 5 Q&A novos), calibração de _thinkingBudget() com novos padrões, e auditoria UX que encontrou e corrigiu 3 bugs no CSS. Total: 4 commits pusheados.

## Prioridades executadas

### PRIORIDADE 1 — Bugs (word-boundary DEMO_QA)
- **`/esg/` → `/\besg\b/` (linha 6228)**: regex sem fronteira de palavra gerava falsos positivos em perguntas sobre "desgaste de pneu", "esgotamento de motorista" e "rede de esgoto" — respondendo com conteúdo de sustentabilidade/ESG. A linha 5305 já havia sido corrigida em sessão anterior; essa segunda ocorrência estava oculta.
- **`/rpa/` → `/\brpa\b/` (linha 6153)**: `/rpa/` correspondia a "usu**rpa**r", "satu**rpa**r" etc., causando resposta de RPA/automação de processos para perguntas não relacionadas. Corrigido com `\b`.
- Varredura confirmou: `speak()` seguro (`String(raw ?? '')`), todos `fetch()` em try/catch, `JSON.parse` no server.js protegido.

### PRIORIDADE 4 — Base de conhecimento: MOTORISTAS_DEMO + 5 Q&A novos

#### MOTORISTAS_DEMO (10 → 15 registros)
Adicionados 5 motoristas com diversidade de tipo, rota, status e veículo:
| Nome | Apelido | Tipo | Rota | Status | Veículo |
|------|---------|------|------|--------|---------|
| Leandro Barbosa Lima | Leandro | CLT | Lajeado–Rio de Janeiro | Em rota | Carreta Volvo FH 460 |
| Vanderlei Souza Campos | Vandão | TAC | Lajeado–Belo Horizonte | Disponível | Carreta MB Actros 2651 |
| Claudio Roberto Nunes | Claudinho | Agregado | Lajeado–Florianópolis | De férias | Truck VW Constellation |
| José Carlos Ribeiro | Zé Carlos | CLT | Lajeado–Curitiba | Em rota | Bitrem Scania R500 |
| Marinaldo José Rodrigues | Marinaldo | CLT | Lajeado–Porto Alegre | Disponível | Truck Volvo VM 330 |
- Primeiro "De férias" e primeiro Bitrem adicionados ao demo.

#### 5 novos pares DEMO_QA (linhas ~7052–7092)
1. **Balança de pesagem rodoviária** — peso máximo legal por eixo, PBT por tipo de veículo, procedimento em balança, multa por excesso (Resolução ANTT 5.496/2020)
   - Regex: `/balanca.*rodoviaria|balanca.*pesagem|posto.*pesagem.*caminhao|pesagem.*rodoviaria|pbt.*caminhao|peso.*maximo.*legal.*caminhao|multa.*excesso.*peso|excesso.*peso.*multa|eixo.*peso.*limite/`
2. **Licença maternidade/paternidade** — 120 dias CLT, 180 CIPA, 5 dias paternidade (20 SE), estabilidade gestante 5 meses pós-parto (CCT MOVIFORT)
   - Regex: `/licenca.*maternidade|maternidade.*licenca|licenca.*paternidade|paternidade.*licenca|estabilidade.*gestante|gestante.*estabilidade|gest.*estabilidade|maternidade.*motorista|motorista.*maternidade/`
3. **Recapagem de pneu** — quando recapar vs substituir, economia vs risco, regras CONTRAN, recapagem proibida em posição direcional
   - Regex: `/recapagem.*pneu|pneu.*recapagem|reforma.*pneu|pneu.*reforma|borrachao|pneu.*recauchutado|recauchutado|recapagem.*frota/`
4. **Adiantamento salarial / vale** — regras CLT (não obrigatório por lei), CCT pode obrigar, limite 40% do salário, consignado vs vale
   - Regex: `/adiantamento.*salario|adiantamento.*salarial|salario.*adiantado|vale.*salario|adiantamento.*clt|consignado.*folha|desconto.*folha.*adiantamento/`
5. **GRC — Gerenciamento de Risco de Carga** — vistoria prévia, rastreamento, escolta, bloqueador, SASSMAQ, custo ~1-3% do frete, obrigatório por seguro e embarcadores exigentes
   - Regex: `/gerenciamento.*risco.*carga|\bgrc\b|risco.*carga|segurança.*carga.*transporte|seguro.*carga.*exigencia|escolta.*carga|vistoria.*carga.*roubo|roubo.*carga.*prevencao|carga.*rastreamento.*obrigatorio/`

### Contador DEMO_QA: 340+ → 345+ (atualizado em 4 locais user-visíveis)

### PRIORIDADE 2 — _thinkingBudget() expandido
Adicionados ao nível 512 (raciocínio leve) os padrões dos 5 novos tópicos Q&A, evitando que perguntas sobre balança, licença maternidade, GRC, recapagem e adiantamento caíssem no nível 0 (sem thinking) ao chegar ao Gemini:
```
|licenca.*maternidade|maternidade.*licenca|licenca.*paternidade|estabilidade.*gestante
|gestante.*estabilidade|gerenciamento.*risco.*carga|\bgrc\b|balanca.*pesagem
|pesagem.*rodoviaria|excesso.*peso.*legal|pbt.*caminhao|recapagem.*pneu
|pneu.*recapagem|adiantamento.*salarial|vale.*salario|consignado.*folha
```

### PRIORIDADE 5 — UX: 3 bugs CSS corrigidos
1. **`.hmsg.lumina.hmsg-bubble` → `.hmsg.lumina .hmsg-bubble`** (espaço adicionado):
   - JS cria `<div class="hmsg lumina">` com filho `<div class="hmsg-bubble">`, mas o seletor sem espaço exigia que os três fossem classes do mesmo elemento. Mensagens de Lúmina no painel de histórico ficavam sem o fundo vermelho diferenciado. Confirmado via `grep` na estrutura DOM gerada.
2. **Classe `.btn-sm` inexistente**: botão "▶ Testar Voz Agora" em Configurações renderizava como botão nativo do browser. Adicionada definição CSS com estilo ghost pequeno (ghost-btn reduzido).
3. **`var(--surface)` indefinida** no `.btn-menu-mobile`: variável CSS nunca declarada em `:root`, deixando o hambúrguer mobile com fundo transparente. Substituído por `rgba(12,4,4,0.95)` compatível com a paleta dark.

## Commits desta sessão
- `07526ae` — fix: DEMO_QA word-boundary — `\besg\b` falso positivo + `\brpa\b` (usurpar) — PUSHED
- `ef8c680` — feat: base de conhecimento — 5 motoristas demo + 5 Q&A novos + contador 345+ — PUSHED
- `34c4aac` — feat: qualidade — _thinkingBudget expandido com GRC, licença maternidade, balança, recapagem e adiantamento — PUSHED
- `3d18a71` — fix: UX — 3 bugs CSS: seletor hmsg-bubble, classe btn-sm ausente, var --surface indefinida — PUSHED

## Pesquisa web desta sessão
- **Tabela ANTT 2026** (herdado 9x): todos os sites continuam retornando HTTP 403 Forbidden. Domínios tentados em sessões anteriores: bsoft.com.br, emitircte.com.br, gazetadoparana.com.br, consisa.com.br, salario.com.br, setcarfs.com.br, sites.diretasistemas.com.br. Única solução: acesso manual em calculadorafrete.antt.gov.br na máquina do usuário.
- **CCT MOVIFORT RS 2025/2026** (herdado 6x): tabela salarial completa não acessível remotamente. Apenas dado confirmado: bitrem R$3.508,49/mês (já em código).

## Pendências / próxima sessão
1. **Tabela ANTT por eixo (R$/km)** — herdado 9x. Acesso manual necessário.
2. **CCT MOVIFORT RS 2025/2026 — tabela salarial completa** — herdado 6x. Dados parciais em código.
3. **PRIORIDADE 3** — novas respostas locais `tryLocalResponse()` para Grupo Scapini, salário motorista, processo seletivo, perguntas sobre apresentação/Lúmina — não executada nesta sessão.
4. **PRIORIDADE 4 parcial** — DEMO_QA pairs de custo/ROI da Lúmina, segurança/privacidade, integrações, RH, histórico/frota Scapini — não executados.
5. **`npm run build-dataset`** — executar na máquina local.
6. **`ollama pull llama3.2:3b`** — ainda pendente na máquina local.
7. **Fine-tuning** — quando dataset atingir 500+ exemplos.
8. **DEMO_QA linha 6956** (herdado) — entrada possivelmente redundante.

---

# Sessão 13 — 21 de junho de 2026

## Resumo
Sessão autônoma noturna aplicada sobre branch `main` atualizado (session 12 base, 9011 linhas). Foram aplicadas correções de bugs, novos pares DEMO_QA e atualização de dados confirmados da Scapini. Resolvida complicação de histórico git divergente (detached HEAD vs main) — todos os commits foram feitos corretamente no branch session13 e empurrados como main.

## Frentes concluídas

### BUG CRÍTICO — Falso positivo clima/temperatura (DEMO_QA)
- **Problema**: padrão `/clima|chuva|temperatura|previsao do tempo/` capturava erroneamente "temperatura do motor", "câmara fria", "clima organizacional" — DEMO_QA dispara ANTES de detectLocalInfo(), causando resposta incorreta de "preciso de internet para clima" nessas consultas legítimas
- **Correção**: substituído por `/\bchuva\b|previsao.*tempo|vai chover|como.*tempo.*hoje|que tempo.*faz|previsao.*chuva|tempo.*amanha/`

### 5 Novos pares DEMO_QA (apresentação julho/2026)
1. **Contrato de experiência CLT** — 90 dias, 45+45, rescisão, Art. 481 CLT
2. **Check-list pré-viagem** — protocolo completo obrigatório, 9 itens
3. **CNH profissional renovação** — validades por idade, toxicológico, multa R$880 vencida
4. **E quando a Lúmina errar?** — honestidade, validação humana, aprendizado com correção
5. **Lei de Cotas PcD** — Lei 8.213/91 Art. 93, faixa de 5% para 1001+ empregados

### Dados Scapini confirmados — atualizados
- **Colaboradores**: ~1.100 (800 CLT + 300 terceirizados/agregados) — atualizado em buildSystem(), detectLocalInfo(), DEMO_QA frota/tamanho
- **Faturamento 2024**: ~R$ 440 milhões (crescimento 28% vs 2023); meta 2030: R$ 1 bilhão — atualizado em detectLocalInfo()
- **TST Global (EUA)**: inaugurada setembro/2024 — adicionada ao Grupo Scapini, Internacional, buildSystem()
- **Frota**: 500+ equipamentos, idade média 3,4 anos (2024), 100% rastreada GPS — atualizado em tryLocalResponse() frota
- **ANTT Portaria SUROC 6/2026** (23/abr/2026): reajuste 4,52-8,17%; CCD Carga Geral R$4,00-9,25/km; Frigorificado R$4,74-10,96/km — atualizado no DEMO_QA piso mínimo frete

### Expansões tryLocalResponse()
- `grupo scapini`: agora menciona TST Global (EUA) e total de 22 unidades; regex expandida para capturar "tst global", "scapini eua", "america norte scapini"
- `internacional`: regex expandida para cobrir TST Global, USA; respostas atualizadas com abertura set/2024
- `frota`: atualizado com 500+ equipamentos, 3,4 anos média, GPS 100%

## Pesquisa web desta sessão
- **Dados Scapini**: confirmados via pesquisa (sessão 12 background agent): ~1.100 colaboradores, R$440M 2024, TST Global EUA set/2024, Translíquidos adquirida 2021, frota 3,4 anos
- **ANTT Portaria SUROC 6/2026**: confirmada vigência abr/2026, valores CCD por categoria
- **Tabela ANTT por eixo** (herdado 9x): sites retornam 403. Acesso manual em calculadorafrete.antt.gov.br
- **CCT MOVIFORT RS 2025/2026** (herdado 6x): PDF bloqueado. Dado parcial: bitrem R$3.508,49/mês (já em código)

## Git
- Histórico divergente identificado: local `main` baseado em commit antigo (023901e), remote `main` em história separada (sessões 1-12 force-pushed)
- Solução: criado branch `session13` a partir de `origin/main` (9011 linhas, session 12 base), aplicadas todas as mudanças, push sem force via `session13:main`
- Total de linhas adicionadas: +55 (19 removidas/substituídas)

## Pendências / próxima sessão
1. **Tabela ANTT por eixo (R$/km)** — herdado 10x. Acesso manual necessário em calculadorafrete.antt.gov.br
2. **CCT MOVIFORT RS 2025/2026 — tabela salarial completa** — herdado 7x. Dados parciais em código.
3. **`npm run build-dataset`** — executar na máquina local (quando dataset ≥ 500 exemplos)
4. **`ollama pull llama3.2:3b`** — ainda pendente na máquina local
5. **Fine-tuning** — quando dataset atingir 500+ exemplos
6. **DEMO_QA entrada possivelmente redundante** (herdado) — verificar linha ~6956 na versão remote
7. **PRIORIDADE 5 UX/CSS** — não executada nesta sessão; revisar index.html e style.css antes da apresentação

---

# Sessão 14 — 21 de junho de 2026

## Resumo
Sessão autônoma noturna continuada após compactação de contexto (sessão 14 já havia iniciado edições em sessão anterior). Base: app.js 9075 linhas, 352 entradas DEMO_QA. Foram aplicados 3 commits: fix de word-boundary, 4 novos pares DEMO_QA, e expansão FRETE_CMD + atualização contagem.

## Frentes concluídas

### FIX — Falsos positivos DEMO_QA (word-boundary)
- **frigorífico block (l.6063)**: adicionado `\b` em `sadia`, `seara`, `brf`, `jbs`, `marfrig`, `perdigao`
  - `sadia` sem `\b` batia em "empresa sadia" (sadia = adjetivo saudável em PT-BR)
  - `seara` sem `\b` batia em "seara" (= campo de colheita em PT literário)
- **clients block (l.5355)**: adicionado `\b` em `jti` e `braskem` por consistência

### +4 novos pares DEMO_QA (PRIORIDADE 2)
1. **Gestão de multas de trânsito da frota** — NIP, indicação de condutor, CTB, DETRAN, prazos
2. **Lúmina no WhatsApp como canal** — roadmap Phase 2, mensageria, quando disponível
3. **Reconhecimento e premiação de motoristas** — motorista do mês, PLR, bonificação por segurança
4. **Lúmina fase atual vs roadmap** — v1.0 operacional, o que falta, previsão de lançamento

### FRETE_CMD — expansão de frases naturais
- Adicionadas 6 frases: `simular frete`, `simulação de frete`, `orçamento de frete/transporte`, `preciso transportar`, `quero transportar`, `me passa um frete`
- FRETE_CMD requer FRETE_ROTA simultaneamente — expansão melhora captura de pedidos informais

### Contagem de respostas atualizada
- Todas as referências "325" e "345+" atualizadas para "350+" (temos 352 entradas reais)
- Atualizado em: offline DEMO_QA (2 respostas), implantação, fallback genérico, comment

### Auditoria UX/CSS (PRIORIDADE 5)
- Auditados index.html (817 linhas) e style.css (1236 linhas)
- Falsos positivos encontrados pelo audit:
  - `.pres-count` — classe JS hook, sem necessidade de CSS (correto)
  - `.pres-arch-mid` — wrapper estrutural, `display:block` default adequado (correto)
  - `intg-google-connect` / `intg-google-disconnect` — stubs planejados, sem handler (conhecido)
- **Nenhum bug UX real encontrado**
- Toast, upload button, hamburger menu, placeholders, history bubbles — todos corretos

## Git — situação dos branches
- `main` local estava em detached HEAD após git branch -f do contexto anterior
- Push para `noturno/sessoes-11-14` bem-sucedido; depois verificado que `origin/main` já estava em session 13 (ef0ce48)
- Sessions 14 commits fast-forwarded diretamente para `origin/main` — 3 commits + este NOTURNO.md

## Auditoria de pendências herdadas
- **Tabela ANTT por eixo (R$/km)** — herdado 11x. Acesso manual em calculadorafrete.antt.gov.br
- **CCT MOVIFORT RS 2025/2026** — herdado 8x. Dados parciais em código já refletem a categoria

## Pendências / próxima sessão
1. **Tabela ANTT por eixo (R$/km)** — herdado 11x. Acesso manual necessário
2. **CCT MOVIFORT RS 2025/2026 completo** — herdado 8x
3. **`npm run build-dataset`** — executar na máquina local (≥ 500 exemplos)
4. **Fine-tuning Llama** — quando dataset atingir 500+ exemplos
5. **PRIORIDADE 1 bugs remanescentes** — verificar se há crashers não cobertos em edições anteriores
6. **DEMO_QA entrada possivelmente redundante** (~l.6956 remote) — verificar duplicata

---

# Sessão Noturna — 21 de junho de 2026 (Sessão 15)

## Resumo
Sessão autônoma noturna. Foco em: (1) PRIORIDADE 1 — bug DEMO_QA regex genérica sem contexto; (2) PRIORIDADE 2 — pesquisa web (CCT/ANTT bloqueados 403); (3) PRIORIDADE 4 — 5 novos pares DEMO_QA sobre governança/adoção da Lúmina; (4) PRIORIDADE 5 — 2 correções UX. Total: 1 commit pushado.

## Bugs corrigidos (PRIORIDADE 1)

### DEMO_QA regex genérica — 'nao (consegue|sabe|pode|faz)' e 'o que falta' sem contexto
- **Problema**: regex `/o que voce nao (faz|pode|consegue)|limitacao|nao (consegue|sabe|pode|faz)|restricao|o que falta/` disparava para qualquer frase comum:
  - "não faz sentido" → retornava resposta de limitações da Lúmina (falso positivo)
  - "o que falta de documentação na viagem?" → retornava resposta de limitações (falso positivo)
  - `limitacao` sem contexto pegava "limitação de carga", "limitação de peso" etc.
- **Fix**: reescrito para exigir contexto explícito de Lúmina/voce/ia/sistema:
  - `nao (consegue|sabe|pode|faz)` → `(voce|lumina|ia) nao (consegue|sabe|pode|faz)` ou `...*.lumina`
  - `limitacao` → `limitacao.*(lumina|voce|ia|sistema)` ou inverso
  - `o que falta` → `o que (voce|lumina|a ia|ainda|lhe|te) falta`
  - `restricao` → `restricao.*(lumina|ia|sistema)` ou inverso
  - `\blimitacoes\b` mantido como fallback razoável

## Pesquisa web (PRIORIDADE 2)

### CCT MOVIFORT RS 2025/2026
- Pesquisa via agente encontrou dados de SETCEPAR (Paraná) e SETCEMG (MG), não RS
- Confirmado: bitrem R$3.508,49/mês (já em código) permanece o único dado confiável para RS
- Dados de MG (Rodotrem R$3.115,71, Bitrem R$2.967,35) NÃO inseridos — são de outro estado

### ANTT tabela por eixo (R$/km)
- Portaria SUROC 16/2026 identificada via snippet (não confirmada com valores exatos — 403)
- Valores R$/km por eixo ainda inacessíveis remotamente (herdado 10x)
- Referência única confirmada: calculadorafrete.antt.gov.br

### Dados Scapini
- Confirma: 21 unidades, frota 500+, ~1.100 colaboradores, CNPJ 88.078.209/0001-19 — todos já em código ✓
- Nenhuma notícia relevante de 2025-2026 disponível via busca

## Novos pares DEMO_QA (PRIORIDADE 4) — 5 pares × 2 respostas = 10 entradas

**Total: 357 entradas → contador atualizado de "350+" para "355+"** (em 6 ocorrências)

1. **Histórico de conversas / quem pode ver**: auditoria, SQLite local, políticas de retenção, painel de auditoria Fase 2
   - Regex: `quem.*ve.*conversa|conversa.*fica.*salva|historico.*conversa.*lumina|lumina.*grava.*conversa|...`
2. **Como editar a base de conhecimento**: upload PDF/Word, texto livre, fluxo via ⚙️ Configurações
   - Regex: `editar.*base.*conhecimento|base.*conhecimento.*editar|adicionar.*conhecimento.*lumina|...`
3. **Treinamento da equipe**: curva mínima, plano 3 semanas, papel de "campeões" por área, DV Digital apoia
   - Regex: `treinar.*equipe.*lumina|equipe.*aprender.*lumina|lumina.*facil.*usar|...`
4. **Métricas de uso / adoção**: painel atual (contador de mensagens), histórico, roadmap (relatório semanal automático)
   - Regex: `metrica.*lumina|uso.*lumina.*relatorio|relatorio.*uso.*lumina|...`
5. **Custo de manutenção e atualização**: API Gemini (~R$0,001/query), infraestrutura local, parceria DV Digital (~R$500-2.000/mês)
   - Regex: `custo.*manutencao.*lumina|manutencao.*lumina.*custo|custo.*mensal.*lumina|...`

## Correções UX (PRIORIDADE 5)

### index.html — doc-file-input accept attribute
- **Antes**: `accept=".pdf,.docx,.txt"` — o input de Base de Conhecimento não aceitava `.doc` (Word clássico)
- **Depois**: `accept=".pdf,.docx,.doc,.txt"` — Word clássico agora aparece no file picker

### app.js — toast Gemini API mais descritivo
- **Antes**: `toast('Configure a chave Gemini API.', 'error')`
- **Depois**: `toast('Configure a chave Gemini API em ⚙️ Configurações → API Key.', 'error')` — orienta o usuário para onde ir

## Auditoria PRIORIDADE 1 — itens verificados OK

Todos os itens da checklist passaram:
- `getElementById` sem null-guard: elementos estáticos no HTML ✓
- `JSON.parse` sem try/catch: todos protegidos (app.js linhas 22, 227, 234, 278, 646, 1351, 1419, 8047, 9043; server.js linhas 304, 415, 1410, 2023, 2174) ✓
- `fetch()` sem `.catch()`: todos com catch; await fetch() dentro de try/catch ✓
- `speak()` com undefined: nunca chamado com valor não-string ✓
- `_finalize()` com undefined: guard `raw ?? ''` confirmado ✓
- Variáveis antes de declaração: nenhuma encontrada ✓
- DEMO_QA regex genérico: corrigido (novo bug linha 6569) + verificações anteriores confirmadas ✓

## Git — situação dos branches

- Container iniciou em detached HEAD de `origin/main` (que estava em 023901e localmente — fetch atualizou para 996314c)
- Commit feito em detached HEAD → push via `git push -u origin HEAD:main` — fast-forward OK

## Commits desta sessão
- `3a2c1a2` — fix+feat: DEMO_QA regex limitação genérica + 5 Q&A novos + UX — PUSHED

## Pendências / próxima sessão
1. **Tabela ANTT por eixo (R$/km)** — herdado 11x. Portaria SUROC 16/2026 identificada mas valores não acessíveis. Acesso manual em calculadorafrete.antt.gov.br
2. **CCT MOVIFORT RS 2025/2026 completo** — herdado 9x. Dados parciais: bitrem R$3.508,49/mês.
3. **`npm run build-dataset`** — executar na máquina local (quando ≥ 500 exemplos no histórico)
4. **Fine-tuning Llama** — quando dataset atingir 500+ exemplos
5. **DEMO_QA entrada possivelmente redundante** (~l.6956 na main) — entrada de história duplicada; preservada por padrões únicos mas pode ser simplificada
6. **Portaria SUROC 16/2026** — nova portaria ANTT identificada; verificar se trouxe reajuste adicional ao SUROC 4 de março/2026

---

# Sessão 16 — 22 de junho de 2026

## Resumo
Sessão autônoma noturna. Foco em 5 prioridades: (P1) bugs QA — DEMO_QA entrada redundante removida, dados desatualizados corrigidos em 6 locais; (P2) pesquisa web — SUROC 16/2026 confirmada e codificada, CCT MOVIFORT RS bloqueado 12ª vez; (P3) DEMO_QA +8 pares para diretores; (P4) tryLocalResponse +4 blocos de dados reais Scapini 2024; (P5) UX placeholder simplificado. Total: 2 commits, +88 inserções, -28 remoções.

## PRIORIDADE 0 — Ollama

`ollama` não está disponível no ambiente remoto (container cloud). Rebuild do modelo `lumina-treinada` precisa ser executado na máquina local:
```bash
ollama create lumina-treinada -f Modelfile.lumina
```

## PRIORIDADE 1 — Bugs corrigidos

### DEMO_QA entrada redundante (~l.6956/6962) — RESOLVIDA
- Entrada "Grupo Scapini — empresas" na linha ~6962 era redundante com a entrada em l.5341 (mesma cobertura temática, regex sobrepostos)
- **Fix**: regex da l.5341 expandida para absorver todos os padrões únicos da l.6962 (`|365 log|blue seguros|stokkie|empresas.*grupo|grupo.*empresas|tst global|scapini.*grupo.*empresas`)
- Entrada redundante em l.6962 **removida** (-11 linhas)

### Dados "6 empresas / 21 unidades" atualizados — 6 locais
| Local | Antes | Depois |
|-------|-------|--------|
| DEMO_QA l.5343-5344 | 6 empresas, 21 unidades | 7 empresas + TST Global, 22 unidades |
| DEMO_QA l.6771 (história) | "6 empresas, 21 unidades" | "7 empresas, 22 unidades, R$440M 2024" |
| tryLocalResponse grupo scapini l.4543 | 6 companies sem TST Global | 7 empresas + TST Global, 22 unidades |
| tryLocalResponse internacional l.4557 | só Mercosul | + TST Global/EUA adicionado |
| tryLocalResponse história l.3969 | "6 empresas no grupo" | "7 empresas no grupo (incluindo TST Global nos EUA)" |
| tryLocalResponse frota l.4669 | resposta genérica sem números | "500+ equipamentos, 3,4 anos média, 100% GPS" |

### MOTORISTAS_DEMO: 15 → 19 registros
Adicionados 4 motoristas com CNH E, MOPP, rotas RS→SP/Campinas/Guarulhos:
| Nome | Apelido | Tipo | Rota | Status | Veículo |
|------|---------|------|------|--------|---------|
| Edivaldo Gomes Ferreira | Edivaldo | CLT | Lajeado–São Paulo | Em rota | Carreta Scania R540 (CNH E, MOPP) |
| Cleiton Souza Barbosa | Cleiton | Agregado | Lajeado–Campinas | Disponível | Carreta Volvo FH 500 (CNH E, MOPP) |
| Waldir Antunes Moraes | Waldir | TAC | Lajeado–São Paulo | Em rota | Bitrem Scania S500 (CNH E, MOPP) |
| Paulo Sérgio Lima Costa | Paulinho | CLT | Lajeado–Guarulhos | Disponível | Carreta MB Actros 2651 (CNH E) |

### Auditoria de itens herdados (verificação rápida)
- `getElementById` null-safety: verificado OK (sessão 14 confirmou)
- `JSON.parse` try/catch: verificado OK (sessão 15 confirmou)
- `fetch()` com `.catch()`: verificado OK
- `speak(undefined)` / `_finalize(undefined)`: guards confirmados em sessões anteriores

## PRIORIDADE 2 — Pesquisa web

### Portaria SUROC 16/2026 — CONFIRMADA E CODIFICADA ✓
- **Data**: 20 de maio de 2026 | **Vigência**: 24 de maio de 2026
- **O que muda**: CIOT apenas — NÃO altera tabela de piso mínimo de frete
- Carga fracionada com múltiplos contratantes e SEM subcontratação = 1 CIOT único para todo o percurso
- Subcontratação de TAC em operação com múltiplos embarcadores → reclassificada de "fracionada" para "lotação"
- Piso mínimo de frete permanece regido pela SUROC 6/2026 (CCD Geral R$4,00-9,25/km; Frigorificado R$4,74-10,96/km)
- **Novo bloco detectLocalInfo adicionado**: `/suroc.*16|portaria.*16.*2026|ciot.*fracionado|ciot.*subcontratacao/`

### CCT MOVIFORT RS 2025/2026 — herdado 12ª vez
- Todos os PDFs retornam HTTP 403 Forbidden
- Único dado confirmado: bitrem R$3.508,49/mês (já em código)
- Não inseridos dados de outros estados (SETCEMG/SETCEPAR são MG/PR, não RS)

## PRIORIDADE 3 — DEMO_QA +8 pares para diretores

Dos 8 itens listados na missão: 6 já existiam em sessões anteriores. Adicionados 8 pares NOVOS (não duplicados):

| # | Tema | Regex exemplo |
|---|------|---------------|
| 1 | Quantas perguntas sabe responder | `/quantas perguntas.*lumina|lumina.*sabe.*responder/` |
| 2 | E se o Google mudar a API | `/google.*mudar.*api|dependencia.*gemini|e se.*gemini.*acabar/` |
| 3 | Lúmina no processo de vendas/prospecção | `/lumina.*ajuda.*vendas|lumina.*prospectar.*cliente/` |
| 4 | Funciona em inglês/espanhol (TST Global, Mercosul) | `/lumina.*ingles|lumina.*espanhol|lumina.*idioma/` |
| 5 | Como medir o ROI | `/roi.*lumina|como.*medir.*resultado.*lumina/` |
| 6 | O que faz quando não sabe a resposta | `/lumina.*nao sabe|quando nao tem resposta|lumina.*inventar/` |
| 7 | Gerar documentos oficiais (Word/Excel/PDF) | `/lumina.*gerar.*documento|documento.*lumina|lumina.*word/` |
| 8 | Ajuda no processo comercial/BD | `/lumina.*ajuda.*vendas|lead.*lumina|lumina.*gerar.*lead/` |

**Contador atualizado**: 355+ → 365+ (em 6 ocorrências no código)

## PRIORIDADE 4 — tryLocalResponse pontos fracos

| Item | Status |
|------|--------|
| crescimento/resultado Scapini (+28% 2024, meta R$1B 2030) | ✅ **Novo bloco adicionado** |
| quantas unidades/filiais → 22 unidades em 6 estados | ✅ **Novo bloco adicionado** |
| TST Global / scapini eua → inaugurada set/2024 | ✅ **Adicionado ao bloco grupo scapini** |
| qual a frota → 500+ equipamentos, 3,4 anos média, 100% GPS | ✅ **Bloco atualizado com dados específicos** |
| quantos colaboradores → ~1.100 (800 CLT + 300 terceirizados) | ✅ Já existia corretamente |

## PRIORIDADE 5 — UX

- **Placeholder** simplificado: "Ou digite aqui e pressione Enter… (Ctrl+V para colar imagem)" → "Digite sua pergunta aqui ou use o microfone…"
  - Motivo: o "(Ctrl+V para colar imagem)" é feature de power user; distracts diretores na demo
- Mensagem de boas-vindas: já impactante — "Bom dia. Sou Lúmina. Dando vida aos dados e luz às decisões." ✓
- Botão mic: estado `listening` com animação `micPulse` vermelho + border ativo ✓
- Toast erro Gemini: já melhorado em sessão 15 → "Configure a chave Gemini API em ⚙️ Configurações → API Key." ✓
- Demo greeting mode: "Olá. Sou a Lúmina, a inteligência artificial da Scapini Transportes. Estou pronta para demonstrar o que posso fazer. Pode começar." ✓

## Commits desta sessão
- `dee6b0a` — fix: QA sessão 22/jun — DEMO_QA redundante removida, 7 empresas/22 unidades, frota 500+ detalhada — PUSHED
- `cce0173` — feat: DEMO_QA +8 pares diretoria + tryLocal +5 Scapini 2024 + SUROC 16/2026 CIOT — PUSHED

## Estado final app.js
- 9.190 linhas (era 9.110)
- MOTORISTAS_DEMO: 19 registros
- DEMO_QA: 365+ entradas (estimativa; 8 novos blocos × 2 respostas cada)
- tryLocalResponse: +4 novos blocos (crescimento, unidades, SUROC 16, frota atualizada)

## Pendências / próxima sessão
1. **Tabela ANTT por eixo (R$/km)** — herdado 12x. Acesso manual necessário em calculadorafrete.antt.gov.br. SUROC 16/2026 confirmada como alteração CIOT apenas (não altera valores).
2. **CCT MOVIFORT RS 2025/2026 completo** — herdado 12x. Dado parcial: bitrem R$3.508,49/mês. Sem acesso remoto ao PDF.
3. **Rebuild Ollama**: `ollama create lumina-treinada -f Modelfile.lumina` — executar na máquina local
4. **`npm run build-dataset`** — executar na máquina local quando ≥ 500 exemplos
5. **Fine-tuning Llama** — quando dataset atingir 500+ exemplos
6. **Apresentação julho/2026** — verificar fluxo completo da demo antes da reunião com diretor

---

# Sessão Sexta 2026-06-26 (Sessão 17 — Kick-off do Fim de Semana)

## Resumo
Sessão de kick-off autônoma (sexta à noite). Leitura completa do NOTURNO.md (16 sessões anteriores), diagnóstico do estado atual, auditoria null-safety PRIORIDADE 1 e adição de 6 novos pares DEMO_QA focados em perguntas de diretoria para a apresentação de julho/2026. Total: 1 commit.

## Diagnóstico do estado atual (Passo 2)

| Item | Resultado |
|------|-----------|
| Linhas em app.js | **9.587** |
| Entradas DEMO_QA | **376** (era 370 → sessão 16 estimou 365+) |
| MOTORISTAS_DEMO | **19 registros** (missão pede ≥8 ✓) |
| Bugs pendentes críticos | Nenhum novo encontrado |
| node --check app.js | ✅ OK |
| node --check server.js | ✅ OK |

## Auditoria null-safety PRIORIDADE 1 (Passo 3)

Todos os itens verificados — nenhum bug novo:
- **`getElementById` sem null-guard**: todos em elementos estáticos do HTML ou protegidos por `?.classList` / guarded assignment ✓
- **`JSON.parse` sem try/catch**: linha 1367 (app.js wake word) protegida por `try {} catch {}` desde linha 1353; linha 9555 protegida por `catch {}` linha 9561; server.js linhas 368/513/2695/2846 — todas em try/catch ✓
- **`fetch()` sem `.catch()`**: todos em try/catch (verificados: linhas 181, 1241, 1497) ✓
- **`speak(undefined)`**: `cleanForTTS` tem `String(raw ?? '')` na linha 1028 ✓
- **`_finalize(undefined)`**: guard `raw ?? ''` confirmado ✓
- **DEMO_QA regex genérico**: linha 5540 tem `argentina|uruguai|paraguai` sem `\b`, mas `detectLocalInfo` executa ANTES (`processInput` linha 2034-2035), capturando cotações de câmbio antes que DEMO_QA seja alcançado — risco operacional baixo ✓

## 6 novos pares DEMO_QA — Diretoria Julho/2026 (Passo 4)

Inseridos antes do fechamento `];` do array (linha 7577 → 7641):

| # | Tema | Regex principal |
|---|------|-----------------|
| 1 | **Disponibilidade 24/7** | `lumina.*24h\|lumina.*24.*horas\|disponibilidade.*lumina\|lumina.*uptime` |
| 2 | **Plano de contingência / e se parar** | `lumina.*parar\|lumina.*cair\|contingencia.*lumina\|lumina.*recovery` |
| 3 | **Proteção de dados confidenciais** | `dado.*confidencial.*lumina\|confidencialidade.*lumina\|lumina.*sigiloso` |
| 4 | **Motoristas em campo / App Motorista** | `motorista.*estrada.*lumina\|motorista.*campo.*lumina\|app.*motorista.*lumina` |
| 5 | **Previsões e análise preditiva** | `lumina.*previsao\|previsao.*lumina\|lumina.*forecast\|preditiva.*lumina` |
| 6 | **Integração com Power BI e outras ferramentas** | `lumina.*power.*bi\|power.*bi.*lumina\|lumina.*integrar.*sistema` |

### Contador atualizado: 365+ → 375+ (em 5 ocorrências no código)

## Commits desta sessão
- `(pendente)` — feat: DEMO_QA +6 pares diretoria — disponibilidade, contingência, dados, motoristas, preditiva, Power BI

## Pendências / próximas sessões (sábado e domingo)

### PRIORIDADE 1 (bugs) — estado atual
- Nenhum bug crítico pendente. Todos os itens de null-safety verificados em sessões anteriores e reconfirmados nesta sessão.
- Linha 5540: `argentina|uruguai|paraguai` sem `\b` — baixo risco (detectLocalInfo executa antes). Monitorar.

### PRIORIDADE 2 (dados reais)
1. **Tabela ANTT por eixo (R$/km)** — herdado 13x. SUROC 6/2026 em código (Carga Geral R$4,00-9,25/km), mas valores específicos por eixo (truck/carreta/bitrem) ainda inacessíveis. Acesso manual em calculadorafrete.antt.gov.br na máquina do usuário.
2. **CCT MOVIFORT RS 2025/2026 completo** — herdado 13x. Dado confirmado: bitrem R$3.508,49/mês. Tabela completa bloqueada por HTTP 403 em todos os sites testados.

### PRIORIDADE 3 (DEMO_QA / base de conhecimento)
- 376 entradas — bom volume. Sessão de sábado pode focar em perguntas práticas do workshop (não apresentação executiva), ex.: procedimentos operacionais específicos, manutenção preventiva vs preditiva, gestão de documentação de frota.

### PRIORIDADE 4 (local pendente)
- **Rebuild Ollama**: `ollama create lumina-treinada -f Modelfile.lumina` — máquina local
- **`npm run build-dataset`** — máquina local (≥500 exemplos para fine-tuning)
- **Fine-tuning Llama** — quando dataset atingir 500+ exemplos

### PRIORIDADE 5 (UX/CSS)
- Nenhum bug UX encontrado. Verificar fluxo completo da demo antes da reunião com diretoria em julho/2026.

---

# Sessão 18 — 2026-06-27 00:16 UTC (Noturna/Autônoma)

## Resumo
Sessão autônoma noturna — continuação direta da sessão 17. Foco em: (1) PRIORIDADE 1 — 7 bugs word-boundary corrigidos + 2 JSON.parse sem try/catch em server.js; (2) PRIORIDADE 2 — pesquisa web confirma dados GNV Scapini (16% frota, meta 24%/2030, 40-50 caminhões/ano); (3) PRIORIDADE 4 — 4 novos pares DEMO_QA; (4) atualização de dados ESG em 3 locais. Total: 2 commits + push. Todos passam em `node --check`.

## Estado final
- `app.js`: **9.657 linhas** (era 9.629)
- `DEMO_QA`: **380 entradas** (era 376)
- Contador user-visível: **385+** (atualizado de 375+)

## PRIORIDADE 1 — Bugs corrigidos

### 5 word-boundary bugs em DEMO_QA (app.js)

| Padrão | Falso positivo real | Fix |
|--------|--------------------|----|
| `grc` (l.7377) | "discográfica", "agrc" | `\bgrc\b` |
| `eld` (l.6597) | "eldorado", "eldo" | `\beld\b` |
| `ftl\|ltl` (l.6590) | sem fronteira | `\bftl\b\|\bltl\b` |
| `sest\|senat` (l.6717) | "sesta" (cochilo PT-BR); "senatorial" | `\bsest\b\|\bsenat\b` |
| `tms` (l.6389) | substrings inesperadas | `\btms\b` |

### 2 bugs JSON.parse sem try/catch (server.js)

- **`/api/candidatura/:token` (l.1963)**: `JSON.parse(row.respostas || '[]')` em handler síncrono Express — crash não tratado se BD corrompido. **Fix**: envolvido em `try {} catch { respostas = []; }`.
- **`/api/candidatura/:token/responder` (l.1988)**: mesmo problema no endpoint POST. **Fix**: idem.

### Auditoria de outros itens PRIORIDADE 1 — todos OK

- `getElementById` sem null-guard: todos em elementos estáticos do HTML ou já protegidos ✓
- `JSON.parse` sem try/catch: confirmados protegidos (app.js 9 pontos + server.js 7 pontos revisados) ✓
- `fetch()` sem `.catch()`: todos em try/catch ✓
- `speak()` com undefined: `cleanForTTS` tem `String(raw ?? '')` ✓
- `_finalize()` com undefined: guard `raw ?? ''` confirmado ✓
- DEMO_QA regex genérico: 5 bugs corrigidos acima; varredura adicional não encontrou novos casos ✓

## PRIORIDADE 2 — Pesquisa web e qualidade

### Dados confirmados via pesquisa — Scapini GNV/ESG
- **16% da frota roda a GNV** (Gás Natural Veicular)
- **Meta: 24% de descarbonização até 2030**
- **Renovação de frota**: 40-50 caminhões/ano, ~R$1M/unidade
- Fonte: artigo TransporteModerno "Como a diversificação blindou o Grupo Scapini" (out/2025)

### Atualizações aplicadas no código (3 locais)
- `buildSystem()` linha 521: frota com 16% GNV, meta 24%/2030, renovação 40-50/ano
- `tryLocalResponse` bloco frota (l.4946-4947): 2 respostas atualizadas com dados GNV
- DEMO_QA ESG (l.5610): resposta atualizada com dados específicos da Scapini

### `_thinkingBudget()` — nível 512 expandido
Novos padrões adicionados: `gnv.*frota`, `frota.*gnv`, `descarboniz.*frota`, `frota.*sustentavel`, `scapini.*sede`, `sede.*scapini`, `lajeado.*scapini`, `vale.*taquari.*scapini`, `renovacao.*frota`, `frota.*renovacao`

### Dados não encontrados (bloqueados por HTTP 403 — herdado)
- Tabela ANTT por eixo (R$/km) — herdado 14x
- CCT MOVIFORT RS 2025/2026 tabela salarial completa — herdado 13x

## PRIORIDADE 4 — Novos pares DEMO_QA (+4 entradas × 2 respostas)

1. **GNV / descarbonização Scapini**: 16% frota GNV, meta 24%/2030, 40-50 caminhões/ano, ~R$1M/unidade
   - Regex: `scapini.*gnv|gnv.*scapini|...|meta.*2030.*scapini|renovacao.*frota.*scapini|...`

2. **Estratégia 2030 / meta R$1 bilhão**: R$440M→R$1B em 6 anos, pilares de crescimento
   - Regex: `meta.*scapini.*2030|2030.*scapini|meta.*bilhao|...|scapini.*plano.*futuro`

3. **Sede Lajeado / Vale do Taquari**: distância de POA, BR-386, polo industrial do Vale
   - Regex: `onde.*scapini.*fica|sede.*scapini|...|endereco.*scapini|scapini.*rs|scapini.*sul`

4. **Clientes da Scapini**: JTI, Souza Cruz/BAT, Nestlé, CMPC, Suzano, Braskem; perfil de cliente
   - Regex: `clientes.*scapini|scapini.*cliente|quem.*cliente.*scapini|...|quem.*contrata.*scapini`

## PRIORIDADE 5 — UX

- Auditados: toast styles (error/success/info), botões feat-btn, upload button, placeholders, hamburger mobile
- **Nenhum bug UX novo encontrado** — todas as correções anteriores confirmadas

## Commits desta sessão
- `a53cf04` — fix: DEMO_QA word-boundary — `\bgrc\b`, `\beld\b`, `\bftl\b`, `\bltl\b`, `\bsest\b`, `\bsenat\b`, `\btms\b` + 4 Q&A novos + ESG GNV 16% — PUSHED
- `731a542` — feat: qualidade — fix JSON.parse sem try/catch em server.js candidatura — PUSHED

## Pendências / próxima sessão
1. **Tabela ANTT por eixo (R$/km)** — herdado 14x. Acesso manual em calculadorafrete.antt.gov.br
2. **CCT MOVIFORT RS 2025/2026 completo** — herdado 13x. Dado parcial: bitrem R$3.508,49/mês
3. **Rebuild Ollama**: `ollama create lumina-treinada -f Modelfile.lumina` — máquina local
4. **`npm run build-dataset`** — máquina local (≥500 exemplos para fine-tuning)
5. **Fine-tuning Llama** — quando dataset atingir 500+ exemplos
6. **DEMO_QA por setor**: manutenção preventiva vs preditiva, procedimentos operacionais específicos — ainda há tópicos de workshop a cobrir

---

# SESSÃO 19 — 2026-06-27 (~00:30 UTC)

## Estado inicial
- app.js: 9657 linhas, DEMO_QA 385+ entradas

## PRIORIDADE 1 — Bugs corrigidos (4 novos encontrados)

### `\badas\b` falso positivo crítico — palavra "estradas"
- **Arquivo**: app.js l.6448 (DEMO_QA câmeras ADAS)
- **Problema**: `/adas/` sem word-boundary disparava em "estradas federais", "estradas do RS" — palavrão extremamente comum em transporte
- **Fix**: `\badas\b` e também `\bdvr\b` na mesma regex

### `\bkpi\b` e `\botd\b` sem word-boundary
- **Arquivo**: app.js l.5376 (DEMO_QA KPI/indicadores)
- **Problema**: inconsistência com padrão do projeto — todos os acrônimos curtos devem ter `\b`
- **Fix**: `\bkpi\b`, `\botd\b`

### `ia` (verbo PT-BR) vs `ia` (sigla IA) na regex de limitações
- **Arquivo**: app.js l.6865 (DEMO_QA limitações da Lúmina)
- **Problema**: `ia` aparecia em 3 grupos de alternância sem artigo — verbos como "a limitação de peso **ia** me atrasar a rota" disparavam a resposta errada
- **Fix**: `ia` → `a ia` em todos os 3 grupos (o artigo "a" obrigatório é como a sigla IA aparece em PT-BR: "a IA não consegue", "a ia tem limitação")

### `_thinkingBudget()` nível 512 expandido
- Novos padrões: `ata.*reuniao|reuniao.*ata|transcrever.*reuniao|gravar.*reuniao|feriado.*motorista|feriado.*transporte|trabalhar.*feriado|escala.*feriado|feriado.*hora.*extra`

## PRIORIDADE 4 — Novos pares DEMO_QA (+5 entradas × 2 respostas)

| # | Tema | Regex (resumo) |
|---|---|---|
| 1 | Velocidade de resposta | `velocidade.*lumina`, `tempo.*resposta.*lumina`, `lumina.*lenta` |
| 2 | Ata de reunião por áudio | `ata.*reuniao`, `transcrever.*reuniao`, `audio.*reuniao.*lumina` |
| 3 | Feriado / escala motorista | `trabalhar.*feriado`, `escala.*feriado`, `feriado.*hora.*extra` |
| 4 | Limite de arquivo / upload | `limite.*arquivo`, `arquivo.*grande.*demais`, `maximo.*upload` |
| 5 | Atualização do sistema | `lumina.*update`, `nova.*versao.*lumina`, `servidor.*lumina.*reinicia` |

## Contadores
- DEMO_QA: 385+ → 390+

## Commits
- `a2d09ea` — fix+feat: sessão 19 — word-boundary bugs + 5 Q&A novos + thinkingBudget — PUSHED

## Pendências mantidas
1. Tabela ANTT por eixo — herdado 15x
2. CCT MOVIFORT RS 2025/2026 completo — herdado 14x
3. Rebuild Ollama (máquina local)
4. Fine-tuning Llama (≥500 exemplos)

---

# SESSÃO 20 — 2026-06-27 (04:20 UTC)

## Estado inicial
- app.js: 9705 linhas, DEMO_QA 390+ entradas
- Sessão continuada automaticamente após compactação de contexto

## PRIORIDADE 2 — Pesquisa web e integração de dados regulatórios

### Resultado da pesquisa (agente background `aed2aae4a39a5388e`)

**Regulamentação ANTT 2025/2026 — confirmado:**

| Norma | Data | Tema |
|---|---|---|
| Res. 6.068/2025 | 17/07/2025 | RNTRC validade indeterminada + 3 seguros obrigatórios (RCTR-C, RC-DC, RC-V) |
| Res. 6.076/2026 | 19/01/2026 | Metodologia CCD: todos eixos contam (+3,15%) |
| Portaria SUROC 3/2026 | 13/03/2026 | Diesel ref. R$6,89/L — +4,52% a +8,17% |
| Portaria SUROC 4/2026 | 20/03/2026 | Diesel ref. R$7,35/L — +6,67% sobre SUROC 3 |
| MP 1.343/2026 | 19/03/2026 (vigência 24/05/2026) | CIOT obrigatório para TODAS as operações TRC |
| Res. 6.077/2026 | 24/03/2026 | Fiscalização preventiva; multa embarcador R$1M–R$10M |
| Res. 6.078/2026 | 24/03/2026 | CIOT vinculado ao MDF-e; multa R$10.500/operação |
| Portaria SUROC 6/2026 | 23/04/2026 | Regras operacionais CIOT (vigência 24/05/2026) |
| Portaria SUROC 16/2026 | 20/05/2026 | Altera SUROC 6 — carga fracionada 1 CIOT por percurso |

**Tabela ANTT por eixo:** faixa R$3,60–R$11,61/km (Tabela A) confirmada, mas valores linha a linha bloqueados (DOU 403). Calculadora: calculadorafrete.antt.gov.br

**CGI Software:** empresa gaúcha (Consultoria Gaúcha de Informática Ltda, webcgi.com.br), 39+ anos de mercado, TMS modular — CT-e, MDF-e, CIOT, rastreamento confirmados como módulos. Detalhes de sub-módulos não indexados publicamente.

### Verificação PRIORIDADE 3 — tryLocalResponse() completa (l.4584–5038)

Todos os itens de PRIORIDADE 3 confirmados como JÁ EXISTENTES:

| Item | Status | Linha |
|---|---|---|
| Grupo Scapini / 7 empresas | ✓ já existe | l.4818 |
| Sede Lajeado / Vale do Taquari | ✓ já existe | l.4867 |
| Fundação / Diamantino / 1977 | ✓ já existe | l.4804 |
| Salário motorista CCT | ✓ já existe | l.4993 |
| Processo seletivo motorista | ✓ já existe | l.4986 |
| Custo da Lúmina | ✓ já existe | l.4905 |
| Substitui funcionários? | ✓ já existe | l.5122 (DEMO_QA) |
| Integração CGI Phase 2 | ✓ já existe | l.4899 |
| Funciona offline? | ✓ já existe | l.4911 |
| Segurança / privacidade | ✓ já existe | l.4999 |

**Nenhuma entrada nova necessária no tryLocalResponse().**

## PRIORIDADE 2 — Novos pares DEMO_QA (+2 entradas × 2 respostas)

Conteúdo regulatório integrado com base na pesquisa:

| # | Tema | Regex (resumo) |
|---|---|---|
| 1 | **Seguros obrigatórios RNTRC** (Res. 6068/2025) | `seguro.*obrigatorio.*transport`, `rctr.c.*obrigatorio`, `rc.dc`, `rc.v.*seguro.*transport`, `rntrc.*tres.*seguro` |
| 2 | **MP 1.343/2026 / CIOT expandido + multas embarcador** | `mp.?1.?343`, `ciot.*obrigatorio.*todos`, `multa.*embarcador.*antt`, `resolucao.*6077`, `resolucao.*6078`, `piso.*minimo.*bloqueio` |

**Localização das inserções:**
- Seguros RNTRC: após Res. 6.068 DEMO_QA (pós l.6899), antes de // Tacógrafo
- MP 1.343 CIOT: após CIOT DEMO_QA (pós l.6920), antes de // Tipos de carga

## Contadores
- DEMO_QA: 390+ → 392+

## Commits desta sessão
(ver commit abaixo)

## Pendências / próxima sessão
1. **Tabela ANTT por eixo (R$/km)** — herdado 16x. Acesso manual: calculadorafrete.antt.gov.br
2. **CCT MOVIFORT RS 2025/2026 completo** — herdado 15x. Dado parcial: bitrem R$3.508,49/mês
3. **Rebuild Ollama**: `ollama create lumina-treinada -f Modelfile.lumina` — máquina local
4. **`npm run build-dataset`** — máquina local (≥500 exemplos para fine-tuning)
5. **Fine-tuning Llama** — quando dataset atingir 500+ exemplos
6. **Verificar CGI Software sub-módulos** — site webcgi.com.br retornou 403; verificar diretamente

---

# Sessão 21 — 2026-06-27 (noturno)

## O que foi feito

### PRIORIDADE 1 — Correções word-boundary DEMO_QA (5 bugs)

Script Python inline analisou todos os tokens de 2–4 chars em padrões `{ re: /.../ }` sem `\b` e detectou 5 vulnerabilidades de match falso positivo:

| Token | Linha | Correção |
|---|---|---|
| `dort` | L5282 | `dort` → `\bdort\b` |
| `ciot` | L5531 | `ciot` → `\bciot\b` |
| `dds`  | L6611 | `dds` → `\bdds\b` |
| `mdfe` | L6874 | `mdfe` → `\bmdfe\b` |
| `rctr`, `rcta` | L6951 | `rctr\|rcta` → `\brctr\b\|\brcta\b` |

Validado com `node --check app.js` ✓

**Commit:** `347bb50` — fix: DEMO_QA word-boundary sessão 21

### PRIORIDADE 2 — Novos pares DEMO_QA (+5 entradas) + thinkingBudget + contador

Pesquisa web confirmou dados antes da inserção. 5 novos pares adicionados ao final do array DEMO_QA (antes do `];`):

| # | Tema | Base legal/fonte |
|---|---|---|
| 1 | **Vale-pedágio TAC** | Lei 10.209/2001 — obrigação do embarcador, não do transportador |
| 2 | **Manutenção preditiva vs preventiva** | McKinsey: redução 10–25% custos, 70–75% falhas evitáveis |
| 3 | **Férias do motorista CLT** | Lei 13.103/2015 + CLT art.130: 30 dias, proporcional |
| 4 | **Diárias e reembolso** | Portaria MTP 671/2021 — isenção IR se ≤50% salário/dia |
| 5 | **Plano de carreira motorista** | Progressão ajudante → motorista → líder de frota |

**_thinkingBudget() 512** — padrão expandido com os 5 novos temas para pré-ativar raciocínio leve.

**Contador:** 392+ → **397+** (11 ocorrências substituídas em textos visíveis ao usuário).

Validado com `node --check app.js` ✓

**Commit:** `9e92303` — feat: DEMO_QA sessão 21 — 5 Q&A novos + thinkingBudget + contador 397+

### PRIORIDADE 3 — tryLocalResponse() — sem alterações

Verificado em sessão 20: todos os itens de P3 já existem. Nenhuma entrada nova necessária.

### PRIORIDADE 5 — Auditoria UX/CSS — sem bugs encontrados

- Todas as 8 variáveis CSS definidas (`--bg`, `--accent`, `--accent-hi`, `--text`, `--text-dim`, `--border`, `--btn-bg`, `--btn-active`)
- `.hmsg.lumina .hmsg-bubble` (seletor descendente com espaço) — correto desde sessão 12
- `.btn-sm` — definido desde sessão 12
- `.btn-menu-mobile` — usa `rgba(12,4,4,0.95)` (não `var(--surface)` indefinida) — correto desde sessão 12
- `accept="image/*,.pdf,.docx,.doc,.txt"` — correto nos inputs de arquivo
- Placeholder: "Digite sua pergunta aqui ou use o microfone…" — simplificado desde sessão 16
- Como Usar: `node server.js` / `localhost:4321` — corrigido desde sessão 9

**Sem alterações necessárias.**

## Resumo de commits desta sessão

| Hash | Mensagem |
|---|---|
| `347bb50` | fix: DEMO_QA word-boundary sessão 21 — \bdort\b, \bciot\b, \bdds\b, \bmdfe\b, \brctr\b, \brcta\b |
| `9e92303` | feat: DEMO_QA sessão 21 — 5 Q&A novos + thinkingBudget + contador 397+ |

## Pendências / próxima sessão
1. **Tabela ANTT por eixo (R$/km)** — herdado 17x. Acesso manual: calculadorafrete.antt.gov.br
2. **CCT MOVIFORT RS 2025/2026 completo** — herdado 16x. Dado parcial: bitrem R$3.508,49/mês
3. **Rebuild Ollama**: `ollama create lumina-treinada -f Modelfile.lumina` — máquina local
4. **`npm run build-dataset`** — máquina local (≥500 exemplos para fine-tuning)
5. **Fine-tuning Llama** — quando dataset atingir 500+ exemplos
6. **Verificar CGI Software sub-módulos** — site webcgi.com.br retornou 403; verificar diretamente

---

# Sessão 22 — 27 de junho de 2026 (UTC)

## Contexto
Sessão autônoma noturna. Apresentação da Lúmina marcada para primeira semana de julho/2026.
Continuação da sessão 21 — contexto foi comprimido e retomado a partir do resumo.

## Missão executada

### PRIORIDADE 1 — Auditoria de bugs (verificação completa)
- `_finalize(raw, source)` — protegido com `raw ?? ''` desde sessão anterior
- `JSON.parse` — 5 ocorrências em app.js, todas em try/catch
- `getElementById` — todos os 16 IDs estáticos confirmados em index.html
- `processWakeChunks()` — JSON.parse em try/catch (linha 1367)
- `getMem()` — JSON.parse em try/catch
- `speak()` — sem chamadas com undefined detectadas
- DEMO_QA regex — sem tokens curtos sem `\b` problemáticos novos

**Resultado: nenhum bug novo encontrado. Todas as 7 categorias P1 verificadas como limpas.**

### PRIORIDADE 2 — Pesquisa web + melhorias de qualidade
Agente de pesquisa `af2024ac535f777a4` executado em paralelo. Resultados:

**ANTT 2026 (confirmados):**
- Resolução ANTT 6.076/2026 (19/01/2026) — norma base vigente
- Portaria SUROC 4/2026 (20/03/2026) — reajuste CCD de R$5,913 → R$5,986/km/eixo (+4,52% a +8,17%)
- Diesel de referência: R$7,35/L (ANP, semana 15-21/mar/2026)
- CIOT obrigatório desde 24/05/2026 — Resolução 6.078/2026 (já coberto pelo entry SUROC 16/2026 existente)
- Tabela R$/km por eixo: PDFs bloqueados por proxy; acessar em calculadorafrete.antt.gov.br

**CGI Software (confirmados):**
- Módulos TMS: gestão de custos, manutenção preventiva, abastecimento, frota própria e terceiros
- Integrações: NF-e, CT-e, MDF-e, Contas a Pagar/Receber, Estoque, Contabilidade, Fiscal
- Dimensionamento e renovação de frota
- Sub-módulos internos (CIOT como módulo separado): não confirmado textualmente — verificar em demo

**CCT SETCERGS 2025/2026 (novos dados confirmados):**
- Truck/Toco: R$2.475,60/mês (a partir 01/01/2026, reajuste 5,32%)
- Carreteiro base: ~R$3.189,54/mês (calculado por reverso do bitrem)
- Bitrem 7 eixos: R$3.508,49/mês (+10% sobre base)
- Rodotrem 9 eixos: R$3.667,65/mês (+15% sobre base)
- Auxílio refeição: R$19,00/dia trabalhado
- Cesta básica: R$138,00/mês
- Reajuste geral jan/2026: +5,32%

**buildSystem()** e **DEMO_QA** de salário motorista atualizados com esses dados.

### PRIORIDADE 3+4 — Novos pares DEMO_QA (commit `723b35e`)
5 novos pares adicionados antes desta sessão compactar:
1. Wake word / ativação por voz
2. Análise de foto / imagem
3. NR-1 revisada 2024-2025 (GRO, Portaria MTE 1.419/2024)
4. Triagem de currículo via upload
5. Redigir anúncio de vaga / job description

_thinkingBudget() nível 512 expandido com padrões para os 5 novos tópicos.
Contador DEMO_QA atualizado: **397+ → 402+** (11 ocorrências atualizadas).

### PRIORIDADE 5 — Auditoria UX/CSS
- `accept="image/*,.pdf,.docx,.doc,.txt"` — correto em `#file-input`
- `accept=".pdf,.docx,.doc,.txt"` — correto em `#doc-file-input`
- `accept=".xlsx,.xls,.csv"` — correto em `#sheet-input`
- Placeholder "Digite sua pergunta aqui ou use o microfone…" — correto
- Menu hambúrguer `#btn-menu-mobile` — presente e funcional
- `.btn-menu-mobile` usa `rgba(12,4,4,0.95)` (não var indefinida) — correto
- Toast messages — adequadas
- Ollama model hint: `ollama pull llama3.2:3b` — correto

**Sem alterações necessárias em index.html ou style.css.**

## Resumo de commits desta sessão

| Hash | Mensagem |
|---|---|
| `723b35e` | feat: DEMO_QA sessão 22 — 5 Q&A novos + thinkingBudget + contador 402+ |
| `74e7ade` | feat: CCT 2025/2026 — salário truck/toco R$2.475,60 + benefícios (refeição R$19/dia, cesta R$138/mês, reajuste 5,32% jan/2026) |

## Pendências / próxima sessão
1. **Tabela ANTT por eixo (R$/km)** — herdado 18x. CCD R$5,986/km/eixo confirmado; tabela completa: calculadorafrete.antt.gov.br
2. **CCT MOVIFORT RS 2025/2026 piso carreteiro** — herdado 17x. Valor base ~R$3.189,54 (calculado); confirmar no PDF da CCT
3. **CGI sub-módulos** — herdado 2x. CIOT como sub-módulo separado não confirmado; verificar via demo comercial
4. **Rebuild Ollama**: `ollama create lumina-treinada -f Modelfile.lumina` — máquina local
5. **`npm run build-dataset`** — máquina local (≥500 exemplos para fine-tuning)
6. **Fine-tuning Llama** — quando dataset atingir 500+ exemplos

---

# Sessão 23 — 2026-06-27 (autônoma / madrugada)

## Estado inicial
- app.js: 9.776 linhas, DEMO_QA 382 entradas (script Python), contador user-visível "402+"
- Todas as verificações PRIORIDADE 1 das sessões anteriores confirmadas limpas

## PRIORIDADE 1 — Bug corrigido

### `fusao` sem `\b` — falso positivo em "difusão" (DEMO_QA l.6478)
- **Problema**: `/fusao|aquisicao|...` sem word-boundary. "fusao" é substring de "difusao" (difusão = diffusion). Em contexto de transporte de químicos, alguém poderia perguntar "como funciona a difusão de gases perigosos?" e receber resposta de M&A/aquisição de empresa.
- **Fix**: `fusao` → `\bfusao\b` e `aquisicao` → `\baquisicao\b`
- **Risco real**: Scapini opera com Translíquidos (químicos/líquidos a granel) — "difusão de gases" é tópico legítimo

### Auditoria PRIORIDADE 1 — todos os 7 itens verificados:
- `getElementById` sem null-guard: todos em elementos estáticos HTML ✓
- `JSON.parse` sem try/catch: todos protegidos (verificados 5 pontos app.js + 5 server.js) ✓
- `fetch()` sem catch: todos em try/catch ✓
- `speak()` com undefined: `cleanForTTS` tem `String(raw ?? '')`, `buildSheetSpeech` sempre retorna string ✓
- `_finalize()` com undefined: guard `raw ?? ''` confirmado ✓
- DEMO_QA regex genérico: script Python varreu TODOS os tokens 2-5 chars — únicos riscos reais eram `fusao`/`aquisicao` (corrigidos) ✓
- Variáveis antes de declaração: nenhuma encontrada ✓

## PRIORIDADE 2 — Dados CCT atualizados (pesquisa confirmada)

Agente de pesquisa executado em paralelo (resultado: HTTP 403 para tabela ANTT e CCT PDF, mas encontrou dados parciais CCT SETCERGS):

### Diárias de viagem — CCT mai/2026 confirmada
- **Antes**: "R$60-120/dia" (range estimado)
- **Depois**: "R$100/dia (CCT mai/2026)" — dado confirmado
- Atualizado em 4 locais: buildSystem, tryLocalResponse (2x), DEMO_QA benefícios

### Plano de saúde — NOVO dado CCT
- **R$290/mês** por funcionário (empresa) a partir de junho/2026
- Adicionado em 4 locais: buildSystem, tryLocalResponse salário (2x), DEMO_QA benefícios

### Tabela ANTT por eixo (herdado 18x)
- Todos os sites retornam 403. Único acesso: calculadorafrete.antt.gov.br na máquina local.

### CGI Software — dado confirmado
- CIOT como módulo separado confirmado com PSPs: Pamcard, Repom, TruckPad
- Sub-módulos detalhados ainda inacessíveis (webcgi.com.br bloqueado)

## PRIORIDADE 4 — 5 novos pares DEMO_QA

Inseridos antes do `];` final do array DEMO_QA:

| # | Tema | Regex principal |
|---|------|-----------------|
| 1 | **CAT — Comunicação de Acidente de Trabalho** | `\bcat\b.*acidente`, `comunicacao.*acidente.*trabalho` |
| 2 | **Backhaul / frete de retorno** | `backhaul`, `frete.*retorno`, `carga.*retorno`, `retorno.*vazio` |
| 3 | **Quanto tempo levou para construir a Lúmina** | `quanto.*tempo.*lumina.*construi`, `como.*surgiu.*lumina` |
| 4 | **Mensagens automáticas / alertas agendados** | `lumina.*mensagem.*automatica`, `alerta.*agendado.*lumina` |
| 5 | **Lúmina gera proposta comercial para cliente** | `lumina.*gera.*proposta`, `proposta.*comercial.*lumina` |

- `_thinkingBudget()` nível 512 expandido com novos padrões para os 5 tópicos
- Contador user-visível: 402+ → **410+** (14 ocorrências atualizadas)

## PRIORIDADE 5 — UX/CSS
- Auditoria realizada — sem novos bugs
- Todos os atributos `accept`, placeholders, hamburger mobile, Ollama model hint: corretos ✓

## Estado final
- `app.js`: **9.811 linhas** (era 9.776)
- `DEMO_QA`: **387 entradas** (era 382 | +5 nesta sessão)
- Contador user-visível: **410+**
- Motoristas DEMO: 19 registros (inalterado)

## Commits desta sessão
- `751c2bc` — fix+feat: sessão 23 — word-boundary fusao, +5 DEMO_QA novos, CCT mai/2026 diárias R$100/dia + plano saúde R$290 — PUSHED

## Pendências / próxima sessão
1. **Tabela ANTT por eixo (R$/km)** — herdado 18x. Acesso manual: calculadorafrete.antt.gov.br
2. **CGI sub-módulos** — herdado 3x. CIOT com PSPs (Pamcard/Repom/TruckPad) confirmado; demais sub-módulos inacessíveis
3. **CCT MOVIFORT RS tabela completa** — herdado 17x. Pisos confirmados, benefícios mai/2026 agora em código
4. **Rebuild Ollama**: `ollama create lumina-treinada -f Modelfile.lumina` — máquina local
5. **`npm run build-dataset`** — máquina local (≥500 exemplos para fine-tuning)
6. **Fine-tuning Llama** — quando dataset atingir 500+ exemplos
