---
name: dark-web-monitoring
description: Monitoramento defensivo de dark web e fontes underground para deteccao de exposicao - credenciais corporativas vazadas, vendas de acesso (initial access brokers), data breach de cliente/fornecedor, brand abuse em forums (XSS.is, Exploit.in, BreachForums), mencoes em Telegram/Discord channels criminosos, monitoramento via Recorded Future/SpyCloud/Flashpoint/Intel471 (pagos) ou alternativas free (HIBP, IntelX, DeHashed), procedimento ao confirmar vazamento, comunicacao com vitimas, integracao com SOAR para auto-reset. Use para empresa propria ou cliente sob contrato. Defensivo apenas - sem engajamento com criminosos. LGPD: investigacao de pessoa exige base legal.
---

# dark-web-monitoring

> **Frase-guia:** A questão não é "se" sua credencial vai vazar — é quando. Monitoramento contínuo do dark web é alerta antecipado, não paranoia.

## 0. Regra suprema

Dark web monitoring é **defensivo passivo**:
- ✅ Você procura sua marca/credenciais
- ❌ Você não compra credentials (lavando criminoso)
- ❌ Você não engaja com vendedor (vira active intelligence, em zona cinza legal)
- ❌ Você não acessa Tor para "tour" sem propósito (HSP)
- ✅ Use intermediário pago para acesso real (SpyCloud, Recorded Future)

LGPD: monitorar **sua** empresa = OK. Monitorar pessoa física = base legal obrigatória.

---

## 1. Objetivo

Detectar exposição de empresa/cliente em ambientes criminais:

- **Credenciais vazadas** (combos lists, breaches públicos)
- **Initial access broker** vendendo acesso à sua infra
- **Data breach** de cliente/fornecedor com seus dados
- **Brand abuse** em fóruns
- **Phishing kits** mencionando sua marca
- **Tooling customizado** para sua empresa (alvo específico)
- **Mentions** em canais Telegram/Discord criminais
- **Insider** vendendo info
- **Doxxing** de funcionários

---

## 2. Onde "morar" no dark/deep web

### 2.1 Fóruns underground

- **BreachForums** (sucessor RaidForums)
- **XSS.is** (russo)
- **Exploit.in** (russo)
- **CrdClub** (carding)
- **Nulled.to**
- **Hack Forums** (clear web mas underground)

### 2.2 Marketplaces

- Antes: AlphaBay, Hydra (derrubados)
- Atualmente: pulverizado em fóruns + Telegram

### 2.3 Telegram / Discord channels

- "leaks" channels (vazamentos comerciais)
- "combo" channels (combo lists)
- Channels por setor

### 2.4 Pastebin alternatives

- Pastebin (cleanup ativo)
- ghostbin, rentry.co, pastesh, justpaste.it

### 2.5 Ransomware leak sites (Tor)

- Cada gang tem seu (.onion)
- Lista mantida por DarkFeed, RansomWatch

---

## 3. Plataformas comerciais

| Plataforma | Foco | Custo |
|---|---|---|
| **Recorded Future** | Strategic + operational | $$$ |
| **SpyCloud** | Credenciais vazadas | $$ |
| **Flashpoint** | Threat intel inteligente | $$$ |
| **Intel471** | Underground intelligence | $$$ |
| **DarkOwl** | Dark web search | $$ |
| **Chainalysis** | Cripto + dark | $$$ |
| **DigitalShadows / ReliaQuest GreyMatter** | Brand + dark | $$ |
| **ZeroFox** | Brand + social | $$ |
| **Constella Intelligence** | Identity exposure | $$ |
| **Have I Been Pwned (Domain)** | Credenciais | Free (verified) |

**Recomendação para PME**: começar com HIBP Domain + um pago (SpyCloud é comum para credenciais).

---

## 4. Alternativas free / low-cost

### 4.1 Have I Been Pwned (HIBP)

```bash
# API key needed (low cost)
curl -H "hibp-api-key: <key>" \
  "https://haveibeenpwned.com/api/v3/breaches?domain=dvdigital.dev.br"
```

Domain monitoring: HIBP envia alerta para owner verificado quando novo breach inclui seu domain.

### 4.2 IntelligenceX (IntelX)

```bash
# Free tier limitado
# https://intelx.io/
```

Busca em pastebin, leaks, Tor sites.

### 4.3 DeHashed

```bash
# https://www.dehashed.com/
# Search by email/domain/IP
```

Indexa muitos breaches (incluindo plaintext em alguns).

### 4.4 SnusBase

Similar a DeHashed.

### 4.5 LeakCheck.io

Free tier para queries pontuais.

### 4.6 hudsonrock.com

Infostealer leaked data (sessions, cookies, saved passwords).

---

## 5. Workflow de monitoramento

### 5.1 Setup inicial

1. Identificar **assets a monitorar**:
   - Domínios próprios (todos)
   - Marcas (DV Digital, AtendaPro, etc.)
   - E-mails executivos/admin
   - IPs públicos
   - Termos sensíveis (nome do cliente, "Plataforma X")

2. **Cadastrar** em HIBP Domain (free para owner)

3. **Configurar alertas**:
   - HIBP webhook
   - SpyCloud alert API
   - Constella API
   - Telegram bot para canais específicos

4. **SOAR integration**:
   - Alerta → ticket → notify CISO → auto-reset password (se confidence alta)

### 5.2 Operação contínua

| Frequência | Ação |
|---|---|
| Real-time | Alertas de plataformas pagas |
| Daily | Review novos breaches em HIBP |
| Weekly | Search manual em IntelX/DeHashed |
| Monthly | Tour de fóruns (por intermediário pago) |
| Quarterly | Review de keyword/scope |

---

## 6. Análise de credencial vazada

Quando recebe alerta:

### 6.1 Validar

1. **Source confiável?** (HIBP > paste random)
2. **Data do breach?** (recente = urgência alta)
3. **Plaintext ou hash?** (plaintext = pior)
4. **Senha reutilizada?** (HIBP password check)

### 6.2 Identificar usuário

```text
Email: joao@cliente.com.br
Breach: LinkedIn 2021 (recente disclose 2024)
Password: [hash bcrypt]
```

### 6.3 Investigar uso

- Login bem-sucedido recente desse usuário?
- IP geograficamente inusual?
- Token OAuth não-revogado?

### 6.4 Resposta

```text
[ ] Notificar usuário individualmente
[ ] Reset senha
[ ] Revogar sessões ativas
[ ] Revogar OAuth tokens
[ ] Verificar/forçar MFA
[ ] Examinar inbox rules (BEC)
[ ] Audit últimas 30 dias do usuário
[ ] Documentar incidente (LGPD?)
```

---

## 7. Initial Access Broker (IAB)

IAB vende acesso já comprometido (VPN cred, RDP, web shell):

### 7.1 Sinais

- Post em fórum mencionando seu domain
- Listado em "leaks" channel com país/setor/revenue
- Preço típico: $500-5000

### 7.2 Resposta

**ALTA URGÊNCIA**:
1. IR full scope (`/incident-diagnosis`)
2. Hunt for webshell (`/webshell-hunting-proativo`)
3. Audit VPN logs
4. Audit RDP logs
5. Memory forensics em hosts suspeitos (`/memory-forensics-volatility`)
6. Rotacionar TUDO
7. Considerar notificar law enforcement

---

## 8. Brand abuse

### 8.1 Tipos

- Phishing kit usando seu logo
- Domínio typosquatted ativo (`dv-digital.com`)
- "DV Digital legit" perfil falso em LinkedIn
- App falso na Google Play / App Store
- Anúncio Google fraudulento

### 8.2 Resposta

- Reportar ao registrar (typo)
- Reportar a Google Ads (fraud)
- DMCA para hospedagem do phishing
- Brand abuse em redes: report no platform
- App store: report
- CERT.br

---

## 9. Tooling defensivo

### 9.1 Browser para acessar dark web (com cuidado)

- **Tor Browser** (oficial)
- **Tails** OS (live, sem rastro)
- Sempre VM dedicada
- Sem login de identidade real
- Sem download

### 9.2 Frameworks

- **OnionScan** (open source, scan Tor sites)
- **TorBot** (collector)
- **ahmia.fi** (search engine .onion)

### 9.3 Recomendação PME

**Não acesse Tor diretamente para monitoramento contínuo.** Use plataforma paga que faz a coleta e expõe via API/dashboard.

---

## 10. Cripto + dark

Muitas transações em dark usam cripto. Monitoramento:

- **Chainalysis Reactor** (paid)
- **TRM Labs** (paid)
- **Crystal Blockchain**

Útil em IR pós-ransomware (rastreio resgate).

---

## 11. Compartilhamento

Ao confirmar exposição:

- **Cliente afetado**: comunicação direta
- **CERT.br**: cert@cert.br se vazamento brasileiro
- **ANPD**: se dados pessoais (LGPD, 2 dias úteis)
- **FBI IC3** (se ataque internacional, valuable)
- **Federation** (FS-ISAC, etc.)
- **Setor** via grupo fechado

---

## 12. Métricas

| KPI | Meta |
|---|---|
| Time-to-detection (vazamento → alerta) | < 24h |
| Time-to-response (alerta → reset cred) | < 4h |
| Coverage (assets monitorados) | 100% |
| FP rate (alertas legítimos / total) | > 80% |
| Cost per detection | Tracking |

---

## 13. Ética e legal

- ✅ Monitorar sua marca
- ✅ Pagar plataforma comercial (legal)
- ❌ Comprar credentials de criminoso (financia crime)
- ❌ Hack back / vigilante
- ❌ Coletar PII de não-clientes
- ⚠️ Acessar Tor sites de tráfico — ilegal mesmo "olhando"

---

## 14. Integração

- `/anti-phishing-defense` — credenciais vazadas levam a phishing
- `/auth-and-session-hardening` — reset/MFA pós-exposição
- `/incident-diagnosis` — IAB sale = IR
- `/threat-intel-consumption` — feeds incluem dark intel
- `/phishing-email-forensics` — campanha pode vir de IAB
- `/lgpd-compliance-check` — notificação ANPD
- `/hitl-checkpoint` — reset em massa exige aprovação

---

## 15. Checklist

```text
# Setup
[ ] Assets a monitorar listados (domains, brands, e-mails, IPs)
[ ] HIBP Domain configurado e verificado
[ ] Plataforma paga (SpyCloud/Constella/equivalente) avaliada
[ ] Telegram/Discord monitoring (manual ou via tool)
[ ] Alertas para Slack/SIEM

# Resposta
[ ] Runbook de "credencial vazada" documentado
[ ] Runbook de "IAB selling access" (urgência alta)
[ ] Runbook de "brand abuse" (legal/marketing)
[ ] SOAR pipeline para auto-reset/notify
[ ] Comunicação template para usuário afetado

# Operacional
[ ] Reviews mensais de scope
[ ] Métricas de TTD/TTR
[ ] Compartilhamento com CERT.br/ISAC
[ ] LGPD verificada
```

---

## 16. Frase-guia final

> **Dark web monitoring é alerta antecipado, não paranoia. Comece com HIBP Domain (free), escale com SpyCloud (credenciais) ou Constella (identity). Não compre credentials. Não engaje. Auto-reset + MFA em hit é resposta padrão.**
