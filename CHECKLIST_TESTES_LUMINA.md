# Checklist de Testes Manual — Lúmina IA (Scapini Transportes)

> Documento gerado em 2026-06-25 | Para uso antes da apresentação à diretoria (~2026-07-07)
>
> **Como usar:** Execute cada teste na ordem. Marque ✅ aprovado, ⚠️ aprovado com ressalva, ❌ reprovado.
> Um item ❌ em qualquer teste do Bloco A bloqueia a demo.

---

## BLOCO A — Inicialização e Infraestrutura (Pré-requisito obrigatório)

### A1 — Inicialização do Electron

**Passos:**
1. Executar `npm run lumina` no terminal
2. Aguardar mensagem no console: `Lúmina → http://127.0.0.1:8080`
3. Aguardar a janela abrir automaticamente

**Resultado esperado:**
- Console mostra banner ASCII da Lúmina sem erros vermelhos
- Janela da Lúmina abre centralizada, fundo escuro `#0a0303`
- Tray icon vermelho aparece na bandeja do sistema
- Nenhum erro EADDRINUSE (indica que killPort(8080) funcionou)

**Critério de aprovação:** Janela visível em < 5 segundos sem erro no console.

---

### A2 — Ícone na Bandeja (Tray)

**Passos:**
1. Com a janela aberta, pressionar Esc
2. Clicar no ícone na bandeja do sistema
3. Clicar com botão direito → ver menu contextual

**Resultado esperado:**
- Esc oculta a janela
- Clique no tray mostra a janela novamente
- Menu contextual tem: Mostrar Lúmina, Esconder, Iniciar com Windows, Sair

**Critério de aprovação:** Todos os 4 itens do menu aparecem; Esc oculta e clique mostra.

---

### A3 — Atalho Global F6

**Passos:**
1. Esconder a janela (Esc ou clique no tray)
2. Pressionar F6 com outra aplicação em foco

**Resultado esperado:**
- Janela aparece sobre a aplicação ativa
- F6 novamente oculta a janela

**Critério de aprovação:** Toggle correto a partir de qualquer aplicação.

---

### A4 — Token de Sessão Local

**Passos:**
1. Abrir DevTools (Ctrl+Shift+I no Electron)
2. Na aba Network, fazer qualquer pergunta ao chat
3. Verificar o header `X-Lumina-Token` nas requisições para `POST /api/chat`

**Resultado esperado:**
- Header presente em todas as requisições POST
- Valor é uma string hex de 64 caracteres
- Requisição sem o header retorna 401 (testar via curl ou fetch manual no console)

**Critério de aprovação:** Token presente; sem token → 401.

---

## BLOCO B — Chat e IA

### B1 — Resposta Gemini

**Passos:**
1. Digitar: "Qual o CNPJ da Scapini Transportes?"
2. Aguardar resposta

**Resultado esperado:**
- Lúmina responde com informação sobre a Scapini (ou tenta buscar)
- Resposta não vaza "Gemini", "Google AI" ou "Claude" (sanitizeIdentity)
- Badge "DEMO" NÃO aparece (resposta veio do Gemini real)

**Critério de aprovação:** Resposta coerente sem vazar identidade do modelo base.

---

### B2 — Fallback DEMO

**Passos:**
1. Temporariamente: colocar geminiKey inválida no config (para simular erro)
2. Ou: desconectar internet
3. Digitar qualquer pergunta simples

**Resultado esperado:**
- Lúmina responde mesmo sem Gemini
- Badge "DEMO" ou indicador visual de modo offline aparece na UI
- Resposta faz sentido para o contexto Scapini

**Critério de aprovação:** Resposta em < 2 segundos sem Gemini.

> Restaurar geminiKey válida após o teste.

---

### B3 — DEMO_QA (Respostas do Workshop)

**Passos:** Testar cada uma das perguntas mapeadas no DEMO_QA (arquivo mockData.js):

1. Digitar a pergunta exata
2. Digitar a pergunta com variação de capitalização
3. Digitar a pergunta com um erro de digitação leve

**Resultado esperado:**
- Respostas corretas nas variações 1 e 2 (normalizeText cuida da capitalização)
- Variação 3 pode ou não coincidir (aceitável)
- Nenhuma resposta do DEMO_QA deve acionar o Gemini (verificar logs)

**Critério de aprovação:** 100% de acertos para perguntas exatas; >80% para variações.

---

### B4 — Cache de Sessão

**Passos:**
1. Fazer uma pergunta específica (ex: "Qual a temperatura em Porto Alegre?")
2. Aguardar resposta
3. Repetir a mesma pergunta

**Resultado esperado:**
- Segunda resposta chega em < 500ms (cache hit)
- Resposta é idêntica à primeira

**Critério de aprovação:** Segunda pergunta é visivelmente mais rápida.

---

### B5 — Memória Persistente

**Passos:**
1. Dizer: "Lúmina, meu nome é [nome de teste]"
2. Aguardar confirmação
3. Fechar e reabrir a Lúmina
4. Perguntar: "Qual é o meu nome?"

**Resultado esperado:**
- Lúmina responde com o nome informado após reinício
- Memória persistiu via `POST /api/memory` e arquivo memory.json

**Critério de aprovação:** Memória sobrevive ao reinício do app.

---

## BLOCO C — Voz

### C1 — Wake Word

**Passos:**
1. Aguardar 3 segundos após inicialização (startWakeWord auto-ativa)
2. Falar claramente: "Lúmina, qual o horário?"
3. Aguardar detecção

**Resultado esperado:**
- Rosto da Lúmina muda para estado "listening"
- Transcrição aparece na caixa de texto
- Resposta é gerada

**Critério de aprovação:** Wake word detectada em ambiente com ruído controlado.

---

### C2 — Ruído de Fundo (Stress Test)

**Passos:**
1. Reproduzir áudio de fundo (música ambiente baixa)
2. Aguardar 30 segundos sem falar

**Resultado esperado:**
- Wake word NÃO dispara por ruído ambiente
- Console não mostra chamadas desnecessárias a `POST /api/transcribe-audio`

**Critério de aprovação:** Zero falsos positivos em 30 segundos de ruído ambiente moderado.

---

### C3 — TTS ElevenLabs

**Passos:**
1. Verificar que `elevenLabsKey` e `voiceId` estão configurados
2. Fazer uma pergunta curta: "Bom dia, Lúmina"
3. Aguardar resposta falada

**Resultado esperado:**
- Voz é a da ElevenLabs (qualidade neural alta)
- Rosto muda para estado "speaking"
- Resposta completa sem cortes

**Critério de aprovação:** Áudio começa em < 3 segundos; qualidade neural confirmada.

---

### C4 — Fallback TTS Edge

**Passos:**
1. Temporariamente: invalidar elevenLabsKey
2. Fazer uma pergunta curta

**Resultado esperado:**
- Lúmina fala com voz Microsoft Edge (qualidade boa, sem key necessária)
- Sem erro visível ao usuário
- Sem mensagem de falha de TTS

**Critério de aprovação:** Áudio começa em < 4 segundos com voz Edge.

> Restaurar elevenLabsKey após o teste.

---

### C5 — Fallback TTS Browser

**Passos:**
1. Desconectar internet (para bloquear msedge-tts)
2. Fazer uma pergunta curta

**Resultado esperado:**
- Lúmina fala com SpeechSynthesis nativo do Electron
- Voz menos natural, mas funcional

**Critério de aprovação:** Áudio produzido mesmo sem internet.

---

## BLOCO D — Gestão de Dados

### D1 — Criar e Verificar Tarefa

**Passos:**
1. Dizer: "Lúmina, cria uma tarefa: Revisar contrato até amanhã"
2. Aguardar confirmação
3. Abrir o painel de tarefas na UI

**Resultado esperado:**
- Tarefa aparece no painel com prazo
- Arquivo `tasks.json` atualizado (verificar via DevTools ou terminal)
- Nota correspondente no Obsidian Vault criada (se vault configurado)

**Critério de aprovação:** Tarefa visível na UI e persistida no JSON.

---

### D2 — Registro de Hábito

**Passos:**
1. Dizer: "Lúmina, registra que tomei água hoje"
2. Perguntar: "Quais hábitos fiz hoje?"

**Resultado esperado:**
- Hábito marcado no dia de hoje
- Segunda pergunta lista o hábito concluído
- `habits.json` atualizado

**Critério de aprovação:** Hábito registrado e listado corretamente.

---

### D3 — Nota com RAG

**Passos:**
1. Salvar uma nota: "Lúmina, salva: A transportadora parceira é a Expresso São Miguel, telefone 51-99999-0000"
2. Aguardar indexação (triggerReindex automático)
3. Perguntar: "Qual o telefone da São Miguel?"

**Resultado esperado:**
- Lúmina recupera a nota via busca semântica
- Resposta cita o telefone salvo
- Sem acesso ao Gemini (só usa embeddings locais)

**Critério de aprovação:** Recuperação correta em < 3 segundos.

---

### D4 — Lembretes Proativos

**Passos:**
1. Dizer: "Lúmina, me lembra em 2 minutos para beber água"
2. Aguardar 2 minutos

**Resultado esperado:**
- Toast notification do Windows aparece
- SSE via `/api/events` envia evento de reminder
- Lúmina fala o lembrete (se janela estiver aberta)

**Critério de aprovação:** Lembrete chegou no tempo correto.

---

## BLOCO E — Módulo de Frete

### E1 — Estimativa de Frete

**Passos:**
1. Dizer: "Lúmina, calcula o frete de Porto Alegre para São Paulo, 10 toneladas"
2. Aguardar resposta

**Resultado esperado:**
- Lúmina chama `POST /api/frete-estimate`
- Retorna valor estimado em R$, distância em km, tempo estimado
- Cotação salva no banco SQLite

**Critério de aprovação:** Resposta com valores numéricos coerentes; sem erro de geocode.

---

### E2 — Exportação de Leads

**Passos:**
1. Garantir que há ao menos 1 lead no banco (criar via prospect ou manualmente)
2. Dizer: "Lúmina, exporta os leads"
3. Aguardar download

**Resultado esperado:**
- Arquivo Excel baixado com os leads
- Arquivo abre no Excel/LibreOffice sem erro
- Dados correspondem ao banco SQLite

**Critério de aprovação:** Arquivo Excel válido com dados corretos.

---

## BLOCO F — Módulo de Recrutamento (RH)

### F1 — Criação de Candidatura

**Passos:**
1. Acessar diretamente `http://127.0.0.1:8080/entrevista/[token]` (criar via POST /api/candidatura)
2. Responder ao menos 2 perguntas da entrevista

**Resultado esperado:**
- Formulário de entrevista carrega corretamente
- Respostas são salvas no banco `data/recrutamento.db`
- Ao final, e-mail é enviado para Marjorie (se SMTP configurado)

**Critério de aprovação:** Respostas salvas no banco; e-mail enviado (ou log de aviso se SMTP offline).

---

### F2 — Painel de Candidaturas

**Passos:**
1. Acessar `http://127.0.0.1:8080/candidaturas` no Electron (via Lúmina: "abre candidaturas")
2. Verificar lista de candidatos

**Resultado esperado:**
- Lista de candidaturas exibida
- Colunas: nome, cargo, data, status
- Dados correspondem ao banco

**Critério de aprovação:** Painel carrega sem erro 404 e exibe dados reais.

---

## BLOCO G — Consultas Externas

### G1 — CNPJ

**Passos:**
1. Dizer: "Lúmina, consulta o CNPJ 12.345.678/0001-00" (usar um CNPJ real)

**Resultado esperado:**
- Lúmina retorna razão social, endereço e situação cadastral
- Usado pelo menos uma das 3 fontes (BrasilAPI / ReceitaWS / cnpj.ws)

**Critério de aprovação:** Dados corretos do CNPJ consultado.

---

### G2 — Clima e Câmbio

**Passos:**
1. Dizer: "Qual o tempo em Caxias do Sul agora?"
2. Dizer: "Qual o dólar hoje?"

**Resultado esperado:**
- Clima retorna temperatura e condição atual (wttr.in)
- Câmbio retorna cotação BRL/USD atual (AwesomeAPI)

**Critério de aprovação:** Dados retornados coerentes com data/hora atual.

---

## BLOCO H — Geração de Documentos

### H1 — Relatório KPI PDF

**Passos:**
1. Dizer: "Lúmina, gera um relatório KPI do mês"

**Resultado esperado:**
- PDF baixado com cabeçalho/rodapé Scapini
- Tabela de KPIs colorida
- Arquivo abre sem erro

**Critério de aprovação:** PDF válido com identidade visual Scapini.

---

### H2 — Geração de PPTX

**Passos:**
1. Dizer: "Lúmina, cria uma apresentação sobre a frota da Scapini"

**Resultado esperado:**
- Arquivo `.pptx` baixado
- Abre no PowerPoint/LibreOffice
- Conteúdo gerado pelo Gemini

**Critério de aprovação:** PPTX abre sem erro; conteúdo coerente com o tema.

---

## BLOCO I — Segurança

### I1 — Bloqueio de Origem Cruzada

**Passos:**
1. No navegador externo (Chrome), acessar `http://127.0.0.1:8080`
2. Tentar fazer uma requisição `POST /api/chat` com `fetch()`

**Resultado esperado:**
- Requisição retorna 403 (origem bloqueada por `isTrustedOrigin()`)
- Console do servidor mostra "[BLOQUEADO] Origem não confiável"

**Critério de aprovação:** 403 confirmado para origem externa.

---

### I2 — Rate Limit

**Passos:**
1. Enviar 35 requisições em 1 minuto para `POST /api/chat`

**Resultado esperado:**
- A partir da 31ª requisição, retorno 429 "Muitas requisições"

**Critério de aprovação:** 429 na 31ª requisição.

---

### I3 — Path Traversal nos Dev Tools

**Passos (apenas com LUMINA_DEV=1):**
1. Fazer POST `/api/dev/read` com `{"path": "../../../etc/passwd"}`
2. Fazer POST `/api/dev/read` com `{"path": "C:/Windows/System32/drivers/etc/hosts"}`

**Resultado esperado:**
- Ambas retornam erro 403 "Caminho não permitido"
- `resolveWorkspacePath()` bloqueou o acesso

**Critério de aprovação:** 403 em ambas as tentativas.

---

### I4 — Upload de Arquivo Inválido

**Passos:**
1. Fazer upload de um arquivo `.exe` renomeado para `.pdf`
2. Fazer upload de um arquivo `.pdf` real

**Resultado esperado:**
- `.exe` renomeado → rejeitado (magic bytes inválidos: não começa com `%PDF-`)
- `.pdf` real → aceito e processado

**Critério de aprovação:** Validação de magic bytes funciona independente da extensão.

---

## Critérios Gerais de Aprovação para a Demo

| Categoria | Mínimo para aprovação |
|-----------|----------------------|
| Inicialização | A1, A2, A3, A4 todos ✅ |
| Chat e IA | B1, B3, B5 todos ✅ |
| Voz | C1, C3 ✅ (C4 e C5 ⚠️ aceitável) |
| Gestão de dados | D1, D2 ✅ |
| Frete | E1 ✅ |
| RH | F1 ⚠️ (pode ficar pendente se SMTP não configurado) |
| Consultas externas | G1, G2 ✅ |
| Documentos | H1 ✅ |
| Segurança | I1, I2 ✅ (I3, I4 verificação interna) |

**Um único ❌ nos itens de mínimo bloqueia a apresentação.**

---

*Arquivo gerado automaticamente como parte da análise arquitetural da Lúmina v2.0.0*
