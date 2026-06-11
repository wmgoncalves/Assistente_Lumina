---
name: ui-final-design-review
description: Revisao final consolidada antes de publicar - checklist que combina seguranca, LGPD, acessibilidade, performance, hierarquia, leitura, Gestalt, affordance, estados, conversao, design system, responsividade, marca, preservacao. Use antes de publicar ou aprovar qualquer interface importante.
---

# ui-final-design-review


Arquivo sugerido: `ui-final-design-review.md`

## 1. Objetivo da skill

Esta skill orienta o Claude Code a executar uma **revisão final obrigatória** antes de concluir qualquer criação, alteração ou melhoria em interfaces digitais.

Ela serve como uma camada de controle de qualidade para garantir que o projeto esteja:

- visualmente profissional;
- coerente com a marca;
- responsivo;
- acessível;
- funcional;
- seguro;
- performático;
- claro para o usuário;
- orientado à conversão quando aplicável;
- preservando o que já existia e funcionava.

Esta skill deve ser usada como checklist final para:

- sites institucionais;
- landing pages;
- páginas de serviço;
- páginas de venda;
- páginas de captura;
- formulários;
- dashboards;
- sistemas administrativos;
- páginas com dados dinâmicos;
- componentes reutilizáveis;
- headers;
- footers;
- modais;
- menus;
- cards;
- tabelas;
- fluxos de WhatsApp;
- fluxos com API;
- qualquer interface criada ou alterada.

---

## 2. Regra principal

Antes de considerar uma interface pronta, o Claude Code deve revisar:

1. segurança;
2. privacidade / LGPD;
3. acessibilidade;
4. performance;
5. preservação do que já existia;
6. hierarquia visual;
7. padrão de leitura;
8. proximidade e agrupamento;
9. affordance;
10. estados de componentes;
11. responsividade;
12. design system;
13. fidelidade de marca;
14. conversão, quando aplicável;
15. qualidade final do código.

A revisão final deve detectar problemas antes da entrega.

---

## 3. Prioridade absoluta

A revisão visual final não pode ser apenas estética.

A ordem de prioridade é:

1. Segurança
2. Privacidade / LGPD
3. Acessibilidade
4. Performance
5. Manutenibilidade
6. Compatibilidade com deploy
7. Funcionalidade
8. Clareza da informação
9. UI/UX
10. Conversão
11. Estética visual

Se o design estiver bonito, mas inseguro, inacessível, lento ou quebrando funcionalidades, ele não deve ser aprovado.

---

## 4. Quando usar esta skill

Usar esta skill:

- antes de finalizar qualquer página;
- antes de finalizar qualquer componente;
- antes de entregar uma landing page;
- antes de entregar formulário;
- antes de entregar dashboard;
- antes de concluir refatoração visual;
- antes de alterar CSS global;
- antes de alterar design system;
- antes de alterar header/footer;
- antes de concluir responsividade;
- antes de criar versão final para produção;
- antes de dizer que o layout está pronto.

---

## 5. Quando não usar de forma extensa

Se a alteração for extremamente pequena, como corrigir um typo ou trocar uma palavra, a revisão pode ser proporcional.

Mas mesmo em mudanças pequenas, verificar se:

- não quebrou layout;
- não alterou regra de segurança;
- não removeu informação importante;
- não afetou link, formulário ou CTA;
- não quebrou responsividade.

---

## 6. Regra de preservação de layouts existentes

Quando já existir uma interface, layout, página, componente, seção ou fluxo criado, o Claude Code não deve apagar tudo e refazer do zero automaticamente.

Na revisão final, verificar se:

- funcionalidades existentes foram preservadas;
- validações existentes foram preservadas;
- integrações existentes foram preservadas;
- classes importantes foram preservadas;
- IDs importantes foram preservados;
- eventos JS foram preservados;
- hooks foram preservados;
- estilos aprovados foram preservados quando ainda funcionavam;
- responsividade anterior não foi piorada;
- acessibilidade anterior não foi piorada;
- segurança anterior não foi enfraquecida.

Refatoração completa só deve ser aceita com justificativa clara e quando realmente necessária.

---

## 7. Revisão de segurança

A segurança deve ser o primeiro bloco da revisão.

### 7.1 Checklist de segurança

Verificar:

- Nenhuma validação segura foi removida.
- Nenhuma sanitização foi removida.
- Nenhuma proteção contra XSS foi enfraquecida.
- Nenhuma proteção contra CSRF foi removida.
- Nenhuma proteção contra SQL Injection foi afetada.
- Nenhuma proteção contra path traversal foi afetada.
- Nenhuma permissão foi relaxada.
- Nenhum segredo foi exposto.
- Nenhum token foi exposto no frontend.
- Nenhuma chave de API foi adicionada ao código público.
- Nenhuma mensagem de erro expõe stack trace.
- Nenhuma mensagem de erro expõe caminho interno.
- Nenhuma query SQL aparece para o usuário.
- Nenhuma dependência suspeita foi adicionada.
- Nenhum script externo desnecessário foi adicionado.
- Nenhuma CDN foi adicionada sem justificativa.
- Nenhuma confirmação de ação destrutiva foi removida.
- Nenhum formulário envia dados sem validação.
- Nenhum upload ficou sem validação.
- Nenhum link externo ficou sem tratamento adequado.
- Nenhum botão executa ação crítica sem feedback ou proteção.

### 7.2 Regra

Se qualquer item de segurança falhar, a entrega não está pronta.

---

## 8. Revisão de privacidade e LGPD

Quando a interface coleta, exibe ou envia dados, revisar privacidade.

### 8.1 Checklist de privacidade

Verificar:

- Política de privacidade está acessível.
- Termos de uso estão acessíveis quando necessários.
- Aviso de cookies não foi escondido.
- Consentimento aparece quando necessário.
- Checkbox de consentimento não está pré-marcado indevidamente.
- Finalidade de coleta está clara.
- Formulário pede apenas dados necessários.
- Dados sensíveis não são solicitados sem motivo.
- Dados pessoais não aparecem em URL sem necessidade.
- Integrações com WhatsApp não expõem dados sensíveis desnecessariamente.
- Scripts de tracking respeitam consentimento quando aplicável.
- Dados de outro usuário não aparecem indevidamente.
- Estados de loading não exibem dados antigos como se fossem atuais.
- Mensagens de erro não expõem dados pessoais.

### 8.2 Regra

Design limpo não pode esconder informação legal ou consentimento.

---

## 9. Revisão de acessibilidade

A interface deve funcionar para diferentes usuários e formas de navegação.

### 9.1 Checklist de acessibilidade

Verificar:

- Existe estrutura semântica adequada.
- Existe apenas um H1 principal por página, quando aplicável.
- Headings seguem ordem lógica.
- Botões têm texto claro.
- Links são reconhecíveis.
- Links em texto não dependem apenas de cor.
- Imagens informativas têm alt text.
- Imagens decorativas são tratadas corretamente.
- Inputs têm labels.
- Placeholders não substituem labels.
- Erros estão próximos dos campos.
- Erros estão associados quando possível.
- Foco visível existe.
- Navegação por teclado funciona.
- Menu mobile funciona por teclado quando aplicável.
- Modais gerenciam foco.
- Contraste é adequado.
- Elementos interativos têm área de toque confortável.
- Estados não dependem apenas de cor.
- Informações importantes não dependem apenas de hover.
- Animações não prejudicam uso.
- Conteúdo é legível no mobile.

### 9.2 Regra

Não remover `outline` sem criar alternativa clara de foco.

---

## 10. Revisão de performance

A interface deve carregar e responder bem.

### 10.1 Checklist de performance

Verificar:

- Imagens estão otimizadas.
- Imagens não são maiores que o necessário.
- Logos usam dimensões adequadas.
- Vídeos não prejudicam carregamento.
- Animações são leves.
- Não há bibliotecas visuais desnecessárias.
- Não há scripts duplicados.
- Não há CDNs desnecessárias.
- Fontes externas são usadas com cuidado.
- Não há excesso de pesos de fonte.
- CSS não ficou excessivamente duplicado.
- JavaScript não foi adicionado sem necessidade.
- Carrosséis não são pesados sem motivo.
- Elementos fixos não causam travamento no mobile.
- Layout não gera reflows excessivos.

### 10.2 Regra

Design premium deve parecer leve, não pesado.

---

## 11. Revisão de compatibilidade com deploy

O design precisa respeitar o ambiente real do projeto.

### 11.1 Checklist

Verificar:

- Stack existente foi respeitada.
- Projeto HTML/CSS/JS/PHP não passou a exigir Node.js em produção sem necessidade.
- Projeto para HostGator/public_html continua compatível.
- Build não foi criado sem necessidade.
- Caminhos de arquivos continuam corretos.
- Assets estão em locais adequados.
- Imports não quebram.
- Rotas não foram alteradas sem necessidade.
- Dependências novas não quebram deploy.
- Arquivos sensíveis não foram alterados indevidamente.

---

## 12. Revisão de hierarquia visual

A interface precisa guiar o olhar do usuário.

### 12.1 Checklist

Verificar:

- Existe um ponto focal principal.
- O título principal está claro.
- O subtítulo apoia a promessa.
- O CTA principal se destaca.
- CTAs secundários não competem com o principal.
- Elementos não gritam todos ao mesmo tempo.
- Cores são usadas com intenção.
- Peso de fonte é consistente.
- Tamanho de texto cria hierarquia.
- O formulário é ponto focal secundário quando aplicável.
- A informação mais importante aparece primeiro.
- O usuário entende a tela em poucos segundos.

---

## 13. Revisão de padrões de leitura

Verificar se o layout respeita o comportamento natural de leitura.

### 13.1 Checklist

- Página textual usa lógica de padrão F.
- Landing page ou hero usa lógica de padrão Z quando adequado.
- Página híbrida usa Z no topo e F no conteúdo longo.
- O CTA está no caminho natural do olhar.
- A ordem mobile é lógica.
- A ordem visual não contradiz a ordem HTML.
- O fluxo não força o usuário a procurar informação essencial.
- Conteúdo longo tem títulos, subtítulos e blocos escaneáveis.
- Promessa aparece antes da ação principal.

---

## 14. Revisão de Gestalt e proximidade

Verificar agrupamentos.

### 14.1 Checklist

- Elementos relacionados estão próximos.
- Elementos não relacionados estão separados.
- Promessa, subtítulo e prova social formam uma unidade.
- CTA está próximo do contexto que justifica a ação.
- Labels estão próximos dos inputs.
- Erros estão próximos dos campos.
- Cards agrupam conteúdo relacionado.
- Seções diferentes têm respiro suficiente.
- Filtros estão próximos dos dados afetados.
- Ações estão próximas dos itens afetados.
- Botões destrutivos têm separação e diferenciação.

---

## 15. Revisão de affordance

Verificar se elementos interativos parecem interativos.

### 15.1 Checklist

- Botões parecem botões.
- Links parecem links.
- Cards clicáveis parecem clicáveis.
- Inputs parecem preenchíveis.
- Elementos clicáveis têm cursor pointer.
- Hover existe onde aplicável.
- Focus visível existe.
- Active state existe.
- Disabled state é claro.
- Loading state existe em ações assíncronas.
- CTA principal é claro.
- Botão secundário não compete.
- Links legais são reconhecíveis.
- Ações destrutivas são claramente identificadas.
- Ícones interativos têm label ou texto auxiliar.

---

## 16. Revisão de componentes como máquina de estados

Verificar estados de componentes.

### 16.1 Checklist

- Estados possíveis foram mapeados.
- Estado inicial existe.
- Loading existe em ações assíncronas.
- Erro existe.
- Sucesso existe.
- Estado vazio existe quando necessário.
- Disabled existe quando necessário.
- Estados conflitantes não coexistem.
- Sucesso e erro não aparecem juntos.
- Clique duplo é tratado quando necessário.
- Dados preenchidos são preservados após erro.
- Mensagens de erro são seguras.
- Mensagens de sucesso só aparecem após confirmação real.
- Permissão negada é tratada quando aplicável.
- Estados são acessíveis.
- Estados funcionam no mobile.

---

## 17. Revisão de landing page e conversão

Quando a página tiver objetivo de conversão, revisar.

### 17.1 Checklist

- Existe uma ação principal clara.
- A promessa é específica.
- O subtítulo explica o valor.
- CTA principal é direto.
- CTA secundário não compete.
- Prova social é real.
- Prova social está próxima da promessa.
- Benefícios estão claros.
- Como funciona está claro.
- Objeções são respondidas.
- FAQ existe quando necessário.
- Formulário tem poucos campos.
- O que acontece após o envio está claro.
- CTA para WhatsApp informa a ação.
- Não há promessa falsa.
- Não há urgência falsa.
- Não há dark pattern.
- Privacidade está clara.

---

## 18. Revisão de design system

Verificar consistência.

### 18.1 Checklist

- Cores são consistentes.
- Fontes são consistentes.
- Espaçamentos são consistentes.
- Botões seguem padrão.
- Links seguem padrão.
- Inputs seguem padrão.
- Cards seguem padrão.
- Alertas seguem padrão.
- Badges seguem padrão.
- Bordas e raios são consistentes.
- Sombras são coerentes.
- Tokens existentes foram respeitados.
- CSS duplicado foi evitado.
- Classes existentes importantes foram preservadas.

---

## 19. Revisão de responsividade

Verificar experiência em diferentes tamanhos.

### 19.1 Checklist geral

- Funciona em 360px.
- Funciona em 375px/390px.
- Funciona em 480px.
- Funciona em 768px.
- Funciona em 1024px.
- Funciona em 1280px.
- Não há overflow horizontal.
- Texto é legível.
- CTA é acessível.
- Botões são fáceis de tocar.
- Formulários são confortáveis.
- Cards não ficam apertados.
- Grids reorganizam corretamente.
- Imagens não distorcem.
- Logos não distorcem.
- Menus funcionam no mobile.
- Modais cabem na tela.
- Tabelas não quebram a página.
- Rodapé é legível.
- Links legais continuam visíveis.
- Estados continuam visíveis.

---

## 20. Revisão de fidelidade de marca

Verificar se a interface parece pertencer à marca correta.

### 20.1 Checklist

- Marca foi identificada corretamente.
- Logo foi preservado.
- Logo não foi distorcido.
- Logo não foi recolorido sem autorização.
- Fonte da marca foi respeitada quando conhecida.
- Cores da marca foram respeitadas.
- Estilo visual combina com a empresa.
- Imagens são coerentes com a marca.
- Veículos, uniformes ou ativos reais não foram descaracterizados.
- O layout não parece genérico.
- O mobile preserva a marca.
- Nenhum dado institucional foi inventado.
- Nenhuma certificação foi inventada.
- Nenhum parceiro foi inventado.
- Nenhum número foi inventado.

---

## 21. Revisão de formulários

Formulários são pontos críticos.

### 21.1 Checklist

- Labels visíveis.
- Placeholders são apenas apoio.
- Campos obrigatórios indicados.
- Validação frontend existe quando útil.
- Validação backend foi preservada quando aplicável.
- Erros aparecem perto dos campos.
- Erro geral aparece quando necessário.
- Loading ao enviar.
- Sucesso após envio real.
- Erro seguro em falha.
- Botão bloqueado durante envio quando necessário.
- Dados são preservados após erro.
- Consentimento existe quando necessário.
- Política de privacidade está acessível.
- Campos desnecessários foram evitados.
- Dados sensíveis não são pedidos sem motivo.
- Integração com WhatsApp codifica mensagem corretamente.
- Não há envio automático sem ação clara.

---

## 22. Revisão de menus e navegação

### 22.1 Checklist

- Menu desktop funciona.
- Menu mobile funciona.
- Item ativo é claro.
- Links são claros.
- CTA no menu não compete indevidamente.
- Menu não depende apenas de hover.
- Menu mobile abre e fecha.
- Foco por teclado funciona.
- Links legais não foram escondidos.
- Navegação não quebra em telas menores.
- Logo no header está proporcional.

---

## 23. Revisão de imagens e mídia

### 23.1 Checklist

- Imagens estão otimizadas.
- Imagens têm proporção correta.
- Imagens não distorcem.
- Logos preservam proporção.
- Alt text existe quando necessário.
- Imagens decorativas não poluem leitores de tela.
- Vídeos não bloqueiam carregamento.
- Imagens importantes não são cortadas no mobile.
- Imagens de marca não foram descaracterizadas.
- Caminhos de assets estão corretos.

---

## 24. Revisão de código CSS

### 24.1 Checklist

- CSS está organizado.
- Não há duplicação excessiva.
- Não há valores aleatórios demais.
- Tokens existentes foram usados.
- Media queries são coerentes.
- Não há `!important` sem necessidade.
- Não há largura fixa que quebre mobile.
- Não há `overflow: hidden` escondendo problema crítico.
- Focus não foi removido.
- Estados estão estilizados.
- Classes usadas por JS não foram removidas.
- Estilos globais não quebram outras páginas.

---

## 25. Revisão de JavaScript de interface

### 25.1 Checklist

- Eventos continuam funcionando.
- Classes e IDs usados por JS foram preservados.
- Não há listeners duplicados.
- Não há scripts externos desnecessários.
- Estados são atualizados corretamente.
- Loading, erro e sucesso são tratados.
- Clique duplo é tratado quando necessário.
- Menu mobile funciona.
- Modal funciona.
- Formulário funciona.
- Integração com WhatsApp funciona.
- Erros não expõem detalhes internos.
- Performance não foi prejudicada.

---

## 26. Revisão de HTML semântico

### 26.1 Checklist

- Estrutura HTML é semântica.
- Header, main, section, article e footer são usados quando adequado.
- Botões são botões quando executam ações.
- Links são links quando navegam.
- Labels estão associadas aos inputs.
- Headings seguem ordem lógica.
- Listas são usadas para listas reais.
- Imagens têm alt adequado.
- Elementos interativos não são divs sem acessibilidade.
- A ordem HTML faz sentido no mobile e para leitores de tela.

---

## 27. Revisão de alterações incrementais

Quando o projeto já existia, verificar:

- Foi alterado apenas o necessário?
- O que funcionava foi preservado?
- A mudança foi incremental?
- Houve justificativa para mudanças grandes?
- As páginas principais continuam funcionando?
- O layout antigo aprovado não foi perdido sem motivo?
- Integrações continuam funcionando?
- Responsividade não piorou?
- Acessibilidade não piorou?
- Segurança não piorou?

---

## 28. Critérios de bloqueio

A interface não deve ser considerada pronta se qualquer item abaixo ocorrer:

- segredo exposto;
- token exposto;
- validação removida;
- sanitização removida;
- erro técnico exposto;
- formulário sem feedback;
- ação assíncrona sem loading;
- sucesso e erro aparecendo juntos;
- CTA principal confuso;
- política de privacidade escondida;
- consentimento ausente quando necessário;
- foco invisível;
- mobile quebrado;
- overflow horizontal grave;
- logo distorcido;
- dados institucionais inventados;
- dependência suspeita adicionada;
- script externo desnecessário adicionado;
- layout existente destruído sem justificativa.

---

## 29. Formato recomendado de resposta após revisão

Ao finalizar uma alteração, o Claude Code deve apresentar um resumo objetivo:

```text
Revisão final concluída.

Alterações feitas:
- ...
- ...

Preservado:
- validações existentes;
- integrações existentes;
- responsividade;
- segurança;
- identidade visual.

Verificado:
- hierarquia visual;
- responsividade;
- acessibilidade;
- estados;
- segurança;
- performance.

Pontos de atenção:
- ...
```

Se houver problema não resolvido, informar claramente.

---

## 30. Integração com outras skills

Esta skill consolida todas as demais:

- `ui-visual-hierarchy`
- `ui-reading-patterns`
- `ui-gestalt-proximity`
- `ui-affordance-interactions`
- `ui-component-state-machine`
- `ui-conversion-landing-page`
- `ui-minimal-design-system`
- `ui-premium-responsive-design`
- `ui-brand-fidelity`

A revisão final deve ser executada depois de aplicar as skills relevantes.

---

## 31. Critérios de aceite

A aplicação desta skill será considerada correta quando:

- a interface for revisada além da estética;
- segurança for preservada;
- privacidade for preservada;
- acessibilidade for validada;
- responsividade for validada;
- estados forem verificados;
- marca for preservada;
- performance for considerada;
- funcionalidades existentes forem preservadas;
- alterações forem incrementais quando havia layout existente;
- problemas críticos forem apontados antes da entrega;
- a entrega final for clara, profissional e segura.

---

## 32. Resumo operacional para o Claude Code

Antes de concluir qualquer interface:

1. Revisar segurança.
2. Revisar privacidade/LGPD.
3. Revisar acessibilidade.
4. Revisar performance.
5. Revisar compatibilidade de deploy.
6. Revisar preservação do que já existia.
7. Revisar hierarquia visual.
8. Revisar padrão de leitura.
9. Revisar proximidade.
10. Revisar affordance.
11. Revisar estados.
12. Revisar conversão, se aplicável.
13. Revisar design system.
14. Revisar responsividade.
15. Revisar fidelidade de marca.
16. Revisar formulários.
17. Revisar menus.
18. Revisar imagens.
19. Revisar HTML, CSS e JavaScript.
20. Corrigir bloqueios críticos.
21. Informar o que foi alterado e o que foi preservado.

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
