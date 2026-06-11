---
name: waf-and-bot-mitigation
description: Protecao em camada de borda com WAF, CDN, anti-bot, rate limit volumetrico, mitigacao de DoS/DDoS. Cobre Cloudflare (free e pago), Bunny Shield, AWS WAF, Vercel WAF, ModSecurity em cPanel, OWASP CRS, Bot Fight Mode, Cloudflare Turnstile, hCaptcha, reCAPTCHA, Rate Limiting Rules, Custom Firewall Rules, geo-blocking. Complementa webapp-hardening (rate limit em camada de aplicacao) cobrindo a camada de borda. Use ao configurar proteção inicial em projeto publico, em projeto sob ataque de bot/DDoS, em e-commerce/checkout (card testing), em sites com formulario/login publico, ou quando hospedagem suspendeu por CPU/banda.
---

# waf-and-bot-mitigation

> **Frase-guia:** Borda reduz ataque; servidor ainda valida tudo. WAF não substitui validação — só remove ruído antes do app.

## 0. Regra suprema

Segurança tem prioridade absoluta. Performance e conveniência **não** sobrepõem proteção contra abuso.

A camada de borda **não substitui** validação no servidor. Reduz superfície de ataque que chega ao app, mas o app continua responsável por:
- Validação de entrada (server-side)
- Autenticação e autorização
- Prepared statements em DB
- Escape de saída
- Idempotência em operações críticas

Em conflito entre WAF restritivo e UX fluida, **segurança vence — ajusta-se a UX em volta**, não enfraquece a proteção.

---

## 1. Objetivo

Proteger aplicações em camada de borda contra:

- **DoS volumétrico** (flood HTTP, SYN flood, amplification, slowloris)
- **DDoS distribuído**
- **Brute force** em login/recuperação de senha (mitigado em borda antes de chegar ao app)
- **Scraping** abusivo (concorrente extraindo dados, IA scraping para treino sem permissão)
- **Credential stuffing** (listas de senha vazadas testadas em massa)
- **Card testing** (cartão roubado testado em e-commerce — gera estorno + Visa/Master sanção)
- **Inventory hoarding** (bot comprando estoque limitado)
- **Spam em formulários** (contato, comentário, signup)
- **Comment spam / SEO spam**
- **Padrões maliciosos conhecidos** (OWASP CRS bloqueia SQLi/XSS/LFI/RCE automatizados)
- **Geo-bloqueio** quando aplicável (LGPD/sanção/escopo do produto)
- **Bots agressivos identificados** (AhrefsBot fora de horário, GPTBot/CCBot consumindo banda)
- **Scanners de vulnerabilidade** (Nikto, sqlmap, Wapiti, Nuclei, WPScan)

---

## 2. Por que esta skill existe

`/webapp-hardening` cobre **rate limit em camada de aplicação** (por user, por API key, lógica de negócio). Esta skill cobre a **camada de borda** (CDN/WAF) — que precede e complementa.

Razões para ter as duas camadas:

1. **Borda absorve volume** que derrubaria a aplicação (sua hospedagem compartilhada não aguenta 10k req/s)
2. **Borda filtra padrões maliciosos conhecidos** antes do app gastar CPU processando
3. **Aplicação valida lógica de negócio** (ownership, idempotência) que a borda não conhece
4. **Defesa em profundidade**: se uma falha, a outra ainda protege

---

## 3. Camadas de proteção (deep defense)

```
Internet
  ↓
DNS / Anycast (Cloudflare, Bunny, Fastly)    ← absorve volume
  ↓
WAF (Web Application Firewall)               ← OWASP CRS, regras custom
  ↓
Bot Management                               ← humano vs bot legítimo vs bot malicioso
  ↓
Rate limit de borda                          ← por IP, por sessão, por endpoint
  ↓
Challenge (Turnstile/hCaptcha)               ← quando suspeito
  ↓
Aplicação                                    ← validação server-side (outras skills)
  ↓
Banco / Storage                              ← prepared statements, índices, transações
```

---

## 4. Provedores de borda relevantes

| Provedor | Custo | Bom para |
|---|---|---|
| **Cloudflare** Free | $0 | Sites institucionais, landings, blogs |
| **Cloudflare** Pro | $20/mês | Sites com formulário, login, e-commerce pequeno |
| **Cloudflare** Business | $200/mês | E-commerce médio, SaaS, PCI light |
| **Cloudflare** Enterprise | $$$$ | Apps grandes |
| **Bunny.net** + Bunny Shield | ~$10/mês | Alternativa barata |
| **Vercel** Pro firewall | incluso no Pro | Apps Next.js no Vercel |
| **Netlify** Edge functions + rate limit | varia | Apps no Netlify |
| **AWS** CloudFront + WAF | $ por regra + req | Já tem AWS |
| **Fastly** | $$$$ | Apps grandes |
| **ModSecurity** (cPanel) | incluso | HostGator/cPanel — verificar OWASP CRS ativo |

**Para hospedagem compartilhada (HostGator/cPanel):** **Cloudflare em modo proxy é essencial** (free funciona). Sem ele, o CPU/banda do plano compartilhado vira limite duro.

---

## 5. Prioridade interna

1. **Impedir queda do serviço** (disponibilidade)
2. **Bloquear ataque OWASP automatizado** conhecido (scanners SQLi/XSS)
3. **Mitigar brute force** em login
4. **Mitigar scraping** abusivo
5. **Mitigar spam** em formulários
6. **Custo controlado** (free tier antes de pago)
7. **UX**: humanos legítimos não devem ver CAPTCHA toda hora
8. Performance, design

---

## 6. Quando usar

- Configurar proteção de borda em projeto novo
- Auditoria de site sob ataque ou abusado por bot
- Aplicação com formulário/login público
- E-commerce/pagamento (card testing é vetor crítico)
- Site com dados visíveis que concorrente pode scrapar
- Picos de tráfego sem explicação
- Conta de hospedagem suspensa por CPU/banda
- Cliente reporta lentidão sem campanha ativa
- Resposta a incidente DDoS
- Auditoria periódica de configuração de borda
- Migração de servidor (revalidar configuração)

---

## 7. Quando pode não se aplicar

- Sistema **interno** atrás de VPN/IP allowlist (proteção de borda redundante)
- Aplicação dev/staging sem exposição pública
- Site totalmente estático com tráfego baixíssimo e sem formulário

Mesmo nesses casos, manter Cloudflare DNS (não-proxy) para resolução robusta e DNSSEC.

---

## 8. Arquitetura recomendada por tipo de projeto

### 8.1 Site institucional / landing page (HostGator)

```
Internet → Cloudflare proxy (free)
         → WAF Managed Rules + OWASP CRS
         → Bot Fight Mode
         → Rate Limit em /contact (5/h/IP)
         → HostGator origin (public_html)
```

### 8.2 Plataforma com login (Evolution Mentorias, Painel admin)

```
Internet → Cloudflare proxy (free ou Pro)
         → WAF + OWASP CRS (sensitivity Medium → ajustar conforme FP)
         → Bot Fight Mode
         → Custom rule: Challenge em /painel/login, /wp-admin
         → Rate Limit em login (5 req/min/IP)
         → Turnstile no form de login (após 2 falhas)
         → Origin (HostGator/VPS)
```

### 8.3 E-commerce / checkout

```
Internet → Cloudflare proxy (Pro+)
         → WAF Managed + Custom Rules
         → Bot Management (Super Bot Fight Mode no Pro)
         → Turnstile no checkout
         → Rate Limit em /checkout (10/min/IP, 5 cards/h/IP)
         → Origin
```

### 8.4 API pública

```
Internet → Cloudflare/AWS
         → WAF
         → Rate Limit por API key/IP
         → Auth (auth-and-session-hardening)
         → API origin
```

### 8.5 Next.js no Vercel

```
Internet → Vercel Firewall (Pro+)
         → Vercel Edge Functions
         → Next.js (com /react-rsc-node-rce-hardening aplicada)
         → Origin
```

---

## 9. Configurações Cloudflare (Free tier) — recomendadas

### 9.1 SSL/TLS

- **SSL:** Full (strict) — exige cert válido na origem
- **Always Use HTTPS:** ON
- **Automatic HTTPS Rewrites:** ON
- **Minimum TLS:** 1.2 (ou 1.3 se origem suporta)
- **HSTS:** Habilitar com cautela (irreversível por 6 meses)

### 9.2 Security

- **Security Level:** Medium (default) → **"High"** em ataque ativo
- **Bot Fight Mode:** ON (free; bloqueia bots conhecidos)
- **Challenge Passage:** 30 min (default)
- **Browser Integrity Check:** ON

### 9.3 WAF Managed Rules (free tier inclui)

- **Cloudflare Managed Ruleset:** ON
- **Cloudflare OWASP Core Ruleset:** ON
  - Sensitivity: começar em **Medium**, depois ajustar **Low** se houver falso positivo em form legítimo
  - Action: **Managed Challenge** (não bloquear cego)
- **Cloudflare Free Managed Ruleset:** ON

### 9.4 Page Rules / Cache Rules (free tier)

```text
Bypass cache:
  /wp-admin/*
  /painel/*
  /api/*
  /admin/*
  /checkout/*
  /webhook/*
  /*?nocache=*

Cache agressivo:
  /assets/*    (1 mês)
  /static/*    (1 mês)
  /uploads/*   (cuidado: PII?)

Security High em paths sensíveis:
  /wp-login.php
  /painel/login
  /admin
```

### 9.5 Rate Limiting (free tier: 1 regra)

Free tier dá **1 regra** com **10k req/mês** monitoradas. Priorizar o endpoint mais sensível:

- **Login**: 5 req/min/IP em `/wp-login.php` ou `/painel/login`

Pago (Pro+): várias regras simultâneas.

### 9.6 Custom Firewall Rules

```text
# Bloquear User-Agent de scanner
(http.user_agent contains "sqlmap") or
(http.user_agent contains "nikto") or
(http.user_agent contains "wpscan") or
(http.user_agent contains "wapiti") or
(http.user_agent contains "nuclei") or
(http.user_agent contains "masscan") or
(http.user_agent contains "zgrab") or
(http.user_agent contains "Hakrawler")
→ Action: Block

# Bloquear país fora do escopo (se atende só Brasil)
(ip.geoip.country ne "BR")
→ Action: Managed Challenge

# Challenge IPs de TOR/proxy datacenter
(cf.threat_score gt 20)
→ Action: Managed Challenge

# Block hotlinking de assets pesados
(http.referer ne "" and not http.referer contains "seudominio.com.br" and http.request.uri matches "\\.(jpg|png|webp|mp4)$")
→ Action: Block

# Block métodos exóticos
(http.request.method in {"TRACE" "TRACK" "DEBUG"})
→ Action: Block

# Block paths de exposição típica
(http.request.uri.path in {"/.env" "/.git/config" "/wp-config.php" "/.aws/credentials" "/phpinfo.php" "/info.php" "/adminer.php"})
→ Action: Block

# Block bot scrapers de IA não desejados (opcional)
(http.user_agent contains "GPTBot") or
(http.user_agent contains "ClaudeBot") or
(http.user_agent contains "CCBot") or
(http.user_agent contains "anthropic-ai") or
(http.user_agent contains "PerplexityBot")
→ Action: Block  (ou allow se quiser ser indexado)
```

### 9.7 Caching

- Cache everything em rotas estáticas
- Cache TTL: 1 mês em assets versionados
- Bypass em rotas autenticadas (sempre)

---

## 10. Turnstile / hCaptcha / reCAPTCHA

### 10.1 Comparação

| Captcha | Free | Privacy | LGPD-friendly | Integração |
|---|---|---|---|---|
| **Cloudflare Turnstile** | ✅ | ✅ | ✅ | Cloudflare nativo |
| **hCaptcha** | ✅ | ✅ | ✅ | Free e pago |
| **reCAPTCHA v3** | ✅ | ❌ (envia dados ao Google) | ⚠️ | Mais conhecido |
| **reCAPTCHA v2** | ✅ | ❌ | ⚠️ | "I'm not a robot" |

### 10.2 Cloudflare Turnstile (recomendado)

```html
<!-- HTML -->
<form method="POST" action="/contato">
  <input name="nome" required>
  <input name="email" type="email" required>
  <textarea name="mensagem"></textarea>
  <div class="cf-turnstile" data-sitekey="0x4AAAAA..."></div>
  <button type="submit">Enviar</button>
</form>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

```php
// PHP - validação no servidor
function verificaTurnstile(string $token, string $ip): bool {
    $secret = $_ENV['TURNSTILE_SECRET']; // do config.local.php
    $resp = file_get_contents('https://challenges.cloudflare.com/turnstile/v0/siteverify', false, stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => http_build_query([
                'secret' => $secret,
                'response' => $token,
                'remoteip' => $ip,
            ]),
            'timeout' => 5,
        ],
    ]));
    $data = json_decode($resp, true);
    return ($data['success'] ?? false) === true;
}

// Uso
$token = $_POST['cf-turnstile-response'] ?? '';
if (!verificaTurnstile($token, $_SERVER['REMOTE_ADDR'])) {
    http_response_code(403);
    exit('Captcha inválido');
}
```

```ts
// Node/TypeScript
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET!,
      response: token,
      remoteip: ip,
    }),
  });
  const data = await res.json();
  return data.success === true;
}
```

### 10.3 Onde aplicar

- ✅ Formulário público de contato
- ✅ Signup
- ✅ Login (após 2-3 falhas, não desde a primeira)
- ✅ Recuperação de senha
- ✅ Comentários
- ✅ Checkout (e-commerce)
- ✅ Newsletter signup

### 10.4 Onde NÃO aplicar

- ❌ Endpoint chamado pelo seu próprio frontend autenticado (use rate limit + token)
- ❌ Webhook recebido de gateway (use HMAC signature)
- ❌ Acesso interno via VPN/IP allowlist

### 10.5 Regras gerais

- **Validar token no servidor** sempre (frontend pode ser bypassado)
- **Token é single-use** (não reusar)
- **TTL curto** (300s no Turnstile)
- **Mensagem clara** ao usuário se falhar
- **Fallback** se serviço de captcha cair (não derrubar app inteiro)

---

## 11. Rate limit — onde e como

### 11.1 Camada de borda (Cloudflare/CDN)

- Por **IP**
- Por **sessão** (cookie)
- Por **país**
- Granularidade: por **path**, por **método HTTP**

### 11.2 Camada de aplicação (Redis/memória/DB)

- Por **user ID**
- Por **API key**
- Por **ação semântica** (3 tentativas de senha em 5 min para o email X)

### 11.3 Algoritmos

| Algoritmo | Quando |
|---|---|
| **Fixed window** | Simples; pode ter burst no boundary |
| **Sliding window** | Mais justo; consome mais memória |
| **Token bucket** | Suporta burst controlado |
| **Leaky bucket** | Suaviza tráfego |

### 11.4 Endpoints típicos a proteger

| Endpoint | Limite sugerido |
|---|---|
| `POST /login` | 5 req/min/IP, 10 req/hora/email |
| `POST /signup` | 3 req/hora/IP |
| `POST /password-reset` | 3 req/hora/email |
| `POST /contact` | 5 req/hora/IP (humano não envia mais) |
| `POST /api/*` (autenticado) | 100 req/min/user |
| `POST /api/*` (público) | 30 req/min/IP |
| `POST /checkout` | 10 req/min/IP, 5 cards/hora/IP |
| `GET /search` | 60 req/min/IP |
| `GET /*` (anti-scraping) | 200 req/min/IP |
| `POST /webhook/*` | 100 req/min/source (com HMAC) |

### 11.5 Resposta ao limite

- HTTP **429 Too Many Requests**
- Header `Retry-After: <segundos>`
- Mensagem genérica ao usuário (sem expor lógica interna)
- Log com `correlation_id` (mascarar PII — `/logs-and-errors-hardening`)
- Em alta intensidade: bloquear IP no firewall do servidor (ufw/iptables) por algumas horas

---

## 12. Padrões de ataque a identificar

### 12.1 Credential stuffing

- Muitos logins falhando de IPs variados (rotação de proxy)
- User-Agent comum a todos (script único)
- Mesmo `email` testado em IPs diferentes
- Picos sazonais (logo após vazamento famoso)
- 4xx altos no `/login`

### 12.2 Card testing

- Muitos checkouts com valor mínimo (R$ 1, R$ 2)
- Cartões diferentes, mesmo IP/sessão
- Taxa de aprovação anormalmente baixa (< 20%)
- IPs de TOR/VPN datacenter
- Picos noturnos
- **Consequência:** sanção do Visa/Master, estornos pesados

### 12.3 Inventory hoarding

- Compra em massa por bot na primeira hora de lançamento
- User-Agent automatizado
- Velocidade humanamente impossível
- Mesmo IP múltiplas compras em segundos

### 12.4 Scraping agressivo

- GET sequencial em todas as URLs
- User-Agent: `Python-requests`, `Go-http-client`, `Java`, vazio
- Sem referer
- Sem cookies
- Pico fora de horário comercial
- Padrão de leitura sequencial (1, 2, 3, ... vs aleatório)

### 12.5 Spam form

- POST repetido com payload similar
- Honeypot field preenchido (bot caiu)
- Tempo de preenchimento < 1s (humano não)
- Idioma diferente do site
- Links em campo de texto

### 12.6 DDoS volumétrico

- Picos súbitos de 100x tráfego normal
- Vários IPs (botnet)
- 1xx/3xx/5xx aumentando
- CPU/banda da origem estourando

---

## 13. Comandos de diagnóstico

### 13.1 Análise de logs

```bash
# Top IPs
awk '{print $1}' /var/log/apache2/access.log | sort | uniq -c | sort -rn | head -20

# Top User-Agents
awk -F\" '{print $6}' /var/log/apache2/access.log | sort | uniq -c | sort -rn | head -20

# Top endpoints
awk '{print $7}' /var/log/apache2/access.log | sort | uniq -c | sort -rn | head -20

# Status codes
awk '{print $9}' /var/log/apache2/access.log | sort | uniq -c

# Requests por minuto (detectar pico)
awk -F: '{print $1":"$2":"$3}' /var/log/apache2/access.log | sort | uniq -c | sort -rn | head

# 4xx/5xx por IP (brute force / scanner)
awk '$9 ~ /^[45]/ {print $1}' /var/log/apache2/access.log | sort | uniq -c | sort -rn | head

# Endpoints com mais POST (anti-spam)
grep "POST" /var/log/apache2/access.log | awk '{print $7}' | sort | uniq -c | sort -rn | head

# Tentativas a /wp-login.php
grep "wp-login.php" /var/log/apache2/access.log | wc -l
grep "POST /wp-login" /var/log/apache2/access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head
```

### 13.2 Cloudflare Analytics

Dashboard → **Security** → ver:
- Tráfego bloqueado
- Top countries
- Top ASNs
- Top URLs atacadas
- Top User-Agents bloqueados

Dashboard → **Analytics** → **Performance** → identificar picos.

### 13.3 Verificar se origin IP está vazando

```bash
# Verificar todos os DNS records do domínio
dig dominio.com.br ANY +noall +answer

# Cada A/CNAME deve apontar para Cloudflare (proxy laranja)
# Exceção legítima: mail (precisa ser cinza), e direct (acesso interno)

# Resolver IP real (sem Cloudflare)
# Se conseguir resolver, o IP da origem está exposto
dig direct.dominio.com.br A
```

Ferramenta complementar: `cloudfail`, `crimeflare` para descobrir origin IP (testar contra você mesmo).

---

## 14. Custo e escolha de plano

### 14.1 Quando ficar no free

- Site institucional/landing
- Tráfego < 1M req/mês
- Sem e-commerce
- Form de contato simples

### 14.2 Quando migrar para Pro ($20/mês)

- E-commerce/checkout (card testing protection)
- Super Bot Fight Mode
- Múltiplas regras de rate limit (não só 1)
- WAF Page Rules mais granulares
- WebSockets

### 14.3 Quando Business ($200/mês)

- SaaS com SLA
- PCI light
- Image Optimization
- Custom certificates

### 14.4 Quando Enterprise

- Apps grandes
- SLA dedicado
- Mitigação avançada de DDoS L7
- Account management

**Regra**: começar no free. Subir só com evidência (ataque ativo, limite atingido, requisito de cliente).

---

## 15. HostGator / cPanel — particularidades

- **Cloudflare em modo proxy é essencial** (banda/CPU limitada do plano)
- **ModSecurity** costuma estar ativo no cPanel — confirmar com suporte
- **OWASP CRS** habilitado por padrão na maioria — verificar
- **IP da origem vaza** se houver subdomínio sem proxy:
  - Revisar todos os DNS records
  - `mail.dominio.com.br` precisa ficar cinza (não-proxy) — anote o IP real
  - `direct.dominio.com.br` se existe para acesso direto, vaza IP
- **TLS Full (strict)** quando cPanel tem cert válido (Let's Encrypt funciona)
- **Mail server** em registro sem proxy (SMTP/IMAP não passam por Cloudflare)

---

## 16. Modo de ataque ativo — playbook emergencial

Se site está sob ataque agora:

1. **Cloudflare → Overview → "I'm Under Attack!"** mode (challenge em tudo)
2. **Cloudflare → Security → Settings → Security Level: High**
3. **Custom Rule** bloqueando ASN/país de origem do ataque
4. **Custom Rule** bloqueando User-Agent comum
5. **Rate Limit** emergencial em endpoint atacado
6. **Page Rule** com Security High em path crítico
7. **Cache Rule** cacheando agressivo (alivia origem)
8. **Bloquear IP** no servidor (ufw/iptables) — camada interna redundante
9. **Documentar** ataque
10. **Após acabar**: voltar Security Level para Medium, revisar regras criadas

---

## 17. Integração com skills existentes

- `/webapp-hardening` — rate limit em camada de aplicação (interna)
- `/auth-and-session-hardening` — brute force em login (combinar com WAF em borda)
- `/api-backend-hardening` — proteção de endpoints
- `/incident-diagnosis` — durante ataque ativo
- `/payment-and-checkout-hardening` — card testing (Turnstile + rate limit + WAF)
- `/lgpd-compliance-check` — geo-bloqueio LGPD/transferência internacional
- `/docker-devops-hardening` — firewall no servidor (ufw/iptables) como camada interna
- `/dns-and-subdomain-hardening` — proxy ativo, origin IP não vaza
- `/anti-phishing-defense` — Cloudflare bloqueia URL phishing conhecida
- `/skill-orchestrator` — conflito entre skills

---

## 18. Checklist de auditoria

```text
# DNS / Proxy
[ ] DNS gerenciado por provedor confiável (Cloudflare/Bunny)
[ ] Cloudflare proxy ativo nos registros principais (laranja)
[ ] mail.dominio em registro cinza (não-proxy)
[ ] Origin IP NÃO vaza (todos os DNS records revisados)
[ ] DNSSEC habilitado (se possível)

# SSL/TLS
[ ] Always HTTPS + Min TLS 1.2
[ ] SSL/TLS: Full (strict)
[ ] HSTS habilitado com cautela
[ ] Certificado válido na origem

# WAF
[ ] Cloudflare Managed Ruleset ativo
[ ] OWASP Core Ruleset ativo (sensitivity Medium)
[ ] Bot Fight Mode ativo
[ ] Browser Integrity Check ativo

# Rate Limit
[ ] Rate limit em /login configurado (5/min/IP)
[ ] Rate limit em /contact, /signup, /password-reset (se plano permite)
[ ] Rate limit em /checkout (e-commerce)
[ ] Rate limit em aplicação como camada complementar

# Captcha
[ ] Turnstile/hCaptcha em forms públicos críticos
[ ] Validação de token no servidor implementada
[ ] Token single-use respeitado

# Firewall Rules
[ ] User-Agents de scanner bloqueados
[ ] Paths sensíveis bloqueados (/.env, /.git, /phpinfo.php)
[ ] Geo-bloqueio aplicado se relevante
[ ] Métodos exóticos (TRACE/TRACK/DEBUG) bloqueados

# Caching
[ ] Cache bypass em rotas autenticadas
[ ] Cache agressivo em assets
[ ] TTL apropriado

# Monitoramento
[ ] Logs/Analytics revisados semanalmente
[ ] Alertas de anomalia configurados (Pro+)
[ ] Plano de escalada (free → pro) documentado
[ ] Custo monitorado (alerts no provedor)

# Aplicação
[ ] Validação no servidor mantida (WAF não substitui)
[ ] Rate limit aplicação como camada interna
[ ] Idempotência em operações críticas
[ ] Logs sem PII
```

---

## 19. Atualização do CLAUDE.md (sugestão)

```markdown
## WAF, anti-bot e mitigação volumétrica

Em qualquer projeto público com formulário, login ou e-commerce, configurar camada de borda (Cloudflare proxy + WAF + Bot Fight Mode + Rate Limit) usando `/waf-and-bot-mitigation`.

Regras:
- Camada de borda NÃO substitui validação no servidor (mantém /webapp-hardening + /api-backend-hardening)
- Rate limit existe em DUAS camadas: borda (IP) + aplicação (user/key)
- Turnstile/hCaptcha em forms públicos, validados no servidor
- Origin IP não pode vazar (todos os DNS records pelo proxy laranja, exceto mail)
- HostGator/cPanel: Cloudflare é essencial pela banda/CPU limitada
- Começar no free tier, escalar com evidência
- Card testing em checkout = motivo direto para Cloudflare Pro
- Modo "Under Attack" só em ataque ativo, depois reverter
```

---

## 20. O que NÃO fazer

- ❌ Confiar SÓ no WAF (validação server-side é mantida)
- ❌ Deixar origin IP vazando (todos DNS records pelo proxy, exceto mail)
- ❌ Cachear rotas autenticadas (vaza dados de outro usuário)
- ❌ Cachear assets sem versionamento (não consegue invalidar)
- ❌ Aplicar HSTS sem testar (irreversível por 6 meses)
- ❌ Bloquear país sem confirmar que não tem cliente lá
- ❌ Esquecer rate limit em /password-reset (DoS por e-mail bombing)
- ❌ Captcha em endpoint chamado pelo próprio frontend (UX ruim, sem ganho)
- ❌ Permanecer em "Under Attack" mode após acabar ataque (alto atrito UX)
- ❌ Bloquear Googlebot/Bingbot (mata SEO)
- ❌ Manter Plano Free quando há card testing recorrente

---

## 21. Critérios de aceite

Configuração de borda está OK quando:

- DNS pelo Cloudflare/equivalente, proxy ativo
- SSL Full (strict), Always HTTPS, Min TLS 1.2
- WAF Managed + OWASP CRS ativos
- Bot Fight Mode ativo
- Rate limit em endpoint crítico (login mínimo)
- Captcha em forms públicos críticos
- Origin IP não vaza
- Firewall rules contra scanners e paths sensíveis
- Caching configurado (bypass em autenticado)
- Plano de escalada documentado
- Validação no servidor mantida intacta

---

## 22. Frase-guia final

> **Borda reduz ruído; servidor valida tudo. Cloudflare é seu primeiro filtro, não o único. Origin IP que vaza torna o WAF inútil.**

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
