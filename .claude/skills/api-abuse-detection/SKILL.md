---
name: api-abuse-detection
description: Deteccao de abuso de API alem do basico rate limit - credential stuffing patterns (mesmo email/multiple IPs, low success rate), enumeration (sequential IDs, user enumeration via error code), scraping organizado (User-Agent rotation, distributed IPs, time pattern), API key sharing (single key + multiple IPs/geos), business logic abuse (cupom abuse, free trial farming, refund abuse), bot detection (TLS fingerprinting JA3, mouse movement, timing), integracao com Cloudflare Bot Management/AWS WAF Bot Control/Datadome/Kasada, anomaly detection com ML (Splunk MLTK, Elastic), runbook de resposta. Use em API publica de e-commerce/SaaS/marketplace, em qualquer auth endpoint, ou apos picos suspeitos. Complementa waf-and-bot-mitigation (camada de borda) com lado deteccao por padrao logico.
---

# api-abuse-detection

> **Frase-guia:** Rate limit por IP é trivialmente burlavel com proxy. Detecção real é por **padrão de comportamento**, não por contagem.

## 0. Regra suprema

Bot moderno **passa rate limit**. Detecção precisa de **multiple signals** correlated: TLS fingerprint + behavior + timing + scope. Em conflito entre UX vs detecção, balance via **progressive challenge** (Turnstile aparece só em suspeito).

---

## 1. Objetivo

Detectar abuso de API além de rate limit volumétrico:

- **Credential stuffing** (listas de senha vazadas)
- **User enumeration** (probing de existence)
- **Scraping organizado** (catálogo, preço, dados)
- **API key sharing** (single key, multiple geos)
- **Card testing** (e-commerce)
- **Inventory hoarding** (bot compra estoque)
- **Voucher/coupon abuse** (mass creation)
- **Free trial farming** (multiple signups same person)
- **Refund abuse** (chargeback pattern)
- **Account takeover** (ATO) post-login
- **Token abuse** (stolen JWT replay)

---

## 2. Quando usar

- API pública de e-commerce, SaaS, marketplace
- Endpoint /login, /signup, /password-reset
- Endpoint /search, /products (scraping target)
- Endpoint /checkout (card testing)
- Após pico suspeito
- Após custos AWS/GCP anômalos (sintoma)

---

## 3. Camadas de detecção

```
┌─ Camada 1: Network ─────────────────────────────────┐
│  IP reputation (AbuseIPDB, Spamhaus)                │
│  ASN datacenter (DigitalOcean, OVH = sus)           │
│  GeoIP unusual (Russia, China, NK em e-comm BR)     │
│  TLS fingerprint JA3 anômalo                        │
└─────────────────────────────────────────────────────┘
┌─ Camada 2: HTTP ────────────────────────────────────┐
│  User-Agent ausente/inconsistente                   │
│  Headers anômalos (sem Accept-Language)             │
│  Referer ausente em fluxo esperado                  │
│  Cookies ausentes em endpoint autenticado           │
└─────────────────────────────────────────────────────┘
┌─ Camada 3: Behavior ────────────────────────────────┐
│  Sequential IDs                                     │
│  Mouse não movimentou (frontend)                    │
│  Time per request constante                         │
│  Workflow incompleto (login sem visit /, etc.)      │
└─────────────────────────────────────────────────────┘
┌─ Camada 4: Business ────────────────────────────────┐
│  Same email, multiple IPs                            │
│  Same IP, multiple emails                            │
│  Low success rate (login: < 20%)                     │
│  Same card, multiple amounts (card testing)         │
└─────────────────────────────────────────────────────┘
```

---

## 4. Sinais por tipo de abuso

### 4.1 Credential stuffing

```text
Sinais:
- Login attempts massivos
- Success rate < 5%
- Diverse IPs (proxy rotation)
- Same User-Agent (script único)
- Spike depois de leak público
- Mesmo email testado em IPs diferentes
- Padrão temporal: pico noturno
```

Query Splunk:
```spl
index=auth event=login
| stats count(eval(success==1)) AS success, count AS total by user_email
| eval rate=success/total*100
| where total > 50 AND rate < 5
```

### 4.2 User enumeration

```text
Sinais:
- 429 em /forgot-password com email aleatórios
- Response time differente para user existente vs not
- 200 mesma resposta independente (correto), mas timing differs
- Probing de IDs sequenciais em /users/{id}
```

```spl
index=app endpoint="/forgot-password"
| stats count(eval(success==1)) AS exists, count AS total by src_ip
| eval rate=exists/total*100
| where total > 30 AND rate < 20  # probing
```

### 4.3 Scraping

```text
Sinais:
- GET sequencial em catálogo
- User-Agent: Python-requests, Go-http-client, Java/8
- Sem cookies
- Sem referer
- Velocidade humanly impossible (5 req/s)
- Fora de horário comercial
- Acessa apenas paths de dados (skip CSS, JS, images)
```

```spl
index=web src_ip=*
| stats count(eval(uri="*.css")) AS css, count(eval(uri="*.js")) AS js,
        count(eval(uri="*/products/*")) AS prods by src_ip
| where prods > 100 AND (css + js) < 5
```

### 4.4 API key sharing

```text
Sinais:
- Single key, IPs em geos distintos < 1h
- Diff user-agent per request
- Spike de uso (overpassing tier)
```

```spl
index=api_audit api_key=*
| iplocation src_ip
| stats dc(Country) AS countries, dc(src_ip) AS unique_ips by api_key
| where countries > 2 OR unique_ips > 50
```

### 4.5 Card testing

```text
Sinais:
- Multiple checkouts, valor baixo ($1-5)
- Cards diferentes, mesmo IP/sessão
- Low approval rate (< 20%)
- IPs de TOR/VPN datacenter
- Padrão noturno
- Frequência > 1 attempt/min
```

```spl
index=payments status="failed"
| stats count AS failures, dc(card_last4) AS unique_cards by src_ip
| where failures > 10 AND unique_cards > 5
```

### 4.6 Coupon abuse

```text
Sinais:
- Multiple accounts (diff e-mails, mesmo IP/device)
- Coupon code aplicado N vezes em rapid succession
- Pattern de e-mail (testN@gmail.com)
- Order amount mínimo para liberar coupon
```

---

## 5. JA3 / JA3S TLS fingerprinting

JA3 hash do TLS Client Hello identifica software cliente independente de IP/UA.

Malware/bots têm JA3 conhecidos:
- `e7d705a3286e19ea42f587b344ee6865` — Cobalt Strike default
- `b32309a26951912be7dba376398abc3b` — Tor Browser

Wireshark plugin ou Zeek scripts geram JA3 automatically.

```spl
index=tls_logs
| lookup ja3_known fingerprint OUTPUT category, malicious
| where malicious=1
```

---

## 6. Behavior fingerprinting (frontend)

Coletar em JS (com consentimento LGPD):

```javascript
// session features
const features = {
  mouse_movements: trackMouseEvents().length,
  keyboard_events: trackKeyboardEvents().length,
  touch_events: trackTouchEvents().length,
  scroll_depth: maxScrollY / pageHeight,
  time_on_page: Date.now() - pageLoad,
  fingerprint: await getFingerprint(),  // canvas + webgl + audio + fonts
};

// Send hash to server, server scores
```

Send to API com request. Backend score:
```python
def is_bot(features):
    score = 0
    if features['mouse_movements'] < 5: score += 30
    if features['keyboard_events'] == 0 and features['touch_events'] == 0: score += 30
    if features['scroll_depth'] < 0.1: score += 20
    if features['time_on_page'] < 2000: score += 20
    return score > 50
```

---

## 7. ML-based anomaly detection

### 7.1 Splunk MLTK

```spl
| inputlookup user_metrics.csv
| fit IsolationForest n_estimators=100 contamination=0.05 *
| where anomaly=1
```

### 7.2 Elastic ML

Jobs built-in para anomaly em rare entity, sudden change.

### 7.3 Custom Python

```python
from sklearn.ensemble import IsolationForest
import pandas as pd

df = pd.read_csv('login_metrics.csv')
features = df[['attempts_per_hour', 'unique_ips', 'success_rate']]

clf = IsolationForest(contamination=0.05)
df['anomaly'] = clf.fit_predict(features)

anomalies = df[df['anomaly'] == -1]
```

---

## 8. Commercial bot management

| Vendor | Capacidade |
|---|---|
| **Cloudflare Bot Management** | ML + behavior + JA3 |
| **AWS WAF Bot Control** | Bot rules + ML |
| **Akamai Bot Manager** | Premium, enterprise |
| **DataDome** | Behavioral + bot |
| **Kasada** | Advanced ML |
| **PerimeterX** | E-commerce focus |
| **HUMAN (PerimeterX)** | Various |
| **Imperva Advanced Bot Protection** | Enterprise |
| **Fingerprint.com** | Device fingerprint |
| **Sift** | Fraud + bot |
| **Castle** | Account security |

**PME:** Cloudflare Bot Fight Mode (free) + Turnstile.
**E-commerce médio:** Cloudflare Bot Management ($) ou DataDome.

---

## 9. Resposta progressiva

Não block tudo. Escalada:

```text
Score 0-30 (low risk)  → Allow
Score 30-60 (medium)   → CAPTCHA challenge (Turnstile)
Score 60-80 (high)     → CAPTCHA + delay + log
Score 80-100 (very high) → Block + alert SOC
```

Permite humano legítimo passar mesmo com sinais ambiguos.

---

## 10. Runbook de resposta

### 10.1 Credential stuffing detected

```text
1. Identificar accounts impactados (success > 0)
2. Force password reset desses accounts
3. Notificar usuários
4. Block IP range (com cuidado — pode ser ISP)
5. Aumentar friction:
   - Turnstile em /login
   - Account lockout após 3 fails
   - Cooldown progressivo
6. Verificar se credentials estão em HIBP
7. Documentar incidente
```

### 10.2 Scraping detected

```text
1. Identificar source (IP, ASN)
2. Block ou tar pit (slow response, 30s)
3. Robots.txt confirma intenção
4. Considerar API plan (vender vs bloquear)
5. Verificar se está consumindo orçamento (custo cloud)
```

### 10.3 Card testing detected

```text
1. Block gateway calls do IP imediatamente
2. Notificar gateway (Stripe Radar, etc.)
3. Verificar approval rate de últimos N
4. Considerar 3DS forçado
5. Account de "test" pode ser legit dev — verificar
```

---

## 11. Métricas

| KPI | Meta |
|---|---|
| False positive rate (block humano) | < 0.1% |
| True positive rate (block bot) | > 95% |
| Time to detect | < 1 min |
| Time to block | < 5 min |
| Coverage (endpoints monitorados) | 100% critical |

---

## 12. Integração

- `/waf-and-bot-mitigation` — camada borda
- `/auth-and-session-hardening` — login
- `/payment-and-checkout-hardening` — card testing
- `/oauth-advanced-security` — token abuse
- `/jwt-attack-prevention` — JWT replay
- `/threat-intel-consumption` — IP reputation
- `/incident-diagnosis` — escalar se ATO
- `/dark-web-monitoring` — origem credentials
- `/lgpd-compliance-check` — behavior tracking exige consent

---

## 13. Checklist

```text
# Camada network
[ ] IP reputation lookup em login
[ ] ASN classification (residential vs datacenter)
[ ] GeoIP unusual flagged
[ ] TLS JA3 captured + checked

# Camada HTTP
[ ] Required headers validated
[ ] User-Agent allowlist for bots úteis
[ ] Suspicious UA rejected (sqlmap, etc.)

# Camada behavior
[ ] Frontend fingerprint coletado (com consent)
[ ] Mouse/touch tracking enviado
[ ] Time-on-page validated
[ ] Sequential ID enumeration blocked

# Camada business
[ ] Success rate tracking per endpoint
[ ] Anomaly alert if dropping
[ ] Card testing pattern detected
[ ] Coupon abuse pattern detected

# Response
[ ] Progressive challenge (CAPTCHA)
[ ] Auto-block at high score
[ ] Manual review queue
[ ] Account lockout policies

# Operacional
[ ] Bot management vendor evaluated (free → paid)
[ ] False positive rate < 0.1%
[ ] Runbooks documentados
[ ] SOC alert routing
```

---

## 14. O que NÃO fazer

- ❌ Block só por IP (proxy rotation)
- ❌ Block só por rate (lentos bots passam)
- ❌ Confiar em User-Agent sem cross-validation
- ❌ Track behavior sem consent LGPD
- ❌ Block country sem confirmar não tem cliente lá
- ❌ Ignorar success rate baixo (credential stuffing)
- ❌ Auto-block sem manual review queue (FP catastrófico)

---

## 15. Frase-guia final

> **Rate limit por IP é trivial de burlar. Detecção real correlaciona múltiplos sinais: JA3 + behavior + business logic. Progressive challenge (Turnstile) preserva UX legítima. Free tier de Cloudflare resolve PME; e-commerce precisa pago (Cloudflare Pro+, DataDome).**
