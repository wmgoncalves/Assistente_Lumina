# ROADMAP DE INTEGRAÇÃO — LÚMINA IA CORPORATIVA
**Scapini Transportes | 2026-06-26**

> Roadmap técnico em 5 fases. Prioridade: apresentação para a diretoria (~2026-07-07).  
> Módulos marcados com `[APRESENTAÇÃO]` são obrigatórios antes do dia da demo.

---

## VISÃO GERAL

```
AGORA → FASE 1 (estabilização) → FASE 2 (núcleo) → FASE 3 (módulos corporativos)
      → FASE 4 (automação e RAG) → FASE 5 (qualidade para apresentação) → APRESENTAÇÃO
```

**Estado atual:** 69% das funcionalidades integradas. Foco agora é corrigir os 2 itens críticos de segurança e garantir qualidade da demo.

---

## FASE 1 — ESTABILIZAÇÃO E SEGURANÇA
**Prazo sugerido:** 1-2 dias  
**Objetivo:** Garantir que a aplicação está segura, estável e não expõe credenciais.

### 1.1 Segurança Crítica `[APRESENTAÇÃO]`

**Tarefa 1.1.1 — Mover credenciais para variáveis de ambiente**
```
Problema: config.json tem API keys em plaintext no diretório do projeto
Risco: Exposição de credenciais se PC compartilhado ou copiado
Solução: Criar .env + carregar com dotenv no server.js
```
Passos:
1. Instalar dotenv: `npm install dotenv`
2. Criar `.env` na raiz com `GEMINI_KEY=`, `ELEVENLABS_KEY=`, `COMPOSIO_KEY=`, `SMTP_PASS=`
3. Adicionar `.env` no `.gitignore`
4. Modificar `server.js` para ler de `process.env` com fallback para `config.json` (compatibilidade)
5. Manter `config.json` para parâmetros de frete e configurações não-sensíveis

**Tarefa 1.1.2 — Proteger `/api/download-doc`**
```
Problema: Endpoint público — qualquer processo local pode baixar arquivos de uploads/
Solução: Adicionar verificação de token (2 linhas de código)
```

**Tarefa 1.1.3 — Adicionar AbortSignal no Gemini de `/api/chat`**
```
Problema: Requisição Gemini pode travar indefinidamente sem timeout
Solução: AbortSignal.timeout(30000) no fetch do Gemini em server.js
```

### 1.2 Rate Limiting Complementar

**Tarefa 1.2.1 — Rate limit em rotas pesadas**
```
Endpoints sem limite: /api/ingest-doc, /api/transcribe-audio, /api/frete,
                      /api/prospect-clientes, /api/generate-file
Solução: uploadLimiter (10/min) e heavyLimiter (5/min)
```

### 1.3 Correções de Bugs

**Tarefa 1.3.1 — Corrigir NBA no mapa ESPN**
```
Problema: nba: null no mapa ESPN_LEAGUES — erro silencioso
Solução: Remover NBA do mapa ou implementar handler correto
```
```javascript
// server.js — opção simples: remover entry null
// nba: null  ← deletar essa linha
```

**Tarefa 1.3.2 — Rate limit em /api/candidatura (público)**
```
Problema: Rota pública de entrevista sem proteção contra abuso
Solução: candidaturaLimiter (30 req / 15min por IP)
```

### 1.4 Validação da Inicialização

**Tarefa 1.4.1 — Testar startup completo**
```
Checklist:
[ ] npm run lumina abre Electron corretamente
[ ] Server sobe em 127.0.0.1:8080
[ ] Token é gerado e injetado no fetch
[ ] Voz reconhece wake word
[ ] Gemini responde
[ ] Ollama responde se Gemini offline
[ ] DEMO funciona se ambos offline
[ ] Tray e F6 funcionam
[ ] Auto-start no login configurado
```

---

## FASE 2 — NÚCLEO DA LÚMINA
**Prazo sugerido:** 1-2 semanas  
**Objetivo:** Solidificar os módulos centrais com persistência correta no SQLite.

### 2.1 Migração de Dados JSON → SQLite

**Tarefa 2.1.1 — Migrar tarefas para SQLite**
```
Atual: tasks.json + localStorage
Destino: tabela tarefas no Lumina.db
Impacto: Consultas por data, prioridade, filtros
```

**Tarefa 2.1.2 — Migrar hábitos para SQLite**
```
Atual: habits.json + localStorage
Destino: tabelas habitos + habito_registros
Impacto: Histograma de dias, streaks, estatísticas
```

**Tarefa 2.1.3 — Migrar finanças para SQLite**
```
Atual: finances.json + localStorage
Destino: tabela financas
Impacto: Relatórios por período, categorias, saldo
```

**Tarefa 2.1.4 — Migrar memória para SQLite**
```
Atual: memory.json + tabela fatos (criada mas vazia)
Destino: Popular tabela fatos no Lumina.db
Impacto: Busca estruturada, relacionamentos, consolidação
```

**Tarefa 2.1.5 — Migrar base de conhecimento para SQLite**
```
Atual: notes.json
Destino: tabela conhecimento
Impacto: Full-text search, filtro por categoria, fonte
```

### 2.2 RAG / Embeddings

**Tarefa 2.2.1 — Migrar embeddings.json para SQLite**
```
Atual: JSON flat cresce indefinidamente
Destino: tabela embeddings com vector BLOB
Impacto: Performance, sem rebuild total a cada mudança
Dependência: sqlite-vec ou serialização manual de Float32Array
```

**Tarefa 2.2.2 — Re-index incremental**
```
Atual: Rebuild total a cada mudança de nota
Destino: Re-index apenas das notas alteradas (por hash)
Impacto: Performance para vaults grandes
```

### 2.3 Chat e Histórico

**Tarefa 2.3.1 — Unificar histórico localStorage e SQLite**
```
Atual: Histórico em localStorage (cache) + SQLite (log)
Situação: Funciona mas pode dessincronizar
Solução: SQLite como fonte única, localStorage como cache de sessão
```

### 2.4 Configurações

**Tarefa 2.4.1 — Criar painel de configurações na UI**
```
Atual: Configurações só via chat ("configure gemini key...")
Destino: Tela de configurações com campos visuais
Inclui: API keys, modelo Ollama, parâmetros de frete, SMTP
```

---

## FASE 3 — MÓDULOS CORPORATIVOS
**Prazo sugerido:** 2-4 semanas  
**Objetivo:** Polir e integrar completamente os módulos de negócio da Scapini.

### 3.1 Financeiro / DRE

**Tarefa 3.1.1 — Integrar DRE com histórico de meses**
```
Atual: Análise de planilha pontual (arquivo por arquivo)
Destino: Banco histórico de DREs mensais para comparação automática
```

**Tarefa 3.1.2 — Relatório KPI automatizado**
```
Atual: Geração sob demanda
Destino: Agendamento mensal automático + envio por email
```

### 3.2 RH / Recrutamento

**Tarefa 3.2.1 — Expandir banco de perguntas**
```
Atual: 5 perguntas hardcoded por cargo
Destino: 30 perguntas por cargo, sorteio de 10 por entrevista
Inclui: Vagas configuráveis (não só as 4 atuais)
```

**Tarefa 3.2.2 — Painel RH interno Lúmina**
```
Atual: /api/candidaturas disponível
Destino: Tela visual na Lúmina para ver/filtrar candidatos
Nota: Portal RH externo congelado — este é o painel interno
```

**Tarefa 3.2.3 — Análise comparativa de candidatos**
```
Atual: Avaliação individual
Destino: Comparação side-by-side de candidatos para a mesma vaga
```

### 3.3 Operacional / Frete

**Tarefa 3.3.1 — Integração rastreamento CGI**
```
Atual: MOTORISTAS_DEMO hardcoded
Destino: API real do sistema CGI Scapini
Bloqueio: Aguarda definição da API CGI pela TI da Scapini
```

**Tarefa 3.3.2 — Histórico de cotações**
```
Atual: Cotações salvas no SQLite mas sem UI de consulta
Destino: "Minhas últimas cotações" acessível por chat
```

### 3.4 Comercial / Prospecção

**Tarefa 3.4.1 — CRM visual na Lúmina**
```
Atual: Leads no SQLite, acesso só por chat
Destino: Pipeline Kanban de leads (novo/contatado/proposta/fechado)
```

**Tarefa 3.4.2 — Testar Composio Gmail OAuth em produção**
```
Atual: OAuth configurado com callback localhost:8080
Risco: Composio pode não aceitar localhost como redirectUri
Ação: Testar o fluxo completo de conexão Gmail
```

---

## FASE 4 — AUTOMAÇÃO E RAG AVANÇADO
**Prazo sugerido:** 1-2 meses  
**Objetivo:** Elevar capacidades de automação e busca semântica.

### 4.1 Obsidian / RAG

**Tarefa 4.1.1 — Embeddings no SQLite com busca eficiente**
```
Implementar tabela embeddings com serialização de vetores
Cosine similarity em memória para coleções < 10.000 vetores
Fallback para busca lexical mantido
```

**Tarefa 4.1.2 — Sync automático com vault Obsidian**
```
Atual: Sync manual via comando
Destino: Watcher de alterações no vault, sync em background
```

### 4.2 Puppeteer Avançado

**Tarefa 4.2.1 — Anti-prompt-injection em conteúdo web**
```
Aplicar sanitizeForLLM() antes de injetar conteúdo de páginas no contexto
```

**Tarefa 4.2.2 — Scraping de dados da Scapini (sistemas internos)**
```
Extrair dados do sistema CGI via Puppeteer como etapa intermediária
Antes da integração API direta (preparação)
```

### 4.3 Notificações e Lembretes

**Tarefa 4.3.1 — Lembretes recorrentes**
```
Atual: Recorrência prevista no schema (diario/semanal/mensal) mas sem handler
Destino: Scheduler processa recorrências automaticamente
```

**Tarefa 4.3.2 — Proativo horário**
```
Atual: checkProactive() a cada 60s verifica hábitos e tarefas
Melhorar: Sugestões contextuais baseadas no horário e dia da semana
```

### 4.4 VS Code Integration

**Tarefa 4.4.1 — Completar integração dev**
```
Atual: readFile, editFile, writeFile, runCommand via LUMINA_DEV=1
Destino: Interface de seleção de arquivo com LUMINA_DEV ativo por padrão em dev
```

---

## FASE 5 — QUALIDADE PARA APRESENTAÇÃO
**Prazo sugerido:** 3-5 dias antes da data `[APRESENTAÇÃO]`  
**Objetivo:** Demo impecável, dados controlados, interface polida.

### 5.1 Dados Demo `[APRESENTAÇÃO]`

**Tarefa 5.1.1 — Limpar/resetar banco para demo**
```
Criar script reset-demo.js que:
- Limpa tabela historico (conversas antigas de teste)
- Mantém MOTORISTAS_DEMO correto
- Popula leads de exemplo para demonstrar prospecção
- Popula candidatos de exemplo para demonstrar RH
- Popula lembretes de exemplo
```

**Tarefa 5.1.2 — Verificar DEMO_QA está completo**
```
Testar todos os 20+ pares de DEMO_QA com as perguntas que a diretoria vai fazer:
- "Quem são os sócios da Scapini?"
- "Quais motoristas estão ativos?"
- "Qual a situação financeira do mês?"
- "Como você me ajuda no dia a dia?"
- "Você pode substituir funcionários?"
```

**Tarefa 5.1.3 — Preparar planilha DRE de exemplo**
```
Ter uma planilha DRE no formato CG Contadores pronta para upload durante a demo
Garantir que a análise DRE funciona ao vivo
```

### 5.2 Interface `[APRESENTAÇÃO]`

**Tarefa 5.2.1 — Status visual das integrações**
```
Adicionar indicadores na UI:
- Ponto verde: Gemini conectado | Ponto amarelo: Offline (usando Ollama) | Ponto cinza: DEMO
- Indicador de Ollama disponível/indisponível
```

**Tarefa 5.2.2 — Comandos escondidos → botões visíveis**
```
Adicionar botões ou atalhos visíveis para:
- Screenshot (câmera icon)
- Upload de documento (paperclip)
- Status da IA (info icon)
```

**Tarefa 5.2.3 — Teste completo de fluxo da apresentação**
```
Roteiro de demo testado 3x antes do dia:
1. Wake word ativa a Lúmina
2. Apresentação da empresa
3. Consulta financeira (DRE)
4. Cotação de frete ao vivo
5. Consulta de motoristas
6. Busca de candidatos
7. Prospecção de clientes
8. Lúmina offline → Ollama → badge ⚡ local
9. Geração de relatório PDF
```

### 5.3 Logs e Performance `[APRESENTAÇÃO]`

**Tarefa 5.3.1 — Limpar console.log de desenvolvimento**
```
Remover ou comentar console.log excessivos que aparecem no Electron DevTools
Manter apenas os [Lúmina] prefixados que são relevantes
```

**Tarefa 5.3.2 — Testar cold start**
```
Fechar a Lúmina completamente e abrir novamente
Medir tempo de inicialização e garantir < 5 segundos
Verificar que wake word ativa após 3 segundos do launch
```

---

## DEPOIS DA APRESENTAÇÃO

### Separação Sky / Lúmina
```
Conforme decisão de 2026-06-12:
- Bifurcar código em dois modos: Sky (pessoal) e Lúmina (corporativo)
- Implementar após a apresentação Scapini (~2026-07-07)
- Sky herda as funcionalidades pessoais (hábitos, finanças, notas, tarefas)
- Lúmina mantém o foco corporativo (frete, RH, prospecção, DRE)
```

### Fine-tuning Avançado
```
Pipeline Ollama para reduzir dependência do Gemini API:
- Acumular pelo menos 100 conversas reais pós-apresentação
- Avaliar qualidade do modelo lumina-treinada vs Gemini
- Considerar usar um modelo maior (llama3:8b ou mistral:7b) como base
```

### Integração CGI
```
Prioridade pós-apresentação:
- Rastreamento GPS real de frota
- Dados reais de motoristas
- Integração com sistema de ordem de serviço
```

---

## RESUMO DE PRIORIDADES

### OBRIGATÓRIO antes da apresentação (~2026-07-07)
1. Mover credenciais para `.env`
2. Proteger `/api/download-doc` com token
3. Corrigir NBA no mapa ESPN
4. Adicionar AbortSignal no Gemini de `/api/chat`
5. Preparar dados demo controlados
6. Testar roteiro da apresentação 3x

### IMPORTANTE (próximas 2-4 semanas)
7. Migrar dados JSON para SQLite (tarefas, hábitos, finanças, memória)
8. Rate limit complementar
9. Expandir banco de perguntas RH (30 por cargo)
10. Painel de configurações visual

### FUTURO (1-3 meses)
11. Separação Sky / Lúmina
12. Integração CGI real
13. RAG em SQLite (sqlite-vec)
14. CSP habilitado
15. Lembretes recorrentes
