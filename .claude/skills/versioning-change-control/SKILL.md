---
name: versioning-change-control
description: Controle de versoes e mudancas em projeto existente. Classifica tipo (bugfix/visual/feature/refactor/arquitetura/deploy) e risco (baixo/medio/alto/critico), exige plano, preservacao, backup, changelog e rollback. Use antes de alterar, refatorar ou expandir qualquer projeto que ja funciona.
---
# 02 — Versioning and Change Control

## Nome da skill

`02-versioning-change-control`

## Categoria

Versionamento, controle de mudanças, preservação de projeto existente, rastreabilidade, changelog, backup, rollback, análise de impacto e execução incremental.

## Objetivo principal

Esta skill orienta o Claude Code a controlar versões e mudanças em projetos digitais, evitando alterações destrutivas, reescritas desnecessárias, perda de funcionalidades, regressões, apagamento de código útil, quebra de integrações e publicação de versões erradas.

Ela deve ser usada sempre que o Claude Code for alterar, corrigir, refatorar, melhorar, expandir ou publicar um projeto existente.

O objetivo é garantir que toda mudança seja:

- analisada antes da execução;
- classificada por tipo e risco;
- feita de forma incremental;
- documentada quando relevante;
- reversível sempre que possível;
- compatível com o estado atual do projeto;
- segura para homologação e produção;
- alinhada aos requisitos já definidos;
- integrada às demais skills de segurança, design, hospedagem, armazenamento e deploy.

---

# 1. Regra principal desta skill

A regra principal é:

> Em projeto existente, o Claude Code nunca deve apagar, substituir ou reconstruir tudo sem antes analisar o que existe, entender a função de cada parte, avaliar dependências, preservar o que funciona e propor uma mudança incremental, testável e reversível.

Esta skill existe porque mudanças aparentemente simples podem quebrar:

- formulários;
- integração com WhatsApp;
- Google Tag Manager;
- Google Analytics;
- Meta Pixel;
- eventos de conversão;
- SEO;
- metatags;
- Open Graph;
- rotas;
- menus;
- CSS global;
- responsividade;
- autenticação;
- permissões;
- banco de dados;
- uploads;
- arquivos privados;
- APIs;
- painel administrativo;
- checkout;
- scripts internos;
- regras de negócio;
- conteúdo aprovado;
- identidade visual aprovada.

---

# 2. Relação com a skill 00

Esta skill segue a orientação da skill:

`00-technical-governance-overview`

Antes de aplicar qualquer mudança, o Claude Code deve verificar:

- contexto anterior;
- memória técnica;
- arquivo `CLAUDE.md`;
- README;
- changelog;
- documentação;
- estrutura atual;
- decisões já tomadas;
- requisitos existentes;
- regras de segurança;
- regras de design;
- regras de hospedagem;
- ambiente atual;
- instruções específicas do usuário.

Se houver conflito entre a vontade de melhorar o projeto e a necessidade de preservar estabilidade, a estabilidade deve prevalecer.

---

# 3. Quando esta skill deve ser usada

Use esta skill sempre que o pedido envolver:

- alterar projeto existente;
- corrigir bug;
- melhorar layout existente;
- adicionar seção;
- remover seção;
- trocar tecnologia;
- alterar formulário;
- alterar CSS global;
- alterar JavaScript;
- alterar rotas;
- alterar menu;
- alterar banco de dados;
- alterar login;
- alterar permissões;
- alterar painel;
- alterar integrações;
- alterar SEO;
- alterar scripts de rastreamento;
- publicar nova versão;
- atualizar dependências;
- refatorar código;
- reorganizar pastas;
- migrar projeto;
- preparar deploy;
- criar nova versão de uma página;
- preservar versão anterior;
- comparar versões;
- gerar changelog.

---

# 4. Frase obrigatória de comportamento

Em projetos existentes, o Claude Code deve seguir esta lógica:

> Primeiro analisar. Depois planejar. Depois alterar por partes. Depois testar. Depois registrar. Só então considerar pronto.

Nunca deve agir assim:

> “Vou refazer tudo do zero para ficar melhor.”

A menos que o usuário peça explicitamente uma reconstrução total, e mesmo nesse caso deve haver análise, backup, plano de migração e preservação de funcionalidades importantes.

---

# 5. Análise obrigatória antes de alterar

Antes de qualquer mudança relevante, o Claude Code deve mapear o estado atual do projeto.

## 5.1. Estrutura de arquivos

Identificar:

- arquivos principais;
- pastas públicas;
- pastas privadas;
- assets;
- componentes;
- scripts;
- CSS global;
- arquivos de configuração;
- banco de dados;
- uploads;
- documentação;
- arquivos de deploy.

Exemplo:

```txt
/
  index.html
  sobre.html
  contato.html
  assets/
    css/
      style.css
    js/
      main.js
    img/
  includes/
  admin/
  api/
  .htaccess
```

## 5.2. Páginas e rotas

Mapear:

- páginas públicas;
- páginas privadas;
- páginas de login;
- páginas administrativas;
- páginas de obrigado;
- páginas de erro;
- rotas de API;
- rotas de formulário;
- rotas de download.

## 5.3. Funcionalidades existentes

Identificar:

- formulário de contato;
- botão de WhatsApp;
- envio de e-mail;
- login;
- logout;
- cadastro;
- painel admin;
- filtros;
- busca;
- upload;
- download;
- checkout;
- área de aluno;
- listagem dinâmica;
- integração com planilha;
- integração com API;
- relatórios;
- automações.

## 5.4. Integrações

Mapear:

- Google Analytics;
- Google Tag Manager;
- Meta Pixel;
- WhatsApp;
- Google Sheets;
- Google Forms;
- e-mail SMTP;
- gateway de pagamento;
- CRM;
- API externa;
- Cloudflare;
- mapas;
- YouTube;
- Vimeo;
- Supabase;
- Firebase;
- banco de dados;
- webhooks.

## 5.5. Pontos sensíveis

Identificar itens que não podem ser quebrados:

- IDs usados por scripts;
- classes usadas por JavaScript;
- atributos `data-*`;
- eventos de clique;
- nomes de campos;
- endpoints;
- chaves públicas;
- rotas;
- parâmetros de URL;
- nomes de tabelas;
- nomes de colunas;
- arquivos de configuração;
- regras de `.htaccess`;
- scripts de rastreamento;
- metatags;
- links de campanha;
- UTMs;
- URLs públicas já indexadas.

---

# 6. Classificação da mudança

Toda alteração deve ser classificada antes da execução.

## 6.1. Correção de bug

Quando algo não funciona como deveria.

Exemplos:

- botão quebrado;
- formulário não envia;
- menu não abre no mobile;
- erro no console;
- layout quebrado;
- filtro não funciona;
- link errado;
- login falhando.

Regra:

- alterar o mínimo necessário;
- localizar causa raiz;
- testar o fluxo afetado;
- evitar refatorações paralelas sem necessidade.

## 6.2. Melhoria visual

Quando o objetivo é melhorar aparência, UI ou UX.

Exemplos:

- melhorar hero;
- ajustar espaçamento;
- modernizar cards;
- melhorar responsividade;
- melhorar contraste;
- trocar imagem;
- reorganizar seção.

Regra:

- preservar funcionalidade;
- preservar IDs e classes críticas;
- preservar scripts;
- preservar CTAs;
- preservar SEO;
- preservar identidade visual já aprovada.

## 6.3. Nova funcionalidade

Quando algo novo será adicionado.

Exemplos:

- novo formulário;
- nova página;
- novo painel;
- novo filtro;
- nova integração;
- novo fluxo de cadastro;
- nova área logada.

Regra:

- analisar requisitos;
- avaliar impacto;
- adicionar de forma modular;
- não quebrar funcionalidades existentes;
- testar integração com o restante do projeto.

## 6.4. Refatoração

Quando o comportamento deveria permanecer igual, mas o código será reorganizado.

Exemplos:

- reorganizar CSS;
- separar componentes;
- limpar duplicações;
- melhorar estrutura;
- trocar nomes internos;
- modularizar JavaScript.

Regra:

- preservar comportamento visível;
- evitar refatorar junto com nova funcionalidade;
- testar antes e depois;
- documentar alterações relevantes.

## 6.5. Alteração de arquitetura

Quando a estrutura técnica muda.

Exemplos:

- de HTML estático para PHP;
- de CSV para MySQL;
- de Google Sheets para banco;
- de hospedagem compartilhada para VPS;
- de frontend simples para app;
- de páginas soltas para roteamento.

Regra:

- exigir análise de requisitos;
- exigir plano de migração;
- exigir backup;
- exigir homologação;
- exigir rollback;
- avaliar custo e manutenção.

## 6.6. Deploy ou publicação

Quando a mudança será enviada para homologação ou produção.

Regra:

- usar `04-safe-deploy-hosting`;
- listar arquivos afetados;
- preservar arquivos críticos;
- validar ambiente;
- fazer backup;
- prever rollback.

---

# 7. Classificação de risco

Toda mudança deve ser classificada como baixo, médio, alto ou crítico.

## 7.1. Baixo risco

Mudanças pequenas, localizadas e facilmente reversíveis.

Exemplos:

- corrigir texto;
- alterar telefone;
- trocar imagem pública;
- ajustar espaçamento local;
- alterar cor de um botão;
- corrigir link;
- adicionar ícone;
- ajustar título;
- corrigir erro ortográfico.

Procedimento:

- pode executar diretamente;
- ainda deve preservar estrutura;
- testar visualmente;
- registrar se fizer parte de uma entrega maior.

## 7.2. Médio risco

Mudanças que podem afetar usabilidade, layout, tracking ou conteúdo importante.

Exemplos:

- alterar menu;
- alterar rodapé;
- alterar CSS global;
- alterar seção principal;
- mexer em formulário visualmente;
- adicionar script;
- alterar metatags;
- alterar Open Graph;
- alterar responsividade;
- mudar estrutura de página;
- alterar componente compartilhado.

Procedimento:

- analisar dependências;
- listar arquivos alterados;
- preservar integrações;
- testar mobile e desktop;
- verificar console;
- verificar rastreamento se aplicável;
- gerar changelog simples.

## 7.3. Alto risco

Mudanças que podem afetar dados, segurança, login, produção, banco ou operação.

Exemplos:

- alterar autenticação;
- alterar painel admin;
- alterar banco de dados;
- alterar API;
- alterar upload;
- alterar pagamento;
- alterar permissões;
- refatorar grande parte do projeto;
- trocar biblioteca central;
- reorganizar estrutura de pastas;
- alterar `.htaccess`;
- alterar deploy;
- mudar hospedagem;
- mexer em DNS.

Procedimento:

- fazer backup;
- criar plano incremental;
- usar homologação;
- testar fluxo completo;
- documentar mudança;
- prever rollback;
- pedir confirmação quando houver risco real.

## 7.4. Risco crítico

Mudanças que podem causar perda de dados, indisponibilidade, exposição de dados ou quebra de produção.

Exemplos:

- apagar banco de dados;
- sobrescrever produção;
- migrar servidor;
- alterar DNS principal;
- remover autenticação;
- publicar credenciais;
- excluir uploads;
- alterar permissões em massa;
- remover regras de segurança;
- desativar backups;
- apagar `.htaccess` sem revisão;
- alterar sistema com usuários ativos sem janela de manutenção.

Procedimento:

- interromper execução automática;
- explicar risco;
- exigir confirmação explícita;
- fazer backup;
- criar plano de rollback;
- executar em janela controlada;
- validar após execução.

---

# 8. Regra de preservação obrigatória

Antes de alterar qualquer projeto existente, o Claude Code deve preservar tudo que estiver funcionando, salvo pedido explícito em contrário.

Itens que devem ser preservados:

- formulários;
- nomes de campos;
- integrações com WhatsApp;
- links de CTA;
- scripts de rastreamento;
- Google Tag Manager;
- Google Analytics;
- Meta Pixel;
- eventos de conversão;
- metatags;
- Open Graph;
- canonical;
- sitemap;
- robots.txt;
- `.htaccess`;
- rotas;
- URLs públicas;
- classes e IDs usados por JavaScript;
- CSS crítico;
- responsividade já aprovada;
- banco de dados;
- tabelas e colunas;
- arquivos enviados;
- uploads;
- permissões;
- autenticação;
- regras de negócio;
- conteúdo aprovado;
- identidade visual;
- logos;
- fontes;
- cores;
- componentes reutilizáveis;
- documentação;
- backups.

## 8.1. Regra de alteração mínima necessária

O Claude Code deve preferir a menor alteração segura que resolva o problema.

Não deve transformar uma correção simples em reestruturação ampla.

Exemplo correto:

> Corrigir o seletor do botão no JavaScript que não abre o menu mobile.

Exemplo incorreto:

> Recriar todo o cabeçalho, trocar CSS global, trocar HTML e reescrever todos os scripts para corrigir o menu mobile.

---

# 9. Regra contra reescrita destrutiva

O Claude Code não deve:

- apagar tudo e recriar sem análise;
- substituir arquivos inteiros sem necessidade;
- remover código funcional;
- remover scripts sem entender uso;
- alterar nomes de campos sem atualizar backend;
- alterar IDs sem verificar JavaScript;
- alterar rotas sem redirects;
- remover metatags importantes;
- remover pixel ou GTM;
- trocar arquitetura sem justificar;
- migrar dados sem plano;
- alterar banco sem backup;
- publicar diretamente em produção sem validação.

## 9.1. Quando uma reescrita total pode ser considerada

A reescrita total só deve ser considerada quando:

- o usuário pedir explicitamente;
- o projeto atual for inviável;
- houver problemas graves de segurança;
- a estrutura atual impedir manutenção;
- a dívida técnica for maior que o custo de reescrever;
- houver backup;
- houver plano de migração;
- houver critérios de aceite;
- houver homologação antes da produção.

Mesmo nesse caso, o Claude Code deve preservar:

- requisitos;
- SEO;
- URLs importantes;
- conteúdo aprovado;
- integrações;
- rastreamento;
- dados;
- arquivos;
- identidade visual;
- funcionalidades críticas.

---

# 10. Plano antes da execução

Para mudanças médias, altas ou críticas, o Claude Code deve apresentar um plano antes de alterar.

## Modelo recomendado

```md
## Plano de alteração

Tipo de mudança:
- Melhoria visual em projeto existente

Risco:
- Médio

Arquivos prováveis:
- index.html
- assets/css/style.css
- assets/js/main.js

Itens que devem ser preservados:
- Formulário de contato
- Link de WhatsApp
- Google Tag Manager
- Meta Pixel
- Estrutura SEO

Execução:
1. Ajustar apenas a seção solicitada.
2. Preservar IDs e classes usados por scripts.
3. Testar desktop e mobile.
4. Verificar console.
5. Registrar mudança no changelog.
```

## 10.1. Plano para mudança de alto risco

```md
## Plano de alteração de alto risco

Tipo de mudança:
- Alteração em banco de dados e painel administrativo

Risco:
- Alto

Antes de executar:
1. Fazer backup do banco.
2. Fazer backup dos arquivos atuais.
3. Aplicar alteração primeiro em homologação.
4. Testar login, permissões, listagem, criação, edição e exclusão.
5. Validar que dados existentes não foram perdidos.
6. Preparar rollback.

Arquivos/tabelas afetados:
- admin/*
- api/*
- tabela usuarios
- tabela registros
```

---

# 11. Versionamento sem Git

Nem todo projeto terá Git. Em hospedagem compartilhada, muitas vezes o deploy é manual via File Manager.

Quando não houver Git, o Claude Code deve orientar um versionamento simples.

## 11.1. Versionamento por pastas

Exemplo:

```txt
/backups
  /2026-05-14-site-v1.0.0
  /2026-05-14-site-v1.1.0
```

## 11.2. Versionamento por ZIP

Exemplo:

```txt
backup-site-v1.0.0-2026-05-14.zip
backup-site-v1.1.0-2026-05-14.zip
```

Atenção:

- backups não devem ficar públicos;
- backups não devem ficar em `public_html` se puderem ser acessados;
- backups com banco, credenciais ou dados pessoais devem ser protegidos;
- arquivos `.zip` públicos podem expor todo o site.

## 11.3. Arquivo de changelog

Criar ou atualizar:

```txt
CHANGELOG.md
```

Modelo:

```md
# Changelog

## 1.1.0 — 2026-05-14

Tipo:
- Melhoria visual

Alterações:
- Ajustado layout mobile da página inicial.
- Melhorada hierarquia dos CTAs.
- Corrigido espaçamento da seção de serviços.

Preservado:
- Formulário de contato.
- Links de WhatsApp.
- Scripts de rastreamento.

Testes:
- Layout desktop.
- Layout mobile.
- Clique no CTA.
```

---

# 12. Versionamento com Git

Quando houver Git, o Claude Code deve usar uma estratégia organizada.

## 12.1. Antes de alterar

Verificar:

- branch atual;
- alterações pendentes;
- arquivos modificados;
- última versão estável;
- se há ambiente de homologação;
- se a alteração deve ir em branch separada.

## 12.2. Branches recomendadas

Exemplo simples:

```txt
main
develop
feature/nova-secao
fix/menu-mobile
hotfix/formulario-contato
```

## 12.3. Commits recomendados

Commits devem ser claros.

Exemplos:

```txt
fix: corrige abertura do menu mobile
feat: adiciona seção de depoimentos
style: ajusta espaçamento da hero
refactor: organiza scripts do formulário
docs: atualiza changelog da versão 1.1.0
```

## 12.4. Antes de merge

Verificar:

- testes básicos;
- conflitos;
- arquivos sensíveis;
- build;
- console;
- responsividade;
- formulários;
- tracking;
- SEO básico.

---

# 13. Numeração de versões

Quando fizer sentido, o Claude Code pode sugerir versionamento semântico.

Formato:

```txt
MAJOR.MINOR.PATCH
```

Exemplo:

```txt
1.0.0
1.1.0
1.1.1
2.0.0
```

## 13.1. PATCH

Correções pequenas.

Exemplos:

- corrigir link;
- corrigir texto;
- corrigir bug simples;
- ajustar CSS pontual.

Exemplo:

```txt
1.0.1
```

## 13.2. MINOR

Melhorias ou funcionalidades compatíveis.

Exemplos:

- nova seção;
- novo formulário;
- melhoria visual relevante;
- nova página;
- nova integração simples.

Exemplo:

```txt
1.1.0
```

## 13.3. MAJOR

Mudanças grandes ou incompatíveis.

Exemplos:

- nova arquitetura;
- troca de banco;
- mudança de login;
- redesign completo;
- migração de servidor;
- alteração profunda em rotas.

Exemplo:

```txt
2.0.0
```

---

# 14. Changelog obrigatório

Para mudanças médias, altas e críticas, o Claude Code deve gerar changelog.

## 14.1. Modelo completo

```md
# Changelog

## [1.1.0] — 2026-05-14

### Tipo de mudança
- Melhoria visual
- Ajuste funcional

### Risco
- Médio

### Arquivos alterados
- index.html
- assets/css/style.css
- assets/js/main.js

### Alterações realizadas
- Reorganizada a seção principal da página inicial.
- Ajustado layout mobile.
- Corrigido comportamento do botão de WhatsApp.

### Itens preservados
- Google Tag Manager.
- Meta Pixel.
- Metatags SEO.
- Estrutura do formulário.
- Links de WhatsApp.

### Testes realizados ou recomendados
- Abrir página no desktop.
- Abrir página no mobile.
- Testar CTA de WhatsApp.
- Verificar console do navegador.
- Conferir eventos de conversão.

### Rollback
- Restaurar arquivos da versão 1.0.0.
```

## 14.2. Modelo simples

```md
## Alterações desta versão

- Tipo: correção de bug
- Risco: baixo
- Arquivo alterado: assets/js/main.js
- Correção: menu mobile agora abre corretamente
- Teste: abrir e fechar menu no celular
```

---

# 15. Registro de decisões técnicas

Além do changelog, decisões importantes devem ser registradas.

Arquivo sugerido:

```txt
DECISIONS.md
```

Modelo:

```md
# Decisões Técnicas

## 2026-05-14 — Uso de PHP leve em vez de Node.js

Decisão:
O projeto usará PHP leve no backend.

Motivo:
A hospedagem prevista é compartilhada com publicação via public_html, sem garantia de suporte a Node.js em produção.

Impacto:
- Deploy mais simples.
- Menor complexidade operacional.
- Compatível com HostGator/cPanel.
- Menos flexibilidade para aplicações em tempo real.

Alternativas consideradas:
- Node.js
- Firebase
- Supabase
```

Essa prática ajuda o Claude Code a não desfazer decisões anteriores.

---

# 16. Análise de impacto

Antes de mudanças médias ou altas, o Claude Code deve fazer análise de impacto.

## 16.1. Perguntas obrigatórias

- Quais arquivos serão afetados?
- Quais páginas usam esses arquivos?
- Algum CSS é global?
- Algum JavaScript depende de IDs ou classes?
- Algum formulário depende de nomes de campos?
- Alguma API depende dessa estrutura?
- Algum script de rastreamento depende desse botão?
- Alguma URL pública será alterada?
- Algum dado será perdido?
- Alguma permissão será alterada?
- Algum usuário será impactado?
- Algum ambiente será afetado?
- Existe rollback?

## 16.2. Matriz de impacto

Modelo:

```md
| Item | Impacto | Risco | Mitigação |
|---|---|---|---|
| CSS global | Pode alterar várias páginas | Médio | Testar páginas principais |
| Formulário | Pode quebrar envio | Alto | Preservar nomes dos campos |
| GTM | Pode perder conversão | Médio | Não remover scripts |
| Banco | Pode perder dados | Alto | Fazer backup antes |
```

---

# 17. Controle de arquivos alterados

O Claude Code deve listar arquivos alterados sempre que a mudança for relevante.

Modelo:

```md
## Arquivos alterados

- `index.html`
  - Motivo: ajuste da seção hero.
  - Risco: médio.
  - Teste: validar layout e CTA.

- `assets/css/style.css`
  - Motivo: novos estilos responsivos.
  - Risco: médio.
  - Teste: verificar páginas que usam o mesmo CSS.

- `assets/js/main.js`
  - Motivo: ajuste no comportamento do menu.
  - Risco: médio.
  - Teste: abrir/fechar menu no mobile.
```

---

# 18. Backup antes de mudanças

Antes de mudanças altas ou críticas, backup é obrigatório.

## 18.1. Backup de arquivos

Incluir:

- arquivos alterados;
- assets;
- `.htaccess`;
- configurações;
- uploads, se houver risco;
- versão atual em produção.

## 18.2. Backup de banco

Obrigatório antes de:

- alterar tabelas;
- alterar colunas;
- rodar migrations;
- importar dados;
- excluir dados;
- migrar sistema;
- alterar permissões;
- alterar usuários;
- alterar estrutura de login.

## 18.3. Backup de configurações

Incluir:

- `.env`;
- configurações PHP;
- credenciais fora do público;
- regras de servidor;
- DNS;
- Cloudflare;
- configurações de e-mail;
- configurações de storage.

## 18.4. Regra importante

Backups não devem ficar em pasta pública acessível por URL.

Evitar:

```txt
/public_html/backup.zip
/public_html/site-antigo.zip
/public_html/database.sql
```

Se temporariamente estiverem ali, devem ser removidos imediatamente após o uso.

---

# 19. Rollback

Toda mudança relevante deve ter possibilidade de rollback.

## 19.1. Plano de rollback simples

```md
## Rollback

Se a alteração falhar:
1. Restaurar `index.html` da versão anterior.
2. Restaurar `assets/css/style.css`.
3. Limpar cache.
4. Testar página inicial.
5. Confirmar formulário e WhatsApp.
```

## 19.2. Rollback com banco

```md
## Rollback com banco

Se a alteração falhar:
1. Colocar site em manutenção, se necessário.
2. Restaurar backup do banco.
3. Restaurar arquivos da versão anterior.
4. Validar login.
5. Validar painel.
6. Validar registros existentes.
```

## 19.3. Quando rollback é difícil

Se rollback não for simples, o Claude Code deve avisar antes.

Exemplos:

- migração de banco;
- alteração em dados reais;
- troca de servidor;
- mudança de DNS;
- alteração em pagamentos;
- alteração em autenticação;
- exclusão em massa.

---

# 20. Controle de ambiente

Mudanças não devem ser aplicadas diretamente em produção quando houver risco médio ou alto.

## 20.1. Desenvolvimento

Usado para criar e alterar.

## 20.2. Homologação

Usado para validar antes da produção.

## 20.3. Produção

Usado por usuários reais.

Regra:

> Produção não é ambiente de teste.

Se não houver homologação, o Claude Code deve sugerir criar uma forma mínima de teste antes de publicar.

Exemplos:

- subpasta protegida;
- subdomínio de teste;
- cópia local;
- backup e teste controlado;
- página temporária não indexada.

---

# 21. Preservação de SEO durante mudanças

Antes de alterar páginas públicas, o Claude Code deve preservar:

- título;
- description;
- headings;
- canonical;
- Open Graph;
- structured data, se houver;
- URLs;
- slugs;
- redirecionamentos;
- sitemap;
- robots.txt;
- alt de imagens relevantes;
- conteúdo indexado importante;
- links internos.

## 21.1. Alteração de URL

Se uma URL mudar, deve haver redirect.

Exemplo:

```apache
Redirect 301 /pagina-antiga /pagina-nova
```

Não alterar URLs indexadas sem necessidade.

---

# 22. Preservação de rastreamento

Antes de alterar CTAs, formulários ou scripts, preservar:

- Google Tag Manager;
- Google Analytics;
- Meta Pixel;
- eventos;
- nomes de eventos;
- parâmetros;
- botões com IDs rastreados;
- páginas de obrigado;
- UTMs;
- links de campanhas;
- scripts no `<head>`;
- scripts antes de `</body>`.

## 22.1. Regra

Se alterar botão, formulário ou fluxo de conversão, verificar rastreamento.

Exemplo:

- botão de WhatsApp tinha evento `click_whatsapp`;
- novo botão precisa manter ou recriar esse evento;
- formulário tinha página de obrigado;
- nova versão precisa preservar a conversão.

---

# 23. Preservação de formulários

Formulários são pontos sensíveis.

Antes de alterar, verificar:

- `name` dos campos;
- `id` dos campos;
- `action`;
- `method`;
- validações;
- máscara de telefone;
- mensagens de erro;
- integração com backend;
- integração com WhatsApp;
- integração com e-mail;
- integração com planilha;
- proteção anti-spam;
- consentimento LGPD;
- redirecionamento após envio;
- eventos de rastreamento.

Não mudar nomes de campos sem atualizar todo o fluxo.

---

# 24. Preservação de design aprovado

Melhorar design não significa apagar identidade existente.

Antes de alterar visual, preservar:

- logo;
- proporção da logo;
- cores oficiais;
- fontes oficiais;
- estilo aprovado;
- hierarquia visual;
- conteúdo aprovado;
- padrões de cards;
- padrões de botões;
- padrões de espaçamento;
- responsividade;
- regras de marca;
- componentes reutilizáveis.

Se a mudança visual exigir refatoração ampla, aplicar por etapas.

---

# 25. Refatoração segura

Refatorar é permitido, mas precisa de disciplina.

## 25.1. Regras

- não misturar refatoração com nova funcionalidade sem necessidade;
- preservar comportamento;
- testar antes e depois;
- refatorar por partes;
- evitar renomear tudo ao mesmo tempo;
- preservar API pública;
- preservar contratos de dados;
- preservar IDs/classes usados por scripts;
- documentar mudanças relevantes.

## 25.2. Estratégia recomendada

1. Criar baseline do comportamento atual.
2. Refatorar pequena parte.
3. Testar.
4. Registrar.
5. Avançar para próxima parte.

---

# 26. Atualização de dependências

Atualizar dependências pode ser alto risco.

Antes de atualizar:

- verificar versão atual;
- ler breaking changes;
- verificar compatibilidade;
- testar build;
- testar funcionalidades;
- verificar segurança;
- atualizar uma por vez quando possível;
- registrar versões.

Não atualizar tudo sem necessidade.

---

# 27. Migração

Migrações exigem plano próprio.

Pode envolver:

- hospedagem;
- banco;
- domínio;
- DNS;
- arquivos;
- uploads;
- e-mails;
- SSL;
- rotas;
- URLs;
- SEO;
- dados.

## 27.1. Checklist de migração

- backup completo;
- inventário de arquivos;
- inventário de banco;
- ambiente de destino;
- requisitos do servidor;
- teste em homologação;
- plano de DNS;
- plano de rollback;
- validação pós-migração;
- monitoramento inicial.

---

# 28. Como responder quando o usuário pedir “melhore tudo”

Se o usuário pedir algo amplo, o Claude Code deve responder com plano por etapas.

Modelo:

```md
Para melhorar sem quebrar, vou dividir em etapas:

1. Auditoria do estado atual.
2. Identificação de arquivos e integrações críticas.
3. Melhorias visuais localizadas.
4. Ajustes de responsividade.
5. Testes de formulário, WhatsApp e tracking.
6. Changelog e checklist final.

Não vou apagar a estrutura atual nem refazer do zero sem necessidade, porque isso pode quebrar partes que já funcionam.
```

---

# 29. Como responder quando o usuário pedir “refaça do zero”

Modelo:

```md
Posso refazer do zero, mas antes preciso preservar o que é crítico:

- conteúdo aprovado;
- identidade visual;
- SEO;
- URLs importantes;
- formulários;
- rastreamento;
- integrações;
- banco de dados;
- arquivos enviados;
- regras de negócio.

O caminho seguro é:
1. fazer backup;
2. mapear funcionalidades atuais;
3. criar nova versão em homologação;
4. testar;
5. migrar para produção somente depois da validação.
```

---

# 30. Checklist antes de concluir uma mudança

Antes de considerar uma alteração pronta, verificar:

- a mudança solicitada foi feita;
- nenhuma funcionalidade existente foi removida;
- nenhum script crítico foi removido;
- formulários continuam funcionando;
- links continuam funcionando;
- CTAs continuam funcionando;
- layout mobile foi conferido;
- console não apresenta erro crítico;
- SEO básico foi preservado;
- rastreamento foi preservado;
- dados não foram expostos;
- arquivos privados não foram publicados;
- ambiente correto foi usado;
- changelog foi gerado, se necessário;
- rollback é possível.

---

# 31. Template de relatório de mudança

```md
# Relatório de Mudança

## Resumo

Mudança realizada:
[Descrever.]

Tipo:
[Bugfix / Melhoria visual / Nova funcionalidade / Refatoração / Deploy / Infraestrutura.]

Risco:
[Baixo / Médio / Alto / Crítico.]

## Arquivos alterados

- [arquivo 1]
- [arquivo 2]

## O que foi preservado

- [item 1]
- [item 2]

## Testes realizados

- [teste 1]
- [teste 2]

## Pendências

- [pendência 1]

## Rollback

Para voltar:
- [instrução 1]
- [instrução 2]
```

---

# 32. Saída esperada desta skill

Ao aplicar esta skill, o Claude Code deve entregar uma ou mais das seguintes saídas:

- análise do estado atual;
- classificação da mudança;
- classificação de risco;
- plano de alteração;
- lista de arquivos afetados;
- itens que devem ser preservados;
- plano de backup;
- plano de rollback;
- changelog;
- relatório de mudança;
- recomendações de teste;
- alerta sobre riscos;
- orientação de homologação;
- orientação de deploy seguro.

---

# 33. Erros que esta skill deve evitar

O Claude Code não deve:

- apagar projeto existente sem análise;
- substituir tudo para “melhorar”;
- remover funcionalidades sem autorização;
- ignorar rastreamento;
- ignorar SEO;
- ignorar formulários;
- ignorar banco de dados;
- ignorar arquivos privados;
- alterar produção sem backup;
- fazer refatoração ampla junto com correção simples;
- atualizar dependências sem necessidade;
- alterar URLs sem redirect;
- modificar login sem teste;
- mexer em banco sem backup;
- publicar arquivos sensíveis;
- esquecer changelog em mudanças relevantes;
- não prever rollback.

---

# 34. Frase-guia da skill

> Toda mudança precisa ser consciente: entenda o que existe, preserve o que funciona, altere por partes, teste antes de publicar, registre o que mudou e mantenha um caminho de volta.

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
