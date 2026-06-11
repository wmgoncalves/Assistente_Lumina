---
name: network-forensics-pcap
description: Analise forense de captura de pacotes (pcap) com Wireshark/tshark/Zeek/Suricata/NetworkMiner/Brim - extracao de objetos HTTP/SMB/FTP, decode TLS com SSLKEYLOGFILE, deteccao de C2 beacon temporal, file carving, reconstrucao de fluxos, mapping a MITRE ATT&CK, integracao com Suricata/Snort rules, hunting por anomalia, pivoting com SIEM. Use ao analisar pcap durante IR de host comprometido, em debug de problema de rede, em hunting de C2 sem domain visivel, ou em treinamento DFIR. Complementa memory-forensics-volatility e webshell-and-ioc-detection.
---

# network-forensics-pcap

> **Frase-guia:** Pacote não mente — só não conta tudo. Stream tells story; bytes tell truth.

## 0. Regra suprema

PCAP é evidência primária no tempo capturado. Cadeia de custódia, hash, retenção. Conteúdo de pcap **pode ter PII** (senhas em HTTP, cookies, formulários) — LGPD aplica. Em conflito entre "investigar rápido" e "preservar evidência", **preservar primeiro**.

---

## 1. Objetivo

Analisar captura de tráfego (`.pcap` / `.pcapng`) para:

- **Identificar C2** (Command & Control)
- **Extrair payload** (binários transferidos, scripts injetados)
- **Reconstruir sessões** (HTTP, FTP, SMB, SSH)
- **Decodificar TLS** quando possível (com chave de servidor ou SSLKEYLOGFILE)
- **Detectar exfiltração** (volume, destino, padrão temporal)
- **Identificar lateral movement** (PSExec, WMI, RDP, SMB)
- **Detectar protocolos exóticos** (DNS tunneling, ICMP tunneling)
- **Forensics em rede comprometida** (insider threat)
- **Validar IOCs** (mesma conexão em vários hosts?)

ATT&CK: T1071 (Application Layer Protocol), T1041 (Exfiltration over C2), T1571 (Non-Standard Port)

---

## 2. Quando usar

- IR de host comprometido (precisa entender conexões)
- Análise de campanha de phishing (URL → payload → C2)
- Auditoria de tráfego suspeito reportado por usuário
- Treinamento DFIR
- Debug de aplicação (lentidão, erro intermitente — não-forense mas mesmas tools)
- Validação de rules Suricata/Snort
- Análise de malware (sandbox export)

---

## 3. Como coletar pcap (se ainda não tem)

### 3.1 Linux

```bash
# tcpdump - portátil, sempre disponível
sudo tcpdump -i eth0 -w capture.pcap -s 0
# -s 0 = pega pacote inteiro (não trunca)
# Ctrl+C para parar

# Com filtro BPF
sudo tcpdump -i eth0 -w capture.pcap host 192.168.1.100

# Captura ring buffer (não enche disco)
sudo tcpdump -i eth0 -w capture-%Y%m%d-%H%M.pcap -G 3600 -C 100 -W 24
# rotate cada hora, max 100MB por file, mantém 24
```

### 3.2 Windows

- **Wireshark** com WinPcap/Npcap
- **dumpcap.exe** (CLI do Wireshark)
- **netsh** nativo:
  ```cmd
  netsh trace start capture=yes tracefile=C:\capture.etl
  :: ... esperar ...
  netsh trace stop
  :: Converter para pcap:
  etl2pcapng C:\capture.etl C:\capture.pcap
  ```

### 3.3 Switch SPAN port

Para visibilidade real de tráfego, capturar em SPAN/mirror port (não no host alvo).

### 3.4 Cloud

- **AWS VPC Flow Logs** (metadata, não pcap completo)
- **AWS Traffic Mirroring** (full pcap)
- **Azure Network Watcher Packet Capture**
- **GCP Packet Mirroring**

---

## 4. Ferramentas

| Ferramenta | Para |
|---|---|
| **Wireshark** | GUI, análise interativa, decode de centenas de protocolos |
| **tshark** | CLI Wireshark, automação |
| **Zeek (Bro)** | Pcap → logs estruturados por protocolo (`conn.log`, `dns.log`, `http.log`, `ssl.log`, `files.log`) |
| **Suricata** | IDS/IPS + analise offline com rules |
| **Snort** | IDS classic |
| **NetworkMiner** | Reconstrução automática de arquivos transferidos, GUI |
| **Brim / Zui** | Front-end para Zeek logs, queries SQL-like |
| **CapAnalysis** | Web GUI para pcaps grandes |
| **PolarProxy** | Decode TLS com MITM (ambiente de teste) |
| **moloch / Arkime** | Storage e busca em pcap escala |

---

## 5. Triagem inicial — comandos essenciais

```bash
# Info geral do pcap
capinfos capture.pcap

# Estatística rápida
tshark -r capture.pcap -q -z conv,ip      # conversações IP
tshark -r capture.pcap -q -z endpoints,ip # endpoints
tshark -r capture.pcap -q -z io,phs       # protocol hierarchy
tshark -r capture.pcap -q -z http,tree    # HTTP stats
tshark -r capture.pcap -q -z dns,tree     # DNS stats

# Top destinos
tshark -r capture.pcap -T fields -e ip.dst | sort | uniq -c | sort -rn | head

# Top portas destino
tshark -r capture.pcap -T fields -e tcp.dstport | sort | uniq -c | sort -rn | head

# DNS queries
tshark -r capture.pcap -Y dns.qry.name -T fields -e dns.qry.name | sort -u

# HTTP URIs
tshark -r capture.pcap -Y http.request -T fields \
  -e http.request.method -e http.host -e http.request.uri
```

---

## 6. Wireshark — display filters essenciais

```text
# IP específico
ip.addr == 192.168.1.100

# Conversação A↔B
ip.addr == 10.0.0.5 and ip.addr == 10.0.0.10

# HTTP request com URI contendo "admin"
http.request and http.request.uri contains "admin"

# DNS query para domínio específico
dns.qry.name contains "evil"

# TLS Client Hello
tls.handshake.type == 1

# SNI específico
tls.handshake.extensions_server_name == "evil-domain.com"

# TCP flags (SYN flood, etc.)
tcp.flags.syn == 1 and tcp.flags.ack == 0

# HTTP POST com body grande
http.request.method == "POST" and http.content_length > 10000

# ICMP tunneling (data field grande)
icmp and ip.len > 64

# Beacon temporal (mesma destination, intervalos regulares)
ip.dst == 1.2.3.4
# + analisar coluna "Time" para padrão
```

---

## 7. Zeek (Bro) — análise estruturada

```bash
# Rodar Zeek contra pcap
zeek -r capture.pcap

# Gera logs:
# conn.log, dns.log, http.log, ssl.log, files.log, notice.log, weird.log

# Queries com zeek-cut
zeek-cut id.orig_h id.resp_h id.resp_p service < conn.log | sort -u

# HTTP requests
zeek-cut method host uri user_agent < http.log

# SSL/TLS com SNI suspeito
zeek-cut server_name < ssl.log | grep -E "(tk|top|cyou)$"

# Arquivos extraídos
zeek-cut filename mime_type total_bytes md5 < files.log
```

### Zeek scripts úteis

- `policy/protocols/http/detect-webapps.zeek` — detecta webapps
- `policy/protocols/conn/known-hosts.zeek` — baseline
- `policy/frameworks/files/detect-MHR.zeek` — VirusTotal hash check
- Custom scripts para hunting

---

## 8. NetworkMiner — extração automatizada

GUI gratuita (Windows, mas roda em Wine):

- Carrega pcap
- Aba "Files" → todos os arquivos transferidos extraídos
- Aba "Credentials" → tenta extrair logins (HTTP, FTP, etc.)
- Aba "Hosts" → enriquece IPs com OS fingerprint, hostname
- Aba "Messages" → e-mails reconstruídos
- Aba "Images" → thumbnails de imagens HTTP

Output em pasta automatizada — bom para triagem.

---

## 9. Decode TLS

### 9.1 Servidor com chave privada (raro em forense)

```text
Wireshark → Preferences → Protocols → TLS → RSA keys list
Adicionar: IP do servidor, porta, "443", path da chave privada PEM
```

Funciona só para **RSA key exchange** (DH/ECDHE forward secrecy impede).

### 9.2 SSLKEYLOGFILE (cliente coopera)

Cliente que capturou definir variável de ambiente:
```bash
export SSLKEYLOGFILE=~/sslkeys.log
firefox  # ou chrome
```

Wireshark → Preferences → TLS → (Pre)-Master-Secret log filename → `~/sslkeys.log`

Decode forward-secrecy ciphers.

### 9.3 MITM (laboratório / autorizado)

PolarProxy, mitmproxy — não para forense post-fato.

---

## 10. Detecção de C2

### 10.1 Beacon temporal

```python
# beacon_detect.py
import statistics
from scapy.all import rdpcap, IP, TCP

pcap = rdpcap('capture.pcap')

# Agrupar por dst:port, calcular intervalos
streams = {}
for pkt in pcap:
    if IP in pkt and TCP in pkt and pkt[TCP].flags & 0x02:  # SYN
        key = (pkt[IP].src, pkt[IP].dst, pkt[TCP].dport)
        streams.setdefault(key, []).append(pkt.time)

for key, times in streams.items():
    if len(times) < 5:
        continue
    intervals = [t2-t1 for t1, t2 in zip(times, times[1:])]
    if not intervals:
        continue
    mean = statistics.mean(intervals)
    if mean < 1:  # ignore burst
        continue
    stdev = statistics.stdev(intervals) if len(intervals) > 1 else 0
    cv = stdev / mean if mean > 0 else 0
    if cv < 0.1 and 30 < mean < 3600:
        print(f"BEACON: {key} mean={mean:.1f}s stdev={stdev:.1f}s")
```

### 10.2 Cobalt Strike default beacon

- C2 path `/dpixel`, `/__utm.gif`, `/jquery-3.3.1.min.js` (default malleable)
- User-Agent padrão (atualizar lista)
- Jitter time pattern

### 10.3 Sliver / Meterpreter / Empire

Detecção via Sigma + Suricata rules em github.

---

## 11. Extração de arquivos (file carving)

### 11.1 Wireshark

`File → Export Objects → HTTP / SMB / FTP / TFTP`

Lista todos os arquivos transferidos, save individual.

### 11.2 tshark

```bash
# Extrair objetos HTTP
tshark -r capture.pcap --export-objects http,./extracted/
```

### 11.3 Zeek + foremost

```bash
zeek -r capture.pcap LocalZeekScript::extract_all_files
# Gera ./extract_files/ com tudo
```

### 11.4 Foremost (file carving genérico)

```bash
foremost -i capture.pcap -o ./carved
```

### 11.5 Análise dos extraídos

```bash
# Hashes
for f in extracted/*; do
  echo "$(sha256sum $f) $(file $f)"
done

# VirusTotal lookup (via API)
# YARA scan
yara -r ~/yara-rules/all.yar extracted/

# Strings rápido
strings extracted/file1 | head -100
```

---

## 12. Suricata em modo offline

```bash
# Rules ET Open + custom
suricata -r capture.pcap -S suricata.rules -l output/

# Resultado em output/fast.log, eve.json
jq '.alert | {timestamp, signature, src_ip, dest_ip}' output/eve.json
```

---

## 13. Brim/Zui para pcap grande

Brim importa pcap, gera logs Zeek, expõe interface SQL-like:

```sql
-- "Queries" em Brim
* | sort ts | head 20

count() by id.resp_h | sort count desc

dns.log query=*.evil-domain.com

http.log status_code=200 file_extension="exe"

ssl.log server_name=*.tk
```

---

## 14. Workflow de análise

### Fase 1 — Pre-análise

1. Hash do pcap
2. capinfos (verificar integridade)
3. Cópia working
4. Notas

### Fase 2 — Triagem (10-30 min)

5. Protocol hierarchy (proporção HTTP/DNS/SSL/SMB)
6. Top conversations (quem fala com quem)
7. Top destinations
8. Top ports
9. Hipóteses iniciais

### Fase 3 — Foco

10. Filtrar host suspeito
11. Ver primeiras conexões dele (timing)
12. SNI/Host de TLS/HTTP
13. DNS queries

### Fase 4 — Extração

14. Export Objects
15. Hash + VirusTotal de cada
16. YARA scan
17. Strings em executáveis

### Fase 5 — C2 detection

18. Beacon analysis (script ou intuição)
19. JA3/JA3S fingerprint da TLS
20. User-Agent estranho

### Fase 6 — Lateral movement (se aplicável)

21. SMB conexões pós-comprometimento
22. RDP novo
23. WMI / PsExec patterns

### Fase 7 — Relatório

24. Timeline conexões
25. IOCs (IP, domain, hash, JA3)
26. Evidências exportadas

---

## 15. JA3/JA3S — TLS fingerprinting

JA3 = hash do TLS Client Hello (cipher suites, extensions, version).
JA3S = hash do Server Hello.

Mesmo malware = mesmo JA3 mesmo trocando IP/domain.

```bash
# tshark com plugin
# Zeek já gera ja3 em ssl.log se script instalado
# Bases públicas: ja3er.com (descontinuado, mas há mirrors)
```

---

## 16. Mapeamento ATT&CK típico

| Padrão observado | Técnica |
|---|---|
| HTTP POST repetido a /api/checkin | T1071.001 (Web Protocol) |
| DNS TXT com base64 | T1071.004 (DNS) |
| SMB to internal host pós-comp | T1021.002 (SMB/Win Admin Shares) |
| RDP de IP estranho | T1021.001 (RDP) |
| ICMP com payload grande | T1095 (Non-Application Layer) |
| TLS para SNI exótico | T1071.001 / T1573 |
| FTP outbound de servidor | T1048 (Exfil Alt Protocol) |
| HTTP form GET com data grande | T1041 (Exfil over C2) |
| Mesmo cliente, mesmo destino, intervalo regular | T1102 (Web Service) C2 |

---

## 17. Integração com outras skills

- `/incident-diagnosis` — protocolo geral
- `/webshell-and-ioc-detection` — host comprometido
- `/memory-forensics-volatility` — correlação RAM + rede
- `/dns-exfiltration-detection` — DNS-specific
- `/threat-intel-consumption` — enriquecer IOCs
- `/lgpd-compliance-check` — pcap pode ter PII
- `/hitl-checkpoint` — bloqueio de IP exige aprovação

---

## 18. Checklist

```text
# Coleta
[ ] Autorização escrita
[ ] -s 0 (full packet) no tcpdump
[ ] Ring buffer se duração longa
[ ] Hash do pcap
[ ] Cadeia de custódia

# Análise
[ ] capinfos verificado
[ ] Cópia working
[ ] Protocol hierarchy
[ ] Top conversations
[ ] Filtros para host suspeito
[ ] Beacon analysis
[ ] Export Objects
[ ] YARA em arquivos
[ ] VirusTotal lookup
[ ] JA3/JA3S coletado
[ ] Suricata rules run

# Pós
[ ] Timeline completa
[ ] IOCs documentados (IP/domain/hash/JA3)
[ ] Arquivos extraídos preservados
[ ] LGPD avaliada
[ ] Compartilhar IOCs (CERT.br)
```

---

## 19. O que NÃO fazer

- ❌ Capturar pcap em produção sem autorização (LGPD — pode ter senha em HTTP)
- ❌ Compartilhar pcap publicamente (credenciais!)
- ❌ Trabalhar no pcap original (sempre copy)
- ❌ Confiar em Wireshark "expert info" sem validar
- ❌ Filtrar antes de ter visão geral (perde contexto)
- ❌ Ignorar pacotes "weird.log" do Zeek
- ❌ Conclusão sem JA3 quando TLS é maioria

---

## 20. Frase-guia final

> **Pcap é cinema; logs são roteiro. Comece pelos números (capinfos, hierarchy, top), descubra os personagens (conversations), siga a história (filter por host), termine pelo crédito (hash, JA3, timeline). Sem autorização, não capture.**
