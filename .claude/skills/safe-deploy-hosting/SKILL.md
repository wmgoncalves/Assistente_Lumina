---
name: safe-deploy-hosting
description: Deploy seguro e operacao em servidor. Classifica tipo de deploy (inicial/incremental/hotfix/banco/infra), preserva .htaccess/uploads/config, bloqueia .env/.git/node_modules/backup.zip em pasta publica, exige backup e rollback. Use antes de subir arquivos, substituir versao, mexer em DNS/SSL ou publicar em producao.
---
# 04 — Safe Deploy and Hosting

## Nome da skill

`04-safe-deploy-hosting`

## Categoria

Deploy seguro, publicação, hospedagem, backup, rollback, arquivos de produção, validação pós-publicação, proteção de credenciais e operação em servidor.

## Objetivo principal

Esta skill orienta o Claude Code a preparar, revisar e executar publicações de sites, sistemas, plataformas, landing pages, painéis, áreas logadas e produtos digitais com segurança.

Ela deve ser usada sempre que houver qualquer ação relacionada a:

- subir arquivos para servidor;
- publicar em produção;
- publicar em homologação;
- substituir versão existente;
- atualizar site ativo;
- configurar `public_html`;
- configurar hospedagem compartilhada;
- configurar VPS, Cloud ou servidor;
- alterar `.htaccess`;
- alterar domínio;
- alterar SSL;
- alterar banco;
- mover arquivos;
- remover arquivos;
- enviar build;
- configurar variáveis de ambiente;
- fazer rollback;
- validar publicação.

O objetivo é evitar erros como:

- publicar arquivos na pasta errada;
- apagar produção sem backup;
- sobrescrever `.htaccess`;
- expor `.env`;
- subir `node_modules`;
- subir `.git`;
- subir backup público;
- subir dump de banco;
- quebrar rotas;
- quebrar formulário;
- remover pixel;
- remover metatags;
- quebrar SEO;
- ativar debug em produção;
- usar banco de teste em produção;
- usar credenciais de produção em homologação;
- publicar versão incompleta;
- não ter caminho de volta.

---

# 1. Regra principal desta skill

A regra principal é:

> Nunca publicar em produção sem saber exatamente o que será enviado, onde será enviado, o que será preservado, qual backup existe, como testar e como voltar atrás se algo der errado.

Deploy não é apenas copiar arquivos.

Deploy envolve:

- ambiente correto;
- versão correta;
- arquivos corretos;
- configurações corretas;
- permissões corretas;
- banco correto;
- domínio correto;
- rastreamento correto;
- SEO correto;
- rollback disponível.

---

# 2. Relação com as outras skills

Esta skill deve seguir:

- `00-technical-governance-overview`
- `01-requirements-analysis`
- `02-versioning-change-control`
- `03-environment-strategy`
- `05-hosting-infrastructure-analysis`
- `06-storage-database-files`
- `07-product-readiness-checklist`
- skills de segurança existentes
- skills de design existentes

## 2.1. Ordem recomendada antes de deploy

Antes de publicar, o Claude Code deve verificar:

1. Requisitos estão claros?
2. A alteração foi versionada?
3. O ambiente correto foi definido?
4. A hospedagem suporta o projeto?
5. Dados e arquivos estão protegidos?
6. Existe backup?
7. Existe rollback?
8. A publicação foi testada em homologação quando necessário?
9. A checklist final foi concluída?

---

# 3. Quando esta skill deve ser obrigatória

Esta skill é obrigatória quando o pedido envolver:

- publicar no domínio oficial;
- subir para `public_html`;
- substituir site atual;
- mover arquivos para produção;
- trocar hospedagem;
- alterar DNS;
- configurar SSL;
- alterar `.htaccess`;
- configurar banco de dados;
- importar banco;
- alterar variáveis de ambiente;
- configurar login;
- configurar painel;
- ativar pagamento;
- ativar formulário;
- ativar rastreamento;
- migrar projeto;
- corrigir erro em produção;
- fazer hotfix;
- remover arquivos do servidor;
- configurar Cloud, VPS ou storage;
- publicar build final.

---

# 4. Classificação do tipo de deploy

Antes de orientar ou executar publicação, o Claude Code deve classificar o deploy.

## 4.1. Deploy inicial

Primeira publicação do projeto.

Riscos:

- pasta errada;
- domínio não configurado;
- SSL ausente;
- caminhos quebrados;
- arquivos sensíveis publicados;
- banco não configurado;
- formulário sem funcionar;
- tags ausentes.

## 4.2. Deploy incremental

Atualização parcial de um projeto já publicado.

Riscos:

- sobrescrever arquivo com versão antiga;
- remover código funcional;
- quebrar CSS global;
- quebrar formulário;
- quebrar tracking;
- esquecer arquivo dependente;
- cache exibir versão antiga.

## 4.3. Deploy de correção urgente

Correção rápida em produção.

Riscos:

- agir sem backup;
- corrigir sintoma e criar outro erro;
- não testar;
- alterar arquivos demais.

Regra:

- alterar o mínimo necessário;
- fazer backup do arquivo afetado;
- testar imediatamente;
- registrar a correção.

## 4.4. Deploy com banco de dados

Publicação que envolve banco.

Riscos:

- perda de dados;
- tabela errada;
- credencial errada;
- migration incompleta;
- incompatibilidade com produção;
- rollback difícil.

Regra:

- backup obrigatório do banco;
- testar em homologação;
- ter script reversível quando possível;
- validar dados existentes.

## 4.5. Deploy com mudança de infraestrutura

Inclui troca de servidor, DNS, Cloud, VPS ou storage.

Riscos:

- indisponibilidade;
- propagação DNS;
- e-mail parar;
- SSL quebrar;
- dados perdidos;
- URLs mudarem;
- SEO impactado.

Regra:

- plano detalhado;
- backup completo;
- janela controlada;
- rollback;
- validação pós-migração.

---

# 5. Checklist obrigatório antes de qualquer deploy

Antes de publicar, verificar:

## 5.1. Ambiente

- [ ] O deploy é para desenvolvimento, homologação ou produção?
- [ ] A pasta de destino está clara?
- [ ] O domínio ou subdomínio está correto?
- [ ] A URL base está correta?
- [ ] O banco correto está configurado?
- [ ] As chaves e tokens são do ambiente correto?
- [ ] Debug está adequado ao ambiente?
- [ ] O ambiente de homologação está com `noindex`?
- [ ] A produção não está bloqueada por `noindex` indevido?

## 5.2. Backup

- [ ] Backup dos arquivos atuais foi feito?
- [ ] Backup do banco foi feito, se houver banco?
- [ ] Backup do `.htaccess` foi feito?
- [ ] Backup de uploads importantes foi considerado?
- [ ] Backup está fora de pasta pública?
- [ ] Existe forma de restaurar rapidamente?

## 5.3. Arquivos

- [ ] Lista de arquivos a enviar foi definida?
- [ ] Arquivos que não devem subir foram excluídos?
- [ ] Arquivos temporários foram removidos?
- [ ] Backups não estão dentro do pacote público?
- [ ] Credenciais não estão no frontend?
- [ ] `.git` não será enviado?
- [ ] `node_modules` não será enviado?
- [ ] Dumps SQL não serão enviados?
- [ ] Logs não serão enviados?

## 5.4. Funcional

- [ ] Links principais testados?
- [ ] Formulários testados?
- [ ] WhatsApp testado?
- [ ] Login testado?
- [ ] Painel testado?
- [ ] Upload testado?
- [ ] Checkout testado, se houver?
- [ ] Busca e filtros testados?
- [ ] Páginas de erro verificadas?

## 5.5. SEO e rastreamento

- [ ] Title e description preservados?
- [ ] Canonical correto?
- [ ] Open Graph correto?
- [ ] Sitemap correto?
- [ ] Robots.txt correto?
- [ ] GTM correto?
- [ ] GA correto?
- [ ] Meta Pixel correto?
- [ ] Eventos de conversão preservados?
- [ ] Página de obrigado, se houver, funcionando?

## 5.6. Segurança

- [ ] HTTPS ativo?
- [ ] Arquivos privados protegidos?
- [ ] Uploads protegidos?
- [ ] Diretórios sem listagem pública?
- [ ] Debug desligado em produção?
- [ ] Erros técnicos ocultos em produção?
- [ ] Formulários com validação?
- [ ] Proteção anti-spam avaliada?
- [ ] Permissões de arquivos revisadas?
- [ ] Dados sensíveis não expostos?

---

# 6. Arquivos que nunca devem ser publicados em pasta pública

O Claude Code deve impedir ou alertar contra o envio destes arquivos para ambiente público:

```txt
.env
.env.local
.env.production
.env.backup
.git/
.github/
.gitignore com informações sensíveis comentadas
node_modules/
vendor/ desnecessário ou não revisado
backup.zip
site-backup.zip
backup-old.zip
database.sql
dump.sql
dump-prod.sql
export.sql
credentials.json
service-account.json
config-private.php
config.local.php
*.log
error_log
phpinfo.php
test.php
debug.php
README interno com senhas
prompts internos
anotações técnicas com credenciais
arquivos temporários
arquivos de teste
planilhas com dados pessoais
documentos privados
```

## 6.1. Atenção a backups ZIP

Backups ZIP em pasta pública são perigosos.

Exemplo perigoso:

```txt
public_html/backup.zip
public_html/site-antigo.zip
public_html/banco.sql
```

Qualquer pessoa que descobrir a URL pode baixar o projeto completo.

Regra:

> Backups devem ficar fora da pasta pública. Se forem colocados temporariamente no servidor, devem ser removidos imediatamente após o uso.

---

# 7. Estratégia para hospedagem compartilhada com cPanel e public_html

Muitos projetos podem ser publicados em hospedagem compartilhada.

## 7.1. Estrutura comum

```txt
/public_html
  index.html
  .htaccess
  /assets
  /uploads
  /includes
  /admin
```

## 7.2. Regras específicas

Antes de publicar em `public_html`:

- confirmar se `public_html` é realmente o domínio principal;
- não apagar a pasta inteira;
- fazer backup do site atual;
- preservar `.htaccess`;
- preservar uploads;
- preservar arquivos de configuração;
- conferir caminhos relativos;
- conferir versão do PHP;
- conferir banco MySQL;
- remover arquivos de teste;
- remover `noindex` da produção;
- limpar cache, se houver.

## 7.3. Publicação por File Manager

Quando o deploy for manual pelo Gerenciador de Arquivos:

- compactar apenas arquivos necessários;
- evitar compactar a pasta raiz errada;
- extrair no local correto;
- conferir se não criou pasta duplicada;
- verificar permissões;
- testar domínio após extração.

Erro comum:

```txt
public_html/projeto/index.html
```

quando o correto era:

```txt
public_html/index.html
```

ou o inverso, dependendo da configuração do domínio.

## 7.4. Não sobrescrever sem revisar

Arquivos que exigem cuidado:

```txt
.htaccess
config.php
wp-config.php
robots.txt
sitemap.xml
index.php
```

Antes de substituir, comparar ou fazer backup.

---

# 8. Estratégia para subdomínios

Subdomínios podem apontar para pastas específicas.

Exemplo:

```txt
homologacao.dominio.com.br -> /public_html/homologacao
app.dominio.com.br -> /public_html/app
```

## 8.1. Cuidados

- confirmar pasta raiz do subdomínio;
- configurar SSL;
- proteger homologação;
- evitar indexação;
- separar banco quando necessário;
- não misturar arquivos de produção;
- revisar URLs absolutas.

---

# 9. Estratégia para projetos estáticos

Projetos HTML, CSS e JS simples exigem validação de:

- caminhos de CSS;
- caminhos de JS;
- imagens;
- favicon;
- links internos;
- formulários;
- tags;
- sitemap;
- robots;
- mobile.

## 9.1. Arquivos comuns

```txt
index.html
/assets/css/style.css
/assets/js/main.js
/assets/img/
robots.txt
sitemap.xml
favicon.ico
```

## 9.2. Riscos comuns

- imagem não carrega por caminho errado;
- CSS não carrega;
- JS não carrega;
- link aponta para ambiente de teste;
- `noindex` ficou em produção;
- formulário depende de backend inexistente;
- WhatsApp está com número errado.

---

# 10. Estratégia para PHP

Projetos PHP exigem cuidado com:

- versão do PHP;
- extensões necessárias;
- permissões;
- includes;
- sessões;
- formulários;
- envio de e-mail;
- conexão com banco;
- erros em produção;
- arquivos sensíveis.

## 10.1. Erros em produção

Em produção:

- não exibir stack trace;
- não mostrar senha de banco;
- não mostrar caminho interno do servidor;
- não deixar `display_errors` ativo publicamente.

## 10.2. Configurações sensíveis

Evitar credenciais em arquivo público.

Quando possível:

```txt
/config/config.php
```

fora de `public_html`.

Se não for possível, proteger via `.htaccess`.

---

# 11. Estratégia para projetos com banco de dados

Deploy com banco é sempre mais sensível.

## 11.1. Antes de alterar banco

- fazer backup;
- identificar banco correto;
- identificar tabelas afetadas;
- testar comandos em homologação;
- evitar `DROP` sem confirmação;
- evitar alteração destrutiva sem plano;
- preservar dados existentes;
- verificar charset;
- verificar collation;
- verificar usuário e permissões.

## 11.2. Importação de banco

Antes de importar:

- confirmar ambiente;
- confirmar se é banco vazio ou existente;
- confirmar se importação irá sobrescrever dados;
- confirmar encoding;
- confirmar tamanho máximo permitido;
- confirmar se há backup.

## 11.3. Migrations

Quando houver migration:

- rodar em homologação;
- validar resultado;
- criar rollback quando possível;
- registrar versão.

---

# 12. Estratégia para frontend moderno com build

Quando houver React, Vite, Next, Vue ou outra stack com build:

## 12.1. Antes do deploy

- confirmar se produção aceita Node.js ou apenas arquivos estáticos;
- gerar build;
- testar build localmente;
- verificar variáveis de ambiente;
- verificar rotas;
- verificar assets;
- verificar fallback para SPA;
- não subir `node_modules`;
- não subir arquivos de desenvolvimento.

## 12.2. Hospedagem compartilhada

Se a produção for hospedagem compartilhada sem Node.js:

- preferir build estático;
- não depender de server-side Node;
- não usar SSR que exige servidor Node;
- configurar fallback no `.htaccess`, se for SPA;
- testar rotas internas.

## 12.3. Arquivos que normalmente vão para produção

Geralmente:

```txt
/dist
```

ou:

```txt
/build
```

O conteúdo interno da pasta buildada deve ir para a pasta pública correta.

---

# 13. Estratégia para WordPress

Se o projeto envolver WordPress:

## 13.1. Antes de deploy

- backup de arquivos;
- backup de banco;
- backup de `wp-config.php`;
- verificar tema ativo;
- verificar plugins;
- verificar versão do WordPress;
- verificar URL do site;
- verificar cache;
- verificar permissões;
- verificar uploads.

## 13.2. Não sobrescrever

Cuidado com:

```txt
wp-config.php
.htaccess
wp-content/uploads
wp-content/plugins
wp-content/themes
```

## 13.3. Segurança

- não deixar usuário admin fraco;
- remover plugins desnecessários;
- atualizar com cuidado;
- não expor backup;
- proteger login quando possível;
- revisar permissões.

---

# 14. Estratégia para VPS ou Cloud

Em VPS ou Cloud, o deploy pode envolver:

- SSH;
- Nginx;
- Apache;
- Docker;
- PM2;
- systemd;
- banco separado;
- storage;
- firewall;
- SSL;
- variáveis de ambiente;
- logs;
- monitoramento.

## 14.1. Antes de deploy

Verificar:

- branch correta;
- build;
- variáveis;
- migrations;
- backup;
- serviço ativo;
- logs;
- firewall;
- SSL;
- domínio;
- permissões;
- rollback.

## 14.2. Cuidado com custos

Em Cloud:

- avaliar uso real;
- evitar recursos superdimensionados;
- configurar alertas de custo;
- monitorar storage;
- monitorar tráfego;
- revisar serviços ativos;
- remover recursos não usados.

---

# 15. `.htaccess`

O arquivo `.htaccess` pode controlar:

- redirects;
- URLs amigáveis;
- HTTPS;
- cache;
- compressão;
- proteção de arquivos;
- bloqueio de listagem;
- fallback de SPA;
- regras de segurança.

## 15.1. Antes de alterar `.htaccess`

- fazer backup;
- entender regras existentes;
- identificar se WordPress usa o arquivo;
- identificar se rotas dependem dele;
- testar em homologação;
- evitar remover regras desconhecidas;
- comentar mudanças quando útil.

## 15.2. Proteção básica de arquivos sensíveis

Exemplo conceitual:

```apache
<FilesMatch "^(\.env|composer\.json|composer\.lock|package\.json|package-lock\.json)$">
  Require all denied
</FilesMatch>
```

A compatibilidade pode variar conforme servidor.

## 15.3. Bloqueio de listagem de diretórios

```apache
Options -Indexes
```

## 15.4. Atenção

Nunca aplicar regras copiadas sem verificar compatibilidade, pois `.htaccess` errado pode derrubar o site.

---

# 16. Permissões de arquivos e pastas

Permissões incorretas podem quebrar ou expor o projeto.

## 16.1. Regra geral

- arquivos: normalmente `644`;
- pastas: normalmente `755`;
- uploads: depende do servidor, mas evitar permissões excessivas;
- nunca usar `777` sem necessidade extrema e temporária.

## 16.2. Atenção

Permissão `777` pode permitir escrita indevida.

Se for usada para diagnóstico, deve ser revertida.

---

# 17. SSL e HTTPS

Antes de considerar produção pronta:

- SSL deve estar ativo;
- domínio deve abrir com HTTPS;
- redirects devem funcionar;
- conteúdo misto deve ser corrigido;
- assets devem carregar por HTTPS;
- links internos devem preferir HTTPS.

## 17.1. Problemas comuns

- imagem HTTP em página HTTPS;
- CSS HTTP bloqueado;
- script HTTP bloqueado;
- redirect infinito;
- certificado emitido para domínio errado;
- subdomínio sem SSL.

---

# 18. DNS e domínio

Mudanças de DNS são sensíveis.

Antes de alterar:

- registrar configuração atual;
- identificar provedor DNS;
- verificar registros A, CNAME, MX, TXT;
- preservar e-mail;
- reduzir TTL antes de migração, se possível;
- planejar propagação;
- validar domínio após mudança;
- ter rollback.

## 18.1. Atenção a e-mails

Alterar DNS pode quebrar e-mail se registros MX, SPF, DKIM ou DMARC forem removidos.

---

# 19. Cache

Cache pode esconder problemas ou manter versão antiga.

Verificar:

- cache do navegador;
- cache do servidor;
- cache de plugin;
- CDN;
- Cloudflare;
- cache de assets;
- versionamento de CSS/JS.

## 19.1. Bust de cache

Quando necessário:

```html
<link rel="stylesheet" href="assets/css/style.css?v=1.1.0">
<script src="assets/js/main.js?v=1.1.0"></script>
```

Usar com critério.

---

# 20. Validação pós-deploy

Após publicar, testar imediatamente.

## 20.1. Checklist rápido

- [ ] Site abre.
- [ ] HTTPS funciona.
- [ ] Página inicial carrega.
- [ ] CSS carrega.
- [ ] JS carrega.
- [ ] Imagens carregam.
- [ ] Menu funciona.
- [ ] Mobile funciona.
- [ ] Formulário funciona.
- [ ] WhatsApp funciona.
- [ ] Links principais funcionam.
- [ ] Console sem erro crítico.
- [ ] GTM/GA/Pixel conferidos.
- [ ] Produção não está com `noindex`.
- [ ] Homologação continua bloqueada.
- [ ] Arquivos privados não estão públicos.

## 20.2. Checklist para sistema

- [ ] Login funciona.
- [ ] Logout funciona.
- [ ] Permissões funcionam.
- [ ] Painel abre.
- [ ] CRUD funciona.
- [ ] Upload funciona.
- [ ] Dados aparecem corretamente.
- [ ] E-mails são enviados.
- [ ] Logs não expõem dados.
- [ ] Erros são tratados.

---

# 21. Rollback

Todo deploy relevante precisa de rollback.

## 21.1. Rollback simples de arquivos

```md
Se falhar:
1. Restaurar arquivos da versão anterior.
2. Restaurar `.htaccess`, se alterado.
3. Limpar cache.
4. Testar página principal.
5. Testar formulário.
```

## 21.2. Rollback com banco

```md
Se falhar:
1. Colocar sistema em manutenção, se necessário.
2. Restaurar backup do banco.
3. Restaurar arquivos correspondentes à versão anterior.
4. Validar login e painel.
5. Validar dados existentes.
```

## 21.3. Rollback com DNS

```md
Se falhar:
1. Restaurar registros DNS anteriores.
2. Aguardar propagação.
3. Validar domínio.
4. Validar e-mails.
5. Validar SSL.
```

## 21.4. Aviso

Rollback precisa ser planejado antes do deploy, não depois do erro.

---

# 22. Hotfix em produção

Hotfix é correção urgente.

## 22.1. Regras

- identificar problema exato;
- alterar o mínimo necessário;
- backup do arquivo afetado;
- não fazer refatoração ampla;
- testar fluxo afetado;
- registrar correção;
- avaliar depois se precisa ajuste maior.

## 22.2. Modelo

```md
## Hotfix

Problema:
- Formulário não envia.

Causa provável:
- Endpoint incorreto após publicação.

Ação:
- Corrigir URL do endpoint no arquivo `contato.php`.

Risco:
- Médio.

Backup:
- Salvar versão atual de `contato.php`.

Teste:
- Enviar formulário real controlado.
- Verificar recebimento.
```

---

# 23. Arquivos de manutenção

Se necessário, usar página de manutenção durante mudanças críticas.

## 23.1. Quando usar

- migração de banco;
- troca de servidor;
- alteração de checkout;
- alteração de login;
- manutenção em sistema com usuários ativos.

## 23.2. Cuidados

- informar mensagem clara;
- não deixar manutenção ativa após concluir;
- não bloquear robôs por engano em produção por muito tempo;
- preservar status SEO quando aplicável.

---

# 24. Logs

Logs ajudam, mas podem expor dados.

## 24.1. Em produção

Logs devem:

- ficar fora de pasta pública;
- não expor senha;
- não expor token;
- não expor dados sensíveis sem necessidade;
- ter rotação ou limpeza;
- ser acessíveis apenas por responsáveis.

## 24.2. Em homologação

Logs podem ser mais detalhados, mas ainda protegidos.

---

# 25. Deploy com formulários

Antes de publicar formulário:

- validar campos obrigatórios;
- validar front-end e back-end;
- conferir destino;
- conferir e-mail;
- conferir WhatsApp;
- conferir anti-spam;
- conferir consentimento;
- conferir eventos de conversão;
- testar no mobile;
- testar mensagens de erro;
- testar sucesso.

## 25.1. WhatsApp

Verificar:

- número correto;
- DDI correto;
- mensagem formatada;
- campos preenchidos;
- abertura em nova aba;
- compatibilidade mobile.

---

# 26. Deploy com rastreamento

Antes de publicar rastreamento:

- confirmar ID correto;
- evitar duplicidade;
- testar eventos;
- testar conversões;
- testar páginas de obrigado;
- validar ambiente;
- não usar tags de teste em produção;
- não usar tags reais em homologação sem controle.

---

# 27. Deploy com SEO

Antes de publicar:

- title;
- description;
- H1;
- canonical;
- sitemap;
- robots;
- Open Graph;
- favicon;
- URLs;
- redirects;
- alt de imagens importantes;
- performance básica.

## 27.1. `noindex`

Erro crítico comum:

- produção ficar com `noindex`;
- homologação ficar indexável.

Sempre verificar.

---

# 28. Deploy com uploads

Uploads exigem:

- pasta correta;
- permissões corretas;
- limite de tamanho;
- validação de extensão;
- bloqueio de execução;
- separação público/privado;
- backup;
- proteção de dados.

Não usar uploads públicos para arquivos sensíveis sem controle.

---

# 29. Deploy com área logada

Antes de publicar área logada:

- login;
- logout;
- sessão;
- bloqueio de páginas privadas;
- permissões;
- recuperação de senha, se houver;
- senha com hash;
- proteção contra brute force, quando possível;
- HTTPS;
- mensagens de erro genéricas;
- painel não acessível sem login.

---

# 30. Deploy com pagamento

Antes de ativar pagamento real:

- ambiente sandbox testado;
- chaves de produção configuradas;
- webhook validado;
- status de pagamento validado;
- liberação de acesso validada;
- falha de pagamento validada;
- cancelamento validado;
- e-mail validado;
- logs protegidos;
- política e termos revisados.

---

# 31. Deploy com Google Sheets

Se usar Google Sheets:

- verificar se a planilha pode ser pública;
- verificar se há dados sensíveis;
- conferir permissão de leitura;
- conferir URL ou API;
- testar fallback;
- validar campos;
- evitar expor dados internos;
- considerar cache;
- documentar estrutura das colunas.

---

# 32. Deploy com APIs externas

Antes de publicar:

- verificar credenciais;
- proteger tokens;
- validar endpoints;
- tratar falhas;
- tratar timeout;
- tratar limite de requisições;
- validar ambiente teste/produção;
- registrar erros sem expor dados.

---

# 33. Modelo de plano de deploy

```md
# Plano de Deploy

## 1. Tipo de deploy

- [Inicial / Incremental / Hotfix / Migração / Com banco / Com infraestrutura]

## 2. Ambiente de destino

- [Homologação / Produção]
- URL:
- Pasta:
- Banco:

## 3. Arquivos a enviar

- [arquivo 1]
- [arquivo 2]

## 4. Arquivos a preservar

- `.htaccess`
- `/uploads`
- `config.php`
- [outros]

## 5. Arquivos que não devem subir

- `.env`
- `.git`
- `node_modules`
- `backup.zip`
- `dump.sql`

## 6. Backup

- Arquivos:
- Banco:
- Configurações:

## 7. Passos de publicação

1. Fazer backup.
2. Enviar arquivos.
3. Ajustar configurações.
4. Validar permissões.
5. Limpar cache.
6. Testar.

## 8. Testes pós-deploy

- Desktop:
- Mobile:
- Formulário:
- WhatsApp:
- Login:
- Tracking:
- SEO:

## 9. Rollback

- Restaurar:
- Validar:
```

---

# 34. Modelo de relatório pós-deploy

```md
# Relatório Pós-Deploy

## Resumo

Deploy realizado em:
- Ambiente:
- Data:
- Versão:

## Arquivos publicados

- [arquivo 1]
- [arquivo 2]

## Configurações alteradas

- [configuração 1]

## Testes realizados

- [teste 1]
- [teste 2]

## Resultado

- [Aprovado / Aprovado com pendências / Requer rollback]

## Pendências

- [pendência 1]

## Rollback disponível

- [Sim / Não]
- Instrução:
```

---

# 35. Erros que esta skill deve evitar

O Claude Code não deve:

- publicar sem backup;
- publicar na pasta errada;
- apagar `public_html`;
- sobrescrever `.htaccess` sem revisão;
- subir `.env`;
- subir `.git`;
- subir `node_modules`;
- subir backup ZIP público;
- subir dump SQL;
- deixar debug ativo em produção;
- deixar produção com `noindex`;
- deixar homologação indexável;
- usar banco errado;
- usar credencial errada;
- usar tag de teste em produção;
- quebrar formulário;
- quebrar WhatsApp;
- quebrar tracking;
- quebrar SEO;
- ignorar rollback;
- ignorar cache;
- ignorar SSL;
- ignorar permissões;
- confundir build com código-fonte;
- publicar versão incompleta.

---

# 36. Saída esperada desta skill

Ao aplicar esta skill, o Claude Code deve entregar uma ou mais destas saídas:

- checklist pré-deploy;
- plano de deploy;
- lista de arquivos a enviar;
- lista de arquivos a preservar;
- lista de arquivos proibidos;
- plano de backup;
- plano de rollback;
- instruções específicas para `public_html`;
- instruções específicas para cPanel;
- instruções específicas para PHP/MySQL;
- instruções específicas para frontend buildado;
- validação pós-deploy;
- relatório pós-deploy;
- alerta de riscos.

---

# 37. Frase-guia da skill

> Deploy seguro não é copiar arquivos. Deploy seguro é publicar a versão certa, no ambiente certo, preservando o que funciona, protegendo dados e credenciais, com backup, teste e rollback definidos antes da produção.

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
