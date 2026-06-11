---
name: webshell-and-ioc-detection
description: Deteccao forense de webshell, backdoor, cryptominer, web skimmer (Magecart) e indicadores de comprometimento (IOC) em servidores PHP, Node.js, WordPress, hospedagem compartilhada e VPS. Inclui padroes regex para varredura, localizacoes suspeitas, nomes tipicos de webshell (c99, r57, wso, b374k), comandos de scan (Linux+cPanel+Windows+WordPress), fluxo forense com cadeia de custodia, restauracao de backup limpo, rotacao de credenciais e monitoramento pos-incidente. Complementa incident-diagnosis com IOCs concretos.
---

# webshell-and-ioc-detection

> **Frase-guia:** Preservar, isolar, identificar, erradicar, restaurar, rotacionar, monitorar. Nessa ordem. Nunca apague antes de preservar.

## 0. Regra suprema

Segurança tem prioridade absoluta. Em incidente confirmado:

- **Preservar evidências ANTES de limpar**
- Não apagar arquivo suspeito sem snapshot
- Não rebootar VPS comprometida antes de coletar memória/processos
- Não responder ao atacante
- Não comunicar publicamente antes de avaliar dano

A análise é **incremental, auditável, com cadeia de custódia**. Combina com `/incident-diagnosis` (protocolo genérico) e `/hitl-checkpoint` (limpeza é ação destrutiva — exige aprovação humana).

---

## 1. Objetivo

Detectar, documentar e responder a comprometimento em servidor/projeto web:

- **Webshell PHP** (eval, base64_decode, gzinflate, str_rot13, assert, preg_replace /e)
- **Webshell Node.js** (vm.runInNewContext, child_process, dynamic require, eval, new Function)
- **Webshell em uploads** não validados (.php, .phtml, .phar em /uploads/)
- **Backdoor em theme/plugin WordPress** (especialmente em nulled/crackeados)
- **Cryptominer** (XMRig, kdevtmpfsi, kinsing, cpuminer, minerd)
- **Web skimmer / Magecart** (JS injetado em checkout capturando cartão)
- **C2 beacon** (conexão saindo para domínio/IP suspeito)
- **Persistência**: cron job estranho, systemd unit nova, .htaccess modificado, MOTD alterado
- **Modificação de arquivos** do CMS/framework (header.php, footer.php, functions.php, index.php)
- **Defacement** (página inicial trocada)
- **SEO spam / pharma hack** (links/conteúdo invisível inserido)
- **Backdoor em conta admin** (usuário extra criado, role escalado)
- **Skimming de cartão** em checkout (PCI scope)

---

## 2. Por que esta skill existe

`/incident-diagnosis` é o protocolo geral de incidentes (parar, preservar, isolar). Esta skill é o **manual forense específico** para comprometimento de servidor web — com:

- IOCs concretos (regex, paths, nomes de arquivo, processos)
- Comandos prontos por ambiente (Linux/VPS, cPanel/HostGator, Windows, WordPress)
- Fluxo passo a passo de coleta de evidência
- Padrões reconhecidos de webshell conhecidos
- Política de "restauração de backup limpo" antes de "tentar limpar"

---

## 3. Prioridade

1. **Preservar evidência** (snapshot, logs, hashes, processos em memória)
2. **Isolar** (modo manutenção, bloquear tráfego, desabilitar conta)
3. **Identificar escopo** (quais arquivos, desde quando, qual conta)
4. **Identificar vetor** (como entrou — upload? credencial vazada? CMS desatualizado?)
5. **Erradicar** (preferir restore de backup limpo a "tentar limpar")
6. **Rotacionar credenciais** (todas, por máquina limpa)
7. **Hardenizar** (impedir reentrada)
8. **Monitorar** (30+ dias)
9. **Documentar** (timeline, vetor, lições)
10. **Notificar LGPD** se houve vazamento de dados pessoais

---

## 4. Quando usar

Sintomas observáveis que disparam esta skill:

- Site lento sem motivo
- Resultados estranhos no Google (SEO spam japonês, farmácia, casino)
- Browser bloqueando o site (Safe Browsing alerta)
- Cliente reporta redirecionamento inesperado
- Cliente reporta pop-up de golpe
- Conta de hospedagem **suspensa** por abuso
- E-mail do domínio começa a cair em spam massivamente
- Pico de tráfego sem campanha ativa
- Erro 500 intermitente
- CPU/memória anormais
- Arquivos modificados sem deploy
- Cron jobs / systemd units desconhecidos
- Outbound para IP/domínio estranho
- Notificação do provedor ("malware detectado")
- Alerta do Google Search Console ("site comprometido")
- Alerta de WAF/Cloudflare sobre tráfego anômalo
- Login admin de origem desconhecida
- Usuário admin novo não criado por você
- `wp-options` alterado (siteurl, home)

---

## 5. Quando pode não se aplicar diretamente

- Aplicação totalmente serverless sem filesystem persistente (verificar logs do provider e secrets)
- Frontend 100% estático em CDN sem backend (verificar apenas o CDN e o pipeline de build)

Mesmo assim, manter monitoramento. Comprometimento serverless acontece (envenenamento de build, secret vazado).

---

## 6. Contexto: vetores comuns de entrada

Para investigar, primeiro entender por onde o atacante pode ter entrado:

| Vetor | Sintoma típico | Onde investigar |
|---|---|---|
| **Upload sem validação** | `.php` em `/uploads/` | `wp-content/uploads/`, `public_html/uploads/`, custom upload paths |
| **Plugin/theme nulled** | Backdoor pré-instalado | `wp-content/plugins/<plugin-nulled>/` (e variantes) |
| **CMS desatualizado** | Arquivo criado via RCE conhecida | Comparar `wp checksum core` |
| **Credencial vazada** | Atacante sobe arquivos via FTP/SSH/cPanel | Logs de auth, alertas de login estranho |
| **Supply chain** | npm/composer pacote comprometido | `package-lock.json`, `composer.lock` |
| **Máquina admin infectada** | Roubo de chave SSH/FTP | Verificar máquina local + rotacionar |
| **Senha fraca** | Brute force bem-sucedido | Logs `wp-login.php`, `/painel/login` |
| **SQL injection** | Webshell via SELECT INTO OUTFILE | Logs DB, webshell em paths esperados |
| **Permissão 777** | Atacante escreve em qualquer pasta | `find / -perm 777` |

---

## 7. IOCs — Indicadores de comprometimento

### 7.1 Padrões em código PHP (alto risco)

```regex
eval\s*\(
base64_decode\s*\(
gzinflate\s*\(
gzuncompress\s*\(
str_rot13\s*\(
assert\s*\(
preg_replace\s*\(.*\/e
create_function\s*\(
\$_(GET|POST|REQUEST|COOKIE|SERVER)\s*\[.*\]\s*\(
system\s*\(
shell_exec\s*\(
passthru\s*\(
proc_open\s*\(
popen\s*\(
exec\s*\(
file_put_contents\s*\(.*\$_
move_uploaded_file\s*\(.*\.php
include\s*\(\s*\$_
require\s*\(\s*\$_
include_once\s*\(\s*\$_
require_once\s*\(\s*\$_
@\$_(GET|POST|REQUEST)\s*\[.*\]\s*\(
chr\(\d+\)\s*\.\s*chr\(\d+\)
hex2bin\s*\(
\\x[0-9a-fA-F]{2}
```

**Padrões combinados (assinatura forte de webshell):**
```regex
eval\s*\(\s*base64_decode\s*\(
eval\s*\(\s*gzinflate\s*\(\s*base64_decode\s*\(
eval\s*\(\s*str_rot13\s*\(\s*base64_decode\s*\(
@?eval\s*\(\s*\$_(GET|POST|REQUEST|COOKIE)
preg_replace\s*\(\s*['\"][^'\"]+\/e
```

### 7.2 Padrões em Node.js / JavaScript backend

```regex
eval\s*\(
new Function\s*\(
require\s*\(\s*\$\{
import\s*\(\s*\$\{
require\s*\(\s*req\.|require\s*\(\s*request\.
child_process
vm\.runInNewContext
vm\.runInThisContext
vm\.createContext
process\.binding
Buffer\.from\(\s*[^,)]+,\s*['\"]base64['\"]\s*\)\.toString.*eval
fetch\([^)]*\)\.then.*eval
spawn\s*\(\s*req\.
exec\s*\(\s*req\.
__dirname\s*\+\s*req\.
fs\.(read|write|unlink)File\s*\(\s*req\.
```

### 7.3 Padrões em HTML/JS injetado (skimmer Magecart)

```regex
document\.forms.*addEventListener.*submit
btoa\s*\(.*card.*\)
btoa\s*\(.*cvv.*\)
new Image\(\).*src.*=.*\?
fetch\(['\"]https?://[^/]+\.(top|tk|xyz|click|cyou|cf|gq|ml|ga)
window\.location\s*=\s*['\"]https?://(?!seudominio)
addEventListener\s*\(\s*['\"]submit['\"]
querySelectorAll?\s*\(\s*['\"]input
\bccnum|\bcvv|\bcardnumber|\bcardholder
encodeURIComponent\([^)]*\)\s*\)\s*;.*new\s+Image
```

### 7.4 Localizações suspeitas — onde procurar arquivos novos

```text
# Uploads (jamais devem conter executável)
/uploads/*.php
/uploads/*.phtml
/uploads/*.phar
/wp-content/uploads/*.php
/public_html/wp-content/uploads/*.php

# Raiz pública com nomes aleatórios
/public_html/*.php (arquivos não esperados na raiz)
/public_html/<hash>.php
/public_html/.<oculto>.php

# WordPress
/wp-content/themes/<theme>/header.php (modificação recente)
/wp-content/themes/<theme>/footer.php
/wp-content/themes/<theme>/functions.php
/wp-content/plugins/<plugin>/.<oculto>.php
/wp-content/mu-plugins/*.php (must-use plugins, executados sempre)
/wp-includes/<arquivo-novo>.php
/wp-admin/<arquivo-novo>.php

# Sistema
/tmp/*.php
/tmp/.X*
/dev/shm/*
/var/tmp/*

# Locais de descoberta (CMS exposto)
/.well-known/ (fora do esperado)
/.git/ exposto publicamente
/phpinfo.php
/adminer.php
/info.php

# Persistência Linux
~/.ssh/authorized_keys (chave nova)
/etc/cron.d/* (job novo)
/etc/cron.daily/*
/etc/cron.hourly/*
/etc/systemd/system/*.service (unit nova)
/etc/rc.local
/etc/profile.d/*.sh
/etc/ld.so.preload (preload de lib maliciosa)

# Configuração modificada
.htaccess (regras estranhas: RewriteRule injetado, AddType, php_value)
nginx.conf
httpd.conf
```

### 7.5 Nomes típicos de webshell

```text
shell.php, c99.php, r57.php, wso.php, b374k.php, b374k.shell.php
wso2.5.php, marijuana.php, sniper.php, alfa.php, alfashell.php
adminer.php (quando não esperado), phpinfo.php, info.php
.<algo>.php (arquivo oculto)
*.php.suspected (cPanel marca arquivos detectados)
license.php (em pastas que não deveriam ter)
wp-login.bak.php
xmlrpc.bak.php
config.bak.php
hidden.php, secret.php, mini.php, micro.php
{8-char-hash}.php
log.php, logs.php em uploads
img.php, image.php em uploads (com nome de imagem mas extensão php)
```

### 7.6 Indicadores de cryptominer

- **Processos**: `xmrig`, `kdevtmpfsi`, `kinsing`, `cpuminer`, `minerd`, `xmrigCC`, `cnrig`
- **CPU**: 100% sustentado por horas, especialmente fora de horário
- **Outbound**: domínios `xmr.*`, `pool.*`, `monero*`, `*.cryptonight*`, `*.miningpool*`
- **Arquivos**: `/tmp/.X*`, `/dev/shm/*`, `/var/tmp/.*`
- **Cron**: jobs com `curl | bash`, base64, paths estranhos
- **Network**: porta `3333`, `4444`, `5555`, `7777`, `14444`, `14433` (pools comuns)

### 7.7 Indicadores em logs

- Acesso a `/wp-admin/admin-ajax.php` com parâmetros estranhos
- POST grande (> 10KB) para arquivo `.php` em `/uploads/`
- 200 OK em arquivos que deveriam dar 404
- User-Agent vazio
- User-Agent suspeito: `zgrab`, `python-requests`, `Go-http-client`, `curl`, `Java`, `nikto`, `sqlmap`, `wpscan`
- Padrões `?cmd=`, `?exec=`, `?action=upload`, `?file=`, `?include=`
- Login bem-sucedido fora de horário comercial
- Login bem-sucedido de país inesperado
- Múltiplas tentativas de login com diferentes usuários
- POST repetido em `/wp-cron.php` ou `/xmlrpc.php` (abuse típico)

---

## 8. Comandos de varredura

### 8.1 Linux / VPS com SSH

```bash
# Arquivos modificados nas últimas 24h
find /var/www -type f -mtime -1 -ls
find /var/www -type f -mtime -7 -ls  # 7 dias

# Arquivos PHP em pasta de uploads (não deveria existir)
find /var/www -path '*/uploads/*.php' -o -path '*/uploads/*.phtml' -o -path '*/uploads/*.phar'

# Arquivos com padrão de webshell — assinatura forte
grep -rE "eval\s*\(\s*base64_decode" /var/www --include="*.php"
grep -rE "eval\s*\(\s*gzinflate\s*\(\s*base64_decode" /var/www --include="*.php"
grep -rE "@?eval\s*\(\s*\\\$_(GET|POST|REQUEST|COOKIE)" /var/www --include="*.php"
grep -rE "preg_replace\s*\(\s*['\"][^'\"]+/e" /var/www --include="*.php"

# Arquivos ocultos suspeitos
find /var/www -name ".*.php"
find /var/www -name ".*.phtml"

# Arquivos PHP com permissão de escrita pelo grupo/outros
find /var/www -name "*.php" -perm /022 -ls

# Cron jobs do usuário web
crontab -l -u www-data 2>/dev/null
crontab -l -u nobody 2>/dev/null
ls -la /etc/cron.d/ /etc/cron.daily/ /etc/cron.hourly/

# Cron de TODOS os usuários
for user in $(cut -f1 -d: /etc/passwd); do
  echo "== $user =="
  crontab -l -u "$user" 2>/dev/null
done

# Systemd units recém-criadas
find /etc/systemd/system/ -mtime -30 -ls
systemctl list-unit-files --state=enabled

# Processos suspeitos
ps auxf | grep -E "xmrig|kdevtmpfsi|kinsing|minerd|cpuminer"
ps auxf | awk '$3>50' | grep -v "^USER"  # CPU > 50%

# Conexões outbound estranhas
ss -tunap | grep ESTAB | grep -v ":22\|:80\|:443\|:53\|:25\|:587\|:465\|:993\|:995"
netstat -tunap 2>/dev/null | grep ESTAB

# Arquivos com SUID (escalada de privilégio)
find / -perm -4000 -type f 2>/dev/null

# Authorized keys (acesso SSH não esperado)
find / -name "authorized_keys" 2>/dev/null -exec ls -la {} \;
cat ~/.ssh/authorized_keys 2>/dev/null

# Logs recentes de login
last -F | head -30
lastb -F | head -30  # falhas

# Verificar /etc/passwd por usuário novo
sudo grep -E "/bin/(bash|sh|zsh)" /etc/passwd

# Verificar binaries modificados
ls -lac /bin/ /usr/bin/ /sbin/ /usr/sbin/ | head -50

# rpm/dpkg verify (se gerenciador de pacotes existe)
rpm -Va 2>/dev/null | head -30
debsums -c 2>/dev/null | head -30
```

### 8.2 Hospedagem compartilhada — cPanel / HostGator (sem shell direto)

Pelo cPanel:

- **File Manager → Settings → Show Hidden Files** (ON)
- **File Manager → Sort by Last Modified** (descending)
- **File Manager → Search** por extensão `.php` em `/public_html/wp-content/uploads/`
- **File Manager → Search** por `.suspected` (cPanel marca arquivos detectados)
- **phpMyAdmin** → procurar registros recentes em `wp_options`, `wp_users`, `wp_usermeta`
- **cPanel → Statistics → CPU usage** por processo
- **cPanel → Logs → Raw Access Logs** → baixar
- **cPanel → Email → Track Delivery** (envio massa = comprometido)
- **cPanel → Visitors / Latest Visitors** → IPs estranhos
- **cPanel → Account Information** → revisar permissões

WordPress via cPanel ou painel:

- Plugin **Wordfence** scan
- Plugin **Sucuri Security** scan
- Plugin **iThemes Security** alterações de arquivo
- **WP Admin → Usuários** → verificar admins
- **WP Admin → Plugins** → verificar plugins desconhecidos

### 8.3 WordPress específico (CLI ou painel)

```bash
# WP-CLI
wp checksum core --version=$(wp core version)
wp checksum plugin --all
wp checksum theme --all

# Usuários administrativos
wp user list --role=administrator

# Opções suspeitas
wp option get siteurl
wp option get home
wp option get blogname
wp option get admin_email

# Listar plugins instalados vs ativos
wp plugin list --status=active
wp plugin list --status=must-use

# Listar themes
wp theme list

# Verificar atualizações pendentes (versão antiga = vetor)
wp core check-update
wp plugin status

# Eventos de cron WP
wp cron event list
```

Manualmente:

- Verificar `wp-content/mu-plugins/` (must-use, executam sempre, vetor de persistência)
- Verificar `wp-config.php` modificado (datas, conteúdo extra)
- Verificar `.htaccess` da raiz do WP
- Verificar tabela `wp_options` campo `active_plugins`

### 8.4 Windows (PowerShell) — análise local de código

```powershell
# Arquivos PHP/JS modificados nos últimos 7 dias
Get-ChildItem -Path 'D:\projeto' -Recurse -Include *.php,*.js,*.html -File |
  Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) } |
  Select-Object FullName, LastWriteTime |
  Sort-Object LastWriteTime -Descending

# Buscar padrões de webshell
Get-ChildItem -Path 'D:\projeto' -Recurse -Include *.php |
  Select-String -Pattern 'eval\s*\(\s*base64_decode|gzinflate\s*\(\s*base64_decode|eval\s*\(\s*\$_'

# Hashes de arquivos críticos
Get-FileHash 'D:\projeto\wp-config.php' -Algorithm SHA256
```

### 8.5 Análise de logs Apache/Nginx

```bash
# POST em uploads (alerta)
grep -E "POST .*/uploads/.*\.(php|phtml)" /var/log/apache2/access.log

# Top IPs (volume)
awk '{print $1}' /var/log/apache2/access.log | sort | uniq -c | sort -rn | head -20

# Top URLs acessadas
awk '{print $7}' /var/log/apache2/access.log | sort | uniq -c | sort -rn | head -20

# User-Agents incomuns
awk -F\" '{print $6}' /var/log/apache2/access.log | sort -u |
  grep -iE "scanner|zgrab|nikto|sqlmap|wpscan|masscan|nuclei|python-requests"

# Acessos com 200 OK em paths de webshell típicos
grep -E "GET /.*(shell|c99|r57|wso|b374k|adminer)\.php.*200" /var/log/apache2/access.log

# Tentativas de login em wp-login (brute force)
grep "wp-login.php" /var/log/apache2/access.log | wc -l
grep "POST /wp-login" /var/log/apache2/access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head

# Padrões `?cmd=`, `?exec=`, etc.
grep -E "\?(cmd|exec|action|file|include)=" /var/log/apache2/access.log
```

---

## 9. Fluxo de resposta forense

### Fase 1 — Confirmar e preservar (não destruir)

1. **Confirmar comprometimento** — não agir em falso positivo
2. **Documentar hora de início** da resposta (cadeia de custódia)
3. **Preservar evidências**:
   - **Snapshot do filesystem** (VPS): `tar` com timestamps
     ```bash
     tar --acls --xattrs -czf /backup/snapshot-$(date +%Y%m%d-%H%M).tar.gz /var/www
     ```
   - **Hashes** de arquivos suspeitos:
     ```bash
     find /var/www -name "*.php" -exec sha256sum {} \; > hashes.txt
     ```
   - **Logs** (Apache, Nginx, PHP, syslog, auth.log, secure)
   - **Dump de processos**:
     ```bash
     ps auxef > processos.txt
     ```
   - **Conexões**:
     ```bash
     ss -tunap > conexoes.txt
     netstat -tunap > netstat.txt 2>/dev/null
     ```
   - **Cron jobs e systemd units**
   - **Comando `last`, `lastb`** (login history)
   - **Memória** (se VPS importante): `LiME` ou `dd if=/dev/mem`

### Fase 2 — Isolar

4. **Modo de manutenção**:
   - WordPress: ativar plugin de manutenção
   - Custom: deploy de página estática "Em manutenção. Voltamos em breve."
   - `.htaccess` redirect: `RewriteRule ^(.*)$ /manutencao.html [L]`
5. **Bloquear IP atacante** no firewall
6. **Desabilitar contas comprometidas** (cPanel, WP-admin, SSH)
7. **Desabilitar webhooks externos** que podem ser explorados durante limpeza

### Fase 3 — Identificar vetor

8. **Arquivo mais antigo** do conjunto suspeito → janela de quando entrou
9. **Log do upload** que criou o primeiro arquivo malicioso
10. **Plugin/dependência** adicionada na mesma janela
11. **Login bem-sucedido** próximo da janela
12. **Atualização não aplicada** que cobria CVE conhecida

### Fase 4 — Erradicar

13. **Decisão preferida: RESTORE de backup limpo** (anterior à janela de comprometimento)
14. **Se restore não for viável** (backup também comprometido ou inexistente):
    - Remover backdoors identificados (lista, hash, mover para `_quarentena/`, não apagar imediatamente)
    - Restaurar arquivos do framework/CMS via checksum oficial
    - Atualizar CMS/plugins/dependências
    - **Não confiar em "limpar"** — preferir reinstalação a partir do zero quando possível
15. **NUNCA** apagar arquivo suspeito sem snapshot (perde evidência forense)

### Fase 5 — Rotacionar credenciais (TODAS, por máquina LIMPA)

16. Senhas:
    - FTP, SSH (revogar chaves, gerar novas)
    - cPanel
    - WP-admin (todos os usuários)
    - DB
    - SMTP
    - API keys (Stripe, MP, OpenAI, etc.)
    - OAuth tokens
    - Tokens de deploy (Vercel, Netlify)
    - Tokens GitHub/GitLab
    - Webhook secrets (HMAC)
    - Qualquer variável sensível em `.env`
17. **Combinar com `/secrets-and-env-guard`**

### Fase 6 — Hardening preventivo

18. `/file-upload-security` (impedir reentrada via upload)
19. `/php-shared-hosting-hardening` (.htaccess block em uploads)
20. `/wordpress-cms-hardening` (se WP)
21. `/waf-and-bot-mitigation` (Cloudflare + ModSecurity)
22. 2FA em cPanel + WP-admin
23. Backup automático verificado (testar restore!)
24. Atualizar tudo

### Fase 7 — Monitorar

25. Logs por 30+ dias
26. Verificação semanal de arquivos modificados
27. Google Search Console
28. WAF/Cloudflare alertas
29. Wordfence/Sucuri alertas

### Fase 8 — Documentar e notificar

30. **Timeline** detalhada (UTC + horário local)
31. **Vetor identificado**
32. **Lições aprendidas**
33. **Atualizar processo** interno
34. **LGPD**: se houve vazamento de dados pessoais, **notificar ANPD** em até 2 dias úteis. Comunicar titulares. Documentar fato gerador, escopo, mitigação.
35. **Cliente afetado**: comunicação clara, sem expor demais

---

## 10. APIs / práticas perigosas que facilitam webshell

Bloquear / auditar:

- `move_uploaded_file()` sem validação de extensão real (magic bytes)
- `file_put_contents()` com path do usuário
- `unzip` em pasta executável
- `chmod 777` em uploads (vetor clássico)
- `eval` / `assert` em qualquer ponto (especialmente com input)
- `include` / `require` com variável do usuário
- `system` / `exec` / `shell_exec` com input
- `.htaccess` writable pelo web user (web user altera config)
- WP `DISALLOW_FILE_MODS=false` em produção (permite editar plugin/theme via admin)
- WP admin user com senha fraca
- WP `xmlrpc.php` exposto sem rate limit
- Plugin/theme nulled (vetor 1)
- Plugin/theme desatualizado
- PHP versão EOL
- `display_errors=On` em produção (vaza paths)

---

## 11. Integração com skills existentes

- `/incident-diagnosis` — protocolo genérico de incidente (esta skill é o capítulo específico de webshell)
- `/file-upload-security` — prevenção de entrada (uploads)
- `/php-shared-hosting-hardening` — bloqueio em .htaccess
- `/wordpress-cms-hardening` — WP-específico
- `/secrets-and-env-guard` — rotação pós-incidente
- `/backup-and-recovery-strategy` — restore limpo
- `/lgpd-compliance-check` — notificação se houve vazamento
- `/hitl-checkpoint` — antes de apagar/restaurar (irreversível)
- `/waf-and-bot-mitigation` — mitigar reentrada via borda
- `/dependency-firewall` — se vetor foi supply chain
- `/skill-orchestrator` — em conflito

---

## 12. Checklist de auditoria forense

```text
# Preservação (FAZER ANTES DE QUALQUER LIMPEZA)
[ ] Hora de início registrada (cadeia de custódia)
[ ] Snapshot completo do filesystem armazenado fora do servidor
[ ] Hashes SHA256 de arquivos suspeitos coletados
[ ] Logs Apache/Nginx/PHP copiados
[ ] Dump de processos coletado (ps auxf)
[ ] Conexões ativas coletadas (ss/netstat)
[ ] Cron jobs revisados e dumpados
[ ] Systemd units revisados
[ ] /etc/passwd, /etc/shadow comparados com versão anterior

# Isolamento
[ ] Modo de manutenção ativo
[ ] IPs atacantes bloqueados no firewall
[ ] Conta cPanel/WP-admin suspeita desabilitada
[ ] Webhooks externos pausados

# Identificação
[ ] Arquivo mais antigo do conjunto suspeito identificado (janela)
[ ] Vetor de entrada identificado (upload, credencial, RCE, supply chain)
[ ] Plugins/deps comprometidos identificados
[ ] Login estranho cruzado com janela
[ ] Atualização não aplicada que cobria CVE relevante

# Erradicação
[ ] Backup limpo (anterior à janela) disponível
[ ] Decisão de restore vs limpeza documentada
[ ] Backdoors movidos para _quarentena/ (não apagados)
[ ] Arquivos framework/CMS restaurados via checksum oficial
[ ] CMS/plugins/dependências atualizadas

# Rotação
[ ] FTP rotacionado
[ ] SSH (chaves) rotacionadas
[ ] cPanel rotacionado
[ ] WP-admin (todos os usuários) rotacionados
[ ] DB rotacionado
[ ] SMTP rotacionado
[ ] API keys rotacionadas
[ ] OAuth tokens revogados/regenerados
[ ] Webhook secrets rotacionados
[ ] Rotação feita por máquina LIMPA (não pela suspeita)

# Hardening
[ ] /file-upload-security aplicado
[ ] /php-shared-hosting-hardening aplicado
[ ] /wordpress-cms-hardening aplicado (se WP)
[ ] /waf-and-bot-mitigation aplicado
[ ] 2FA ativo em cPanel
[ ] 2FA ativo em WP-admin
[ ] Backup automático verificado (teste de restore!)
[ ] Permissões corrigidas (sem 777)

# Monitoramento
[ ] Logs revisados por 30 dias
[ ] Verificação semanal de arquivos modificados
[ ] Google Search Console limpo
[ ] WAF/Cloudflare alertas configurados
[ ] Wordfence/Sucuri scan agendado

# Documentação e notificação
[ ] Timeline completa documentada
[ ] Vetor e lições registrados
[ ] Processo interno atualizado
[ ] LGPD: ANPD notificada se PII vazou
[ ] Cliente afetado comunicado
```

---

## 13. Modelo de relatório de incidente

```markdown
# Incidente — Comprometimento de [projeto]

## Resumo
- Data de detecção: YYYY-MM-DD HH:MM (TZ)
- Data estimada do comprometimento: YYYY-MM-DD
- Janela: N dias
- Severidade: [Baixa / Média / Alta / Crítica]
- LGPD aplicável: [Sim / Não]

## Vetor
- [Descrição]
- CVE relacionada: [se aplicável]
- Vulnerabilidade explorada: [descrição]

## Escopo
- Arquivos comprometidos: [lista ou contagem]
- Dados acessados/exfiltrados: [se houve, descrição mínima]
- Persistência instalada: [cron, systemd, plugin, etc.]

## Resposta
- Hora de início: HH:MM
- Hora de isolamento: HH:MM
- Hora de erradicação: HH:MM
- Hora de retorno ao ar: HH:MM
- Duração do downtime: X horas
- Backup usado: [data do backup restaurado]

## Credenciais rotacionadas
- [Lista]

## Hardening aplicado
- [Lista]

## Comunicação
- ANPD: [data, número do protocolo, se LGPD aplicável]
- Cliente: [data, canal]
- Equipe: [data]
- Cliente final: [se aplicável, data, canal]

## Lições aprendidas
- [Lista]

## Próximos passos
- [Lista]
```

---

## 14. Atualização do CLAUDE.md (sugestão)

```markdown
## Detecção de webshell e IOC forense

Em suspeita de comprometimento (sintomas: site lento sem motivo, SEO spam, redirect, notificação de hospedagem, alerta WAF/Cloudflare, alerta Google Search Console, login admin estranho, arquivo novo não explicado), invocar `/webshell-and-ioc-detection` em conjunto com `/incident-diagnosis`.

**Ordem absoluta:**
1. PRESERVAR (snapshot, logs, hashes, processos) antes de qualquer ação
2. ISOLAR (manutenção, firewall, contas)
3. IDENTIFICAR (vetor, escopo)
4. ERRADICAR (preferir RESTORE de backup limpo a "tentar limpar")
5. ROTACIONAR credenciais por máquina LIMPA
6. HARDENIZAR (file-upload-security, php-shared-hosting-hardening, waf-and-bot-mitigation)
7. MONITORAR pós-recuperação por 30+ dias
8. DOCUMENTAR e notificar ANPD se houve vazamento de PII
```

---

## 15. O que NÃO fazer

- ❌ Apagar arquivo suspeito sem snapshot (perde evidência)
- ❌ Rebootar VPS comprometida sem coletar memória/processos primeiro
- ❌ "Tentar limpar" backdoor sem comparar com baseline
- ❌ Rotacionar credenciais pela própria máquina suspeita (chave nova vaza também)
- ❌ Retornar ao ar sem hardening preventivo (atacante volta)
- ❌ Esconder o incidente do cliente quando há impacto
- ❌ Ignorar LGPD se vazou PII (multa pesada)
- ❌ Confiar em "uma única limpeza" para WP comprometido (reinstalar é melhor)
- ❌ Acreditar que sumiu sem monitorar 30+ dias
- ❌ Reutilizar backup feito após o comprometimento

---

## 16. Critérios de aceite

Resposta a incidente está concluída quando:

- Evidências preservadas e arquivadas
- Vetor identificado e documentado
- Sistema restaurado a estado limpo confirmado por checksum
- Todas as credenciais rotacionadas por máquina limpa
- Hardening preventivo aplicado (skills relacionadas)
- Backup automático verificado com teste de restore
- Monitoramento ativo por 30 dias
- Documentação interna completa
- Notificações regulatórias feitas se necessário
- Cliente comunicado se afetado

---

## 17. Frase-guia final

> **Preservar, isolar, identificar, erradicar, restaurar, rotacionar, monitorar.** Limpeza vem depois da evidência. Restore de backup limpo vence "tentar consertar". Credencial nova precisa nascer em máquina limpa.

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
