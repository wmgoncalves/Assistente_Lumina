---
name: ui-premium-responsive-design
description: Responsividade premium - mobile-first, breakpoints racionais, touch targets, layouts que respiram em mobile/tablet/desktop. Use em qualquer interface - landing page, dashboard, formulario, e-commerce, painel admin. Cobre Web Vitals, fontes responsivas e padroes mobile especificos.
---

# ui-premium-responsive-design


Arquivo sugerido: `ui-premium-responsive-design.md`

## 1. Objetivo da skill

Esta skill orienta o Claude Code a criar, revisar e melhorar interfaces responsivas com qualidade premium em desktop, notebook, tablet e celular.

O objetivo é garantir que sites, landing pages, sistemas, formulários, dashboards e componentes digitais funcionem bem em diferentes tamanhos de tela, sem perda de clareza, usabilidade, acessibilidade, segurança ou performance.

Uma interface responsiva premium não é apenas uma interface que “cabe” no celular.

Ela precisa:

- manter hierarquia visual;
- preservar clareza da mensagem;
- manter CTA acessível;
- evitar rolagem horizontal;
- manter textos legíveis;
- garantir toque confortável;
- reorganizar grids corretamente;
- manter formulários fáceis de preencher;
- preservar estados de loading, erro e sucesso;
- respeitar identidade visual;
- preservar segurança e privacidade;
- funcionar bem em telas pequenas, médias e grandes.

---

## 2. Regra principal

Toda interface deve ser pensada para funcionar bem em mobile, tablet e desktop.

Antes de finalizar qualquer página ou componente, o Claude Code deve verificar pelo menos:

```text
360px — mobile pequeno
375px / 390px — mobile comum
480px — mobile amplo
768px — tablet
1024px — notebook
1280px — desktop
1440px ou mais — desktop amplo
```

A interface não pode ser considerada pronta se funcionar apenas em desktop.

---

## 3. Prioridade absoluta

Responsividade não pode quebrar segurança, privacidade, acessibilidade, performance ou funcionalidades existentes.

Prioridade:

1. Segurança
2. Privacidade / LGPD
3. Acessibilidade
4. Performance
5. Manutenibilidade
6. Compatibilidade com o ambiente de deploy
7. Clareza da informação
8. Responsividade
9. UI/UX
10. Estética visual

Se uma solução responsiva exigir remover validações, esconder avisos legais, ocultar mensagens de erro, quebrar formulário, adicionar biblioteca desnecessária ou comprometer acessibilidade, ela deve ser rejeitada.

---

## 4. Quando usar esta skill

Usar esta skill sempre que o Claude Code criar, revisar ou modificar:

- site institucional;
- landing page;
- página de serviço;
- página de venda;
- página de captura;
- formulário;
- menu;
- header;
- footer;
- hero section;
- cards;
- grids;
- carrosséis;
- tabelas;
- dashboards;
- área administrativa;
- modais;
- componentes reutilizáveis;
- páginas com imagens;
- páginas com vídeos;
- páginas com CTAs;
- páginas com integração WhatsApp;
- páginas com política de privacidade ou cookies.

---

## 5. Quando não aplicar de forma exagerada

Não criar complexidade responsiva desnecessária quando:

- o ajuste é pontual;
- o projeto é simples;
- o layout atual já funciona;
- uma media query pequena resolve;
- a stack não comporta ferramentas complexas;
- o ambiente de deploy é simples;
- adicionar framework seria excesso;
- a alteração responsiva poderia quebrar componentes existentes.

Responsividade premium deve ser prática, segura e sustentável.

---

## 6. Conceito essencial

Responsividade premium é a combinação de:

- layout fluido;
- hierarquia adaptável;
- tipografia legível;
- espaçamento proporcional;
- imagens flexíveis;
- grids que se reorganizam;
- navegação utilizável;
- formulários confortáveis;
- CTAs acessíveis;
- estados visíveis;
- performance adequada;
- acessibilidade preservada.

Não basta usar `width: 100%`.

É necessário pensar na experiência real em cada tela.

---

## 7. Abordagem recomendada

### 7.1 Mobile-first quando fizer sentido

Para projetos novos, preferir abordagem mobile-first:

```css
.card-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### 7.2 Desktop-first em projeto existente

Se o projeto existente já foi feito desktop-first, não reescrever tudo automaticamente.

Melhorar por partes:

1. identificar quebras no mobile;
2. corrigir containers;
3. corrigir grids;
4. corrigir fontes;
5. corrigir CTAs;
6. corrigir formulários;
7. corrigir imagens;
8. corrigir menus;
9. testar novamente.

Não apagar o CSS inteiro para transformar em mobile-first sem justificativa.

---

## 8. Breakpoints recomendados

Breakpoints não devem ser usados de forma aleatória.

Sugestão base:

```text
360px — mobile pequeno
480px — mobile amplo
640px — transição mobile/tablet
768px — tablet
1024px — notebook
1280px — desktop
1440px — desktop amplo
```

### 8.1 CSS sugerido

```css
@media (min-width: 480px) {}
@media (min-width: 768px) {}
@media (min-width: 1024px) {}
@media (min-width: 1280px) {}
```

### 8.2 Regras

- Não criar breakpoints demais sem necessidade.
- Não usar media queries aleatórias para corrigir problemas isolados sem entender causa.
- Preferir layout fluido antes de muitos breakpoints.
- Testar 360px obrigatoriamente.
- Evitar valores fixos que estouram tela.

---

## 9. Containers e largura máxima

### 9.1 Regras

- Usar largura máxima para conteúdo.
- Garantir padding lateral no mobile.
- Evitar texto colado nas bordas.
- Evitar linhas de texto muito longas no desktop.
- Evitar containers fixos em pixels que quebram no mobile.

### 9.2 Exemplo

```css
.container {
  width: min(100% - 2rem, 1180px);
  margin-inline: auto;
}
```

### 9.3 Erros comuns

Evitar:

```css
.container {
  width: 1180px;
}
```

Isso pode gerar overflow horizontal em telas pequenas.

---

## 10. Tipografia responsiva

Textos devem se adaptar sem perder hierarquia.

### 10.1 Regras

- H1 não pode ficar gigante no mobile.
- Texto do corpo não pode ficar pequeno demais.
- Line-height deve favorecer leitura.
- Evitar blocos longos centralizados no mobile.
- Evitar texto justificado que gere buracos.
- Evitar quebra ruim de palavras importantes.
- Manter contraste adequado.

### 10.2 Exemplo com clamp

```css
.hero-title {
  font-size: clamp(2rem, 6vw, 4.5rem);
  line-height: 1.05;
}

.section-title {
  font-size: clamp(1.75rem, 4vw, 3rem);
  line-height: 1.15;
}

.body-text {
  font-size: clamp(1rem, 2vw, 1.125rem);
  line-height: 1.6;
}
```

### 10.3 Cuidados

- Não usar `clamp` sem testar extremos.
- Não deixar texto pequeno demais em 360px.
- Não deixar título quebrar em uma letra por linha.
- Ajustar largura do bloco de texto.

---

## 11. Espaçamento responsivo

Espaçamento deve reduzir no mobile sem deixar tudo apertado.

### 11.1 Exemplo

```css
.section {
  padding-block: clamp(3rem, 8vw, 7rem);
}

.stack {
  display: grid;
  gap: clamp(1rem, 3vw, 2rem);
}
```

### 11.2 Regras

- Seções precisam de respiro.
- Cards não podem ficar colados.
- Formulários precisam de espaço entre campos.
- CTAs precisam de área de toque.
- Rodapé precisa continuar legível.
- Avisos legais não devem ficar escondidos ou minúsculos.

---

## 12. Grids responsivos

Grids devem se reorganizar conforme largura.

### 12.1 Regras

- 3 ou 4 colunas no desktop podem virar 2 no tablet e 1 no mobile.
- Cards devem manter leitura.
- Gaps devem ser consistentes.
- Não criar cards estreitos demais.
- Não forçar colunas em mobile.
- Evitar overflow horizontal.

### 12.2 Exemplo

```css
.feature-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1100px) {
  .feature-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## 13. Hero responsivo

Hero section precisa ser excelente no mobile.

### 13.1 Desktop

Pode ter:

```text
Texto à esquerda
Imagem/formulário à direita
CTA abaixo do texto
Prova social próxima da promessa
```

### 13.2 Mobile

Reorganizar para:

```text
Logo
Promessa
Subtítulo
Prova social
CTA principal
Visual ou formulário
```

### 13.3 Regras

- Não colocar imagem antes da promessa se ela atrasar compreensão.
- Não esconder CTA.
- Não deixar hero com altura exagerada no mobile.
- Não usar vídeo pesado no hero sem necessidade.
- Não manter duas colunas apertadas no celular.
- Não deixar formulário estreito demais.
- Não quebrar logos.
- Não cortar texto importante.

---

## 14. CTAs responsivos

CTAs precisam ser fáceis de tocar e entender.

### 14.1 Regras

- Botão deve ter altura confortável.
- Texto do CTA deve caber.
- Botões próximos devem ter espaçamento.
- CTA principal deve continuar evidente.
- CTA secundário não deve competir.
- Em mobile, botões podem ocupar largura total quando fizer sentido.
- Não depender de hover no mobile.
- Manter focus visível.

### 14.2 Exemplo

```css
.cta-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

@media (max-width: 480px) {
  .cta-group {
    flex-direction: column;
  }

  .cta-group .button {
    width: 100%;
  }
}
```

---

## 15. Formulários responsivos

Formulários precisam ser fáceis de preencher no celular.

### 15.1 Regras

- Uma coluna no mobile.
- Labels visíveis.
- Inputs com altura confortável.
- Espaçamento claro entre campos.
- Erros próximos dos campos.
- Botão de envio visível.
- Loading visível.
- Sucesso e erro legíveis.
- Teclado mobile adequado com `type`.
- Não usar campos lado a lado em telas pequenas.
- Não esconder política de privacidade.
- Não colocar checkbox apertado.

### 15.2 Exemplo

```css
.form-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .form-grid.two-columns {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

### 15.3 Inputs mobile

Usar tipos corretos:

```html
<input type="email">
<input type="tel">
<input type="number">
<input type="url">
```

Isso melhora teclado e experiência no celular.

---

## 16. Menus responsivos

Menus precisam ser simples e acessíveis.

### 16.1 Desktop

Pode usar navegação horizontal.

### 16.2 Mobile

Pode usar:

- menu colapsado;
- botão hamburger;
- drawer;
- menu vertical;
- links principais;
- CTA destacado.

### 16.3 Regras

- botão de menu com label acessível;
- estado aberto/fechado claro;
- navegação por teclado;
- foco visível;
- não depender apenas de hover;
- não esconder links legais importantes;
- CTA não deve bloquear navegação;
- menu não deve causar overflow horizontal;
- menu deve fechar corretamente;
- não prender foco indevidamente.

---

## 17. Imagens responsivas

Imagens devem se adaptar sem distorção.

### 17.1 Regras

- usar `max-width: 100%`;
- usar `height: auto`;
- definir `alt` quando imagem for informativa;
- evitar imagens gigantes sem otimização;
- usar `object-fit` com cuidado;
- não cortar informação importante;
- não distorcer logos;
- não estourar container;
- usar lazy loading quando adequado.

### 17.2 Exemplo

```css
img {
  max-width: 100%;
  height: auto;
}

.hero-image img {
  width: 100%;
  object-fit: cover;
}
```

### 17.3 Logos

Logos devem preservar proporção.

Não usar:

```css
.logo {
  width: 200px;
  height: 80px;
}
```

Se isso distorcer.

Preferir:

```css
.logo {
  width: 180px;
  height: auto;
}
```

---

## 18. Vídeos responsivos

Vídeos podem prejudicar performance se usados sem cuidado.

### 18.1 Regras

- usar proporção adequada;
- evitar autoplay pesado;
- evitar vídeo grande no hero sem necessidade;
- permitir controle;
- usar poster;
- otimizar arquivo;
- não bloquear carregamento do CTA;
- respeitar acessibilidade;
- não depender do vídeo para transmitir informação essencial.

### 18.2 Container responsivo

```css
.video-wrapper {
  aspect-ratio: 16 / 9;
  width: 100%;
  overflow: hidden;
  border-radius: 1rem;
}

.video-wrapper iframe,
.video-wrapper video {
  width: 100%;
  height: 100%;
}
```

---

## 19. Tabelas responsivas

Tabelas são um dos maiores problemas em mobile.

### 19.1 Opções

Dependendo do caso:

- permitir scroll horizontal controlado;
- transformar linhas em cards;
- reduzir colunas;
- priorizar dados essenciais;
- usar filtros;
- usar detalhes expansíveis.

### 19.2 Regras

- Não deixar tabela estourar a página inteira.
- Não esconder dados importantes sem alternativa.
- Não remover ações essenciais.
- Não deixar botões de ação apertados.
- Não misturar ações destrutivas com ações comuns.
- Manter cabeçalhos compreensíveis.
- Preservar acessibilidade.

### 19.3 Scroll controlado

```css
.table-wrapper {
  width: 100%;
  overflow-x: auto;
}
```

Isso é melhor que deixar a página inteira com overflow horizontal.

---

## 20. Modais responsivos

Modais precisam funcionar em telas pequenas.

### 20.1 Regras

- largura adequada;
- altura máxima;
- rolagem interna quando necessário;
- botão fechar visível;
- foco gerenciado;
- ações visíveis;
- não cortar conteúdo;
- não esconder erro;
- não esconder confirmação;
- não depender de hover;
- não ficar maior que a tela.

### 20.2 Exemplo

```css
.modal {
  width: min(100% - 2rem, 560px);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
}
```

---

## 21. Carrosséis responsivos

Carrosséis devem ser usados com cuidado.

### 21.1 Regras

- controles visíveis;
- indicadores claros;
- toque funcional no mobile;
- setas acessíveis;
- não esconder conteúdo essencial;
- não usar autoplay agressivo;
- não depender apenas de arraste;
- não adicionar biblioteca pesada sem necessidade;
- manter performance.

### 21.2 Alternativa

Em muitos casos, no mobile é melhor usar lista vertical do que carrossel.

---

## 22. Estados responsivos

Estados precisam aparecer bem em todas as telas.

### 22.1 Estados a verificar

- loading;
- erro;
- sucesso;
- vazio;
- disabled;
- permissão negada;
- validação de campo;
- modal aberto;
- menu aberto;
- tabela sem dados.

### 22.2 Regras

- Mensagens não podem ficar cortadas.
- Erros precisam ficar próximos dos campos.
- Loading precisa ser visível.
- Sucesso precisa ser legível.
- Botão disabled precisa parecer desativado.
- Estados não devem depender apenas de cor.
- Estados devem funcionar em mobile.

---

## 23. Evitar overflow horizontal

Overflow horizontal indesejado é falha grave de responsividade.

### 23.1 Causas comuns

- containers com largura fixa;
- imagens sem `max-width`;
- tabelas sem wrapper;
- grids com colunas fixas;
- elementos absolute mal posicionados;
- botões largos demais;
- textos sem quebra;
- embeds sem responsividade;
- menus abertos fora da tela.

### 23.2 Correções

- usar `max-width: 100%`;
- usar `min-width: 0` em itens flex/grid;
- usar `overflow-x: auto` em tabelas;
- evitar `width: 100vw` em elementos com padding;
- usar containers fluidos;
- ajustar texto e botões.

### 23.3 Exemplo

```css
.grid-item {
  min-width: 0;
}

.long-text {
  overflow-wrap: anywhere;
}
```

---

## 24. Acessibilidade responsiva

Responsividade precisa preservar acessibilidade.

### 24.1 Regras

- foco visível em todas as telas;
- navegação por teclado;
- headings em ordem lógica;
- labels de formulário;
- contraste adequado;
- área de toque confortável;
- não depender apenas de hover;
- não esconder conteúdo essencial;
- menus acessíveis;
- modais acessíveis;
- mensagens de erro associadas;
- ordem visual e ordem HTML coerentes.

### 24.2 Área de toque

Elementos tocáveis devem ter área confortável.

Regras:

- botões não devem ser minúsculos;
- links em texto precisam de espaçamento;
- ações próximas precisam de separação;
- checkbox e radio precisam ser fáceis de tocar;
- ações destrutivas não devem ficar coladas em ações comuns.

---

## 25. Performance responsiva

Mobile geralmente tem conexão e processamento mais limitados.

### 25.1 Regras

- otimizar imagens;
- evitar vídeos pesados;
- evitar animações complexas;
- evitar bibliotecas desnecessárias;
- reduzir scripts;
- evitar carrosséis pesados;
- usar lazy loading quando adequado;
- evitar fontes demais;
- evitar sombras pesadas em muitos elementos;
- evitar elementos fixos que causam jank;
- evitar listeners excessivos.

---

## 26. Segurança em layouts responsivos

Responsividade não pode esconder segurança.

### 26.1 Não esconder no mobile

Nunca esconder:

- política de privacidade;
- termos de uso;
- aviso de cookies;
- consentimento;
- mensagens de erro;
- campos obrigatórios;
- confirmação de ação destrutiva;
- alertas de permissão;
- informações críticas;
- botões de cancelar ou voltar quando necessários.

### 26.2 Não quebrar formulários

Em mobile, não remover:

- validações;
- labels;
- erros;
- consentimento;
- botão de envio;
- estados de loading;
- estados de sucesso;
- estados de erro;
- proteção contra clique duplo.

---

## 27. Preservação de layouts existentes

Quando já existir uma interface, layout, página, componente, seção ou fluxo criado, o Claude Code não deve apagar tudo e refazer do zero automaticamente.

Antes de alterar responsividade de uma interface existente, deve:

1. analisar HTML atual;
2. analisar CSS atual;
3. identificar breakpoints existentes;
4. identificar classes usadas;
5. identificar scripts que dependem de classes ou IDs;
6. identificar quebras reais;
7. propor correções pontuais;
8. preservar o que funciona;
9. evitar refatoração completa sem justificativa;
10. testar se nada foi quebrado.

### 27.1 Melhorias incrementais recomendadas

Ao melhorar responsividade:

1. corrigir container;
2. corrigir overflow horizontal;
3. ajustar grids;
4. ajustar tipografia;
5. ajustar CTAs;
6. ajustar formulários;
7. ajustar imagens;
8. ajustar menus;
9. ajustar tabelas;
10. revisar estados;
11. testar mobile.

### 27.2 Proibição

Não substituir layout inteiro por uma nova versão apenas para resolver mobile.

Primeiro corrigir o que existe.

---

## 28. Compatibilidade com stacks

### 28.1 HTML/CSS/JS/PHP simples

Preferir:

- CSS nativo;
- media queries;
- Flexbox;
- CSS Grid;
- variáveis CSS;
- JavaScript simples;
- sem build obrigatório;
- compatível com hospedagem compartilhada.

### 28.2 React/Node

Preferir:

- componentes reutilizáveis;
- classes responsivas existentes;
- CSS Modules, Tailwind ou solução do projeto;
- não adicionar framework visual desnecessário.

### 28.3 Tailwind

Se o projeto usa Tailwind:

- usar breakpoints padrão do Tailwind;
- evitar classes exageradas sem organização;
- componentizar quando necessário;
- respeitar tema existente.

### 28.4 HostGator / public_html

Se o projeto for para HostGator compartilhada:

- não exigir Node.js em produção;
- não exigir processo de build em produção sem necessidade;
- manter arquivos estáticos compatíveis;
- usar PHP leve quando necessário;
- não criar stack complexa.

---

## 29. Exemplos práticos

### 29.1 Grid responsivo de cards

```css
.cards {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1100px) {
  .cards {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
```

### 29.2 Hero responsivo

```css
.hero {
  display: grid;
  gap: 2rem;
  align-items: center;
  padding-block: clamp(3rem, 8vw, 7rem);
}

@media (min-width: 960px) {
  .hero {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  }
}
```

### 29.3 Formulário responsivo

```css
.form-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .form-row.two-columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

### 29.4 Prevenção de overflow

```css
* {
  box-sizing: border-box;
}

img,
svg,
video,
canvas {
  max-width: 100%;
}

.grid > * {
  min-width: 0;
}
```

---

## 30. Checklist obrigatório

Antes de finalizar qualquer interface, verificar:

- Funciona em 360px?
- Funciona em 375px/390px?
- Funciona em 480px?
- Funciona em 768px?
- Funciona em 1024px?
- Funciona em 1280px?
- Não há overflow horizontal?
- O texto está legível?
- O CTA principal está visível?
- Botões são fáceis de tocar?
- Formulários são fáceis de preencher?
- Labels continuam visíveis?
- Erros aparecem perto dos campos?
- Loading, erro e sucesso aparecem corretamente?
- Imagens não distorcem?
- Logos não distorcem?
- Cards não ficam apertados?
- Menus funcionam no mobile?
- Tabelas não quebram a página?
- Modais cabem na tela?
- Links legais continuam visíveis?
- Consentimento continua visível?
- Acessibilidade foi preservada?
- Segurança foi preservada?
- Performance está adequada?
- O layout existente foi preservado sempre que possível?

---

## 31. Checklist para mobile

- Conteúdo principal aparece cedo.
- Promessa é compreensível.
- CTA aparece sem exigir rolagem excessiva.
- Texto não fica pequeno.
- Título não quebra de forma ruim.
- Botão tem área de toque.
- Cards ficam em uma coluna quando necessário.
- Formulário tem uma coluna.
- Menu abre e fecha corretamente.
- Rodapé é legível.
- Não depende de hover.
- Não tem elementos cortados.
- Não tem rolagem horizontal.

---

## 32. Checklist para tablet

- Layout não parece nem mobile esticado nem desktop apertado.
- Grids com 2 colunas quando adequado.
- CTAs continuam claros.
- Imagens mantêm proporção.
- Menus não quebram.
- Espaçamentos são equilibrados.
- Formulários podem ter 2 colunas se fizer sentido.
- Cards não ficam largos demais sem hierarquia.

---

## 33. Checklist para desktop

- Conteúdo não fica largo demais.
- Linhas de texto não ficam longas demais.
- Hero tem equilíbrio.
- Grids aproveitam espaço sem poluir.
- Imagens têm qualidade adequada.
- CTAs não ficam perdidos.
- Espaçamento não fica exagerado.
- Layout mantém identidade visual.

---

## 34. Integração com outras skills

Esta skill deve trabalhar junto com:

- `ui-visual-hierarchy`
- `ui-reading-patterns`
- `ui-gestalt-proximity`
- `ui-affordance-interactions`
- `ui-component-state-machine`
- `ui-conversion-landing-page`
- `ui-minimal-design-system`
- `ui-brand-fidelity`
- `ui-final-design-review`

Responsividade premium precisa preservar todas as outras camadas:

- hierarquia;
- leitura;
- proximidade;
- affordance;
- estados;
- conversão;
- design system;
- marca;
- segurança.

---

## 35. Critérios de aceite

A aplicação desta skill será considerada correta quando:

- a interface funcionar bem em mobile, tablet e desktop;
- não houver overflow horizontal indesejado;
- textos forem legíveis;
- CTAs forem acessíveis;
- formulários forem usáveis;
- menus funcionarem;
- imagens não distorcerem;
- logos forem preservados;
- estados forem visíveis;
- acessibilidade for preservada;
- performance for adequada;
- segurança não for enfraquecida;
- layouts existentes forem preservados sempre que possível;
- alterações forem incrementais e controladas.

---

## 36. Resumo operacional para o Claude Code

Ao criar ou revisar responsividade:

1. Identificar stack e CSS existente.
2. Verificar layout em mobile, tablet e desktop.
3. Corrigir overflow horizontal.
4. Ajustar containers.
5. Ajustar grids.
6. Ajustar tipografia.
7. Ajustar espaçamentos.
8. Ajustar CTAs.
9. Ajustar formulários.
10. Ajustar imagens e logos.
11. Ajustar menus.
12. Ajustar tabelas.
13. Ajustar modais.
14. Verificar estados.
15. Verificar acessibilidade.
16. Verificar segurança.
17. Preservar layout existente.
18. Fazer melhorias incrementais.
19. Executar revisão final.

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
