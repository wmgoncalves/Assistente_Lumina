---
name: php-shared-hosting-hardening
description: Hardening para PHP em hospedagem compartilhada (HostGator, cPanel, File Manager, FTP). Cobre proteção de .env, .htaccess, permissões, display_errors, uploads, prepared statements, logs e deploy seguro via FTP/File Manager.
---

# php-shared-hosting-hardening

Use esta skill para projetos PHP em hospedagem compartilhada, cPanel, HostGator ou qualquer ambiente onde o deploy é feito via FTP ou File Manager e não há acesso root.

Esta skill é específica mas não substitui as outras. Para um projeto PHP com banco e formulários, use também: `webapp-hardening`, `database-hardening`, `secrets-and-env-guard`.

## Perguntas internas obrigatórias

1. O arquivo `.env` está dentro do `public_html`?
2. O `.htaccess` está configurado para proteger arquivos sensíveis?
3. `display_errors` está OFF em produção?
4. Listagem de diretório está desabilitada?
5. Arquivos de backup, dump ou config estão acessíveis publicamente?
6. Qual é a versão do PHP em uso? Está suportada?
7. Uploads são armazenados fora do `public_html`?
8. Existe `.git` na pasta pública?
9. Arquivos `.claude/`, `node_modules/`, `.env` foram excluídos do upload?
10. Permissões de arquivo estão corretas (644 arquivos, 755 dirs)?

## Estrutura segura de pastas

```
/home/usuario/
  ├── public_html/          ← apenas o que deve ser público
  │   ├── index.php
  │   ├── .htaccess
  │   └── assets/
  ├── config/               ← FORA do public_html
  │   └── config.php        ← ou .env
  ├── uploads/              ← FORA do public_html
  ├── logs/                 ← FORA do public_html
  └── backup/               ← FORA do public_html (nunca público)
```

Referência no PHP:
```php
// config.php fora do public_html
$config_path = dirname(__DIR__) . '/config/config.php';
require_once $config_path;
```

## .htaccess — configurações obrigatórias

```apache
# Bloquear listagem de diretório
Options -Indexes

# Proteger .env e arquivos sensíveis
<FilesMatch "^\.env|\.git|composer\.json|composer\.lock|package\.json|package-lock\.json|\.htpasswd|backup|\.sql|\.key|\.pem">
    Order allow,deny
    Deny from all
</FilesMatch>

# Bloquear acesso a pasta .git se estiver no public_html (não deveria estar)
RedirectMatch 404 /\.git

# Forçar HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Adicionar headers de segurança
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set Referrer-Policy strict-origin-when-cross-origin
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>

# Bloquear execução de PHP em pasta de uploads (se uploads estiverem no public_html)
<Directory "/home/usuario/public_html/uploads">
    php_flag engine off
    RemoveHandler .php .phtml .php3 .php4 .php5 .phar
</Directory>
```

## PHP — configuração segura

Criar `.user.ini` na raiz do `public_html` (funciona na maioria das hospedagens compartilhadas):

```ini
; Desligar exibição de erros em produção
display_errors = Off
display_startup_errors = Off
log_errors = On
error_reporting = E_ALL

; Desligar funções perigosas
disable_functions = exec,passthru,shell_exec,system,proc_open,popen,curl_multi_exec,parse_ini_file,show_source

; Limite de upload
upload_max_filesize = 5M
post_max_size = 6M
max_execution_time = 30
memory_limit = 128M

; Sessão segura
session.cookie_httponly = 1
session.cookie_secure = 1
session.cookie_samesite = Lax
session.use_strict_mode = 1
```

## Permissões de arquivo

```
Arquivos PHP:        644 (rw-r--r--)
Pastas:              755 (rwxr-xr-x)
.env / config:       600 (rw-------)  ← apenas o dono lê
wp-config.php:       600
Nunca:               777 (qualquer arquivo)
```

Via FTP/cPanel File Manager: selecionar arquivo → Change Permissions.

## O que NÃO subir via FTP/File Manager

Nunca colocar em `public_html`:

- `.env` (nunca, em nenhuma circunstância)
- `.git/` (expõe todo o código e histórico)
- `.claude/` (expõe instruções de desenvolvimento)
- `node_modules/` (exceto se necessário, sem pasta `.git` interna)
- `vendor/` do Composer com `composer.json` exposto (bloquear via .htaccess)
- Arquivos de backup: `backup.zip`, `backup.sql`, `site_backup.tar.gz`
- Dumps de banco: `database.sql`, `export.sql`
- Logs: `error.log`, `access.log`
- Testes: pasta `tests/`, `spec/`
- README com informações sensíveis
- `phpinfo.php` (remover imediatamente após diagnóstico)

## Deploy seguro via FTP/File Manager

Checklist antes de subir:

1. Listar todos os arquivos que serão enviados
2. Confirmar que `.env` não está na lista
3. Confirmar que `.git/` não está na lista
4. Confirmar que dumps/backups não estão na lista
5. Confirmar que `phpinfo.php` não está na lista
6. Subir arquivos
7. Verificar permissões após upload
8. Testar funcionamento
9. Verificar se listagem de diretório está desabilitada (`/uploads/` deve retornar 403)
10. Verificar se `.env` retorna 403 (tentar acessar via browser)

## Uploads em hospedagem compartilhada

Se a hospedagem não permite armazenar fora do `public_html`:

```apache
# Bloquear execução de PHP e scripts em uploads
<Directory "/home/usuario/public_html/uploads">
    Options -ExecCGI
    php_flag engine off
    AddType text/plain .php .phtml .php3 .php4 .php5 .phar .htm .html
    <FilesMatch "\.(php|phtml|php3|php4|php5|phar)$">
        Order allow,deny
        Deny from all
    </FilesMatch>
</Directory>
```

Validação obrigatória no PHP:
```php
$extensoes_permitidas = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'docx'];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($_FILES['arquivo']['tmp_name']);
$ext = strtolower(pathinfo($_FILES['arquivo']['name'], PATHINFO_EXTENSION));

if (!in_array($ext, $extensoes_permitidas) || !in_array($mime, $mimes_permitidos)) {
    // Rejeitar
}

// Renomear com nome seguro
$nome_seguro = bin2hex(random_bytes(16)) . '.' . $ext;
```

## WordPress em hospedagem compartilhada

Aplicar adicionalmente:
- `define('DISALLOW_FILE_EDIT', true);` no `wp-config.php`
- `define('DISALLOW_FILE_MODS', true);` se não precisar instalar plugins pelo painel
- Proteger `wp-config.php`:
  ```apache
  <files wp-config.php>
      order allow,deny
      deny from all
  </files>
  ```
- Mover `wp-config.php` um nível acima do `public_html` quando possível

## Checklist de saída

- [ ] `.env` fora do `public_html` ou bloqueado por `.htaccess`
- [ ] `.git/` fora do `public_html`
- [ ] Backups e dumps fora do público
- [ ] `display_errors = Off` em `.user.ini`
- [ ] `.htaccess` com `Options -Indexes`
- [ ] `.htaccess` bloqueando arquivos sensíveis
- [ ] HTTPS forçado via `.htaccess`
- [ ] Permissões: 644 arquivos, 755 pastas, 600 para .env
- [ ] Uploads: extensão validada, MIME verificado, nome gerado, PHP bloqueado
- [ ] `phpinfo.php` removido de produção
- [ ] Headers de segurança configurados

## Conexão com skills do vault

- Skill 01 (Zero Trust) — validação PHP detalhada, sanitização contextual
- Skill 13 (DevOps/Deploy) — checklist de deploy, rollback
- Skill 12 (Banco) — MySQL com prepared statements
- Skill 06 (LGPD) — dados de formulário e usuário

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
