---
name: ui-visual-hierarchy
description: Hierarquia visual de paginas, secoes e componentes. Define ponto focal primario, ordem de leitura, peso visual de titulos/CTAs/formularios. Use ao criar ou revisar landing page, pagina de servico, dashboard, painel admin, formulario ou qualquer interface onde a atencao do usuario precisa ser guiada.
---

# ui-visual-hierarchy


## Nome da skill

`ui-visual-hierarchy`

## Objetivo

Garantir que toda interface, página, landing page, sistema, formulário, seção ou componente criado pelo Claude Code tenha uma hierarquia visual clara, profissional, responsiva e orientada à conversão, sem prejudicar segurança, acessibilidade, performance ou manutenibilidade.

Esta skill deve ajudar o Claude Code a decidir o que deve chamar mais atenção, o que deve apoiar a mensagem principal e o que deve permanecer visualmente secundário.

A interface precisa guiar o olhar do usuário de forma natural, reduzindo confusão cognitiva e aumentando a clareza da ação esperada.

## Prioridade absoluta

Segurança sempre vem antes de design.

Esta skill é complementar às skills de segurança existentes. Ela nunca deve sobrescrever, remover, enfraquecer ou contradizer regras relacionadas a:

- validação de inputs;
- sanitização de dados;
- proteção contra XSS;
- proteção contra CSRF;
- proteção contra SQL Injection;
- proteção contra path traversal;
- controle de dependências;
- proteção contra supply chain attack;
- proteção contra typosquatting;
- proteção de secrets, tokens e chaves;
- LGPD, cookies, privacidade e consentimento;
- segurança em formulários;
- segurança em APIs;
- segurança em deploy;
- permissões de arquivos;
- autenticação e autorização;
- logs e tratamento de erros;
- qualquer regra já presente no `CLAUDE.md` ou em outras skills de segurança.

Se houver conflito entre uma decisão estética e uma regra de segurança, a decisão estética deve ser rejeitada.

## Ordem de prioridade nas decisões

Ao aplicar esta skill, respeitar a seguinte ordem:

1. Segurança
2. Privacidade / LGPD
3. Acessibilidade
4. Performance
5. Manutenibilidade
6. Clareza de UX
7. Conversão
8. Estética visual

Design excelente não pode depender de gambiarra, código inseguro, dependência suspeita ou remoção de validações existentes.

## Quando usar esta skill

Usar esta skill sempre que o Claude Code for:

- criar uma nova interface;
- criar uma landing page;
- criar uma página institucional;
- criar uma página de venda;
- criar uma página de captura;
- criar um formulário;
- criar uma hero section;
- criar cards de benefícios;
- criar seções de prova social;
- criar páginas administrativas;
- criar dashboards;
- criar telas de login;
- criar telas de cadastro;
- revisar layout existente;
- melhorar design de uma página já criada;
- organizar CTAs;
- melhorar leitura em mobile;
- refinar espaçamentos, fontes, pesos e contraste;
- transformar um layout básico em uma interface premium.

## Quando não usar esta skill

Não usar esta skill para justificar:

- remover validações;
- esconder mensagens de erro;
- ocultar campos obrigatórios;
- reduzir contraste abaixo do aceitável;
- deixar botão bonito, mas inacessível;
- instalar biblioteca visual desnecessária;
- adicionar CDN externa apenas por estética;
- sobrescrever layout funcional sem análise;
- apagar uma página inteira e refazer do zero sem necessidade;
- trocar componentes seguros por componentes visualmente melhores, porém frágeis;
- enfraquecer privacidade, LGPD ou segurança.

## Princípio central

Toda tela deve ter uma ordem clara de importância.

O usuário precisa entender rapidamente:

1. onde está;
2. o que a página oferece;
3. por que isso importa;
4. qual é a próxima ação recomendada;
5. quais informações são secundárias.

Se tudo chama atenção ao mesmo tempo, nada chama atenção de verdade.

## Conceito de ponto focal primário

Cada seção importante deve ter um ponto focal primário.

O ponto focal primário normalmente será:

- o título da promessa;
- a principal mensagem de valor;
- uma informação crítica;
- uma chamada principal;
- uma métrica muito relevante;
- uma decisão que o usuário precisa tomar.

Em uma landing page, o ponto focal primário geralmente deve ser a promessa principal do hero.

Exemplo:

```text
Controle financeiro para fisioterapeutas sem complicação
```

Esse título deve ser mais forte que o subtítulo, mais forte que a prova social e mais forte que textos auxiliares.

## Conceito de ponto focal secundário

O ponto focal secundário é o elemento que conduz o usuário para a ação.

Pode ser:

- botão principal;
- formulário;
- card de orçamento;
- bloco de contato;
- chamada para WhatsApp;
- botão de compra;
- botão de download;
- campo de cadastro.

Em uma landing page, o formulário ou CTA principal geralmente deve ser o ponto focal secundário, vindo depois da promessa principal.

## Regra de um CTA principal

Cada seção deve ter apenas uma ação principal clara.

Pode haver ações secundárias, mas elas não devem competir visualmente com o CTA principal.

### Correto

- Botão principal forte: `Solicitar orçamento`
- Botão secundário discreto: `Ver serviços`

### Incorreto

- Dois botões com mesma cor, mesmo peso e mesma hierarquia;
- três CTAs diferentes disputando atenção;
- botão de WhatsApp, botão de formulário e botão de download todos com aparência principal;
- links, selos, cards e botões competindo com o título.

## Regras para títulos

O título principal deve:

- ser direto;
- ser visualmente dominante;
- comunicar a promessa principal;
- usar tamanho maior que o restante;
- ter peso tipográfico adequado;
- ter contraste suficiente;
- evitar quebras ruins em mobile;
- evitar excesso de palavras;
- não competir com outros elementos decorativos.

O título não deve:

- ser pequeno demais;
- ter baixo contraste;
- ficar escondido por imagem, textura ou animação;
- competir com vários selos e botões;
- ser quebrado de forma confusa no celular;
- depender apenas de cor para transmitir importância.

## Regras para subtítulos

O subtítulo deve:

- explicar a promessa;
- reduzir dúvidas;
- apoiar o título;
- ter menor peso visual que o título;
- ser fácil de ler;
- ter largura controlada;
- evitar parágrafos longos;
- não introduzir uma promessa concorrente.

O subtítulo deve responder rapidamente:

- para quem é;
- qual problema resolve;
- qual benefício entrega;
- o que acontece depois da ação.

## Regras para prova social

Provas sociais devem apoiar a promessa principal, não competir com ela.

Exemplos de prova social:

- número de clientes atendidos;
- anos de experiência;
- certificações;
- avaliações;
- depoimentos;
- empresas atendidas;
- entregas realizadas;
- cursos vendidos;
- horas de conteúdo;
- downloads;
- cases.

A prova social deve ficar visualmente agrupada perto da promessa principal quando ela reforçar a decisão do usuário.

### Correto

Título principal → Subtítulo → Prova social agrupada → CTA

### Incorreto

Título em um lado, prova social espalhada em vários cantos, CTA competindo com números e selos.

## Regras para botões

O botão principal deve:

- ter alto contraste;
- parecer claramente clicável;
- ter texto de ação específico;
- estar no fluxo natural da leitura;
- ser grande o suficiente no mobile;
- ter hover;
- ter focus visível;
- ter estado active;
- ter estado disabled quando necessário;
- ter loading em ações assíncronas;
- não depender de scripts externos para parecer funcional.

Evitar textos genéricos como:

- `Enviar`
- `Clique aqui`
- `Saiba mais`, quando existir uma ação mais clara

Preferir textos específicos como:

- `Solicitar orçamento`
- `Falar pelo WhatsApp`
- `Quero acessar o material`
- `Agendar avaliação`
- `Ver planos`
- `Baixar modelo`
- `Começar agora`

## Regras para botões secundários

Botões secundários devem:

- ter peso visual menor;
- não competir com o CTA principal;
- manter affordance clara;
- parecer clicáveis;
- ter hover e focus;
- ser úteis, não decorativos.

Exemplos:

- botão principal preenchido;
- botão secundário outline;
- botão secundário ghost;
- link textual com sublinhado.

## Regras para cores

As cores devem orientar, não confundir.

Usar cor para:

- destacar CTA principal;
- indicar erro;
- indicar sucesso;
- indicar alerta;
- reforçar identidade visual;
- organizar blocos de informação.

Evitar:

- muitas cores fortes na mesma seção;
- usar vermelho decorativo quando vermelho também representa erro;
- usar verde decorativo quando verde representa sucesso;
- cores sem contraste;
- cor como único indicador de estado;
- gradientes excessivos;
- glow exagerado;
- efeitos visuais que prejudiquem leitura.

## Regras para tipografia

A tipografia deve criar ordem visual.

Definir uma escala clara para:

- título principal;
- títulos de seção;
- subtítulos;
- texto comum;
- texto auxiliar;
- labels;
- mensagens de erro;
- botões;
- legendas;
- números e estatísticas.

Evitar:

- muitos tamanhos sem padrão;
- muitos pesos de fonte;
- fontes diferentes sem necessidade;
- texto pequeno demais no mobile;
- títulos com letter spacing exagerado;
- parágrafos muito largos;
- alinhamentos inconsistentes.

## Regras para espaçamento

O espaçamento deve separar grupos e conectar elementos relacionados.

Usar mais proximidade entre:

- título e subtítulo;
- label e input;
- campo e mensagem de erro;
- prova social e promessa principal;
- ícone e texto do mesmo item;
- botão e texto que explica a ação.

Usar mais distância entre:

- seções diferentes;
- grupos de informação diferentes;
- formulário e conteúdo institucional;
- CTA final e FAQ;
- blocos com objetivos diferentes.

Evitar:

- tudo muito grudado;
- tudo muito espalhado;
- cards sem respiro interno;
- espaçamento inconsistente;
- layout apertado no celular.

## Regras para imagens e elementos visuais

Imagens devem apoiar a hierarquia visual.

Elas não devem:

- competir com o título principal;
- reduzir contraste do texto;
- esconder o CTA;
- poluir o hero;
- quebrar o layout mobile;
- gerar peso excessivo na página;
- ser carregadas sem otimização;
- ter função puramente decorativa quando prejudicam performance.

Quando usar imagem:

- garantir responsividade;
- definir `alt` adequado quando a imagem tiver sentido informativo;
- usar `alt=""` quando for puramente decorativa;
- evitar imagens gigantes sem compressão;
- não carregar imagens externas suspeitas sem necessidade.

## Regras para formulários

Formulários devem ser visualmente claros e seguros.

A hierarquia correta deve deixar claro:

1. o objetivo do formulário;
2. quais campos precisam ser preenchidos;
3. quais campos são obrigatórios;
4. onde há erro;
5. o que acontece depois do envio;
6. qual botão envia;
7. qual estado está ativo: inicial, loading, sucesso ou erro.

O formulário deve:

- ter labels visíveis;
- ter agrupamento lógico;
- evitar campos desnecessários;
- mostrar erro perto do campo;
- ter botão principal claro;
- ter estado de loading;
- impedir clique duplo durante envio;
- respeitar LGPD quando coletar dados pessoais;
- manter validação segura no backend quando existir backend;
- não expor detalhes técnicos em mensagens de erro.

## Hierarquia visual em mobile

No mobile, a hierarquia deve ser ainda mais rigorosa.

A tela pequena não permite excesso de elementos competindo.

Regras:

- título curto e legível;
- subtítulo objetivo;
- CTA visível sem esforço;
- botões com boa área de toque;
- cards em coluna;
- imagens otimizadas;
- prova social compacta;
- formulário simples;
- evitar carrosséis obrigatórios para entender a oferta;
- evitar hero alto demais sem CTA visível;
- evitar textos com fonte pequena;
- evitar overflow horizontal.

## Regra de preservação de layouts existentes

Quando já existir uma interface, layout, página, componente, seção ou fluxo criado, o Claude Code não deve apagar tudo e refazer do zero automaticamente.

Antes de alterar algo existente, deve:

1. analisar a estrutura atual;
2. identificar o que já funciona;
3. identificar o que está prejudicando hierarquia visual;
4. apontar os problemas encontrados;
5. sugerir melhorias por partes;
6. aplicar mudanças incrementais e controladas;
7. preservar funcionalidades existentes;
8. preservar validações;
9. preservar integrações;
10. preservar responsividade funcional;
11. preservar acessibilidade já existente;
12. preservar regras de segurança.

Refatorações completas só devem acontecer quando forem realmente necessárias, com justificativa clara.

Nunca substituir uma página inteira por uma nova versão sem avaliar impacto técnico, visual e funcional.

O objetivo é evoluir o que já existe, não destruir e reconstruir sem necessidade.

## Processo recomendado para melhorar layout existente

Ao receber uma página ou componente já criado, seguir esta ordem:

1. revisar a hierarquia visual atual;
2. identificar pontos focais conflitantes;
3. revisar título, subtítulo e CTA;
4. revisar espaçamentos;
5. revisar contraste;
6. revisar organização dos grupos;
7. revisar botões e links;
8. revisar estados de componentes;
9. revisar responsividade;
10. revisar acessibilidade;
11. revisar segurança;
12. aplicar alterações pequenas;
13. testar se nada quebrou.

## Exemplos práticos

### Exemplo 1 — Hero de landing page

Estrutura recomendada:

```text
Logo / navegação discreta
Título forte com promessa principal
Subtítulo explicativo
Bloco pequeno de prova social
CTA principal
CTA secundário, se necessário
Imagem ou mockup apoiando a promessa
```

Evitar:

```text
Título grande
Dois CTAs iguais
Imagem muito chamativa
Cinco selos competindo
Formulário sem destaque
Texto longo demais
```

### Exemplo 2 — Página institucional

Estrutura recomendada:

```text
Título da página
Texto introdutório curto
Seções bem separadas
Diferenciais agrupados
Certificações agrupadas
História agrupada
CTA institucional no final
```

Evitar:

```text
Muitos blocos visuais sem ordem
Certificações misturadas com história
CTA repetido em todo lugar
Cards com pesos diferentes sem lógica
```

### Exemplo 3 — Formulário de orçamento

Estrutura recomendada:

```text
Título do formulário
Texto curto explicando o retorno
Campos com labels claras
Mensagens de erro próximas dos campos
Botão principal claro
Aviso de privacidade
Estado de loading
Estado de sucesso
Estado de erro
```

Evitar:

```text
Campos sem label
Botão pequeno
Erro só no topo
Nenhum loading
Nenhuma explicação de privacidade
CTA genérico
```

## Sinais de problema na hierarquia visual

Corrigir quando encontrar:

- muitos elementos com o mesmo peso visual;
- título sem destaque;
- CTA perdido;
- botões demais;
- cores demais;
- cards competindo entre si;
- imagem mais forte que a promessa;
- prova social longe da promessa;
- formulário visualmente confuso;
- erro escondido;
- texto pequeno demais;
- layout apertado;
- excesso de efeitos;
- navegação chamando mais atenção que a conversão;
- elementos decorativos competindo com elementos funcionais.

## Checklist obrigatório

Antes de finalizar uma interface, responder:

- Existe um único ponto focal primário por seção?
- O título principal está claramente mais forte que o restante?
- O subtítulo apoia a promessa sem competir com ela?
- O CTA principal está evidente?
- Botões secundários têm menor peso visual?
- A prova social está próxima da promessa quando fizer sentido?
- O formulário está claro como ponto focal secundário?
- As cores ajudam na compreensão?
- A tipografia tem escala consistente?
- Os espaçamentos agrupam corretamente os elementos?
- A tela é compreensível em até 5 segundos?
- A versão mobile mantém a hierarquia?
- Não há poluição visual?
- Nenhuma regra de segurança foi removida?
- Nenhuma validação foi enfraquecida?
- Nenhum aviso legal ou de privacidade foi escondido?
- Nenhuma dependência insegura foi adicionada por estética?
- Nenhum script externo desnecessário foi incluído?

## Checklist específico para landing pages

- A promessa principal é clara?
- Existe uma ação principal?
- O CTA principal usa texto específico?
- O formulário, se existir, está visualmente organizado?
- A prova social reforça a promessa?
- Os benefícios estão fáceis de escanear?
- O layout segue fluxo visual lógico?
- O usuário entende o que ganha ao converter?
- O usuário entende o que acontece após clicar?
- Há política de privacidade quando dados são coletados?
- Estados de loading, erro e sucesso estão previstos?
- O mobile está realmente bom?

## Checklist específico para sistemas e dashboards

- A informação mais importante da tela está em destaque?
- A navegação não compete com a tarefa principal?
- Ações destrutivas têm hierarquia e cuidado visual?
- Botões primários e secundários estão diferenciados?
- Estados vazios, loading e erro estão claros?
- Alertas importantes têm destaque adequado?
- Dados sensíveis não são destacados de forma indevida?
- Mensagens de erro não expõem detalhes técnicos?
- A interface é utilizável em telas menores?

## Critérios de aceite

Esta skill será considerada aplicada corretamente quando:

- a interface tiver uma ordem visual clara;
- o usuário conseguir identificar rapidamente a mensagem principal;
- o CTA principal estiver evidente;
- elementos secundários não competirem com elementos principais;
- prova social e argumentos estiverem bem agrupados;
- formulários estiverem claros e seguros;
- mobile estiver legível e funcional;
- acessibilidade mínima for respeitada;
- performance não for sacrificada por estética;
- nenhuma regra de segurança for enfraquecida;
- nenhuma dependência visual desnecessária for adicionada;
- nenhuma funcionalidade existente for apagada sem análise.

## Resultado esperado ao aplicar esta skill

Ao aplicar esta skill em um projeto, o Claude Code deve entregar ou sugerir:

1. diagnóstico da hierarquia visual atual, quando houver layout existente;
2. identificação do ponto focal primário;
3. identificação do ponto focal secundário;
4. melhorias incrementais;
5. ajustes de título, subtítulo, CTA, espaçamento e contraste;
6. preservação de segurança e funcionalidades;
7. validação mobile;
8. checklist final de UI e segurança.

## Observação final

Design excelente não é apenas deixar bonito.

Design excelente é tornar a interface mais clara, confiável, acessível, segura, rápida e orientada à ação correta.

A estética deve servir à estratégia, à experiência do usuário e à segurança do projeto.

---

## Conexão com skills de segurança e do vault

Esta skill complementa — e nunca substitui — as camadas de segurança, privacidade e preservação.

**Sempre que tocar código existente:** invocar `/preserve-existing-behavior` antes.
**Em conflito entre skills:** invocar `/skill-orchestrator` para aplicar a hierarquia (Segurança > Privacidade > Acessibilidade > Performance > Manutenibilidade > UI/UX > Conversão > Estética).
**Em formulário/coleta de dados:** invocar `/lgpd-compliance-check` e `/webapp-hardening`.
**Em endpoint que recebe submit:** invocar `/api-backend-hardening`.
**Antes de instalar qualquer dependência visual (carrossel, animação, etc.):** invocar `/dependency-firewall`.
**Antes de publicar:** invocar `/pre-deploy-security-review` em paralelo com `/ui-final-design-review`.

Skills do vault relacionadas: [[00-regra-universal-nao-quebrar-codigo]], [[10-orquestrador-de-skills]], [[18-ux-funcional]].

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
