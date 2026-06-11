---
name: cria-projeto-php-mysql-hostgator
description: Use esta skill para criar ou reorganizar a ESTRUTURA de um projeto PHP + MySQL/MariaDB que roda em HostGator/cPanel — MVC simples, separação de camadas, PDO com prepared statements, .env protegido, .htaccess e instruções de deploy. O lado segurança vem de php-shared-hosting-hardening.
---

# cria-projeto-php-mysql-hostgator

## O que esta skill faz

Cria (ou organiza projeto existente para) a **arquitetura padrão DV Digital de PHP em hospedagem compartilhada**: camadas separadas (controllers, models, views, config, rotas), conexão PDO central, configuração fora do código, assets organizados e entrypoint compatível com cPanel. Esta skill cuida da **estrutura**; o hardening vem de `/php-shared-hosting-hardening` e o deploy de `/safe-deploy-hosting`.

## Quando usar

- Projeto PHP novo que vai rodar em HostGator/cPanel.
- Projeto existente com código solto (SQL no meio do HTML, sem camadas) que precisa ganhar estrutura — **sem quebrar** (`/preserve-existing-behavior` primeiro).
- Padronizar a base dos sistemas da DV (AtendaPro e derivados seguem este padrão).

## Entradas necessárias

1. Projeto novo ou existente? Se existente: entrypoint atual (`index.php`? `public/index.php`?), rotas e fluxos vivos.
2. Versão de PHP disponível no cPanel do destino (alvo: 8.3+; confirmar antes).
3. Módulos previstos (site público? painel? API? cron?).
4. Banco: novo ou existente (nome, charset — usar `utf8mb4`).

## Processo obrigatório

1. **Projeto existente**: mapear o que funciona ANTES (rotas, formulários, integrações) — migração incremental, nunca big-bang.
2. Criar a estrutura:

```text
app/Controllers/  app/Models/  app/Services/  app/Helpers/  app/Middlewares/
config/app.php  config/database.php
public/index.php  public/assets/{css,js,img}
routes/web.php  routes/api.php
storage/logs/  storage/uploads/      ← fora do public quando o host permitir
views/layouts/  views/pages/  views/components/
.env  .env.example  .htaccess  README.md
```

3. **Conexão**: PDO único (singleton simples) lendo de `.env`/config; charset `utf8mb4`; `ERRMODE_EXCEPTION`; **prepared statements em 100% das queries**.
4. **Configuração**: `.env` fora do versionamento + `.env.example` com placeholders (`/secrets-and-env-guard`); nunca senha no código.
5. **Roteamento**: router simples em `public/index.php` (sem framework pesado); fallback para hosts onde a raiz pública é fixa (`public_html` apontando para `public/` via `.htaccess` ou estrutura adaptada).
6. **Views**: layout base + páginas; escape de saída (`htmlspecialchars`) por padrão.
7. **Erros e logs**: `display_errors=Off` em produção, log em `storage/logs/` sem dados sensíveis (`/logs-and-errors-hardening`).
8. **README**: como configurar banco, rodar local (PHP embutido) e publicar no cPanel.
9. Encadear: `/php-shared-hosting-hardening` (permissões 755/644/600, proteção de pastas) e, antes de publicar, `/pre-deploy-security-review` + `/safe-deploy-hosting`.

## Checklist de qualidade

- [ ] Nenhuma credencial no código; `.env.example` sem dados reais.
- [ ] 100% das queries com prepared statements.
- [ ] Saída HTML escapada por padrão.
- [ ] `storage/` e `config/` inacessíveis via URL (estrutura ou `.htaccess`).
- [ ] Compatível com a versão PHP real do cPanel de destino.
- [ ] Projeto existente: todas as rotas/fluxos antigos continuam funcionando.
- [ ] README com passos de configuração e publicação.
- [ ] Sem dependência que exija servidor dedicado/worker permanente (fila = cron do cPanel).

## Erros comuns que esta skill deve evitar

- Reescrever projeto vivo do zero "para organizar" (Regra 00 — migrar por partes).
- Estrutura que assume root do servidor (HostGator tem `public_html` fixo).
- Composer/dependências pesadas sem necessidade — preferir código próprio auditável.
- `mysqli` com concatenação de string em vez de PDO preparado.
- Uploads dentro de `public/` sem proteção (`/file-upload-security`).
- `.htaccess` complexo que derruba o site (testar incremental; é a principal ferramenta de config).

## Saída esperada

```text
1. ESTRUTURA criada/ajustada (árvore + propósito de cada pasta)
2. ARQUIVOS-BASE (conexão PDO, router, layout, .env.example, .htaccess)
3. PLANO DE MIGRAÇÃO incremental (se projeto existente)
4. COMO RODAR local e COMO PUBLICAR no cPanel
5. PENDÊNCIAS e encadeamento (hardening → deploy)
```

## Exemplo de uso

> "Organiza o sistema da barbearia que está com tudo solto na raiz."

Saída: mapa do que existe (7 páginas PHP com SQL inline), plano em 4 etapas (conexão PDO central → mover queries para Models → views com layout → rotas), tudo preservando URLs atuais, `.htaccess` de proteção de `storage/`, checklist de teste após cada etapa.

---

## Conexão com o ecossistema

Antes (projeto existente): `/preserve-existing-behavior`. Segurança: `/php-shared-hosting-hardening` + `/webapp-hardening`. Banco: `/estrutura-banco-dados-mysql` + `/database-hardening`. Deploy: `/safe-deploy-hosting` + `/pre-deploy-security-review`. Decisão de stack antes: `/escolhe-stack-ideal-projeto`. Agente: `especialista-php-mysql-hostgator`.

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
