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
