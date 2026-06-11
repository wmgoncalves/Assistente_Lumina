---
name: ui-minimal-design-system
description: Design system minimo viavel - tokens (cores, tipografia, espacamento, sombras, raios), primitivas (botao, input, card) e regras de consistencia. Use ao iniciar projeto novo OU consolidar projeto existente com estilos espalhados. Evita CSS duplicado e estilos inventados a cada pagina.
---

# ui-minimal-design-system


Arquivo sugerido: `ui-minimal-design-system.md`

## 1. Objetivo da skill

Esta skill orienta o Claude Code a criar, respeitar ou melhorar um **design system mínimo** para sites, landing pages, sistemas, dashboards e componentes digitais.

O objetivo é garantir consistência visual sem transformar o projeto em algo complexo, pesado ou difícil de manter.

Um design system mínimo deve organizar:

- cores;
- tipografia;
- espaçamentos;
- grid;
- botões;
- links;
- inputs;
- cards;
- bordas;
- sombras;
- estados;
- breakpoints;
- tokens visuais;
- padrões de layout;
- componentes base.

Esta skill é especialmente importante para evitar interfaces com aparência improvisada, onde cada seção parece ter sido feita com um estilo diferente.

---

## 2. Regra principal

Antes de criar novos estilos, o Claude Code deve verificar se já existe um padrão visual no projeto.

Deve analisar:

- CSS global;
- variáveis CSS;
- tokens;
- Tailwind config, se houver;
- componentes existentes;
- botões já criados;
- cards já criados;
- inputs já criados;
- fontes já usadas;
- cores da marca;
- arquivos de tema;
- design system existente;
- páginas já aprovadas.

Se já existir padrão visual funcional, o Claude Code deve complementar e reutilizar.

Não deve criar um design system paralelo sem necessidade.

---

## 3. Prioridade absoluta

Design system não pode passar por cima de segurança, acessibilidade, performance ou compatibilidade do projeto.

Prioridade:

1. Segurança
2. Privacidade / LGPD
3. Acessibilidade
4. Performance
5. Manutenibilidade
6. Compatibilidade com a stack
7. Consistência visual
8. UI/UX
9. Conversão
10. Estética visual

Se uma decisão visual exigir dependência insegura, CDN desnecessária, script externo ou alteração perigosa, ela deve ser rejeitada.

---

## 4. Quando usar esta skill

Usar esta skill sempre que o Claude Code criar, revisar ou alterar:

- site institucional;
- landing page;
- página de serviço;
- página de venda;
- sistema administrativo;
- dashboard;
- área logada;
- página com formulário;
- biblioteca de componentes;
- layout base;
- tema visual;
- CSS global;
- componentes reutilizáveis;
- padrões de botão;
- padrões de card;
- padrões de input;
- responsividade;
- identidade visual de marca.

---

## 5. Quando não aplicar de forma rígida

Não forçar novo design system quando:

- o projeto já tem design system maduro;
- o usuário pediu apenas ajuste pontual;
- o layout existente funciona bem;
- a alteração pode quebrar o projeto;
- a stack não comporta abstração complexa;
- o projeto é muito pequeno e só precisa de ajustes simples;
- a prioridade atual é correção funcional ou segurança;
- o ambiente de deploy não suporta ferramentas adicionais.

Nesses casos, aplicar apenas o mínimo necessário.

---

## 6. Conceito essencial

Um design system mínimo não é uma biblioteca gigante.

É um conjunto de decisões reutilizáveis para evitar inconsistência.

Exemplo:

Em vez de cada botão ter um estilo diferente:

```css
.botao-vermelho-grande { ... }
.btn2 { ... }
.cta-home { ... }
.button-final { ... }
```

Preferir padrões claros:

```css
.button
.button-primary
.button-secondary
.button-danger
.button-ghost
```

Em vez de cores soltas:

```css
#f00
#e20e17
red
rgb(220, 0, 0)
```

Preferir tokens:

```css
--color-primary
--color-primary-dark
--color-text
--color-background
--color-border
```

---

## 7. Análise inicial obrigatória

Antes de criar tokens ou componentes, o Claude Code deve responder internamente:

1. Já existe identidade visual?
2. Já existem cores definidas?
3. Já existem fontes definidas?
4. Já existe CSS global?
5. Já existem componentes reutilizáveis?
6. Já existe padrão de botão?
7. Já existe padrão de formulário?
8. Já existe padrão de card?
9. Já existe padrão de responsividade?
10. Existe risco de quebrar estilos existentes?
11. O projeto usa HTML/CSS simples, PHP, React, Tailwind ou outra stack?
12. O ambiente de deploy limita alguma abordagem?

---

## 8. Tokens mínimos recomendados

Um design system mínimo deve considerar tokens para:

```text
cores
tipografia
espaçamento
raio de borda
sombra
bordas
z-index
breakpoints
transições
largura máxima
estados
```

Nem todo projeto precisa formalizar todos, mas o Claude Code deve tentar manter consistência.

---

## 9. Tokens de cores

### 9.1 Cores básicas

Recomenda-se definir:

```text
--color-primary
--color-primary-hover
--color-primary-dark
--color-secondary
--color-background
--color-surface
--color-text
--color-text-muted
--color-border
--color-error
--color-success
--color-warning
--color-info
```

### 9.2 Exemplo CSS

```css
:root {
  --color-primary: #E20E17;
  --color-primary-dark: #AD1917;
  --color-background: #ffffff;
  --color-surface: #f7f7f8;
  --color-text: #111111;
  --color-text-muted: #5f6368;
  --color-border: #e5e7eb;
  --color-error: #b42318;
  --color-success: #157f3b;
  --color-warning: #b7791f;
}
```

### 9.3 Regras

- Não usar muitas cores.
- Não criar cor nova para cada seção.
- Garantir contraste.
- Usar cores da marca quando houver.
- Usar cores funcionais para erro, sucesso e alerta.
- Não depender apenas de cor para comunicar estado.
- Não recolorir logotipo sem autorização.
- Não usar cor da marca em mensagens de erro se isso confundir.

---

## 10. Tokens de tipografia

### 10.1 Definir

```text
--font-primary
--font-secondary, se necessário
--font-size-xs
--font-size-sm
--font-size-base
--font-size-md
--font-size-lg
--font-size-xl
--font-size-2xl
--font-size-3xl
--font-size-4xl
--line-height-tight
--line-height-normal
--line-height-relaxed
--font-weight-regular
--font-weight-medium
--font-weight-semibold
--font-weight-bold
```

### 10.2 Exemplo CSS

```css
:root {
  --font-primary: "Montserrat", Arial, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.5rem;
  --font-size-2xl: 2rem;
  --font-size-3xl: 2.75rem;
  --line-height-tight: 1.12;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.7;
}
```

### 10.3 Regras

- Evitar muitas fontes.
- Usar no máximo uma ou duas famílias tipográficas.
- Respeitar fonte da marca quando conhecida.
- Manter leitura confortável em mobile.
- Não usar textos muito pequenos.
- Não usar caixa alta em blocos longos.
- Manter hierarquia clara entre H1, H2, H3 e corpo.

---

## 11. Regras de marca conhecidas

Quando aplicável, respeitar as marcas conhecidas.

### 11.1 [MARCA_1] Transportes

- Fonte preferencial: Exo 2.
- Estilo: corporativo forte, moderno, limpo e premium.
- Cores principais ligadas ao vermelho institucional.
- Preservar logo sem distorção.
- Não alterar proporções do logo.
- Não criar identidade visual genérica fora da marca.

Exemplo:

```css
:root {
  --font-primary: "Exo 2", Arial, sans-serif;
  --color-primary: #E20E17;
  --color-primary-dark: #AD1917;
}
```

### 11.2 [MARCA_2]

- Fonte preferencial: Montserrat.
- Estilo: corporativo, técnico, premium e limpo.
- Usar cores da logo como base.
- Preservar logo sem distorção.
- Não criar visual fora da identidade.

Exemplo:

```css
:root {
  --font-primary: "Montserrat", Arial, sans-serif;
}
```

### 11.3 [SUA_EMPRESA]

- Estilo minimalista.
- Base preto, branco e tons neutros.
- Foco em tráfego, sites e conversão.
- Evitar excesso de cores.
- Visual limpo, direto e forte.

---

## 12. Tokens de espaçamento

Espaçamento deve ser consistente.

### 12.1 Escala recomendada

```css
:root {
  --space-2xs: 0.25rem;
  --space-xs: 0.5rem;
  --space-sm: 0.75rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  --space-3xl: 4rem;
  --space-4xl: 6rem;
}
```

### 12.2 Regras

- Usar espaçamentos consistentes.
- Evitar valores aleatórios.
- Usar gaps maiores entre seções.
- Usar gaps menores dentro de grupos.
- Manter respiro em mobile.
- Evitar layout apertado.
- Não reduzir espaçamento de mensagens legais até ficarem ilegíveis.

---

## 13. Tokens de borda e raio

### 13.1 Exemplo

```css
:root {
  --radius-sm: 0.375rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-pill: 999px;
  --border-width: 1px;
}
```

### 13.2 Regras

- Usar raio de borda coerente.
- Não misturar cantos retos, muito arredondados e circulares sem critério.
- Botões podem usar radius pill quando combinar com a marca.
- Cards geralmente usam radius médio ou grande.
- Inputs devem ter raio consistente com botões e cards.

---

## 14. Tokens de sombra

### 14.1 Exemplo

```css
:root {
  --shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 12px 30px rgba(0, 0, 0, 0.10);
  --shadow-lg: 0 24px 60px rgba(0, 0, 0, 0.14);
}
```

### 14.2 Regras

- Usar sombra com moderação.
- Não criar sombras exageradas.
- Evitar sombra forte em todos os elementos.
- Usar elevação para hierarquia.
- Garantir que sombra não substitua contraste.
- Em temas escuros, adaptar sombra ou usar bordas/contraste.

---

## 15. Tokens de transição

### 15.1 Exemplo

```css
:root {
  --transition-fast: 120ms ease;
  --transition-base: 180ms ease;
  --transition-slow: 260ms ease;
}
```

### 15.2 Regras

- Usar transições leves.
- Não animar tudo.
- Evitar animações longas.
- Respeitar preferências de redução de movimento quando aplicável.
- Não usar dependência externa para transições simples.

---

## 16. Layout e container

### 16.1 Tokens recomendados

```css
:root {
  --container-sm: 720px;
  --container-md: 960px;
  --container-lg: 1180px;
  --container-xl: 1320px;
  --page-padding: 1rem;
}
```

### 16.2 Regras

- Definir largura máxima de conteúdo.
- Evitar texto muito largo.
- Garantir padding lateral no mobile.
- Evitar elementos colados nas bordas.
- Usar grid consistente.
- Evitar overflow horizontal.

---

## 17. Breakpoints

### 17.1 Breakpoints recomendados

```text
360px — mobile pequeno
480px — mobile comum
768px — tablet
1024px — notebook
1280px — desktop
1440px — desktop amplo
```

### 17.2 Regras

- Não depender de desktop primeiro quando o público usa mobile.
- Testar 360px.
- Evitar rolagem horizontal.
- Ajustar grids.
- Ajustar tamanho de fontes.
- Ajustar CTA.
- Ajustar menus.
- Ajustar formulários.

---

## 18. Componentes mínimos

Um design system mínimo deve padronizar pelo menos:

```text
button
link
input
textarea
select
checkbox
radio
card
badge
alert
modal
section
container
grid
navbar
footer
```

Nem todos precisam ser criados como arquivos separados. Em projetos simples, podem ser classes CSS reutilizáveis.

---

## 19. Botões

### 19.1 Variantes mínimas

```text
.button
.button-primary
.button-secondary
.button-ghost
.button-danger
.button-link
```

### 19.2 Estados mínimos

```text
default
hover
focus
active
disabled
loading
```

### 19.3 Regras

- Botão principal deve ser claro.
- Botão secundário não deve competir.
- Botão destrutivo deve ser diferenciado.
- Todo botão deve ter foco visível.
- Todo botão clicável deve ter cursor pointer.
- Botão disabled não deve permitir ação.
- Loading deve aparecer em ações assíncronas.
- Não usar muitos estilos de botão.

---

## 20. Links

### 20.1 Regras

- Links em texto devem parecer links.
- Não depender apenas de cor.
- Usar sublinhado quando estiver em parágrafo.
- Links externos com nova aba devem usar `rel="noopener noreferrer"`.
- Links legais devem ser visíveis.
- Não mascarar destino.
- Não usar “clique aqui” quando houver texto melhor.

---

## 21. Inputs e formulários

### 21.1 Componentes mínimos

```text
.form-group
.label
.input
.textarea
.select
.checkbox
.radio
.field-help
.field-error
.form-message
```

### 21.2 Regras

- Labels visíveis.
- Placeholder não substitui label.
- Erro perto do campo.
- Focus visível.
- Estado disabled claro.
- Estado readonly claro.
- Campos obrigatórios indicados.
- Consentimento claro.
- Política de privacidade acessível.
- Validação segura preservada.

---

## 22. Cards

### 22.1 Regras

- Usar cards para unidades de conteúdo.
- Manter espaçamento interno consistente.
- Título, texto e ação dentro do card.
- Cards clicáveis devem ter hover e focus.
- Cards não clicáveis não devem parecer clicáveis.
- Evitar excesso de sombra.
- Evitar cards apertados.
- Manter altura e alinhamento coerentes quando necessário.

---

## 23. Alertas e mensagens

### 23.1 Variantes mínimas

```text
.alert-info
.alert-success
.alert-warning
.alert-error
```

### 23.2 Regras

- Não depender apenas de cor.
- Usar texto claro.
- Erros não devem expor informações internas.
- Sucesso só após confirmação real.
- Alertas importantes devem ter contraste.
- Mensagens devem ficar próximas do contexto afetado.

---

## 24. Badges e selos

### 24.1 Uso adequado

Usar para:

- status;
- categoria;
- destaque;
- certificação;
- novidade;
- ativo/inativo;
- prioridade;
- tipo de serviço.

### 24.2 Regras

- Não exagerar na quantidade.
- Não usar badge como decoração vazia.
- Garantir contraste.
- Usar texto curto.
- Não depender apenas de cor para status.

---

## 25. Modais

### 25.1 Regras

- Ter título claro.
- Ter botão de fechar.
- Gerenciar foco.
- Ter ação principal e secundária claras.
- Confirmar ações destrutivas.
- Não esconder informações legais.
- Não prender usuário sem saída.
- Funcionar no mobile.

---

## 26. Sistema de grid

### 26.1 Regras

- Usar grid para organizar, não para poluir.
- Evitar muitas colunas em mobile.
- Usar gaps consistentes.
- Manter alinhamento.
- Não quebrar ordem semântica.
- Não criar layout que dependa apenas de posição visual.

---

## 27. Preservação de estilos existentes

Quando já existir CSS, tema, design system ou layout criado, o Claude Code não deve apagar tudo e refazer do zero automaticamente.

Antes de alterar o design system existente, deve:

1. analisar arquivos atuais;
2. identificar tokens existentes;
3. identificar classes reutilizáveis;
4. identificar estilos duplicados;
5. identificar padrões já aprovados;
6. identificar inconsistências reais;
7. propor melhorias por partes;
8. preservar compatibilidade;
9. evitar quebrar páginas existentes;
10. testar visualmente e funcionalmente quando possível.

### 27.1 Melhorias incrementais recomendadas

- criar tokens sem remover estilos antigos imediatamente;
- mapear cores soltas para tokens;
- padronizar botões aos poucos;
- padronizar cards aos poucos;
- padronizar inputs aos poucos;
- reduzir duplicação;
- preservar nomes de classes usados por JavaScript;
- evitar mudanças globais agressivas.

### 27.2 Proibição

Não substituir todo CSS do projeto por um novo design system sem necessidade.

Não apagar classes existentes sem verificar uso.

Não trocar framework visual sem justificativa.

---

## 28. Compatibilidade por stack

### 28.1 HTML/CSS/JS simples

Preferir:

- variáveis CSS;
- classes utilitárias simples;
- componentes HTML semânticos;
- JavaScript leve;
- sem build obrigatório.

### 28.2 PHP em hospedagem compartilhada

Preferir:

- CSS estático;
- JS simples;
- includes PHP quando necessário;
- compatibilidade com `public_html`;
- sem Node.js em produção;
- sem pipeline obrigatório.

### 28.3 React/Node

Preferir:

- componentes reutilizáveis;
- tokens no tema;
- CSS modules, Tailwind ou solução já existente;
- não trocar stack sem necessidade;
- não adicionar biblioteca visual pesada sem análise.

### 28.4 Tailwind

Se o projeto já usa Tailwind:

- respeitar `tailwind.config`;
- usar classes consistentes;
- evitar estilos inline excessivos;
- criar componentes reutilizáveis quando necessário.

### 28.5 Sem stack definida

Analisar antes de decidir.

Não assumir React, Node ou Tailwind se o projeto é HTML/PHP simples.

---

## 29. Segurança

Design system não pode enfraquecer segurança.

### 29.1 Proibições

- Não adicionar CDN externa sem necessidade.
- Não instalar pacote visual suspeito.
- Não remover validação.
- Não esconder mensagens de erro.
- Não remover links legais.
- Não alterar formulários de forma insegura.
- Não expor secrets em variáveis frontend.
- Não colocar tokens em CSS/JS público.
- Não substituir controles reais por aparência visual.
- Não usar estilos para esconder problemas de segurança.

### 29.2 Dependências

Antes de adicionar dependência, verificar:

- necessidade real;
- manutenção;
- popularidade;
- histórico;
- licença;
- impacto no bundle;
- compatibilidade;
- segurança;
- alternativa nativa.

---

## 30. Acessibilidade

O design system deve facilitar acessibilidade.

### 30.1 Regras

- contraste adequado;
- foco visível;
- labels visíveis;
- links reconhecíveis;
- estados não dependem apenas de cor;
- tipografia legível;
- área de toque adequada;
- headings coerentes;
- componentes navegáveis por teclado;
- mensagens de erro claras;
- modais com foco gerenciado.

### 30.2 Tokens de foco

Definir padrão de foco.

Exemplo:

```css
:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 3px;
}
```

Não remover outline sem substituto.

---

## 31. Performance

Um design system mínimo deve deixar o projeto mais leve, não mais pesado.

### 31.1 Regras

- evitar CSS gigante sem uso;
- evitar bibliotecas desnecessárias;
- evitar múltiplas fontes externas;
- evitar animações pesadas;
- evitar sombras complexas em muitos elementos;
- evitar carrosséis pesados;
- evitar duplicação de estilos;
- reutilizar classes;
- otimizar imagens;
- manter CSS organizado.

---

## 32. Exemplos práticos

### 32.1 CSS base simplificado

```css
:root {
  --font-primary: Arial, sans-serif;

  --color-primary: #111111;
  --color-background: #ffffff;
  --color-surface: #f7f7f7;
  --color-text: #111111;
  --color-text-muted: #666666;
  --color-border: #e5e5e5;
  --color-error: #b42318;
  --color-success: #157f3b;

  --space-xs: 0.5rem;
  --space-sm: 0.75rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;

  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-pill: 999px;

  --transition-base: 180ms ease;
}

body {
  font-family: var(--font-primary);
  color: var(--color-text);
  background: var(--color-background);
}

.container {
  width: min(100% - 2rem, 1180px);
  margin-inline: auto;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  border-radius: var(--radius-pill);
  padding: 0.875rem 1.25rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform var(--transition-base), opacity var(--transition-base);
}

.button:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}

.button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
```

### 32.2 Estrutura HTML com classes reutilizáveis

```html
<section class="section">
  <div class="container">
    <div class="section-header">
      <p class="eyebrow">Soluções</p>
      <h2>Serviços pensados para sua operação</h2>
      <p class="section-description">
        Conheça as principais soluções disponíveis para sua empresa.
      </p>
    </div>

    <div class="card-grid">
      <article class="card">
        <h3>Serviço principal</h3>
        <p>Descrição objetiva do benefício.</p>
        <a class="text-link" href="/servicos">Ver detalhes</a>
      </article>
    </div>
  </div>
</section>
```

---

## 33. Checklist obrigatório

Antes de finalizar alterações visuais, verificar:

- Existe padrão de cores?
- Existe padrão de fonte?
- Existe escala de espaçamento?
- Existe padrão de botão?
- Existe padrão de link?
- Existe padrão de input?
- Existe padrão de card?
- Estados de erro, sucesso e alerta são consistentes?
- Foco visível está definido?
- Mobile foi considerado?
- Classes existentes foram preservadas?
- IDs e hooks usados por JavaScript foram preservados?
- Não houve CSS duplicado desnecessário?
- Não foi criada dependência sem necessidade?
- Não foi adicionada CDN desnecessária?
- Contraste está adequado?
- Marca foi respeitada?
- Layout existente não foi destruído?
- Segurança não foi enfraquecida?

---

## 34. Checklist para projetos existentes

Antes de mexer em projeto já criado:

- Mapear arquivos CSS existentes.
- Mapear componentes existentes.
- Mapear páginas que usam as classes.
- Identificar variáveis já existentes.
- Identificar estilos duplicados.
- Identificar riscos.
- Alterar por partes.
- Testar páginas principais.
- Testar mobile.
- Testar formulários.
- Testar interações.
- Confirmar que nada quebrou.

---

## 35. Integração com outras skills

Esta skill deve trabalhar junto com:

- `ui-visual-hierarchy`
- `ui-reading-patterns`
- `ui-gestalt-proximity`
- `ui-affordance-interactions`
- `ui-component-state-machine`
- `ui-conversion-landing-page`
- `ui-premium-responsive-design`
- `ui-brand-fidelity`
- `ui-final-design-review`

O design system mínimo fornece a base visual para todas as outras skills.

---

## 36. Critérios de aceite

A aplicação desta skill será considerada correta quando:

- o projeto tiver padrões visuais reutilizáveis;
- cores, fontes e espaçamentos forem consistentes;
- botões, inputs, cards e links tiverem padrões claros;
- estados forem visualmente consistentes;
- o design respeitar a marca;
- o mobile continuar funcional;
- acessibilidade for preservada;
- performance não for prejudicada;
- nenhuma dependência desnecessária for adicionada;
- nenhuma regra de segurança for enfraquecida;
- layouts existentes forem preservados sempre que possível.

---

## 37. Resumo operacional para o Claude Code

Ao criar ou revisar design system mínimo:

1. Analisar padrões existentes.
2. Identificar identidade visual.
3. Definir ou reutilizar tokens.
4. Padronizar cores.
5. Padronizar tipografia.
6. Padronizar espaçamentos.
7. Padronizar botões.
8. Padronizar links.
9. Padronizar inputs.
10. Padronizar cards.
11. Garantir estados.
12. Garantir acessibilidade.
13. Garantir responsividade.
14. Evitar dependências desnecessárias.
15. Preservar layouts existentes.
16. Aplicar mudanças incrementais.
17. Executar revisão final.

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
