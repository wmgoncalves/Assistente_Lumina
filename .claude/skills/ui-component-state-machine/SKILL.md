---
name: ui-component-state-machine
description: Cada componente interativo modelado como maquina de estados explicita. Impede estados invalidos (sucesso E erro juntos, loading sem disabled, envio sem feedback). Use ao desenhar formulario, modal, toast, fluxo de checkout, autocomplete, lista paginada ou qualquer componente assincrono.
---

# ui-component-state-machine


Arquivo sugerido: `ui-component-state-machine.md`

## 1. Objetivo da skill

Esta skill orienta o Claude Code a tratar componentes interativos como **máquinas de estados**, ou seja, componentes que possuem estados claros, previsíveis, seguros e mutuamente coerentes.

O objetivo é evitar interfaces que:

- não mostram loading;
- permitem clique duplo em ações críticas;
- mostram erro e sucesso ao mesmo tempo;
- deixam o usuário sem feedback;
- parecem travadas;
- escondem falhas;
- confundem validação visual com validação segura;
- quebram quando uma API falha;
- não tratam estados vazios;
- não tratam falta de permissão;
- não tratam erro de rede;
- não tratam formulário parcialmente preenchido;
- não tratam ações assíncronas corretamente.

Esta skill deve ser usada em qualquer interface com interação, especialmente:

- botões;
- formulários;
- inputs;
- selects;
- checkboxes;
- radios;
- uploads;
- modais;
- menus;
- abas;
- accordions;
- cards clicáveis;
- carrosséis;
- filtros;
- buscas;
- tabelas;
- dashboards;
- login;
- cadastro;
- checkout;
- envio para WhatsApp;
- integrações com APIs;
- sistemas administrativos;
- páginas com dados dinâmicos.

---

## 2. Regra principal

Antes de implementar ou alterar qualquer componente interativo, o Claude Code deve mapear seus estados possíveis.

Todo componente interativo deve responder claramente:

1. Qual é o estado inicial?
2. O que acontece quando o usuário interage?
3. Existe loading?
4. Existe sucesso?
5. Existe erro?
6. Existe estado vazio?
7. Existe estado disabled?
8. Existe estado de validação?
9. Existe estado de permissão negada?
10. Quais estados não podem coexistir?

Estados conflitantes devem ser impedidos.

Exemplo:

- um formulário não pode estar “enviando” e “enviado com sucesso” ao mesmo tempo;
- um botão não pode estar “disabled” e ainda permitir clique;
- uma tabela não pode mostrar “carregando” e “sem dados” ao mesmo tempo;
- um input não deve mostrar “válido” e “inválido” ao mesmo tempo;
- um modal não deve estar visualmente fechado e manter foco preso.

---

## 3. Prioridade absoluta

Estados visuais não substituem segurança real.

A prioridade deve ser:

1. Segurança
2. Privacidade / LGPD
3. Acessibilidade
4. Integridade dos dados
5. Performance
6. Manutenibilidade
7. Clareza de feedback
8. UI/UX
9. Estética visual

Se um estado visual parecer bonito, mas enfraquecer validação, segurança, privacidade, acessibilidade ou integridade dos dados, ele deve ser rejeitado.

---

## 4. Quando usar esta skill

Usar esta skill sempre que o Claude Code criar, revisar ou alterar:

- componentes de formulário;
- botões com ação;
- chamadas assíncronas;
- integração com API;
- envio de dados;
- salvamento;
- exclusão;
- login;
- logout;
- cadastro;
- recuperação de senha;
- upload de arquivos;
- filtros;
- busca;
- tabelas;
- dashboards;
- modais;
- páginas com dados dinâmicos;
- fluxos de orçamento;
- fluxos de WhatsApp;
- fluxo de compra;
- área administrativa;
- componentes com estado visual.

---

## 5. Quando não aplicar de forma exagerada

Não transformar componentes estáticos simples em máquinas complexas sem necessidade.

Exemplos que normalmente não precisam de máquina de estados complexa:

- título estático;
- parágrafo comum;
- imagem decorativa;
- divisor visual;
- bloco institucional sem interação;
- card apenas informativo;
- seção de texto sem ação;
- ícone decorativo.

Mesmo assim, se o elemento tiver interação, ele precisa ter estados mínimos.

---

## 6. Conceito essencial

Uma máquina de estados define:

- estados possíveis;
- transições permitidas;
- transições proibidas;
- estado inicial;
- estado final, se existir;
- feedback para o usuário;
- regras de bloqueio;
- regras de erro;
- regras de recuperação.

Exemplo simples de botão de envio:

```text
idle -> loading -> success
idle -> loading -> error
error -> loading -> success
success -> idle, se o formulário for resetado
```

Transições proibidas:

```text
loading -> loading por clique duplo
success + error ao mesmo tempo
disabled -> loading sem ação permitida
```

---

## 7. Estados de botão

Todo botão relevante deve considerar os estados abaixo.

### 7.1 Estados mínimos

```text
default
hover
focus
active
disabled
loading
success
error
```

### 7.2 Estado default

Estado normal do botão.

Deve:

- parecer clicável;
- ter texto claro;
- indicar ação;
- respeitar hierarquia visual;
- ter contraste adequado.

### 7.3 Estado hover

Estado ao passar o mouse.

Deve:

- reforçar que é clicável;
- usar transição leve;
- não alterar layout de forma brusca;
- não depender apenas de hover para comunicar função.

### 7.4 Estado focus

Estado ao receber foco por teclado.

Deve:

- ser visível;
- ter contraste;
- não ser removido sem substituto;
- funcionar em navegação por teclado.

### 7.5 Estado active

Estado ao pressionar.

Deve:

- dar sensação de ação;
- ser sutil;
- não causar deslocamento exagerado.

### 7.6 Estado disabled

Estado indisponível.

Deve:

- impedir clique real;
- comunicar indisponibilidade;
- usar `disabled` quando possível;
- usar `aria-disabled` quando necessário;
- explicar motivo quando relevante.

### 7.7 Estado loading

Estado durante operação.

Deve:

- indicar que a ação está em andamento;
- impedir clique duplo quando necessário;
- manter o usuário informado;
- preservar layout;
- não mostrar sucesso antecipado.

Exemplos de texto:

```text
Enviando...
Salvando...
Carregando...
Processando...
Gerando...
```

### 7.8 Estado success

Estado após conclusão real.

Deve:

- aparecer somente após sucesso confirmado;
- não coexistir com erro;
- informar o próximo passo quando necessário.

### 7.9 Estado error

Estado após falha.

Deve:

- informar que houve problema;
- orientar correção;
- não expor dados sensíveis;
- permitir nova tentativa quando aplicável.

---

## 8. Estados de input

Inputs devem comunicar claramente seu estado.

### 8.1 Estados mínimos

```text
empty
filled
focus
validating
valid
invalid
disabled
readonly
error
success
```

### 8.2 Estado empty

Campo vazio.

Deve:

- ter label visível;
- placeholder opcional;
- indicar se obrigatório.

### 8.3 Estado filled

Campo preenchido.

Deve:

- manter label clara;
- não esconder contexto;
- preservar valor digitado.

### 8.4 Estado focus

Campo ativo.

Deve:

- destacar borda ou contorno;
- ser acessível;
- não prejudicar layout.

### 8.5 Estado validating

Quando houver validação assíncrona.

Exemplos:

- verificar e-mail;
- verificar CPF/CNPJ;
- verificar usuário existente;
- consultar CEP;
- validar cupom;
- buscar dados de endereço.

Deve:

- mostrar feedback;
- não bloquear interface inteira sem necessidade;
- impedir envio até conclusão quando necessário.

### 8.6 Estado valid

Campo válido.

Deve:

- ser discreto;
- não depender apenas de cor verde;
- não criar falsa sensação de validação segura se só houve validação frontend.

### 8.7 Estado invalid/error

Campo inválido.

Deve:

- mostrar mensagem próxima ao campo;
- explicar como corrigir;
- não expor detalhe interno;
- estar associado semanticamente quando possível.

### 8.8 Estado disabled

Campo indisponível.

Deve:

- impedir edição;
- comunicar indisponibilidade;
- preservar legibilidade.

### 8.9 Estado readonly

Campo apenas leitura.

Deve:

- parecer não editável;
- manter valor legível;
- explicar quando necessário.

---

## 9. Estados de formulário

Formulários devem ser tratados com atenção máxima.

### 9.1 Estados principais

```text
initial
partially_filled
ready_to_submit
validating
submitting
success
validation_error
network_error
server_error
blocked
reset
```

### 9.2 initial

Formulário ainda não preenchido.

Deve:

- mostrar campos claros;
- indicar obrigatoriedade;
- apresentar política/consentimento quando necessário.

### 9.3 partially_filled

Usuário começou a preencher.

Deve:

- preservar dados;
- validar com cuidado;
- evitar erros agressivos antes da interação;
- indicar progresso quando houver etapas.

### 9.4 ready_to_submit

Formulário aparentemente pronto.

Deve:

- permitir envio;
- manter botão claro;
- garantir que validação visual não substitui validação segura.

### 9.5 validating

Validação em andamento.

Deve:

- impedir envio duplicado quando necessário;
- mostrar feedback;
- preservar dados.

### 9.6 submitting

Envio em andamento.

Deve:

- mostrar loading;
- bloquear botão de envio;
- evitar clique duplo;
- manter usuário informado.

### 9.7 success

Envio concluído.

Deve:

- confirmar envio;
- explicar próximo passo;
- não mostrar erro junto;
- limpar formulário apenas quando fizer sentido.

### 9.8 validation_error

Erro de validação.

Deve:

- mostrar erro geral, se necessário;
- mostrar erro local em cada campo;
- orientar correção;
- preservar dados preenchidos.

### 9.9 network_error

Erro de conexão.

Deve:

- informar falha temporária;
- permitir tentar novamente;
- não apagar dados;
- não culpar o usuário.

### 9.10 server_error

Erro do servidor.

Deve:

- informar falha sem expor detalhes internos;
- permitir nova tentativa;
- registrar erro de forma segura se houver sistema de logs;
- não mostrar stack trace.

### 9.11 blocked

Formulário bloqueado.

Exemplos:

- usuário sem permissão;
- limite atingido;
- conta pendente;
- falta de consentimento;
- campos obrigatórios ausentes;
- regra de negócio impedindo envio.

Deve:

- explicar motivo;
- indicar como resolver quando possível.

### 9.12 reset

Formulário resetado.

Deve:

- limpar mensagens de erro e sucesso;
- voltar ao estado inicial;
- não apagar dados sem intenção clara do usuário.

---

## 10. Estados de páginas com dados

Páginas que carregam dados devem prever estados.

### 10.1 Estados mínimos

```text
loading
loaded_with_data
empty
error
permission_denied
offline
refreshing
```

### 10.2 loading

Dados carregando.

Deve:

- mostrar skeleton, spinner ou mensagem;
- não mostrar dados antigos como se fossem atuais sem indicar;
- evitar tela totalmente branca.

### 10.3 loaded_with_data

Dados carregados com sucesso.

Deve:

- mostrar conteúdo;
- permitir interação;
- informar atualização quando relevante.

### 10.4 empty

Sem dados.

Deve:

- explicar que não há itens;
- não parecer erro;
- oferecer próxima ação quando útil.

Exemplo:

```text
Nenhum orçamento encontrado para este período.
```

### 10.5 error

Erro ao carregar.

Deve:

- explicar falha;
- oferecer tentar novamente;
- não expor detalhes internos.

### 10.6 permission_denied

Usuário sem permissão.

Deve:

- informar claramente;
- não mostrar dados protegidos;
- não revelar informação sensível.

### 10.7 offline

Falha de conexão ou indisponibilidade.

Deve:

- informar problema;
- permitir tentar novamente quando possível.

### 10.8 refreshing

Atualizando dados.

Deve:

- indicar atualização;
- preservar dados existentes quando seguro;
- evitar sensação de travamento.

---

## 11. Estados de modal

Modais devem ter estados claros.

### 11.1 Estados possíveis

```text
closed
opening
open
loading
success
error
closing
```

### 11.2 Regras

- modal fechado não deve prender foco;
- modal aberto deve gerenciar foco;
- botão fechar deve ser acessível;
- tecla Esc deve funcionar quando apropriado;
- ações dentro do modal devem ter loading;
- erro deve aparecer dentro do contexto do modal;
- confirmação destrutiva deve ser clara;
- não abrir modal sobre modal sem necessidade.

---

## 12. Estados de upload

Uploads precisam de estados específicos.

### 12.1 Estados possíveis

```text
idle
drag_over
selected
validating_file
uploading
upload_success
upload_error
file_too_large
invalid_type
permission_error
```

### 12.2 Regras

- validar tipo de arquivo;
- validar tamanho;
- mostrar progresso quando possível;
- permitir remover arquivo antes de enviar;
- informar erro claramente;
- não confiar apenas em validação frontend;
- validar no backend quando houver backend;
- não expor caminho interno;
- não aceitar arquivos perigosos sem controle;
- respeitar skills de segurança.

---

## 13. Estados de busca e filtros

Busca e filtros devem comunicar estado.

### 13.1 Estados possíveis

```text
idle
typing
searching
results
empty
error
cleared
```

### 13.2 Regras

- mostrar quando está buscando;
- evitar disparos excessivos;
- usar debounce quando necessário;
- indicar nenhum resultado;
- permitir limpar filtros;
- não travar interface;
- não expor query interna sensível;
- preservar acessibilidade.

---

## 14. Estados de tabelas

Tabelas administrativas devem prever estados.

### 14.1 Estados possíveis

```text
loading
loaded
empty
error
sorting
filtering
row_action_loading
row_action_success
row_action_error
```

### 14.2 Regras

- loading geral para tabela;
- loading por linha quando ação afeta apenas uma linha;
- erro por linha quando ação falha;
- confirmação para exclusões;
- não remover linha antes de confirmação real, salvo com rollback seguro;
- manter ações próximas da linha afetada;
- não expor dados sem permissão.

---

## 15. Estados de autenticação

Fluxos de autenticação exigem cuidado especial.

### 15.1 Estados possíveis

```text
logged_out
logging_in
logged_in
login_error
session_expired
permission_denied
logging_out
password_reset_requested
```

### 15.2 Regras

- não revelar se e-mail existe quando isso for risco;
- não expor tokens;
- não mostrar detalhes internos;
- não armazenar senha em local inseguro;
- preservar regras de segurança existentes;
- bloquear clique duplo no login;
- mostrar erro seguro e genérico quando apropriado;
- redirecionar apenas para destinos seguros.

---

## 16. Estados em integração com WhatsApp

Quando houver formulário que gera mensagem para WhatsApp, prever estados.

### 16.1 Estados possíveis

```text
initial
filled
validating
generating_message
ready_to_open_whatsapp
opened
error
```

### 16.2 Regras

- validar campos antes de gerar mensagem;
- codificar mensagem corretamente;
- não incluir dados sensíveis desnecessários;
- informar que o WhatsApp será aberto;
- não enviar sem ação clara do usuário;
- preservar consentimento quando necessário;
- evitar expor dados em URL além do necessário;
- manter botão com loading se houver processamento.

---

## 17. Estados mutuamente exclusivos

O Claude Code deve identificar estados que não podem coexistir.

Exemplos:

```text
loading + success = proibido
loading + error = proibido
success + error = proibido
disabled + active = proibido
closed + open = proibido
empty + loaded_with_data = proibido
permission_denied + loaded_with_data = proibido
```

### 17.1 Regra

Sempre que possível, representar o estado como um valor único em vez de vários booleans soltos.

Melhor:

```js
const status = "loading";
```

Pior:

```js
const isLoading = true;
const isSuccess = true;
const isError = true;
```

Booleans podem coexistir indevidamente.

---

## 18. Modelagem recomendada de estado

### 18.1 Em JavaScript simples

```js
let formState = "idle";

function setFormState(nextState) {
  formState = nextState;
  renderFormState();
}
```

Estados:

```js
const FORM_STATES = {
  IDLE: "idle",
  VALIDATING: "validating",
  SUBMITTING: "submitting",
  SUCCESS: "success",
  ERROR: "error"
};
```

### 18.2 Em React

Preferir estado único quando os estados forem mutuamente exclusivos:

```jsx
const [status, setStatus] = useState("idle");
```

Evitar excesso de booleans:

```jsx
const [isLoading, setIsLoading] = useState(false);
const [isSuccess, setIsSuccess] = useState(false);
const [isError, setIsError] = useState(false);
```

Quando necessário, usar reducer:

```jsx
function reducer(state, action) {
  switch (action.type) {
    case "SUBMIT":
      return { status: "submitting", error: null };
    case "SUCCESS":
      return { status: "success", error: null };
    case "ERROR":
      return { status: "error", error: action.error };
    default:
      return state;
  }
}
```

### 18.3 Em PHP/HTML tradicional

Mesmo sem frontend complexo, estados devem existir:

- mensagem de erro após submit;
- mensagem de sucesso após submit;
- preservação dos dados preenchidos;
- validação backend;
- botão de envio claro;
- feedback visual;
- redirecionamento seguro.

---

## 19. Preservação de layouts existentes

Quando já existir uma interface, layout, página, componente, seção ou fluxo criado, o Claude Code não deve apagar tudo e refazer do zero automaticamente.

Antes de alterar estados de um componente existente, deve:

1. analisar o componente atual;
2. identificar estados já existentes;
3. identificar estados ausentes;
4. identificar estados conflitantes;
5. identificar validações existentes;
6. identificar integrações existentes;
7. identificar dependências existentes;
8. propor melhoria incremental;
9. preservar funcionalidades;
10. preservar classes, IDs, eventos, hooks e integrações;
11. evitar refatoração completa sem justificativa.

### 19.1 Melhorias incrementais recomendadas

Ao melhorar estados de componente existente:

1. adicionar loading no botão;
2. bloquear clique duplicado;
3. adicionar mensagem de erro;
4. adicionar mensagem de sucesso;
5. impedir sucesso e erro simultâneos;
6. preservar dados em caso de erro;
7. melhorar estado vazio;
8. adicionar disabled quando necessário;
9. ajustar foco após erro ou sucesso;
10. testar se nada foi quebrado.

### 19.2 Proibição

Não substituir um formulário inteiro ou componente inteiro por uma nova versão apenas para adicionar estados.

Primeiro tente evoluir o que já existe.

---

## 20. Segurança

Máquinas de estado visual não substituem regras de segurança.

### 20.1 Regras obrigatórias

- validação frontend não substitui validação backend;
- loading visual não substitui controle real contra duplicidade;
- disabled visual não substitui permissão no servidor;
- mensagem de erro não deve expor dados internos;
- sucesso visual só deve aparecer após confirmação real;
- permissões devem ser verificadas de forma segura;
- inputs devem ser sanitizados conforme skills de segurança;
- uploads devem ser validados no backend quando houver backend;
- tokens e secrets nunca devem aparecer no estado visual;
- URLs não devem carregar dados sensíveis desnecessários.

### 20.2 Erros seguros

Não mostrar:

```text
Stack trace
Caminho interno
Token
Chave de API
Query SQL
Dados sensíveis
Detalhes de infraestrutura
```

Mostrar:

```text
Não foi possível concluir a ação agora. Tente novamente.
```

Ou, quando apropriado:

```text
Você não tem permissão para executar esta ação.
```

---

## 21. Privacidade e LGPD

Estados de componentes não devem expor dados pessoais.

### 21.1 Regras

- não mostrar dados sensíveis em mensagens de erro;
- não incluir dados pessoais em logs visíveis;
- não enviar dados para WhatsApp sem ação clara;
- não reter dados em formulário mais do que necessário;
- não mostrar dados de outro usuário em estado de carregamento;
- não exibir dados antigos como se fossem atuais;
- não mostrar informação protegida durante loading;
- limpar estados sensíveis após logout.

---

## 22. Acessibilidade

Estados devem ser comunicados também para usuários de tecnologias assistivas.

### 22.1 Regras

- loading importante deve ser anunciado quando necessário;
- erros devem estar associados aos campos;
- foco deve ir para erro ou mensagem importante quando adequado;
- botões disabled devem ser compreensíveis;
- feedback não deve depender apenas de cor;
- sucesso não deve depender apenas de ícone;
- erro não deve depender apenas de cor vermelha;
- usar `aria-live` quando necessário;
- usar `aria-busy` quando apropriado;
- preservar navegação por teclado.

### 22.2 Exemplo

```html
<div role="status" aria-live="polite">
  Enviando mensagem...
</div>
```

Para erro:

```html
<p id="email-error" role="alert">
  Informe um e-mail válido.
</p>
```

---

## 23. Performance

Estados não devem causar renderizações ou scripts desnecessários.

### 23.1 Regras

- evitar listeners excessivos;
- evitar timers sem necessidade;
- limpar timers e subscriptions;
- evitar animações pesadas em loading;
- evitar spinners complexos;
- evitar bibliotecas apenas para estado simples;
- preferir estado local simples quando suficiente;
- usar reducer apenas quando necessário;
- evitar polling agressivo;
- usar debounce em busca quando necessário.

---

## 24. Design visual dos estados

Estados devem ser consistentes com o design system.

### 24.1 Cores comuns

- sucesso: cor positiva;
- erro: cor de alerta/erro;
- aviso: cor de atenção;
- loading: neutra ou primária;
- disabled: neutra reduzida.

Mas nunca depender apenas da cor.

### 24.2 Elementos complementares

Usar quando necessário:

- ícone;
- texto;
- borda;
- background;
- microcopy;
- aria-live;
- foco;
- alteração de botão;
- spinner leve;
- skeleton.

---

## 25. Exemplos práticos

### 25.1 Formulário com estados conceituais

```text
Estado: idle
- botão: "Enviar mensagem"
- campos habilitados

Estado: submitting
- botão: "Enviando..."
- botão desabilitado
- campos podem permanecer habilitados ou bloqueados conforme contexto

Estado: success
- mensagem: "Mensagem enviada com sucesso."
- botão: "Enviar nova mensagem" ou formulário resetado

Estado: error
- mensagem: "Não foi possível enviar agora. Tente novamente."
- botão: "Tentar novamente"
- dados preservados
```

### 25.2 Tabela com estados

```text
loading:
- skeleton da tabela

loaded:
- linhas de dados

empty:
- "Nenhum registro encontrado."

error:
- "Não foi possível carregar os dados."

row_action_loading:
- apenas a linha afetada mostra carregamento
```

### 25.3 Modal de exclusão

```text
closed:
- modal invisível

open:
- pergunta de confirmação

deleting:
- botão "Excluindo..."
- botão bloqueado

success:
- modal fecha ou mostra confirmação

error:
- mostra erro seguro e permite tentar novamente
```

---

## 26. Checklist obrigatório

Antes de finalizar qualquer componente interativo, verificar:

- O estado inicial foi definido?
- Todos os estados possíveis foram mapeados?
- Estados conflitantes foram impedidos?
- Existe loading para ação assíncrona?
- Existe erro?
- Existe sucesso?
- Existe estado disabled?
- Existe estado vazio quando necessário?
- Existe estado de permissão negada quando aplicável?
- O usuário recebe feedback claro?
- Clique duplo é tratado quando necessário?
- Os dados preenchidos são preservados em caso de erro?
- Mensagens de erro são seguras?
- Sucesso só aparece após confirmação real?
- Validação visual não substitui validação segura?
- Estados são acessíveis?
- Estados funcionam no mobile?
- Estados não dependem apenas de cor?
- Nenhuma regra de segurança foi removida?
- Nenhuma funcionalidade existente foi quebrada?

---

## 27. Checklist para formulários

- Estado inicial.
- Estado parcialmente preenchido.
- Estado validando.
- Estado enviando.
- Estado sucesso.
- Estado erro de validação.
- Estado erro de rede.
- Estado erro do servidor.
- Botão disabled durante envio.
- Loading visível.
- Erros próximos dos campos.
- Erro geral quando necessário.
- Dados preservados em caso de erro.
- Consentimento tratado corretamente.
- Política de privacidade visível.
- Validação backend preservada.

---

## 28. Checklist para botões

- Default.
- Hover.
- Focus.
- Active.
- Disabled.
- Loading.
- Success, se aplicável.
- Error, se aplicável.
- Texto muda durante loading.
- Clique duplo tratado.
- Ação destrutiva protegida.
- Não permite clique quando disabled.
- Não mostra sucesso antes da confirmação.

---

## 29. Checklist para páginas com dados

- Loading.
- Dados carregados.
- Estado vazio.
- Erro.
- Permissão negada.
- Atualizando.
- Offline, quando aplicável.
- Retry.
- Não mostra dados sensíveis sem permissão.
- Não mostra tela branca.
- Não mistura dados antigos e novos sem indicar.

---

## 30. Checklist para modais

- Fechado.
- Aberto.
- Loading.
- Sucesso.
- Erro.
- Fechamento claro.
- Foco gerenciado.
- Esc funciona quando apropriado.
- Ação destrutiva confirmada.
- Erro aparece dentro do contexto.
- Não prende foco quando fechado.

---

## 31. Integração com outras skills

Esta skill deve trabalhar junto com:

- `ui-visual-hierarchy`
- `ui-reading-patterns`
- `ui-gestalt-proximity`
- `ui-affordance-interactions`
- `ui-conversion-landing-page`
- `ui-minimal-design-system`
- `ui-premium-responsive-design`
- `ui-brand-fidelity`
- `ui-final-design-review`

A máquina de estados garante que a interface não apenas pareça boa, mas responda corretamente.

---

## 32. Critérios de aceite

A aplicação desta skill será considerada correta quando:

- todo componente interativo relevante tiver estados definidos;
- ações assíncronas tiverem loading;
- erros forem claros e seguros;
- sucessos forem confirmados corretamente;
- estados conflitantes não coexistirem;
- clique duplo for tratado quando necessário;
- dados forem preservados quando apropriado;
- estados forem acessíveis;
- estados funcionarem em mobile;
- validações seguras forem preservadas;
- segurança não for enfraquecida;
- layout existente for preservado sempre que possível.

---

## 33. Resumo operacional para o Claude Code

Sempre que criar ou revisar componente interativo:

1. Identificar a interação.
2. Listar estados possíveis.
3. Definir estado inicial.
4. Definir transições permitidas.
5. Definir transições proibidas.
6. Criar loading quando houver espera.
7. Criar erro seguro.
8. Criar sucesso real.
9. Impedir estados conflitantes.
10. Garantir acessibilidade.
11. Garantir segurança.
12. Preservar validações existentes.
13. Preservar layouts existentes.
14. Fazer melhorias incrementais.
15. Revisar antes de concluir.

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
