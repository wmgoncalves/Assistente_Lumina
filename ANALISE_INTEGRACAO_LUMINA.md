# Análise de Integração — Lúmina IA (Scapini Transportes)

> Documento gerado em 2026-06-25 por análise completa de `server.js`, `app.js`, `main.js`, `preload.js` e serviços auxiliares.

---

## 1. Arquitetura Atual

### 1.1 Mapa de Arquivos Principais

| Arquivo | Papel | Linhas aprox. |
|---------|-------|---------------|
| `main.js` | Entry point Electron — spawn do servidor, criação da janela, Tray, atalho F6, IPC | ~170 |
| `preload.js` | Bridge segura Electron → renderer — expõe `luminaAPI` (show/hide/runCommand) | ~7 |
| `server.js` | Backend Express completo — todas as rotas, IA, TTS, DB, RH, Obsidian, Puppeteer | ~3.400 |
| `app.js` | Frontend monolítico — chat, voz, wake word, tools, UI, fallbacks locais | ~3.000+ |
| `mockData.js` | Dados mock auxiliares (DEMO_QA e conteúdo do workshop) | — |
| `services/db.js` | SQLite wrapper (better-sqlite3) — leads, cotações, contatos, lembretes, histórico | — |
| `services/logger.js` | Log de auditoria de interações em arquivo | — |
| `services/spreadsheetAnalyzer.js` | Análise de DRE/AR/Balancete em planilhas Excel | — |
| `data/recrutamento.db` | SQLite separado para candidaturas RH | — |

### 1.2 Fluxo Completo: Comando do Usuário até Resposta

```
Usuário fala/digita
       │
       ▼
[Wake Word] ── Gemini Audio API (valida "Lúmina") ──► processInput(text)
       │
       ▼
processInput(text)
  1. normalizeText()         — PT-BR abreviações e acentos
  2. learnRegex()            — extrai nome por regex
  3. trackInteraction()      — registra padrão de uso
  4. detectEmotion()         — classifica humor do usuário
  5. addMsgUI('user', text)  — exibe na UI
  6. _addThinkingDots()      — bolinhas animadas
       │
       ├─► Intercepts locais (sem IA):
       │   detectLocalDownload() → download direto de arquivo
       │   PROSPECT_CMD regex → executeTool('prospectClients')
       │   CANDIDATO_CMD regex → executeTool('prospectCandidatos')
       │   FRETE_CMD+ROTA regex → executeTool('estimarFrete')
       │   SAVE_CMD regex → executeTool('saveNote')
       │   DEMO_QA patterns → resposta local imediata
       │   tryLocalResponse() → respostas hardcoded
       │
       ├─► Nível 1: Gemini 2.5 Flash (se geminiKey e !geminiBlocked)
       │   buildSystem() → system prompt (~600 linhas)
       │   buildContextBlock() → tarefas, hábitos, finanças, notas RAG
       │   POST /api/chat (server.js)
       │   Gemini retorna texto + tool_calls opcionais
       │   executeTool(name, args) → executa tool local ou API
       │   applyInlineLearn() → extrai bloco <!--LUMINA_LEARN:...-->
       │
       ├─► Nível 2: Ollama local (se Gemini falhar)
       │   POST http://localhost:11434/api/generate
       │   Modelo: lumina-treinada (ou llama3.2:3b)
       │
       └─► Nível 3: DEMO local (se tudo falhar)
           localFallback(text) → resposta genérica pré-definida
           _showDemoMode() → badge DEMO na UI
       │
       ▼
_finalize(response, source)
  1. extractLearn() → separa bloco de aprendizado
  2. applyInlineLearn() → persiste fatos na memória
  3. sanitizeIdentity() → filtra vazamento de modelo base
  4. _streamMsgUI() → efeito typewriter na UI
  5. speak(text) → TTS em cascata:
       cfg.elevenLabsKey → speakElevenLabs()
       fallback → speakEdge() (Microsoft Neural, sem key)
       fallback → speakBrowser() (Web Speech API)
  6. logInteraction() → POST /api/log
  7. saveHist() → localStorage lumina_hist
```

### 1.3 Sincronização de Dados

```
localStorage (cache rápido)
    ↕ sync
Servidor (fonte da verdade: *.json e SQLite)
    ↕ sync automático
Obsidian Vault (~\Documents\Lumina Vault)
    └── Tarefas/, Hábitos/, Finanças/, Conhecimento/, Memória/, Conversas/
```

---

## 2. Problemas Encontrados

### 2.1 Funcionalidades Isoladas (implementadas mas sem trigger na UI)

| # | Funcionalidade | Onde está | Problema |
|---|----------------|-----------|---------|
| A | `/api/memory/consolidate` | server.js:314 | Nenhum botão ou comando de voz no app.js chama este endpoint |
| B | `/api/memory/relate` | server.js:302 | Existe no servidor, zero referência no frontend |
| C | `/api/vscode` | server.js:2927 | Rota existe, mas o tool `openVSCode` não está em `executeTool()` do app.js |
| D | `/api/export-obsidian` | server.js:2941 | Rota GET, mas nenhum botão na UI principal aciona |
| E | `/api/import-vault` | server.js:1157 | Rota existe, sem UI de upload/seleção de caminho no frontend |
| F | `/api/notes/categorize` | server.js:884 | Rota existe, jamais chamada pelo frontend |
| G | `GET /api/news/transporte` | server.js:2966 | Endpoint existente, não utilizado em nenhuma tool ou intercept |
| H | `/api/composio/connect-gmail` | server.js:2228 | Fluxo OAuth não tem redirect handler funcional (`/api/composio/callback` inexistente) |
| I | Painel `/candidaturas` | server.js:2182 | HTML servido diretamente como rota, sem botão de acesso na UI principal |
| J | `/admin` | server.js:195 | Rota serve `admin.html` mas o arquivo não aparece nos arquivos do projeto |

### 2.2 Dados Mockados / Demo

| # | Funcionalidade | Evidência |
|---|----------------|-----------|
| A | Lista de motoristas | `MOTORISTAS_DEMO` array hardcoded no app.js:1700 com 19 motoristas fictícios |
| B | Candidatos de RH | `/api/prospect-candidatos` gera candidatos **fictícios** via prompt Gemini ("Gere candidatos fictícios mas realistas") |
| C | GPS/rastreamento | Mencionado no system prompt mas não há rota nem integração real |
| D | CRM interno | Porta 5173, assume que projeto separado está rodando — sem verificação de disponibilidade |
| E | App Motoristas | Apontado para `projeto-scapini-api.onrender.com` — serviço externo não gerenciado |
| F | Plataforma Manutenção | Porta 4001 hardcoded — dependência de projeto externo |
| G | DEMO_QA | Banco de perguntas/respostas pré-definidas em `mockData.js` para o workshop |

### 2.3 Funcionalidades Parcialmente Implementadas

| # | Funcionalidade | Status parcial |
|---|----------------|---------------|
| A | Fine-tuning Ollama | Script de rebuild existe e funciona (`/api/rebuild-ollama`), mas `Modelfile.lumina` precisa existir no diretório (não incluído no repo) |
| B | ThinkingBudget adaptativo | `/api/chat` usa `temperature: 0.82` fixo, sem thinkingBudget (diferente do que `/api/consolidate`, `/api/prospect` usam 512) |
| C | Piper TTS | Infraestrutura completa, mas depende de `piper/piper.exe` e `piper/voices/*.onnx` que não fazem parte do projeto |
| D | Análise de currículo | Não há rota específica — seria via `/api/extract-doc` + chat manual |
| E | CRM interno | `consultarCRM` e `criarChamadoCRM` declarados como tools em TOOL_DECLARATIONS mas `executeTool()` em app.js **não implementa** esses cases |
| F | Lembretes agendados | `/api/remind` funciona via SSE, mas `/api/schedule-reminder` não existe — a tool `scheduleReminder` cria lembrete no banco SQLite e espera que `checkProactive()` dispare |

### 2.4 Inconsistências e Bugs

| # | Bug | Localização |
|---|-----|-------------|
| A | `consultarCRM` e `criarChamadoCRM` estão no system prompt e em TOOL_DECLARATIONS mas não têm case em `executeTool()` | app.js:2804+ |
| B | `openVSCode` está no system prompt de tools mas não existe como case em `executeTool()` | app.js |
| C | Wake word consome cota Gemini para cada bloco de áudio com som acima de 28 de amplitude — qualquer ruído ambiente gera chamada | app.js:1389 |
| D | `/api/composio/callback` referenciado em `connect-gmail` como redirectUri mas a rota não existe em server.js | server.js:2232 |
| E | `admin.html` servido em `/admin` mas arquivo não existe no projeto | server.js:195 |
| F | Cache de sessão Gemini (`_setCache`) guarda por 20 minutos — se dado financeiro mudar nesse período, Lúmina responde com dado desatualizado | app.js |
| G | `_checkAutoTrain()` chamado após cada `/api/log` — se Ollama estiver offline, gera um fetch desnecessário a cada interação | server.js:804 |

---

## 3. Gaps de Integração

### 3.1 Backend tem, Frontend não conecta

| Rota Backend | Tool/Trigger esperado | Status |
|-------------|----------------------|--------|
| `POST /api/memory/consolidate` | Botão "Consolidar memória" ou comando | Ausente |
| `GET /api/export-obsidian` | Botão no painel de configurações | Ausente |
| `POST /api/import-vault` | Upload de caminho do vault | Ausente na UI principal |
| `POST /api/notes/categorize` | Trigger automático ou botão | Ausente |
| `POST /api/vscode` | Case `openVSCode` em executeTool | Case não implementado |
| `GET /api/candidaturas` | Link acessível na UI | Só via URL direta |

### 3.2 Frontend declara, Backend não tem

| Tool declarada no app.js | Rota esperada | Status |
|--------------------------|---------------|--------|
| `consultarCRM` | `POST /api/crm/query` | Não existe |
| `criarChamadoCRM` | `POST /api/crm/ticket` | Não existe |
| `listCalendarEvents` | `GET /api/calendar` | Não existe |
| `createCalendarEvent` | `POST /api/calendar` | Não existe |
| `listEmails` | `GET /api/emails` | Não existe |
| `readEmail` | `GET /api/emails/:id` | Não existe |
| `browserAction` | já coberto por `/api/browser` | Conectado |
| `sendNotification` | já coberto por `/api/notify` | Conectado |
| `scheduleReminder` | já coberto por `/api/remind` | Conectado |

### 3.3 Módulo RH — Gap Crítico de Integração

O módulo de recrutamento é completo no backend (candidatura, entrevista, laudo, e-mails), mas:
- A UI principal não tem card/botão "Entrevistas" ou "Candidatos"
- O painel `/candidaturas` é HTML simples servido pelo servidor, sem navegação integrada
- Só acessível digitando "abre entrevistas" na Lúmina (mapeado no PROJETOS dict do app.js)
- A ferramenta `prospectCandidatos` gera ficções, não candidatos reais

### 3.4 Composio — Gap de Auth

- A rota `/api/composio/callback` (callback OAuth) **não existe** no servidor
- Sem callback, o fluxo de conexão Gmail não completa
- `send-leads` só funciona se Gmail já estiver conectado por outro meio
- Não há UI para configurar `composioKey` no painel de settings da Lúmina

---

## 4. Riscos Técnicos

### 4.1 Riscos em Produção (Apresentação à Diretoria)

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Gemini cota esgotada durante demo | Alta | Alto | DEMO_QA e tryLocal cobrem ~30 perguntas pré-definidas |
| Wake word disparando com ruído ambiente | Alta | Médio | Threshold de 28 amplitude pode ser alto em sala silenciosa |
| Puppeteer headless bloqueado por Google Maps | Alta | Médio | Prospect usa maps.google.com — bot detection pode bloquear |
| SMTP não configurado → e-mails RH falham silenciosamente | Média | Alto | Logs mostram aviso mas candidato não recebe convite |
| Port 5173/4001 offline → CRM/Manutenção não abrem | Alta | Médio | Shell.openExternal falha sem mensagem amigável |
| `Modelfile.lumina` ausente → rebuild Ollama quebra | Alta | Baixo | Ollama não é crítico para demo |
| SQLite corrompido → crash total do servidor | Baixa | Alto | Sem backup automático definido |

### 4.2 Riscos de Segurança

| Risco | Localização | Severidade |
|-------|-------------|-----------|
| Puppeteer sem sandbox | server.js:1329 `headless: true` sem `args: ['--no-sandbox']` foi removido (boa prática), mas ainda roda como processo do servidor | Médio |
| Prompt injection via notas/PDF | app.js:393 aviso "DADOS NÃO CONFIÁVEIS" no prompt, mas proteção é texto, não técnica | Médio |
| API key Gemini exposta em logs de erro | server.js:638 logs parciais do JSON de erro (sem expor key diretamente) | Baixo |
| `admin.html` sem autenticação específica (se existir) | server.js:195 | Alto |
| Dev routes (`/api/dev/*`) protegidas por `LUMINA_DEV=1` | server.js:164 | OK |
| Candidaturas GET público sem token | server.js:2168 — `GET /api/candidaturas` requer token (`requiresLocalToken`) | OK |

### 4.3 Riscos de Performance

- System prompt tem ~600 linhas de texto mais contexto dinâmico (até ~2000 tokens só de prompt)
- Wake word faz chamada ao Gemini a cada 2 segundos de áudio em ambiente com barulho
- `/api/index-notes` pode demorar muito com vault grande do Obsidian (sem limite de tamanho)
- Histórico de 200 mensagens enviado integralmente ao Gemini a cada pergunta

---

*Arquivo gerado automaticamente como parte da análise arquitetural da Lúmina v2.0.0*
