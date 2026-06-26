# Lúmina — Funcionalidades Completas

> IA corporativa da Scapini Transportes. Roda localmente em `localhost:8080` via Electron + Node.js.

---

## 1. Chat e Linguagem

- **Chat por texto e voz** — conversa natural em português brasileiro
- **Wake word** — ativa por voz com palavra-chave (NFD/NFC normalizado para Chrome)
- **Conversa contínua** — após ativação por voz, mantém o diálogo sem repetir wake word
- **Inteligência emocional** — detecta o tom do usuário e adapta a resposta
- **ThinkingBudget adaptativo** — 0 tokens para perguntas simples, 512 para procedimentos, 2048 para análises complexas
- **Cache de sessão** — perguntas repetidas retornam resposta instantânea sem gastar API
- **Sanitização de identidade** — filtra vazamentos de persona (Google, Gemini, Anthropic)

---

## 2. Motores de IA (três níveis de fallback)

| Nível | Motor | Quando usa |
|-------|-------|------------|
| 1 | **Gemini 2.5 Flash** (Google) | Sempre que disponível |
| 2 | **lumina-treinada** (Ollama local) | Gemini indisponível / offline |
| 3 | **DEMO local** (base de 365+ tópicos) | Ollama também offline |

- Badge **⚡ local** aparece na mensagem quando usando Ollama
- Nunca exibe erro técnico ao usuário

---

## 3. Voz (TTS)

- **ElevenLabs** — voz neural premium (com API key)
- **Edge TTS** — Microsoft Thalita Neural, gratuito, sem API key (padrão)
- **Piper TTS** — offline, sem internet
- **Browser TTS** — fallback nativo do navegador
- Pré-fetch paralelo de chunks — sem pausa robótica entre frases

---

## 4. Transcrição e Documentos

- **Transcrição de áudio** — envia áudio (opus, mp3, wav, m4a, webm) e transcreve via Gemini
- **PDF** — extrai e analisa conteúdo
- **DOCX** — lê documentos Word
- **Planilhas Excel** — parser especializado para DRE, AR, Balancete (formato CG Contadores)
- **TXT** — leitura e análise de arquivos de texto

---

## 5. Memória e Aprendizado

- **Memória profunda** — salva fatos sobre o usuário e a empresa
- **Relacionamentos** — vincula fatos entre si ("Lucas é CEO da Scapini")
- **Aprendizado inline** — extrai novos fatos diretamente das respostas
- **Consolidação Gemini** — periodicamente consolida e enriquece a memória via IA
- **Persistência híbrida** — localStorage (cache) + servidor (fonte da verdade)
- **Histórico de sessões** — mantém contexto das últimas 40 mensagens

---

## 6. Fine-tuning Local (Ollama)

- **Auto-treino silencioso** — a cada 5 novas conversas reais, reconstrói o modelo `lumina-treinada`
- **Intervalo mínimo** — 15 minutos entre rebuilds para não sobrecarregar
- **Seleção de exemplos** — escolhe os melhores pares pergunta→resposta do histórico (sem erros, resposta rápida)
- **Rebuild manual** — comando `treinar ollama` força o rebuild imediato
- **Status** — comando `status ollama` mostra total de interações e último treino

---

## 7. Financeiro e Contábil

- **Auditoria Contábil** — analisa planilhas e classifica contas em 🔴 Crítico / 🟡 Atenção / 🟢 OK
- **Month-End Closer** — análise de variância mensal, compara mês atual vs anterior vs meta
- **Statement Auditor** — confere demonstrativos financeiros linha a linha
- **DRE** — leitura e interpretação automática da DRE da Scapini (formato CG Contadores)
- **Gráficos DRE** — gera gráficos de faturamento, margem e resultado
- **Relatório de KPIs PDF** — gera PDF institucional com cabeçalho Scapini, seções por área (Operacional, Financeiro, Frota, RH)

---

## 8. Operacional / Frete

- **Cotação de frete** — calcula estimativa baseada em distância, peso, tipo de carga, diesel, pedágio, margem
- **Parâmetros configuráveis** — preço do diesel, pedágio/km, rendimento, margem, custo fixo, velocidade média
- **Consulta CNPJ** — busca dados de empresa via BrasilAPI / ReceitaWS
- **Rastreamento GPS** — consulta telemetria de frota (integração preparada)
- **Informações de motoristas** — roster local para demo e integração futura com CGI

---

## 9. Comercial e Prospecção

- **Prospecção de clientes** — busca empresas por segmento e região para prospectar
- **Envio de e-mails de leads** — envia e-mails para leads via Composio (Gmail conectado)
- **Captação de candidatos** — busca profissionais (motoristas, mecânicos) por região e perfil

---

## 10. RH e Recrutamento

- **Entrevista online** — gera link único por candidato, candidato responde perguntas pelo celular
- **Banco de perguntas** — 30 perguntas por cargo (Motorista, Manutenção, Comprador, Geral), sorteia 10 por entrevista
- **Avaliação automática** — ao terminar a entrevista, Gemini gera nota (0-10), laudo, pontos fortes e pontos de atenção
- **Painel de candidaturas** — lista candidatos com nota, status e faixa (aprovado / em avaliação / reprovado)
- **E-mail de convite** — envia convite com link de entrevista ao candidato
- **Rejeição automática** — candidatos reprovados recebem e-mail automático após 48h
- **Banco de talentos** — candidatos em avaliação recebem re-contato mensal automático
- **Análise de currículo** — lê PDF/DOCX de currículo e gera ficha resumida com fit para a vaga

---

## 11. Informações em Tempo Real

- **Câmbio** — cotação USD, EUR, ARS em tempo real (AwesomeAPI)
- **Ações B3** — cotação de ações (brapi.dev)
- **Clima** — previsão do tempo por cidade (wttr.in)
- **Notícias** — manchetes do G1 e BBC Brasil (RSS, sem API key)
- **Notícias de transporte** — headlines do setor logístico
- **Esportes** — resultados e tabela via ESPN API

---

## 12. Base de Conhecimento (Obsidian / RAG)

- **Import de vault Obsidian** — importa notas do vault para a base da Lúmina
- **Embeddings vetoriais** — busca semântica nas notas (RAG)
- **Busca lexical** — fallback keyword quando embeddings não disponíveis
- **Auto-categorização** — Gemini classifica notas automaticamente por categoria
- **Sync Obsidian** — memória da Lúmina espelha para notas no vault

---

## 13. Automação e Produtividade

- **Browser automation (Puppeteer)** — controla o Chrome: abre páginas, clica, preenche formulários, extrai dados
- **Screenshot** — captura a tela atual e salva em `~/Pictures/Lumina Prints`
- **Gravação de tela** — grava a sessão e salva em `~/Pictures/Lumina Gravacoes`
- **Lembretes agendados** — define lembretes com timer server-side + notificação Windows
- **Notificações Windows** — envia toast notifications nativas
- **Abrir projetos** — abre sistemas internos Scapini por comando de voz (comercial, app motoristas, manutenção)
- **VS Code** — integração com o editor para leitura e edição de código

---

## 14. Geração de Arquivos

- **Excel (.xlsx)** — gera planilhas formatadas
- **Word (.docx)** — gera documentos
- **PowerPoint (.pptx)** — gera apresentações
- **PDF** — gera relatórios com layout institucional Scapini

---

## 15. Dados Persistentes

- **Tarefas** — lista de tarefas com check e persistência
- **Hábitos** — acompanhamento de hábitos
- **Finanças pessoais** — registro de entradas/saídas
- **Notas** — bloco de notas integrado

---

## 16. Segurança

- **Bind 127.0.0.1** — só aceita conexões locais
- **Token local** — todas as rotas sensíveis exigem `x-lumina-token`
- **Origin check** — bloqueia origens externas
- **Helmet** — headers de segurança HTTP
- **Rate limiting** — 30 req/min em `/api/chat` e `/api/tts`; 10 req/min em `/api/browser`
- **Dev tools protegidas** — rotas de leitura/escrita de arquivos exigem `LUMINA_DEV=1`
- **Puppeteer sem --no-sandbox** — roda com sandbox ativo
- **Config protegida** — chaves de API só retornam com token válido

---

## 17. Integração Composio

- **Status** — verifica apps conectados
- **Gmail** — conecta e envia e-mails de leads prospectados
- **Expansível** — suporte a qualquer app via Composio REST API v3

---

## Stack Técnica

| Componente | Tecnologia |
|-----------|-----------|
| Frontend | Vanilla JS + HTML/CSS |
| Desktop | Electron |
| Backend | Node.js + Express |
| LLM principal | Gemini 2.5 Flash |
| LLM local | Ollama (llama3.2:3b / lumina-treinada) |
| TTS padrão | Edge TTS (Microsoft Thalita Neural) |
| TTS premium | ElevenLabs |
| TTS offline | Piper |
| Banco de dados | SQLite (better-sqlite3) |
| Automação web | Puppeteer |
| Documentos | mammoth (DOCX) + pdf-parse (PDF) |
| Notificações | node-notifier |
| Segurança | helmet + express-rate-limit |
