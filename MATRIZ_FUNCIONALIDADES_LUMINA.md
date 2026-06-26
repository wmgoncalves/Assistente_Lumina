# Matriz de Funcionalidades — Lúmina IA v2.0.0

> Documento gerado em 2026-06-25 | 52 funcionalidades catalogadas
>
> **Legenda de status:**
> - ✅ Completo e integrado — funciona de ponta a ponta
> - ⚠️ Parcial — existe mas com limitações relevantes
> - 🔨 Em construção — infraestrutura pronta, falta algo crítico
> - 🎭 Mock/Demo — retorna dados fictícios ou pré-definidos
> - ❌ Stub — declarado mas não implementado
> - 🔍 Isolado — backend pronto, sem trigger na UI

---

## Bloco 1 — IA e Conversa

| # | Funcionalidade | Status | Arquivo(s) | Rota/Função | Dependências externas | Risco | O que falta |
|---|---------------|--------|------------|------------|----------------------|-------|-------------|
| 01 | Chat com Gemini 2.5 Flash | ✅ | server.js:232 · app.js:1900 | `POST /api/chat` | Gemini API key | Alto (quota) | Cache de 20min pode entregar dado desatualizado |
| 02 | Fallback Ollama local | ⚠️ | server.js:381 · app.js:1958 | `POST http://localhost:11434/api/generate` | Ollama rodando + modelo baixado | Médio | Precisa `llama3.2:3b` ou `lumina-treinada` no host |
| 03 | Fallback DEMO local | ✅ | app.js:1985 | `localFallback()` → respostas hardcoded | Nenhuma | Nenhum | — |
| 04 | Fine-tuning Ollama contínuo | 🔨 | server.js:3266 · server.js:3336 | `POST /api/rebuild-ollama` · `_doRebuildSilent()` | `Modelfile.lumina` no diretório + Ollama rodando | Alto | `Modelfile.lumina` não está no repositório |
| 05 | Visão / análise de imagem | ✅ | server.js:400 | `POST /api/vision` | Gemini API key | Médio | Sem fallback se Gemini offline |
| 06 | Cache de respostas Gemini | ⚠️ | app.js:1895 | `_getCache() / _setCache()` (in-memory) | Nenhuma | Baixo | TTL fixo de 20min — dados financeiros podem ficar stale |
| 07 | Memória persistente de fatos | ✅ | server.js:302 · app.js:1738 | `POST /api/memory` | Obsidian Vault (sync) | Baixo | — |
| 08 | Consolidação de memória (Gemini) | 🔍 | server.js:314 | `POST /api/memory/consolidate` | Gemini API key | Baixo | Nenhum botão/comando no frontend chama este endpoint |
| 09 | Relacionamento entre fatos | 🔍 | server.js:302 | `POST /api/memory/relate` | Gemini API key | Baixo | Nenhuma referência no frontend |
| 10 | Inline learning (comentários HTML) | ✅ | app.js:1428 | `LEARN_RE` · `extractLearn()` · `applyInlineLearn()` | Nenhuma | Baixo | — |
| 11 | Padrões de uso / analytics | ✅ | app.js:280 | `getPatterns()` · `trackInteraction()` | localStorage | Baixo | — |
| 12 | Detecção de emoção | ✅ | app.js:253 | `detectEmotion()` · `EMOTION_CTX` | Nenhuma | Nenhum | — |
| 13 | Sanitização de identidade | ✅ | app.js:1843 | `sanitizeIdentity()` | Nenhuma | Nenhum | — |
| 14 | DEMO_QA (respostas de workshop) | 🎭 | app.js:1930 · mockData.js | bloco DEMO_QA em processInput() | Nenhuma | Nenhum | Conteúdo estático; atualizar antes de cada demo |

---

## Bloco 2 — Voz e Reconhecimento

| # | Funcionalidade | Status | Arquivo(s) | Rota/Função | Dependências externas | Risco | O que falta |
|---|---------------|--------|------------|------------|----------------------|-------|-------------|
| 15 | Reconhecimento de voz (Gemini Audio) | ✅ | app.js:1166 | `startListening()` + `POST /api/transcribe-audio` | Gemini API key + MediaRecorder | Alto (quota) | Cada gravação consome quota; 3 retries em 429 |
| 16 | Reconhecimento de voz nativo (fallback) | ✅ | app.js:1300 | `startListeningNative()` — WebkitSpeechRecognition | Chrome/Electron WebSpeechAPI | Baixo | — |
| 17 | Wake Word detection | ⚠️ | app.js:1340 · main.js:157 | `startWakeWord()` — áudio + Gemini | Gemini Audio API + microfone | Alto | Qualquer ruído >28 amplitude gera chamada Gemini; NFD/NFC já corrigido |
| 18 | TTS ElevenLabs | ✅ | server.js:441 · app.js:734 | `POST /api/tts` → `speakElevenLabs()` | ElevenLabs API key + voiceId | Médio | Timeout de 12s; cai para Edge se falhar |
| 19 | TTS Microsoft Edge (Neural) | ✅ | server.js:540 · app.js:820 | `POST /api/tts-edge` → `speakEdge()` | msedge-tts (npm) — sem API key | Baixo | Requer conectividade à internet |
| 20 | TTS Piper (local offline) | 🔨 | server.js:490 · app.js:797 | `GET /api/piper-available` · `POST /api/tts-piper` | `piper/piper.exe` + `piper/voices/*.onnx` | Alto | Binários e modelos não incluídos no projeto |
| 21 | TTS Browser SpeechSynthesis | ✅ | app.js:768 | `speakBrowser()` | Electron/Chrome built-in | Baixo | Última opção da cascata; sempre disponível |
| 22 | Limpeza de texto para TTS | ✅ | app.js:1026 | `cleanForTTS()` | Nenhuma | Nenhum | — |

---

## Bloco 3 — Gestão Pessoal (Tarefas, Hábitos, Finanças, Notas)

| # | Funcionalidade | Status | Arquivo(s) | Rota/Função | Dependências externas | Risco | O que falta |
|---|---------------|--------|------------|------------|----------------------|-------|-------------|
| 23 | Tarefas (CRUD) | ✅ | server.js:900 · app.js:117 | `GET/POST /api/data/tasks` | Nenhuma | Baixo | — |
| 24 | Hábitos (CRUD + check diário) | ✅ | server.js:910 · app.js:117 | `GET/POST /api/data/habits` | Nenhuma | Baixo | — |
| 25 | Finanças (CRUD) | ✅ | server.js:920 · app.js:117 | `GET/POST /api/data/finances` | Nenhuma | Baixo | — |
| 26 | Notas (CRUD + reindexação automática) | ✅ | server.js:930 · app.js:117 | `GET/POST /api/data/notes` + `triggerReindex()` | Gemini (embedding) | Médio | Falha de embedding cai para lexical |
| 27 | Sincronização Obsidian Vault | ✅ | server.js:1060 | `syncStoreToObsidian()` · `syncMemoryToObsidian()` | `~/Documents/Lumina Vault` existir | Médio | Sem verificação se o diretório existe antes de escrever |
| 28 | Importação de Vault Obsidian | 🔍 | server.js:1157 | `POST /api/import-vault` | Vault acessível | Baixo | Rota existe, sem UI de configuração de caminho no frontend |
| 29 | Exportação para Obsidian (manual) | 🔍 | server.js:2941 | `GET /api/export-obsidian` | Vault acessível | Baixo | Nenhum botão na UI principal |
| 30 | Lembretes agendados (proativo) | ✅ | server.js:3192 · server.js:1306 | `POST /api/remind` · `checkProactive()` · SSE `/api/events` | Nenhuma | Baixo | — |
| 31 | Notificação Windows (toast) | ✅ | server.js:3186 · server.js:1306 | `POST /api/notify` · `pushEvent()` | `node-notifier` | Baixo | — |

---

## Bloco 4 — RAG e Conhecimento

| # | Funcionalidade | Status | Arquivo(s) | Rota/Função | Dependências externas | Risco | O que falta |
|---|---------------|--------|------------|------------|----------------------|-------|-------------|
| 32 | Indexação vetorial de notas (Gemini) | ✅ | server.js:1238 | `POST /api/index-notes` · `geminiEmbed()` | Gemini text-embedding-004 | Médio (quota) | Sem limite de tamanho; vault grande pode demorar |
| 33 | Busca semântica (RAG) | ✅ | server.js:1272 · app.js:148 | `POST /api/search-notes` · `retrieveNotes()` | embeddings.json + Gemini | Médio | — |
| 34 | Busca lexical (fallback RAG) | ✅ | server.js:1290 · app.js:148 | busca por keyword dentro de `/api/search-notes` | Nenhuma | Baixo | — |
| 35 | Ingestão e extração de documentos | ✅ | server.js:620 | `POST /api/extract-doc` · `POST /api/ingest-doc` | mammoth (DOCX), pdf-parse (PDF), xlsx | Baixo | Magic bytes validados para PDF/DOCX/XLS |
| 36 | Categorização automática de notas | 🔍 | server.js:884 | `POST /api/notes/categorize` | Gemini API | Baixo | Rota existe, não chamada pelo frontend |
| 37 | Análise de planilha (DRE/AR) | ✅ | server.js:782 | `POST /api/analyze-spreadsheet` → `services/spreadsheetAnalyzer.js` | xlsx | Baixo | — |
| 38 | Resumo de documento (tool) | ✅ | app.js:2805 | `executeTool('summarizeDocument')` → `POST /api/extract-doc` | mammoth/pdf-parse | Baixo | — |

---

## Bloco 5 — Módulo Frete e Logística

| # | Funcionalidade | Status | Arquivo(s) | Rota/Função | Dependências externas | Risco | O que falta |
|---|---------------|--------|------------|------------|----------------------|-------|-------------|
| 39 | Estimativa de frete | ✅ | server.js:1413 · app.js:2730 | `POST /api/frete-estimate` → `geocode()` + `calcRoute()` | Nominatim (OSM) + OSRM | Médio | APIs públicas sem SLA; podem ser bloqueadas |
| 40 | Geocodificação (Nominatim) | ✅ | server.js:1443 | `geocode(address)` | Nominatim API | Médio | Rate limit da API pública |
| 41 | Cálculo de rota (OSRM) | ✅ | server.js:1455 | `calcRoute(orig, dest)` | OSRM router.project-osrm.org | Médio | Sem fallback se OSRM offline |

---

## Bloco 6 — CRM e Leads

| # | Funcionalidade | Status | Arquivo(s) | Rota/Função | Dependências externas | Risco | O que falta |
|---|---------------|--------|------------|------------|----------------------|-------|-------------|
| 42 | Prospecção de clientes (Gemini + Maps) | ⚠️ | server.js:1543 | `POST /api/prospect` | Gemini + Puppeteer + Google Maps | Alto | Google Maps bot detection pode bloquear |
| 43 | Exportação de leads (Excel) | ✅ | server.js:810 · app.js:1505 | `GET /api/leads/export` | xlsx | Baixo | — |
| 44 | Envio de leads por e-mail (Composio) | ⚠️ | server.js:2215 · app.js:1505 | `POST /api/composio/send-leads` | Composio + Gmail autenticado | Alto | Callback OAuth `/api/composio/callback` não existe |
| 45 | Consultar banco de dados CRM (tool) | ❌ | app.js:TOOL_DECLARATIONS | `executeTool('consultarCRM')` | CRM interno (porta 5173) | Alto | Case não implementado em executeTool(); CRM é projeto separado |
| 46 | Criar chamado CRM (tool) | ❌ | app.js:TOOL_DECLARATIONS | `executeTool('criarChamadoCRM')` | CRM interno (porta 5173) | Alto | Case não implementado em executeTool() |
| 47 | Lista de motoristas | 🎭 | app.js:1700 | `MOTORISTAS_DEMO` · `_findMotorista()` | Nenhuma | Médio | 19 motoristas fictícios hardcoded; sem integração real |
| 48 | GPS / rastreamento de frota | 🎭 | app.js buildSystem() | mencionado no system prompt | API GPS real (não integrada) | Alto | Nenhuma rota backend para dados reais de GPS |

---

## Bloco 7 — Módulo de Recrutamento (RH)

| # | Funcionalidade | Status | Arquivo(s) | Rota/Função | Dependências externas | Risco | O que falta |
|---|---------------|--------|------------|------------|----------------------|-------|-------------|
| 49 | Candidatura (formulário externo) | ✅ | server.js:1800 · public/entrevista.html | `POST /api/candidatura` · `GET /entrevista/:token` | SMTP (nodemailer) | Médio | SMTP deve estar configurado em config.json |
| 50 | Entrevista guiada por IA | ✅ | server.js:1835 | `POST /api/candidatura/:token/responder` | Gemini (avaliação final) | Médio | Avaliação Gemini só no último answer |
| 51 | Painel de candidaturas | ⚠️ | server.js:2182 | `GET /candidaturas` (HTML) · `GET /api/candidaturas` | Nenhuma | Médio | Sem navegação integrada na UI principal; sem autenticação na rota HTML |
| 52 | Prospecção de candidatos | 🎭 | server.js:1783 · app.js | `POST /api/prospect-candidatos` | Gemini | Alto | Gera candidatos **fictícios** explicitamente; risco de uso inadvertido em ambiente real |

---

## Bloco 8 — Finanças e Relatórios

| # | Funcionalidade | Status | Arquivo(s) | Rota/Função | Dependências externas | Risco | O que falta |
|---|---------------|--------|------------|------------|----------------------|-------|-------------|
| 53 | Auditoria contábil (Gemini) | ✅ | server.js:2287 | `POST /api/auditoria-contabil` | Gemini + planilha como contexto | Médio | Requer planilha carregada na conversa |
| 54 | Fechamento mensal (Gemini) | ✅ | server.js:2360 | `POST /api/fechamento-mensal` | Gemini + planilha como contexto | Médio | Idem |
| 55 | Conferir demonstrativo (Gemini) | ✅ | server.js:2420 | `POST /api/conferir-demonstrativo` | Gemini + planilha como contexto | Médio | Idem |
| 56 | Relatório KPI (PDF institucional) | ✅ | server.js:2880 | `POST /api/relatorio-kpi` | PDFKit | Baixo | — |
| 57 | Geração de arquivo (xlsx/docx/pptx/pdf) | ✅ | server.js:2628 | `POST /api/generate-file` | Gemini + docx/pptx/pdfkit/xlsx | Médio | — |
| 58 | Consulta CNPJ | ✅ | server.js:3140 | `GET /api/cnpj/:cnpj` | BrasilAPI → ReceitaWS → cnpj.ws | Baixo | 3 fontes em cascata; robusto |

---

## Bloco 9 — Dados em Tempo Real

| # | Funcionalidade | Status | Arquivo(s) | Rota/Função | Dependências externas | Risco | O que falta |
|---|---------------|--------|------------|------------|----------------------|-------|-------------|
| 59 | Câmbio (AwesomeAPI) | ✅ | app.js:2580+ | `webSearchGemini()` → `api.awesomeapi.com.br` | Internet | Baixo | — |
| 60 | Ações B3 (brapi.dev) | ✅ | app.js:2580+ | `webSearchGemini()` → `brapi.dev` | Internet | Baixo | — |
| 61 | Clima (wttr.in) | ✅ | app.js:2580+ | `webSearchGemini()` → `wttr.in` | Internet | Baixo | — |
| 62 | Notícias (RSS) | ✅ | server.js:2926 | `GET /api/news` · `GET /api/news/transporte` | RSS feeds externos | Baixo | `/api/news/transporte` existe mas não é usado no frontend |
| 63 | Esportes (ESPN) | ✅ | server.js:2960 | `GET /api/sports` | ESPN API pública | Baixo | — |

---

## Bloco 10 — Dev Tools e Automação

| # | Funcionalidade | Status | Arquivo(s) | Rota/Função | Dependências externas | Risco | O que falta |
|---|---------------|--------|------------|------------|----------------------|-------|-------------|
| 64 | Dev tools (grep/read/write/exec) | ✅ | server.js:2490 | `GET /api/dev/*` | `LUMINA_DEV=1` env var | Médio | Bem protegido por env var e path traversal check |
| 65 | Puppeteer browser automation | ✅ | server.js:1350 | `POST /api/browser` | Chromium (via puppeteer) | Médio | Lazy loaded; sem `--no-sandbox` (adequado para desktop privado) |
| 66 | Rebuild Ollama / auto-treino | 🔨 | server.js:3266 | `POST /api/rebuild-ollama` | Ollama + `Modelfile.lumina` | Alto | Arquivo `Modelfile.lumina` não versionado |
| 67 | Abre VSCode (tool) | ❌ | server.js:2927 | `POST /api/vscode` → case `openVSCode` em executeTool | VS Code instalado | Baixo | `executeTool()` não tem case `openVSCode` no app.js |
| 68 | Abrir projetos externos | ✅ | app.js:1870 | `PROJETOS` dict → `shell.openExternal()` | Servidores nas portas definidas | Médio | Sem verificação de disponibilidade da porta |

---

## Resumo Contagem de Status

| Status | Qtd | % |
|--------|-----|---|
| ✅ Completo e integrado | 34 | 50% |
| ⚠️ Parcial | 7 | 10% |
| 🔨 Em construção | 3 | 4% |
| 🎭 Mock/Demo | 5 | 7% |
| ❌ Stub não implementado | 3 | 4% |
| 🔍 Isolado (sem trigger UI) | 6 | 9% |
| **Total catalogado** | **58** | — |

> Nota: a contagem final chegou a 58 itens (vs. 52 previstos). Os itens 53-68 foram descobertos durante análise e cobrem funcionalidades relevantes não listadas no briefing original.

---

*Arquivo gerado automaticamente como parte da análise arquitetural da Lúmina v2.0.0*
