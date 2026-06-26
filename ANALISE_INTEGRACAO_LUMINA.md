# ANÁLISE DE INTEGRAÇÃO — LÚMINA IA CORPORATIVA
**Scapini Transportes | Versão 2.0.0 | Análise: 2026-06-26**

---

## RESUMO EXECUTIVO

A Lúmina é uma IA corporativa local que roda em `localhost:8080` via Electron + Node.js. A arquitetura central é sólida: fallback de IA em três níveis (Gemini → Ollama → DEMO local), cascata de TTS em quatro provedores, segurança de rede adequada para ambiente local.

**O que está realmente pronto:** Chat, voz, TTS, upload de documentos, memória (em JSON), fallback de IA, RH/recrutamento, prospecção de clientes, cotação de frete, consulta CNPJ, informações em tempo real, DEMO_QA para apresentação.

**O que está mockado/demo:** 19 motoristas fictícios hardcoded, base DEMO_QA com respostas roteirizadas para o workshop, rastreamento GPS apenas preparado sem integração CGI real.

**O que está parcialmente implementado:** Embeddings RAG (funcionam mas em JSON flat, não escalam), tabela `fatos` no SQLite criada mas nunca populada (memory.json em JSON), NBA no ESPN sem implementação, Google Calendar/Gmail stub permanente.

**Risco antes da apresentação:** `config.json` com API keys em plaintext no diretório do projeto. Se o PC for compartilhado ou acessado remotamente, as chaves ficam expostas. Migração para env vars ou criptografia é recomendada antes de demonstrar para a diretoria.

---

## 1. ARQUITETURA GERAL

### 1.1 Arquivos Principais

| Arquivo | Tamanho | Função |
|---------|---------|--------|
| `main.js` | 169 linhas | Electron entry — abre janela, fork do servidor, IPC, tray, globalShortcut |
| `server.js` | ~3.400 linhas | Backend Express — todas as APIs, integrações externas, scheduler |
| `app.js` | 9.587 linhas | Frontend — UI, voz, chat, tools declaradas, módulos de exibição |
| `preload.js` | < 50 linhas | IPC bridge Electron (contextIsolation) |
| `services/db.js` | 242 linhas | Singleton SQLite com auto-migrate |
| `package.json` | — | Manifesto, scripts, dependências |

### 1.2 Bancos de Dados e Persistência

| Arquivo | Conteúdo | Motor | Adequado? |
|---------|----------|-------|-----------|
| `Lumina.db` | leads, cotacoes, contatos, lembretes, historico, fatos | SQLite WAL | Sim |
| `data/recrutamento.db` | candidaturas RH | SQLite | Sim |
| `config.json` | API keys, SMTP, parâmetros de frete | JSON plaintext | Risco de segurança |
| `memory.json` | Fatos da memória, relacionamentos | JSON | Deveria ir para SQLite |
| `notes.json` | Base de conhecimento (KB) | JSON | Deveria ir para SQLite |
| `tasks.json` | Tarefas do usuário | JSON | Deveria ir para SQLite |
| `habits.json` | Hábitos | JSON | Deveria ir para SQLite |
| `finances.json` | Finanças pessoais | JSON | Deveria ir para SQLite |
| `embeddings.json` | Vetores RAG | JSON flat | Não escala — deveria ir para SQLite |
| `ollama-train-state.json` | Estado do fine-tuning | JSON | OK manter como JSON |

### 1.3 Fluxo Principal — Do Comando à Resposta

```
Usuário fala/digita
        │
        ▼
app.js: stripAccents() + normText() + ABBR_MAP (30+ abreviações PT-BR)
        │
        ├─► Wake word gate (apenas para voz)
        │     SpeechRecognition API, NFD/NFC normalizado para Chrome
        │
        ▼
processInput()
        │
        ├─► Interceptações locais (em ordem de prioridade):
        │     1. Ativação da apresentação ("iniciar apresentação")
        │     2. Projetos Scapini (abrir localhost:5678, 5173, etc.)
        │     3. Respostas locais imediatas (saudações, status)
        │     4. Prospecção de clientes
        │     5. Captação de candidatos
        │     6. Treinar Ollama ("treinar ollama")
        │     7. DEMO_QA (pares regex→resposta para workshop)
        │     8. Auto-chart (DRE, mês)
        │     9. Identidade (quem criou, origem)
        │    10. Cotação de frete
        │    11. Salvar dado explícito
        │
        ├─► [Nível 1] Gemini 2.5 Flash
        │     callGemini() → fetch direto para API Gemini (sem /api/chat)
        │     30+ tools via function_calling
        │     thinkingBudget adaptativo (0 / 512 / 2048)
        │     Se ok → sanitizeIdentity() → _finalize(resp, 'gemini')
        │     Se erro → _handleGeminiErr() → bloqueia 15–30s
        │
        ├─► [Nível 2] Ollama local
        │     ollamaAvailable() → callOllama()
        │     http://localhost:11434/api/generate
        │     modelo: lumina-treinada (configurável)
        │     Se ok → _finalize(resp, 'ollama') + badge "⚡ local"
        │
        └─► [Nível 3] DEMO local
              localFallback(text) → base de 365+ tópicos PT-BR
              _finalize(resp, 'demo') + _showDemoMode()
```

### 1.4 Fluxo de Voz

```
Microfone → SpeechRecognition API (Chrome)
         → stripAccents() [NFD→NFC — fix para Chrome que retorna NFD]
         → checar wake word ("lúmina", "lumina", variações)
         → se ativado → conversa contínua (não precisa repetir wake word)
         → processInput() com texto transcrito
         → resposta → TTS cascade
```

### 1.5 TTS Cascade

```
TTS solicitado
    │
    ├─► ElevenLabs (se elevenLabsKey configurada)
    │     POST /api/tts → proxy para elevenlabs.io
    │
    ├─► Piper TTS (se piper/piper.exe existe + voz configurada)
    │     POST /api/tts-piper → spawn piper.exe local
    │
    ├─► Edge TTS (padrão recomendado — sem API key)
    │     POST /api/tts-edge → npm msedge-tts
    │     Pré-fetch paralelo de chunks → playback sem gaps
    │     Voz: pt-BR-ThalitaNeural
    │
    └─► Browser SpeechSynthesis (fallback nativo)
          window.speechSynthesis.speak()
```

### 1.6 Fluxo de Upload de Documentos

```
Usuário arrasta/seleciona arquivo
    │
    ├─► validateUpload(): extensão + magic bytes
    │     PDF: %PDF-
    │     DOCX/XLSX: PK 0x50 0x4B (ZIP)
    │     XLS: OLE2 8 bytes
    ├─► multer memoryStorage (limite 20MB)
    ├─► safeUploadName(): timestamp + random prefix
    ├─► Extração:
    │     PDF → pdf-parse
    │     DOCX → mammoth
    │     XLSX → xlsx + parser especializado DRE/AR/Balancete
    │     TXT → leitura direta
    ├─► Chunking: 800 chars, overlap 100
    └─► Retorna texto → injetado no contexto do chat
```

---

## 2. INTEGRAÇÃO ENTRE MÓDULOS

### 2.1 Chat ↔ IA ✅ Integrado
Direto e funcional. `callGemini()` no frontend chama a API Gemini diretamente. O `/api/chat` no servidor existe com fallback Ollama mas não é usado pelo chat principal (intencional — reduz latência).

### 2.2 Chat ↔ Memória ⚠️ Parcial
Memória carrega no startup (`syncFromServer`) e é injetada no contexto do Gemini. Salvamento funciona via `serverSave('mem', ...)`. Mas é JSON flat — sem busca por data, categoria ou entidade.

### 2.3 Chat ↔ Documentos ✅ Integrado
Após upload, texto extraído é injetado no contexto. Busca na KB via RAG ou lexical. Funcional.

### 2.4 Chat ↔ Voz ↔ TTS ✅ Integrado
Pipeline completa: microfone → transcrição → processInput → resposta → TTS. Todos os provedores com fallback.

### 2.5 Fallback IA ✅ Integrado (3 níveis)
Confirmado funcionando: Gemini → Ollama → DEMO local. Badge "⚡ local" aparece no modo Ollama. DEMO_QA não mostra erro técnico.

### 2.6 Excel/DRE ↔ Financeiro ✅ Integrado
Upload de planilha → parser especializado DRE/AR/Balancete → análise via Gemini → resposta com gráficos. Geração de relatório KPI em PDF com layout Scapini.

### 2.7 RH ↔ Entrevista ↔ E-mails ✅ Integrado
Pipeline completo: criação de entrevista → link único → candidato responde no celular → Gemini avalia → painel atualiza → email automático de rejeição/aprovação → banco de talentos.

### 2.8 Prospecção ↔ Composio/Gmail ⚠️ Parcial
Prospecção gera leads no SQLite. Composio/Gmail envia e-mails dos leads. OAuth callback via localhost — pode ter problema em alguns ambientes.

### 2.9 Obsidian ↔ RAG ✅ Integrado (mas não escala)
Import de vault, sync bidirecional, embeddings gerados via Gemini. RAG com cosine similarity funciona. Problema: `embeddings.json` cresce indefinidamente.

### 2.10 Puppeteer ↔ Segurança ✅ Isolado e seguro
Sem `--no-sandbox`, headless, singleton, timeout 30s. Rotas requerem token.

---

## 3. PROBLEMAS ENCONTRADOS

### 3.1 Críticos (corrigir antes da apresentação)

| # | Problema | Risco | Arquivo |
|---|---------|-------|---------|
| C1 | `config.json` com API keys, SMTP e Composio em plaintext | Exposição de credenciais se PC compartilhado | raiz do projeto |
| C2 | Helmet CSP desabilitado (`contentSecurityPolicy: false`) | XSS não mitigado por política de conteúdo | `server.js:~176` |
| C3 | `/api/download-doc` público sem token | Qualquer processo local acessa arquivos de uploads/ | `server.js:~736` |

### 3.2 Importantes (próximas sprints)

| # | Problema | Risco | Arquivo |
|---|---------|-------|---------|
| I1 | 5 arquivos JSON de dados pessoais em vez de SQLite | Sem busca estruturada, sem backup único | servidor |
| I2 | `embeddings.json` não escala | Performance degradada com volume crescente | `server.js` |
| I3 | Tabela `fatos` criada mas nunca populada | Funcionalidade prevista e não usada | `services/db.js` |
| I4 | `isGoogleConnected = () => false` stub permanente | Confunde usuário que espera integração Google | `app.js:196` |
| I5 | NBA no mapa ESPN com `null` | Erro silencioso ao perguntar sobre NBA | `server.js:~3024` |
| I6 | Gemini sem AbortSignal em `/api/chat` | Requisição pode travar indefinidamente | `server.js:~354` |
| I7 | `MOTORISTAS_DEMO` hardcoded | Dados fictícios podem aparecer fora de contexto de demo | `app.js:~1700` |
| I8 | Rate limit ausente em `/api/upload`, `/api/frete`, `/api/prospeccao` | Sem proteção contra abuso local | `server.js` |

### 3.3 Melhorias Futuras

| # | Melhoria | Impacto |
|---|---------|---------|
| M1 | Migrar dados JSON para SQLite | Consultas estruturadas, integridade, backup único |
| M2 | CSP adequado para Electron | XSS mitigado |
| M3 | Timeout no Gemini de `/api/chat` | Resiliência |
| M4 | Remover NBA ou implementar | UX consistente |
| M5 | Rate limit em uploads e frete | Segurança adicional |
| M6 | Encriptar `config.json` ou mover para env vars | Segurança de credenciais |

---

## 4. MODELO DE DADOS IDEAL

### 4.1 Tabelas já existentes (manter)
```
leads          — prospecção, status de pipeline CRM
cotacoes       — fretes calculados com parâmetros completos
contatos       — agenda de contatos
lembretes      — agendamentos com scheduler ativo
historico      — log de conversas (role, conteudo, source, ms)
candidaturas   — RH (recrutamento.db separado)
```

### 4.2 Tabelas a criar / migrar

```sql
-- Substitui memory.json
CREATE TABLE memorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conteudo TEXT NOT NULL,
  tipo TEXT DEFAULT 'fato',     -- fato | relacionamento | preferencia
  entidade TEXT,
  peso REAL DEFAULT 1.0,
  criado_em TEXT DEFAULT (datetime('now')),
  atualizado_em TEXT DEFAULT (datetime('now'))
);

-- Substitui notes.json / KB
CREATE TABLE conhecimento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT,
  conteudo TEXT NOT NULL,
  categoria TEXT,
  tags TEXT,    -- JSON array
  fonte TEXT,   -- obsidian | manual | gemini | upload
  hash TEXT UNIQUE,
  criado_em TEXT DEFAULT (datetime('now'))
);

-- Substitui embeddings.json
CREATE TABLE embeddings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_tipo TEXT NOT NULL,   -- conhecimento | memoria | historico
  ref_id INTEGER NOT NULL,
  vector BLOB NOT NULL,     -- Float32Array serializado
  modelo TEXT DEFAULT 'text-embedding-004',
  criado_em TEXT DEFAULT (datetime('now'))
);

-- Substitui tasks.json
CREATE TABLE tarefas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  texto TEXT NOT NULL,
  done INTEGER DEFAULT 0,
  prioridade TEXT DEFAULT 'normal',
  data_limite TEXT,
  criado_em TEXT DEFAULT (datetime('now'))
);

-- Substitui habits.json + registros
CREATE TABLE habitos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  frequencia TEXT DEFAULT 'diario',
  criado_em TEXT DEFAULT (datetime('now'))
);
CREATE TABLE habito_registros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habito_id INTEGER REFERENCES habitos(id),
  data TEXT NOT NULL,
  feito INTEGER DEFAULT 1
);

-- Substitui finances.json
CREATE TABLE financas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,      -- receita | despesa
  descricao TEXT NOT NULL,
  valor REAL NOT NULL,
  categoria TEXT,
  data TEXT DEFAULT (date('now')),
  criado_em TEXT DEFAULT (datetime('now'))
);
```

---

## 5. INTEGRAÇÕES EXTERNAS — STATUS

| Serviço | Configuração | Tem Fallback | Pode Travar | Ação |
|---------|-------------|-------------|-------------|------|
| Gemini API | `config.json → geminiKey` | Sim (Ollama→DEMO) | Sim (sem timeout em /api/chat) | Adicionar AbortSignal |
| Ollama | localhost:11434 timeout 30s | DEMO local | Não | OK |
| ElevenLabs | `config.json → elevenLabsKey` | Sim (Piper→Edge→Browser) | Não | OK |
| Edge TTS | npm msedge-tts | Browser TTS | Não | OK |
| Piper | piper/piper.exe local | Edge TTS | Não | OK |
| Composio | `config.json → composioKey` | Nenhum | Sim | Adicionar timeout |
| Nominatim | Público, 8s timeout | Nenhum | Não | OK |
| OSRM | Público, 10s timeout | Nenhum | Não | OK |
| BrasilAPI | Público, 5s timeout | ReceitaWS→cnpj.ws | Não | OK |
| AwesomeAPI | Público | Nenhum | Sim (sem timeout) | Adicionar timeout |
| brapi.dev | Público | Nenhum | Sim (sem timeout) | Adicionar timeout |
| wttr.in | Público | Nenhum | Sim (sem timeout) | Adicionar timeout |
| ESPN | Público, 6s timeout | Silencioso | Não | Corrigir NBA |
| RSS G1/BBC | Público, 5s timeout | Silencioso | Não | OK |
| SMTP/nodemailer | `config.json → smtp*` | Nenhum | Sim | Adicionar timeout |
| Puppeteer | Local Chrome | Nenhum | Sim (8s timeout) | OK |

---

## 6. UX E FLUXO OPERACIONAL

### 6.1 O que o usuário vê
- Chat principal com bubbles de mensagem
- Badge "⚡ local" quando Ollama está sendo usado (implementado)
- Badge "DEMO" visível quando sem IA
- Ícone na system tray (F6 mostra/esconde)
- Notificações Windows nativas

### 6.2 Comandos sem botão na interface
Os seguintes comandos existem mas não têm botão visível — apenas por texto/voz:
- `treinar ollama` — força rebuild do modelo
- `status ollama` — mostra status do fine-tuning
- `iniciar apresentação` — ativa modo DEMO_QA
- `abrir [projeto]` — abre sistemas internos Scapini
- `screenshot` — captura tela
- `gravar tela` — inicia gravação

### 6.3 Erros ao usuário
- Erros técnicos nunca aparecem ao usuário (fallback para DEMO local)
- Timeout de Gemini → fallback silencioso para Ollama
- Ollama offline → fallback silencioso para DEMO
- Mensagens de erro de TTS → fallback para próximo provedor automaticamente

### 6.4 Pontos de melhoria UX
- Não há indicação clara de qual módulo está ativo (financeiro, RH, etc.)
- Comandos sem botão deveriam ter atalhos visíveis
- Status das integrações (Gemini conectado/offline, Ollama rodando) não aparece na UI
