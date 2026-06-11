---
name: oauth-advanced-security
description: Seguranca avancada em OAuth 2.0 e OIDC - PKCE obrigatorio (mesmo confidential clients), state CSRF + nonce OIDC, redirect_uri exact match (sem wildcard), scope minimo, token rotation com refresh single-use, ataques (authorization code injection, mix-up attack, cross-site request forgery, redirect_uri manipulation, scope elevation, refresh token theft), JWE para id_token sensitive, DPoP (Demonstration of Proof-of-Possession), token introspection vs JWT self-contained, OAuth para mobile (Android Custom Tabs + iOS ASWebAuthenticationSession), client credentials flow segura. Use ao implementar/auditar OAuth provider OU client em projeto - especialmente B2B/multi-tenant. Complementa auth-and-session-hardening (basics OAuth) com ataques avancados e OIDC.
---

# oauth-advanced-security

> **Frase-guia:** OAuth 2.0 sozinho é authorization, não authentication. OIDC é a camada de identidade. PKCE é obrigatório sempre.

## 0. Regra suprema

OAuth é complexo — implementar errado é a regra, não exceção. **Use libs auditadas** (Auth0 SDK, Authlib, oidc-client). Em conflito entre "build próprio" e "use lib mantida", **lib vence**.

---

## 1. Objetivo

Cobrir aspectos avançados de OAuth 2.0 / OIDC:

- **PKCE** obrigatório (RFC 7636)
- **state + nonce** validação
- **redirect_uri** exact match
- **Scope** mínimo + validation
- **Token rotation** + refresh single-use
- **Ataques**: mix-up, redirect_uri manipulation, scope elevation, code injection, refresh theft
- **JWE** para id_token sensitive
- **DPoP** (Demonstration of Proof-of-Possession)
- **Token introspection** vs JWT self-contained
- **Mobile OAuth** (Custom Tabs, ASWebAuthenticationSession)
- **Client Credentials** flow
- **Device Authorization Grant** (smart TVs)

---

## 2. Flows + quando usar cada

| Flow | Quando |
|---|---|
| **Authorization Code + PKCE** | Web apps, SPAs, mobile (preferido sempre) |
| **Client Credentials** | Server-to-server, sem usuário |
| **Device Authorization Grant** | Smart TVs, CLI tools |
| ~~Implicit~~ | DEPRECATED — não use |
| ~~Resource Owner Password~~ | DEPRECATED — não use |
| **Refresh Token** | Renovar access token |

---

## 3. PKCE obrigatório

PKCE (RFC 7636) era opcional para confidential clients. Agora **obrigatório sempre** (RFC 9700, OAuth 2.1).

### 3.1 Como funciona

```text
1. Client gera code_verifier (random 43-128 chars)
2. code_challenge = base64url(SHA256(code_verifier))
3. Authorization request inclui: code_challenge + code_challenge_method=S256
4. Server salva code_challenge
5. Token request inclui: code_verifier
6. Server valida: base64url(SHA256(code_verifier)) == code_challenge
```

### 3.2 Implementation

```javascript
// Generate
const verifier = base64url(crypto.randomBytes(32));
const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());

// Authorization URL
const authUrl = `https://auth.example.com/authorize?` + new URLSearchParams({
  response_type: 'code',
  client_id: 'my-app',
  redirect_uri: 'https://app.example.com/callback',
  scope: 'openid profile email',
  state: cryptoRandom(),
  code_challenge: challenge,
  code_challenge_method: 'S256',
  nonce: cryptoRandom()  // OIDC
});
```

```python
# Token exchange
import requests
response = requests.post('https://auth.example.com/token', data={
    'grant_type': 'authorization_code',
    'code': code,
    'redirect_uri': 'https://app.example.com/callback',
    'client_id': 'my-app',
    'code_verifier': verifier
})
```

### 3.3 Sem PKCE = vulnerável a code interception

App mobile: outro app malicioso intercepta o callback (Custom URL scheme). Sem PKCE, o code roubado vira access token. Com PKCE, atacante precisa do verifier (que está só no app legítimo).

---

## 4. state e nonce

### 4.1 state — CSRF protection

```text
Client → Auth: state=xxx
Auth → Client (callback): state=xxx
Client valida: state matches stored
```

Sem state validation: atacante injeta callback com seu próprio code → vítima loga **na conta do atacante** (account confusion / login CSRF).

```javascript
// Generate + store em session
const state = crypto.randomBytes(32).toString('hex');
req.session.oauth_state = state;

// Validate
if (req.query.state !== req.session.oauth_state) {
  return reply(403, "Invalid state");
}
delete req.session.oauth_state;  // single use
```

### 4.2 nonce — ID Token replay

OIDC: client gera nonce, inclui em authorization request, valida no id_token.

```javascript
// Inclui nonce
authUrl += '&nonce=' + nonce;

// Valida id_token
const idToken = jwt.verify(idTokenJwt, jwks);
if (idToken.nonce !== storedNonce) {
  throw new Error("Invalid nonce");
}
```

---

## 5. redirect_uri — exact match

**Sempre exact match** no provider config. Sem wildcards.

### 5.1 Ataques sem exact match

- **Sub-domain attack**: app permite `*.example.com` → atacante registra `attacker.example.com`
- **Path traversal**: `redirect_uri=https://app.com/callback/../evil-path`
- **Open redirect chained**: `redirect_uri=https://app.com/redirect?to=https://evil.com`

### 5.2 Provider config

```text
Allowed redirect URIs:
- https://app.example.com/callback        ✓ exact
- https://app.example.com/oauth/callback  ✓ exact

NOT:
- https://app.example.com/*              ✗ wildcard
- https://*.example.com/callback         ✗ subdomain wild
```

### 5.3 Cliente validação

```javascript
const ALLOWED_REDIRECT_URIS = new Set([
  'https://app.example.com/callback'
]);

if (!ALLOWED_REDIRECT_URIS.has(redirect_uri)) {
  return reply(400, "Invalid redirect_uri");
}
```

Combinar com `/open-redirect-and-race-conditions-hardening`.

---

## 6. Scopes — mínimo necessário

### 6.1 Sempre menos

Pedir só scope necessário:

```text
Login: openid profile email
NÃO: openid profile email offline_access mail.send drive.readwrite
```

### 6.2 Incremental authorization

Solicitar scope adicional quando necessário (não upfront todos).

### 6.3 Scope elevation prevention

Server: validar scope no callback contra requested. Atacante pode injetar scope adicional via mid-flow manipulation.

```python
if granted_scopes != requested_scopes:
    log_warning("Scope mismatch")  # but accept se subset OK
```

---

## 7. Token rotation

### 7.1 Access token

- Curto (15 min — 1h)
- JWT self-contained OU opaque + introspection
- Stored in HttpOnly cookie OR memory (não localStorage)

### 7.2 Refresh token — single use!

```text
POST /token (refresh)
   ← old refresh consumido (DB delete)
   → new access + new refresh
```

Se refresh é **reusado** (same token twice):
- **Family compromise**: revogar TODOS tokens dessa sessão
- Provavelmente roubo

Implementation:
```python
# Pseudo
def refresh(refresh_token):
    rt = db.refresh_tokens.find(token=refresh_token, used=False)
    if not rt:
        # Reuse detected!
        if db.refresh_tokens.exists(token=refresh_token, used=True):
            revoke_family(refresh_token.family_id)
            log_security_event("Refresh reuse")
        raise Unauthorized()

    rt.used = True
    db.save(rt)

    new_access = generate_access_token(rt.user_id)
    new_refresh = generate_refresh_token(rt.user_id, family_id=rt.family_id)
    return new_access, new_refresh
```

---

## 8. Ataques avançados

### 8.1 Mix-up attack

Cliente confuso entre auth servers (multi-tenant). Atacante registra cliente em IdP malicioso, redireciona vítima para autorizar lá. Code chega no callback do cliente legítimo.

**Defesa:**
- Bind code to issuer (iss parameter em response)
- Resource Indicators (RFC 8707)

### 8.2 Code injection

Atacante intercepta code do próprio fluxo (ex: phishing), submete para próprio token endpoint.

**Defesa:** PKCE (verifier prova posse)

### 8.3 Refresh token theft

Atacante rouba refresh, usa antes do legítimo. Detection: refresh reuse triggers revoke family.

### 8.4 Authorization code interception (mobile)

Outro app registra mesmo Custom URL Scheme.

**Defesa:**
- PKCE
- Android: App Links (verified)
- iOS: Universal Links
- Custom Tabs / ASWebAuthenticationSession (não WebView!)

### 8.5 CSRF em consent

Atacante força vítima logada a aceitar consent para app malicioso.

**Defesa:**
- state validation
- Consent screen requires interaction

---

## 9. JWE para id_token

Se id_token contém claims sensitive (PII), use **JWE** (encrypted) ao invés de **JWS** (só assinado).

```javascript
// JWE
const jwe = await new EncryptJWT({sub: 'user', custom: 'sensitive'})
  .setProtectedHeader({alg: 'RSA-OAEP-256', enc: 'A256GCM'})
  .encrypt(publicKey);
```

Token é base64 mas conteúdo é cifrado — só client com private key decifra.

---

## 10. DPoP (Demonstration of Proof-of-Possession)

RFC 9449. Bind token a um par de chaves do cliente:

```text
Authorization: DPoP eyJhbGc...
DPoP: <signed JWT with proof of key possession>
```

Resource server valida que client tem private key da public key citada no token. Roubo do bearer token não basta.

Excelente para mobile + alto valor.

---

## 11. Token introspection vs JWT

| Self-contained JWT | Opaque + Introspection |
|---|---|
| Decode local, sem network | Endpoint check every request |
| Pode ter revoked claim stale | Real-time status |
| Performance high | Latency +50ms |
| Tamanho grande | Token curto |
| Sem disclosure de internal | Disclosure de introspection endpoint |

Para internal APIs: JWT.
Para resource servers públicos: introspection (revoke real-time).

```http
POST /introspect HTTP/1.1
Authorization: Basic <client>
Content-Type: application/x-www-form-urlencoded

token=<opaque>
```

Response:
```json
{
  "active": true,
  "scope": "read write",
  "client_id": "my-app",
  "sub": "user-id",
  "exp": 1700000000
}
```

---

## 12. Mobile OAuth

### 12.1 Android

❌ WebView — inseguro
✅ **Chrome Custom Tabs** (system browser, secure)
✅ **App Links** (verified domain ownership)

```kotlin
val intent = CustomTabsIntent.Builder().build()
intent.launchUrl(activity, Uri.parse(authUrl))
```

### 12.2 iOS

❌ WKWebView — inseguro
✅ **ASWebAuthenticationSession** (system browser, secure)
✅ **Universal Links**

```swift
let session = ASWebAuthenticationSession(
    url: authUrl,
    callbackURLScheme: "myapp"
) { callbackURL, error in
    // handle
}
session.start()
```

### 12.3 PKCE sempre (mobile)

PKCE protege code interception (outro app registra mesmo scheme).

---

## 13. Client Credentials

Server-to-server, sem usuário:

```http
POST /token HTTP/1.1
Authorization: Basic <client_id:client_secret>
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=read:data
```

### 13.1 Hardening

- **Mutual TLS (mTLS)** ao invés de client_secret
- **Private Key JWT** (RFC 7523): client_assertion signed
- Restrict scopes to least needed
- Short access token (10 min)
- IP allowlist

---

## 14. Token storage no cliente

| Storage | Pros | Cons |
|---|---|---|
| **HttpOnly Cookie** | Seguro vs XSS | CSRF risk (use SameSite=Lax + CSRF token) |
| **localStorage** | Fácil | XSS roubável |
| **sessionStorage** | Memory | XSS roubável |
| **Memory (in-app)** | Seguro vs XSS persistent | Refresh page perde |
| **Cookie + memory hybrid** | Best | Complexidade |

**Recomendação web:** HttpOnly cookie + SameSite=Lax + CSRF token.
**Mobile:** Keychain (iOS) / EncryptedSharedPreferences (Android).

---

## 15. Logout

OAuth 2.0 não tem logout padronizado. OIDC tem:

- **RP-Initiated Logout** (`/end_session_endpoint`)
- **Front-Channel Logout** (iframe notifications)
- **Back-Channel Logout** (server-to-server notifications)

Implementar **token revocation** (RFC 7009):

```http
POST /revoke
client_id=xxx&token=<refresh>&token_type_hint=refresh_token
```

---

## 16. Libs recomendadas

| Linguagem | Lib |
|---|---|
| Node | `oidc-client-ts` (frontend), `openid-client` (backend) |
| Python | `Authlib`, `python-keycloak` |
| PHP | `league/oauth2-client` |
| Java | Spring Security OAuth2 |
| .NET | `Microsoft.AspNetCore.Authentication.OpenIdConnect` |
| Go | `golang.org/x/oauth2` + `coreos/go-oidc` |
| Mobile iOS | `AppAuth-iOS` |
| Mobile Android | `AppAuth-Android` |

---

## 17. Tools de teste

- **OAuth Tools** (Curity, free GUI)
- **Postman** com OAuth 2.0 flow
- **OWASP ZAP** + OAuth scan
- **BurpSuite** + custom extensions

---

## 18. Checklist

```text
[ ] PKCE em todos clients (S256)
[ ] state generated + validated (CSRF)
[ ] nonce generated + validated (OIDC)
[ ] redirect_uri exact match
[ ] Scope mínimo
[ ] Access token short (15-60 min)
[ ] Refresh token rotation single-use
[ ] Refresh reuse triggers family revoke
[ ] Token storage: HttpOnly cookie (web) / Keychain (mobile)
[ ] HTTPS only
[ ] Token introspection OR JWT self-contained (deliberate)
[ ] aud, iss, exp validated
[ ] algorithm whitelist explicit
[ ] Authorization code one-time
[ ] Logout endpoint implements revocation
[ ] DPoP considered for high-value
[ ] Client secret not in mobile/SPA (use PKCE only)
[ ] mTLS or Private Key JWT for sensitive client credentials
[ ] No legacy flows (Implicit, ROPC)
[ ] Lib mantida e atualizada
```

---

## 19. Integração

- `/auth-and-session-hardening` — baseline
- `/jwt-attack-prevention` — JWT em OAuth
- `/anti-phishing-defense` — OAuth phishing
- `/api-backend-hardening` — resource server
- `/secrets-and-env-guard` — client secrets
- `/secure-code-review` — review OAuth code

---

## 20. Frase-guia final

> **OAuth 2.1 = PKCE everywhere, state validated, redirect exact, refresh rotation, scope minimal. Mobile usa Custom Tabs/ASWebAuthentication, nunca WebView. Para alto valor: DPoP + mTLS.**
