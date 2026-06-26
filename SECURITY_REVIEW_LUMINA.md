# SECURITY REVIEW — LÚMINA IA CORPORATIVA
**Scapini Transportes | 2026-06-26**

## Legenda de Severidade
- 🔴 **CRÍTICO** — Corrigir antes da apresentação
- 🟠 **ALTO** — Corrigir nas próximas sprints
- 🟡 **MÉDIO** — Importante mas não urgente
- 🟢 **BAIXO** — Melhoria futura
- ✅ **OK** — Implementado corretamente

---

## 1. REDE E BIND

| Item | Status | Detalhe |
|------|--------|---------|
| Bind exclusivo 127.0.0.1 | ✅ | `app.listen(PORT, '127.0.0.1', ...)` — confirmado loopback-only |
| Porta configurável | ✅ | `process.env.PORT \|\| 8080` |
| Bloqueio de origens externas | ✅ | `isLoopbackAddress()` + `isTrustedOrigin()` + `sec-fetch-site` |
| HTTPS | 🟢 | Sem HTTPS — aceitável pois é loopback (não sai da máquina). Baixo risco. |

**Avaliação:** Rede corretamente isolada em loopback. Sem risco de acesso externo.

---

## 2. AUTENTICAÇÃO / TOKEN

| Item | Status | Detalhe |
|------|--------|---------|
| Geração do token | ✅ | `crypto.randomBytes(32).toString('hex')` — 256 bits de entropia |
| Comparação timing-safe | ✅ | `crypto.timingSafeEqual()` — previne timing attacks |
| Token persistido em `config.json` | 🟡 | Survives restarts (intencional), mas config.json precisa de proteção |
| `/api/local-session` público | 🟡 | Retorna o token sem autenticação. Intencional — o renderer precisa obter o token ao iniciar. Risco baixo pois só acessível em loopback. |
| Monkey-patch do fetch | ✅ | `app.js` injeta `X-Lumina-Token` em todas as chamadas `/api/` automaticamente |
| Rotas sem token | 🟡 | `GET /api/news`, `GET /api/sports`, `GET /api/cnpj/:cnpj`, `GET /api/events` (SSE), `GET /api/piper-available` — todos públicos. Dados públicos, risco baixo. |
| `/api/download-doc` sem token | 🔴 | Endpoint público — qualquer processo local pode baixar arquivos de `uploads/` sem autenticação |

### Correção recomendada para `/api/download-doc`:
```javascript
// server.js — adicionar verificação de token
app.get('/api/download-doc/:filename', (req, res) => {
  if (!hasValidLocalToken(req)) return res.status(401).json({ error: 'Não autorizado' });
  // ... resto do código
});
```

---

## 3. CREDENCIAIS E SEGREDOS

| Item | Status | Detalhe |
|------|--------|---------|
| `geminiKey` em `config.json` plaintext | 🔴 | Chave de API em arquivo de texto no diretório do projeto |
| `elevenLabsKey` em `config.json` plaintext | 🔴 | Idem |
| `composioKey` em `config.json` plaintext | 🔴 | Idem |
| `smtpUser` + `smtpPass` em `config.json` plaintext | 🔴 | Credenciais SMTP em plaintext |
| `/api/config GET` retorna keys | ✅ | Só retorna se `hasValidLocalToken(req)` — protegido |
| Keys não aparecem em logs | ✅ | Não encontrado `console.log(geminiKey)` ou similar |
| Keys não vão para frontend via JS | ✅ | `persistCfgLocal()` exclui explicitamente `geminiKey` e `elevenLabsKey` do localStorage |

### Correção recomendada para `config.json`:
**Opção 1 (simples):** Mover chaves sensíveis para `.env` e usar `dotenv`:
```bash
# .env (não versionado)
GEMINI_KEY=AIzaSy...
ELEVENLABS_KEY=sk-...
COMPOSIO_KEY=...
SMTP_PASS=...
```
```javascript
// server.js
require('dotenv').config();
const geminiKey = process.env.GEMINI_KEY || getCfg().geminiKey;
```

**Opção 2 (mais segura):** Encriptar `config.json` com AES-256-GCM usando uma senha derivada do usuário Windows:
```javascript
const { createCipheriv, createDecipheriv, randomBytes } = require('crypto');
// Derivar key de LOCALAPPDATA + username do SO
```

**Recomendação:** Opção 1 é suficiente para o contexto local corporativo. Implementar antes da apresentação.

---

## 4. HELMET / HEADERS HTTP

| Header | Status | Detalhe |
|--------|--------|---------|
| `helmet()` ativo | ✅ | Aplicado globalmente |
| Content-Security-Policy | 🟠 | **Desabilitado** — `contentSecurityPolicy: false` |
| X-Content-Type-Options | ✅ | `nosniff` (helmet padrão) |
| X-Frame-Options | ✅ | `SAMEORIGIN` (helmet padrão) |
| Strict-Transport-Security | 🟢 | Não aplicável em HTTP local |
| X-XSS-Protection | ✅ | Habilitado pelo helmet |

### Por que CSP está desabilitado:
O `app.js` carrega scripts inline e faz `fetch` para domínios externos (Gemini, AwesomeAPI, brapi.dev, wttr.in). Uma CSP estrita quebraria essas chamadas.

### Correção recomendada:
Redirecionar todas as chamadas externas do frontend para rotas do servidor (já existem `/api/news`, `/api/sports`). Com isso, o frontend só faria fetch para `127.0.0.1:8080` e a CSP poderia ser habilitada:
```javascript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // necessário para app.js inline
      connectSrc: ["'self'"],                   // só localhost
      mediaSrc: ["'self'", "blob:"],
      imgSrc: ["'self'", "data:"],
    }
  }
})
```
Isso é uma melhoria futura — não bloqueia a apresentação.

---

## 5. RATE LIMITING

| Endpoint(s) | Limite | Status |
|-------------|--------|--------|
| `/api/chat`, `/api/tts`, `/api/tts-piper`, `/api/tts-edge` | 30/min | ✅ |
| `/api/browser` | 10/min | ✅ |
| `/api/upload`, `/api/ingest-doc`, `/api/transcribe-audio` | Sem limite | 🟡 |
| `/api/frete` | Sem limite | 🟡 |
| `/api/prospect-clientes` | Sem limite | 🟡 |
| `/api/generate-file` | Sem limite | 🟡 |

### Correção recomendada:
```javascript
// server.js — adicionar após os limiters existentes
const uploadLimiter = rateLimit({ windowMs: 60*1000, max: 10, message: { error: 'Limite de uploads atingido.' } });
const heavyLimiter  = rateLimit({ windowMs: 60*1000, max: 5,  message: { error: 'Aguarde antes de fazer outra solicitação.' } });

app.use('/api/ingest-doc',       uploadLimiter);
app.use('/api/transcribe-audio', uploadLimiter);
app.use('/api/frete',            heavyLimiter);
app.use('/api/prospect-clientes', heavyLimiter);
app.use('/api/generate-file',    heavyLimiter);
```

---

## 6. UPLOAD DE ARQUIVOS

| Item | Status | Detalhe |
|------|--------|---------|
| Validação de extensão | ✅ | Whitelist de extensões |
| Validação de magic bytes | ✅ | PDF: `%PDF-`, DOCX/XLSX: `PK`, XLS: OLE2 |
| Limite de tamanho | ✅ | 20MB via multer |
| Sanitização de nome | ✅ | `safeUploadName()` — timestamp + randomBytes prefix |
| Storage em memória | ✅ | `memoryStorage()` — não grava no disco sem processamento |
| Diretório de saída | 🟡 | `uploads/` no diretório do projeto. OK para local, mas sem limpeza automática de arquivos antigos |
| Rate limit em upload | 🟡 | Sem limite — ver seção 5 |

**Avaliação:** Upload bem implementado. Sem risco imediato.

---

## 7. PUPPETEER

| Item | Status | Detalhe |
|------|--------|---------|
| `--no-sandbox` desabilitado | ✅ | `puppeteer.launch({ headless: true })` — sandbox ativo |
| Singleton browser | ✅ | `getBrowser()` reutiliza instância |
| Timeout de navegação | ✅ | 30.000ms |
| Rate limit na rota | ✅ | `/api/browser` → 10/min |
| Token obrigatório | ✅ | Middleware de autenticação na rota |
| Acesso a URLs arbitrárias | 🟡 | Lúmina pode acessar qualquer URL via Puppeteer — aceitável pois só processo local autorizado envia comandos |

**Avaliação:** Puppeteer seguro para o contexto local.

---

## 8. DEV MODE

| Item | Status | Detalhe |
|------|--------|---------|
| Requer `LUMINA_DEV=1` | ✅ | Env var verificada em todas as rotas dev |
| Restrição de workspace | ✅ | `resolveWorkspacePath()` bloqueia acesso fora do projeto |
| `BLOCKED_CMDS` | 🟡 | Bloqueia `rm -rf /`, `format c:`, `del /s` — mas não todos os comandos destrutivos (`del arquivo`, `rmdir /s pasta`, PowerShell `Remove-Item`) |
| Saída truncada | ✅ | 6.000 chars máximo |
| Timeout de execução | ✅ | 30s |
| Token obrigatório | ✅ | Verificado em todas as rotas dev |

### Correção recomendada para BLOCKED_CMDS:
```javascript
const BLOCKED_CMDS = /rm\s+-rf\s+\/|format\s+[a-z]:|del\s+\/[sq]|Remove-Item.*-Recurse|rmdir\s+\/s|del\s+\*\.\*|format\s+[a-z]/i;
```

---

## 9. BANCO DE DADOS

| Item | Status | Detalhe |
|------|--------|---------|
| WAL mode | ✅ | `PRAGMA journal_mode=WAL` |
| Foreign keys ON | ✅ | `PRAGMA foreign_keys=ON` |
| Whitelist de tabelas | ✅ | `consultarBanco()` só aceita tabelas da lista |
| Prepared statements | ✅ | `db.prepare()` em todas as queries — sem SQL injection |
| `data/recrutamento.db` separado | ✅ | Dados de RH isolados |
| Backup automático | 🟡 | Sem backup automático programado |

---

## 10. PROMPT INJECTION

| Vetor | Status | Detalhe |
|-------|--------|---------|
| Documentos PDF/DOCX/TXT | 🟠 | Conteúdo do documento é inserido diretamente no contexto do Gemini sem sanitização de instruções maliciosas |
| Sites via Puppeteer | 🟠 | Conteúdo de páginas web vai para o Gemini — risco de prompt injection via site malicioso |
| RSS feeds | 🟡 | Conteúdo de RSS vai para o Gemini via busca — risco baixo pois feeds são de fontes confiáveis (G1, BBC) |
| Vault Obsidian | 🟡 | Notas do vault são injetadas no contexto — risco interno baixo |
| Respostas da API ESPN/AwesomeAPI | 🟢 | Dados estruturados JSON — risco muito baixo |

### Correção recomendada para documentos:
```javascript
// server.js — sanitizar antes de inserir no contexto
const sanitizeForLLM = (text) => {
  return text
    .replace(/ignore (previous|all|above) instructions?/gi, '[texto removido]')
    .replace(/you are now/gi, '[texto removido]')
    .replace(/system prompt/gi, '[texto removido]')
    .replace(/\[INST\]|\[\/INST\]|<\|system\|>|<\|user\|>/g, '[texto removido]');
};
```

---

## 11. CANDIDATURAS (ENDPOINT PÚBLICO)

| Item | Status | Detalhe |
|------|--------|---------|
| `/api/candidatura` POST | ✅ | Público (candidato não tem conta) |
| `/api/candidatura/:token/responder` | ✅ | Token único por candidato — sem auth extra necessária |
| Verificação de status | ✅ | Só aceita respostas se `status = 'pendente' ou 'em_andamento'` |
| Token gerado com crypto | ✅ | `crypto.randomBytes(24).toString('hex')` — 192 bits |
| Sem rate limit | 🟡 | Rota pública sem rate limiting — pode ser abusada |

### Correção recomendada:
```javascript
const candidaturaLimiter = rateLimit({ windowMs: 15*60*1000, max: 30, message: 'Muitas tentativas.' });
app.use('/api/candidatura', candidaturaLimiter);
```

---

## 12. VAZAMENTO DE INFORMAÇÃO

| Item | Status | Detalhe |
|------|--------|---------|
| Stack traces em erros | 🟠 | `res.status(500).json({ error: e.message })` — vaza detalhes técnicos internos |
| Logs com dados sensíveis | 🟡 | `console.log` sem filtro — não vaza para o exterior, mas ficam em logs locais |
| Gemini API key em URL | ✅ | Key vai no querystring da URL — mas é HTTPS para Gemini e só loopback local. Aceitável. |

### Correção para stack traces:
```javascript
// server.js — substituir nos catch blocks
catch (e) {
  console.error('[Lumina]', e); // Log técnico interno
  res.status(500).json({ error: 'Erro interno. Tente novamente.' }); // Mensagem genérica
}
```

---

## 13. RESUMO DE AÇÕES

### Antes da Apresentação (Crítico)
1. **Mover credenciais para `.env`** — `GEMINI_KEY`, `ELEVENLABS_KEY`, `COMPOSIO_KEY`, `SMTP_PASS`
2. **Proteger `/api/download-doc`** com token obrigatório

### Próximas Sprints (Alto)
3. **Rate limit em uploads e rotas pesadas** (`/api/ingest-doc`, `/api/frete`, `/api/prospect-clientes`)
4. **Sanitizar conteúdo de documentos** antes de enviar ao Gemini (anti-prompt-injection básico)
5. **Expandir BLOCKED_CMDS** no dev mode
6. **Remover stack traces** de respostas de erro da API

### Melhorias Futuras (Médio/Baixo)
7. Rate limit em `/api/candidatura` (pública)
8. CSP habilitado (requer mover fetch externas para o servidor)
9. Limpeza automática de arquivos antigos em `uploads/`
10. Backup automático do SQLite

---

## AVALIAÇÃO GERAL

**Segurança de rede:** ✅ Excelente — loopback-only, token timing-safe, origin check.  
**Segurança de credenciais:** 🔴 Crítica — API keys em plaintext no diretório.  
**Segurança de dados:** 🟡 Adequada para uso local — sem banco de dados remoto, sem transmissão de dados sensíveis para fora da máquina.  
**Segurança de uploads:** ✅ Boa — validação por magic bytes, limite de tamanho, sanitização de nome.  
**Prompt injection:** 🟠 Não mitigado — documentos e conteúdo web vão direto para o contexto do LLM.  
**Avaliação geral:** Adequado para IA local corporativa em uma máquina controlada. Os dois itens críticos (credenciais + `/api/download-doc`) devem ser corrigidos antes de qualquer demonstração para terceiros.
