---
name: webshell-hunting-proativo
description: Threat hunting proativo de webshell em ambientes hibridos (PHP/Node/Java/IIS/cPanel/VPS/Cloud) - formulacao de hipotese ATT&CK T1505.003, queries SIEM/EDR para Sysmon/auditd/wp-content/uploads, deteccao por anomalia em processo filho de w3wp/apache/nginx/php-fpm, baseline de hashes, FIM (File Integrity Monitoring) com Wazuh/AIDE/Tripwire, integracao com Sigma rules, YARA scanning, hunting retroativo de 90 dias. Complementa webshell-and-ioc-detection (forense reativa) com a abordagem proativa de threat hunting. Use trimestralmente, apos alerta de WAF/IDS, em projeto recem-herdado, ou apos campanha publica conhecida.
---

# webshell-hunting-proativo

> **Frase-guia:** Hunting começa com hipótese, não com alerta. Se você espera o alerta, já perdeu 30+ dias de dwell time.

## 0. Regra suprema

Hunting proativo é **investigação sem alerta prévio**. Trabalha por hipótese baseada em ATT&CK, threat intel ou risco conhecido. Não é IR (incident response), é prevenção do IR. Em conflito entre velocidade e profundidade, **profundidade vence** — melhor 3 hunts bem feitos no trimestre que 30 superficiais.

Esta skill complementa `/webshell-and-ioc-detection` (que é reativo, com IOC conhecido) com a abordagem **proativa** (hipótese-driven).

---

## 1. Objetivo

Procurar webshells em ambientes do cliente/próprio **antes** de virem alerta. Cobre:

- **PHP webshells** (c99, r57, wso, b374k, custom)
- **ASP/ASPX webshells** (chinachopper, custom)
- **JSP webshells** (em Tomcat/JBoss)
- **Node.js backdoors** (em apps Express/Next.js)
- **Python webshells** (em Flask/Django)
- **Living-off-the-land** (uso de `eval`, `system`, função existente sem dropper)
- **Memory-only webshells** (sem arquivo no disco, raros mas existem)
- **Lateral movement post-exploitation** (cron, systemd, .bashrc, MOTD, ld.so.preload)
- **Persistência cross-reboot** (init scripts, services)

ATT&CK: T1505.003 (Web Shell), T1190 (Exploit Public-Facing App), T1059 (Command Interpreter)

---

## 2. Por que esta skill existe

`/webshell-and-ioc-detection` cobre **resposta reativa** (já vi sinal, agora investigo). Esta skill cobre o **trabalho proativo** que SOC maduro faz mensalmente:

- DV Digital fechando contrato de "auditoria preventiva"
- Cliente novo que herdou ambiente sem histórico
- Após CVE crítica em CMS/framework (apache/wordpress/joomla)
- Após campanha pública conhecida (ex: Magento bug do mês)
- Verificação trimestral em projetos críticos
- Validação de baseline pós-deploy

---

## 3. Prioridade

1. **Hipótese clara** baseada em ATT&CK ou threat intel
2. **Dados disponíveis** (sem dado, não tem hunt)
3. **Queries com baixo falso positivo** primeiro
4. **Validação manual** dos hits
5. **Documentação** dos findings (positivos E negativos)
6. **Transformar hunt bem-sucedido em rule SIEM** (detecção contínua futura)
7. **Compartilhar IOCs** descobertos

---

## 4. Metodologia de hunting

### Modelo "Hypothesis-Driven Hunting" (David Bianco / SqrrlMaturity)

```
Hipótese → Identificar dado → Query → Análise → Validação → Documentação
                                          ↓
                                     False positive
                                          ↓
                                  Refinar query, voltar
```

### Pyramid of Pain (David Bianco)

```
TTP                ← mais difícil de mudar para o atacante (priorizar)
Tools
Network/Host Artifacts
Domain Names
IP Addresses
Hashes             ← mais fácil de mudar
```

Hunt por **TTP** (técnicas) vence hunt por hash.

---

## 5. Hipóteses úteis para webshell

| # | Hipótese | TTP | Data source |
|---|---|---|---|
| H1 | "Existe arquivo `.php`/`.aspx`/`.jsp` em `/uploads/` ou similar" | T1505.003 | File system inventory |
| H2 | "Processo `w3wp.exe`/`apache2`/`nginx`/`php-fpm` está spawn-ando `cmd.exe`/`sh`/`bash`" | T1059 + T1505.003 | EDR/Sysmon process create |
| H3 | "Há POST grande para arquivo `.php` em path de upload" | T1190 → T1505.003 | Web server access log |
| H4 | "Arquivo `.htaccess` foi modificado em janela suspeita" | T1505 persistence | File integrity monitoring |
| H5 | "Conexão outbound de servidor web para C2 conhecido" | T1071 | DNS + proxy logs |
| H6 | "Usuário admin novo criado em CMS sem ticket aprovado" | T1136 | App auth logs |
| H7 | "Cron job estranho aparece em /etc/cron.d ou crontab do usuário web" | T1053 | File system + audit log |
| H8 | "Arquivo PHP com `eval`+`base64_decode` em pasta não esperada" | T1027 (obfuscation) | grep/YARA |
| H9 | "Login bem-sucedido em painel admin de IP geográfico inusual" | T1078 | App auth + GeoIP |
| H10 | "WP-CLI/PHP-CLI invocado pelo user web rodando comando suspeito" | T1059.004 | Bash history + audit |

---

## 6. Queries de hunting por hipótese

### H1 — Arquivos executáveis em uploads/

**Linux (find):**
```bash
find /var/www -type f \( -name "*.php" -o -name "*.phtml" -o -name "*.phar" \) \
  -path "*/uploads/*" -o -path "*/tmp/*" -o -path "*/temp/*" 2>/dev/null

# WordPress específico
find /var/www -type f -name "*.php" \
  \( -path "*/wp-content/uploads/*" -o -path "*/wp-content/mu-plugins/*" \) 2>/dev/null
```

**Windows (PowerShell):**
```powershell
Get-ChildItem -Path 'C:\inetpub\wwwroot' -Recurse -Include *.aspx,*.asmx,*.ashx -File `
  -ErrorAction SilentlyContinue |
  Where-Object { $_.DirectoryName -match 'upload|tmp|temp' }
```

**SIEM (Splunk, file inventory index):**
```spl
index=file_inventory sourcetype=fim
  path="*/uploads/*" extension IN (php, phtml, phar, aspx, jsp)
| stats values(modify_time) by host, path
| sort -modify_time
```

### H2 — Web server spawn de shell

**Sysmon (Windows):**
```sql
-- Splunk
index=sysmon EventCode=1
  ParentImage IN ("*\\w3wp.exe", "*\\httpd.exe", "*\\nginx.exe", "*\\node.exe")
  Image IN ("*\\cmd.exe", "*\\powershell.exe", "*\\pwsh.exe", "*\\wscript.exe")
| stats count by ParentImage, Image, CommandLine, User
```

**Auditd (Linux):**
```bash
# Ativar auditd rules
auditctl -a always,exit -F arch=b64 -S execve \
  -F uid=33 -F gid=33 -k web-exec  # www-data uid 33

# Buscar
ausearch -k web-exec -ts today -i | grep -E "comm=\"(sh|bash|nc|curl|wget|python)\""
```

**EDR (CrowdStrike Falcon Query):**
```sql
FileName IN ['sh', 'bash', 'cmd.exe', 'powershell.exe']
ParentBaseFileName IN ['w3wp.exe', 'httpd', 'nginx', 'php-fpm', 'node']
| table ContextTimeStamp, ParentImageFileName, ImageFileName, CommandLine, UserName
```

### H3 — POST grande em path de upload

**Apache access log:**
```bash
awk '/POST.*\/uploads\/.*\.(php|phtml|aspx)/' /var/log/apache2/access.log

# Top IPs com POST a paths PHP em uploads
awk '$6=="\"POST" && $7 ~ /\/uploads\/.*\.php/ {print $1}' /var/log/apache2/access.log |
  sort | uniq -c | sort -rn | head
```

**Nginx:**
```bash
grep -E 'POST .*/uploads/.*\.(php|phtml)' /var/log/nginx/access.log |
  awk '{print $1, $7, $9}'
```

**Splunk:**
```spl
index=web_access method=POST
  uri_path="*/uploads/*"
  uri_path IN ("*.php", "*.phtml", "*.aspx", "*.jsp")
  status="200"
| stats count by src_ip, uri_path, http_user_agent
```

### H4 — `.htaccess` modificado em janela suspeita

```bash
# Linux: arquivos .htaccess modificados nas últimas 30 dias
find /var/www -name ".htaccess" -mtime -30 -ls

# Comparar com baseline conhecido
sha256sum /var/www/html/.htaccess
# Comparar com hash que estava em backup ou repo
```

**Wazuh FIM:**
```xml
<directories check_all="yes" report_changes="yes">/var/www</directories>
<ignore>/var/www/html/wp-content/cache</ignore>
```

### H5 — Outbound suspeito de servidor web

**Logs DNS:**
```spl
index=dns_logs query_source IN ("web-srv-*")
  NOT query IN ("amazonaws.com", "cloudfront.net", "googleapis.com", "...allowlist...")
| stats count by query_source, query
| where count > 10
```

**Iptables/UFW (Linux):**
```bash
# Verificar conexões ativas do user web
ss -tunap | grep -E "uid:33|www-data"

# Histórico (se conntrack habilitado)
conntrack -L | grep -E "dport=(443|80)" | awk '{print $5}' | sort -u
```

### H6 — Admin user novo criado

**WordPress:**
```bash
wp user list --role=administrator --format=table
wp user list --role=administrator --orderby=registered --order=desc
```

**Postgres/MySQL app:**
```sql
SELECT id, username, email, role, created_at
FROM users
WHERE role IN ('admin', 'superadmin')
ORDER BY created_at DESC LIMIT 20;
```

**Drupal:**
```bash
drush user-information --roles=administrator
```

### H7 — Cron job estranho

```bash
# Cron do usuário web
crontab -l -u www-data
crontab -l -u apache
crontab -l -u nginx

# Cron do sistema
cat /etc/cron.d/* /etc/cron.daily/* /etc/cron.hourly/* /etc/crontab 2>/dev/null

# Diff com baseline
diff <(crontab -l -u www-data 2>/dev/null) /backup/cron-www-data-baseline.txt
```

### H8 — Padrões PHP suspeitos (eval + base64)

```bash
# Pattern de webshell encoded
grep -rE "eval\s*\(\s*base64_decode\s*\(" /var/www --include="*.php" -l
grep -rE "eval\s*\(\s*gzinflate\s*\(\s*base64_decode" /var/www --include="*.php" -l
grep -rE "@?eval\s*\(\s*\\\$_(GET|POST|REQUEST|COOKIE)" /var/www --include="*.php" -l

# YARA scan (rule do Florian Roth)
yara -r /opt/yara-rules/webshells.yar /var/www
```

### H9 — Login admin de IP estranho

**WordPress (com plugin de log):**
```sql
SELECT user_login, ip_address, country, created_at
FROM wp_security_log
WHERE event='login_success' AND role='administrator'
  AND created_at > NOW() - INTERVAL 30 DAY
ORDER BY created_at DESC;
```

**Splunk:**
```spl
index=auth event_type=login_success user_role=admin
  | iplocation src_ip
  | search NOT Country IN ("BR")  # ajustar
  | stats values(src_ip), values(City) by user
```

### H10 — Bash history suspeito do user web

```bash
# Se www-data tem shell (ele NÃO deveria):
cat /var/www/.bash_history 2>/dev/null

# Comandos suspeitos
grep -E "curl|wget|nc|python -c|perl -e|chmod 777|crontab -e" /var/www/.bash_history
```

---

## 7. YARA rules essenciais para webshell

```yara
// webshell_generic.yar
rule webshell_php_eval_base64 {
    meta:
        author = "DV Digital"
        description = "PHP webshell pattern: eval + base64_decode"
        score = 80
    strings:
        $a = /eval\s*\(\s*base64_decode\s*\(/ ascii
        $b = /eval\s*\(\s*gzinflate\s*\(\s*base64_decode/ ascii
        $c = /eval\s*\(\s*str_rot13\s*\(\s*base64_decode/ ascii
    condition:
        any of them
}

rule webshell_php_user_input_eval {
    meta:
        score = 90
    strings:
        $a = /@?eval\s*\(\s*\$_(GET|POST|REQUEST|COOKIE)/ ascii
        $b = /@?assert\s*\(\s*\$_(GET|POST|REQUEST|COOKIE)/ ascii
    condition:
        any of them
}

rule webshell_aspx_chinachopper {
    meta:
        description = "China Chopper ASPX webshell"
    strings:
        $a = "Page Language=\"Jscript\"" ascii
        $b = "Request.Item[" ascii
        $c = "eval(" ascii
    condition:
        all of them
}

rule webshell_known_names {
    meta:
        description = "Known webshell filenames"
    strings:
        $a = "c99shell" ascii
        $b = "r57shell" ascii
        $c = "WSO " ascii nocase
        $d = "b374k" ascii
    condition:
        any of them
}
```

Rodar contra árvore web:
```bash
yara -r /opt/yara-rules/webshells.yar /var/www -s | tee yara-results.txt
```

Rules prontas: [github.com/Neo23x0/signature-base](https://github.com/Neo23x0/signature-base) (Florian Roth, MIT/CC).

---

## 8. Sigma rules para SIEM

Sigma = formato cross-SIEM. Rules de webshell prontas:

- **github.com/SigmaHQ/sigma** → `rules/web/` e `rules/windows/process_creation/` (T1505)

Exemplos:
- `proc_creation_win_iis_susp_shell_spawn.yml` (w3wp spawning shell)
- `web_susp_php_file_uploaded_to_writeable_dir.yml`
- `web_webshell_creation.yml`

Converter Sigma → Splunk/Sentinel/ELK:
```bash
pip install sigma-cli
sigma convert -t splunk rules/web/web_webshell_creation.yml
sigma convert -t microsoft365defender rules/windows/process_creation/proc_creation_win_iis_susp_shell_spawn.yml
```

---

## 9. Baseline e File Integrity Monitoring

Sem baseline, hunt é cego.

### Estabelecer baseline

```bash
# Hash de toda árvore web
find /var/www -type f \( -name "*.php" -o -name "*.html" -o -name "*.js" \) \
  -exec sha256sum {} \; > /backup/baseline-2026-05-31.txt

# Inventário de cron
for u in $(cut -d: -f1 /etc/passwd); do
  echo "== $u =="
  crontab -l -u "$u" 2>/dev/null
done > /backup/cron-baseline-2026-05-31.txt

# Inventário de processos esperados
ps auxef > /backup/proc-baseline-2026-05-31.txt
```

### FIM contínuo

**AIDE (Advanced Intrusion Detection Environment):**
```bash
apt install aide
# Configurar /etc/aide/aide.conf
aide --init
mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
# Check periódico (cron daily):
aide --check
```

**Tripwire:** mais antigo, paid version

**Wazuh:** OSSIM + agent, excelente para SOC pequeno

**OSSEC:** open source, free, FIM + log analysis

---

## 10. Threat hunting com EDR comercial

### CrowdStrike Falcon

```sql
// Query: Spawn de shell de processo web
FileName IN ['cmd.exe','powershell.exe','sh','bash','nc','python']
ParentBaseFileName IN ['w3wp.exe','httpd','nginx','php-fpm','node.exe']
| table ComputerName, ParentBaseFileName, FileName, CommandLine, UserName
```

### Microsoft Defender for Endpoint (KQL)

```kql
DeviceProcessEvents
| where InitiatingProcessFileName in~ ("w3wp.exe","httpd.exe","nginx.exe","php-fpm")
| where FileName in~ ("cmd.exe","powershell.exe","pwsh.exe","sh","bash")
| project Timestamp, DeviceName, InitiatingProcessFileName, FileName, ProcessCommandLine
| order by Timestamp desc
```

### SentinelOne

```sql
ProcessName IN ("cmd.exe","powershell.exe") AND
ParentProcessName IN ("w3wp.exe","httpd","nginx","php-fpm")
```

---

## 11. Memory-only / fileless webshell

Mais raro mas existe. Caracteres:

- Sem arquivo no disco
- Carregado via `eval` em runtime
- Persistência via PHP session / Redis / DB row
- Detecção: anomalia em processo (memória grande, conexão estranha)

Hunting:
```bash
# Verificar memoria de processo PHP-FPM
pmap -x <pid> | sort -k 3 -n -r | head

# Strings em memoria (se acesso a /proc do user)
cat /proc/<pid>/maps  # ranges
sudo gcore <pid>  # dump
strings core.<pid> | grep -E "eval|base64|cmd"
```

Para memory forensics avançado, ver `/memory-forensics-volatility`.

---

## 12. Fluxo completo de um hunt

```
1. ESCOLHER HIPÓTESE
   ↓
2. VERIFICAR DADOS DISPONÍVEIS
   - Tenho EDR? SIEM? Sysmon? Auditd?
   - Quanto tempo de log? (90d é mínimo decente)
   ↓
3. EXECUTAR QUERY
   ↓
4. ANALISAR HITS
   - Quantos true positives?
   - Quantos false positives?
   - Qual o padrão dos FPs?
   ↓
5. REFINAR
   - Adicionar exclusões para FPs conhecidos
   - Tornar a query mais específica
   ↓
6. VALIDAR
   - Pivotar dos hits: o que mais esse usuário/host fez?
   - Procurar lateralidade
   ↓
7. CONCLUIR
   - True positive → IR (incident response, ver /webshell-and-ioc-detection)
   - False positive → documentar regra de exclusão
   - Sem hit → documentar como evidência de "controle funcionando"
   ↓
8. PRODUTIZAR
   - Transformar query em rule SIEM contínua
   - Adicionar ao runbook trimestral
   ↓
9. RELATAR
   - Hipótese
   - Dados usados
   - Queries
   - Findings
   - Próximos hunts
```

---

## 13. Documentação de hunt — template

```markdown
# Hunt #2026-Q2-01 — Webshell spawn from web processes

## Hipótese
"Servidores web da DV Digital estão spawning cmd.exe/sh nos últimos 90 dias"
ATT&CK: T1505.003 + T1059

## Dados utilizados
- Sysmon Event ID 1
- Defender ATP - DeviceProcessEvents
- Apache access logs (correlação)

## Queries
[colar queries usadas]

## Findings
- Total hits: 47
- True positives: 0
- False positives: 47
  - 32: monitoring agent legítimo
  - 15: cron de manutenção

## Conclusão
Sem evidência de webshell ativo. Rule SIEM criada para monitorar continuamente
com exclusão dos 2 padrões legítimos.

## Próximo hunt
Q3: Verificar hipótese H4 (htaccess modificado) + H8 (eval+base64 em uploads)

## Lições aprendidas
- 90 dias de log foi suficiente
- Defender query rodou em < 30s
- Acrescentar dashboard contínuo para essa query

## Anexos
- Queries (txt)
- Output sanitizado (csv)
```

---

## 14. Cadência sugerida

| Cliente | Frequência | Profundidade |
|---|---|---|
| Cliente pequeno (HostGator/cPanel) | Semestral | H1, H4, H8 (file-based) |
| Cliente médio (VPS) | Trimestral | H1, H2, H3, H4, H7, H8 |
| Cliente enterprise (com SOC) | Mensal | Todos os 10 + custom |
| Ambiente próprio DV Digital | Mensal | Todos |

---

## 15. Integração com outras skills

- `/webshell-and-ioc-detection` — reativa, quando hunt acha algo
- `/incident-diagnosis` — quando confirma IR
- `/file-upload-security` — prevenção primária
- `/wordpress-cms-hardening` — vetor comum
- `/dns-and-subdomain-hardening` — outbound suspeito
- `/anti-phishing-defense` — vetor de entrada de credencial
- `/secrets-and-env-guard` — rotação pós-comprometimento
- `/php-shared-hosting-hardening` — sem EDR/SIEM, hunting limitado a logs

---

## 16. Checklist

```text
# Preparação
[ ] Hipótese definida (referenciando ATT&CK ou threat intel)
[ ] Dados disponíveis confirmados (período, retenção)
[ ] Baseline existe (FIM, hash, cron)
[ ] Ferramentas prontas (YARA rules, Sigma rules, queries SIEM)

# Execução
[ ] Queries rodadas
[ ] Hits documentados
[ ] False positives identificados
[ ] True positives escalados para IR

# Pós-hunt
[ ] Documentação completa do hunt
[ ] Queries adicionadas como rule SIEM contínua
[ ] Próximo hunt agendado
[ ] Lições compartilhadas com time/cliente
[ ] IOCs (se positivo) compartilhados com CERT.br
```

---

## 17. Frase-guia final

> **Hunt não é sorte — é hipótese. Comece pelo ATT&CK, valide com baseline, transforme bom hunt em rule SIEM. Dwell time alto é falha de hunting, não falha de prevenção.**
