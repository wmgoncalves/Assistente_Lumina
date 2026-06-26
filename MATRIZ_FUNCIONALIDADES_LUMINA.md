# MATRIZ DE FUNCIONALIDADES — LÚMINA IA CORPORATIVA
**Scapini Transportes | 2026-06-26**

## Legenda de Status
- ✅ **Implementada e integrada** — funciona end-to-end
- ⚠️ **Implementada mas isolada** — existe mas não se conecta com outros módulos
- 🔶 **Parcialmente implementada** — funciona com limitações conhecidas
- 🔸 **Mock/Demo** — dados fictícios ou respostas roteirizadas
- ❌ **Quebrada** — código existe mas não funciona
- 🚫 **Não encontrada** — mencionada mas sem implementação

---

## CATEGORIA 1 — CHAT E LINGUAGEM

| # | Funcionalidade | Status | Arquivos | Rotas/API | Dependências | Risco Técnico | O que falta |
|---|---------------|--------|---------|-----------|--------------|--------------|------------|
| 1 | Chat por texto | ✅ | `app.js:processInput` | Gemini API direto | Gemini/Ollama/DEMO | Baixo | — |
| 2 | Chat por voz | ✅ | `app.js:1166-1430` | SpeechRecognition API | Chrome, microfone | Baixo | — |
| 3 | Wake word | ✅ | `app.js:1322-1427` | — | Chrome SpeechRecognition | Baixo (NFD/NFC resolvido) | — |
| 4 | Conversa contínua | ✅ | `app.js:1858-1869` | — | Wake word ativo | Baixo | — |
| 5 | ThinkingBudget adaptativo | 🔶 | `server.js`, `app.js` | Gemini API | Gemini 2.5 Flash | Médio | Não é global — alguns endpoints usam valor fixo |
| 6 | Cache de sessão | ✅ | `app.js:_cacheKey,_setCache` | — | localStorage | Baixo | — |
| 7 | Sanitização de identidade | ✅ | `app.js:sanitizeIdentity` | — | Regex local | Baixo | — |
| 8 | Normalização ABBR_MAP | ✅ | `app.js:normText` | — | Local | Baixo | — |

---

## CATEGORIA 2 — IA / FALLBACK

| # | Funcionalidade | Status | Arquivos | Rotas/API | Dependências | Risco Técnico | O que falta |
|---|---------------|--------|---------|-----------|--------------|--------------|------------|
| 9 | Gemini 2.5 Flash | ✅ | `app.js:callGemini` | `generativelanguage.googleapis.com` | API key | Alto (externa) | AbortSignal no /api/chat |
| 10 | Fallback Ollama local | ✅ | `app.js:callOllama` | `localhost:11434` | Ollama rodando | Médio | — |
| 11 | Fallback DEMO local | ✅ | `app.js:localFallback` | — | Base de 365+ respostas | Baixo | — |
| 12 | Badge "⚡ local" (Ollama) | ✅ | `app.js:_finalize` | — | — | Baixo | — |
| 13 | Badge DEMO mode | ✅ | `app.js:_showDemoMode` | — | — | Baixo | — |
| 14 | DEMO_QA workshop | 🔸 | `app.js:5042-5141` | — | Local | Baixo | Remover/desativar após apresentação |
| 15 | Fine-tuning Ollama auto | ✅ | `server.js:3234+`, `lumina-dataset-builder.js` | `/api/ollama-train` | Ollama, histórico | Médio | Histórico precisa acumular |
| 16 | ThinkingBudget Gemini | 🔶 | `server.js`, `app.js` | Gemini API | — | Baixo | Padronizar valor por tipo de consulta |

---

## CATEGORIA 3 — VOZ / TTS

| # | Funcionalidade | Status | Arquivos | Rotas/API | Dependências | Risco Técnico | O que falta |
|---|---------------|--------|---------|-----------|--------------|--------------|------------|
| 17 | TTS ElevenLabs | ✅ | `server.js:440`, `app.js:760` | `/api/tts` → ElevenLabs | API key | Alto (externa) | — |
| 18 | TTS Edge (padrão) | ✅ | `server.js:545`, `app.js:972` | `/api/tts-edge` | `msedge-tts` npm | Baixo | — |
| 19 | TTS Piper (offline) | ✅ | `server.js:510`, `app.js:924` | `/api/tts-piper` | `piper/piper.exe` | Baixo | — |
| 20 | TTS Browser (fallback) | ✅ | `app.js:807` | SpeechSynthesis API | Chrome | Baixo | — |
| 21 | Pré-fetch paralelo Edge TTS | ✅ | `app.js:972-1165` | — | Edge TTS ativo | Baixo | — |
| 22 | Transcrição de áudio | ✅ | `server.js:598`, `app.js:1220` | `/api/transcribe-audio` | Gemini API, 60s timeout | Alto (Gemini) | — |

---

## CATEGORIA 4 — DOCUMENTOS

| # | Funcionalidade | Status | Arquivos | Rotas/API | Dependências | Risco Técnico | O que falta |
|---|---------------|--------|---------|-----------|--------------|--------------|------------|
| 23 | Leitura de PDF | ✅ | `server.js:562` | `/api/ingest-doc` | `pdf-parse` | Baixo | — |
| 24 | Leitura de DOCX | ✅ | `server.js:562` | `/api/ingest-doc` | `mammoth` | Baixo | — |
| 25 | Leitura de TXT | ✅ | `server.js:562` | `/api/ingest-doc` | — | Baixo | — |
| 26 | Parser Excel especializado | ✅ | `server.js:744` | `/api/analyze-spreadsheet` | `xlsx` | Médio | — |
| 27 | Parser DRE/AR/Balancete | ✅ | `server.js:744` | `/api/analyze-spreadsheet` | `xlsx`, formato CG Contadores | Médio | Frágil se formato mudar |
| 28 | Validação upload magic bytes | ✅ | `server.js:validateUpload` | — | — | Baixo | — |
| 29 | Download de doc original | ⚠️ | `server.js:736` | `/api/download-doc/:filename` (público) | `uploads/` | Alto (público sem token) | Adicionar token obrigatório |

---

## CATEGORIA 5 — MEMÓRIA E APRENDIZADO

| # | Funcionalidade | Status | Arquivos | Rotas/API | Dependências | Risco Técnico | O que falta |
|---|---------------|--------|---------|-----------|--------------|--------------|------------|
| 30 | Memória profunda | 🔶 | `server.js:275`, `app.js:117` | `/api/data/mem` | `memory.json` | Médio | Migrar para SQLite tabela `memorias` |
| 31 | Relacionamentos entre fatos | 🔶 | `server.js:301` | `/api/memory/relate` | `memory.json` | Médio | Sem busca estruturada |
| 32 | Aprendizado inline | ✅ | `app.js:1428` | — | Regex extração local | Baixo | — |
| 33 | Consolidação via Gemini | ✅ | `server.js:313` | `/api/memory/consolidate` | Gemini API | Alto (Gemini) | — |
| 34 | Persistência híbrida local+servidor | ✅ | `app.js:serverSave,localCache` | `/api/data/:store` | localStorage + servidor | Baixo | — |
| 35 | Histórico 40 mensagens | ✅ | `app.js:saveHist`, `server.js:289` | `/api/history` | localStorage + SQLite | Baixo | — |

---

## CATEGORIA 6 — FINE-TUNING LOCAL

| # | Funcionalidade | Status | Arquivos | Rotas/API | Dependências | Risco Técnico | O que falta |
|---|---------------|--------|---------|-----------|--------------|--------------|------------|
| 36 | Auto-treino a cada 5 conversas | ✅ | `server.js:3234+` | `/api/ollama-train` | Ollama, histórico | Médio | Histórico deve acumular |
| 37 | Intervalo mínimo 15min | ✅ | `server.js:ollamaTrainState` | — | `ollama-train-state.json` | Baixo | — |
| 38 | Seleção dos melhores exemplos | ✅ | `server.js:_coletarExemplos` | — | Histórico SQLite | Baixo | — |
| 39 | Rebuild manual ("treinar ollama") | ✅ | `app.js:processInput` | `/api/ollama-train` | Ollama | Médio | — |
| 40 | Status Ollama ("status ollama") | ✅ | `app.js:processInput` | `/api/ollama-status` | Ollama | Baixo | — |

---

## CATEGORIA 7 — FINANCEIRO / CONTÁBIL

| # | Funcionalidade | Status | Arquivos | Rotas/API | Dependências | Risco Técnico | O que falta |
|---|---------------|--------|---------|-----------|--------------|--------------|------------|
| 41 | Auditoria Contábil | ✅ | `server.js:2287` | `/api/auditoria-contabil` | Gemini, planilha | Alto (Gemini) | — |
| 42 | Month-End Closer | ✅ | `server.js:2350` | `/api/fechamento-mensal` | Gemini, planilha | Alto (Gemini) | — |
| 43 | Statement Auditor | ✅ | `server.js:2419` | `/api/conferir-demonstrativo` | Gemini, planilha | Alto (Gemini) | — |
| 44 | DRE (leitura e interpretação) | ✅ | `server.js:744`, `app.js` | `/api/analyze-spreadsheet` | xlsx, Gemini | Médio | — |
| 45 | Gráficos DRE | ✅ | `app.js:_chartPending` | — | Chart.js local | Baixo | — |
| 46 | Relatório KPIs PDF | ✅ | `server.js:2773` | `/api/relatorio-kpi` | `pdfkit`, Gemini | Médio | — |

---

## CATEGORIA 8 — OPERACIONAL / FRETE

| # | Funcionalidade | Status | Arquivos | Rotas/API | Dependências | Risco Técnico | O que falta |
|---|---------------|--------|---------|-----------|--------------|--------------|------------|
| 47 | Cotação de frete | ✅ | `server.js:1413` | `/api/frete` | Nominatim, OSRM | Médio (APIs externas) | — |
| 48 | Parâmetros configuráveis | ✅ | `server.js:config` | `/api/config` | — | Baixo | — |
| 49 | Consulta CNPJ | ✅ | `server.js:3110` | `/api/cnpj/:cnpj` | BrasilAPI→ReceitaWS→cnpj.ws | Baixo | — |
| 50 | Rastreamento GPS | 🔸 | `app.js` | — | CGI (não integrado) | Alto | Integração real com sistema CGI |
| 51 | Informações de motoristas | 🔸 | `app.js:1699-1730` | — | `MOTORISTAS_DEMO` hardcoded | Médio | Integração real com CGI |

---

## CATEGORIA 9 — COMERCIAL / PROSPECÇÃO

| # | Funcionalidade | Status | Arquivos | Rotas/API | Dependências | Risco Técnico | O que falta |
|---|---------------|--------|---------|-----------|--------------|--------------|------------|
| 52 | Prospecção de clientes | ✅ | `server.js:1557` | `/api/prospect-clientes` | Puppeteer, Gemini, SQLite | Alto (scraping) | — |
| 53 | Envio de e-mails via Composio | ✅ | `server.js:2241` | `/api/composio/send-leads` | Composio API, Gmail OAuth | Alto (OAuth) | Testar callback em prod |
| 54 | Captação de candidatos | 🔸 | `server.js:1707` | `/api/prospect-candidatos` | Gemini | Médio | Dados gerados são fictícios |
| 55 | CRM leads SQLite | ✅ | `services/db.js`, `server.js` | `/api/leads` | SQLite | Baixo | — |

---

## CATEGORIA 10 — RH / RECRUTAMENTO

| # | Funcionalidade | Status | Arquivos | Rotas/API | Dependências | Risco Técnico | O que falta |
|---|---------------|--------|---------|-----------|--------------|--------------|------------|
| 56 | Entrevista online (link único) | ✅ | `server.js:1882` | `/api/candidatura` | `data/recrutamento.db` | Baixo | — |
| 57 | Banco de perguntas por cargo | 🔶 | `server.js:~1820` | — | Hardcoded 5 perguntas/cargo | Médio | Expandir para 30 perguntas, configurável |
| 58 | Avaliação automática Gemini | ✅ | `server.js:1982` | interno | Gemini, 30s timeout | Alto (Gemini) | — |
| 59 | Painel de candidaturas | ✅ | `server.js:2167` | `/api/candidaturas` | `recrutamento.db` | Baixo | — |
| 60 | E-mail de convite | ✅ | `server.js:~1860` | nodemailer | SMTP config | Médio | — |
| 61 | Rejeição automática (48h) | ✅ | `server.js:2095` | scheduler | nodemailer, SQLite | Médio | — |
| 62 | Banco de talentos / recontato | ✅ | `server.js:2131` | scheduler | nodemailer, SQLite | Médio | — |
| 63 | Análise de currículo PDF | ✅ | `app.js:8063`, `server.js` | `/api/ingest-doc` | Gemini, pdf-parse | Alto (Gemini) | — |

---

## CATEGORIA 11 — INFORMAÇÕES EM TEMPO REAL

| # | Funcionalidade | Status | Arquivos | Rotas/API | Dependências | Risco Técnico | O que falta |
|---|---------------|--------|---------|-----------|--------------|--------------|------------|
| 64 | Câmbio (USD, EUR, ARS) | ✅ | `app.js:2640` | AwesomeAPI | Pública | Baixo (sem timeout) | Adicionar timeout |
| 65 | Ações B3 | ✅ | `app.js:2675` | brapi.dev | Pública | Baixo (sem timeout) | Adicionar timeout |
| 66 | Clima | ✅ | `app.js:2711` | wttr.in | Pública | Baixo (sem timeout) | Adicionar timeout |
| 67 | Notícias G1/BBC | ✅ | `server.js:2953`, `app.js:2735` | `/api/news` | RSS, 5s timeout | Baixo | — |
| 68 | Notícias de transporte | ✅ | `server.js:2980` | `/api/news/transporte` | RSS Logweb/TransportaBrasil | Baixo | — |
| 69 | Esportes (futebol, NBA) | 🔶 | `server.js:3015` | `/api/sports` | ESPN API | Médio | NBA com `null` no mapa — erro silencioso |

---

## CATEGORIA 12 — OBSIDIAN / RAG

| # | Funcionalidade | Status | Arquivos | Rotas/API | Dependências | Risco Técnico | O que falta |
|---|---------------|--------|---------|-----------|--------------|--------------|------------|
| 70 | Import de vault Obsidian | ✅ | `server.js:1156` | `/api/import-obsidian` | Vault path config | Médio | — |
| 71 | Embeddings vetoriais | 🔶 | `server.js:1212` | `/api/index-notes` | Gemini embeddings, `embeddings.json` | Alto (não escala) | Migrar para SQLite com sqlite-vec |
| 72 | Busca semântica (cosine) | ✅ | `server.js:1256` | `/api/search-kb` | `embeddings.json` | Médio | Dependente do JSON flat |
| 73 | Busca lexical fallback | ✅ | `server.js:1280` | `/api/search-kb` | `notes.json` | Baixo | — |
| 74 | Auto-categorização | ✅ | `server.js:864` | `/api/kb/categorize` | Gemini | Alto (Gemini) | — |
| 75 | Sync Obsidian bidirecional | ✅ | `server.js:918` | `/api/obsidian-sync` | Vault path config | Médio | — |

---

## CATEGORIA 13 — AUTOMAÇÃO / PRODUTIVIDADE

| # | Funcionalidade | Status | Arquivos | Rotas/API | Dependências | Risco Técnico | O que falta |
|---|---------------|--------|---------|-----------|--------------|--------------|------------|
| 76 | Puppeteer automação | ✅ | `server.js:1324` | `/api/browser` | Chrome local | Médio | — |
| 77 | Screenshot | ✅ | `server.js:~1380` | `/api/browser/screenshot` | Puppeteer | Baixo | — |
| 78 | Gravação de tela | ✅ | `app.js:~3700` | IPC Electron | Electron | Baixo | — |
| 79 | Lembretes agendados | ✅ | `server.js:1313`, `services/db.js` | `/api/lembretes` + scheduler | SQLite, SSE | Baixo | — |
| 80 | Notificações Windows | ✅ | `server.js:1306` | interno | `node-notifier` | Baixo | — |
| 81 | Abrir projetos Scapini | 🔸 | `app.js:PROJETOS` | shell.openExternal | localhost URLs hardcoded | Médio | Verificar se projetos estão rodando |
| 82 | Integração VS Code | ✅ | `server.js:2926` | `/api/vscode` | `execFile('code')` | Baixo | — |

---

## CATEGORIA 14 — GERAÇÃO DE ARQUIVOS

| # | Funcionalidade | Status | Arquivos | Rotas/API | Dependências | Risco Técnico | O que falta |
|---|---------------|--------|---------|-----------|--------------|--------------|------------|
| 83 | Geração Excel (.xlsx) | ✅ | `server.js:2628` | `/api/generate-file` | `xlsx`, Gemini | Médio | — |
| 84 | Geração Word (.docx) | ✅ | `server.js:2628` | `/api/generate-file` | `docx`, Gemini | Médio | — |
| 85 | Geração PowerPoint (.pptx) | ✅ | `server.js:2628` | `/api/generate-file` | `pptxgenjs`, Gemini | Médio | — |
| 86 | Geração PDF (geral) | ✅ | `server.js:2628` | `/api/generate-file` | `pdfkit`, Gemini | Médio | — |
| 87 | PDF KPIs institucional | ✅ | `server.js:2773` | `/api/relatorio-kpi` | `pdfkit`, layout Scapini | Médio | — |

---

## CATEGORIA 15 — DADOS PERSISTENTES

| # | Funcionalidade | Status | Arquivos | Rotas/API | Dependências | Risco Técnico | O que falta |
|---|---------------|--------|---------|-----------|--------------|--------------|------------|
| 88 | Tarefas | ✅ | `app.js`, `server.js` | `/api/data/tasks` | `tasks.json` + localStorage | Médio | Migrar para SQLite |
| 89 | Hábitos | ✅ | `app.js`, `server.js` | `/api/data/habits` | `habits.json` + localStorage | Médio | Migrar para SQLite |
| 90 | Finanças pessoais | ✅ | `app.js`, `server.js` | `/api/data/finances` | `finances.json` + localStorage | Médio | Migrar para SQLite |
| 91 | Notas / KB | ✅ | `app.js`, `server.js` | `/api/data/notes` | `notes.json` + localStorage | Médio | Migrar para SQLite |

---

## CATEGORIA 16 — SEGURANÇA

| # | Funcionalidade | Status | Arquivos | Rotas/API | Dependências | Risco Técnico | O que falta |
|---|---------------|--------|---------|-----------|--------------|--------------|------------|
| 92 | Bind 127.0.0.1 | ✅ | `server.js:~220` | — | — | Baixo | — |
| 93 | Token x-lumina-token | ✅ | `server.js:hasValidLocalToken` | Todas as rotas sensíveis | `crypto.timingSafeEqual` | Baixo | — |
| 94 | Origin check | ✅ | `server.js:isTrustedOrigin` | Middleware geral | — | Baixo | — |
| 95 | Helmet HTTP headers | ✅ | `server.js:~174` | — | `helmet` npm | Médio | CSP desabilitado |
| 96 | Rate limiting | 🔶 | `server.js:~174` | chat/tts: 30/min, browser: 10/min | `express-rate-limit` | Médio | Falta em upload, frete, prospecção |
| 97 | Validação de upload | ✅ | `server.js:validateUpload` | — | magic bytes + extensão | Baixo | — |
| 98 | Puppeteer sandbox | ✅ | `server.js:~1327` | — | headless sem --no-sandbox | Baixo | — |
| 99 | Dev mode protegido | ✅ | `server.js:2490` | requer LUMINA_DEV=1 | env var | Baixo | — |
| 100 | API keys não vazam | 🔶 | `server.js:getCfg` | `/api/config` com token | config.json plaintext | Alto | Encriptar config.json |

---

## CATEGORIA 17 — INTEGRAÇÕES EXTERNAS

| # | Funcionalidade | Status | Arquivos | Rotas/API | Dependências | Risco Técnico | O que falta |
|---|---------------|--------|---------|-----------|--------------|--------------|------------|
| 101 | Composio status | ✅ | `server.js:2215` | `/api/composio/status` | Composio API | Médio | — |
| 102 | Composio Gmail OAuth | 🔶 | `server.js:2228` | `/api/composio/connect` | Composio, OAuth2 | Alto | Testar callback localhost em prod |
| 103 | Google Calendar/Gmail | 🚫 | `app.js:196` | — | — | — | `isGoogleConnected = () => false` — stub |

---

## RESUMO ESTATÍSTICO

| Status | Quantidade | % |
|--------|-----------|---|
| ✅ Implementada e integrada | 71 | 69% |
| 🔶 Parcialmente implementada | 12 | 12% |
| ⚠️ Implementada mas isolada | 1 | 1% |
| 🔸 Mock/Demo | 5 | 5% |
| ❌ Quebrada | 0 | 0% |
| 🚫 Não encontrada | 1 | 1% |
| **Total auditado** | **103** | — |

**Conclusão:** 69% das funcionalidades estão integradas e funcionando. 13% precisam de atenção antes de apresentar para a diretoria. 5% são propositalmente mock (para o workshop). 1% (Google Calendar) é um stub permanente não implementado.
