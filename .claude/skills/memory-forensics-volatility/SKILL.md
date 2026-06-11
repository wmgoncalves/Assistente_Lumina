---
name: memory-forensics-volatility
description: Analise forense de memoria RAM com Volatility 3 e Volatility 2 - aquisicao via WinPmem/LiME/AVML/dumpit/Belkasoft RAM Capturer, plugins para processos suspeitos (pslist/pstree/psscan), conexoes (netscan), DLLs injetadas (malfind/ldrmodules/hollowfind), rootkit detection, registry hives em memoria, extracao de credenciais (mimikatz/lsadump), timeline (timeliner), strings/Yara em memoria, integracao com EDR. Use em IR de host comprometido para identificar malware fileless/rootkit/RAT/keylogger, em DFIR de VPS suspeita, ou em treinamento forense. Complementa webshell-and-ioc-detection e incident-diagnosis.
---

# memory-forensics-volatility

> **Frase-guia:** O atacante apaga o disco, mas a RAM lembra. Memory forensics é o último farol quando tudo mais foi sanitizado.

## 0. Regra suprema

Memory forensics tem **janela curta** — RAM se perde no shutdown. Coleta deve ser ASAP, antes de qualquer interação que altere estado. Cadeia de custódia rígida. Em conflito entre "estabilizar host" e "preservar memória", **preservar primeiro, estabilizar depois**.

---

## 1. Objetivo

Investigar comprometimento via análise de RAM dump:

- **Malware fileless** (sem arquivo no disco, só em RAM)
- **Rootkits** (Kernel mode, hidden processes)
- **Process injection** (DLL injection, process hollowing, atom bombing)
- **Credential dump** (LSASS, browser passwords cache)
- **Keyloggers** ativos
- **C2 implants** com persistência só em memory
- **Strings** de payloads (URLs, IPs, encoded data)
- **Network state** no momento do dump
- **Registry hives** em memory (Windows)
- **Linux/macOS** kernel modules suspeitos

ATT&CK: T1055 (Process Injection), T1014 (Rootkit), T1003 (OS Credential Dumping)

---

## 2. Quando usar

- Host suspeito que precisa investigação profunda
- EDR alertou mas não conseguiu pegar payload
- Cliente reporta lentidão + comportamento estranho
- VPS comprometida sem logs (ou logs apagados)
- Treinamento DFIR
- Validação de IR (memory dump pré e pós)

**Não usar para:**
- Host inacessível remotamente (precisa coleta local ou via agente)
- Sistemas embarcados sem suporte
- Cliente sem autorização escrita (memory dump pode capturar PII)

---

## 3. Aquisição — primeiro passo

### 3.1 Windows

**WinPmem (open source, free):**
```cmd
:: Como admin
winpmem_v4.0.exe -o memory.raw

:: Hash imediato
certutil -hashfile memory.raw SHA256
```

**DumpIt (Comae, simples):**
```cmd
DumpIt.exe
:: Cria <hostname>-<date>.raw na pasta atual
```

**Belkasoft RAM Capturer (free):**
- GUI, runs as admin, output raw

**Magnet RAM Capture (free):**
- GUI alternativa

**Hibernation file** (sem ferramenta extra):
```cmd
:: Forçar hibernate (RAM serializa para C:\hiberfil.sys)
shutdown /h
:: Coletar hiberfil.sys
```

### 3.2 Linux

**LiME (Linux Memory Extractor):**
```bash
# Compilar para o kernel exato do host
git clone https://github.com/504ensicsLabs/LiME
cd LiME/src
make
# Modulo .ko gerado

# Inserir e dump
insmod ./lime-X.X.X-XX-generic.ko "path=/mnt/usb/memory.lime format=lime"

# Remover modulo apos
rmmod lime
```

**AVML (Microsoft, Rust):**
```bash
# Download statico
./avml memory.lime

# Hash
sha256sum memory.lime
```

**/proc/kcore** (não confiável em kernels modernos com KASLR):
```bash
# Não recomendado em produção, mas existe
dd if=/proc/kcore of=memory.raw bs=1M
```

### 3.3 macOS

**OSXPMem** (descontinuado, mas funciona em macOS antigos)

**Apple Silicon (M1+):** sem ferramenta open source madura — usar **Sumuri Recon ITR** (paid)

### 3.4 Cloud / Virtualização

**VMware:**
```bash
# Snapshot inclui .vmem (raw memory)
# Snapshot, then convert
vmware-vdiskmanager (não é direto)
# Ou pegar .vmem do datastore
```

**VirtualBox:**
```bash
VBoxManage debugvm "VM-NAME" dumpvmcore --filename=memory.elf
```

**KVM/QEMU:**
```bash
# Via virsh
virsh dump --memory-only --format elf <domain> dump.elf

# Converter ELF para raw para Volatility
volatility -f dump.elf imagecopy -O dump.raw
```

**AWS EC2 nitro:** **EBS snapshot + introspection** (não direto, usar **GRR Rapid Response** ou **Velociraptor**)

### 3.5 Cadeia de custódia

```text
| Item | Hora coleta | SHA-256 | Coletor | Storage | Tamanho |
|---|---|---|---|---|---|
| memory.raw | 2026-05-31 14:23:12 UTC | abc... | [NOME] | evidence-srv/case-001/ | 16GB |
```

---

## 4. Volatility 3 (preferido para casos modernos)

### 4.1 Instalação

```bash
git clone https://github.com/volatilityfoundation/volatility3
cd volatility3
python3 -m pip install -r requirements.txt

# Run
python3 vol.py -h
```

### 4.2 Banner / OS detection

```bash
# Quem é esse dump?
python3 vol.py -f memory.raw banners.Banners
# Output: kernel version → escolher profile certo

python3 vol.py -f memory.raw windows.info
python3 vol.py -f memory.raw linux.info
```

### 4.3 Processos (essencial)

```bash
# Windows
python3 vol.py -f memory.raw windows.pslist
python3 vol.py -f memory.raw windows.pstree
python3 vol.py -f memory.raw windows.psscan       # encontra processos ocultos
python3 vol.py -f memory.raw windows.psxview      # cross-view (rootkit detection)

# Linux
python3 vol.py -f memory.raw linux.pslist
python3 vol.py -f memory.raw linux.pstree
python3 vol.py -f memory.raw linux.psscan
```

Procurar:
- Nome de processo estranho (`svhost.exe` ≠ `svchost.exe`)
- Parent process inadequado (notepad spawn de cmd?)
- Path de execução em `\Temp\` ou `\AppData\Local\Temp\`
- Processo presente em `psscan` mas ausente em `pslist` (rootkit!)

### 4.4 Conexões de rede

```bash
# Windows
python3 vol.py -f memory.raw windows.netscan
python3 vol.py -f memory.raw windows.netstat

# Linux
python3 vol.py -f memory.raw linux.sockstat
```

Procurar:
- Conexões para IP de país inusual
- Porta destino suspeita (4444, 1337, 5555)
- Processo dono inesperado (notepad com conexão TCP?)

### 4.5 Process injection (malfind)

```bash
python3 vol.py -f memory.raw windows.malfind
# Procura regiões VAD com PAGE_EXECUTE_READWRITE sem arquivo no disco
# = injeção típica
```

Hits do `malfind` indicam shellcode/DLL injetada. Dumpear:
```bash
python3 vol.py -f memory.raw -o ./dump windows.malfind --dump
# Cria .img das regiões — rodar YARA / strings
```

### 4.6 DLLs carregadas

```bash
python3 vol.py -f memory.raw windows.dlllist --pid 1234
python3 vol.py -f memory.raw windows.ldrmodules --pid 1234
# Discrepância entre 3 listas = injection
```

### 4.7 Strings / YARA

```bash
# Strings de processo específico
python3 vol.py -f memory.raw windows.dumpfiles --pid 1234
strings -el dumped.exe | grep -E "http|password|cmd"

# YARA scan em memoria
python3 vol.py -f memory.raw windows.yarascan.YaraScan --yara-file /opt/yara-rules/all.yar
```

### 4.8 Registry (Windows)

```bash
# Hives presentes em memoria
python3 vol.py -f memory.raw windows.registry.hivelist

# Run keys (persistência)
python3 vol.py -f memory.raw windows.registry.printkey \
  --key "Software\Microsoft\Windows\CurrentVersion\Run"

# Services
python3 vol.py -f memory.raw windows.registry.printkey \
  --key "SYSTEM\CurrentControlSet\Services"
```

### 4.9 Credenciais (somente com autorização)

```bash
# LSASS dump (cuidado: pega senha/hash dos usuarios logados)
python3 vol.py -f memory.raw windows.hashdump
python3 vol.py -f memory.raw windows.lsadump
```

**LGPD:** isso pega credenciais — fazer somente sob autorização escrita.

### 4.10 Linux specific

```bash
# Modulos do kernel
python3 vol.py -f memory.raw linux.lsmod

# bash history em memoria
python3 vol.py -f memory.raw linux.bash

# Hidden mounts
python3 vol.py -f memory.raw linux.mount

# Variaveis de ambiente
python3 vol.py -f memory.raw linux.envars
```

---

## 5. Volatility 2 (legado, ainda útil para casos antigos)

```bash
# Profile (achar via imageinfo)
vol.py -f memory.raw imageinfo

# Usar profile detectado
vol.py -f memory.raw --profile=Win7SP1x64 pslist
vol.py -f memory.raw --profile=Win7SP1x64 malfind
vol.py -f memory.raw --profile=Win7SP1x64 connections
vol.py -f memory.raw --profile=Win7SP1x64 mimikatz  # plugin externo
```

---

## 6. Plugins essenciais (Volatility 2 + 3)

| Plugin | Função |
|---|---|
| `pslist` / `pstree` | Processos via EPROCESS list |
| `psscan` | Processos via scan da pool (acha ocultos) |
| `psxview` | Comparação cross-view (anti-rootkit) |
| `malfind` | Detecta process injection |
| `hollowfind` | Detecta process hollowing |
| `ldrmodules` | DLLs (lista oficial vs scan) |
| `dlllist` | DLLs por processo |
| `netscan` / `netstat` / `sockstat` | Conexões de rede |
| `cmdline` | Argumentos de processo |
| `getsids` | SIDs do processo (Windows) |
| `hivelist` / `printkey` | Registry |
| `mftparser` | MFT em memória |
| `filescan` | Arquivos abertos em memória |
| `yarascan` | Scan YARA em memória |
| `timeliner` | Timeline forense |
| `hashdump` / `lsadump` | Credenciais |
| `mimikatz` (V2) | Credenciais avançado |
| `linux.bash` (V3) | Histórico bash do usuário |
| `linux.lsmod` | Módulos kernel |

---

## 7. Workflow forense

### Fase 1 — Pre-análise

1. Banner/info → confirmar OS, kernel
2. Hash do dump (cadeia de custódia)
3. Copia working (não trabalhar no original)
4. Notas com hipótese inicial

### Fase 2 — Triagem rápida (30 min)

5. `pslist` + `pstree` → ver processos esperados vs estranhos
6. `psscan` + `psxview` → procurar rootkit
7. `netscan` → conexões C2
8. `cmdline` dos processos suspeitos
9. `malfind` → injection
10. Anotar PIDs suspeitos

### Fase 3 — Análise profunda dos PIDs suspeitos

11. `dlllist` / `ldrmodules` por PID
12. `dumpfiles --pid <PID>` → dump executável
13. `strings` no dump → URLs, IPs
14. YARA contra dumps
15. VirusTotal hash de cada DLL

### Fase 4 — Persistência

16. `registry.printkey` Run keys
17. `registry.printkey` Services
18. `registry.printkey` Scheduled Tasks
19. Linux: `linux.lsmod`, `linux.bash`

### Fase 5 — Credenciais (com autorização)

20. `hashdump` / `lsadump`
21. Comparar com hashes conhecidos vazados
22. Avisar usuários para mudar senha

### Fase 6 — Timeline

23. `timeliner` → ordenar tudo cronologicamente
24. Correlacionar com logs de SIEM
25. Determinar tempo de comprometimento (dwell time)

### Fase 7 — Relatório

26. Documentar findings com referências (PID, plugin, comando exato)
27. Hash de cada dump intermediário
28. Salvar workspace para reprodução

---

## 8. Indicadores de comprometimento

### 8.1 Processos suspeitos

- Spelling incomum (`svhost`, `scvhost`, `services32`)
- Path em `%TEMP%`, `%APPDATA%\Local\Temp`
- Sem assinatura digital (Windows)
- Parent inusual (`explorer.exe` → `powershell.exe -EncodedCommand`)
- Imagem com path mas EPROCESS aponta para outra
- Processo presente em `psscan` ausente em `pslist`

### 8.2 Network

- Conexões para IP não-corporativo
- Porta destino exótica
- Protocolo errado (servidor web fazendo conexão de saída)
- Conexão half-open prolongada

### 8.3 Injection

- VAD com `PAGE_EXECUTE_READWRITE` sem arquivo
- Discrepância entre `dlllist` e `ldrmodules`
- Hollowfind hits

### 8.4 Persistência

- Run key apontando para path em Temp
- Service criado recentemente apontando para binary suspeito
- Scheduled Task com `powershell.exe -enc`
- WMI subscription estranho

### 8.5 Credentials

- LSASS com handles abertos por processo não-system
- Mimikatz strings em memória

---

## 9. Distros prontas

- **SIFT Workstation** (SANS) — todas as tools incluídas
- **REMnux** — focado em malware reverse
- **Tsurugi Linux** — DFIR oriented
- **Kali Forensics mode** — boot sem montar disco

---

## 10. Integração com outras skills

- `/incident-diagnosis` — protocolo geral
- `/webshell-and-ioc-detection` — host comprometido via web
- `/webshell-hunting-proativo` — hunting que escalou
- `/secrets-and-env-guard` — rotação de credenciais expostas
- `/lgpd-compliance-check` — memory dump pode ter PII
- `/hitl-checkpoint` — análise de credenciais exige aprovação
- `/network-forensics-pcap` — correlacionar memória + tráfego

---

## 11. Checklist

```text
# Aquisição
[ ] Autorização escrita do cliente (memory pode ter PII)
[ ] Ferramenta de aquisição compatível com OS
[ ] Storage de destino com espaço (RAM size × 1.5)
[ ] Hash SHA-256 do dump
[ ] Cadeia de custódia documentada
[ ] Dump em mídia write-blocked / read-only para preservação

# Triagem
[ ] Banner / OS info
[ ] pslist + pstree analisados
[ ] psscan vs pslist (rootkit check)
[ ] netscan analisado
[ ] malfind executado

# Análise
[ ] PIDs suspeitos identificados
[ ] DLLs analisadas
[ ] Strings extraídas
[ ] YARA scan executado
[ ] Registry persistence verificado
[ ] Timeline gerado

# Pós
[ ] Hashes dos dumps individuais
[ ] Findings documentados
[ ] IOCs compartilhados (CERT.br, ISAC)
[ ] Cliente notificado (com escopo)
[ ] LGPD avaliada
```

---

## 12. O que NÃO fazer

- ❌ Coletar memória sem autorização (LGPD)
- ❌ Trabalhar no dump original (sempre copy)
- ❌ Rebootar host antes de coleta
- ❌ Logar no host suspeito (altera estado)
- ❌ Confiar em `pslist` só (rootkit esconde)
- ❌ Compartilhar dump publicamente (tem credenciais)
- ❌ Apagar dump após análise sem retenção definida
- ❌ Rodar `mimikatz` em produção sem ambiente isolado

---

## 13. Frase-guia final

> **A RAM é cidade-fantasma 60 segundos após o shutdown. Colete primeiro, autorize antes, analise depois, documente sempre. Rootkit esconde do pslist, mas raramente do psscan + malfind.**
