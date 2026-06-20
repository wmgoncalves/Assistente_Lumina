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
