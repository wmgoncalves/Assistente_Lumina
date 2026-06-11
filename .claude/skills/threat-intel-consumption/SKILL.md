---
name: threat-intel-consumption
description: Consumo operacional de threat intelligence - integracao de feeds (MISP, AbuseIPDB, AlienVault OTX, abuse.ch, URLhaus, ThreatFox, Spamhaus, EmergingThreats, Cisco Talos, CrowdStrike Falcon Intel, Mandiant), formatos STIX/TAXII, enriquecimento de alerta SIEM com IOC, deduplicacao, scoring de confidence, priorizacao de IOC actionable vs noise, automacao via SOAR (Cortex XSOAR/Splunk SOAR/Tines), integracao com EDR/firewall/proxy para bloqueio automatico, compartilhamento (CERT.br, ISAC), produzir IOCs proprios apos IR. Use ao construir pipeline de threat intel para cliente com SOC, em projeto de SOAR, ou para enriquecer logs com IOCs comunitarios. Complementa incident-diagnosis e webshell-hunting-proativo.
---

# threat-intel-consumption

> **Frase-guia:** Feed sem dedup é ruído. IOC sem context é trivia. Threat intel acionável é o que tem confidence, escopo, e prazo.

## 0. Regra suprema

Threat intel só vale se **acionável** — bloqueia, alerta, ou enrichece com contexto. Feed sem dedup, sem expiração, sem scoring vira ruído. Antes de assinar feed pago, validar com gratuito + medir false positive rate.

---

## 1. Objetivo

Consumir e produzir threat intelligence operacional:

- **Feeds gratuitos** (MISP comunidades, AbuseIPDB, abuse.ch, OTX, Talos, Spamhaus)
- **Feeds pagos** (CrowdStrike, Mandiant, Recorded Future, Anomali)
- **Formatos STIX/TAXII**
- **IOC types** (IP, domain, URL, hash, e-mail, TTP)
- **Enriquecimento** de alertas com IOC matching
- **Automação SOAR** (auto-block, auto-investigate)
- **Compartilhamento** (CERT.br, FS-ISAC, H-ISAC, OT-ISAC)
- **Produção própria** de IOCs (pós-IR)

---

## 2. Tipos de threat intel

| Tipo | Exemplo | Uso |
|---|---|---|
| **Strategic** | "APT28 ativo no Brasil" | Decisão de board |
| **Operational** | "Campanha X usa Y técnica" | Hunting hypothesis |
| **Tactical** | "TTP T1566.001 com payload macro Q1 2026" | Rules SIEM |
| **Technical (IOCs)** | "IP 1.2.3.4 é C2 Sliver" | Bloqueio direto |

Skill cobre os 4, focando em **technical** (IOCs) operacional.

---

## 3. Feeds essenciais

### 3.1 Gratuitos (começar aqui)

| Feed | Tipo | API/Format |
|---|---|---|
| **abuse.ch URLhaus** | URLs maliciosas | API + CSV |
| **abuse.ch ThreatFox** | IOCs malware | API + JSON |
| **abuse.ch Feodo Tracker** | C2 (Emotet, TrickBot, Dridex) | CSV |
| **abuse.ch SSLBL** | TLS certs maliciosos | CSV |
| **AbuseIPDB** | IPs maliciosos | API |
| **AlienVault OTX** | Pulses comunitários | API STIX |
| **Cisco Talos** | IPs, domains, e-mails maliciosos | Feed |
| **Spamhaus DBL** | Domain blocklist | DNS lookup |
| **PhishTank** | URLs phishing | API |
| **OpenPhish** | URLs phishing | Feed |
| **MISP Project** | Comunidades públicas | TAXII |
| **CINS Score** | IP reputation | Feed |
| **EmergingThreats Open** | IDS rules + IPs | Feed |
| **CERT.br** | IPs/domains brasileiros | Feed |
| **DShield** | IPs em ataque | API |

### 3.2 Pagos (escalar quando justificar)

| Feed | Valor |
|---|---|
| **Recorded Future** | Strategic + technical |
| **Mandiant Advantage** | Strategic + APT |
| **CrowdStrike Falcon Intel** | Strategic + technical |
| **Anomali ThreatStream** | Aggregator |
| **EclecticIQ** | Platform |
| **ThreatConnect** | Platform |

---

## 4. Formats: STIX/TAXII

### 4.1 STIX 2.1 (Structured Threat Information Expression)

JSON-based:
```json
{
  "type": "bundle",
  "id": "bundle--abc",
  "objects": [
    {
      "type": "indicator",
      "id": "indicator--xxx",
      "created": "2026-05-31T00:00:00Z",
      "valid_from": "2026-05-31T00:00:00Z",
      "valid_until": "2026-08-31T00:00:00Z",
      "pattern": "[ipv4-addr:value = '1.2.3.4']",
      "pattern_type": "stix",
      "labels": ["malicious-activity"],
      "confidence": 80
    }
  ]
}
```

### 4.2 TAXII 2.1 (Transport)

API REST para pull de STIX bundles.

```bash
# Listar collections
curl -H "Accept: application/taxii+json;version=2.1" \
     -u user:pass \
     https://taxii.example.com/api2/collections/

# Pegar objetos de uma collection
curl -H "Accept: application/taxii+json;version=2.1" \
     "https://taxii.example.com/api2/collections/<id>/objects/"
```

---

## 5. MISP — plataforma central

MISP (Malware Information Sharing Platform) é a forma mais comum de **consumir e produzir** threat intel:

```bash
# Docker
docker run -d -p 80:80 -p 443:443 -e MYSQL_ROOT_PASSWORD=xxx \
  -v misp-data:/var/www/MISP/app/files \
  coolacid/misp-docker:core-latest
```

### 5.1 Comunidades públicas

Adicionar feeds:
- `https://www.circl.lu/doc/misp/feed-osint/`
- `https://misp.cert.ssi.gouv.fr/feed-misp/`
- `https://www.botvrij.eu/data/feed-osint/`
- `https://opencti.io` (alternativa)

### 5.2 Export para SIEM/EDR

MISP gera:
- Feed CSV/JSON para SIEM
- Suricata rules
- Bro/Zeek
- Snort
- STIX bundles

```bash
# Pull em formato Suricata
curl -H "Authorization: <key>" \
  "https://misp.example.com/events/csv/download/false/false/false/false/false/false/false/false/0/false/null"
```

---

## 6. Enriquecimento de alertas SIEM

### 6.1 Lookup table

```spl
# Splunk — lookup IPs em feed
index=firewall action=allow
| lookup threat_ips ip OUTPUT threat_actor, malware_family, confidence
| where confidence > 70
| table _time, src_ip, dest_ip, threat_actor, malware_family
```

### 6.2 KQL (Sentinel)

```kql
let TI_IPs = externaldata(ip:string, source:string, confidence:int)
  ["https://example.com/ti-feed.csv"] with (format="csv");

CommonSecurityLog
| where DeviceAction != "Denied"
| join kind=inner (TI_IPs) on $left.DestinationIP == $right.ip
| where confidence > 70
| project TimeGenerated, SourceIP, DestinationIP, source, confidence
```

### 6.3 ELK / OpenSearch

Index threat intel em `ti-iocs-*`, lookup via Logstash `translate` filter.

---

## 7. Priorização (signal vs noise)

### 7.1 Scoring

```text
Score = (confidence × severity × actionability) × context_modifier
```

- **Confidence**: validation cruzada (3+ feeds = high)
- **Severity**: type (C2 high, generic scanner low)
- **Actionability**: bloqueio direto OK? ou só awareness?
- **Context**: meu setor é alvo? mesma geografia?

### 7.2 Critérios para bloqueio automático

```text
- Confidence >= 80
- Em >= 3 feeds confiáveis
- IOC do tipo "atomic" (IP, domain, hash) - não TTP
- Não-residential ASN (não risco de bloquear cliente real)
- TTL definido (auto-expire se 30 dias sem renew)
```

### 7.3 Anti-padrões

❌ Bloquear sem dedup → bloqueia 8.8.8.8 algum dia
❌ Sem expiração → IOC velho continua bloqueando legítimo
❌ Confidence baixa em auto-block → false positive em prod
❌ Single source → falso (feed pode estar comprometido)

---

## 8. Automação SOAR

### 8.1 Casos de uso

**Auto-enrich:**
```text
Alerta SIEM → query VT, URLScan, AbuseIPDB → adicionar context no ticket
```

**Auto-isolate:**
```text
EDR detecta malware → SOAR isola endpoint via API → notifica analista
```

**Auto-block:**
```text
TI feed novo com confidence 95 → push firewall rule → 7 dias TTL
```

**Auto-respond phishing:**
```text
User clica "Report phishing" → SOAR: extract IOCs → block sender + URL gateway → search/purge
```

### 8.2 Plataformas

- **Splunk SOAR (Phantom)**
- **Palo Alto Cortex XSOAR**
- **IBM Resilient**
- **Microsoft Sentinel Logic Apps**
- **Tines** (no-code)
- **Shuffle** (open source)
- **n8n** (open source, multi-purpose)

---

## 9. Produção de IOCs próprios

Pós-IR, transforme findings em IOCs reutilizáveis:

```json
{
  "indicator": "evil-domain.com",
  "type": "domain",
  "first_seen": "2026-05-15",
  "campaign": "Phish-Campaign-XX",
  "tlp": "WHITE",  // ou GREEN, AMBER, RED
  "confidence": 90,
  "context": "C2 server identified in client engagement",
  "tags": ["c2", "phishing-2026-q2"]
}
```

### 9.1 Export para MISP

Cria evento, adiciona attributes, share com comunidade (TLP correto):

- **TLP RED**: só você
- **TLP AMBER**: só sua org
- **TLP GREEN**: comunidade fechada
- **TLP WHITE**: público

### 9.2 Compartilhar

- **CERT.br** — `cert@cert.br`
- **CSIRT** do governo
- **ISAC** do setor (FS-ISAC banco, H-ISAC saúde)
- Twitter/X com hashtag #ThreatIntel

---

## 10. Validation contínua

Métricas:
- **Coverage** — IOCs únicos em feed
- **False positive rate** — quantos bloqueios legítimos foram bloqueados?
- **Time to block** — de IOC publicado a bloqueado em prod
- **TTL respect** — IOCs expirando corretamente
- **Source confidence** — performance por feed

Review trimestral:
- Feeds com FP rate > 5% — investigar/remover
- Feeds com 0 hits em 90 dias — remover (custo > valor)
- Novos feeds — A/B com baseline

---

## 11. Operações práticas

### 11.1 Pipeline mínimo

```
Feed (CSV/STIX) → Parser → Dedup → Score → Push to:
                                            ├── Firewall (blocklist)
                                            ├── EDR (custom IOC)
                                            ├── SIEM (lookup)
                                            └── Proxy (URL filter)
```

### 11.2 Frequência

- **Critical feeds** (C2 ativo): hourly
- **Standard feeds**: daily
- **Low-velocity feeds**: weekly

### 11.3 Storage

- IOCs ativos: 90 dias
- IOCs históricos: 2 anos (para hunting retroativo)
- Total: 5+ anos para regulação

---

## 12. Casos de uso pré-prontos

### 12.1 Anti-phishing

- URLhaus + PhishTank + OpenPhish → URL filter
- Spamhaus DBL → mail gateway
- abuse.ch → e-mail attachment

### 12.2 Anti-malware

- ThreatFox + abuse.ch → EDR custom IOC
- VirusTotal API → file scan inline
- YARA rules via MISP

### 12.3 Anti-C2

- Feodo Tracker + URLhaus C2 → firewall outbound
- DNS sinkhole conhecidos

### 12.4 Anti-bruteforce

- AbuseIPDB + DShield → firewall inbound

---

## 13. Integração

- `/incident-diagnosis` — enriquece alerta
- `/webshell-hunting-proativo` — hipóteses via TTP
- `/dns-exfiltration-detection` — DNS IOCs
- `/anti-phishing-defense` + `/phishing-email-forensics`
- `/dark-web-monitoring` — leaked creds
- `/osint-investigation` — produz IOCs
- `/aws-security-baseline` / `/azure-security-baseline` / `/gcp-security-baseline` — integrar com nativo

---

## 14. Checklist

```text
# Setup
[ ] MISP ou OpenCTI deployado
[ ] Feeds gratuitos essenciais conectados (abuse.ch, OTX, PhishTank, Spamhaus)
[ ] Parser + dedup pipeline
[ ] Storage de IOCs (Elasticsearch/SQL)
[ ] Integração SIEM (lookup table)
[ ] Integração EDR (custom IOC)
[ ] Integração firewall (blocklist)
[ ] Integração proxy (URL filter)

# Operação
[ ] TTL definido por IOC type
[ ] Confidence scoring
[ ] Auto-block threshold (>=80)
[ ] Métricas de FP rate
[ ] Review trimestral de feeds
[ ] Produção própria (pós-IR)
[ ] Compartilhamento com CERT.br/ISAC

# Pessoas
[ ] Analista treinado em MISP
[ ] Runbook de "novo feed" documentado
[ ] Runbook de "FP investigation" documentado
```

---

## 15. Frase-guia final

> **Feed sem dedup é ruído. IOC sem expiração é dano futuro. Comece com 5 feeds gratuitos de alta confiança, automatize bloqueio com threshold, escale com SOAR. Produza IOCs próprios para multiplicar valor pago e compartilhe com comunidade.**
