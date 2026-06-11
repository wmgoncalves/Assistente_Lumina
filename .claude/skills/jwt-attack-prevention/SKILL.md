---
name: jwt-attack-prevention
description: Defesa avancada contra ataques JWT (JSON Web Token) - algorithm confusion (RS256 to HS256), none algorithm attack, weak secret bruteforce (jwt-cracker, hashcat mode 16500), key confusion via embedded keys, kid (Key ID) injection (SQL/LFI/SSRF via kid header), jku/x5u header manipulation, JWE attacks, key disclosure, replay sem jti, token rotation, JWKS public key validation, lib-specific vulns por linguagem (Node jsonwebtoken, Python PyJWT, PHP firebase/php-jwt, Java jjwt, .NET System.IdentityModel). Use ao implementar/auditar JWT em API ou autenticacao, em pre-engagement de pentest, ou quando lib JWT da deps em vulnerabilidade. Complementa auth-and-session-hardening (baseline JWT) com ataques avancados.
---

# jwt-attack-prevention

> **Frase-guia:** JWT é assinatura, não criptografia. Sem validar `alg` na lista de aceitos, qualquer claim vira root.

## 0. Regra suprema

JWT é fácil de implementar mal. Maioria das CVEs vem de **confusão entre assinar e validar**. Validar lib + algoritmo + claims é menos opcional que parece. Em conflito entre "deixar flexible" e "lockdown alg", **lockdown vence**.

---

## 1. Objetivo

Cobrir ataques avançados a JWT (além do `auth-and-session-hardening`):

- **Algorithm Confusion** (RS256 → HS256)
- **None Algorithm** (`alg: none`)
- **Weak Secret** brute force (HS256 com senha fraca)
- **Key Confusion** (chave embedded no token)
- **kid Header Injection** (SQL, LFI, SSRF via kid)
- **jku/x5u Header Manipulation** (fetch público maliciosa)
- **JWE attacks** (compressão, key wrap)
- **Replay** (sem jti/nonce)
- **Token leakage** (CORS, localStorage, logs)
- **JWKS endpoint security**
- **Library-specific vulns**

ATT&CK: T1550.001 (Application Access Token), T1606 (Forge Web Credentials)

---

## 2. Quando usar

- Implementando JWT pela primeira vez em projeto
- Auditando JWT em projeto existente
- Após CVE em lib JWT (jsonwebtoken, PyJWT, etc.)
- Pre-engagement de pentest em API
- Pós-incidente onde JWT pode ter sido explorado

---

## 3. Anatomia + recap

```
<header>.<payload>.<signature>
```

Decode base64url cada parte:
```json
// header
{"alg":"HS256","typ":"JWT","kid":"key1"}
// payload
{"sub":"user-id","exp":1700000000,"iat":1690000000,"role":"admin","jti":"unique-id"}
// signature
HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

---

## 4. Ataque 1: Algorithm Confusion (RS256 → HS256)

### Cenário

App usa **RS256** (assinatura assimétrica). Atacante muda `alg` para **HS256** e usa a **chave pública** como secret HMAC.

Server, se mal configurado, valida HMAC com chave pública (que é pública!) e aceita o token.

### Demonstração

```python
# Atacante:
import jwt
public_key = open('server-public.pem').read()
forged = jwt.encode(
    {"sub": "admin", "role": "admin"},
    public_key,        # public key como secret
    algorithm="HS256"  # ↓ change to symmetric
)
# Server tenta validar com HS256 + public_key e aceita
```

### Defesa

```javascript
// jsonwebtoken (Node)
const decoded = jwt.verify(token, publicKey, {
  algorithms: ['RS256']  // ESTRITO, lista whitelist
});
```

```python
# PyJWT
decoded = jwt.decode(token, public_key, algorithms=["RS256"])
```

```php
// firebase/php-jwt
$decoded = JWT::decode($token, new Key($publicKey, 'RS256'));
```

**Nunca usar `none` ou aceitar lista vazia.**

---

## 5. Ataque 2: None Algorithm

### Cenário

Atacante set `alg: "none"`, remove signature. Lib mal config aceita.

```json
{"alg":"none","typ":"JWT"}.{"sub":"admin"}.
```

### Defesa

- **Sempre passar `algorithms=` whitelist** (sem `none`)
- Libs modernas rejeitam por default, mas confirmar versão
- Bloquear `alg: none` em WAF

---

## 6. Ataque 3: Weak Secret Brute Force

HS256 com secret fraco (`secret`, `password123`, `mysecret`) → crackável.

```bash
# jwt-cracker
jwt-cracker eyJhbGc...token...

# hashcat mode 16500
echo "eyJhbGc..." > jwt.txt
hashcat -a 0 -m 16500 jwt.txt rockyou.txt
```

### Defesa

- HS256 secret: **256 bits random** (`openssl rand -base64 32`)
- Preferir **RS256/ES256** quando possível (chave assimétrica)
- Secret em vault (Secrets Manager, Key Vault)
- Rotation 90 days

---

## 7. Ataque 4: kid Header Injection

Header tem `kid` (Key ID) referenciando qual chave usar:

```json
{"alg":"HS256","kid":"key1"}
```

Server faz lookup: `SELECT secret FROM keys WHERE id = ?`.

Se input não sanitizado:
- **SQL injection**: `"kid": "key1' UNION SELECT 'mysecret'--"`
- **LFI**: `"kid": "../../../dev/null"` → secret = "" (empty!)
- **SSRF**: fetch keys de URL controlada

### Defesa

```python
ALLOWED_KIDS = {"key1", "key2"}  # whitelist
if header.get("kid") not in ALLOWED_KIDS:
    raise InvalidTokenError("Unknown kid")
```

---

## 8. Ataque 5: jku/x5u URL Manipulation

`jku` header aponta para JWKS URL:

```json
{"alg":"RS256","jku":"https://example.com/.well-known/jwks.json"}
```

Se app fetcha URL do header confiando, atacante cria JWKS próprio:
```json
{"jku":"https://attacker.com/jwks.json"}
```

### Defesa

- **Hard-code** JWKS URL no server (não confiar em header)
- Se aceitar jku: whitelist exata de domínios
- Validar `kid` na JWKS contra issuer esperado

---

## 9. Ataque 6: JWKS endpoint exposure

JWKS endpoint expõe chaves públicas. Se expor chave **privada** por erro = catastrófico.

### Defesa

- JWKS contém só `kty`, `use`, `kid`, `n`, `e` (público RSA) ou `crv`, `x`, `y` (público EC)
- NUNCA `d` (privado RSA) ou `d` (privado EC)
- HTTPS sempre
- Cache control: `max-age=86400` (1 day)

---

## 10. Ataque 7: Token Leakage

JWT em:
- **localStorage** → roubável via XSS
- **URL** → log no servidor + Referer header
- **Logs server** → grep accidental
- **Sentry/Error trackers** → expostos
- **GitHub commits** → leaked

### Defesa

- **HttpOnly cookie** (`Secure`, `SameSite=Lax`)
- Não logar tokens (mask if needed)
- Não passar em URL
- Configurar Sentry com scrub
- Pre-commit hook para detectar JWT

---

## 11. Ataque 8: Token Replay

Token interceptado é reutilizável até expirar.

### Defesa

- `jti` (JWT ID) único + server-side blacklist of revoked
- `exp` curto (5-15 min para access token)
- Refresh token rotativo (`refresh_token_id` único)
- `aud` (audience) validado
- `iss` (issuer) validado
- IP/User-Agent binding (opcional, quebra mobile real)

---

## 12. Validação completa server-side

```javascript
// Node + jsonwebtoken
const decoded = jwt.verify(token, secret, {
  algorithms: ['RS256'],            // whitelist
  audience: 'api.example.com',      // aud check
  issuer: 'https://auth.example.com', // iss check
  ignoreExpiration: false,           // exp enforced
  clockTolerance: 30,                // 30s leeway
  complete: false
});

// Custom checks
if (!decoded.sub) throw new Error('No subject');
if (!decoded.jti) throw new Error('No jti');
if (await isRevoked(decoded.jti)) throw new Error('Revoked');
```

---

## 13. Lib-specific vulnerabilities

### Node `jsonwebtoken`

- CVE-2022-23529: < 9.0.0 — algorithm confusion
- Atualizar para 9.0.0+
- Sempre passar `algorithms: []`

### Python PyJWT

- < 2.x: `decode(token, "secret")` sem `algorithms` aceitava none
- 2.0+: requer `algorithms`
- Atualizar

### PHP firebase/php-jwt

- v6+ requer `Key` object com alg explícito
- Não passar array sem fixed alg

### Java jjwt

- < 0.11: algorithm confusion
- Use `SignatureAlgorithm.RS256.getJcaName()` explícito

### .NET System.IdentityModel.Tokens.Jwt

- Configurar `TokenValidationParameters.ValidAlgorithms`

---

## 14. RS256 vs HS256 vs ES256

| Algo | Tipo | Tamanho chave | Performance |
|---|---|---|---|
| HS256 | Symmetric HMAC | 256 bit | Rápido |
| RS256 | RSA Asymmetric | 2048+ bit | Lento sign, médio verify |
| ES256 | EC Asymmetric | 256 bit | Médio |
| EdDSA | Ed25519 | 256 bit | Rápido + seguro |

**Recomendação:**
- API interna: **HS256** com secret strong
- API pública / multi-service: **RS256** ou **ES256**
- Performance crítica + asymmetric: **EdDSA**

---

## 15. Refresh tokens

Padrão recomendado:

```text
Access token: JWT, 15 min, no DB lookup
Refresh token: random opaque string, 7-30 days, DB row

Login → return access + refresh
Access expira → POST /refresh com refresh → new access + new refresh (rotate)
Refresh expira → relogin
```

Rotation: cada uso de refresh gera novo refresh, invalida o usado (DB delete). Detecta token reuse = sessão comprometida = revoke all.

---

## 16. Tools

- **jwt.io** (decode, valida)
- **jwt-cracker** (brute force)
- **hashcat** mode 16500
- **JWTear** (Python toolkit)
- **PyJWT** (lib + audit)
- **jwt-tool** (red team toolkit)
- **OWASP JWT Cheat Sheet**

---

## 17. Checklist

```text
# Implementation
[ ] alg whitelist explícita (no none)
[ ] aud, iss validados
[ ] exp respect, < 1h
[ ] jti único + revogação possível
[ ] HS256 secret >= 256 bits aleatório (vault)
[ ] RS256/ES256 quando entre serviços
[ ] Storage: HttpOnly cookie (não localStorage)
[ ] HTTPS sempre
[ ] Refresh token rotation

# Headers
[ ] kid em whitelist (não DB lookup unsafe)
[ ] jku NÃO usado OU whitelist de domínios

# Lib
[ ] Versão atualizada (no known CVE)
[ ] algorithms parameter passed
[ ] Custom validation (sub, jti, custom claims)

# Logs
[ ] Token não logado
[ ] Sentry scrub configured
[ ] Pre-commit detection

# Tests
[ ] Test rejeição de alg: none
[ ] Test rejeição de alg trocado (HS256 com pub key)
[ ] Test rejeição de exp expired
[ ] Test rejeição de aud errado
```

---

## 18. Integração

- `/auth-and-session-hardening` — baseline JWT
- `/oauth-advanced-security` — JWT em OAuth flows
- `/api-backend-hardening` — endpoints
- `/secure-code-review` — review JWT code
- `/dependency-firewall` — JWT libs
- `/secrets-and-env-guard` — secret storage
- `/test-coverage-guard` — adversarial tests

---

## 19. Frase-guia final

> **JWT mal usado é root delivery system. Algorithms whitelist + audience check + lib atualizada + secret strong + tokens fora de localStorage = 90% das CVEs evitadas. Reste 10% é refresh rotation.**
