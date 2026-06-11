---
name: dns-exfiltration-detection
description: Deteccao de exfiltracao de dados e tunelamento por DNS - padroes de TXT/A/AAAA query suspeitos, tamanho anomalo de subdomain (entropia, base64/hex), volume incomum por host, tunneling via iodine/dnscat2/dnstwist, malware C2 over DNS, deteccao em Zeek/Suricata/Cloudflare Gateway/PiHole/NextDNS, queries para Splunk/ELK/Sentinel, baseline de query rate, integracao com SIEM, threat hunting retroativo. Use ao auditar DNS de cliente, apos suspeita de exfil, em projeto que use DoH/DoT (que dificulta visibilidade), ou em hunting trimestral. Complementa dns-and-subdomain-hardening (configuracao defensiva).
---

# dns-exfiltration-detection

> **Frase-guia:** DNS é o canal de saída mais ignorado. Se você não monitora DNS, não monitora a metade do tráfego malicioso real.

## 0. Regra suprema

DNS exfiltration é vetor de baixa fricção: porta 53 raramente bloqueada, payload em subdomain rotineiro, pouca visibilidade em maioria dos ambientes. Tratamento exige **dado** (logs DNS), **baseline** (volume normal) e **correlação** (DNS + endpoint).

Esta skill **complementa** `/dns-and-subdomain-hardening` (que cobre higiene defensiva de zona) com o lado **detecção** de uso malicioso.

---

## 1. Objetivo

Detectar uso malicioso de DNS:

- **Exfiltração** de dados via encoded subdomain (`<base64>.evil.com`)
- **DNS tunneling** (iodine, dnscat2, dns2tcp — túnel completo)
- **C2 over DNS** (Cobalt Strike DNS beacon, Dnscat, custom)
- **Slow exfiltration** (timed, sub-baseline)
- **Domain Generation Algorithm (DGA)** queries (Cryptolocker, Conficker, etc.)
- **Fast Flux** DNS (C2 com IP rotativo)
- **NXDOMAIN flood** (recon ou DoS)
- **DNS rebinding attack** (TTL baixíssimo + IP interno)
- **Cache poisoning** (em DNS interno)
- **Typosquatting** queries (`microsft.com`, `gooogle.com`)
- **Malware beacon** com encoded payload em query

ATT&CK: T1071.004 (DNS), T1568 (Dynamic Resolution), T1572 (Protocol Tunneling)

---

## 2. Por que esta skill existe

Maioria das organizações monitora HTTP/HTTPS mas não DNS. Atacante sabe disso. DNS:

- Porta 53 quase sempre permitida outbound
- Conteúdo de query/response pode carregar dados (até 255 bytes por label, milhares no total)
- TXT records suportam payload arbitrário
- Logs DNS raramente capturados/analisados

DV Digital atendendo cliente que pediu auditoria, ou auto-auditoria, precisa **olhar DNS**.

---

## 3. Prioridade

1. **Garantir captura de logs DNS** (sem dado, sem detecção)
2. **Estabelecer baseline** (volume, top domínios, top tipos de query)
3. **Detectar anomalias** (volume, entropia, padrão temporal)
4. **Correlacionar** com endpoint (qual processo gerou a query)
5. **Validar** (false positives são comuns em CDN/Akamai)
6. **Responder** (bloquear no DNS, isolar host)
7. **Hunting retroativo** (90 dias)
8. **Produtizar** (rule SIEM contínua)

---

## 4. Quando usar

- Auditoria DNS de cliente
- Suspeita de exfil (perda de dados sem causa óbvia)
- Após CVE em malware com C2 over DNS
- Verificação trimestral preventiva
- Após observar tráfego anômalo (volume saída inexplicado)
- Configuração inicial de DNS gateway
- Cliente migrou para DoH/DoT e perdeu visibilidade
- Investigação de cryptominer (alguns usam DNS C2)

---

## 5. Onde capturar logs DNS

### 5.1 Resolver autoritativo do cliente

- **PiHole** — `/var/log/pihole.log` (formato bind)
- **NextDNS** — Logs API + Splunk integration
- **Cloudflare Gateway** — Logpush para R2/S3/Splunk
- **BIND** — query log:
  ```text
  options {
      querylog yes;
  };
  logging {
      channel "querylog" {
          file "/var/log/named/query.log" versions 3 size 10m;
          print-time yes;
      };
      category queries { querylog; };
  };
  ```
- **Unbound** — verbosity + log_queries
- **AdGuard Home** — logs em JSON

### 5.2 Network — passive DNS

- **Zeek** (Bro) — `dns.log` automaticamente
- **Suricata** — output dns events em JSON
- **Splunk Stream** — passive capture
- **Corelight** (commercial Zeek)
- **PacketBeat** (Elastic)

### 5.3 Endpoint

- **Sysmon Event ID 22** (DnsQuery) — Windows
- **eBPF** (osquery, Falco) — Linux
- **EDR** (CrowdStrike, MDE) — telemetria DNS

### 5.4 Cloud

- **AWS Route 53 Resolver query logs** → CloudWatch/S3
- **Azure DNS analytics** → Log Analytics
- **GCP Cloud DNS audit logs**

---

## 6. Padrões de detecção

### 6.1 Volume anômalo

**Splunk:**
```spl
index=dns sourcetype=zeek_dns
| bin _time span=1h
| stats count by _time, src_ip
| eventstats avg(count) AS avg_per_host stdev(count) AS std_per_host by src_ip
| where count > avg_per_host + 3*std_per_host
| sort -count
```

Host gerando 10x mais DNS que normal = investigar.

### 6.2 Entropia alta no subdomínio

Subdomains aleatórios (encoded/base64) têm entropia alta. Subdomain "real" tem palavras pronunciáveis (entropia baixa).

```python
# entropy_check.py
import math
from collections import Counter

def shannon_entropy(s):
    if not s:
        return 0
    counts = Counter(s)
    length = len(s)
    return -sum((c/length) * math.log2(c/length) for c in counts.values())

# Exemplo
print(shannon_entropy("google"))  # ~2.58
print(shannon_entropy("amazon"))  # ~2.25
print(shannon_entropy("a8d7f93kfk29dkfj38d.evil.com"))  # ~4.3 (alta)
```

**Splunk com TermsCount macro:**
```spl
index=dns
| eval subdomain=mvindex(split(query,"."),0)
| eval sublen=len(subdomain)
| where sublen > 20
| eval entropy=`shannon_entropy(subdomain)`  # macro custom
| where entropy > 3.8
| stats count by query, src_ip
```

### 6.3 Tamanho de query/response

Queries normais < 50 bytes. Exfil tem queries de 100-200+ bytes (até o limite).

```spl
index=dns
| eval query_len=len(query)
| where query_len > 100
| stats count by src_ip, query_len, query
| sort -query_len
```

### 6.4 TXT records suspeitos

TXT records são uso normal para SPF/DKIM. Mas TXT queries para hostnames suspeitos:

```spl
index=dns query_type=TXT
  NOT query IN ("_dmarc.*", "_domainkey.*", "*._spf.*", "*.proofpoint.*")
| stats count by query, src_ip
| sort -count
```

### 6.5 NXDOMAIN flood (DGA)

Malware com DGA gera muitos NXDOMAIN antes de achar C2 ativo.

```spl
index=dns response_code=NXDOMAIN
| bin _time span=10m
| stats count by _time, src_ip
| where count > 100
```

### 6.6 Tunneling tools assinaturas

- **iodine**: TXT/CNAME queries, padrão alfabético no subdomain
- **dnscat2**: TXT/MX queries, base32 no payload, hostname curto
- **dns2tcp**: TXT queries, base64 longo

Sigma rule exemplo (dnscat2):
```yaml
title: Possible dnscat2 DNS Tunneling
detection:
  selection:
    EventID: 22  # Sysmon DNS query
    QueryType: TXT
    QueryName|re: '^[a-z0-9]{40,}\.[a-z0-9-]+\.[a-z]{2,}$'
  condition: selection
```

### 6.7 Beacon (intervalos regulares)

Malware "phona casa" em intervalos. Detectar regularidade temporal:

```python
# Buscar queries periódicas de mesmo host para mesmo destino
# Std deviation dos intervalos < 5 segundos com média ~60s = beacon
import statistics
intervals = [t2-t1 for t1,t2 in zip(times, times[1:])]
if statistics.stdev(intervals) < 5 and 30 < statistics.mean(intervals) < 600:
    print("BEACON detected")
```

### 6.8 Fast Flux

Domínio responde com **múltiplos IPs** rotacionando em TTL muito baixo (60-300s).

```spl
index=dns query_type=A
| stats dc(answer) AS unique_ips, avg(ttl) AS avg_ttl by query
| where unique_ips > 5 AND avg_ttl < 300
| sort -unique_ips
```

### 6.9 DGA (Domain Generation Algorithm)

Domínios criados algoritmicamente parecem "aleatórios" mas seguem padrões:

- Entropy alta no SLD (segundo nível)
- TLD comum (.com, .net, .info)
- Comprimento padrão (8-20 chars)
- NXDOMAIN frequente

Ferramentas:
- **dgad** (open source DGA detector)
- ML: Splunk DGA App, FireEye DGA detector

```spl
# Busca por SLDs com entropy alta
index=dns
| rex field=query "^(?<sld>[^.]+)\.[a-z]{2,}(\.[a-z]{2,})?$"
| eval sld_entropy=`shannon_entropy(sld)`
| where sld_entropy > 3.8 AND len(sld) > 10
| stats count by query, src_ip
```

### 6.10 Hardcoded outbound a "suspect" TLDs

```spl
index=dns
| rex field=query "\.(?<tld>[a-z]{2,})$"
| where tld IN ("top","tk","ml","ga","cf","gq","cyou","click","cn","ru","xyz")
| stats count by src_ip, query
| sort -count
```

(Cuidado: muitos TLDs baratos têm uso legítimo — combinar com outros sinais.)

---

## 7. Zeek queries (passive DNS)

```bash
# Top queries por host
zeek-cut id.orig_h query < dns.log | sort | uniq -c | sort -rn | head -50

# Queries com subdomínio muito longo
zeek-cut query < dns.log | awk -F. '{print length($1), $0}' | sort -rn | head -50

# NXDOMAIN por host
zeek-cut id.orig_h query rcode_name < dns.log | grep NXDOMAIN | awk '{print $1}' | sort | uniq -c | sort -rn | head

# TXT queries
zeek-cut id.orig_h query qtype_name < dns.log | grep TXT | head -50
```

---

## 8. Suricata + Sigma

```yaml
# Suricata DNS rule example
alert dns $HOME_NET any -> any any (
  msg:"DNS query with very long subdomain (possible exfil)";
  dns.query; content:"|"; depth:1;
  byte_test:1, >, 50, 0, relative;
  classtype:trojan-activity;
  sid:1000001; rev:1;
)
```

Sigma rules prontos em `github.com/SigmaHQ/sigma/tree/master/rules/network/dns`.

---

## 9. Cloudflare Gateway / DNS

Se cliente usa Cloudflare Zero Trust:

- **Logpush** ativo para R2/S3/Splunk/Datadog
- Eventos DNS incluem query/answer/policy result
- Dashboard mostra anomalia em Analytics

Query Splunk:
```spl
index=cloudflare_gateway sourcetype=dns
  policy_action="blocked" OR query_type="TXT" OR len(query) > 100
| stats count by user_email, query, policy_action
```

---

## 10. Resposta a positivo

1. **Confirmar** com pivote (qual processo? qual usuário?)
2. **Bloquear** no DNS:
   - PiHole: blacklist domínio
   - Cloudflare Gateway: policy block
   - BIND: response policy zone (RPZ)
3. **Isolar host** se for endpoint comprometido
4. **Forense memória** (`/memory-forensics-volatility`)
5. **IR** (`/incident-diagnosis` + `/webshell-and-ioc-detection`)
6. **Rotacionar credenciais** que podem ter sido exfiltradas
7. **Notificar** LGPD se dados pessoais
8. **Compartilhar IOC** (domínio, IP) com CERT.br

---

## 11. Threat hunting retroativo (90 dias)

Após descobrir IOC (domínio ou padrão), buscar histórico:

```spl
# Quem mais consultou esse domínio?
index=dns query="*.evil-domain.com"
| stats values(_time), values(src_ip), values(user) by query

# Outros padrões similares (mesmo registrar, mesmo timing)
index=dns
| eval domain_parts=split(query, ".")
| eval root_domain=mvindex(domain_parts, -2) + "." + mvindex(domain_parts, -1)
| stats count by root_domain
| where root_domain LIKE "%attacker-pattern%"
```

---

## 12. Limitações e desafios

### DoH/DoT (DNS encrypted)

DoH (DNS over HTTPS) e DoT (over TLS) **esconde** queries do resolver corporativo.

Mitigação:
- Bloquear DoH público (Cloudflare 1.1.1.1, Google 8.8.8.8) **na borda**
- Forçar uso do DNS interno
- Detectar TLS para `cloudflare-dns.com`, `dns.google` em SNI
- Detectar HTTPS connections para portas 443 sem SNI conhecido

### Resolver interno comprometido

Se DNS resolver foi comprometido, logs podem ser falsificados. Considerar:
- Logs em múltiplos lugares (resolver + Zeek + endpoint)
- Read-only logging (SIEM remoto)

### Volume alto = falso positivo

CDNs (Akamai, CloudFront) geram subdomínios "estranhos" legítimos:
- `e1234.x.akamaiedge.net`
- `d3kr12.cloudfront.net`

Allowlist conhecida ou tunning de entropy threshold.

---

## 13. Integração com outras skills

- `/dns-and-subdomain-hardening` — configuração defensiva (esta skill é detecção)
- `/incident-diagnosis` — escalar se positivo
- `/webshell-and-ioc-detection` — pivote ao endpoint
- `/network-forensics-pcap` — capturar pcap para análise profunda
- `/memory-forensics-volatility` — se endpoint comprometido
- `/threat-intel-consumption` — feed de domínios maliciosos
- `/anti-phishing-defense` — typosquatting overlap
- `/waf-and-bot-mitigation` — Cloudflare Gateway é overlap

---

## 14. Checklist

```text
# Visibilidade
[ ] Logs DNS sendo capturados (resolver, Zeek, ou endpoint)
[ ] Retenção mínima 90 dias
[ ] SIEM ingerindo logs DNS
[ ] DoH/DoT público bloqueado ou monitorado

# Baseline
[ ] Top 50 domínios consultados conhecidos
[ ] Volume normal por host estabelecido
[ ] Allowlist de CDN/IaaS configurada

# Detecções
[ ] Rule: volume anômalo por host (3 sigma)
[ ] Rule: entropy > 3.8 em subdomínio > 20 chars
[ ] Rule: NXDOMAIN > 100/10min por host (DGA)
[ ] Rule: TXT queries fora de SPF/DKIM/DMARC
[ ] Rule: query > 100 bytes
[ ] Rule: TLDs suspeitos (.tk, .top, etc.) — com cuidado
[ ] Rule: beacon temporal (std < 5s, mean 30-600s)
[ ] Rule: Fast flux (5+ IPs com TTL < 300s)

# Resposta
[ ] RPZ ou blocklist no DNS configurado
[ ] Processo de bloqueio rápido (< 15 min)
[ ] Integração com EDR para isolar host
[ ] Runbook de IR atualizado

# Hunting
[ ] Hunt trimestral agendado
[ ] Compartilhamento de IOCs com CERT.br
```

---

## 15. Frase-guia final

> **DNS é o canal mais subestimado. Sem logs DNS, metade do C2 do mundo passa invisível. Entropy + volume + TXT atypical = receita de bolo da detecção.**
