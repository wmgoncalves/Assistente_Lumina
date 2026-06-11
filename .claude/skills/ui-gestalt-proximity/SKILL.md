---
name: ui-gestalt-proximity
description: Principios de Gestalt aplicados a interface - proximidade, similaridade, fechamento, continuidade, figura/fundo. Resolve confusao visual em formularios, cards, prova social, listas e dashboards. Use quando elementos parecem soltos, agrupados errado ou competindo.
---

# ui-gestalt-proximity


Arquivo sugerido: `ui-gestalt-proximity.md`

## 1. Objetivo da skill

Esta skill orienta o Claude Code a aplicar o princípio de **proximidade da Gestalt** em interfaces digitais, páginas institucionais, landing pages, sistemas, formulários, cards, dashboards e componentes interativos.

O objetivo é garantir que elementos relacionados fiquem próximos e sejam percebidos pelo usuário como uma unidade lógica.

Uma interface profissional não depende apenas de cores, fontes e efeitos visuais. Ela precisa organizar as informações de forma que o cérebro do usuário entenda rapidamente:

- o que pertence ao mesmo grupo;
- o que é informação principal;
- o que é apoio;
- o que é ação;
- o que é aviso;
- o que é formulário;
- o que é prova social;
- o que é navegação;
- o que é conteúdo institucional;
- o que é conteúdo legal ou obrigatório.

Esta skill deve ser usada para reduzir confusão cognitiva e melhorar clareza, leitura, conversão, acessibilidade e consistência visual.

---

## 2. Regra principal

Elementos que pertencem ao mesmo contexto devem ficar visualmente próximos.

Elementos que pertencem a contextos diferentes devem ter separação visual suficiente.

A proximidade deve ser usada para criar grupos claros, mas nunca para esconder informações importantes, mensagens de erro, termos legais, avisos de privacidade, campos obrigatórios ou validações de segurança.

---

## 3. Prioridade absoluta

A proximidade visual é uma ferramenta de organização, não uma desculpa para remover ou esconder regras essenciais.

A prioridade deve ser sempre:

1. Segurança
2. Privacidade / LGPD
3. Acessibilidade
4. Performance
5. Manutenibilidade
6. Clareza da informação
7. UI/UX
8. Estética visual

Se uma decisão estética de agrupamento prejudicar segurança, acessibilidade, privacidade, performance ou funcionalidade existente, ela deve ser rejeitada.

---

## 4. Quando usar esta skill

Usar esta skill sempre que o Claude Code precisar criar, revisar ou melhorar:

- landing pages;
- hero sections;
- páginas institucionais;
- páginas de serviço;
- páginas de produto;
- páginas de captura;
- páginas de orçamento;
- formulários;
- cards;
- grids;
- listas;
- blocos de estatísticas;
- blocos de prova social;
- blocos de benefícios;
- blocos de diferenciais;
- páginas de política;
- páginas de FAQ;
- dashboards;
- áreas administrativas;
- tabelas;
- filtros;
- menus;
- modais;
- componentes reutilizáveis.

---

## 5. Quando não usar de forma rígida

Não aplicar proximidade de forma cega quando:

- a aproximação visual puder confundir o usuário;
- elementos próximos não forem relacionados;
- a separação for necessária para segurança ou clareza;
- mensagens legais precisarem de destaque independente;
- mensagens de erro precisarem ficar próximas ao campo, mas também visíveis;
- o layout existente já tiver uma lógica consolidada;
- houver design system com regras próprias;
- a mudança exigir refatoração grande sem necessidade;
- a alteração puder quebrar responsividade, validação ou integrações.

Nesses casos, adaptar a regra ao contexto real do projeto.

---

## 6. Conceito essencial

A Lei da Proximidade da Gestalt indica que o cérebro tende a interpretar elementos próximos como pertencentes ao mesmo grupo.

Na prática:

- título perto do subtítulo cria uma unidade de mensagem;
- estatísticas perto da promessa reforçam valor;
- label perto do input melhora compreensão;
- erro perto do campo facilita correção;
- botões próximos podem parecer ações relacionadas;
- cards muito próximos podem parecer parte do mesmo item;
- elementos distantes podem parecer desconectados, mesmo que tenham relação.

O Claude Code deve usar essa percepção natural para criar interfaces mais intuitivas.

---

## 7. Aplicação em landing pages

Em landing pages, proximidade deve ser usada para transformar argumentos soltos em uma unidade clara de valor.

### 7.1 Estrutura recomendada no hero

```text
Promessa principal
Subtítulo explicativo
Prova social agrupada
CTA principal
Microcopy de confiança
```

Esses elementos devem estar organizados em um bloco lógico.

A promessa, subtítulo e prova social devem ficar próximos porque fazem parte da construção de valor.

O CTA deve estar próximo o suficiente para ser entendido como próxima ação, mas com espaçamento suficiente para não parecer parte da prova social.

### 7.2 Exemplo correto

```text
[H1] Organize seus atendimentos e controle seus pagamentos em uma única planilha

[Subtítulo] Uma ferramenta pronta para fisioterapeutas acompanharem pacientes, sessões, frequência e financeiro com mais clareza.

[Prova social]
+ Pronta para usar
+ Compatível com Excel e Google Sheets
+ Campos organizados para rotina clínica

[CTA] Quero acessar a planilha
```

Neste exemplo:

- título e subtítulo formam a promessa;
- prova social reforça a promessa;
- CTA vem depois como ação clara.

### 7.3 Exemplo incorreto

```text
[H1] Organize seus atendimentos

[CTA] Quero comprar

Texto aleatório distante

Prova social no rodapé

Subtítulo em outro lado da tela
```

Problema:

- a promessa fica separada da explicação;
- a prova social fica desconectada;
- o CTA aparece cedo demais;
- o usuário não entende o valor antes da ação.

---

## 8. Aplicação em páginas institucionais

Em páginas institucionais, a proximidade deve agrupar informações por assunto.

Exemplos de grupos:

- história da empresa;
- missão, visão e valores;
- estrutura operacional;
- frota;
- certificações;
- programas;
- diferenciais;
- áreas de atuação;
- unidades;
- contato;
- documentos legais.

Cada grupo deve ter:

- título claro;
- texto ou elementos relacionados próximos;
- espaçamento adequado antes do próximo grupo;
- identidade visual consistente;
- hierarquia visual compatível.

### 8.1 Exemplo de estrutura

```text
Seção: Nossa História
- título
- parágrafo introdutório
- linha do tempo

Seção: Certificações
- título
- texto curto
- logos ou cards das certificações

Seção: Diferenciais
- título
- cards de diferenciais
```

Não misturar certificações, história, CTA, estatísticas e formulário no mesmo bloco sem separação clara.

---

## 9. Aplicação em formulários

Formulários exigem proximidade rigorosa.

Cada campo deve formar uma unidade com:

- label;
- input;
- ajuda contextual, se houver;
- mensagem de erro;
- mensagem de sucesso, se houver;
- informação de obrigatoriedade.

### 9.1 Estrutura correta de campo

```text
Nome completo
[ input ]
Mensagem de erro ou ajuda contextual
```

### 9.2 Regras para formulários

O Claude Code deve:

- manter label próximo ao campo correspondente;
- manter erro próximo ao campo com problema;
- não colocar mensagens de erro em local distante;
- não separar checkbox de seu texto;
- não separar política de privacidade do consentimento;
- agrupar campos relacionados;
- separar etapas diferentes;
- manter botão de envio associado ao formulário;
- manter feedback de loading, erro e sucesso próximo da ação;
- preservar validações existentes;
- nunca remover validação por estética.

### 9.3 Agrupamento de campos

Campos relacionados devem ficar próximos:

```text
Dados pessoais
- nome
- e-mail
- telefone

Dados do serviço
- tipo de serviço
- mensagem

Consentimento
- checkbox de aceite
- link da política de privacidade
```

### 9.4 Erro comum

Não fazer:

```text
Nome
[ input ]

Telefone
[ input ]

E-mail
[ input ]

No rodapé:
Erro: o e-mail é obrigatório
```

O erro precisa estar junto ao campo de e-mail.

---

## 10. Aplicação em CTAs

Botões e CTAs devem estar próximos do contexto que justifica a ação.

### 10.1 CTA após promessa

Em landing pages, o CTA deve vir depois de:

- promessa;
- explicação;
- benefício;
- prova social mínima.

### 10.2 CTA em seções internas

Em seções longas, CTAs contextuais podem aparecer após blocos de valor.

Exemplo:

```text
Título da seção
Explicação
Benefícios
CTA contextual
```

### 10.3 Cuidados

Evitar:

- CTA flutuando sem contexto;
- vários CTAs próximos com o mesmo peso;
- CTA principal perto de informações contraditórias;
- CTA longe demais do argumento de valor;
- CTA antes do usuário entender o que está sendo oferecido;
- CTA junto de texto legal de forma confusa;
- CTA que pareça aceitar termos sem consentimento explícito.

---

## 11. Aplicação em prova social

Provas sociais devem ficar próximas da promessa ou do benefício que sustentam.

Exemplos de prova social:

- número de clientes;
- número de entregas;
- anos de história;
- avaliações;
- depoimentos;
- certificações;
- selos;
- marcas atendidas;
- cases;
- indicadores de desempenho.

### 11.1 Regra

A prova social deve ser percebida como reforço da promessa, não como elemento solto.

### 11.2 Exemplo correto

```text
Promessa:
Transporte rodoviário de cargas líquidas com segurança, tecnologia e experiência.

Prova social próxima:
+ Desde 1966
+ Operação nacional
+ Certificações reconhecidas
```

### 11.3 Exemplo incorreto

Prova social espalhada em vários lugares sem contexto, competindo com CTA, imagem, menu e formulário.

---

## 12. Aplicação em cards

Cards devem representar unidades independentes ou comparáveis.

Usar cards quando houver:

- benefícios distintos;
- serviços distintos;
- etapas;
- planos;
- recursos;
- diferenciais;
- indicadores;
- depoimentos;
- documentos;
- produtos.

### 12.1 Regras para cards

O Claude Code deve:

- manter título, descrição e ação dentro do card;
- manter espaçamento interno consistente;
- separar cards com gap adequado;
- evitar cards muito próximos sem respiro;
- evitar cards com alturas completamente desordenadas quando isso prejudicar leitura;
- evitar cards com muitos elementos concorrentes;
- garantir que card clicável pareça clicável;
- garantir foco visível se o card for interativo;
- não transformar todo card em botão se apenas uma ação interna já existe.

### 12.2 Card clicável

Se o card inteiro for clicável:

- usar cursor pointer;
- aplicar hover;
- aplicar focus visível;
- usar aria-label quando necessário;
- garantir área de toque adequada;
- não colocar botões conflitantes dentro do card sem tratamento correto.

---

## 13. Aplicação em dashboards e áreas administrativas

Em sistemas e áreas administrativas, proximidade deve ajudar o usuário a entender dados e ações.

### 13.1 Agrupar por função

Exemplo:

```text
Filtros
- período
- status
- categoria

Tabela
- resultados

Ações
- exportar
- editar
- excluir
```

### 13.2 Regras

O Claude Code deve:

- manter filtros próximos da tabela que eles controlam;
- manter ações próximas dos itens afetados;
- manter botões destrutivos separados ou claramente diferenciados;
- manter mensagens de erro próximas da área afetada;
- manter estatísticas relacionadas agrupadas;
- separar ações globais de ações por linha;
- evitar misturar ações de edição com ações perigosas sem diferenciação;
- não esconder confirmações de ações destrutivas.

---

## 14. Aplicação em menus e navegação

Itens de navegação devem ser agrupados por contexto.

### 14.1 Regras

- Links principais ficam juntos.
- Links legais ficam no rodapé ou área apropriada.
- Ações de conta ficam agrupadas.
- Ações destrutivas ficam separadas.
- CTA principal pode ter destaque, mas não deve confundir navegação.
- Menu mobile deve preservar agrupamentos.
- Submenus devem ter relação clara com o item pai.

### 14.2 Evitar

- misturar links legais com CTA principal;
- colocar botão de exclusão junto com ação comum;
- criar menu com muitos níveis sem necessidade;
- esconder política de privacidade;
- ocultar navegação essencial no mobile.

---

## 15. Espaçamento como linguagem visual

Espaçamento não é apenas estética. Ele comunica relação.

### 15.1 Espaçamento pequeno

Indica que elementos pertencem ao mesmo grupo.

Exemplo:

```text
Título
Subtítulo
```

### 15.2 Espaçamento médio

Indica separação entre elementos relacionados, mas distintos.

Exemplo:

```text
Bloco de texto

CTA
```

### 15.3 Espaçamento grande

Indica mudança de seção ou assunto.

Exemplo:

```text
Seção de benefícios

Seção de depoimentos
```

### 15.4 Regra

Usar espaçamento de forma consistente.

Não usar espaçamentos aleatórios.

---

## 16. Proximidade e hierarquia visual

Esta skill deve trabalhar junto com `ui-visual-hierarchy`.

Proximidade define o grupo.

Hierarquia define o peso dentro do grupo.

Exemplo:

```text
Grupo:
- título forte
- subtítulo médio
- descrição normal
- CTA destacado
```

Se todos os elementos do grupo tiverem o mesmo peso visual, a proximidade sozinha não resolve.

---

## 17. Proximidade e padrões F/Z

Esta skill deve trabalhar junto com `ui-reading-patterns`.

Padrão F ou Z define o caminho visual.

Proximidade define os blocos dentro desse caminho.

Exemplo em padrão Z:

```text
Logo       CTA secundário

Promessa principal        Imagem/Formulário
Subtítulo
Prova social
CTA principal
```

Exemplo em padrão F:

```text
Título principal
Resumo

Seção 1
Texto
Lista

Seção 2
Texto
Lista
```

---

## 18. Proximidade e affordance

Esta skill deve trabalhar junto com `ui-affordance-interactions`.

Elementos interativos próximos podem parecer relacionados.

Por isso:

- botão perto de um texto deve acionar algo relacionado a esse texto;
- link perto de uma frase deve ter relação com ela;
- botão de exclusão deve ficar perto do item que será excluído, mas com diferenciação visual;
- botão principal e secundário podem ficar próximos, mas com pesos diferentes;
- elementos não clicáveis não devem parecer botões.

---

## 19. Proximidade e máquina de estados

Esta skill deve trabalhar junto com `ui-component-state-machine`.

Estados devem aparecer próximos ao componente afetado.

Exemplos:

- erro de input próximo ao input;
- loading próximo ao botão ou área carregada;
- sucesso próximo ao formulário enviado;
- erro de tabela próximo da tabela;
- estado vazio na área onde os dados apareceriam;
- confirmação próxima da ação relevante.

Nunca colocar todos os erros em um lugar genérico sem relação visual, salvo quando houver também indicação local.

---

## 20. Preservação de layouts existentes

Quando já existir uma interface, layout, página, componente, seção ou fluxo criado, o Claude Code não deve apagar tudo e refazer do zero automaticamente.

Antes de alterar agrupamentos visuais, deve:

1. analisar a estrutura atual;
2. identificar grupos já existentes;
3. identificar grupos confusos;
4. apontar o que pode melhorar;
5. propor mudanças por partes;
6. preservar funcionalidades existentes;
7. preservar classes, IDs, hooks e integrações sempre que possível;
8. evitar grandes refatorações sem necessidade.

### 20.1 Melhorias incrementais recomendadas

Ao melhorar proximidade em layout existente:

1. ajustar espaçamentos entre título e subtítulo;
2. aproximar prova social da promessa;
3. reorganizar cards relacionados;
4. separar seções diferentes;
5. mover erro para perto do campo;
6. reposicionar CTA junto ao contexto;
7. revisar mobile;
8. testar se funcionalidades continuam intactas.

### 20.2 Proibição

Não substituir uma página inteira por uma nova versão apenas para melhorar agrupamento visual.

O objetivo é evoluir o layout existente com controle e segurança.

---

## 21. Segurança

A proximidade visual nunca pode enfraquecer segurança.

### 21.1 Não esconder

Nunca esconder ou reduzir a clareza de:

- erros de validação;
- alertas de segurança;
- avisos de privacidade;
- termos legais;
- política de cookies;
- consentimento LGPD;
- campos obrigatórios;
- confirmação de ações destrutivas;
- mensagens de permissão negada;
- alertas de falha de autenticação;
- instruções críticas.

### 21.2 Não usar dark patterns

Não usar proximidade para:

- induzir aceite involuntário;
- confundir o usuário sobre o que está clicando;
- aproximar botão positivo de texto enganoso;
- esconder opção de recusa;
- dificultar cancelamento;
- mascarar custos;
- ocultar limitações;
- diminuir percepção de risco.

### 21.3 Formulários e segurança

- Consentimento deve estar claramente associado ao checkbox correto.
- Link de política deve estar visível.
- Campos obrigatórios devem estar claros.
- Erros devem ser compreensíveis.
- Validação visual não substitui validação segura.
- Mensagens de erro não devem expor dados sensíveis.

---

## 22. Acessibilidade

Agrupamentos visuais devem corresponder à estrutura semântica.

### 22.1 Regras

O Claude Code deve:

- usar headings corretamente;
- usar fieldset e legend quando fizer sentido em formulários;
- associar label ao input;
- associar mensagem de erro ao campo quando possível;
- manter ordem HTML compatível com ordem visual;
- garantir foco visível;
- garantir navegação por teclado;
- garantir contraste adequado;
- não depender apenas de proximidade visual para transmitir relação;
- usar atributos ARIA apenas quando necessário e corretamente.

### 22.2 Exemplo de formulário acessível

```html
<label for="email">E-mail</label>
<input id="email" name="email" type="email" aria-describedby="email-error">
<p id="email-error">Informe um e-mail válido.</p>
```

A mensagem de erro está próxima visualmente e também associada semanticamente.

---

## 23. Performance

Proximidade deve ser resolvida principalmente com estrutura HTML e CSS.

Evitar:

- bibliotecas de layout desnecessárias;
- scripts apenas para ajustar espaçamento;
- dependências pesadas para grid simples;
- animações complexas para agrupar elementos;
- carrosséis desnecessários;
- componentes visuais pesados sem necessidade.

Preferir:

- CSS Grid;
- Flexbox;
- variáveis CSS;
- classes reutilizáveis;
- estrutura semântica;
- tokens de espaçamento;
- componentes simples.

---

## 24. Design system e tokens

Se o projeto possuir design system, usar seus tokens de espaçamento.

Exemplos:

```css
:root {
  --space-xs: 0.5rem;
  --space-sm: 0.75rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
}
```

### 24.1 Regra

Espaçamentos devem ser consistentes.

Não criar valores aleatórios como:

```css
margin-bottom: 13px;
padding-top: 27px;
gap: 19px;
```

A menos que exista motivo técnico específico.

---

## 25. Exemplos práticos por tipo de projeto

### 25.1 Site institucional de logística

Grupos recomendados:

```text
Hero:
- promessa institucional
- subtítulo
- CTA

Prova:
- anos de história
- operação nacional
- certificações

Serviços:
- tipo de transporte
- descrição
- CTA

Certificações:
- logos
- texto explicativo

Contato:
- formulário
- WhatsApp
- dados da empresa
```

### 25.2 Landing page de produto digital

Grupos recomendados:

```text
Hero:
- promessa
- subtítulo
- mockup
- CTA

Benefícios:
- cards agrupados

Como funciona:
- etapas

Prova:
- depoimentos ou indicadores

Oferta:
- preço ou condição
- CTA

FAQ:
- objeções

Rodapé:
- dados legais
- política
```

### 25.3 Sistema administrativo

Grupos recomendados:

```text
Topo:
- título da página
- ação principal

Filtros:
- campos de busca
- selects
- botão filtrar

Resumo:
- cards de métricas

Tabela:
- dados
- ações por linha

Estados:
- loading
- vazio
- erro
```

---

## 26. Checklist obrigatório

Antes de finalizar uma interface, o Claude Code deve verificar:

- Elementos relacionados estão próximos?
- Elementos não relacionados estão separados?
- Título, subtítulo e descrição formam um grupo claro?
- Prova social está próxima da promessa?
- CTA está próximo do contexto que justifica a ação?
- Campos de formulário estão agrupados corretamente?
- Labels estão próximos dos inputs?
- Erros estão próximos dos campos?
- Checkbox e texto de consentimento estão associados?
- Cards têm espaçamento consistente?
- Seções diferentes têm separação clara?
- A ordem mobile mantém os grupos lógicos?
- A estrutura HTML acompanha o agrupamento visual?
- O layout não esconde informações legais?
- O layout não enfraquece segurança?
- O layout não remove validações?
- O layout não depende de biblioteca desnecessária?
- O layout preserva funcionalidades existentes?

---

## 27. Checklist específico para formulários

- Cada input tem label próximo.
- Cada erro aparece perto do campo.
- Ajuda contextual fica perto do campo.
- Campos relacionados estão agrupados.
- Etapas estão separadas.
- Consentimento fica perto do checkbox.
- Política de privacidade está acessível.
- Botão de envio está claramente associado ao formulário.
- Loading aparece perto da ação.
- Sucesso aparece perto do formulário enviado.
- Erro geral não substitui erro local.
- Validação visual não substitui validação segura.
- O formulário funciona no mobile.

---

## 28. Checklist específico para landing pages

- Promessa, subtítulo e prova social estão próximos.
- CTA principal está conectado ao bloco de valor.
- Imagem ou mockup apoia a promessa.
- Benefícios estão agrupados.
- Etapas estão agrupadas.
- Depoimentos estão agrupados.
- FAQ está separado da oferta.
- Rodapé legal está separado e visível.
- Não há CTAs concorrentes próximos demais.
- Não há elementos decorativos competindo com grupos principais.

---

## 29. Checklist específico para sistemas

- Filtros estão próximos dos dados afetados.
- Ações estão próximas dos itens afetados.
- Ações destrutivas são diferenciadas.
- Estados aparecem na área correta.
- Métricas relacionadas estão agrupadas.
- Tabelas têm cabeçalhos claros.
- Modais agrupam título, conteúdo e ações.
- Mensagens de erro estão contextualizadas.
- Permissões e alertas são visíveis.
- Não há ações perigosas misturadas com ações comuns sem diferenciação.

---

## 30. Critérios de aceite

A aplicação desta skill será considerada correta quando:

- a interface possuir grupos visuais claros;
- o usuário entender rapidamente quais elementos pertencem juntos;
- o layout reduzir esforço cognitivo;
- a prova social reforçar a promessa;
- os CTAs estiverem conectados ao contexto;
- formulários forem fáceis de entender;
- mensagens de erro estiverem próximas dos campos;
- seções diferentes estiverem bem separadas;
- o mobile preservar os agrupamentos;
- a estrutura HTML fizer sentido;
- a acessibilidade não for prejudicada;
- a segurança não for enfraquecida;
- funcionalidades existentes forem preservadas;
- não houver refatoração destrutiva sem justificativa.

---

## 31. Resumo operacional para o Claude Code

Sempre que criar ou revisar uma interface:

1. Identificar os grupos naturais de informação.
2. Aproximar elementos relacionados.
3. Separar elementos não relacionados.
4. Garantir que título, subtítulo e prova social formem uma unidade.
5. Garantir que CTA esteja associado ao contexto correto.
6. Garantir que formulários tenham labels, campos e erros próximos.
7. Garantir que estados apareçam próximos ao componente afetado.
8. Revisar mobile.
9. Revisar acessibilidade semântica.
10. Revisar segurança.
11. Preservar o layout existente sempre que possível.
12. Fazer mudanças incrementais, controladas e rastreáveis.

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
