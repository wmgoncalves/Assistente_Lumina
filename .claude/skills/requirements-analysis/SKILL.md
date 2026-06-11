---
name: requirements-analysis
description: Analise estruturada de requisitos antes de codificar. Mapeia objetivo, publico, escopo (obrigatorio/desejavel/futuro), regras de negocio, dados, integracoes, restricoes tecnicas e criterios de aceite. Use ao iniciar projeto novo ou quando uma alteracao mudar escopo, dados, login, painel ou arquitetura.
---
# 01 — Requirements Analysis

## Nome da skill

`01-requirements-analysis`

## Categoria

Análise de requisitos, escopo, produto, arquitetura inicial, regras de negócio, dados, integrações, restrições técnicas e critérios de aceite.

## Objetivo principal

Esta skill orienta o Claude Code a analisar requisitos antes de criar, alterar, expandir ou corrigir qualquer site, sistema, plataforma, landing page, área logada, painel administrativo, produto digital ou aplicação web.

O objetivo é impedir que o desenvolvimento comece de forma impulsiva, incompleta ou sem clareza.

Antes de gerar código, modificar arquivos ou propor arquitetura, o Claude Code deve entender:

- qual é o objetivo do projeto;
- qual problema será resolvido;
- quem usará;
- quais funcionalidades são obrigatórias;
- quais funcionalidades são desejáveis;
- quais dados serão coletados, exibidos, processados ou armazenados;
- quais integrações serão necessárias;
- quais restrições técnicas existem;
- qual ambiente de hospedagem será usado;
- quais riscos de segurança, LGPD, performance e manutenção existem;
- como saber se a entrega está pronta;
- quais decisões ainda estão indefinidas.

Esta skill deve ser usada principalmente no início de projetos novos ou quando uma alteração em projeto existente muda escopo, fluxo, dados, arquitetura, banco, login, painel, hospedagem, integrações ou regras de negócio.

---

# 1. Regra principal desta skill

Antes de desenvolver, o Claude Code deve entender o que precisa ser entregue.

A regra principal é:

> Não comece pelo código. Comece pelo entendimento do problema, do usuário, dos dados, das restrições e do resultado esperado.

Um requisito mal entendido pode gerar:

- sistema incompleto;
- retrabalho;
- funcionalidade errada;
- hospedagem inadequada;
- banco de dados desnecessário;
- banco de dados insuficiente;
- exposição de dados;
- formulário quebrado;
- produto difícil de usar;
- custo maior do que o necessário;
- incompatibilidade com o servidor;
- entrega bonita, mas sem função real.

---

# 2. Relação com a skill 00

Esta skill deve seguir as regras da skill:

`00-technical-governance-overview`

Antes de aplicar esta análise, o Claude Code deve verificar:

- contexto anterior;
- memória técnica do projeto;
- documentação existente;
- arquivo `CLAUDE.md`;
- README;
- instruções do usuário;
- decisões já tomadas;
- padrões de arquitetura;
- limitações de hospedagem;
- padrões de design;
- regras de segurança;
- requisitos já definidos.

Se já houver requisitos documentados, esta skill deve complementar, revisar e organizar esses requisitos, não ignorá-los.

---

# 3. Quando esta skill deve ser usada

Use esta skill sempre que o pedido envolver:

- criar site;
- criar landing page;
- criar sistema;
- criar plataforma;
- criar painel administrativo;
- criar área logada;
- criar portal;
- criar produto digital;
- criar ferramenta interna;
- criar página de vendas;
- criar fluxo de formulário;
- criar integração;
- adicionar banco de dados;
- adicionar login;
- adicionar usuários;
- adicionar upload;
- adicionar pagamento;
- adicionar dashboard;
- adicionar relatórios;
- mudar hospedagem;
- alterar arquitetura;
- expandir projeto existente;
- organizar escopo;
- transformar ideia em sistema;
- transformar planilha em plataforma;
- transformar processo manual em sistema;
- criar MVP;
- definir requisitos antes de programar.

---

# 4. Quando esta skill é obrigatória

Esta skill é obrigatória quando o projeto ou alteração envolver qualquer item abaixo:

- login;
- painel administrativo;
- banco de dados;
- dados pessoais;
- dados sensíveis;
- upload de arquivos;
- área restrita;
- pagamento;
- emissão de certificado;
- cursos;
- testes;
- usuários com permissões;
- formulários com armazenamento;
- integração com API;
- integração com Google Sheets;
- integração com CRM;
- integração com WhatsApp;
- automações;
- hospedagem em produção;
- Cloud, VPS ou storage externo;
- migração de dados;
- LGPD;
- rastreamento de conversão;
- SEO estratégico;
- tráfego pago;
- produto que será vendido;
- sistema que será usado por clientes ou equipe.

---

# 5. Classificação inicial do projeto

Antes de aprofundar os requisitos, o Claude Code deve classificar o tipo de projeto.

Um projeto pode se encaixar em mais de uma categoria.

## 5.1. Site institucional

Objetivo comum:

- apresentar empresa;
- gerar autoridade;
- mostrar serviços;
- gerar contato via formulário, WhatsApp ou telefone;
- melhorar presença digital;
- apoiar tráfego orgânico e pago.

Requisitos comuns:

- página inicial;
- sobre;
- serviços;
- diferenciais;
- contato;
- política de privacidade;
- SEO básico;
- CTAs;
- responsividade;
- integração com WhatsApp;
- Google Analytics;
- Meta Pixel ou GTM, quando aplicável.

## 5.2. Landing page

Objetivo comum:

- conversão;
- venda;
- captação de lead;
- solicitação de orçamento;
- inscrição;
- download;
- WhatsApp;
- pagamento.

Requisitos comuns:

- headline forte;
- promessa clara;
- CTA principal;
- prova social;
- benefícios;
- objeções;
- formulário;
- rastreamento de conversão;
- mobile excelente;
- carregamento rápido.

## 5.3. Página de vendas

Objetivo comum:

- vender produto, curso, serviço, documento digital ou mentoria.

Requisitos comuns:

- oferta;
- público-alvo;
- problema;
- solução;
- benefícios;
- o que está incluso;
- bônus;
- garantia, quando houver;
- preço;
- FAQ;
- CTA;
- checkout ou WhatsApp;
- pixel e eventos de conversão;
- política de privacidade;
- termos de uso, quando necessário.

## 5.4. Plataforma de cursos

Objetivo comum:

- entregar aulas, materiais, avaliações e certificados.

Requisitos comuns:

- login;
- cadastro;
- painel do aluno;
- painel admin;
- cursos;
- módulos;
- aulas;
- materiais;
- progresso;
- certificado;
- pagamento ou liberação manual;
- controle de acesso;
- hospedagem de vídeos;
- storage;
- banco de dados;
- suporte;
- LGPD.

## 5.5. Sistema interno

Objetivo comum:

- organizar processos internos;
- substituir planilhas;
- centralizar dados;
- automatizar rotina;
- gerar relatórios.

Requisitos comuns:

- login;
- permissões;
- CRUD;
- filtros;
- relatórios;
- histórico;
- exportação;
- backup;
- banco de dados;
- controle de acesso;
- segurança.

## 5.6. Painel administrativo

Objetivo comum:

- gerenciar conteúdo, usuários, produtos, arquivos, leads, cursos, testes ou operações.

Requisitos comuns:

- autenticação;
- permissões;
- listagem;
- cadastro;
- edição;
- exclusão;
- status;
- filtros;
- logs;
- upload;
- validação;
- proteção contra acesso indevido.

## 5.7. Produto digital

Objetivo comum:

- vender e entregar arquivos, templates, documentos, planilhas, e-books ou materiais.

Requisitos comuns:

- página de vendas;
- checkout ou contato;
- entrega digital;
- proteção mínima de arquivos;
- suporte;
- termos;
- política de privacidade;
- controle de acesso, se a entrega for restrita.

## 5.8. Portal de documentos

Objetivo comum:

- disponibilizar documentos, PDFs, laudos, contratos, materiais ou arquivos para usuários específicos.

Requisitos comuns:

- login;
- controle de acesso;
- organização por categorias;
- upload;
- download;
- visualização;
- permissões;
- armazenamento seguro;
- logs, quando necessário.

## 5.9. Integração com planilhas

Objetivo comum:

- usar planilha como base simples de dados ou administração.

Requisitos comuns:

- definição de campos;
- regras de leitura;
- regras de edição;
- proteção contra exposição;
- validação;
- atualização;
- fallback;
- controle de permissões;
- alternativa futura para banco.

---

# 6. Perguntas essenciais de requisitos

O Claude Code deve responder ou levantar estas perguntas antes de desenvolver.

Nem sempre precisa perguntar tudo ao usuário. Se a resposta estiver clara no contexto, documentação ou memória, deve usar essa informação.

## 6.1. Sobre o objetivo

- Qual é o objetivo principal do projeto?
- Qual problema ele resolve?
- Qual resultado esperado?
- O projeto é para vender, informar, capturar leads, operar, ensinar, organizar ou entregar conteúdo?
- Qual ação principal o usuário final deve realizar?
- O sucesso será medido por quê?

Exemplos de métrica de sucesso:

- cliques no WhatsApp;
- envio de formulário;
- compra;
- cadastro;
- acesso ao painel;
- download;
- visualização de aula;
- preenchimento de teste;
- redução de trabalho manual;
- organização de dados.

## 6.2. Sobre o público

- Quem vai usar?
- O usuário é público externo, cliente, aluno, colaborador, administrador ou equipe interna?
- O público tem familiaridade com tecnologia?
- A maioria acessa pelo celular ou desktop?
- Existe público idoso, motorista, paciente, aluno, empresa, consumidor final?
- O layout precisa ser muito simples e direto?
- O projeto precisa de acessibilidade reforçada?

## 6.3. Sobre o escopo

- Quais páginas, telas ou módulos são necessários?
- O que é obrigatório?
- O que é opcional?
- O que fica para uma versão futura?
- Existe prazo?
- Existe orçamento ou limitação de custo?
- Existe tecnologia obrigatória?
- Existe hospedagem já contratada?
- O projeto precisa ser simples ou escalável?

## 6.4. Sobre conteúdo

- Os textos já existem?
- As imagens já existem?
- A identidade visual está definida?
- Existe logo?
- Existem cores e fontes oficiais?
- Existem arquivos de marca?
- Existe tom de comunicação definido?
- O projeto precisa preservar conteúdo de uma versão antiga?
- Existem páginas que não podem mudar?

## 6.5. Sobre funcionalidades

- Precisa de formulário?
- Precisa de WhatsApp?
- Precisa de envio de e-mail?
- Precisa salvar dados?
- Precisa de login?
- Precisa de painel admin?
- Precisa de upload?
- Precisa de download?
- Precisa de busca?
- Precisa de filtro?
- Precisa de relatório?
- Precisa de pagamento?
- Precisa de emissão de certificado?
- Precisa de integração externa?
- Precisa de área do usuário?
- Precisa de permissões diferentes?

## 6.6. Sobre dados

- Quais dados serão coletados?
- Quais dados serão exibidos?
- Quais dados serão armazenados?
- Os dados são pessoais?
- Os dados são sensíveis?
- Os dados incluem saúde, finanças, documentos, CPF, telefone, endereço ou dados profissionais?
- Onde serão armazenados?
- Quem poderá acessar?
- Por quanto tempo serão mantidos?
- Como serão excluídos se necessário?
- Existe backup?
- Existe consentimento?
- Existe política de privacidade?

## 6.7. Sobre integração

- O projeto precisa integrar com Google Sheets?
- Precisa de API externa?
- Precisa de CRM?
- Precisa de WhatsApp?
- Precisa de pagamento?
- Precisa de e-mail transacional?
- Precisa de Google Analytics?
- Precisa de Google Tag Manager?
- Precisa de Meta Pixel?
- Precisa de webhook?
- Precisa de automação?
- Precisa de Cloudflare?
- Precisa de mapas?
- Precisa de plataforma de vídeo?
- Precisa de armazenamento externo?

## 6.8. Sobre hospedagem

- Onde o projeto será hospedado?
- É HostGator, cPanel, VPS, Cloud, Vercel, Netlify, Firebase, Supabase, WordPress, outra plataforma?
- O servidor aceita PHP?
- O servidor aceita MySQL?
- O servidor aceita Node.js em produção?
- Há acesso a terminal?
- O deploy será via File Manager?
- Existe `public_html`?
- Há limite de upload?
- Há SSL?
- Há e-mail no domínio?
- Há backup automático?
- Há cron job?
- Há limite de CPU, memória ou banco?

## 6.9. Sobre segurança e LGPD

- O projeto coleta dados pessoais?
- O projeto coleta dados sensíveis?
- Precisa de login?
- Precisa de controle de permissão?
- Precisa de proteção contra spam?
- Precisa de proteção de upload?
- Precisa de consentimento?
- Precisa de política de privacidade?
- Precisa de termos de uso?
- Precisa de banner de cookies?
- Há risco de expor dados em planilha pública?
- Há credenciais no código?
- Há arquivos privados na pasta pública?

## 6.10. Sobre entrega

- Como saberemos que está pronto?
- Quem aprova?
- Onde será testado?
- O que precisa funcionar obrigatoriamente?
- Qual checklist final será usado?
- Existe ambiente de homologação?
- Existe plano de rollback?
- Existe documentação mínima?
- Existe treinamento ou orientação para uso?

---

# 7. Separação entre requisitos obrigatórios, desejáveis e futuros

O Claude Code deve organizar requisitos em três grupos.

## 7.1. Obrigatórios

Sem estes itens, o projeto não cumpre o objetivo.

Exemplos:

- formulário funcionando;
- CTA de WhatsApp;
- login seguro;
- painel admin;
- banco de dados;
- página de política;
- checkout;
- integração com planilha;
- responsividade mobile.

## 7.2. Desejáveis

Melhoram o projeto, mas não impedem a primeira entrega.

Exemplos:

- animações avançadas;
- dashboard com gráficos;
- filtros sofisticados;
- busca avançada;
- automações extras;
- integração com CRM;
- área de relatórios.

## 7.3. Futuro

Itens que devem ser planejados, mas não entram na versão inicial.

Exemplos:

- app mobile;
- multiusuário avançado;
- assinatura recorrente;
- API pública;
- escalabilidade Cloud;
- notificações;
- integrações complexas.

Essa separação evita escopo infinito.

---

# 8. Requisitos funcionais

Requisitos funcionais descrevem o que o sistema deve fazer.

O Claude Code deve documentar cada requisito funcional de forma clara.

## Modelo recomendado

```md
## RF-001 — Envio de formulário para WhatsApp

Descrição:
O usuário deve preencher nome, telefone e mensagem. Ao clicar no botão, o sistema deve abrir o WhatsApp com uma mensagem preenchida.

Campos:
- Nome
- Telefone
- Mensagem

Regras:
- Nome obrigatório
- Telefone obrigatório
- Mensagem opcional
- Abrir em nova aba
- Não salvar dados no servidor nesta versão

Critério de aceite:
- Ao preencher os campos e clicar no botão, o WhatsApp abre com a mensagem formatada corretamente.
```

## Exemplos de requisitos funcionais

- RF-001: Exibir página inicial;
- RF-002: Enviar formulário;
- RF-003: Abrir WhatsApp com mensagem preenchida;
- RF-004: Permitir login;
- RF-005: Permitir cadastro;
- RF-006: Cadastrar curso;
- RF-007: Upload de PDF;
- RF-008: Listar documentos;
- RF-009: Filtrar ofertas;
- RF-010: Registrar resposta de teste;
- RF-011: Gerar relatório;
- RF-012: Exportar CSV;
- RF-013: Gerar certificado;
- RF-014: Enviar e-mail de confirmação;
- RF-015: Exibir dashboard.

---

# 9. Requisitos não funcionais

Requisitos não funcionais descrevem qualidade, segurança, performance, compatibilidade e operação.

## Categorias principais

### 9.1. Performance

- carregar rapidamente;
- otimizar imagens;
- evitar scripts desnecessários;
- reduzir CSS e JS quando possível;
- priorizar mobile;
- evitar dependências pesadas.

### 9.2. Segurança

- proteger formulários;
- validar entradas;
- evitar exposição de credenciais;
- proteger uploads;
- proteger painel admin;
- usar HTTPS;
- evitar erros detalhados em produção;
- seguir skills de segurança existentes.

### 9.3. Compatibilidade

- funcionar em mobile;
- funcionar em desktop;
- funcionar nos principais navegadores;
- ser compatível com hospedagem definida;
- não depender de tecnologias indisponíveis no servidor.

### 9.4. Manutenção

- código organizado;
- nomes claros;
- estrutura simples;
- comentários úteis;
- documentação mínima;
- padrão de pastas;
- changelog quando necessário.

### 9.5. SEO

- title;
- description;
- headings;
- URLs amigáveis;
- alt em imagens relevantes;
- Open Graph;
- sitemap quando necessário;
- robots.txt.

### 9.6. LGPD

- política de privacidade;
- consentimento;
- minimização de dados;
- finalidade clara;
- acesso restrito;
- retenção;
- exclusão quando aplicável.

### 9.7. Operação

- backup;
- rollback;
- ambiente de homologação;
- deploy seguro;
- monitoramento básico;
- suporte para correções.

---

# 10. Regras de negócio

Regras de negócio explicam como o projeto deve se comportar de acordo com a operação real.

O Claude Code deve identificar regras como:

- quem pode acessar;
- quem pode editar;
- quem pode aprovar;
- quais status existem;
- quando algo aparece ou desaparece;
- quais campos são obrigatórios;
- como valores são calculados;
- como datas são geradas;
- como permissões funcionam;
- como dados são filtrados;
- como notificações são enviadas.

## Modelo recomendado

```md
## RN-001 — Exibição de item ativo

Descrição:
Somente itens com status "ativo" devem aparecer no site público.

Aplicação:
- Lista pública de ofertas
- Cards de produtos
- Páginas de serviços

Critério de aceite:
- Itens inativos não aparecem para visitantes, mas continuam visíveis no painel administrativo.
```

## Exemplos de regras de negócio

- somente ofertas ativas aparecem no site;
- usuário comum não acessa painel admin;
- documentos privados exigem login;
- resposta de teste não pode ser editada após envio;
- valor mensal é calculado automaticamente;
- conteúdo comprado só aparece após liberação;
- leads devem ser enviados para WhatsApp;
- dados sensíveis não podem aparecer em planilha pública;
- ambiente de homologação não deve disparar conversão real.

---

# 11. Mapeamento de usuários e permissões

Sempre que houver login ou painel, o Claude Code deve mapear usuários.

## Perfis comuns

- visitante;
- lead;
- cliente;
- aluno;
- colaborador;
- editor;
- administrador;
- superadministrador;
- suporte;
- gestor;
- motorista;
- paciente;
- profissional.

## Matriz de permissões

Modelo recomendado:

```md
| Ação | Visitante | Usuário | Editor | Admin |
|---|---:|---:|---:|---:|
| Ver página pública | Sim | Sim | Sim | Sim |
| Enviar formulário | Sim | Sim | Sim | Sim |
| Acessar painel | Não | Não | Sim | Sim |
| Criar conteúdo | Não | Não | Sim | Sim |
| Excluir conteúdo | Não | Não | Não | Sim |
| Gerenciar usuários | Não | Não | Não | Sim |
```

Se permissões não forem definidas, o Claude Code deve considerar isso como pendência crítica antes de desenvolver área logada.

---

# 12. Mapeamento de dados

Sempre que o projeto coletar, salvar ou exibir dados, o Claude Code deve criar um mapa de dados.

## Modelo recomendado

```md
## Mapa de dados

| Campo | Tipo | Obrigatório | Origem | Armazenamento | Acesso | Sensibilidade |
|---|---|---:|---|---|---|---|
| Nome | Texto | Sim | Formulário | MySQL | Admin | Pessoal |
| Telefone | Texto | Sim | Formulário | MySQL | Admin | Pessoal |
| Mensagem | Texto | Não | Formulário | MySQL | Admin | Pessoal |
```

## Classificação de sensibilidade

- Público;
- Interno;
- Pessoal;
- Sensível;
- Financeiro;
- Operacional;
- Crítico.

## Regra importante

Se houver dados pessoais ou sensíveis, o Claude Code deve acionar mentalmente regras de segurança, LGPD e armazenamento seguro.

---

# 13. Decisão inicial de armazenamento

A análise de requisitos deve apontar uma opção inicial de armazenamento.

## 13.1. Sem armazenamento

Quando o formulário apenas abre WhatsApp ou e-mail sem salvar nada.

Indicado para:

- landing pages simples;
- sites institucionais;
- páginas de contato;
- captação direta via WhatsApp.

## 13.2. Arquivo estático

Indicado para:

- conteúdo público;
- listas pequenas;
- dados que mudam pouco.

Não indicado para dados pessoais ou sensíveis.

## 13.3. CSV ou JSON

Indicado para:

- dados públicos simples;
- catálogos pequenos;
- configurações;
- protótipos.

Não indicado para:

- dados sensíveis;
- usuários;
- permissões;
- registros críticos.

## 13.4. Google Sheets

Indicado para:

- dados simples administrados por equipe;
- listas públicas ou semissensíveis;
- ofertas;
- controle básico;
- atualização sem painel.

Cuidados:

- não expor dados sensíveis;
- controlar permissões;
- não usar como banco seguro;
- validar dados;
- usar somente leitura quando possível.

## 13.5. MySQL

Indicado para:

- hospedagem compartilhada;
- sistemas PHP;
- cadastros;
- leads;
- painéis;
- produtos digitais;
- áreas logadas simples e médias.

## 13.6. PostgreSQL, Firebase, Supabase ou Cloud

Indicado quando houver:

- aplicação moderna;
- autenticação mais robusta;
- muitos usuários;
- tempo real;
- storage;
- escalabilidade;
- APIs;
- arquitetura mais avançada.

---

# 14. Integrações

O Claude Code deve mapear integrações antes de desenvolver.

## Modelo recomendado

```md
## Integrações previstas

| Integração | Finalidade | Obrigatória | Ambiente | Risco |
|---|---|---:|---|---|
| WhatsApp | Receber leads | Sim | Produção | Baixo |
| Google Sheets | Listar ofertas | Sim | Produção | Médio |
| Meta Pixel | Conversão | Sim | Produção | Médio |
| Google Analytics | Métricas | Sim | Produção | Baixo |
```

## Perguntas por integração

Para cada integração:

- qual finalidade?
- quem mantém?
- há chave ou token?
- onde a credencial será guardada?
- funciona em homologação?
- pode disparar ação real em teste?
- tem limite de uso?
- tem custo?
- tem risco de segurança?
- tem fallback se falhar?

---

# 15. Critérios de aceite

Cada requisito importante deve ter critério de aceite.

Critério de aceite responde:

> Como saber que está funcionando?

## Modelo simples

```md
## Critério de aceite

A funcionalidade será considerada pronta quando:
- o usuário conseguir preencher o formulário;
- os campos obrigatórios forem validados;
- o WhatsApp abrir com a mensagem correta;
- o fluxo funcionar no mobile e desktop;
- nenhum erro aparecer no console;
- o CTA principal puder ser rastreado.
```

## Exemplos

### Formulário

- valida campos obrigatórios;
- exibe mensagem de erro clara;
- envia ou abre WhatsApp corretamente;
- não perde dados preenchidos sem necessidade;
- funciona no mobile.

### Login

- usuário correto acessa;
- senha errada não acessa;
- sessão é encerrada no logout;
- painel não abre sem login;
- permissões são respeitadas.

### Upload

- aceita apenas formatos permitidos;
- bloqueia arquivos inválidos;
- salva em local correto;
- não permite execução de scripts;
- exibe arquivo corretamente.

### Página de vendas

- CTA principal funciona;
- oferta está clara;
- checkout ou WhatsApp funciona;
- pixel dispara corretamente;
- layout está bom no celular.

---

# 16. Níveis de detalhe conforme complexidade

Nem todo projeto exige documentação enorme.

O Claude Code deve ajustar a profundidade da análise.

## 16.1. Projeto simples

Exemplo:

- landing page sem banco;
- site institucional pequeno;
- cardápio simples;
- página de contato.

Análise mínima:

- objetivo;
- público;
- páginas;
- CTA;
- conteúdo;
- hospedagem;
- tracking;
- política;
- critério de aceite.

## 16.2. Projeto médio

Exemplo:

- site com blog;
- integração com planilha;
- painel simples;
- formulário com salvamento;
- página de vendas com tracking.

Análise intermediária:

- requisitos funcionais;
- requisitos não funcionais;
- dados;
- integrações;
- armazenamento;
- ambiente;
- riscos;
- testes;
- deploy.

## 16.3. Projeto complexo

Exemplo:

- plataforma com login;
- sistema interno;
- produto digital com área restrita;
- curso com alunos;
- upload de arquivos;
- pagamento;
- múltiplos perfis.

Análise completa:

- escopo;
- usuários;
- permissões;
- regras de negócio;
- mapa de dados;
- arquitetura;
- banco;
- integrações;
- segurança;
- LGPD;
- hospedagem;
- homologação;
- deploy;
- rollback;
- critérios de aceite;
- backlog futuro.

---

# 17. Template padrão de análise de requisitos

Quando o Claude Code precisar documentar requisitos, pode usar este template.

```md
# Análise de Requisitos — [Nome do Projeto]

## 1. Resumo do projeto

Descrição:
[Explique o projeto em poucas linhas.]

Objetivo principal:
[Explique o resultado esperado.]

Tipo de projeto:
[Site institucional / Landing page / Plataforma / Sistema / Painel / Produto digital / Outro.]

## 2. Público e usuários

Público principal:
[Quem usa.]

Perfis de usuário:
- Visitante:
- Usuário logado:
- Administrador:

## 3. Escopo

### Obrigatório
- [Item 1]
- [Item 2]

### Desejável
- [Item 1]
- [Item 2]

### Futuro
- [Item 1]
- [Item 2]

## 4. Páginas, telas ou módulos

- Página inicial:
- Página de contato:
- Painel:
- Login:
- Outro:

## 5. Requisitos funcionais

### RF-001 — [Nome]
Descrição:
Critério de aceite:

### RF-002 — [Nome]
Descrição:
Critério de aceite:

## 6. Requisitos não funcionais

### Segurança
- [Item]

### Performance
- [Item]

### SEO
- [Item]

### LGPD
- [Item]

### Compatibilidade
- [Item]

## 7. Regras de negócio

### RN-001 — [Nome]
Descrição:
Critério de aceite:

## 8. Dados

| Campo | Tipo | Obrigatório | Origem | Armazenamento | Acesso | Sensibilidade |
|---|---|---:|---|---|---|---|

## 9. Integrações

| Integração | Finalidade | Obrigatória | Risco | Observação |
|---|---|---:|---|---|

## 10. Hospedagem e restrições técnicas

Hospedagem prevista:
Tecnologias permitidas:
Tecnologias não recomendadas:
Banco de dados:
Storage:
Deploy:

## 11. Riscos identificados

| Risco | Impacto | Mitigação |
|---|---|---|

## 12. Pendências

- [Item pendente]

## 13. Critérios gerais de aceite

A entrega será considerada pronta quando:
- [Critério 1]
- [Critério 2]
- [Critério 3]
```

---

# 18. Como agir quando faltarem informações

Se faltarem informações, o Claude Code não deve inventar requisitos críticos.

Deve separar:

## Informações confirmadas

O que já está claro.

## Inferências seguras

O que pode ser assumido com baixo risco.

## Pendências

O que precisa de confirmação.

## Decisão recomendada

O caminho mais seguro considerando o contexto.

Modelo:

```md
## Informações confirmadas
- O projeto será uma landing page.
- O CTA principal será WhatsApp.
- A hospedagem provável é compartilhada.

## Pendências
- Número final de seções.
- Textos definitivos.
- Pixel de rastreamento.
- Política de privacidade.

## Decisão recomendada
Criar uma primeira versão estática, compatível com hospedagem compartilhada, sem banco de dados, com estrutura preparada para incluir rastreamento e política depois.
```

---

# 19. Regra de perguntas ao usuário

O Claude Code deve evitar perguntas excessivas quando puder fazer uma proposta segura.

Mas deve perguntar quando a decisão afetar:

- segurança;
- dados pessoais;
- custo;
- hospedagem;
- banco de dados;
- publicação em produção;
- exclusão de dados;
- alteração destrutiva;
- pagamento;
- login;
- permissões;
- arquitetura difícil de mudar depois.

## Regra prática

Se a decisão for reversível e de baixo risco, propor e seguir.

Se a decisão for difícil de reverter ou de alto risco, pedir confirmação.

---

# 20. Exemplo de resposta ideal antes de desenvolver

```md
## Análise inicial de requisitos

Pelo pedido, o projeto parece ser uma plataforma com área logada e painel administrativo.

Antes de desenvolver, os pontos críticos são:

1. Usuários e permissões
- Aluno
- Administrador

2. Dados
- Nome
- E-mail
- Progresso
- Materiais acessados

3. Funcionalidades obrigatórias
- Login
- Listagem de cursos
- Área do aluno
- Painel admin

4. Decisão técnica recomendada
- Usar PHP + MySQL se a hospedagem for compartilhada.
- Evitar Node.js em produção se o servidor não suportar.
- Criar primeiro um MVP com login, painel simples e cadastro manual.

5. Riscos
- Controle de acesso aos materiais.
- Proteção de dados pessoais.
- Backup do banco.
- Separação entre homologação e produção.
```

---

# 21. Erros que esta skill deve evitar

O Claude Code não deve:

- criar código sem entender o objetivo;
- assumir que todo projeto precisa de banco;
- assumir que todo projeto precisa de Cloud;
- usar Google Sheets para dados sensíveis sem alerta;
- criar login sem mapear permissões;
- criar upload sem regras de segurança;
- criar pagamento sem requisitos claros;
- publicar sem critério de aceite;
- ignorar hospedagem real;
- ignorar LGPD;
- ignorar mobile;
- ignorar rastreamento;
- misturar funcionalidades obrigatórias e opcionais;
- transformar uma landing page simples em sistema complexo;
- transformar um sistema complexo em página improvisada;
- ignorar o que já está na memória ou documentação.

---

# 22. Saída esperada desta skill

Ao final da análise de requisitos, o Claude Code deve produzir pelo menos:

- resumo do projeto;
- tipo de projeto;
- objetivo principal;
- público;
- escopo obrigatório;
- escopo desejável;
- pendências;
- dados envolvidos;
- integrações;
- restrições técnicas;
- riscos;
- critérios de aceite;
- recomendação de próxima etapa.

Em projetos complexos, também deve produzir:

- requisitos funcionais;
- requisitos não funcionais;
- regras de negócio;
- mapa de dados;
- matriz de permissões;
- decisão de armazenamento;
- recomendação de hospedagem;
- plano de MVP;
- backlog futuro.

---

# 23. Frase-guia da skill

> Um projeto bem construído começa antes do código: começa com objetivo claro, requisitos bem separados, dados mapeados, riscos conhecidos, hospedagem compatível e critérios de aceite definidos.

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
