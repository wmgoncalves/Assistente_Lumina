---
name: ui-reading-patterns
description: Padroes de leitura (F, Z, Gutenberg, padrao de camada). Define onde posicionar headline, CTA, prova social e formulario conforme o tipo de pagina. Use em landing page, pagina institucional, dashboard, e-commerce, blog ou qualquer pagina com texto + acao.
---

# ui-reading-patterns


Arquivo sugerido: `ui-reading-patterns.md`

## 1. Objetivo da skill

Esta skill orienta o Claude Code a organizar interfaces considerando os padrões naturais de leitura e escaneamento visual do usuário, principalmente os padrões **F** e **Z**.

O objetivo é melhorar:

- clareza visual;
- velocidade de compreensão;
- fluidez de navegação;
- posicionamento de CTAs;
- estrutura de páginas institucionais;
- estrutura de landing pages;
- conversão;
- leitura em desktop e mobile;
- organização visual sem prejudicar segurança, acessibilidade ou performance.

Esta skill deve ser usada sempre que o Claude Code criar, revisar ou modificar:

- landing pages;
- páginas institucionais;
- páginas de serviço;
- páginas de venda;
- páginas de captura;
- páginas com muito texto;
- páginas de políticas;
- páginas técnicas;
- dashboards;
- áreas administrativas;
- páginas com formulários;
- páginas com CTAs importantes;
- fluxos de conversão.

---

## 2. Regra principal

Antes de criar ou alterar um layout, o Claude Code deve identificar qual padrão de leitura faz mais sentido para a página ou seção.

A escolha deve considerar:

- quantidade de texto;
- objetivo da página;
- nível de complexidade do conteúdo;
- presença ou ausência de formulário;
- presença ou ausência de imagem principal;
- intenção de conversão;
- comportamento esperado do usuário;
- contexto mobile;
- estrutura HTML existente;
- regras de segurança, privacidade, acessibilidade e performance.

A escolha visual nunca pode prejudicar regras de segurança já existentes.

---

## 3. Prioridade absoluta

As diretrizes de leitura visual são complementares às demais regras do projeto.

A prioridade deve ser sempre:

1. Segurança
2. Privacidade / LGPD
3. Acessibilidade
4. Performance
5. Manutenibilidade
6. Clareza de conteúdo
7. UI/UX
8. Estética visual

Se uma decisão baseada no padrão F ou Z entrar em conflito com segurança, privacidade, acessibilidade, performance ou funcionamento existente, ela deve ser ajustada ou descartada.

---

## 4. Quando usar o padrão F

O padrão F deve ser usado quando a interface possui bastante texto ou quando o usuário precisa escanear informações com atenção progressiva.

É indicado para:

- páginas institucionais longas;
- páginas “sobre”;
- páginas de políticas;
- páginas de privacidade;
- páginas de termos de uso;
- artigos;
- blogs;
- documentação;
- páginas técnicas;
- páginas de serviço com explicações detalhadas;
- páginas com muitos parágrafos;
- páginas com listas;
- páginas de FAQ extensa;
- páginas educacionais;
- e-books em HTML;
- áreas de conteúdo informativo;
- páginas onde a leitura é mais importante que o clique imediato.

### 4.1 Como o padrão F funciona

No padrão F, o usuário geralmente:

1. escaneia a primeira linha ou bloco horizontal no topo;
2. desce pela lateral esquerda procurando pontos de interesse;
3. faz novas leituras horizontais em subtítulos ou blocos destacados;
4. reduz a profundidade da leitura conforme avança;
5. procura palavras-chave, subtítulos, listas e destaques visuais.

Por isso, o layout deve facilitar o escaneamento vertical e horizontal.

### 4.2 Diretrizes para padrão F

Ao aplicar o padrão F, o Claude Code deve:

- posicionar o título principal no topo, com força visual clara;
- usar subtítulo logo abaixo para contextualizar;
- dividir o texto em seções com headings bem definidos;
- evitar blocos de texto longos demais;
- usar parágrafos curtos;
- usar listas quando o conteúdo exigir escaneamento rápido;
- destacar palavras-chave com moderação;
- evitar excesso de negrito;
- alinhar conteúdo principal de forma consistente;
- criar respiro entre seções;
- usar cards apenas quando eles melhorarem a compreensão;
- usar CTAs intermediários sem interromper a leitura;
- manter o CTA final claro;
- criar sumário ou âncoras quando a página for muito longa;
- manter informações legais visíveis e acessíveis;
- garantir que a ordem visual siga a ordem lógica do HTML.

### 4.3 Estrutura recomendada para padrão F

Exemplo de estrutura:

```text
Topo:
- Logo / identidade
- Navegação
- Título principal
- Subtítulo
- Resumo ou introdução curta

Corpo:
- Seção 1 com subtítulo claro
- Texto curto
- Lista ou pontos importantes
- Seção 2 com subtítulo claro
- Texto curto
- Destaques ou cards
- Seção 3 com subtítulo claro
- FAQ ou detalhes

Fechamento:
- Resumo
- CTA contextual
- Links legais
- Rodapé
```

### 4.4 Cuidados no padrão F

Evitar:

- esconder informação importante apenas no final;
- criar parágrafos extensos sem quebras;
- usar texto justificado com espaçamentos ruins;
- usar muitos cards desalinhados;
- colocar CTA agressivo em toda seção;
- usar títulos com pesos iguais em todos os blocos;
- criar hierarquia confusa;
- colocar termos legais ou informações críticas em fonte pequena demais;
- depender apenas de imagens para explicar o conteúdo;
- criar layout bonito, mas difícil de ler.

---

## 5. Quando usar o padrão Z

O padrão Z deve ser usado quando a página ou seção possui foco visual, menor volume de texto e intenção clara de conversão.

É indicado para:

- landing pages;
- hero sections;
- páginas de captura;
- páginas de venda;
- páginas de campanha;
- páginas com formulário principal;
- páginas com mockup ou imagem forte;
- páginas com CTA único;
- seções iniciais de sites;
- páginas promocionais;
- páginas de produto digital;
- páginas de orçamento;
- páginas com visual mais direto e persuasivo.

### 5.1 Como o padrão Z funciona

No padrão Z, o olhar do usuário tende a percorrer a tela em um movimento semelhante à letra Z:

1. começa no canto superior esquerdo;
2. vai para o canto superior direito;
3. cruza diagonalmente para o centro/inferior esquerdo;
4. termina no canto inferior direito ou na área de ação.

Esse padrão funciona bem quando o conteúdo é mais visual e o objetivo é conduzir o usuário até uma ação.

### 5.2 Diretrizes para padrão Z

Ao aplicar o padrão Z, o Claude Code deve:

- posicionar a identidade visual no topo esquerdo;
- posicionar navegação ou CTA secundário no topo direito;
- colocar a promessa principal em área de destaque;
- usar imagem, mockup ou elemento visual para apoiar a promessa;
- conduzir o olhar até o CTA principal;
- usar prova social próxima da promessa;
- evitar múltiplos CTAs com o mesmo peso;
- manter o formulário como ponto focal secundário ou final;
- criar equilíbrio entre texto, imagem e ação;
- evitar elementos decorativos que confundam o fluxo;
- deixar o CTA principal visível sem exagero;
- garantir que o fluxo visual também funcione no mobile.

### 5.3 Estrutura recomendada para padrão Z

Exemplo de estrutura:

```text
Topo esquerdo:
- Logo / identidade

Topo direito:
- Navegação curta
- CTA secundário, se necessário

Centro esquerdo:
- Título principal
- Subtítulo
- Prova social agrupada

Centro direito:
- Imagem, mockup, formulário ou elemento visual principal

Área de fechamento:
- CTA principal
- Microcopy de segurança ou confiança
```

### 5.4 Cuidados no padrão Z

Evitar:

- colocar muitos elementos no topo;
- criar dois CTAs principais concorrentes;
- posicionar o formulário sem contexto;
- usar imagem decorativa sem função;
- colocar prova social longe da promessa;
- deixar o botão principal fora do fluxo visual;
- criar hero com altura exagerada no mobile;
- esconder informações importantes abaixo da dobra sem indicação;
- usar animações que desviem a atenção da conversão;
- usar efeitos visuais pesados apenas por estética.

---

## 6. Adaptação para mobile

Em telas pequenas, os padrões F e Z deixam de funcionar exatamente como no desktop e passam a se transformar em fluxo vertical.

Por isso, o Claude Code deve garantir que a ordem mobile siga a prioridade real de leitura e conversão.

### 6.1 Ordem recomendada para mobile em landing pages

```text
1. Logo ou identificação da marca
2. Promessa principal
3. Subtítulo
4. Prova social curta
5. CTA principal
6. Imagem ou mockup
7. Benefícios
8. Formulário ou CTA reforçado
9. FAQ
10. Rodapé e links legais
```

### 6.2 Ordem recomendada para mobile em páginas textuais

```text
1. Título principal
2. Resumo curto
3. Sumário, se necessário
4. Seções em ordem lógica
5. Listas e destaques
6. CTA contextual
7. Informações legais
8. Rodapé
```

### 6.3 Regras para mobile

- Não esconder CTAs essenciais.
- Não esconder informações legais obrigatórias.
- Não inverter ordem lógica de forma confusa.
- Não colocar imagem antes da promessa se isso atrasar a compreensão.
- Não deixar botão abaixo de muitos elementos irrelevantes.
- Não criar cards estreitos demais.
- Não usar fonte pequena demais.
- Não usar animações pesadas.
- Não criar rolagem horizontal.
- Não depender de hover para informar interação.

---

## 7. Relação com hierarquia visual

Esta skill deve trabalhar junto com a skill `ui-visual-hierarchy`.

O padrão de leitura define o caminho do olhar.

A hierarquia visual define o peso de cada elemento dentro desse caminho.

Exemplo:

- O padrão Z pode conduzir o usuário até o CTA.
- A hierarquia visual garante que o CTA correto seja percebido como principal.
- O padrão F facilita leitura longa.
- A hierarquia visual garante que títulos, subtítulos e listas sejam escaneáveis.

O Claude Code deve aplicar ambas em conjunto.

---

## 8. Relação com Gestalt e proximidade

Esta skill também deve trabalhar junto com `ui-gestalt-proximity`.

O padrão de leitura define o caminho geral da tela.

A proximidade define quais elementos são percebidos como grupo dentro desse caminho.

Exemplo em landing page:

```text
Promessa principal
Subtítulo
Prova social
CTA
```

Esses elementos devem estar visualmente conectados, mas com pesos diferentes.

Exemplo em página textual:

```text
Título da seção
Parágrafo explicativo
Lista de pontos
CTA contextual
```

Esses elementos devem ser organizados como uma unidade de compreensão.

---

## 9. Relação com affordance

Esta skill deve trabalhar junto com `ui-affordance-interactions`.

Não basta posicionar o CTA no caminho correto do olhar. Ele também precisa parecer clicável.

Ao aplicar padrão Z ou F, o Claude Code deve garantir que:

- botões tenham aparência de botão;
- links pareçam links;
- CTAs tenham hover;
- foco de teclado seja visível;
- botões tenham cursor pointer;
- elementos interativos não sejam confundidos com texto comum;
- elementos não interativos não pareçam clicáveis.

---

## 10. Relação com componentes como máquina de estados

Quando o padrão de leitura leva o usuário até uma ação, essa ação precisa ter estados bem definidos.

Exemplo:

Se o padrão Z conduz o usuário até um formulário, o formulário deve ter:

- estado inicial;
- estado preenchido;
- estado validando;
- estado enviando;
- estado de sucesso;
- estado de erro;
- estado de bloqueio, se necessário.

Não criar fluxo visual de conversão sem feedback de estado.

---

## 11. Preservação de layouts existentes

Quando já existir uma interface, layout, página, componente, seção ou fluxo criado, o Claude Code não deve apagar tudo e refazer do zero automaticamente.

Antes de alterar o padrão visual de uma página existente, deve:

1. analisar a estrutura atual;
2. identificar se ela já segue parcialmente padrão F ou Z;
3. apontar problemas objetivos;
4. sugerir melhorias por partes;
5. preservar o que já funciona;
6. evitar refatoração completa sem necessidade;
7. manter funcionalidades, integrações, responsividade e segurança existentes.

### 11.1 Alterações incrementais recomendadas

Ao melhorar um layout existente:

1. ajustar ordem visual;
2. reforçar título principal;
3. reorganizar CTA;
4. aproximar prova social da promessa;
5. melhorar espaçamentos;
6. ajustar responsividade;
7. revisar estados interativos;
8. testar se nada foi quebrado.

Nunca substituir a página inteira sem avaliar o impacto técnico, visual e funcional.

---

## 12. Segurança e privacidade

O padrão de leitura nunca deve ser usado para esconder ou reduzir a importância de:

- termos legais;
- política de privacidade;
- aviso de cookies;
- consentimento LGPD;
- mensagens de erro;
- alertas de segurança;
- campos obrigatórios;
- limitações do serviço;
- informações comerciais relevantes;
- mensagens de validação;
- avisos de risco;
- instruções importantes.

### 12.1 Proibições

O Claude Code não deve:

- esconder consentimento em fonte pequena demais;
- colocar links legais em áreas inacessíveis;
- fazer botão principal induzir consentimento indevido;
- usar dark patterns;
- ocultar custos, regras ou condições;
- criar fluxo visual enganoso;
- remover validações para melhorar aparência;
- diminuir contraste de mensagens obrigatórias;
- esconder erro para manter layout “limpo”;
- usar animação para mascarar falha de carregamento;
- usar bibliotecas externas inseguras para efeitos visuais.

---

## 13. Acessibilidade

O padrão de leitura deve respeitar acessibilidade.

O Claude Code deve garantir:

- estrutura semântica correta;
- headings em ordem lógica;
- contraste adequado;
- foco visível;
- navegação por teclado;
- labels em formulários;
- mensagens de erro compreensíveis;
- textos alternativos quando necessário;
- ordem HTML compatível com a ordem visual;
- não depender apenas de cor;
- não depender apenas de posição visual;
- não depender apenas de hover;
- não criar armadilhas de teclado.

### 13.1 Headings

Não usar heading apenas por tamanho visual.

Exemplo correto:

```html
<h1>Promessa principal</h1>
<h2>Benefícios</h2>
<h3>Benefício específico</h3>
```

Exemplo incorreto:

```html
<h1>Texto pequeno qualquer</h1>
<h4>Título principal</h4>
```

A hierarquia semântica deve fazer sentido para leitores de tela e SEO.

---

## 14. Performance

O padrão visual não deve justificar excesso de peso.

O Claude Code deve evitar:

- animações pesadas;
- imagens sem otimização;
- scripts externos desnecessários;
- bibliotecas grandes apenas para layout simples;
- carrosséis pesados sem necessidade;
- efeitos visuais que travam no mobile;
- vídeos automáticos pesados;
- dependências sem análise.

Preferir:

- CSS nativo;
- layout simples;
- imagens otimizadas;
- SVG quando adequado;
- lazy loading quando fizer sentido;
- transições leves;
- estrutura limpa.

---

## 15. Exemplos práticos

### 15.1 Exemplo de hero com padrão Z

```text
Topo esquerdo:
Logo da empresa

Topo direito:
Menu curto + botão secundário

Área principal esquerda:
Título com promessa clara
Subtítulo explicativo
Prova social curta

Área principal direita:
Mockup, imagem do produto ou formulário

Fechamento da seção:
CTA principal com affordance clara
Microcopy de confiança
```

### 15.2 Exemplo de página institucional com padrão F

```text
Título:
Quem somos

Resumo:
Breve apresentação institucional

Seções:
História
Estrutura
Diferenciais
Certificações
Atuação
CTA final
```

### 15.3 Exemplo de página de serviço

Se a página tiver muito texto técnico, usar padrão F.

Se a página for focada em captar orçamento, usar padrão Z no topo e padrão F nas seções explicativas abaixo.

Estrutura híbrida:

```text
Hero em padrão Z
Benefícios em cards agrupados
Explicação detalhada em padrão F
Provas e certificações
FAQ
CTA final
```

---

## 16. Critérios para escolher padrão F ou Z

Antes de implementar, responder internamente:

### A página tem muito texto?

Se sim, considerar padrão F.

### A página tem uma ação principal clara?

Se sim, considerar padrão Z.

### A página é uma landing page?

Se sim, usar padrão Z no hero.

### A página é artigo, política ou documentação?

Se sim, usar padrão F.

### A página mistura venda e explicação?

Usar padrão híbrido:

- Z no hero;
- F no conteúdo longo;
- Z ou CTA forte no fechamento.

### A página já existe?

Não refazer do zero. Melhorar por partes.

---

## 17. Checklist obrigatório antes de finalizar

Antes de concluir uma página ou seção, o Claude Code deve verificar:

- O tipo de página foi identificado?
- O padrão F ou Z foi escolhido conscientemente?
- O padrão escolhido faz sentido para o objetivo da página?
- A ordem visual conduz o usuário corretamente?
- O CTA principal está no caminho natural do olhar?
- A promessa principal aparece antes da ação?
- A prova social está próxima da promessa?
- Páginas textuais têm headings claros?
- Parágrafos longos foram evitados?
- O mobile tem ordem lógica?
- A ordem HTML acompanha a ordem visual?
- Nenhuma informação obrigatória foi escondida?
- Nenhuma regra de segurança foi removida?
- Nenhuma validação foi enfraquecida?
- Nenhum script externo desnecessário foi adicionado?
- O layout continua acessível?
- O layout continua performático?
- O layout preserva o que já funcionava?

---

## 18. Checklist específico para padrão F

- Título principal forte no topo.
- Subtítulo ou resumo inicial.
- Headings bem distribuídos.
- Parágrafos curtos.
- Listas quando necessário.
- Destaques com moderação.
- Boa leitura vertical.
- CTAs contextuais sem exagero.
- Sumário em páginas longas.
- Conteúdo legal visível.
- Mobile legível.
- HTML semântico.

---

## 19. Checklist específico para padrão Z

- Logo ou identidade no topo esquerdo.
- Navegação ou ação secundária no topo direito.
- Promessa principal em área de destaque.
- Imagem, mockup ou formulário apoiando a promessa.
- Prova social próxima da promessa.
- CTA principal no fluxo natural do olhar.
- Apenas um CTA principal.
- CTA secundário com menor peso.
- Sem poluição visual.
- Mobile com ordem vertical correta.
- Formulário com estados e validação.

---

## 20. Quando não aplicar cegamente esta skill

Não aplicar padrão F ou Z de forma rígida quando:

- o projeto já possui um design system consolidado;
- a página pertence a um sistema administrativo com lógica própria;
- o layout existente funciona bem e só precisa de pequenos ajustes;
- há limitações técnicas relevantes;
- a acessibilidade exige outra organização;
- a segurança exige maior destaque para avisos ou validações;
- o conteúdo legal precisa ser priorizado;
- o usuário especificou uma estrutura diferente por motivo válido.

Nesses casos, adaptar os princípios sem forçar uma estrutura inadequada.

---

## 21. Integração com revisão final

Ao finalizar qualquer interface, esta skill deve alimentar a skill `ui-final-design-review`.

A revisão final deve confirmar:

- padrão escolhido;
- justificativa do padrão;
- funcionamento no mobile;
- relação com CTA;
- preservação da segurança;
- preservação da acessibilidade;
- preservação da estrutura existente;
- ausência de refatoração desnecessária.

---

## 22. Critérios de aceite

A aplicação desta skill será considerada correta quando:

- o padrão de leitura escolhido for coerente com o objetivo da página;
- o layout guiar naturalmente o olhar do usuário;
- o CTA principal estiver bem posicionado;
- páginas textuais forem fáceis de escanear;
- landing pages tiverem fluxo claro de conversão;
- o mobile preservar a ordem de prioridade;
- a estrutura HTML fizer sentido;
- nenhuma informação obrigatória for escondida;
- nenhuma regra de segurança for enfraquecida;
- nenhuma funcionalidade existente for removida;
- o design melhorar a experiência sem quebrar o projeto.

---

## 23. Resumo operacional para o Claude Code

Sempre que criar ou revisar uma interface:

1. Identificar o objetivo da página.
2. Identificar se há muito texto ou foco em conversão.
3. Escolher padrão F, Z ou híbrido.
4. Organizar a hierarquia visual.
5. Posicionar CTA conforme o fluxo do olhar.
6. Agrupar informações relacionadas.
7. Garantir affordance nos elementos interativos.
8. Mapear estados dos componentes.
9. Ajustar responsividade.
10. Validar acessibilidade.
11. Validar segurança.
12. Preservar layouts existentes sempre que possível.
13. Fazer revisão final antes de concluir.

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
