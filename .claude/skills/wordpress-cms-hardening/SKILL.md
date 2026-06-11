---
name: wordpress-cms-hardening
description: Hardening para WordPress e outros CMS. Cobre plugins, temas, wp-config, autenticação de admin, 2FA, limitação de login, WooCommerce, updates seguros e proteção contra plugins nulled/crackeados.
---

# wordpress-cms-hardening

Use esta skill para WordPress, WooCommerce, Elementor, e outros CMS (Joomla, Drupal). Complementa `php-shared-hosting-hardening` quando o projeto roda em hospedagem compartilhada.

## Perguntas internas obrigatórias

1. Qual versão do WordPress está instalada? Está atualizada?
2. Há plugins ativos que não foram atualizados há mais de 6 meses?
3. Há plugins desativados (código presente mas inativo)?
4. A origem dos plugins é o repositório oficial ou fonte externa?
5. O `wp-config.php` tem as chaves secretas configuradas?
6. O editor de arquivos do painel está desabilitado?
7. O login de admin usa usuário "admin"?
8. Há 2FA configurado para contas de administrador?
9. Há limite de tentativas de login?
10. `wp-config.php` está protegido ou movido para fora do `public_html`?

## Princípio

> Cada plugin WordPress é um pedaço de código de terceiro executado no contexto completo da sua aplicação. Um plugin malicioso ou comprometido tem acesso total ao banco de dados, arquivos e admin do site.

## Plugins — regras obrigatórias

### Fontes permitidas
- Repositório oficial WordPress.org
- Desenvolvedoras com histórico comprovado (Yoast, WooCommerce/Automattic, Gravity Forms, ACF/WP Engine, etc.)
- Plugin comercial com suporte ativo e atualizações regulares

### Fontes proibidas
- Sites de plugins "nulled" (crackeados/pirateados)
- Sites de "plugins grátis" sem origem clara
- Links de Google Drive, Dropbox, Telegram ou grupos de WhatsApp
- Sites com nome parecido com plugin famoso

Por que plugins nulled são perigosos:
- Frequentemente contêm backdoors e malware
- Podem roubar credenciais de admin, banco e FTP
- Servem como vetor de persistência para atacante

### Quarentena de 7 dias para plugins novos
Assim como dependências npm/composer, aguardar pelo menos 7 dias após uma atualização suspeita ou recente de plugin antes de instalar em produção.

### Plugins inativos
**Desinstalar completamente** — desativar não remove o código:
```
Painel WP → Plugins → Inativos → Excluir
```
Cada plugin inativo é código que pode ter vulnerabilidade e não recebe atenção.

## Atualizações seguras

### Regra
Sempre fazer backup antes de atualizar qualquer componente.

### Ordem recomendada
1. Backup completo (arquivos + banco)
2. Atualizar plugins (um por vez em sites críticos)
3. Verificar funcionamento
4. Atualizar temas
5. Atualizar WordPress core
6. Verificar funcionamento novamente

### Sobre plugins recém-atualizados
Plugin atualizado há menos de 7 dias em versão MAJOR ou com mudança grande:
- Aguardar relatos da comunidade antes de atualizar em produção
- Testar em ambiente de staging se disponível

## wp-config.php — proteção obrigatória

### Mover para fora do public_html (quando possível)
```
/home/usuario/wp-config.php  ← um nível acima do public_html
/home/usuario/public_html/   ← WordPress instalado aqui
```
WordPress detecta automaticamente `wp-config.php` um nível acima.

### Proteger com .htaccess (se não puder mover)
```apache
<files wp-config.php>
    order allow,deny
    deny from all
</files>
```

### Configurações obrigatórias no wp-config.php
```php
// Desabilitar editor de arquivos no painel (PHP e plugins)
define('DISALLOW_FILE_EDIT', true);

// Desabilitar instalação/atualização de plugins/temas pelo painel (produção lockdown)
// define('DISALLOW_FILE_MODS', true);  // usar com cautela

// Chaves de autenticação únicas (gerar em: https://api.wordpress.org/secret-key/1.1/salt/)
define('AUTH_KEY',         'GERAR_UNICO');
define('SECURE_AUTH_KEY',  'GERAR_UNICO');
define('LOGGED_IN_KEY',    'GERAR_UNICO');
define('NONCE_KEY',        'GERAR_UNICO');
define('AUTH_SALT',        'GERAR_UNICO');
define('SECURE_AUTH_SALT', 'GERAR_UNICO');
define('LOGGED_IN_SALT',   'GERAR_UNICO');
define('NONCE_SALT',       'GERAR_UNICO');

// Prefixo de tabela diferente do padrão
$table_prefix = 'wp_xk29_';  // não usar 'wp_' padrão

// Desligar debug em produção
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', false);
define('WP_DEBUG_DISPLAY', false);
```

## Autenticação de administrador

### Usuário
- **Nunca** usar "admin" como nome de usuário
- Username não deve ser igual ao display name público

### Senha
- Usar senha forte (gerador do próprio WordPress ou gerenciador de senhas)
- Mínimo 20 caracteres, aleatório

### 2FA (autenticação de dois fatores)
Para contas de admin, instalar plugin de 2FA confiável:
- Wordfence Login Security (gratuito, repositório oficial)
- WP 2FA (repositório oficial)
- Google Authenticator by miniOrange

### Limitar tentativas de login
Plugin recomendado:
- Limit Login Attempts Reloaded (repositório oficial)
- Wordfence Security (tem proteção de login integrada)

### Login customizado
Considerar mover URL de login:
```
/wp-login.php → /acesso-admin  (via plugin WPS Hide Login)
```
Não é segurança completa, mas reduz ataques automatizados.

## WooCommerce — cuidados extras

Por processar pagamentos, requer atenção redobrada:

- **SSL obrigatório** em toda a loja (não só no checkout)
- **Gateway de pagamento**: usar apenas gateways que redirecionam para página do gateway ou usam tokenização (nunca armazenar dados de cartão)
- **PCI DSS**: ao usar gateway que mantém dados no seu servidor, verificar conformidade
- **Usuários com permissão mínima**: shopmanager não precisa de acesso de admin completo
- **Emails de pedido**: verificar se contêm dados sensíveis desnecessários
- **Logs de WooCommerce**: podem conter dados de transação — proteger acesso

## Verificação de integridade

Plugins de segurança que monitoram alterações nos arquivos:
- Wordfence Security (gratuito, repositório oficial)
- iThemes Security / Solid Security
- Sucuri Security

Verificar periodicamente:
- Arquivos core do WordPress não foram modificados
- Nenhum arquivo PHP novo apareceu em pastas inesperadas
- `.htaccess` não foi alterado

## Checklist de saída

- [ ] WordPress core atualizado
- [ ] Todos os plugins ativos atualizados e de fonte confiável
- [ ] Plugins inativos completamente removidos
- [ ] Nenhum plugin nulled instalado
- [ ] `wp-config.php` protegido (movido ou bloqueado)
- [ ] `DISALLOW_FILE_EDIT` = true
- [ ] Chaves de autenticação únicas configuradas
- [ ] Prefixo de tabela não padrão
- [ ] WP_DEBUG = false em produção
- [ ] Usuário admin com nome não óbvio
- [ ] 2FA habilitado para administradores
- [ ] Limitação de tentativas de login ativa
- [ ] HTTPS em toda a loja (WooCommerce)
- [ ] Backup automatizado e testado

## Conexão com skills do vault

- Skill 14 (Supply Chain) — plugins são dependências de terceiro
- Skill 01 (Zero Trust) — validação de entrada em formulários WP
- Skill 13 (DevOps/Deploy) — updates com backup e rollback
- `php-shared-hosting-hardening` — para sites em hospedagem compartilhada

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
