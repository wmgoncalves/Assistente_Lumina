---
name: environment-strategy
description: Estrategia de ambientes (desenvolvimento, homologacao, producao). Evita testar em producao, indexacao de homologacao, contaminacao de tags reais, dados sensiveis em ambiente publico e troca errada de banco/credencial. Use antes de criar homologacao, testar, fazer deploy ou validar alteracao com risco medio ou alto.
---
# 03 — Environment Strategy

## Nome da skill

`03-environment-strategy`

## Categoria

Estratégia de ambientes, desenvolvimento, homologação, produção, publicação segura, testes, isolamento, proteção contra indexação, validação e governança operacional.

## Objetivo principal

Esta skill orienta o Claude Code a planejar, separar, proteger e validar ambientes de desenvolvimento, homologação e produção em projetos digitais.

Ela deve ser usada sempre que o projeto envolver criação, alteração, teste, publicação, deploy, migração, área logada, banco de dados, formulários, integração, rastreamento, SEO, plataforma, sistema interno ou produto digital.

O objetivo é evitar que alterações sejam testadas diretamente no site oficial, que ambientes de teste sejam indexados pelo Google, que dados reais sejam expostos, que eventos de conversão sejam disparados de forma incorreta e que versões incompletas cheguem ao usuário final.

A regra central é:

> Produção não é ambiente de teste. Toda mudança com risco médio, alto ou crítico deve ser validada em ambiente controlado antes de ser publicada no domínio oficial.

---

# 1. Relação com as outras skills

Esta skill deve trabalhar em conjunto com:

- `00-technical-governance-overview`
- `01-requirements-analysis`
- `02-versioning-change-control`
- `04-safe-deploy-hosting`
- `05-hosting-infrastructure-analysis`
- `06-storage-database-files`
- `07-product-readiness-checklist`
- skills de segurança já existentes
- skills de design já existentes

## 1.1. Prioridade

Em caso de conflito entre velocidade e segurança, a segurança vence.

Em caso de conflito entre publicar rápido e testar corretamente, testar corretamente vence.

Em caso de conflito entre design bonito e estabilidade de produção, estabilidade de produção vence.

---

# 2. Quando usar esta skill

Use esta skill quando o usuário pedir:

- criar projeto novo;
- alterar site existente;
- criar nova versão;
- testar alterações;
- criar homologação;
- publicar no domínio oficial;
- configurar subdomínio de teste;
- usar pasta de teste;
- fazer deploy;
- migrar servidor;
- configurar produção;
- configurar banco;
- configurar área logada;
- configurar plataforma;
- configurar painel;
- configurar ambiente com dados reais;
- testar formulários;
- testar rastreamento;
- testar Google Tag Manager;
- testar Meta Pixel;
- testar Google Analytics;
- testar checkout;
- testar login;
- testar integrações;
- evitar indexação de ambiente de teste.

---

# 3. Definição dos ambientes

Todo projeto deve ser entendido em pelo menos três possíveis ambientes:

1. Desenvolvimento;
2. Homologação;
3. Produção.

Nem todo projeto simples terá todos eles formalmente configurados, mas o Claude Code deve sempre considerar essa separação.

---

# 4. Ambiente de desenvolvimento

## 4.1. Definição

O ambiente de desenvolvimento é onde o projeto é criado, alterado, testado localmente ou ajustado antes de ser disponibilizado para validação.

Pode ser:

- ambiente local;
- editor com preview;
- pasta temporária;
- branch de desenvolvimento;
- repositório;
- container;
- preview da ferramenta;
- cópia do projeto fora do domínio oficial.

## 4.2. Finalidade

Usar desenvolvimento para:

- escrever código;
- testar layout;
- validar lógica inicial;
- corrigir bugs;
- experimentar alternativas;
- criar componentes;
- organizar estrutura;
- validar responsividade;
- testar sem afetar usuários reais.

## 4.3. Regras

No ambiente de desenvolvimento:

- não usar credenciais reais sem necessidade;
- não usar banco de produção diretamente;
- não disparar e-mails reais sem controle;
- não registrar conversões reais;
- não expor dados pessoais;
- não publicar URLs de teste;
- não depender de arquivos locais que não irão para produção;
- não usar configurações que só funcionam no computador do desenvolvedor;
- registrar dependências necessárias para produção.

## 4.4. Atenção a caminhos locais

O Claude Code deve evitar caminhos absolutos locais que quebram no servidor.

Evitar:

```txt
C:\Users\Usuario\Desktop\projeto\imagem.png
/Users/nome/projeto/assets/img/logo.png
```

Usar caminhos relativos quando adequado:

```txt
assets/img/logo.png
/assets/img/logo.png
```

A escolha entre caminho relativo e absoluto deve considerar a estrutura final de publicação.

---

# 5. Ambiente de homologação

## 5.1. Definição

Homologação é o ambiente usado para testar e validar uma versão antes de publicar em produção.

É o lugar onde cliente, equipe ou responsável técnico pode revisar:

- layout;
- conteúdo;
- formulários;
- integrações;
- fluxo mobile;
- login;
- painel;
- dados;
- rastreamento;
- performance;
- SEO técnico;
- comportamento geral.

## 5.2. Possíveis formatos de homologação

A homologação pode ser feita de várias formas.

### 5.2.1. Subdomínio

Exemplos:

```txt
homologacao.dominio.com.br
teste.dominio.com.br
dev.dominio.com.br
staging.dominio.com.br
```

Vantagens:

- separação clara;
- mais profissional;
- fácil proteger com senha;
- reduz risco de confundir com produção.

Cuidados:

- bloquear indexação;
- proteger com senha;
- configurar SSL;
- não usar dados reais sem cuidado;
- evitar tags de conversão reais.

### 5.2.2. Subpasta

Exemplos:

```txt
dominio.com.br/homologacao
dominio.com.br/teste
dominio.com.br/dev
```

Vantagens:

- simples em hospedagem compartilhada;
- fácil subir via `public_html`;
- não exige DNS extra.

Cuidados:

- alto risco de indexação;
- pode compartilhar arquivos com produção;
- pode confundir caminhos;
- precisa proteger com senha ou `noindex`;
- não deve conter backups, dumps ou arquivos privados.

### 5.2.3. Domínio temporário

Exemplos:

```txt
cliente.dvdigital.dev.br
projeto-temporario.com.br
```

Vantagens:

- bom para apresentação;
- isola do domínio oficial;
- permite validação externa.

Cuidados:

- proteger contra indexação;
- remover após uso se não for mais necessário;
- não usar como produção sem decisão clara.

### 5.2.4. Preview local ou ferramenta de preview

Vantagens:

- rápido;
- útil para mudanças visuais;
- bom para protótipos.

Cuidados:

- não substitui teste em servidor real quando houver PHP, banco, formulário, `.htaccess`, rotas ou integrações;
- pode não representar limitações da hospedagem final.

---

# 6. Ambiente de produção

## 6.1. Definição

Produção é o ambiente oficial acessado por usuários reais.

Normalmente envolve:

- domínio principal;
- site público;
- tráfego orgânico;
- tráfego pago;
- dados reais;
- formulários reais;
- integrações reais;
- eventos reais;
- clientes reais;
- usuários reais;
- SEO real.

## 6.2. Regras de produção

Produção deve:

- estar estável;
- ter backup;
- usar HTTPS;
- não exibir erros técnicos;
- não conter arquivos de teste;
- não conter dados falsos;
- não conter credenciais expostas;
- não conter ambiente de debug ativo;
- não conter backups públicos;
- não conter dumps de banco;
- não conter prompts internos;
- não conter arquivos `.env`;
- não conter páginas de teste indexáveis;
- não usar tags de homologação;
- não usar banco de teste;
- não usar textos provisórios;
- não usar imagens quebradas.

## 6.3. Produção não deve ser usada para experimentar

Não fazer em produção:

- testar layout pela primeira vez;
- experimentar biblioteca nova;
- alterar banco sem backup;
- testar login novo;
- testar pagamento novo;
- testar upload novo;
- testar GTM sem cuidado;
- testar pixel de conversão como se fosse ambiente de teste;
- trocar tema inteiro sem validação;
- refatorar código crítico sem rollback.

---

# 7. Regra de escolha do ambiente conforme risco

## 7.1. Baixo risco

Exemplos:

- corrigir texto;
- trocar imagem simples;
- corrigir telefone;
- corrigir link;
- ajustar espaçamento local.

Pode ser feito com teste local e publicação direta, desde que:

- haja backup ou possibilidade simples de reversão;
- a alteração seja conferida após publicar;
- não afete formulário, login, banco ou tracking.

## 7.2. Médio risco

Exemplos:

- alterar layout de página principal;
- alterar menu;
- alterar rodapé;
- alterar formulário visualmente;
- alterar CSS global;
- alterar CTA rastreado;
- adicionar script;
- alterar SEO.

Deve ser testado em homologação quando possível.

Se não houver homologação, criar pelo menos uma validação controlada:

- cópia local;
- pasta temporária protegida;
- backup antes;
- teste imediatamente após publicação;
- rollback preparado.

## 7.3. Alto risco

Exemplos:

- login;
- painel;
- banco;
- API;
- checkout;
- upload;
- permissões;
- alteração de `.htaccess`;
- migração de hospedagem;
- alteração em DNS;
- alteração de autenticação;
- alteração em dados reais.

Exige homologação.

Não publicar direto em produção sem:

- backup;
- plano de teste;
- plano de rollback;
- validação completa.

## 7.4. Risco crítico

Exemplos:

- migração de servidor;
- exclusão de banco;
- alteração de DNS principal;
- mudança de checkout;
- alteração de autenticação em sistema ativo;
- publicação com dados sensíveis;
- remoção de controles de acesso;
- alteração em sistema usado por muitos usuários.

Exige:

- plano formal;
- confirmação explícita;
- backup completo;
- homologação;
- janela de manutenção, se necessário;
- rollback documentado;
- validação pós-publicação.

---

# 8. Proteção contra indexação de homologação

Ambientes de teste não devem aparecer no Google.

O Claude Code deve sempre proteger homologação contra indexação.

## 8.1. Meta tag noindex

Adicionar nas páginas de homologação:

```html
<meta name="robots" content="noindex, nofollow, noarchive">
```

## 8.2. Robots.txt

Em ambiente exclusivo de homologação, usar:

```txt
User-agent: *
Disallow: /
```

Atenção:

- `robots.txt` não é segurança;
- apenas orienta robôs;
- não impede acesso direto;
- não substitui senha.

## 8.3. Cabeçalho HTTP X-Robots-Tag

Quando possível:

```apache
Header set X-Robots-Tag "noindex, nofollow, noarchive"
```

Em `.htaccess`, pode exigir suporte do servidor.

## 8.4. Proteção por senha

A forma mais segura para homologação pública é proteger com senha.

Em hospedagem Apache/cPanel, pode-se usar:

- proteção de diretório pelo cPanel;
- `.htaccess`;
- `.htpasswd`.

## 8.5. Remoção de links públicos

Não inserir links de homologação:

- no sitemap;
- no menu do site oficial;
- no rodapé;
- em posts públicos;
- em campanhas;
- em páginas indexáveis;
- em e-mails para público geral.

---

# 9. Identificação visual de ambiente

Todo ambiente de homologação deve deixar claro que não é produção.

## 9.1. Badge visual

Exemplo:

```html
<div class="environment-badge">Ambiente de Homologação</div>
```

Exemplo CSS:

```css
.environment-badge {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 99999;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  background: #111;
  color: #fff;
  opacity: 0.85;
}
```

## 9.2. Aviso no painel

Em sistemas com painel, exibir:

```txt
Você está no ambiente de homologação. Dados e ações podem ser apagados.
```

## 9.3. Nunca exibir badge em produção

Antes de publicar, verificar se:

- badge de homologação foi removido;
- meta `noindex` foi removida da produção;
- robots de produção está correto;
- banco de produção está configurado;
- tags de produção estão corretas.

---

# 10. Separação de configurações por ambiente

Sempre que houver lógica dinâmica, o Claude Code deve separar configurações por ambiente.

## 10.1. Variáveis típicas

- ambiente atual;
- URL base;
- conexão com banco;
- credenciais;
- chaves de API;
- modo debug;
- e-mail de teste;
- e-mail real;
- token de pagamento;
- chave do Google;
- ID do GTM;
- ID do Meta Pixel;
- webhook;
- storage;
- pasta de upload.

## 10.2. Exemplo conceitual em PHP

```php
define('APP_ENV', 'homologation');

if (APP_ENV === 'production') {
    define('BASE_URL', 'https://dominio.com.br');
} else {
    define('BASE_URL', 'https://homologacao.dominio.com.br');
}
```

## 10.3. Regra para credenciais

Credenciais não devem ficar expostas no frontend.

Não publicar:

```txt
.env
config-private.php
credentials.json
service-account.json
dump.sql
```

## 10.4. Debug

Em produção:

- debug deve ficar desligado;
- erros técnicos não devem ser exibidos ao usuário;
- logs devem ficar protegidos;
- mensagens devem ser genéricas.

Em homologação:

- debug pode ser mais detalhado;
- logs ajudam na validação;
- ainda assim não deve expor credenciais ou dados sensíveis.

---

# 11. Banco de dados por ambiente

Projetos com banco exigem cuidado especial.

## 11.1. Regra principal

Nunca usar banco de produção para testes destrutivos.

## 11.2. Estratégias

### Banco separado para homologação

Recomendado para sistemas médios e grandes.

Exemplo:

```txt
projeto_prod
projeto_homolog
```

### Tabelas separadas

Pode ser usado em projetos simples, mas exige disciplina.

Exemplo:

```txt
prod_usuarios
homolog_usuarios
```

Menos recomendado que bancos separados.

### Cópia sanitizada

Para testar com dados parecidos, usar cópia sem dados sensíveis.

Remover ou mascarar:

- CPF;
- e-mail;
- telefone;
- endereço;
- dados financeiros;
- dados de saúde;
- documentos;
- respostas sensíveis;
- senhas;
- tokens.

## 11.3. Senhas

Nunca copiar senhas reais de usuários para ambiente de teste de forma insegura.

## 11.4. Migrações

Alterações de banco devem ser testadas em homologação antes da produção.

---

# 12. Dados reais em homologação

## 12.1. Regra

Evitar dados reais em homologação.

Se dados reais forem necessários:

- usar apenas o mínimo;
- mascarar dados sensíveis;
- restringir acesso;
- proteger com senha;
- não indexar;
- apagar após testes;
- não enviar para terceiros;
- seguir LGPD.

## 12.2. Dados proibidos em homologação pública

Evitar completamente:

- CPF;
- documentos pessoais;
- dados de saúde;
- dados financeiros;
- dados de pacientes;
- dados de colaboradores;
- dados de menores;
- contratos sensíveis;
- credenciais;
- tokens;
- chaves privadas.

---

# 13. Formulários por ambiente

Formulários precisam ser testados sem gerar confusão operacional.

## 13.1. Em homologação

Formulários devem:

- enviar para e-mail de teste;
- abrir WhatsApp de teste quando possível;
- marcar assunto como teste;
- não cadastrar leads reais no CRM;
- não disparar automações reais;
- não enviar e-mail para cliente final;
- não disparar conversão real;
- não gravar em banco de produção.

## 13.2. Assunto de e-mail em homologação

Exemplo:

```txt
[TESTE HOMOLOGAÇÃO] Novo contato recebido
```

## 13.3. Mensagem de WhatsApp em homologação

Exemplo:

```txt
[TESTE HOMOLOGAÇÃO] Olá, estou testando o formulário do site...
```

## 13.4. Produção

Em produção, formulários devem:

- enviar para destino real;
- ter validação;
- ter proteção anti-spam;
- ter consentimento quando necessário;
- registrar conversões corretamente;
- não exibir erros técnicos;
- ter fallback claro se falhar.

---

# 14. Rastreamento por ambiente

Google Analytics, Google Tag Manager, Meta Pixel e eventos de conversão exigem separação.

## 14.1. Problema

Se homologação usar tags reais, os testes podem contaminar dados de produção.

Pode ocorrer:

- conversão falsa;
- lead falso;
- público de remarketing contaminado;
- métricas distorcidas;
- evento duplicado;
- campanha otimizada com dados errados.

## 14.2. Regras para homologação

Em homologação:

- não disparar eventos reais de conversão;
- usar container/test mode quando possível;
- usar IDs de teste quando disponíveis;
- bloquear tags reais se necessário;
- marcar eventos como teste;
- validar com ferramentas de debug.

## 14.3. Regras para produção

Em produção:

- usar IDs oficiais;
- validar disparo de eventos;
- garantir que CTAs principais estejam rastreados;
- evitar duplicidade;
- testar após publicação.

## 14.4. Troca de ambiente

Antes de publicar, conferir:

- GTM correto;
- GA correto;
- Meta Pixel correto;
- eventos corretos;
- conversões corretas;
- parâmetros corretos;
- páginas de obrigado corretas.

---

# 15. SEO por ambiente

## 15.1. Homologação

Homologação deve ter:

```html
<meta name="robots" content="noindex, nofollow">
```

E, quando possível:

```txt
User-agent: *
Disallow: /
```

Não deve ter:

- sitemap público enviado ao Search Console;
- canonical apontando errado;
- links internos para produção que confundem validação;
- conteúdo duplicado indexável.

## 15.2. Produção

Produção deve:

- remover `noindex`, salvo páginas que realmente não devem indexar;
- ter sitemap correto;
- ter robots.txt adequado;
- ter canonical correto;
- ter URLs finais;
- ter metatags finais;
- ter Open Graph final;
- não conter conteúdo de teste.

## 15.3. Checklist SEO antes de publicar

- `noindex` removido das páginas públicas de produção;
- robots.txt não bloqueia o site inteiro;
- canonical aponta para domínio oficial;
- sitemap contém URLs oficiais;
- títulos e descrições finais;
- imagens importantes com alt;
- Open Graph correto;
- favicon correto.

---

# 16. Arquivos e uploads por ambiente

## 16.1. Homologação

Arquivos de teste devem ficar separados dos arquivos de produção.

Evitar:

- usar pasta real de uploads;
- misturar documentos reais com testes;
- deixar PDFs sensíveis públicos;
- testar upload em diretório executável;
- permitir qualquer extensão.

## 16.2. Produção

Uploads precisam ter:

- validação;
- controle de extensão;
- renomeação segura;
- limite de tamanho;
- permissões corretas;
- backup;
- proteção contra execução;
- restrição de acesso quando privado.

## 16.3. Separação recomendada

Exemplo:

```txt
/uploads/prod
/uploads/homolog
```

Ou, melhor:

```txt
/storage/production
/storage/homologation
```

quando a estrutura permitir.

---

# 17. E-mails por ambiente

## 17.1. Homologação

E-mails devem ir para destino de teste.

Exemplo:

```txt
dev@dominio.com.br
teste@dominio.com.br
```

Assunto deve indicar teste:

```txt
[HOMOLOGAÇÃO] Teste de envio
```

Não disparar:

- e-mail para cliente real;
- cobrança;
- certificado real;
- confirmação de compra real;
- notificação operacional real.

## 17.2. Produção

E-mails devem:

- ter remetente correto;
- usar autenticação adequada;
- evitar cair em spam;
- ter conteúdo final;
- registrar erros;
- não expor dados sensíveis desnecessários.

---

# 18. Pagamentos por ambiente

Pagamentos exigem separação rigorosa.

## 18.1. Homologação

Usar:

- sandbox;
- ambiente de teste do gateway;
- chaves de teste;
- produtos de teste;
- webhooks de teste.

Não usar cartão real ou cobrança real sem necessidade.

## 18.2. Produção

Antes de ativar pagamentos reais:

- trocar chaves para produção;
- validar webhooks;
- validar checkout;
- validar status de pagamento;
- validar liberação de acesso;
- validar e-mail;
- validar cancelamento ou falha;
- registrar logs protegidos.

---

# 19. Login e permissões por ambiente

## 19.1. Homologação

Criar usuários de teste:

- admin teste;
- usuário comum teste;
- perfil intermediário, se houver.

Não usar senha real.

Não usar contas reais sem necessidade.

## 19.2. Produção

Antes de publicar login:

- painel protegido;
- logout funcionando;
- sessão segura;
- permissões corretas;
- páginas privadas bloqueadas;
- recuperação de senha segura, se houver;
- erros sem exposição técnica;
- senhas protegidas com hash seguro.

---

# 20. `.htaccess` e regras de servidor

Alterações em `.htaccess` podem ser alto risco.

## 20.1. Em homologação

Testar regras antes:

- redirects;
- URLs amigáveis;
- bloqueio de arquivos;
- proteção de diretórios;
- cache;
- compressão;
- headers;
- bloqueio de listagem.

## 20.2. Em produção

Antes de subir `.htaccess`:

- fazer backup do arquivo atual;
- verificar se não quebra rotas;
- verificar se não bloqueia assets;
- verificar se não remove HTTPS;
- verificar se não bloqueia Google indevidamente;
- verificar se protege arquivos sensíveis.

---

# 21. Checklist para criar ambiente de homologação

```md
## Checklist de homologação

### Estrutura
- [ ] Definir subdomínio, subpasta ou domínio temporário.
- [ ] Separar arquivos de produção.
- [ ] Separar banco ou usar dados de teste.
- [ ] Separar uploads.
- [ ] Configurar SSL, se público.

### Proteção
- [ ] Adicionar `noindex`.
- [ ] Configurar robots.txt bloqueando indexação.
- [ ] Proteger com senha quando possível.
- [ ] Não incluir no sitemap.
- [ ] Não linkar publicamente.

### Configuração
- [ ] Definir URL base de homologação.
- [ ] Desativar debug público sensível.
- [ ] Usar credenciais de teste.
- [ ] Usar e-mails de teste.
- [ ] Usar tags de teste ou bloquear conversões reais.

### Validação
- [ ] Testar desktop.
- [ ] Testar mobile.
- [ ] Testar formulários.
- [ ] Testar login, se houver.
- [ ] Testar painel, se houver.
- [ ] Testar integrações.
- [ ] Testar console.
- [ ] Testar performance básica.
```

---

# 22. Checklist antes de publicar em produção

```md
## Checklist pré-produção

### Arquivos
- [ ] Arquivos finais revisados.
- [ ] Arquivos de teste removidos.
- [ ] Backups fora da pasta pública.
- [ ] `.env` e credenciais não publicados.
- [ ] `.htaccess` revisado.
- [ ] Assets carregando corretamente.

### Ambiente
- [ ] URL base alterada para produção.
- [ ] Banco de produção configurado.
- [ ] Uploads de produção configurados.
- [ ] E-mails reais configurados.
- [ ] Chaves reais configuradas apenas quando necessário.
- [ ] Debug público desligado.

### SEO
- [ ] `noindex` removido das páginas públicas.
- [ ] Robots.txt correto.
- [ ] Sitemap correto.
- [ ] Canonical correto.
- [ ] Metatags finais.

### Rastreamento
- [ ] GTM correto.
- [ ] GA correto.
- [ ] Meta Pixel correto.
- [ ] Eventos de conversão testados.
- [ ] Não há tags duplicadas.

### Funcional
- [ ] Links testados.
- [ ] Formulários testados.
- [ ] WhatsApp testado.
- [ ] Login testado.
- [ ] Painel testado.
- [ ] Upload testado.
- [ ] Checkout testado, se houver.

### Segurança
- [ ] HTTPS funcionando.
- [ ] Arquivos privados protegidos.
- [ ] Diretórios sem listagem pública.
- [ ] Uploads protegidos.
- [ ] Erros técnicos ocultos.
- [ ] Backup feito.
- [ ] Rollback definido.
```

---

# 23. Checklist pós-publicação

Após publicar, verificar imediatamente:

- site abre no domínio oficial;
- HTTPS funciona;
- páginas principais carregam;
- layout desktop está correto;
- layout mobile está correto;
- menu funciona;
- CTAs funcionam;
- WhatsApp abre com mensagem correta;
- formulários funcionam;
- e-mails chegam;
- login funciona;
- painel funciona;
- console sem erro crítico;
- tags disparam corretamente;
- site não está com `noindex`;
- robots.txt não bloqueia tudo;
- não há arquivos de teste públicos;
- performance aceitável;
- backup permanece disponível;
- rollback ainda é possível.

---

# 24. Estratégia para HostGator/cPanel/public_html

Quando o projeto for publicado em hospedagem compartilhada com cPanel e `public_html`, seguir cuidados específicos.

## 24.1. Homologação em subpasta

Exemplo:

```txt
public_html/homologacao
```

Cuidados:

- adicionar `noindex`;
- proteger com senha;
- não deixar indexação de diretório;
- não misturar uploads;
- não deixar backups;
- não usar banco de produção para testes destrutivos.

## 24.2. Homologação em subdomínio

Exemplo:

```txt
homologacao.dominio.com.br
```

Pode apontar para pasta:

```txt
/public_html/homologacao
```

ou:

```txt
/homologacao
```

dependendo do cPanel.

## 24.3. Produção

Normalmente:

```txt
/public_html
```

Antes de publicar:

- fazer backup da versão atual;
- não apagar tudo;
- subir arquivos necessários;
- preservar `.htaccess`;
- preservar pastas de uploads;
- preservar arquivos de configuração;
- validar permissões.

---

# 25. Estratégia para projetos estáticos

Projetos puramente estáticos podem ter processo mais simples.

Mesmo assim, separar:

- versão de edição;
- versão de homologação;
- versão de produção.

Verificar:

- links;
- imagens;
- CSS;
- JavaScript;
- metatags;
- scripts de rastreamento;
- `noindex`;
- sitemap;
- robots;
- favicon.

---

# 26. Estratégia para projetos PHP + MySQL

Projetos PHP + MySQL exigem:

- ambiente de banco separado ou cópia de teste;
- configuração de conexão por ambiente;
- cuidado com credenciais;
- backup de banco antes de alterações;
- logs protegidos;
- erros ocultos em produção;
- uploads protegidos.

## 26.1. Arquivo de configuração

Idealmente, configurações sensíveis devem ficar fora da pasta pública.

Se não for possível, devem ser protegidas por `.htaccess`.

---

# 27. Estratégia para projetos com frontend moderno

Se houver build com Node, React, Vite, Next ou similar:

- distinguir ambiente de build e produção;
- verificar se a hospedagem suporta o resultado final;
- não subir `node_modules`;
- não subir arquivos de desenvolvimento;
- não depender de Node em produção se o servidor não suporta;
- gerar build final;
- testar build em ambiente parecido com produção;
- configurar variáveis de ambiente corretamente.

## 27.1. Atenção

Se o usuário costuma publicar via `public_html`, o Claude Code deve priorizar resultado estático ou PHP leve, salvo pedido contrário.

---

# 28. Estratégia para Cloud, VPS e serviços externos

Quando houver Cloud, VPS ou serviços externos:

- separar projetos;
- separar credenciais;
- separar bancos;
- separar storage;
- configurar backups;
- configurar logs;
- configurar domínio;
- configurar SSL;
- monitorar custos;
- revisar permissões;
- evitar ambientes públicos sem senha;
- evitar buckets públicos indevidos.

---

# 29. Erros que esta skill deve evitar

O Claude Code não deve:

- testar em produção sem necessidade;
- publicar versão incompleta no domínio oficial;
- deixar homologação indexável;
- usar dados reais em teste sem cuidado;
- disparar conversões falsas;
- enviar e-mails reais em teste;
- usar banco de produção para testes destrutivos;
- deixar debug ativo em produção;
- publicar arquivos de teste;
- esquecer de remover `noindex` da produção;
- esquecer de bloquear homologação;
- misturar uploads de teste e produção;
- usar credenciais reais no frontend;
- alterar `.htaccess` sem backup;
- trocar chaves de produção e teste sem revisar;
- publicar ambiente errado.

---

# 30. Modelo de resposta ao planejar ambientes

```md
## Estratégia de ambientes

Tipo de projeto:
- Site institucional com formulário e rastreamento

Risco:
- Médio

Ambientes recomendados:
1. Desenvolvimento local para ajustes.
2. Homologação em `teste.dominio.com.br` ou `/homologacao`.
3. Produção em `dominio.com.br`.

Regras para homologação:
- Usar `noindex`.
- Proteger com senha se possível.
- Não enviar leads reais.
- Não disparar conversões reais.
- Exibir badge de ambiente de teste.

Antes de produção:
- Fazer backup.
- Remover badge de homologação.
- Remover `noindex`.
- Conferir GTM, GA e Meta Pixel.
- Testar formulário e WhatsApp.
```

---

# 31. Modelo de plano de publicação com homologação

```md
# Plano de publicação

## 1. Preparação
- Criar backup da versão atual.
- Separar arquivos alterados.
- Verificar configurações por ambiente.

## 2. Homologação
- Publicar em ambiente de teste.
- Bloquear indexação.
- Proteger com senha.
- Testar layout, formulário, tracking e mobile.

## 3. Validação
- Corrigir problemas encontrados.
- Registrar alterações.
- Aprovar versão final.

## 4. Produção
- Publicar arquivos finais.
- Remover configurações de teste.
- Ativar configurações reais.
- Testar domínio oficial.

## 5. Pós-publicação
- Verificar console.
- Verificar formulários.
- Verificar rastreamento.
- Confirmar SEO.
- Manter rollback disponível.
```

---

# 32. Saída esperada desta skill

Ao aplicar esta skill, o Claude Code deve entregar uma ou mais destas saídas:

- estratégia de ambientes;
- recomendação de homologação;
- checklist de criação de ambiente de teste;
- checklist pré-produção;
- checklist pós-publicação;
- plano de separação de banco;
- plano de separação de uploads;
- orientação contra indexação;
- orientação de tags por ambiente;
- orientação de e-mails de teste;
- plano de publicação controlada;
- alerta de riscos de produção;
- plano de rollback relacionado ao ambiente.

---

# 33. Frase-guia da skill

> Desenvolvimento é para criar, homologação é para validar, produção é para entregar. Nunca misture esses papéis sem controle, porque ambiente errado pode gerar erro real, dado exposto, conversão falsa, perda de SEO e quebra para usuários finais.

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
