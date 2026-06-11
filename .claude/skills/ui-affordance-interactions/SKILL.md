---
name: ui-affordance-interactions
description: Affordance e estados de interacao (hover, focus, active, disabled, loading). Garante que botoes parecam botoes, links parecam links e cada estado de feedback visual claro. Use em qualquer interface com elementos clicaveis - botoes, links, cards, inputs.
---

# ui-affordance-interactions


Arquivo sugerido: `ui-affordance-interactions.md`

## 1. Objetivo da skill

Esta skill orienta o Claude Code a criar, revisar e melhorar elementos interativos de interfaces digitais para que o usuário entenda intuitivamente o que pode ser clicado, tocado, preenchido, aberto, fechado, arrastado, enviado ou acionado.

O objetivo é garantir **affordance visual e funcional** em:

- botões;
- links;
- formulários;
- inputs;
- selects;
- checkboxes;
- radios;
- menus;
- cards clicáveis;
- ícones interativos;
- modais;
- abas;
- accordions;
- filtros;
- tabelas;
- carrosséis;
- CTAs;
- componentes administrativos;
- fluxos de conversão.

Affordance significa que o elemento comunica, pela aparência e comportamento, como deve ser usado.

Um botão deve parecer botão.

Um link deve parecer link.

Um campo deve parecer preenchível.

Um card clicável deve parecer clicável.

Uma ação bloqueada deve parecer indisponível.

Uma ação em carregamento deve mostrar feedback.

---

## 2. Regra principal

Todo elemento interativo deve deixar claro:

1. que é interativo;
2. qual ação ele executa;
3. qual é seu estado atual;
4. o que acontece após a interação;
5. se está disponível, desativado, carregando, concluído ou com erro.

Nenhum elemento clicável deve parecer texto comum.

Nenhum texto comum deve parecer botão ou link se não for interativo.

A clareza da interação deve existir em desktop, mobile, teclado e leitores de tela quando aplicável.

---

## 3. Prioridade absoluta

As decisões de affordance devem respeitar a seguinte prioridade:

1. Segurança
2. Privacidade / LGPD
3. Acessibilidade
4. Performance
5. Manutenibilidade
6. Clareza da interação
7. Conversão
8. Estética visual

Se uma microinteração, animação, efeito visual ou comportamento de clique prejudicar segurança, acessibilidade, performance ou funcionamento existente, ela deve ser rejeitada.

---

## 4. Quando usar esta skill

Usar esta skill sempre que o Claude Code criar ou alterar:

- botões;
- CTAs;
- links;
- menus;
- formulários;
- inputs;
- modais;
- cards clicáveis;
- componentes de navegação;
- filtros;
- uploads;
- áreas de login;
- áreas administrativas;
- formulários de contato;
- formulários que abrem WhatsApp;
- integrações com APIs;
- páginas de orçamento;
- landing pages;
- páginas de venda;
- dashboards;
- tabelas com ações;
- componentes interativos em geral.

---

## 5. Quando não usar de forma exagerada

Não aplicar affordance com exagero quando:

- o elemento não for interativo;
- o efeito visual distrair do conteúdo principal;
- a animação prejudicar performance;
- o brilho ou glow reduzir legibilidade;
- o hover não fizer sentido em mobile;
- o botão já estiver suficientemente claro;
- o projeto tiver design system com regras definidas;
- a microinteração exigir biblioteca externa desnecessária;
- o efeito puder prejudicar acessibilidade;
- o efeito gerar sensação de spam, jogo ou baixa credibilidade.

Affordance deve aumentar clareza, não poluir a interface.

---

## 6. Conceito essencial

O usuário não deve precisar “descobrir” onde clicar.

A interface deve comunicar ação com:

- forma;
- contraste;
- hierarquia;
- texto;
- ícones;
- espaçamento;
- cursor;
- hover;
- focus;
- active;
- loading;
- feedback;
- estados visuais coerentes.

Exemplo ruim:

```text
Saiba mais
```

Sem sublinhado, sem cor diferente, sem hover e sem contexto, o usuário pode não entender que é link.

Exemplo melhor:

```text
Saiba mais sobre nossos serviços →
```

Com estilo de link, hover, foco visível e relação clara com o conteúdo.

---

## 7. Regras para botões

Botões devem ser usados para ações.

Exemplos de ações:

- enviar formulário;
- abrir modal;
- salvar;
- excluir;
- confirmar;
- cancelar;
- gerar link;
- aplicar filtro;
- iniciar orçamento;
- falar no WhatsApp;
- baixar arquivo;
- avançar etapa;
- voltar etapa;
- criar registro;
- editar item.

### 7.1 Botão principal

O botão principal deve representar a ação mais importante da tela ou seção.

Características recomendadas:

- alto contraste;
- texto claro;
- tamanho confortável;
- aparência evidente de botão;
- hover perceptível;
- focus visível;
- active state;
- cursor pointer;
- área de toque adequada;
- estado disabled quando necessário;
- estado loading em ações assíncronas;
- ícone de seta ou continuidade quando fizer sentido.

Exemplos de texto:

```text
Solicitar orçamento
Falar pelo WhatsApp
Quero acessar o material
Agendar avaliação
Ver planos
Enviar mensagem
Criar conta
Salvar alterações
```

Evitar texto genérico quando houver opção mais clara:

```text
Enviar
Clique aqui
OK
Continuar
```

Esses textos só devem ser usados quando o contexto for óbvio.

### 7.2 Botão secundário

O botão secundário deve ter menor peso visual.

Usar para ações como:

- ver detalhes;
- saber mais;
- voltar;
- cancelar;
- comparar;
- acessar informações complementares.

Características:

- menor contraste que o principal;
- pode ser outline, ghost ou texto destacado;
- ainda precisa parecer clicável;
- não deve competir com o CTA principal;
- deve ter hover e focus visível;
- deve manter área de toque adequada.

### 7.3 Botão destrutivo

Botões destrutivos executam ações como:

- excluir;
- remover;
- apagar;
- cancelar definitivamente;
- descartar;
- revogar acesso;
- limpar dados;
- remover integração.

Regras obrigatórias:

- diferenciar visualmente;
- não posicionar como ação principal por engano;
- não misturar com botões comuns sem separação;
- exigir confirmação quando o impacto for relevante;
- mostrar claramente o que será afetado;
- não usar texto ambíguo;
- não ocultar consequência;
- respeitar permissões;
- não remover proteções existentes.

Exemplo correto:

```text
Excluir arquivo
```

Com confirmação:

```text
Tem certeza que deseja excluir este arquivo? Esta ação não poderá ser desfeita.
```

---

## 8. Regras para links

Links devem ser usados para navegação ou abertura de recursos.

Exemplos:

- abrir página;
- acessar política de privacidade;
- acessar termos de uso;
- ir para outra seção;
- abrir documento;
- abrir rota;
- acessar perfil;
- abrir e-mail;
- abrir WhatsApp;
- abrir página externa.

### 8.1 Links de texto

Links em meio a texto devem ser claramente reconhecíveis.

Devem usar pelo menos uma destas indicações:

- sublinhado;
- cor diferenciada com contraste adequado;
- ícone de seta;
- mudança de estilo no hover;
- foco visível.

Não depender apenas de cor quando o link estiver no meio de um parágrafo.

Exemplo correto:

```text
Ao continuar, você concorda com a Política de Privacidade.
```

Onde “Política de Privacidade” deve parecer link e ser acessível.

### 8.2 Links externos

Links externos devem:

- indicar quando abrem nova aba, se aplicável;
- usar `rel="noopener noreferrer"` quando `target="_blank"`;
- não abrir scripts externos suspeitos;
- não mascarar destino enganoso;
- não usar encurtadores sem necessidade;
- respeitar segurança do projeto.

Exemplo:

```html
<a href="https://exemplo.com" target="_blank" rel="noopener noreferrer">
  Acessar site externo
</a>
```

### 8.3 Links de WhatsApp

Links de WhatsApp devem:

- ter texto claro;
- indicar que abrirão o WhatsApp;
- usar mensagem codificada corretamente;
- não expor dados sensíveis na URL sem necessidade;
- respeitar LGPD;
- não enviar dados sem ação clara do usuário.

Exemplo de texto:

```text
Falar com atendimento pelo WhatsApp
```

Evitar:

```text
Clique aqui
```

---

## 9. Regras para cursor

Em desktop:

- elementos clicáveis devem usar `cursor: pointer`;
- elementos desativados devem indicar indisponibilidade;
- elementos arrastáveis devem comunicar arraste quando aplicável;
- elementos de texto comum não devem usar pointer.

Exemplo:

```css
.button,
.link,
.card-clickable {
  cursor: pointer;
}

.button:disabled {
  cursor: not-allowed;
}
```

Cuidado:

`cursor: pointer` sozinho não resolve affordance. O elemento também precisa ter aparência visual coerente.

---

## 10. Estados interativos obrigatórios

Todo elemento interativo relevante deve considerar estados.

### 10.1 Estados mínimos para botões

- default;
- hover;
- focus;
- active;
- disabled;
- loading, se houver ação assíncrona;
- success, se aplicável;
- error, se aplicável.

### 10.2 Estados mínimos para links

- default;
- hover;
- focus;
- visited, quando fizer sentido;
- disabled ou aria-disabled, quando aplicável.

### 10.3 Estados mínimos para inputs

- empty;
- filled;
- focus;
- valid;
- invalid;
- disabled;
- readonly;
- loading ou validating, se aplicável.

### 10.4 Estados mínimos para cards clicáveis

- default;
- hover;
- focus;
- active;
- selected, se aplicável;
- disabled, se aplicável.

---

## 11. Hover

Hover deve indicar que o elemento responde à interação.

Pode usar:

- leve mudança de cor;
- leve alteração de sombra;
- leve elevação;
- sublinhado;
- mudança de borda;
- alteração de background;
- leve deslocamento;
- mudança de ícone;
- glow moderado.

### 11.1 Regras para hover

- não exagerar;
- não prejudicar contraste;
- não mover layout de forma brusca;
- não depender apenas de hover para revelar informação importante;
- não usar hover como única forma de mostrar CTA;
- não criar efeito pesado;
- não usar biblioteca externa para hover simples.

### 11.2 Exemplo CSS

```css
.button-primary {
  transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
}

.button-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.14);
}
```

---

## 12. Focus visível

Todo elemento interativo deve ter foco visível para navegação por teclado.

Isso é obrigatório para acessibilidade.

### 12.1 Regras

- não remover outline sem substituir por foco visível;
- foco deve ter contraste adequado;
- foco deve ser perceptível;
- foco não deve depender apenas de cor muito sutil;
- foco deve funcionar em botões, links, inputs, selects, cards clicáveis, abas e menus.

### 12.2 Exemplo correto

```css
:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
```

Ou uma variação compatível com a identidade visual.

### 12.3 Exemplo incorreto

```css
*:focus {
  outline: none;
}
```

Isso só é aceitável se houver substituição por outro estilo de foco claro e acessível.

---

## 13. Active state

O estado ativo mostra que a ação está sendo pressionada ou acionada.

Pode usar:

- leve redução de elevação;
- transformação sutil;
- alteração de cor;
- sombra menor.

Exemplo:

```css
.button-primary:active {
  transform: translateY(0);
  box-shadow: none;
}
```

Não usar efeitos bruscos.

---

## 14. Disabled state

O estado desativado deve comunicar indisponibilidade.

### 14.1 Regras

- reduzir contraste com cuidado, sem sumir;
- remover clique real;
- usar `disabled` em botões quando possível;
- usar `aria-disabled` em elementos que não suportam disabled nativo;
- não permitir ação via teclado quando disabled;
- explicar motivo quando necessário;
- não esconder botão se o usuário precisa entender que a ação existe, mas está indisponível.

### 14.2 Exemplo

```html
<button disabled>Enviar mensagem</button>
```

```css
button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
```

---

## 15. Loading state

Toda ação assíncrona precisa mostrar estado de carregamento.

Exemplos:

- envio de formulário;
- login;
- cadastro;
- busca;
- filtro remoto;
- upload;
- integração com API;
- geração de link;
- envio para WhatsApp com processamento prévio;
- salvamento;
- exclusão;
- atualização de dados.

### 15.1 Regras

Durante loading:

- mostrar feedback visual;
- impedir clique duplo quando necessário;
- alterar texto do botão ou mostrar spinner acessível;
- manter layout estável;
- não mostrar sucesso antes da confirmação real;
- não deixar o usuário sem resposta;
- não esconder erro;
- não travar a interface inteira sem necessidade.

### 15.2 Exemplo de texto

```text
Enviando...
Salvando...
Carregando...
Processando...
Gerando link...
```

### 15.3 Segurança

O loading visual não substitui validação, proteção contra duplicidade no backend ou controle real de estado.

---

## 16. Success state

Quando uma ação for concluída, o usuário precisa receber confirmação.

Exemplos:

```text
Mensagem enviada com sucesso.
Cadastro realizado.
Alterações salvas.
Arquivo enviado.
Link gerado.
```

### 16.1 Regras

- sucesso deve aparecer apenas após sucesso real;
- não mostrar sucesso e erro ao mesmo tempo;
- usar texto claro;
- indicar próximo passo quando útil;
- não expor dados sensíveis;
- não depender apenas de cor verde;
- associar sucesso ao componente correto.

---

## 17. Error state

Erros devem ser claros, úteis e seguros.

### 17.1 Regras

- explicar o problema em linguagem simples;
- indicar como corrigir quando possível;
- não expor stack trace;
- não expor caminho interno;
- não expor token;
- não expor query SQL;
- não expor detalhes sensíveis;
- não mostrar erro genérico quando campo específico falhou;
- associar erro ao campo ou área correta;
- manter contraste adequado;
- não depender apenas de cor vermelha.

### 17.2 Exemplos corretos

```text
Informe um e-mail válido.
Preencha o telefone para continuar.
Não foi possível enviar agora. Tente novamente.
Você não tem permissão para executar esta ação.
```

### 17.3 Exemplos incorretos

```text
SQLSTATE[23000]...
Undefined index...
Token inválido: abc123...
Erro no arquivo /home/user/public_html/config.php
```

---

## 18. Affordance em formulários

Formulários precisam ser intuitivos.

### 18.1 Inputs

Inputs devem:

- parecer preenchíveis;
- ter label claro;
- ter placeholder apenas como apoio;
- ter foco visível;
- ter borda ou background suficiente;
- ter erro próximo;
- ter estado disabled quando aplicável;
- ter estado readonly quando aplicável;
- ter máscara apenas quando útil;
- não depender apenas de placeholder.

### 18.2 Labels

Labels devem:

- estar próximas do campo;
- explicar o dado solicitado;
- ser associadas semanticamente ao input;
- não sumir quando o usuário digita;
- não ser substituídas apenas por placeholder.

### 18.3 Placeholders

Placeholders podem ajudar, mas não devem substituir labels.

Exemplo ruim:

```html
<input placeholder="Seu nome">
```

Exemplo melhor:

```html
<label for="name">Nome completo</label>
<input id="name" name="name" placeholder="Ex.: [SEU_NOME]">
```

### 18.4 Checkboxes

Checkboxes devem:

- ter texto associado;
- ter área de toque adequada;
- ser claramente marcáveis;
- ter foco visível;
- não estar separados do texto;
- não vir pré-marcados quando envolver consentimento sensível;
- respeitar LGPD.

---

## 19. Affordance em modais

Modais devem comunicar claramente:

- que foram abertos;
- qual é o título;
- qual ação está sendo solicitada;
- como fechar;
- quais botões existem;
- qual é a ação principal;
- qual é a ação secundária;
- se há risco na ação.

### 19.1 Regras

- botão de fechar visível;
- tecla Esc quando apropriado;
- foco gerenciado;
- fundo com overlay;
- não prender usuário sem saída;
- não usar modal para esconder termos;
- ações destrutivas com confirmação clara;
- mobile utilizável.

---

## 20. Affordance em menus

Menus devem indicar:

- item ativo;
- item com submenu;
- item clicável;
- item desativado;
- estado aberto/fechado;
- navegação atual.

### 20.1 Regras

- menu mobile deve ter botão claro;
- ícone de menu deve ter label acessível;
- submenu deve indicar expansão;
- item ativo deve ser perceptível;
- foco por teclado deve funcionar;
- não esconder links legais obrigatórios;
- não criar menu que dependa apenas de hover.

---

## 21. Affordance em cards clicáveis

Cards clicáveis podem ser úteis, mas precisam ser claros.

### 21.1 Regras

Se o card inteiro for clicável:

- hover visível;
- cursor pointer;
- focus visível;
- texto ou ícone indicando ação;
- aria-label quando necessário;
- área de toque adequada;
- não colocar botão concorrente dentro sem cuidado.

Se apenas um botão dentro do card for clicável:

- não aplicar pointer no card inteiro;
- deixar o botão claramente clicável;
- evitar confusão.

---

## 22. Affordance em tabelas e ações administrativas

Tabelas com ações precisam ser claras e seguras.

### 22.1 Regras

- ícones de ação devem ter label;
- ações por linha devem ficar próximas da linha;
- ações destrutivas devem ser diferenciadas;
- confirmar exclusões relevantes;
- indicar loading por linha quando a ação afeta uma linha;
- não usar ícones sem texto quando o significado não for óbvio;
- garantir foco visível;
- garantir área de toque em mobile;
- não esconder ação crítica em menu confuso.

---

## 23. Affordance em carrosséis

Carrosséis devem indicar:

- que há mais conteúdo;
- qual slide está ativo;
- como avançar;
- como voltar;
- se há autoplay;
- se o usuário pode pausar;
- se os controles são acessíveis.

### 23.1 Regras

- setas visíveis;
- indicadores visíveis;
- controle por teclado quando possível;
- não depender apenas de arraste;
- não ocultar informação essencial em slide automático;
- não usar carrossel pesado sem necessidade;
- não criar dependência externa apenas para carrossel simples.

---

## 24. Microcopy de interação

O texto dos botões e links deve reduzir dúvida.

### 24.1 Exemplos melhores

Em vez de:

```text
Enviar
```

Usar:

```text
Enviar mensagem
Solicitar orçamento
Receber proposta
Falar com especialista
```

Em vez de:

```text
Clique aqui
```

Usar:

```text
Ver detalhes do serviço
Acessar política de privacidade
Baixar material
```

Em vez de:

```text
Continuar
```

Usar:

```text
Continuar para pagamento
Continuar para revisão
Continuar cadastro
```

---

## 25. Preservação de layouts existentes

Quando já existir uma interface, layout, página, componente, seção ou fluxo criado, o Claude Code não deve apagar tudo e refazer do zero automaticamente.

Antes de alterar affordance em uma interface existente, deve:

1. analisar os elementos interativos atuais;
2. identificar o que já funciona;
3. identificar elementos clicáveis pouco claros;
4. identificar links sem estilo adequado;
5. identificar botões sem estados;
6. identificar ausência de loading, erro ou sucesso;
7. propor melhorias por partes;
8. preservar funcionalidades existentes;
9. preservar classes, IDs, eventos, integrações e validações;
10. evitar refatoração completa sem justificativa.

### 25.1 Melhorias incrementais recomendadas

Ao melhorar affordance:

1. adicionar hover em botões existentes;
2. adicionar focus visível;
3. ajustar cursor pointer;
4. diferenciar botão principal e secundário;
5. sublinhar links de texto;
6. adicionar loading em ações assíncronas;
7. adicionar mensagens de erro e sucesso;
8. melhorar textos de CTA;
9. revisar mobile;
10. testar se nada foi quebrado.

### 25.2 Proibição

Não substituir uma página inteira por uma nova versão apenas para melhorar hover, botões ou efeitos.

O objetivo é evoluir o que já existe com segurança e controle.

---

## 26. Segurança

Affordance nunca pode enfraquecer segurança.

### 26.1 Proibições

O Claude Code não deve:

- remover confirmação de ação destrutiva;
- esconder mensagens de erro;
- mascarar falhas de segurança;
- remover validação para melhorar visual;
- criar botão que envia dados sem consentimento;
- criar link enganoso;
- usar dark patterns;
- usar scripts externos desnecessários;
- instalar biblioteca apenas para efeito visual simples;
- usar pacote desconhecido para animação;
- expor dados sensíveis em mensagens;
- expor tokens em URL;
- enviar dados pessoais sem ação clara do usuário.

### 26.2 Links e segurança

- Links externos com nova aba devem usar `rel="noopener noreferrer"`.
- Links de download devem apontar para arquivos confiáveis.
- Links de WhatsApp não devem carregar dados sensíveis sem necessidade.
- Links de política e termos devem ser visíveis.
- Links não devem mascarar destinos.

### 26.3 Formulários e segurança

- Validação visual não substitui validação segura.
- Estados de loading não substituem proteção contra envio duplicado no backend.
- Mensagens de erro não devem vazar detalhes internos.
- Consentimento deve ser explícito.
- Campos obrigatórios devem ser claros.
- Dados pessoais devem ser tratados com cuidado.

---

## 27. Acessibilidade

Affordance precisa funcionar para diferentes formas de navegação.

### 27.1 Regras obrigatórias

- foco visível;
- navegação por teclado;
- contraste adequado;
- área de toque confortável;
- labels em inputs;
- textos claros em botões;
- links reconhecíveis;
- ícones com texto ou aria-label;
- mensagens de erro associadas;
- não depender apenas de cor;
- não depender apenas de hover;
- não remover outline sem alternativa;
- respeitar redução de movimento quando aplicável.

### 27.2 Área de toque

Em mobile, botões e elementos clicáveis devem ter área confortável.

Recomendação geral:

- altura mínima confortável;
- espaçamento entre ações;
- evitar botões muito próximos;
- evitar links pequenos em parágrafos sem espaço;
- evitar ações destrutivas perto de ações comuns sem separação.

---

## 28. Performance

Affordance deve ser leve.

Preferir:

- CSS nativo;
- transições simples;
- estados com classes;
- HTML semântico;
- JavaScript mínimo;
- SVG simples quando necessário.

Evitar:

- bibliotecas de animação para hover simples;
- scripts externos desnecessários;
- efeitos 3D pesados;
- animações contínuas sem necessidade;
- glow exagerado;
- carrosséis pesados;
- listeners excessivos;
- manipulação complexa do DOM sem necessidade.

---

## 29. Exemplos práticos

### 29.1 Botão principal com estados

```html
<button class="button-primary" type="submit">
  Solicitar orçamento
  <span aria-hidden="true">→</span>
</button>
```

```css
.button-primary {
  cursor: pointer;
  border: 0;
  border-radius: 999px;
  padding: 0.875rem 1.25rem;
  font-weight: 700;
  transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
}

.button-primary:hover {
  transform: translateY(-1px);
}

.button-primary:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}

.button-primary:active {
  transform: translateY(0);
}

.button-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
```

### 29.2 Link de texto

```html
<a class="text-link" href="/politica-de-privacidade">
  Política de Privacidade
</a>
```

```css
.text-link {
  text-decoration: underline;
  text-underline-offset: 0.18em;
}

.text-link:hover {
  text-decoration-thickness: 2px;
}

.text-link:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
```

### 29.3 Card clicável

```html
<a class="service-card" href="/servicos/transporte-de-cargas">
  <h3>Transporte de cargas</h3>
  <p>Conheça nossas soluções logísticas para operações nacionais.</p>
  <span>Ver serviço →</span>
</a>
```

```css
.service-card {
  display: block;
  cursor: pointer;
  text-decoration: none;
  border-radius: 1rem;
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.service-card:hover {
  transform: translateY(-2px);
}

.service-card:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 4px;
}
```

---

## 30. Checklist obrigatório

Antes de finalizar qualquer interface, o Claude Code deve verificar:

- Todos os botões parecem botões?
- Todos os links parecem links?
- Elementos clicáveis têm cursor pointer?
- Botões têm hover?
- Links têm hover?
- Elementos interativos têm focus visível?
- Botões têm active state?
- Ações assíncronas têm loading?
- Ações concluídas têm success?
- Erros são visíveis e seguros?
- Botões disabled parecem indisponíveis?
- CTA principal se diferencia do secundário?
- Links legais são visíveis?
- Cards clicáveis parecem clicáveis?
- Ícones interativos têm label ou aria-label?
- Mobile tem área de toque confortável?
- A interação não depende apenas de hover?
- A interação não depende apenas de cor?
- Nenhuma validação foi removida?
- Nenhuma confirmação de ação destrutiva foi removida?
- Nenhum script externo desnecessário foi adicionado?
- Nenhuma biblioteca visual insegura foi instalada?
- O layout existente foi preservado sempre que possível?

---

## 31. Checklist para botões

- Texto claro.
- Visual de botão.
- Hover.
- Focus visível.
- Active.
- Disabled.
- Loading quando necessário.
- Cursor pointer.
- Área de toque adequada.
- Hierarquia entre principal e secundário.
- Confirmação em ações destrutivas.
- Sem texto enganoso.
- Sem dupla ação ambígua.

---

## 32. Checklist para links

- Link reconhecível.
- Sublinhado ou estilo claro.
- Hover.
- Focus visível.
- Destino coerente.
- `rel="noopener noreferrer"` em nova aba externa.
- Texto descritivo.
- Sem “clique aqui” quando houver opção melhor.
- Links legais visíveis.
- Sem destino mascarado.

---

## 33. Checklist para formulários

- Labels visíveis.
- Placeholders não substituem labels.
- Inputs parecem preenchíveis.
- Focus visível.
- Erros próximos dos campos.
- Mensagens claras.
- Loading ao enviar.
- Sucesso após confirmação.
- Botão disabled durante envio quando necessário.
- Checkbox associado ao texto.
- Consentimento claro.
- Política acessível.
- Validação visual sem substituir segurança.

---

## 34. Checklist para mobile

- Botões fáceis de tocar.
- Links pequenos têm espaçamento suficiente.
- CTAs não ficam escondidos.
- Menus são claros.
- Hover não é necessário para entender ação.
- Foco visual continua funcionando.
- Cards clicáveis têm área adequada.
- Ações destrutivas não ficam coladas em ações comuns.
- Formulários são fáceis de preencher.
- Estados de loading, erro e sucesso são visíveis.

---

## 35. Integração com outras skills

Esta skill deve trabalhar junto com:

- `ui-visual-hierarchy`
- `ui-reading-patterns`
- `ui-gestalt-proximity`
- `ui-component-state-machine`
- `ui-conversion-landing-page`
- `ui-minimal-design-system`
- `ui-premium-responsive-design`
- `ui-brand-fidelity`
- `ui-final-design-review`

A affordance melhora a clareza da ação, mas não substitui:

- hierarquia visual;
- estrutura de leitura;
- proximidade;
- estados de componente;
- validação segura;
- revisão final.

---

## 36. Critérios de aceite

A aplicação desta skill será considerada correta quando:

- o usuário conseguir identificar rapidamente onde clicar;
- botões, links e campos tiverem aparência coerente;
- elementos interativos tiverem estados visuais;
- CTAs forem claros;
- ações assíncronas tiverem loading;
- erros forem visíveis, úteis e seguros;
- sucesso for confirmado corretamente;
- ações destrutivas forem protegidas;
- o mobile for utilizável;
- o teclado puder navegar corretamente;
- nenhuma regra de segurança for enfraquecida;
- nenhuma dependência desnecessária for adicionada;
- o layout existente for preservado sempre que possível.

---

## 37. Resumo operacional para o Claude Code

Sempre que criar ou revisar interação:

1. Identificar todos os elementos interativos.
2. Verificar se parecem interativos.
3. Diferenciar botão, link e texto comum.
4. Definir estados: default, hover, focus, active, disabled, loading, success e error.
5. Garantir cursor pointer quando clicável.
6. Garantir foco visível.
7. Garantir microcopy clara.
8. Garantir feedback após ação.
9. Garantir acessibilidade.
10. Garantir segurança.
11. Evitar dependências desnecessárias.
12. Preservar layout e funcionalidades existentes.
13. Fazer melhorias incrementais.

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
