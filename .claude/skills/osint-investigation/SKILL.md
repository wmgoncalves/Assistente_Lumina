---
name: osint-investigation
description: Investigacao OSINT (Open Source Intelligence) defensiva - reconhecimento da superficie publica da empresa/cliente, busca por leaked credentials (HaveIBeenPwned, DeHashed, SnusBase), buckets/repos expostos (GrayhatWarfare, GitHub dorks), shodan/censys para infra exposta, certificate transparency, social media intel para BEC, employee enumeration (LinkedIn, hunter.io), Maltego/SpiderFoot, dorking Google/Bing, brand abuse monitoring, monitoramento por palavra-chave (Twitter/X, Reddit, Telegram, Discord), threat actors profiling sem engajamento. Use para auditoria de superficie de cliente, pre-engagement de pentest, monitoramento de vazamento de credenciais, ou investigacao de marca. Defensiva apenas - nao para coletar info de individuos sem autorizacao (LGPD).
---

# osint-investigation

> **Frase-guia:** OSINT defensivo é olhar pela janela do atacante. Tudo que ele acha primeiro, você precisa achar antes.

## 0. Regra suprema

OSINT é **passivo e legal** — fontes públicas, sem engajamento, sem clicar em link malicioso (usar sandbox). Investigação de pessoa física exige base legal LGPD (legítimo interesse ou contrato). Investigação de empresa pública (própria ou cliente com autorização escrita) é sempre OK.

Esta skill é **defensiva** — investiga superfície de ataque para reduzi-la, nem para atacar terceiros.

---

## 1. Objetivo

Investigar superfície pública de empresa/cliente para:

- **Leaked credentials** (HaveIBeenPwned, DeHashed, etc.)
- **Buckets expostos** (S3, Azure, GCP)
- **Repos públicos** vazando código/secrets (GitHub, GitLab, Bitbucket)
- **Infra exposta** (Shodan, Censys, FOFA, ZoomEye)
- **Certificate Transparency** (todos os subdomínios já com cert)
- **Social media intel** para BEC simulation/awareness
- **Employee enumeration** (LinkedIn, hunter.io) — defensivo
- **Domain abuse** (typosquatting, lookalike registrados)
- **Brand mentions** no dark web e fóruns
- **Threat actors profiling** — TTPs conhecidas, sem engajamento direto

ATT&CK: T1591 (Gather Victim Org Info), T1593 (Search Open Websites), T1594 (Search Victim-Owned Websites)

---

## 2. Quando usar

- Pré-engagement de pentest (com autorização)
- Auditoria trimestral de superfície da DV Digital ou cliente
- Investigação de vazamento (cliente reclama de phishing)
- Due diligence M&A
- Treinamento de equipe (mostrar dimensão de exposição)
- Investigação de marca (typosquatting, brand abuse)

**NÃO usar para:**
- Stalking ou coleta de info pessoal sem base legal
- Pesquisa que vire dossiê de funcionário não autorizada
- Engajamento direto com adversário (vira active)

---

## 3. Pirâmide de fontes OSINT

```
Privado / pago        ← Cobalt Strike intel, Recorded Future, GreyNoise paid
       ↓
Semi-pago              ← Shodan, Censys, DomainTools, RiskIQ
       ↓
Free APIs              ← URLScan, AbuseIPDB, OTX, MISP públicos
       ↓
Search engines         ← Google, Bing, Yandex, DuckDuckGo
       ↓
Public web             ← LinkedIn, GitHub público, fóruns
       ↓
Public records         ← Whois, CT logs, DNS
```

Começar baixo (free), ir subindo conforme valor.

---

## 4. Domínio/empresa target

### 4.1 Whois + DNS

```bash
# Domínio público
whois dvdigital.dev.br | grep -iE "creation|registrant|email|phone"
dig +short MX dvdigital.dev.br
dig +short TXT dvdigital.dev.br

# Histórico DNS
# securitytrails.com (paid), passivetotal (paid)
```

### 4.2 Certificate Transparency

```bash
# Lista todos os subdomínios com cert
curl -s "https://crt.sh/?q=%25.dvdigital.dev.br&output=json" |
  jq -r '.[].name_value' | tr ',' '\n' | sort -u
```

Ferramenta: `subfinder`:
```bash
subfinder -d dvdigital.dev.br -all -o subdomains.txt
```

### 4.3 ASN / IPs

```bash
# IPs do domínio
dig +short dvdigital.dev.br A
dig +short www.dvdigital.dev.br A

# ASN
whois 1.2.3.4 | grep -i "OrgName\|origin"
# bgp.he.net para visualização
```

---

## 5. Search engines / dorking

### 5.1 Google dorks essenciais

```text
site:dvdigital.dev.br -www                         # subdomínios indexados
site:dvdigital.dev.br filetype:pdf                  # documentos
site:dvdigital.dev.br ext:env OR ext:bak OR ext:sql # arquivos sensíveis
site:dvdigital.dev.br inurl:admin                   # painéis
site:pastebin.com "dvdigital.dev.br"                # vazamentos
site:trello.com "dvdigital"                         # vazamentos
"dvdigital.dev.br" filetype:xls OR filetype:xlsx    # planilhas
intitle:"index of" "dvdigital"                      # listing
"@dvdigital.dev.br" filetype:pdf                    # e-mails em PDFs
```

### 5.2 GitHub dorks

```text
"dvdigital.dev.br" extension:env
"dvdigital.dev.br" extension:sql
"dvdigital.dev.br" extension:log
"dvdigital.dev.br" password
"dvdigital.dev.br" api_key
"dvdigital.dev.br" AWS_SECRET_ACCESS_KEY
"dvdigital.dev.br" jwt secret
```

Ferramenta automatizada: **trufflehog**, **gitleaks**, **GitMonitor**.

### 5.3 Pastebin / Wayback

- **pastebin.com**, **ghostbin**, **rentry.co** (variantes)
- **web.archive.org** (Wayback Machine) — versões antigas com config exposta

---

## 6. Buckets expostos

```bash
# GrayhatWarfare (free tier)
# https://grayhatwarfare.com/files?keywords=dvdigital

# AWS S3 enum
# Comuns: <empresa>, <empresa>-prod, <empresa>-backup, <empresa>-uploads
for s in dvdigital dvdigital-prod dvdigital-backup dvdigital-uploads dvdigital-staging dvdigital-dev; do
  curl -sI "https://${s}.s3.amazonaws.com" | head -1
done

# Tools
# s3scanner, bucket-stream, lazys3
```

```bash
# Azure
# https://<empresa>.blob.core.windows.net
# https://<empresa>.file.core.windows.net

# GCP
# https://storage.googleapis.com/<empresa>
```

---

## 7. Shodan + Censys + FOFA

### 7.1 Shodan

```bash
shodan init <api-key>

# Buscar pelo domínio
shodan domain dvdigital.dev.br

# Por IP
shodan host 1.2.3.4

# Buscar tecnologias específicas
shodan search "org:'Cliente Empresa'"
shodan search "hostname:dvdigital.dev.br port:22"
shodan search "ssl:dvdigital.dev.br"
```

Procurar:
- Portas inesperadas (admin panels)
- Versões desatualizadas (Apache 2.2, PHP 5.x)
- Banner com info revelando
- Certificados auto-assinados em produção

### 7.2 Censys

```bash
# censys-cli
censys search "dns.names:dvdigital.dev.br"
censys view <ip>
```

### 7.3 FOFA / ZoomEye / Quake (China)

Visibilidade alternativa, às vezes pega coisas que Shodan não pega.

---

## 8. Leaked credentials

### 8.1 Have I Been Pwned

```bash
# API (free, password limit)
curl -H "hibp-api-key: <key>" \
  "https://haveibeenpwned.com/api/v3/breachedaccount/user@dvdigital.dev.br"
```

```bash
# Senha (k-anonymity, sem expor senha completa)
PASS="senha123"
HASH=$(echo -n "$PASS" | sha1sum | awk '{print toupper($1)}')
PREFIX=${HASH:0:5}
SUFFIX=${HASH:5}
curl -s "https://api.pwnedpasswords.com/range/$PREFIX" | grep -i "^$SUFFIX:"
```

### 8.2 Domain monitoring (HIBP)

Verifica TODOS os usuários do domínio. Free para domain owner verificado.

### 8.3 DeHashed / SnusBase / IntelX (paid)

Mais detalhe (plaintext password em alguns leaks).

### 8.4 Combos lists em fóruns

Pesquisa nominal (sem download de combos!) para ver se domain aparece.

---

## 9. Social media OSINT

### 9.1 LinkedIn

- Employee enumeration: quem trabalha no cliente
- Cargos sensíveis (CFO, CTO, "DBA", "Cloud Engineer")
- Vazamento de stack via vagas postadas
- BEC target identification

Ferramentas:
- **theHarvester**:
  ```bash
  theHarvester -d dvdigital.dev.br -b all
  ```
- **hunter.io** (e-mail enumeration)
- **rocketreach.co**

### 9.2 Twitter/X, Reddit, Telegram, Discord

Monitorar menções por keyword. Stream APIs ou tools:
- **TweetDeck**
- **brand24** (paid)
- Custom scripts com Twitter API

### 9.3 Maltego

Graph relational visualization. Transformações conectam domain → IP → ASN → owner → social media → e-mail → leak.

### 9.4 SpiderFoot

Automação OSINT, free OSS.

```bash
docker run -p 5001:5001 -v $(pwd)/data:/var/lib/spiderfoot/data \
  jamiehlinder/spiderfoot
# http://localhost:5001
```

---

## 10. Domain abuse / typosquatting

```bash
# dnstwist - gera variações typo
dnstwist -r dvdigital.dev.br

# Resultado: lista de variações + se registrado + IP + similaridade
# Ex: dvdig1tal.dev.br, dv-digital.dev.br, dvdigital.com.br
```

Tools complementares:
- **urlcrazy**
- **typoguard**

Domínios registrados similares ao seu = monitorar. Reportar a registrar se em uso malicioso (phishing).

---

## 11. Threat actors profiling

Sem engajamento direto:

- **MITRE ATT&CK Groups** — TTPs por actor (APT28, FIN7, etc.)
- **MISP communities** — IOCs compartilhados
- **AlienVault OTX** — pulses públicos
- **Recorded Future** (paid) — perfis profundos
- **Mandiant Advantage**
- **CrowdStrike Intel** (paid)

Para investigar **se** seu setor é target:

```text
1. Identificar setor do cliente (banco? saúde? e-commerce?)
2. Procurar reports de 2024-2026 mencionando ataques ao setor
3. Mapear TTPs dos grupos conhecidos
4. Validar controles preventivos
```

---

## 12. Tools agregados

| Tool | Free | Para |
|---|---|---|
| **theHarvester** | ✅ | E-mail, subdomínios, employees |
| **subfinder** | ✅ | Subdomínios passive |
| **amass** | ✅ | Subdomínios + active recon |
| **dnstwist** | ✅ | Typosquatting |
| **SpiderFoot** | ✅ OSS | Automation |
| **Maltego CE** | ✅ Limited | Graph |
| **Recon-ng** | ✅ | Framework recon |
| **Shodan** | Free 1 mo | Internet-wide scan |
| **Censys** | Free tier | Internet-wide |
| **HIBP** | ✅ | Leaked creds |
| **GrayhatWarfare** | Free tier | Buckets |
| **crt.sh** | ✅ | Cert Transparency |
| **wayback** | ✅ | Histórico |
| **GitHub search** | ✅ | Code dorks |
| **trufflehog** | ✅ | Secrets em repo |
| **gitleaks** | ✅ | Secrets em repo |

---

## 13. Workflow trimestral

### Para DV Digital (própria)

1. **theHarvester** + **subfinder** → lista todos subdomínios
2. **dnstwist** → typosquatting
3. **HIBP domain check** → credentials vazadas
4. **GitHub dorks** "dvdigital.dev.br" + secrets
5. **Shodan** dvdigital.dev.br
6. **Wayback** → versões antigas com info sensível
7. **Brand mentions** monitoring weekly

### Para cliente (sob autorização escrita)

1. Idem + escopo definido em contrato
2. Relatório formal com findings
3. Priorização: crítico (creds), alto (bucket), médio (subdomínio), baixo (info)

---

## 14. Documentação de findings

```markdown
# Relatório OSINT — Cliente X

## Escopo
- Domínios: cliente.com.br + subdomínios
- Período: 2026-05-31
- Autorização: contrato #123

## Findings

### Críticos
- 3 e-mails de funcionários em vazamento "Collection #1"
  - Recomendação: reset senha + 2FA
- Bucket S3 público com PDFs internos
  - URL: cliente-prod.s3.amazonaws.com
  - Recomendação: Block Public Access account-level

### Altos
- Subdomínio `legacy-admin.cliente.com.br` rodando WordPress 4.x
  - Recomendação: deprecar ou atualizar

### Médios
- 4 typosquatting registrados (cli3nte.com.br, etc.)
  - Recomendação: monitorar; registrar defensivamente os 2 mais críticos

### Baixos
- LinkedIn de 47 funcionários expostos
  - Recomendação: treinamento BEC awareness
```

---

## 15. Integração

- `/anti-phishing-defense` — typosquatting overlap
- `/dns-and-subdomain-hardening` — subdomain takeover
- `/dependency-firewall` — leaked credentials em pacotes
- `/threat-intel-consumption` — IOCs de threat actors
- `/dark-web-monitoring` — leaked creds em dark web
- `/lgpd-compliance-check` — investigação de pessoas exige base legal
- `/pentest-engagement-management` — pre-engagement OSINT

---

## 16. Checklist

```text
[ ] Autorização escrita (se cliente)
[ ] theHarvester + subfinder rodados
[ ] crt.sh consultado
[ ] dnstwist rodado
[ ] HIBP domain check
[ ] GitHub dorks (5+ termos)
[ ] Shodan/Censys search
[ ] Buckets enumerados (S3/Azure/GCP)
[ ] Wayback verificado
[ ] LinkedIn employee enum (defensivo)
[ ] Domain mentions monitoring setup
[ ] Findings priorizados e documentados
[ ] LGPD verificada (sem coleta indevida de pessoa)
```

---

## 17. O que NÃO fazer

- ❌ Investigar pessoa física sem base legal (LGPD)
- ❌ Engajar com atacante (phishing reply, troll back)
- ❌ Clicar em link malicioso em browser normal
- ❌ Tentar acessar bucket que parece privado (vira active)
- ❌ Compartilhar findings publicamente sem autorização
- ❌ Comprar leaked database (lavando $)
- ❌ Usar OSINT para harassment

---

## 18. Frase-guia final

> **OSINT defensivo = ver o que o atacante vê, primeiro. theHarvester + crt.sh + HIBP + Shodan + GitHub dorks resolvem 80%. Maltego/SpiderFoot para profundidade. Tudo passive, tudo público, tudo dentro da LGPD.**
