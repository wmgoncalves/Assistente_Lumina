---
name: file-upload-security
description: Upload de arquivos seguro. Cobre validação de tipo real (magic bytes), tamanho, nome, storage isolado, signed URLs, antivírus, prevenção de path traversal e RCE. Use em qualquer projeto que aceite upload de usuário (formulário, painel, API).
---

# file-upload-security

Use em **qualquer projeto que aceite upload de usuário**. Upload é uma das superfícies de ataque mais subestimadas — abre RCE, XSS, DoS, exfiltração e SSRF.

## Princípios

1. **Validar no servidor sempre** — frontend ajuda UX, não segurança
2. **Não confiar na extensão nem no MIME enviado pelo browser** — verificar magic bytes
3. **Renomear** todo arquivo recebido (não usar nome do usuário no filesystem)
4. **Armazenar fora do diretório público** quando possível
5. **Servir via endpoint controlado**, não acesso direto
6. **Limite de tamanho** sempre, em todos os pontos

## Validação obrigatória

### Tamanho
- Limite no servidor (`upload_max_filesize`, `post_max_size`, `client_max_body_size`)
- Limite na aplicação (verificação explícita)
- Limite por usuário (cota)
- Limite por tipo (imagem 5MB, vídeo 100MB, etc.)
- Rejeitar antes de receber tudo (Content-Length pré-check quando possível)

### Tipo real (magic bytes)
**Nunca confiar** em:
- Extensão (`foto.jpg` pode ser PHP renomeado)
- `Content-Type` enviado (cliente controla)
- `$_FILES['file']['type']` no PHP (vem do cliente)

**Validar magic bytes** (primeiros bytes do arquivo):

PHP:
```php
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$realMime = finfo_file($finfo, $_FILES['file']['tmp_name']);
finfo_close($finfo);
// Allowlist:
$allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
if (!in_array($realMime, $allowed, true)) reject();
```

Node:
```js
import { fileTypeFromBuffer } from 'file-type';
const type = await fileTypeFromBuffer(buffer);
if (!type || !['jpg','png','webp','pdf'].includes(type.ext)) reject();
```

### Allowlist de extensão
- Sempre allowlist (`['.jpg','.png','.pdf']`), nunca denylist
- Verificar extensão **e** magic bytes juntos
- Rejeitar duplo (`.jpg.php`, `.php.jpg`)
- Rejeitar Unicode trick (`.jp\u202Egnp.php`)

### Para SVG (perigoso)
SVG é XML e pode conter script. Se aceitar SVG:
- Sanitizar com DOMPurify (modo SVG) ou rasterizar para PNG no upload
- Servir com `Content-Type: image/svg+xml` + `Content-Security-Policy: script-src 'none'`
- Idealmente: **rejeitar SVG** se não for funcionalidade core

### Para PDF
- Verificar magic bytes (`%PDF-`)
- Considerar abrir em iframe sandbox no frontend
- Antivírus se ambiente sensível

### Para imagem
- Tentar reabrir e re-encodar com biblioteca (GD/Imagick/sharp) — quebra payloads embarcados
- Limitar dimensões (ex: max 4000x4000) para evitar pixel flood
- Strip de metadados EXIF (privacidade — pode ter geolocalização)

## Nome do arquivo

### Sempre renomear
```
Nome original: foto-de-praia.jpg  (do usuário)
Nome armazenado: 2026/05/14/abc123_uuid_v4.jpg
Nome para download: foto-de-praia.jpg (do banco, com encoding HTTP correto)
```

### Por que renomear
- Path traversal (`../../../../../etc/passwd`)
- Caracteres especiais (`;`, `&`, `|`, `\0`, `\n`)
- Nome muito longo (DoS no filesystem)
- Encoding (UTF-8, RTL Override `\u202E`)
- Conflito (dois `foto.jpg`)

### Gerar nome novo
- UUID v4 + extensão validada
- Hash do conteúdo (deduplicação) + extensão
- Timestamp + random + extensão

### Caracteres permitidos no nome interno
Allowlist: `[a-zA-Z0-9._-]`. Tudo fora disso, rejeitar ou substituir.

## Storage

### Fora do diretório público (preferido)
```
public/         <- web root, servido pelo Apache/Nginx
uploads/        <- fora do public, não acessível direto
```
Servir via endpoint controlado (`/files/{id}`) que valida permissão.

### Se for dentro do public (hospedagem compartilhada típica)
- Subpasta com `.htaccess` bloqueando execução:
```apache
# .htaccess em uploads/
<FilesMatch "\.(php|phtml|phps|cgi|pl|py|jsp|asp|aspx|sh)$">
    Require all denied
</FilesMatch>
Options -Indexes -ExecCGI
AddType text/plain .php .phtml .phps
RemoveHandler .php
RemoveType .php
```
- E `.user.ini` ou `php.ini`:
```ini
engine = Off
```

### Permissões
- Diretório de upload: 755 (ou 750 se possível)
- Arquivos: 644 (nunca 777)
- Dono: usuário do PHP/Node, não root

### S3/object storage
- Bucket **privado**
- Signed URLs com TTL curto (15 min)
- Bloquear listing público
- Server-side encryption ativada
- Versionamento + lifecycle (expirar versões antigas)
- Logs de acesso (auditoria)

## Servir arquivos

### Via endpoint controlado
```
GET /files/{file_id}
  1. Verificar autenticação
  2. Verificar autorização (usuário pode acessar este arquivo?)
  3. Buscar caminho no banco (não vir da URL)
  4. Stream do arquivo com Content-Type correto
  5. Content-Disposition: attachment quando aplicável
  6. Nunca servir com Content-Type: text/html para arquivo de usuário
```

### Cabeçalhos defensivos
```
Content-Type: [tipo correto do arquivo]
Content-Disposition: attachment; filename="..."
X-Content-Type-Options: nosniff
Cache-Control: private, no-cache
Content-Security-Policy: default-src 'none'   (para arquivo isolado)
```

### Imagens em domínio separado
Servir uploads em subdomínio diferente (`uploads.site.com`) ou domínio separado (`siteuploads.com`) reduz impacto de XSS via upload e cookie leakage.

## Antivírus / scanning

Para ambientes sensíveis (saúde, finanças, dado de menores):
- ClamAV no servidor (`clamscan`)
- Serviço cloud (VirusTotal API, etc.)
- Sandboxing antes de disponibilizar
- Quarentena: arquivo só liberado depois do scan

## Vetores de ataque comuns

### RCE via upload de PHP
- Renomear extensão + validar magic bytes
- Bloquear execução no diretório (.htaccess, .user.ini)
- Storage fora do public

### XSS via SVG/HTML
- Rejeitar HTML
- Sanitizar SVG ou rasterizar
- Servir em domínio separado quando possível

### Path traversal
- Renomear arquivo (não usar nome do usuário)
- Validar nome antes de gravar
- Usar funções seguras de path (`realpath`, `path.resolve` + verificação)

### Zip bomb (DoS)
- Limite de descompressão
- Detectar ratio absurdo (1MB zip = 10GB descomprimido)
- Não descomprimir automaticamente em background

### Pixel flood (DoS via imagem gigante)
- Limite de dimensões antes de processar
- Bibliotecas com proteção (sharp tem `limitInputPixels`)

### SSRF via upload "URL-fetched"
- Se aceitar upload por URL, validar destino
- Bloquear IPs privados (127.0.0.1, 10.0.0.0/8, 169.254.169.254 — metadata cloud)
- Bloquear redirect chains
- Timeout curto

### Cobertura de cota
- Limite por usuário
- Alerta quando próximo do limite
- Limpeza de uploads não usados (TTL)

## Padrões de detecção em código

```regex
# Aceita extensão sem validar magic bytes
move_uploaded_file\(.*\$_FILES.*\[.name.\]
multer\.diskStorage.*filename.*originalname

# Usa nome do usuário no path
file_put_contents\(.*\$_POST
fs\.writeFile\(.*req\.body\.name

# Confia no MIME enviado
\$_FILES.*\[.type.\]
req\.file\.mimetype     # sem validação posterior
```

## Recusas obrigatórias

- Aceitar upload sem validar magic bytes
- Usar nome do usuário no filesystem
- Aceitar SVG sem sanitizar/rasterizar
- Salvar dentro do public sem .htaccess de bloqueio
- Servir com `Content-Type: text/html` arquivo de usuário
- `chmod 777` no diretório de upload
- Sem limite de tamanho
- Sem limite de quantidade por usuário
- "URL-based upload" sem proteção SSRF

## Checklist mínimo

- [ ] Limite de tamanho (servidor + aplicação + por usuário)
- [ ] Allowlist de extensão **e** magic bytes verificados
- [ ] Arquivo renomeado (UUID/hash)
- [ ] Storage fora do public (ou .htaccess bloqueando exec)
- [ ] Permissões 644/755, nunca 777
- [ ] Servido via endpoint com autenticação + autorização
- [ ] Content-Type correto + X-Content-Type-Options: nosniff
- [ ] Antivírus se contexto sensível
- [ ] Strip de EXIF em imagens (LGPD — geolocalização)
- [ ] Quota por usuário
- [ ] Limpeza de uploads abandonados
- [ ] Logs de upload (quem, quando, o quê)

## Conexão com skills do vault

- Skill 01 (Zero Trust) — entrada não confiável
- Skill 06 (LGPD) — EXIF de imagem pode conter dado pessoal (geo)
- Skill 04 (Logs Seguros) — não vazar caminho do filesystem em erro
- Skill 13 (Deploy) — permissões corretas após deploy

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
