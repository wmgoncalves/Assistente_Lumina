---
name: ui-brand-fidelity
description: Fidelidade de marca - preserva identidade visual, cores oficiais, tipografia, logo, tom de voz e padroes reconheciveis ([MARCA_1]=[FONTE_MARCA_1]/[COR_MARCA_1], Transliquidos=Montserrat, [SUA_EMPRESA]=minimalista, 365 Logistica, Blue Seguros, Cliente Saúde A, GL Projetos). Use ao criar/revisar interface de marca conhecida.
---

# ui-brand-fidelity


Arquivo sugerido: `ui-brand-fidelity.md`

## 1. Objetivo da skill

Esta skill orienta o Claude Code a preservar e aplicar corretamente a identidade visual da marca em sites, landing pages, sistemas, páginas institucionais, materiais digitais e componentes de interface.

O objetivo é evitar que o projeto fique com aparência genérica, desalinhada da marca ou inconsistente entre páginas.

A skill deve garantir fidelidade em:

- nome da marca;
- logotipo;
- proporções do logotipo;
- cores institucionais;
- fontes;
- estilo visual;
- tom da interface;
- componentes;
- imagens;
- ícones;
- botões;
- cards;
- espaçamentos;
- linguagem visual;
- experiência geral da marca.

Esta skill também deve impedir alterações indevidas, como:

- distorcer logo;
- recolorir logo sem autorização;
- trocar fonte institucional;
- usar paleta fora da marca;
- criar identidade genérica;
- misturar estilos conflitantes;
- inventar dados institucionais;
- usar imagens que não combinam com a empresa;
- alterar aparência de caminhões, uniformes, produtos ou elementos reais sem instrução explícita.

---

## 2. Regra principal

Antes de criar ou alterar qualquer layout com identidade de marca, o Claude Code deve identificar e respeitar os elementos visuais existentes.

Deve analisar:

- arquivos de logo;
- CSS existente;
- cores usadas;
- fontes usadas;
- imagens de referência;
- páginas já aprovadas;
- materiais anteriores;
- instruções do usuário;
- regras salvas no projeto;
- `CLAUDE.md`;
- skills existentes;
- design system atual.

Se houver conflito entre uma sugestão estética e a identidade da marca, a identidade da marca deve prevalecer, desde que não prejudique segurança, acessibilidade ou performance.

---

## 3. Prioridade absoluta

A fidelidade de marca não pode enfraquecer segurança, privacidade, acessibilidade ou performance.

Prioridade:

1. Segurança
2. Privacidade / LGPD
3. Acessibilidade
4. Performance
5. Manutenibilidade
6. Fidelidade de marca
7. Clareza da informação
8. UI/UX
9. Conversão
10. Estética visual

Se uma decisão de marca entrar em conflito com segurança, privacidade ou acessibilidade, adaptar a decisão visual sem comprometer as prioridades superiores.

---

## 4. Quando usar esta skill

Usar esta skill sempre que o Claude Code criar, revisar ou alterar:

- site institucional;
- landing page;
- página de serviço;
- página de venda;
- página de captura;
- sistema administrativo com identidade visual;
- header;
- footer;
- hero section;
- formulário;
- card;
- botão;
- página de política;
- página de contato;
- página de blog;
- página de produto;
- material digital;
- layout com logo;
- identidade visual de cliente;
- componente reutilizável;
- página para [MARCA_1] Transportes;
- página para [MARCA_2];
- página para 365 Logística;
- página para [SUA_EMPRESA];
- página para Blue Seguros;
- página para Cliente Saúde A;
- página para GL Projetos / [Sócio GL];
- qualquer projeto com marca identificável.

---

## 5. Quando não aplicar de forma rígida

Não aplicar regras de marca de forma cega quando:

- a marca ainda não estiver definida;
- o projeto for um protótipo sem identidade;
- o usuário pedir uma exploração visual nova;
- houver redesign oficialmente solicitado;
- a identidade atual prejudicar acessibilidade;
- a cor oficial não tiver contraste suficiente em determinado uso;
- a fonte oficial não estiver disponível e precisar de fallback seguro;
- o layout existente tiver problemas técnicos graves;
- o usuário pedir adaptação para nova campanha.

Mesmo nesses casos, o Claude Code deve explicar a decisão e preservar o máximo possível da identidade original.

---

## 6. Análise inicial obrigatória

Antes de aplicar identidade visual, o Claude Code deve responder internamente:

1. Qual é a marca?
2. Existe logo?
3. Existe fonte oficial?
4. Existem cores oficiais?
5. Existe CSS ou design system atual?
6. Existem imagens de referência?
7. Existem páginas já aprovadas?
8. Existe tom visual definido?
9. A marca é corporativa, premium, técnica, minimalista, popular, institucional ou comercial?
10. Há regras específicas do usuário?
11. Há riscos de acessibilidade com as cores?
12. Há riscos de performance com fontes ou imagens?
13. Há risco de quebrar layout existente?
14. O projeto exige compatibilidade com HostGator/public_html, PHP, HTML estático, React, Node ou outra stack?

---

## 7. Regras gerais para logotipo

O logotipo é um ativo institucional crítico.

### 7.1 Obrigatório

- preservar proporção;
- não distorcer;
- não achatar;
- não esticar;
- não rotacionar sem instrução;
- não recolorir sem autorização;
- não aplicar efeitos exagerados;
- não colocar sombra pesada sem necessidade;
- não cortar partes do logo;
- não recriar logo por aproximação;
- não substituir por texto genérico;
- usar versão adequada ao fundo;
- manter área de respiro;
- manter tamanho legível;
- usar `alt` adequado em sites.

### 7.2 Exemplo correto

```css
.logo img {
  width: 180px;
  height: auto;
  display: block;
}
```

### 7.3 Exemplo incorreto

```css
.logo img {
  width: 220px;
  height: 80px;
}
```

Se isso distorcer a proporção original.

### 7.4 Alt text

Exemplo:

```html
<img src="/assets/logo-scapini.svg" alt="[MARCA_1] Transportes">
```

---

## 8. Regras gerais para cores

Cores devem seguir a identidade da marca e manter contraste adequado.

### 8.1 Obrigatório

- usar cores da marca como base;
- criar variações apenas quando necessário;
- manter contraste em textos;
- não usar muitas cores concorrentes;
- não usar cor institucional como cor de erro se isso confundir;
- usar cores funcionais para erro, sucesso e alerta;
- não depender apenas de cor para comunicar estado;
- não mudar paleta da marca sem justificativa.

### 8.2 Tokens recomendados

```css
:root {
  --brand-primary: #000000;
  --brand-primary-dark: #000000;
  --brand-secondary: #000000;
  --brand-accent: #000000;

  --color-background: #ffffff;
  --color-surface: #f7f7f7;
  --color-text: #111111;
  --color-text-muted: #666666;
  --color-border: #e5e5e5;

  --color-error: #b42318;
  --color-success: #157f3b;
  --color-warning: #b7791f;
}
```

Adaptar aos valores reais da marca.

---

## 9. Regras gerais para fontes

A fonte deve respeitar a identidade da marca quando conhecida.

### 9.1 Obrigatório

- usar fonte oficial quando especificada;
- usar fallback seguro;
- evitar muitas fontes;
- garantir legibilidade;
- não usar fonte decorativa em textos longos;
- não trocar fonte da marca sem justificativa;
- não carregar fontes externas desnecessárias;
- não quebrar performance por excesso de pesos.

### 9.2 Exemplo

```css
:root {
  --font-primary: "Exo 2", Arial, sans-serif;
}
```

### 9.3 Fallback

Se a fonte não estiver disponível:

- usar fallback semelhante;
- não quebrar layout;
- não depender de CDN externa sem necessidade;
- respeitar segurança e performance.

---

## 10. [MARCA_1] Transportes

Quando o projeto envolver [MARCA_1] Transportes, aplicar as regras abaixo.

### 10.1 Fonte

Fonte preferencial:

```text
Exo 2
```

A fonte deve ser usada em materiais visuais, prompts e interfaces institucionais da [MARCA_1], sempre que tecnicamente possível.

### 10.2 Estilo visual

A identidade deve transmitir:

- força corporativa;
- confiança;
- logística;
- transformação;
- modernidade;
- solidez;
- movimento;
- precisão;
- premium institucional.

Direção visual:

```text
corporativo forte, moderno, limpo, premium
```

### 10.3 Cores

Usar base ligada ao vermelho institucional.

Referências recorrentes:

```text
vermelho principal próximo de #E20E17
vermelho escuro próximo de #AD1917
```

Ajustar conforme arquivos oficiais reais do projeto.

### 10.4 Logotipo

- preservar proporções;
- não distorcer;
- não recolorir sem instrução;
- manter boa área de respiro;
- não usar logo grande demais sem necessidade;
- não repetir logo excessivamente.

### 10.5 Uso em interface

Botões principais podem usar vermelho institucional, desde que haja contraste.

CTAs devem ser fortes, mas não agressivos.

Elementos visuais podem usar:

- diagonais;
- linhas de movimento;
- blocos geométricos;
- fundos claros ou escuros premium;
- detalhes em vermelho;
- ícones lineares;
- fotos de frota quando disponíveis.

### 10.6 Cuidados

- não criar visual genérico de transportadora;
- não usar caminhão genérico se houver imagem real;
- não alterar layout real de caminhões em imagens de referência;
- não alterar logos aplicados em veículos;
- não inventar certificações;
- não inventar números;
- não descaracterizar a marca.

---

## 11. [MARCA_2]

Quando o projeto envolver [MARCA_2], aplicar as regras abaixo.

### 11.1 Fonte

Fonte preferencial:

```text
Montserrat
```

A fonte deve ser usada em materiais visuais, prompts e interfaces institucionais da [MARCA_2], sempre que tecnicamente possível.

### 11.2 Estilo visual

A identidade deve transmitir:

- técnica;
- segurança;
- transporte especializado;
- precisão;
- operação;
- confiabilidade;
- experiência;
- robustez;
- organização;
- premium corporativo.

Direção visual:

```text
corporativo, técnico, premium, limpo
```

### 11.3 Cores

Usar as cores da logo como base visual.

Quando houver campanhas com criticidade, é permitido usar cores funcionais, como:

- vermelho para alerta;
- amarelo ou laranja para atenção;
- verde para estado positivo ou leve.

Mas o layout geral deve continuar respeitando a identidade da [MARCA_2].

### 11.4 Logotipo

- preservar proporções;
- não distorcer;
- não recolorir sem instrução;
- não aplicar efeitos exagerados;
- manter boa legibilidade;
- usar versão adequada ao fundo.

### 11.5 Uso em interface

Usar visual:

- limpo;
- técnico;
- informativo;
- bem organizado;
- com blocos claros;
- com hierarquia forte;
- com boa leitura mobile.

### 11.6 Cuidados

- não criar visual infantil ou informal demais;
- não alterar caminhões de referência;
- não alterar quantidade de rodas, lonas, tanques ou layout de frota;
- não distorcer logos nos veículos;
- não inventar dados operacionais;
- não descaracterizar operação de transporte líquido.

---

## 12. 365 Logística

Quando o projeto envolver 365 Logística, aplicar as regras abaixo.

### 12.1 Estilo visual

A identidade deve transmitir:

- tecnologia;
- logística inteligente;
- e-commerce;
- operação moderna;
- flexibilidade;
- integração;
- agilidade;
- ecossistema de soluções;
- first mile ao last mile.

### 12.2 Linguagem visual

Pode usar:

- elementos modulares;
- grid moderno;
- conexões;
- linhas de fluxo;
- ícones logísticos;
- visual tecnológico;
- cards de serviço;
- blocos claros de solução.

### 12.3 Cuidados

- não inventar clientes;
- não inventar números;
- não usar visual de transportadora tradicional se o posicionamento for mais tecnológico;
- preservar identidade existente do site quando houver.

---

## 13. [SUA_EMPRESA]

Quando o projeto envolver [SUA_EMPRESA], aplicar as regras abaixo.

### 13.1 Estilo visual

A identidade deve transmitir:

- minimalismo;
- estratégia;
- conversão;
- precisão;
- autoridade digital;
- tráfego pago;
- sites que vendem;
- clareza;
- modernidade.

### 13.2 Cores

Base preferencial:

```text
preto
branco
tons neutros
```

Evitar excesso de cores.

Usar cor apenas quando houver motivo claro ou elemento de portfólio.

### 13.3 Linguagem

Frases e posicionamento recorrente:

```text
Tráfego que atrai. Sites que convertem.
```

```text
Estratégias de tráfego pago para atrair clientes e sites que transformam visitas em vendas.
```

### 13.4 Cuidados

- não criar visual colorido demais;
- não usar efeitos exagerados;
- manter premium minimalista;
- preservar contraste;
- focar em conversão e clareza.

---

## 14. Blue Seguros

Quando o projeto envolver Blue Seguros, aplicar as regras abaixo.

### 14.1 Estilo visual

A identidade deve transmitir:

- confiança;
- proteção;
- clareza;
- segurança;
- orientação;
- tranquilidade;
- credibilidade.

### 14.2 Seguradoras parceiras conhecidas

Quando aplicável e se for verdadeiro no contexto do projeto, a Blue Seguros trabalha com seguradoras como:

- Allianz;
- Porto Seguro;
- MBM;
- Yelum;
- Tokio Marine;
- Aruana.

Não inventar seguradoras além das informadas.

### 14.3 Cuidados

- não prometer cobertura sem base;
- não inventar condições;
- não criar copy que pareça garantia absoluta;
- manter linguagem clara;
- preservar privacidade em formulários.

---

## 15. Cliente Saúde A

Quando o projeto envolver Cliente Saúde A, aplicar as regras abaixo.

### 15.1 Estilo visual

A identidade deve transmitir:

- cuidado;
- organização;
- profissionalismo;
- clareza;
- rotina clínica;
- acolhimento;
- praticidade;
- produto digital bem organizado.

### 15.2 Produtos recorrentes

Produtos associados:

- documentos para fisioterapeutas;
- planilha de controle financeiro;
- frequência de pacientes;
- agenda de atendimentos;
- documentos de avaliação;
- documentos indispensáveis para fisioterapia.

### 15.3 Cuidados

- manter visual coerente com paleta suave/feminina quando já existir;
- não inventar promessas;
- não usar linguagem médica inadequada;
- não afirmar garantia de resultado clínico;
- manter clareza de uso em Excel, Excel Online e Google Sheets quando aplicável.

---

## 16. GL Projetos / [Sócio GL]

Quando o projeto envolver GL Projetos, [Sócio GL] ou Terreno Seguro, aplicar as regras abaixo.

### 16.1 Dados conhecidos

Domínio:

```text
cliente-c.exemplo.com.br
```

CAU de [Sócio GL]:

```text
A65336-5
```

### 16.2 Estilo visual

A identidade deve transmitir:

- arquitetura;
- análise técnica;
- sofisticação;
- inteligência imobiliária;
- confiança;
- precisão;
- alto padrão;
- material editorial premium.

### 16.3 Cuidados importantes

Nos modelos de laudo, checklists e documentos técnicos do produto Terreno Seguro:

- não preencher dados profissionais de [Sócio GL] como responsável técnico quando o material for vendido para terceiros;
- deixar campos profissionais em branco ou editáveis para o comprador preencher;
- não inventar responsabilidade técnica;
- não criar promessa jurídica absoluta;
- manter linguagem técnica e cuidadosa.

---

## 17. Imagens de marca

Quando houver imagens de referência, o Claude Code deve respeitar ao máximo a aparência original.

### 17.1 Para veículos, caminhões e frota

Obrigatório preservar:

- modelo do veículo;
- cabine;
- proporções;
- quantidade de eixos;
- quantidade de rodas visíveis;
- lona;
- tanque;
- implemento;
- posicionamento do logo;
- cores;
- identidade visual;
- adesivos;
- características principais.

Não transformar caminhão real em caminhão genérico.

Não inventar layout de frota.

### 17.2 Para uniformes

Obrigatório preservar:

- posição correta do logo;
- proporção do bordado;
- cor da camisa;
- aparência realista;
- identidade da empresa.

Não ampliar logo de forma exagerada.

### 17.3 Para pessoas

Quando houver imagem de pessoa como referência, preservar aparência conforme instrução do usuário e respeitar segurança e privacidade aplicáveis.

---

## 18. Tom visual por tipo de marca

### 18.1 Corporativo premium

Usar:

- espaçamento generoso;
- tipografia forte;
- cores controladas;
- fotografia bem tratada;
- cards limpos;
- botões sólidos;
- sombras discretas;
- layout organizado.

Evitar:

- excesso de gradiente;
- muitos ícones;
- animação exagerada;
- visual infantil;
- visual genérico.

### 18.2 Técnico/informativo

Usar:

- blocos claros;
- hierarquia objetiva;
- ícones funcionais;
- tabelas legíveis;
- cores por criticidade;
- linguagem direta;
- boa leitura mobile.

Evitar:

- enfeites desnecessários;
- informação apertada;
- textos longos sem organização;
- excesso de cores.

### 18.3 Minimalista

Usar:

- preto, branco e neutros;
- grid forte;
- tipografia precisa;
- poucos efeitos;
- contraste;
- foco em mensagem.

Evitar:

- excesso visual;
- paleta muito colorida;
- elementos decorativos sem função.

---

## 19. Fidelidade de marca e design system

Esta skill deve trabalhar junto com `ui-minimal-design-system`.

A identidade da marca deve alimentar os tokens do design system.

Exemplo:

```css
:root {
  --brand-primary: #E20E17;
  --brand-primary-dark: #AD1917;
  --font-primary: "Exo 2", Arial, sans-serif;
}
```

Mas o Claude Code deve validar contraste e acessibilidade.

Se uma cor da marca não tiver contraste suficiente para texto, usar a cor em elementos gráficos e escolher uma variação acessível para texto/botão.

---

## 20. Fidelidade de marca e responsividade

A marca precisa permanecer consistente em mobile.

### 20.1 Regras

- logo não pode distorcer no mobile;
- cores não podem mudar sem motivo;
- fonte deve continuar legível;
- CTA deve manter identidade;
- cards devem preservar estilo;
- header mobile deve parecer da mesma marca;
- imagens não devem cortar elementos importantes;
- rodapé deve manter identidade e legibilidade.

---

## 21. Fidelidade de marca e acessibilidade

Identidade visual deve respeitar acessibilidade.

### 21.1 Regras

- se a cor da marca não tem contraste suficiente, usar variação mais escura/clara;
- não usar texto pequeno apenas para manter estética;
- não usar fonte estilizada em textos longos;
- não usar cor como única indicação;
- não esconder foco visível;
- não remover sublinhado de links em textos longos sem alternativa clara;
- manter navegação por teclado.

---

## 22. Fidelidade de marca e segurança

Identidade visual não pode esconder segurança.

### 22.1 Proibições

- não esconder links legais para manter visual limpo;
- não ocultar política de privacidade;
- não reduzir contraste de mensagens de erro;
- não remover consentimento;
- não disfarçar botão destrutivo como ação comum;
- não usar layout da marca para induzir clique enganoso;
- não inventar certificações;
- não inventar selos de segurança;
- não usar logos de parceiros sem confirmação;
- não usar depoimentos falsos.

---

## 23. Preservação de layouts existentes

Quando já existir uma interface, layout, página, componente, seção ou fluxo criado, o Claude Code não deve apagar tudo e refazer do zero automaticamente.

Antes de alterar identidade visual de um projeto existente, deve:

1. analisar estilos atuais;
2. identificar elementos da marca já aplicados;
3. identificar páginas já aprovadas;
4. identificar logo e cores usadas;
5. identificar fontes;
6. identificar componentes existentes;
7. identificar inconsistências;
8. propor melhorias incrementais;
9. preservar funcionalidades;
10. preservar segurança;
11. preservar responsividade;
12. preservar acessibilidade;
13. evitar refatoração completa sem justificativa.

### 23.1 Melhorias incrementais recomendadas

- corrigir logo distorcido;
- ajustar fonte para a oficial;
- mapear cores para tokens;
- padronizar botões;
- corrigir cards fora da identidade;
- ajustar espaçamentos;
- alinhar header e footer;
- melhorar contraste;
- revisar mobile;
- revisar imagens inconsistentes.

### 23.2 Proibição

Não substituir a identidade visual inteira sem autorização ou justificativa clara.

Não apagar layout aprovado para criar outro genérico.

---

## 24. Dados institucionais

Claude Code não deve inventar dados de marca.

### 24.1 Não inventar

- ano de fundação;
- número de clientes;
- número de entregas;
- certificações;
- selos;
- prêmios;
- seguradoras parceiras;
- clientes atendidos;
- frota;
- quantidade de veículos;
- unidades;
- depoimentos;
- resultados;
- garantias;
- dados técnicos.

Se não houver dado, usar formulação neutra ou pedir fonte quando necessário.

---

## 25. Checklist obrigatório

Antes de finalizar qualquer interface com marca, verificar:

- A marca foi identificada?
- O logo foi preservado?
- O logo está proporcional?
- As cores seguem a identidade?
- A fonte correta foi usada quando conhecida?
- O estilo visual combina com a marca?
- O layout não parece genérico?
- Os botões seguem a identidade?
- Os cards seguem a identidade?
- O header e footer seguem a identidade?
- O mobile preserva a marca?
- O contraste está adequado?
- Acessibilidade foi preservada?
- Segurança foi preservada?
- Privacidade/LGPD foi preservada?
- Nenhum dado institucional foi inventado?
- Nenhuma certificação foi inventada?
- Nenhum parceiro foi inventado?
- Nenhum logo de terceiro foi usado sem base?
- O layout existente foi preservado sempre que possível?

---

## 26. Checklist para logos

- Proporção preservada.
- Sem distorção.
- Sem corte.
- Sem recolorir sem autorização.
- Sem sombra exagerada.
- Sem efeito desnecessário.
- Tamanho adequado.
- Área de respiro.
- Boa legibilidade.
- Versão correta para fundo.
- Alt text adequado.
- Mobile preservado.

---

## 27. Checklist para cores

- Paleta baseada na marca.
- Contraste adequado.
- Cores funcionais para erro/sucesso/alerta.
- Sem excesso de cores.
- Sem cores genéricas conflitantes.
- Sem depender apenas de cor.
- Tokens definidos ou respeitados.
- Mobile preservado.

---

## 28. Checklist para fontes

- Fonte oficial usada quando conhecida.
- Fallback seguro.
- Boa legibilidade.
- Poucos pesos.
- Sem excesso de fontes.
- Tamanho adequado no mobile.
- Hierarquia clara.
- Não prejudica performance.

---

## 29. Checklist para imagens

- Imagens combinam com a marca.
- Veículos reais preservados.
- Logos em veículos preservados.
- Uniformes preservados.
- Pessoas não foram alteradas indevidamente.
- Imagens não distorcem no mobile.
- Alt text quando necessário.
- Performance considerada.
- Não usa banco de imagem genérico quando há referência real importante.

---

## 30. Integração com outras skills

Esta skill deve trabalhar junto com:

- `ui-visual-hierarchy`
- `ui-reading-patterns`
- `ui-gestalt-proximity`
- `ui-affordance-interactions`
- `ui-component-state-machine`
- `ui-conversion-landing-page`
- `ui-minimal-design-system`
- `ui-premium-responsive-design`
- `ui-final-design-review`

Fidelidade de marca não substitui:

- hierarquia;
- responsividade;
- acessibilidade;
- estados;
- segurança;
- revisão final.

Ela orienta como aplicar esses elementos sem descaracterizar a empresa.

---

## 31. Critérios de aceite

A aplicação desta skill será considerada correta quando:

- a interface parecer claramente pertencente à marca;
- logos forem preservados;
- cores forem coerentes;
- fontes forem respeitadas;
- imagens não descaracterizarem ativos reais;
- o layout for profissional e consistente;
- não houver dados inventados;
- acessibilidade for preservada;
- segurança for preservada;
- performance não for prejudicada;
- layouts existentes forem evoluídos, não destruídos;
- a marca se mantiver consistente em desktop e mobile.

---

## 32. Resumo operacional para o Claude Code

Ao criar ou revisar uma interface com marca:

1. Identificar a marca.
2. Procurar logo, cores, fontes e padrões existentes.
3. Verificar regras específicas do projeto.
4. Preservar logotipo.
5. Definir ou reutilizar tokens de marca.
6. Aplicar fonte correta quando conhecida.
7. Manter estilo visual coerente.
8. Não inventar dados.
9. Não descaracterizar imagens reais.
10. Garantir contraste e acessibilidade.
11. Garantir responsividade.
12. Garantir segurança.
13. Preservar layout existente.
14. Aplicar mudanças incrementais.
15. Executar revisão final.

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
