---
name: open-redirect-and-race-conditions-hardening
description: Defesa contra Open Redirect (next/return_to/callback/redirect aceitando URL arbitraria, bypass via //evil.com, %2F%2F, javascript:, @, fragment, homograph) e Race Conditions/TOCTOU (double-spend, cupom usado N vezes, saque sem lock, estoque sem locking, reset de senha multi-uso, voto duplicado, anti duplo-envio de form, webhook sem idempotencia, prototype pollution). Inclui safeRedirect helper PHP+Node, padroes SELECT FOR UPDATE, UPDATE condicional, UNIQUE constraint, lock distribuido Redis, Idempotency-Key. Use em qualquer projeto com login com return URL, OAuth, pagamento, saque, cupom, estoque, voto, reset de senha, submissao critica de form ([PLATAFORMA]), webhook ou contador.
---

# open-redirect-and-race-conditions-hardening

> **Frase-guia:** Redirect só por allowlist; operação crítica só atômica e idempotente. Frontend "disabled" é UX, não segurança.

## 0. Regra suprema

Segurança tem prioridade absoluta. Conveniência de redirect (UTM, retorno pós-login, próxima página, callback OAuth) **não** justifica aceitar URL arbitrária do usuário. Performance **não** justifica abrir mão de transação atômica em operação financeira/crítica.

Correção incremental. Não substituir skills existentes. Não enfraquecer `/preserve-existing-behavior`.

---

## 1. Objetivo

Cobrir dois vetores subestimados que combinam-se com phishing, IDOR, double-spend e bypass de validação:

### Parte 1 — Open Redirect

- Redirecionamento controlado pelo usuário sem validação
- Parâmetros típicos: `?next=`, `?redirect=`, `?return_to=`, `?continue=`, `?callback=`, `?url=`, `?go=`, `?to=`, `?dest=`
- Bypass via protocolo (`javascript:`, `data:`, `vbscript:`)
- Bypass via autoreferência (`//evil.com` — browser entende como `https://evil.com`)
- Bypass via path traversal disfarçado (`/login?next=//evil.com/login`)
- Open Redirect como **vetor de phishing** (link parece legítimo, redireciona após clique)
- Open Redirect em **OAuth callback** (vaza `code`/`access_token`/`state`)
- Open Redirect em meta refresh / `window.location.href = userInput`
- Reverse tabnabbing (aba aberta via `target=_blank` troca conteúdo da pai)

### Parte 2 — Race Conditions / TOCTOU (Time-of-Check / Time-of-Use)

- **Double-spend**: clicar pagar 2x antes do servidor responder
- **Cupom usado N vezes** simultâneas (limite "primeiros 100" furado)
- **Saque que ultrapassa saldo** (duas requisições paralelas leem mesmo saldo)
- **Reserva de estoque** (último item vendido N vezes)
- **Reset de senha com token usado N vezes**
- **Voto duplicado**
- **Promoção limitada** a primeiros N usuários
- **Anti duplo-envio de formulário** ([PLATAFORMA] — já mitigado, vale documentar padrão)
- **Counter sem atomicidade**
- **Check-then-act sem lock**
- **Filesystem TOCTOU** (verificar arquivo, então abrir — pode trocar)
- **Webhook idempotente** (gateway envia 3x para garantir entrega)

### Parte 3 — Prototype Pollution (anexo lógico)

- Merge deep aceitando `__proto__`/`constructor`/`prototype` polui `Object.prototype`
- JSON.parse com reviver não-protegido

---

## 2. Por que esta skill existe

Hoje esses vetores aparecem apenas como **item de checklist** em `/test-coverage-guard` e `/secure-code-review`, mas merecem skill dedicada porque:

- Open Redirect é vetor central de phishing direcionado
- Race conditions são causa direta de prejuízo financeiro
- OAuth callback aberto vaza token (bypass de autenticação)
- Frontend "disabled em click" enganou muita gente que achou que estava seguro
- Estes vetores combinam com IDOR, double-spend, bypass

---

## 3. Prioridade

1. Bloquear **OAuth callback aberto** (vaza token = sequestro de conta)
2. Bloquear **pagamento/saque sem idempotência** (prejuízo direto)
3. Bloquear **cupom/estoque sem lock** (prejuízo)
4. Bloquear **redirect que aceita URL arbitrária** (phishing)
5. Bloquear **double-submit em form crítico**
6. Aplicar padrão de **validação de redirect** (allowlist)
7. Aplicar padrão de **transação/lock** em operação financeira
8. Bloquear **prototype pollution** em JS
9. UX: redirecionamento e formulários continuam fluidos

---

## 4. Quando usar

### 4.1 Open Redirect

- Login/signup com return URL (`?next=`)
- Logout com return URL
- OAuth/SSO com callback parametrizado
- Página de "saindo do site" com URL externa
- Encurtador interno (`/r/abc → URL`)
- Compartilhamento com tracking (`?utm_redirect=`)
- Newsletter com tracking de clique
- Redirect pós-pagamento

### 4.2 Race Conditions

- Pagamento (server-side checkout, webhook)
- Saldo / wallet / saque
- Cupom / desconto com limite de uso
- Estoque com unidade limitada
- Vagas em curso/evento
- Voto / like em conteúdo
- Reset de senha com token de uso único
- **Submissão de teste/formulário** ([PLATAFORMA])
- Counter / contador / numerador de pedido
- Geração de cupom único
- Geração de slug único
- Job de fila processando o mesmo item 2x
- Webhook de gateway entregue múltiplas vezes

---

## 5. Quando pode não se aplicar diretamente

- Site puramente estático sem redirect ou form server-side
- Aplicação single-user offline
- Operações idempotentes por natureza (GET de leitura sem efeito)

Mesmo assim, manter higiene preventiva (allowlist de redirect = boa prática sempre).

---

## 6. Open Redirect — regras

### 6.1 Princípio

**Nunca redirecionar para URL controlada pelo usuário sem validação.** Sempre allowlist OU validação estrita (mesma origem, path relativo).

### 6.2 safeRedirect helper — PHP

```php
<?php
// app/helpers/redirect.php

declare(strict_types=1);

/**
 * Redireciona com seguranca.
 * Aceita apenas: path relativo OU host em allowlist exata.
 * Bloqueia: //evil, javascript:, data:, @, fragment-only.
 */
function safe_redirect(string $input, string $fallback = '/'): void {
    $target = resolve_safe_url($input, $fallback);
    header("Location: $target", true, 302);
    exit;
}

function resolve_safe_url(string $input, string $fallback): string {
    // Normaliza espacos
    $input = trim($input);
    if ($input === '') return $fallback;

    // Bloqueia protocolos perigosos
    if (preg_match('/^(javascript|data|vbscript|file):/i', $input)) {
        return $fallback;
    }

    // Bloqueia // (autoreferenca = host externo)
    if (substr($input, 0, 2) === '//' || substr($input, 0, 4) === '\\\\\\\\') {
        return $fallback;
    }

    // Bloqueia codificacoes de //
    if (preg_match('/^%2[fF]%2[fF]/', $input)) {
        return $fallback;
    }

    // Path relativo simples (comeca com /, nao tem // depois)
    if (substr($input, 0, 1) === '/' && substr($input, 0, 2) !== '//') {
        // Decodifica para checar
        $decoded = urldecode($input);
        if (strpos($decoded, '//') === 0 || strpos($decoded, '/\\') === 0) {
            return $fallback;
        }
        return $input;
    }

    // URL completa: validar host contra allowlist
    $parsed = parse_url($input);
    if (!is_array($parsed) || !isset($parsed['host'])) {
        return $fallback;
    }

    // Bloqueia user-info no URL (https://site.com@evil.com)
    if (isset($parsed['user']) || isset($parsed['pass'])) {
        return $fallback;
    }

    $allowedHosts = [
        'dominio.com.br',
        'app.dominio.com.br',
        'painel.dominio.com.br',
    ];

    $host = strtolower($parsed['host']);

    // Verifica host exato (nao por endsWith — bloqueia dominio.com.br.evil.com)
    if (!in_array($host, $allowedHosts, true)) {
        return $fallback;
    }

    // Normaliza Unicode/IDN
    if (function_exists('idn_to_ascii')) {
        $ascii = idn_to_ascii($host, IDNA_NONTRANSITIONAL_TO_ASCII, INTL_IDNA_VARIANT_UTS46);
        if ($ascii === false || !in_array($ascii, $allowedHosts, true)) {
            return $fallback;
        }
    }

    return $input;
}
```

### 6.3 safeRedirect helper — Node/TypeScript

```ts
// app/helpers/redirect.ts

const ALLOWED_HOSTS = new Set([
  'dominio.com.br',
  'app.dominio.com.br',
  'painel.dominio.com.br',
]);

const ORIGIN = 'https://dominio.com.br';

export function safeRedirect(input: string, fallback = '/'): string {
  if (!input || typeof input !== 'string') return fallback;
  const trimmed = input.trim();

  // Bloqueia protocolos perigosos
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return fallback;
  }

  // Bloqueia // e \\
  if (trimmed.startsWith('//') || trimmed.startsWith('\\\\')) {
    return fallback;
  }

  // Bloqueia codificacao
  if (/^%2[fF]%2[fF]/.test(trimmed)) {
    return fallback;
  }

  // Path relativo
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    try {
      const decoded = decodeURIComponent(trimmed);
      if (decoded.startsWith('//') || decoded.startsWith('/\\')) {
        return fallback;
      }
      return trimmed;
    } catch {
      return fallback;
    }
  }

  // URL completa
  try {
    const url = new URL(trimmed, ORIGIN);

    // Bloqueia user-info
    if (url.username || url.password) return fallback;

    // Bloqueia non-HTTPS em prod
    if (url.protocol !== 'https:') return fallback;

    // Host exato
    if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return fallback;

    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}
```

Uso em Express/Next:
```ts
app.get('/auth/callback', (req, res) => {
  const dest = safeRedirect(String(req.query.next ?? ''), '/dashboard');
  res.redirect(dest);
});
```

### 6.4 OAuth callback — regras específicas

- `redirect_uri` deve estar em **allowlist exata** no provider (Google Cloud Console, GitHub OAuth Apps)
- **Nunca usar wildcard** (`https://*.dominio.com.br/callback`) salvo absoluta necessidade
- O parâmetro `state` é para **CSRF**, não para roteamento — não confiar em `state` como destino
- Validar `state` server-side (gerar antes, validar exato)
- Validar `redirect_uri` server-side **antes** de iniciar fluxo
- Em fluxo PKCE: validar `code_verifier`

### 6.5 Proibições absolutas

```php
// ❌ PROIBIDO
header("Location: " . $_GET['url']);
header("Location: " . $_GET['next']);
```

```js
// ❌ PROIBIDO
res.redirect(req.query.next);
res.redirect(req.body.returnTo);
window.location = params.get('to');
window.location.replace(decodeURIComponent(returnUrl));
```

```html
<!-- ❌ PROIBIDO -->
<meta http-equiv="refresh" content="0;url=${userInput}">
```

### 6.6 Bypass conhecidos a bloquear

Testar com cada um destes inputs:

```text
//evil.com                          → autoreferência → https://evil.com
\\\\evil.com                          → IE/legado
javascript:alert(document.cookie)   → execução JS
data:text/html,<script>...          → execução JS em data URI
https://meusite.com.evil.com        → host parcial bate (validar exato!)
https://meusite.com@evil.com        → user-info no URL
http://evil.com#meusite.com         → fragment não importa
%2F%2Fevil.com                      → URL-encoded slashes
%2f%2fevil.com                      → lowercase encoded
//%65vil.com                        → encoded char
https://meusіte.com (cirílico і)    → IDN/homograph
http://evil.com/?redirect=meusite.com   → query trick
0x7f.0x00.0x00.0x01 (decimal/hex)   → IP encoding
```

### 6.7 Reverse tabnabbing

Em link com `target="_blank"`:

```html
<!-- ❌ ANTIGO (CVE) -->
<a href="https://site-confiavel.com" target="_blank">Link</a>

<!-- ✅ ATUAL -->
<a href="https://site-externo.com" target="_blank" rel="noopener noreferrer">Link</a>
```

Browsers modernos já aplicam `noopener` por default em `target=_blank`, mas explicitar é prudente.

---

## 7. Race Conditions — regras

### 7.1 Princípio

**Check-then-act precisa ser atômico.** O ideal é não ter "check" separado de "act" — fazer tudo numa só operação atômica do banco/Redis.

### 7.2 Padrão 1 — Transação + lock pessimista (SQL)

Indicado para operações complexas que precisam ler + decidir + escrever.

```sql
BEGIN;
SELECT saldo FROM wallets WHERE user_id = ? FOR UPDATE;
-- aplicação verifica saldo no PHP/Node
UPDATE wallets SET saldo = saldo - ? WHERE user_id = ?;
INSERT INTO transactions (...) VALUES (...);
COMMIT;
```

```php
// PHP/PDO
$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare("SELECT saldo FROM wallets WHERE user_id = ? FOR UPDATE");
    $stmt->execute([$userId]);
    $saldo = (float) $stmt->fetchColumn();

    if ($saldo < $valor) {
        $pdo->rollBack();
        throw new RuntimeException('Saldo insuficiente');
    }

    $pdo->prepare("UPDATE wallets SET saldo = saldo - ? WHERE user_id = ?")
        ->execute([$valor, $userId]);
    $pdo->prepare("INSERT INTO transactions (user_id, valor, tipo) VALUES (?, ?, 'saque')")
        ->execute([$userId, $valor]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
}
```

### 7.3 Padrão 2 — UPDATE condicional (sem SELECT separado)

Mais eficiente, **atômico** por natureza.

```sql
UPDATE wallets SET saldo = saldo - ?
WHERE user_id = ? AND saldo >= ?;
-- se affected_rows = 0, recusar (sem saldo)
```

```php
$stmt = $pdo->prepare("UPDATE wallets SET saldo = saldo - ? WHERE user_id = ? AND saldo >= ?");
$stmt->execute([$valor, $userId, $valor]);
if ($stmt->rowCount() === 0) {
    throw new RuntimeException('Saldo insuficiente');
}
```

### 7.4 Padrão 3 — Constraint única + INSERT IGNORE

Indicado para "garantir único" (cupom usado uma vez, voto único).

```sql
-- Schema:
CREATE TABLE cupons_usados (
  cupom_id INT NOT NULL,
  user_id INT NOT NULL,
  usado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (cupom_id, user_id)
);

-- Uso:
INSERT IGNORE INTO cupons_usados (cupom_id, user_id) VALUES (?, ?);
-- affected_rows = 0 → já usou
```

```php
$stmt = $pdo->prepare("INSERT IGNORE INTO cupons_usados (cupom_id, user_id) VALUES (?, ?)");
$stmt->execute([$cupomId, $userId]);
if ($stmt->rowCount() === 0) {
    throw new RuntimeException('Cupom já utilizado');
}
```

### 7.5 Padrão 4 — Lock distribuído (Redis)

Indicado para coordenar múltiplos processos / múltiplos servidores.

```ts
// Node + ioredis
async function withLock<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const acquired = await redis.set(key, '1', 'NX', 'EX', ttlSeconds);
  if (!acquired) throw new Error('Operação em andamento');
  try {
    return await fn();
  } finally {
    await redis.del(key);
  }
}

// Uso
await withLock(`pay:user:${userId}`, 10, async () => {
  // operação crítica
});
```

⚠️ **Atenção:** Redis lock simples tem edge cases. Em alta concorrência, considerar **Redlock** (algoritmo distribuído mais robusto).

### 7.6 Padrão 5 — Idempotência por chave

Indicado para **pagamento, API, webhook**.

```ts
// API recebe header Idempotency-Key (UUID gerado pelo cliente)
async function processPayment(req: Request) {
  const key = req.headers['idempotency-key'];
  if (!key) throw new Error('Idempotency-Key obrigatório');

  // Buscar resultado anterior
  const existing = await db.idempotency.findUnique({ where: { key } });
  if (existing) return existing.response;

  // Processar
  const result = await chargePayment(req.body);

  // Salvar resposta
  await db.idempotency.create({
    data: { key, response: result, createdAt: new Date() }
  });

  return result;
}
```

Schema sugerido:
```sql
CREATE TABLE idempotency (
  key VARCHAR(64) PRIMARY KEY,
  response JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (created_at)
);
-- TTL: limpar registros > 24h
```

### 7.7 Padrão 6 — Anti duplo-envio em form ([PLATAFORMA])

Caso real **já mitigado** no projeto, vale documentar:

```php
// teste/submit.php
$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare("
        SELECT id, status FROM participants
        WHERE token_hash = ?
        FOR UPDATE
    ");
    $stmt->execute([$tokenHash]);
    $p = $stmt->fetch();

    if (!$p) {
        $pdo->rollBack();
        die('Token inválido');
    }
    if ($p['status'] === 'completed') {
        $pdo->rollBack();
        die('Já enviado anteriormente');
    }

    // Marcar como em andamento
    $pdo->prepare("UPDATE participants SET status = 'completed', completed_at = NOW() WHERE id = ?")
        ->execute([$p['id']]);

    // Gravar respostas
    $rid = insertResponse($pdo, $p['id']);
    foreach ($answers as $a) {
        insertAnswer($pdo, $rid, $a);
    }
    insertResult($pdo, $rid, $calculated);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    log_error($e);
    die('Erro ao processar — tente novamente');
}
```

### 7.8 Padrão 7 — Estoque

```sql
UPDATE produtos SET estoque = estoque - 1
WHERE id = ? AND estoque > 0;
-- affected = 0 → sem estoque
```

### 7.9 Padrão 8 — Token de uso único (reset de senha)

```sql
UPDATE password_reset_tokens
SET used_at = NOW()
WHERE token_hash = ?
  AND used_at IS NULL
  AND expires_at > NOW();
-- affected = 0 → inválido/usado/expirado
```

```php
$stmt = $pdo->prepare("
    UPDATE password_reset_tokens
    SET used_at = NOW()
    WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
");
$stmt->execute([hash('sha256', $token)]);
if ($stmt->rowCount() === 0) {
    throw new RuntimeException('Token inválido ou expirado');
}
// Agora pode trocar a senha
```

### 7.10 Padrão 9 — Webhook idempotente

```ts
async function handleWebhook(req: Request) {
  // 1. Validar HMAC
  if (!verifyHmac(req.body, req.headers['x-signature'], SECRET)) {
    return reply(401);
  }

  // 2. Identificar event_id único do gateway
  const eventId = req.body.id || req.body.event_id;
  if (!eventId) return reply(400);

  // 3. Dedupe
  const exists = await db.webhookProcessed.findUnique({ where: { eventId } });
  if (exists) return reply(200); // já processado, OK para o gateway

  // 4. Processar em transação
  await db.$transaction(async (tx) => {
    await tx.webhookProcessed.create({ data: { eventId, processedAt: new Date() } });
    await processBusiness(tx, req.body);
  });

  return reply(200);
}
```

### 7.11 Padrão 10 — Filesystem TOCTOU

```ts
// ❌ ERRADO — check-then-act vulnerável
if (fs.existsSync(filepath)) {
  // outra thread/processo pode trocar entre as duas linhas
  const data = fs.readFileSync(filepath);
}

// ✅ CORRETO — uma única syscall
try {
  const data = fs.readFileSync(filepath); // erro se não existir
} catch (e) {
  if (e.code === 'ENOENT') { /* não existia */ }
  else throw e;
}

// ✅ Criar exclusivo
const fd = fs.openSync(filepath, 'wx'); // EEXIST se já existir
```

```php
// PHP — flock para acesso concorrente a arquivo
$fp = fopen($filepath, 'c+');
if (flock($fp, LOCK_EX)) {
    // operação crítica
    flock($fp, LOCK_UN);
}
fclose($fp);
```

---

## 8. Prototype Pollution (JS) — defesa

### 8.1 Bloquear chaves perigosas em merge

```ts
// ❌ vulnerável
function merge(t: any, s: any) {
  for (const k in s) t[k] = s[k]; // aceita __proto__
}

// ✅ proteger
const DANGEROUS = new Set(['__proto__', 'constructor', 'prototype']);

function safeMerge(t: any, s: any) {
  for (const k of Object.keys(s)) {
    if (DANGEROUS.has(k)) continue;
    if (!Object.hasOwn(s, k)) continue;
    if (typeof s[k] === 'object' && s[k] !== null && !Array.isArray(s[k])) {
      t[k] = safeMerge(t[k] || Object.create(null), s[k]);
    } else {
      t[k] = s[k];
    }
  }
  return t;
}
```

### 8.2 JSON.parse com reviver protetor

```ts
const data = JSON.parse(input, (key, value) => {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
    return undefined;
  }
  return value;
});
```

### 8.3 Libs auditadas

- lodash **4.17.21+** (CVE de prototype pollution corrigida)
- evitar libs antigas de merge deep
- Object.create(null) em vez de `{}` quando manipula input do usuário

---

## 9. Anti-patterns

```ts
// ❌ Check-then-act sem lock
const user = await db.user.findUnique({ where: { id } });
if (user.balance >= amount) {
  await db.user.update({
    where: { id },
    data: { balance: user.balance - amount }
  });
}
// Duas requisições paralelas leem balance=100, ambas autorizam saque=80, saldo final = -60
```

```php
// ❌ Verifica cupom, depois usa
$cupom = $pdo->query("SELECT usos FROM cupons WHERE codigo='$c'")->fetch();
if ($cupom['usos'] < 100) {
    $pdo->query("UPDATE cupons SET usos = usos + 1 WHERE codigo='$c'");
}
// Vulnerável a race + SQL injection no $c
```

```js
// ❌ Frontend "previne" double-click (não suficiente)
button.onclick = () => {
  button.disabled = true;
  submit();
};
// Bypass: F5 + repost, devtools, dois browsers, requisição direta via curl
```

```ts
// ❌ Redirect sem validação
res.redirect(req.query.next);
```

```ts
// ❌ OAuth callback aceita state como destino
const dest = req.query.state; // state é CSRF, não roteamento
res.redirect(dest);
```

---

## 10. Testes adversariais

Para validar mitigação após implementar:

### 10.1 Stress test de race condition

```bash
# Hey (HTTP load tester)
hey -n 100 -c 50 \
    -H "Cookie: session=..." \
    -m POST \
    -d '{"amount":80}' \
    https://meusite.com/api/withdraw

# Verificar: saldo final correto, sem dupla cobrança
```

```bash
# cURL paralelo
for i in {1..50}; do
  curl -X POST -H "Authorization: Bearer $T" \
       -d 'amount=80' \
       https://meusite.com/api/withdraw &
done
wait
```

```bash
# Anti duplo envio de form
for i in {1..10}; do
  curl -X POST -d "token=...&answers=..." \
       https://meusite.com/teste/submit &
done
```

### 10.2 Bypass de Open Redirect

Testar cada um dos vetores conhecidos:
```bash
for path in "//evil.com" "%2F%2Fevil.com" "javascript:alert(1)" "data:text/html,x" "https://site.com.evil.com" "https://site.com@evil.com"; do
  echo "=== $path ==="
  curl -sI "https://meusite.com/login?next=$path" | grep -i location
done
```

---

## 11. Comandos de busca no código

```bash
# PHP — open redirect candidatos
grep -rE "header\s*\(\s*['\"]Location.*\\\$_(GET|POST|REQUEST)" --include="*.php"
grep -rE "wp_redirect\s*\(\s*\\\$_(GET|POST)" --include="*.php"

# Node/JS — redirect com input
grep -rE "res\.redirect\s*\(\s*req\." --include="*.{ts,js,tsx,jsx}"
grep -rE "window\.location.*=.*req\.|.*=.*params\.|.*=.*searchParams\." --include="*.{ts,js,tsx,jsx}"

# .NET
grep -rE "Redirect.*Request\.|RedirectToAction.*Request\." --include="*.cs"

# PHP — check-then-act suspeito (saldo, estoque, cupom)
grep -rE "if.*\\\$.*->(balance|saldo|estoque|usos|votos).*>=" --include="*.{php,ts,js,py}"
grep -rE "if.*\\\$balance.*>=.*\\\$amount" --include="*.{php}"
grep -rE "fetch.*->.*[fF]irst.*if" --include="*.{php}"

# Filesystem TOCTOU
grep -rE "file_exists.*&&|fs\.existsSync.*\)\s*\{" --include="*.{php,ts,js}"

# Webhooks sem idempotência
grep -rE "stripe|mercadopago|paypal|webhook" --include="*.{php,ts,js}" -l |
  xargs grep -L "idempot\|event_id\|already_processed"

# Form sem CSRF/anti-duplo
grep -rE "method\s*=\s*['\"]POST['\"]" --include="*.{php,html,tsx,jsx}" -l |
  xargs grep -L "csrf\|token\|FOR UPDATE"

# Merge deep sem proteção
grep -rE "merge.*=.*deep|defaultsDeep|extend\(" --include="*.{js,ts,jsx,tsx}"
```

---

## 12. Integração com skills existentes

- `/auth-and-session-hardening` — return URL pós-login, OAuth callback
- `/payment-and-checkout-hardening` — idempotência em pagamento
- `/database-hardening` — transações, locks, isolamento (READ COMMITTED, REPEATABLE READ)
- `/api-backend-hardening` — Idempotency-Key header
- `/webapp-hardening` — anti duplo-envio em form, CSRF token
- `/external-api-integration-safety` — webhooks idempotentes
- `/test-coverage-guard` — testes de stress / race
- `/preserve-existing-behavior` — antes de adicionar lock em código existente
- `/anti-phishing-defense` — open redirect é vetor de phishing
- `/react-rsc-node-rce-hardening` — Server Actions com idempotency-key

---

## 13. Checklist de auditoria

```text
# Open Redirect
[ ] Todo redirect server-side valida destino (allowlist ou path relativo)
[ ] safeRedirect helper implementado e usado
[ ] OAuth callback exato no provider (sem wildcard)
[ ] Logout não aceita URL arbitrária
[ ] Encurtadores internos têm allowlist
[ ] Nenhum window.location = userInput sem validação
[ ] target=_blank com rel="noopener noreferrer"
[ ] Bypasses conhecidos testados (//, javascript:, data:, %2F, @, fragment, Unicode)
[ ] Meta refresh com URL parametrizada bloqueada

# Race Conditions / TOCTOU
[ ] Pagamento usa Idempotency-Key
[ ] Saque/wallet usa transação + lock (FOR UPDATE ou UPDATE condicional)
[ ] Cupom usa UNIQUE constraint OU lock
[ ] Estoque usa UPDATE condicional (estoque > 0)
[ ] Reset de senha usa token de uso único atômico
[ ] Webhook tem dedupe por event_id
[ ] Submissão de form crítica usa SELECT FOR UPDATE
[ ] Filesystem usa fopen('x') ou flock, não check-then-act
[ ] Counter/numerador usa AUTO_INCREMENT ou sequence atômica

# Testes adversariais
[ ] hey/curl paralelo executado em endpoints críticos
[ ] Bypasses de redirect testados (todos da §6.6)
[ ] Race em cupom/estoque/saldo verificado

# Prototype Pollution (se JS)
[ ] safeMerge implementado para merge deep
[ ] JSON.parse com reviver protetor em rotas críticas
[ ] lodash atualizado (4.17.21+)
[ ] Libs antigas de merge auditadas

# UX vs Segurança
[ ] Frontend "disabled em click" NÃO é a única defesa
[ ] Mensagens de erro genéricas (sem expor lógica interna)
[ ] Logs com correlation_id para debug
```

---

## 14. Atualização do CLAUDE.md (sugestão)

```markdown
## Open Redirect e Race Conditions

Em qualquer projeto com redirect parametrizado, OAuth, pagamento, saldo, cupom, estoque, voto, reset de senha, submissão crítica de form, webhook ou contador, invocar `/open-redirect-and-race-conditions-hardening`.

Regras absolutas:
- Redirect só para path relativo OU domínio em allowlist exata
- OAuth redirect_uri exato no provider (sem wildcard)
- Check-then-act crítico exige transação + lock OU UPDATE condicional
- Pagamento exige Idempotency-Key + dedupe de webhook
- Cupom/estoque exige UNIQUE constraint OU UPDATE condicional
- Reset de senha exige UPDATE atômico com used_at IS NULL
- Frontend "disabled em click" NÃO substitui mitigação server-side
- Prototype pollution: bloquear __proto__/constructor/prototype em merge deep
- target=_blank com rel="noopener noreferrer"

Testar adversarialmente:
- Open Redirect: //evil, %2F%2F, javascript:, data:, @, Unicode, host parcial
- Race: curl paralelo 50x, verificar saldo/estoque/cupom final correto
```

---

## 15. O que NÃO fazer

- ❌ Aceitar URL arbitrária em redirect
- ❌ Usar `state` do OAuth como destino (state é CSRF)
- ❌ Confiar em `target=_blank` sem `rel="noopener"`
- ❌ "Disabled no botão" como única defesa contra duplo envio
- ❌ Check-then-act em saldo/estoque/cupom sem lock
- ❌ Webhook processando sem dedupe de event_id
- ❌ Reset de senha que aceita token reutilizável
- ❌ Merge deep aceitando `__proto__`
- ❌ Filesystem com `existsSync` + `readFileSync` separados (TOCTOU)
- ❌ Confiar em "race é improvável" — concorrência acontece em produção real

---

## 16. Critérios de aceite

- safeRedirect helper implementado e usado em todo redirect parametrizado
- Operações financeiras com Idempotency-Key OU UPDATE condicional OU lock
- Cupom/voto/estoque com UNIQUE constraint OU UPDATE condicional
- Token de reset com used_at + UPDATE atômico
- Webhook com dedupe de event_id
- Testes adversariais (curl paralelo) executados
- Bypasses conhecidos de redirect bloqueados
- Prototype pollution mitigada em libs JS
- Anti duplo-envio em form crítico via FOR UPDATE
- Documentação técnica em `decisoes.md` do projeto

---

## 17. Frase-guia final

> **Redirect só por allowlist. Operação crítica só atômica e idempotente. Frontend disabled é UX, não segurança. Race condition é prejuízo direto — testar com curl paralelo antes de confiar.**

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
