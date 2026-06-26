# Roadmap de Integração — Lúmina IA (Scapini Transportes)

> Documento gerado em 2026-06-25 | Alinhado com a apresentação à diretoria (~2026-07-07)
>
> **Princípio:** Nenhuma funcionalidade existente é removida. Cada fase adiciona ou conecta o que já existe.

---

## Visão Geral das Fases

```
FASE 1 — Estabilização e Demo-Safety    [Agora → 2026-07-05]   ← CRÍTICO para apresentação
FASE 2 — Core Conectado                 [2026-07-08 → 2026-07-21]
FASE 3 — Módulos Corporativos           [2026-07-22 → 2026-08-15]
FASE 4 — Automação e RAG Avançado       [2026-08-16 → 2026-09-15]
FASE 5 — Qualidade de Diretor           [2026-09-16 em diante]
```

---

## FASE 1 — Estabilização e Demo-Safety

**Objetivo:** Garantir que a apresentação à diretoria em ~07/07 transcorra sem falhas visíveis.
**Nenhuma nova funcionalidade.** Apenas correções de bugs e robustez dos fallbacks.

### 1.1 Crítico (bloqueia demo)

| # | Tarefa | Arquivo | Função/Linha | Por que é crítico |
|---|--------|---------|--------------|------------------|
| 1.1.1 | Criar `Modelfile.lumina` base (se não existir) com persona Lúmina mínima | novo arquivo | — | Sem ele, qualquer rebuild Ollama crasha (server.js:3346) |
| 1.1.2 | Adicionar mensagem amigável quando porta de projeto externo falha | app.js | bloco PROJETOS em processInput() | Shell.openExternal() falha silenciosamente se porta 5173/4001 offline |
| 1.1.3 | Testar DEMO_QA completo com normalização de texto | app.js:1930 | normalizeText() + DEMO_QA | Perguntas com typos ou acentuação diferente podem cair no Gemini e consumir quota |
| 1.1.4 | Ajustar threshold do wake word para o ambiente da sala de demo | app.js:1389 | constante `28` (amplitude) | Sala silenciosa pode ter threshold muito baixo e gerar chamadas Gemini não intencionais |
| 1.1.5 | Verificar configuração SMTP antes da demo (ou desabilitar módulo RH na demo) | server.js:1831 | `getMailer()` | Se SMTP ausente, e-mails de candidatura falham com stack trace no log |

### 1.2 Alta Prioridade

| # | Tarefa | Arquivo | Função/Linha | Benefício |
|---|--------|---------|--------------|-----------|
| 1.2.1 | Exibir mensagem "Serviço temporariamente indisponível" quando Gemini retorna 429 em vez de cair no DEMO silenciosamente | app.js:1958 | `_handleGeminiErr()` | Transparência para o diretor que assiste |
| 1.2.2 | Adicionar `try/catch` em `syncStoreToObsidian()` com log de aviso (não erro fatal) quando vault path não existe | server.js:1060 | `syncStoreToObsidian()` | Previne crash se Obsidian não estiver instalado na máquina de demo |
| 1.2.3 | Corrigir rota `/admin` — criar `admin.html` mínimo ou remover a rota | server.js:195 | `app.get('/admin')` | 404 feio se alguém acessar |

### 1.3 Baixa Prioridade (antes da demo se houver tempo)

| # | Tarefa | Arquivo | Função/Linha | Benefício |
|---|--------|---------|--------------|-----------|
| 1.3.1 | Adicionar badge visual claro "MODO DEMO" no TTS durante fallback | app.js:1840 | `_showDemoMode()` | Distingue claramente para o apresentador |
| 1.3.2 | Pré-carregar DEMO_QA no início da sessão e logar quais perguntas estão mapeadas | app.js:1930 | bloco DEMO_QA | Facilita diagnóstico em tempo real |

**Critérios de conclusão da Fase 1:**
- [ ] `npm run lumina` abre sem erro
- [ ] DEMO_QA responde as 30 perguntas planejadas sem tocar Gemini
- [ ] Wake word não dispara em silêncio da sala
- [ ] Fallback DEMO exibe badge na UI
- [ ] Sem erros no console durante demo completo de 30 min

---

## FASE 2 — Core Conectado

**Objetivo:** Conectar o que já existe no backend mas está isolado do frontend. Zero código novo de funcionalidade — apenas wiring.

### 2.1 Conectar Funcionalidades Isoladas

| # | Tarefa | Backend existente | O que implementar no frontend | Esforço |
|---|--------|------------------|-------------------------------|---------|
| 2.1.1 | Botão "Consolidar memória" no painel de memória | `POST /api/memory/consolidate` (server.js:314) | Botão em `renderMemoryPanel()` → fetch + toast | 1h |
| 2.1.2 | Botão "Exportar para Obsidian" nas configurações | `GET /api/export-obsidian` (server.js:2941) | Botão no painel Settings | 30min |
| 2.1.3 | Input "Caminho do Vault" com botão importar | `POST /api/import-vault` (server.js:1157) | Campo no painel Settings | 1h |
| 2.1.4 | Case `openVSCode` em executeTool() | `POST /api/vscode` (server.js:2927) | Adicionar case no switch de executeTool() (app.js) | 15min |
| 2.1.5 | Categorização automática ao salvar nota | `POST /api/notes/categorize` (server.js:884) | Chamar após POST /api/data/notes | 30min |
| 2.1.6 | Link visível para o painel de candidaturas | `GET /candidaturas` (server.js:2182) | Adicionar ao dict PROJETOS no processInput() | 5min |

### 2.2 Corrigir Cases de Tool Faltantes

| # | Tarefa | Arquivo | Linha | Esforço |
|---|--------|---------|-------|---------|
| 2.2.1 | Implementar `case 'consultarCRM'` em executeTool() com fetch para porta 5173 + fallback se offline | app.js | executeTool() switch | 1h |
| 2.2.2 | Implementar `case 'criarChamadoCRM'` analogamente | app.js | executeTool() switch | 1h |
| 2.2.3 | Implementar `case 'openVSCode'` — fetch `POST /api/vscode` | app.js | executeTool() switch | 15min |

**Critérios de conclusão da Fase 2:**
- [ ] Painel de memória tem botão "Consolidar" funcional
- [ ] Settings tem campo vault + botão exportar/importar
- [ ] "abre CRM" tenta conectar na porta 5173 com mensagem de erro amigável se offline
- [ ] "abre VSCode" chama o endpoint e abre o editor
- [ ] Candidaturas acessíveis via comando de voz "abre candidaturas"

---

## FASE 3 — Módulos Corporativos

**Objetivo:** Elevar o módulo RH e CRM ao nível de uso real (não mock) e integrar autenticação nos painéis.

### 3.1 Autenticação no Painel de Candidaturas

| # | Tarefa | Arquivo | Detalhes |
|---|--------|---------|---------|
| 3.1.1 | Adicionar autenticação básica (senha ou token) na rota HTML `/candidaturas` | server.js:2182 | Usar `hasValidLocalToken()` já existente ou senha fixa configurável em config.json |
| 3.1.2 | Adicionar paginação ou filtros no painel de candidaturas | server.js:2182 + painel HTML | Candidaturas cresce infinitamente; filtro por cargo/status mínimo |

### 3.2 Composio / Gmail — Fix do OAuth

| # | Tarefa | Arquivo | Detalhes |
|---|--------|---------|---------|
| 3.2.1 | Criar rota `/api/composio/callback` | server.js | Handler que recebe o redirect OAuth, salva token em config.json |
| 3.2.2 | Adicionar campo `composioKey` no painel Settings da UI | app.js + index.html | Atualmente não há input para configurar Composio pela UI |
| 3.2.3 | Testar fluxo completo `connect → callback → send-leads` | server.js:2215 | Validar que envio de leads funciona do começo ao fim |

### 3.3 Módulo RH — Candidatos Reais

| # | Tarefa | Arquivo | Detalhes |
|---|--------|---------|---------|
| 3.3.1 | Separar endpoint `prospect-candidatos-ficticio` do endpoint real | server.js:1783 | Criar `POST /api/prospect-candidatos-demo` (mantém fictícios) e `POST /api/prospect-candidatos` (only real data) |
| 3.3.2 | Adicionar fonte real de candidatos (pelo menos LinkedIn Jobs RSS ou Catho API) | server.js | Novo endpoint ou integração dentro de prospect-candidatos |

### 3.4 App Motoristas e CRM Externo

| # | Tarefa | Detalhes |
|---|--------|---------|
| 3.4.1 | Documentar URLs e portas dos projetos externos (CRM 5173, Manutenção 4001, App Motoristas onrender) | README ou PROJETOS.md no repo |
| 3.4.2 | Adicionar verificação de disponibilidade antes de abrir (ping na porta com timeout de 2s) | app.js PROJETOS dict |

**Critérios de conclusão da Fase 3:**
- [ ] Painel `/candidaturas` exige autenticação
- [ ] Fluxo Composio Gmail funciona de ponta a ponta
- [ ] `prospect-candidatos` tem modo "fictício" (demo) separado de modo "real"
- [ ] CRM externo tem verificação de disponibilidade antes de tentar abrir

---

## FASE 4 — Automação e RAG Avançado

**Objetivo:** Tornar o sistema verdadeiramente autônomo com indexação, proatividade e Ollama funcionando como fallback robusto.

### 4.1 Piper TTS Local

| # | Tarefa | Detalhes |
|---|--------|---------|
| 4.1.1 | Incluir `piper/piper.exe` e ao menos 1 voz PT-BR no repo (ou script de instalação) | Complementa server.js:490 que já está pronto |
| 4.1.2 | Testar cascata completa ElevenLabs → Piper → Edge → Browser em ambiente offline | Validar que `piper-available` retorna true |

### 4.2 RAG — Indexação Incremental

| # | Tarefa | Arquivo | Detalhes |
|---|--------|---------|---------|
| 4.2.1 | Adicionar limite de itens por batch em `index-notes` para vaults grandes | server.js:1238 | Atualmente sem limite; vault com 500+ notas pode demorar 10min+ |
| 4.2.2 | Exibir progresso de indexação na UI (via SSE `/api/events`) | server.js:1238 + app.js | `pushEvent('progress', '80% indexado...')` |
| 4.2.3 | Expiração de cache de embeddings obsoletos | server.js:1212 | embeddings.json nunca purga entradas de notas deletadas |

### 4.3 Ollama — Integração Robusta

| # | Tarefa | Arquivo | Detalhes |
|---|--------|---------|---------|
| 4.3.1 | Versionar `Modelfile.lumina` no repositório | — | Arquivo base obrigatório para qualquer rebuild |
| 4.3.2 | Reduzir frequência de `_checkAutoTrain()` — atualmente chamado a cada log | server.js:804 | Chamar apenas a cada N logs ou por intervalo de tempo |
| 4.3.3 | Adicionar interface de progresso de treino Ollama na UI | server.js:3295 + app.js | O rebuild é async mas sem feedback; adicionar polling de status |

### 4.4 Calendar / E-mail (se aprovado)

| # | Tarefa | Detalhes |
|---|--------|---------|
| 4.4.1 | Implementar `listCalendarEvents` e `createCalendarEvent` via Google Calendar API ou Composio | Preenche gap de tools declaradas no TOOL_DECLARATIONS sem backend |
| 4.4.2 | Implementar `listEmails` / `readEmail` via Composio Gmail (após Fase 3) | Fecha o ciclo da integração Gmail |

**Critérios de conclusão da Fase 4:**
- [ ] Piper TTS funciona offline sem dependência de Edge
- [ ] RAG exibe progresso na UI durante indexação longa
- [ ] Ollama auto-treino não sobrecarrega a cada log
- [ ] `Modelfile.lumina` commitado no repositório
- [ ] Ao menos 2 das 4 tools de calendário/e-mail funcionando

---

## FASE 5 — Qualidade de Diretor

**Objetivo:** Polimento final — experiência sem fricção, segurança reforçada e autonomia noturna plena.

### 5.1 Segurança

| # | Tarefa | Arquivo | Detalhes |
|---|--------|---------|---------|
| 5.1.1 | Habilitar CSP de forma seletiva (permitir apenas origens necessárias) | server.js:221 | CSP está desabilitado por `contentSecurityPolicy: false` |
| 5.1.2 | Criar `admin.html` com painel de configurações protegido por token | server.js:195 | Atualmente 404 |
| 5.1.3 | Mover credenciais SMTP de `config.json` para variável de ambiente | server.js:1831 | `config.json` pode ser commitado acidentalmente |
| 5.1.4 | Adicionar auditoria de tentativas de path traversal nos dev tools | server.js:2490 | `resolveWorkspacePath()` já previne, mas sem log |

### 5.2 Performance

| # | Tarefa | Arquivo | Detalhes |
|---|--------|---------|---------|
| 5.2.1 | Truncar histórico enviado ao Gemini para últimas 50 mensagens (atual: 200) | app.js buildSystem() | Reduz tokens e latência; memória Gemini cobre contexto mais antigo |
| 5.2.2 | Implementar thinkingBudget adaptativo no `/api/chat` | server.js:355 | Consultas rápidas usam 0; consultas complexas usam 512 ou 2048 |
| 5.2.3 | Adicionar índice em `historico` (SQLite) para a query de exemplos de treino | services/db.js | `_coletarExemplos()` faz JOIN sem índice em tabela que pode ter milhares de linhas |

### 5.3 Polimento de UX

| # | Tarefa | Detalhes |
|---|--------|---------|
| 5.3.1 | Exibir indicador de qual nível de IA está respondendo (Gemini / Ollama / DEMO) sempre, não só no DEMO | app.js `_finalize()` — parâmetro `source` |
| 5.3.2 | Adicionar atalho teclado para consolidar memória e exportar Obsidian | app.js — keyboard shortcuts |
| 5.3.3 | Sessões noturnas autônomas — DEMO_QA + QA + commit + push (já autorizado permanentemente) | Seguir protocolo já definido na memória |

**Critérios de conclusão da Fase 5:**
- [ ] CSP habilitado sem quebrar funcionalidade
- [ ] Histórico truncado e latência < 3s para perguntas simples
- [ ] `admin.html` com painel de configuração completo e autenticado
- [ ] Indicador de fonte de IA visível em todas as respostas
- [ ] SMTP configurado via variável de ambiente

---

## Dependências entre Fases

```
FASE 1 ──► Obrigatório antes da apresentação (07/07)
FASE 2 ──► Depende de FASE 1 concluída
FASE 3 ──► FASE 3.2 depende de FASE 2 (settings com composioKey)
FASE 4 ──► FASE 4.1 independente | FASE 4.4 depende de FASE 3.2
FASE 5 ──► Depende de FASE 3 e FASE 4 concluídas
```

## Estimativa de Esforço Total

| Fase | Esforço estimado | Risco de regressão |
|------|-----------------|-------------------|
| FASE 1 | 2–4h | Nenhum (apenas correções e config) |
| FASE 2 | 4–6h | Baixo (wiring de rotas existentes) |
| FASE 3 | 8–16h | Médio (novo código de autenticação e OAuth) |
| FASE 4 | 12–20h | Médio (RAG, Piper, Ollama) |
| FASE 5 | 8–12h | Médio (CSP, historial truncamento) |
| **Total** | **34–58h** | — |

---

*Arquivo gerado automaticamente como parte da análise arquitetural da Lúmina v2.0.0*
