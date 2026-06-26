# CHECKLIST DE TESTES — LÚMINA IA CORPORATIVA
**Scapini Transportes | 2026-06-26**

> Execute este checklist antes de qualquer apresentação para a diretoria.  
> Marque ✅ quando passar, ❌ quando falhar (registre o motivo).

---

## GRUPO 1 — INICIALIZAÇÃO

| # | Teste | Como testar | Resultado esperado |
|---|-------|------------|-------------------|
| 1.1 | Cold start Electron | Fechar completamente e abrir com `npm run lumina` | Janela abre em < 5 segundos |
| 1.2 | Servidor sobe corretamente | Ver logs no Electron DevTools (F12) | Mensagem "Servidor rodando em 127.0.0.1:8080" |
| 1.3 | Wake word ativa após startup | Esperar 3s e dizer "Lúmina" | IA responde "Pronto, pode falar" |
| 1.4 | F6 esconde/mostra janela | Pressionar F6 | Janela some e reaparece |
| 1.5 | Tray icon aparece | Ver system tray | Ícone da Lúmina visível |
| 1.6 | Token injetado no fetch | DevTools → Network → ver header X-Lumina-Token | Header presente em todas as chamadas /api/ |

---

## GRUPO 2 — CHAT BÁSICO

| # | Teste | Input | Resultado esperado |
|---|-------|-------|-------------------|
| 2.1 | Saudação simples | "Olá Lúmina" | Resposta natural em português |
| 2.2 | Pergunta sobre a empresa | "O que é a Scapini Transportes?" | Informações sobre a Scapini |
| 2.3 | Pergunta sobre a própria IA | "Quem te criou?" | "Sou a Lúmina, IA da Scapini" (sem mencionar Google/Gemini/Anthropic) |
| 2.4 | Chat por texto direto | Digitar mensagem e Enter | Resposta em < 5 segundos |
| 2.5 | Conversa múltiplas mensagens | 5 perguntas seguidas | Contexto mantido entre mensagens |
| 2.6 | Abreviações PT-BR | "vc pode me ajudar?" | "você" normalizado antes de enviar |
| 2.7 | Cache de sessão | Repetir mesma pergunta | Segunda resposta chega instantânea |

---

## GRUPO 3 — VOZ

| # | Teste | Como testar | Resultado esperado |
|---|-------|------------|-------------------|
| 3.1 | Wake word básico | Dizer "Lúmina" em tom normal | Ativa e responde |
| 3.2 | Wake word com sotaque | Dizer "Lumina" (sem acento) | Ativa (NFD/NFC normalizado) |
| 3.3 | Conversa contínua | Após wake word, fazer pergunta direta | Não precisa repetir "Lúmina" |
| 3.4 | Comando de voz complexo | "Qual a cotação do dólar hoje?" | Busca cotação e responde por voz |
| 3.5 | Ruído de fundo | Testar com barulho ao redor | Wake word não ativa sem intenção |

---

## GRUPO 4 — TTS (VOZ DA LÚMINA)

| # | Teste | Como testar | Resultado esperado |
|---|-------|------------|-------------------|
| 4.1 | Edge TTS (padrão) | Perguntar algo, esperar resposta | Voz Thalita Neural em PT-BR |
| 4.2 | Sem gaps entre frases | Resposta com múltiplas frases | Áudio contínuo sem pausas robóticas |
| 4.3 | ElevenLabs (se configurado) | Configurar key e perguntar | Voz premium diferente da Edge |
| 4.4 | Piper TTS offline | Desconectar internet, perguntar | Voz local via piper.exe |
| 4.5 | Fallback Browser TTS | Simular falha de Edge e Piper | SpeechSynthesis do browser ativa |
| 4.6 | Parar TTS | Clicar em stop / nova mensagem | Áudio para imediatamente |

---

## GRUPO 5 — FALLBACK DE IA

| # | Teste | Como testar | Resultado esperado |
|---|-------|------------|-------------------|
| 5.1 | Gemini online | Perguntar qualquer coisa | Resposta vem do Gemini (sem badge) |
| 5.2 | Gemini offline → Ollama | Remoção temporária da API key | Resposta vem do Ollama + badge "⚡ local" |
| 5.3 | Badge "⚡ local" visível | Usar modo Ollama | Badge aparece na bolha da resposta |
| 5.4 | Ollama offline → DEMO | Parar Ollama (`ollama stop`) com Gemini offline | Resposta DEMO aparece + badge DEMO |
| 5.5 | DEMO não mostra erro técnico | Tudo offline | Usuário recebe resposta útil, nunca mensagem de erro técnico |
| 5.6 | Recuperação automática | Ligar Gemini de volta | Próxima resposta usa Gemini novamente |
| 5.7 | DEMO_QA workshop | "Iniciar apresentação" + perguntas do workshop | Respostas roteirizadas corretas |

---

## GRUPO 6 — UPLOAD DE DOCUMENTOS

| # | Teste | Input | Resultado esperado |
|---|-------|-------|-------------------|
| 6.1 | Upload PDF simples | PDF de 1 página | Conteúdo extraído e disponível no chat |
| 6.2 | Upload PDF grande | PDF de 20+ páginas | Extrai e processa (pode ser lento) |
| 6.3 | Upload DOCX | Documento Word | Texto extraído via mammoth |
| 6.4 | Upload TXT | Arquivo de texto | Lido diretamente |
| 6.5 | Upload Excel DRE | Planilha formato CG Contadores | Parser especializado processa corretamente |
| 6.6 | Upload Excel genérico | Planilha qualquer | Análise básica disponível |
| 6.7 | Upload de currículo PDF | CV de candidato | Análise de perfil gerada |
| 6.8 | Arquivo inválido | .exe ou .zip | Recusado com mensagem clara |
| 6.9 | Arquivo muito grande | > 20MB | Recusado antes do upload |
| 6.10 | Download do documento | Após upload, pedir o arquivo | Arquivo baixável disponível (verificar auth) |

---

## GRUPO 7 — MEMÓRIA

| # | Teste | Input | Resultado esperado |
|---|-------|-------|-------------------|
| 7.1 | Salvar fato | "Meu nome é [Nome]" | "Anotado!" — fato salvo |
| 7.2 | Recuperar fato | "Como eu me chamo?" (próxima sessão) | Responde com o nome salvo |
| 7.3 | Aprendizado inline | Resposta contém `[aprendido: X]` | Fato X extraído e salvo automaticamente |
| 7.4 | Memória persiste entre sessões | Fechar e reabrir a Lúmina | Memória ainda disponível |
| 7.5 | Consolidação de memória | "Consolide minha memória" | Gemini resume e organiza os fatos |

---

## GRUPO 8 — TRANSCRIÇÃO

| # | Teste | Input | Resultado esperado |
|---|-------|-------|-------------------|
| 8.1 | Transcrição de áudio MP3 | Arquivo de voz em português | Texto transcrito com precisão |
| 8.2 | Transcrição de WebM | Gravação do navegador | Transcrito corretamente |
| 8.3 | Áudio longo (> 30s) | Arquivo de 1 minuto | Transcrição completa (pode demorar) |
| 8.4 | Áudio com ruído | Gravação com barulho | Melhor esforço da transcrição |

---

## GRUPO 9 — INFORMAÇÕES EM TEMPO REAL

| # | Teste | Input | Resultado esperado |
|---|-------|-------|-------------------|
| 9.1 | Cotação do dólar | "Quanto está o dólar?" | Cotação USD/BRL em tempo real |
| 9.2 | Cotação do euro | "E o euro?" | Cotação EUR/BRL |
| 9.3 | Ações B3 | "Cotação da VALE3" | Preço atual da ação |
| 9.4 | Clima | "Como está o tempo em Porto Alegre?" | Previsão via wttr.in |
| 9.5 | Notícias | "Que notícias tem?" | Manchetes G1/BBC Brasil |
| 9.6 | Notícias de transporte | "Notícias do setor?" | Headlines Logweb/TransportaBrasil |
| 9.7 | Esportes Brasileirão | "Como está o Brasileirão?" | Resultados e tabela |
| 9.8 | Consulta CNPJ | "CNPJ da Scapini: 00.000.000/0001-00" | Dados da empresa via BrasilAPI |

---

## GRUPO 10 — OPERACIONAL / FRETE

| # | Teste | Input | Resultado esperado |
|---|-------|-------|-------------------|
| 10.1 | Cotação básica | "Quanto custa frete de Porto Alegre para São Paulo, 5 toneladas de carga seca?" | Cotação com valores detalhados |
| 10.2 | Parâmetros configuráveis | "Configure o preço do diesel para R$ 7,00" | Parâmetro atualizado |
| 10.3 | Cotação com novo diesel | Repetir cotação após mudar diesel | Novo valor calculado corretamente |
| 10.4 | Histórico de cotações | "Minhas últimas cotações" | Lista das cotações salvas |

---

## GRUPO 11 — FINANCEIRO / CONTÁBIL

| # | Teste | Input | Resultado esperado |
|---|-------|-------|-------------------|
| 11.1 | Upload e análise DRE | Subir planilha DRE → "Analise minha DRE" | Análise detalhada por linha |
| 11.2 | Gráfico DRE | "Gere um gráfico da DRE" | Gráfico aparece na tela |
| 11.3 | Auditoria contábil | "Audite esta planilha" (com planilha carregada) | Classificação Crítico/Atenção/OK |
| 11.4 | Month-End Closer | "Faça o fechamento mensal" | Análise de variância mês atual vs anterior |
| 11.5 | Relatório KPI PDF | "Gere o relatório de KPIs" | PDF com layout Scapini é gerado e baixável |

---

## GRUPO 12 — GERAÇÃO DE ARQUIVOS

| # | Teste | Input | Resultado esperado |
|---|-------|-------|-------------------|
| 12.1 | Gerar Excel | "Crie uma planilha com [dados]" | .xlsx gerado e disponível para download |
| 12.2 | Gerar Word | "Crie um documento com [conteúdo]" | .docx gerado |
| 12.3 | Gerar PowerPoint | "Crie uma apresentação sobre [tema]" | .pptx gerado |
| 12.4 | Gerar PDF geral | "Gere um PDF com [conteúdo]" | .pdf gerado |
| 12.5 | PDF KPIs institucional | "Relatório de KPIs" | PDF com cabeçalho Scapini, seções por área |

---

## GRUPO 13 — RH / RECRUTAMENTO

| # | Teste | Input | Resultado esperado |
|---|-------|-------|-------------------|
| 13.1 | Criar entrevista para motorista | "Crie entrevista para motorista João Silva, email joao@email.com" | Link único gerado, email enviado |
| 13.2 | Acessar link de entrevista | Abrir o link gerado no celular | Formulário de entrevista carrega corretamente |
| 13.3 | Responder entrevista | Preencher e enviar respostas | "Respostas salvas" confirmado |
| 13.4 | Avaliação automática | Após responder, aguardar avaliação | Nota e laudo gerados pelo Gemini |
| 13.5 | Ver painel de candidatos | "Mostre os candidatos" | Lista com nota, faixa e status |
| 13.6 | Análise de currículo | Upload de CV PDF | Análise de fit para a vaga |
| 13.7 | E-mail de rejeição automático | Candidato reprovado aguardar 48h | E-mail enviado automaticamente |

---

## GRUPO 14 — PROSPECÇÃO / COMERCIAL

| # | Teste | Input | Resultado esperado |
|---|-------|-------|-------------------|
| 14.1 | Prospectar clientes | "Encontre empresas de alimentos em Caxias do Sul" | Lista de leads gerada |
| 14.2 | Leads salvos no SQLite | Após prospecção, "Mostre meus leads" | Leads listados corretamente |
| 14.3 | Enviar e-mail via Composio | "Envie os e-mails para os leads prospectados" | E-mails enviados via Gmail (requer Composio conectado) |
| 14.4 | Status Composio | "Status do Gmail" | Mostra se Composio está conectado |

---

## GRUPO 15 — OBSIDIAN / RAG

| # | Teste | Input | Resultado esperado |
|---|-------|-------|-------------------|
| 15.1 | Busca na KB | "O que a Scapini faz?" (com notas no vault) | Resposta usa conteúdo do vault |
| 15.2 | Busca semântica | Pergunta relacionada (não palavra-a-palavra) | RAG encontra nota relevante |
| 15.3 | Busca lexical fallback | Mesma pergunta com Gemini offline | Fallback para busca por keyword |
| 15.4 | Import de vault | "Importe meu vault Obsidian" | Notas importadas para a KB |
| 15.5 | Sync Obsidian | "Sincronize com o Obsidian" | Memória espelhada para notas do vault |

---

## GRUPO 16 — AUTOMAÇÃO / PUPPETEER

| # | Teste | Input | Resultado esperado |
|---|-------|-------|-------------------|
| 16.1 | Screenshot | "Tire um screenshot" | Imagem salva em ~/Pictures/Lumina Prints/ |
| 16.2 | Abrir URL | "Abra o site da Scapini" | Chrome abre scapini.com.br |
| 16.3 | Abrir projeto interno | "Abra o CRM" | localhost:5173 abre no browser |
| 16.4 | Automação com Puppeteer | "Acesse [URL] e me diga [informação]" | Puppeteer extrai a informação |
| 16.5 | Lembrete | "Me lembre amanhã às 9h de ligar para o cliente" | Lembrete salvo no SQLite |
| 16.6 | Notificação no horário | Aguardar horário configurado | Toast notification Windows aparece |

---

## GRUPO 17 — SEGURANÇA

| # | Teste | Como testar | Resultado esperado |
|---|-------|------------|-------------------|
| 17.1 | Rate limit chat | Enviar 35 mensagens em 1 minuto | Mensagem de erro "Muitas requisições" |
| 17.2 | Rate limit browser | 12 comandos de browser em 1 minuto | Limite atingido com mensagem |
| 17.3 | Token ausente | `curl http://127.0.0.1:8080/api/config` sem header | `401 Não autorizado` |
| 17.4 | Token inválido | Header `X-Lumina-Token: errado` | `403 Token inválido` |
| 17.5 | Origin externa | `curl` com `Origin: http://evil.com` | Bloqueado pelo origin check |
| 17.6 | Upload de .exe | Tentar fazer upload de executável | Recusado com mensagem clara |
| 17.7 | Dev mode sem env var | `curl /api/dev/exec` sem `LUMINA_DEV=1` | `403 Dev mode desabilitado` |
| 17.8 | Download sem token | `curl /api/download-doc/arquivo.pdf` | `401 Não autorizado` (após correção) |
| 17.9 | Acesso externo bloqueado | Tentar de outra máquina na rede | Conexão recusada (bind 127.0.0.1) |

---

## GRUPO 18 — DADOS PERSISTENTES

| # | Teste | Input | Resultado esperado |
|---|-------|-------|-------------------|
| 18.1 | Criar tarefa | "Adicione uma tarefa: reunião amanhã" | Tarefa aparece na lista |
| 18.2 | Completar tarefa | "Marque a reunião como concluída" | Tarefa marcada como done |
| 18.3 | Hábito diário | "Registre que fiz meu exercício hoje" | Hábito registrado |
| 18.4 | Entrada financeira | "Registre R$ 500 de despesa com combustível" | Despesa adicionada |
| 18.5 | Nota | "Salve esta nota: [conteúdo]" | Nota salva e recuperável |
| 18.6 | Persistência entre sessões | Fechar e reabrir, verificar dados | Todos os dados intactos |

---

## GRUPO 19 — CENÁRIO DE APRESENTAÇÃO (ROTEIRO COMPLETO)

Execute este grupo completo como ensaio da apresentação:

| # | Passo | Ação | Resultado esperado |
|---|-------|------|--------------------|
| 19.1 | Introdução | "Lúmina, se apresente para a diretoria" | Auto-apresentação elegante |
| 19.2 | Liderança | "Quem são os diretores da Scapini?" | Lista com Diamantino, Ernani, Rosangela, Lucas |
| 19.3 | Ajuda financeira | "Como você ajuda o setor financeiro?" | Explica auditoria, DRE, relatórios |
| 19.4 | Análise DRE ao vivo | Upload da planilha DRE de exemplo | Análise gerada em 10-20s |
| 19.5 | Cotação de frete | "Cota frete de Porto Alegre para São Paulo, 10 toneladas" | Cotação com valores detalhados |
| 19.6 | Candidato | "Cria uma entrevista para motorista" | Link gerado |
| 19.7 | Prospecção | "Encontre clientes de bebidas no RS" | Lista de prospects |
| 19.8 | Dólar | "Quanto está o dólar agora?" | Cotação em tempo real |
| 19.9 | Offline test | Desconectar internet — fazer pergunta | Badge ⚡ local, Ollama responde |
| 19.10 | Pergunta difícil | "Você pode me demitir?" | Resposta segura: nega substituição de pessoas |
| 19.11 | Encerramento | "Obrigado Lúmina" | Resposta cordial de encerramento |

---

## REGISTRO DE EXECUÇÃO

**Data do teste:** ___________  
**Testado por:** ___________  
**Versão:** 2.0.0

| Grupo | Total | Passou | Falhou | % |
|-------|-------|--------|--------|---|
| 1 — Inicialização | 6 | | | |
| 2 — Chat Básico | 7 | | | |
| 3 — Voz | 5 | | | |
| 4 — TTS | 6 | | | |
| 5 — Fallback IA | 7 | | | |
| 6 — Documentos | 10 | | | |
| 7 — Memória | 5 | | | |
| 8 — Transcrição | 4 | | | |
| 9 — Tempo Real | 8 | | | |
| 10 — Frete | 4 | | | |
| 11 — Financeiro | 5 | | | |
| 12 — Geração Arquivos | 5 | | | |
| 13 — RH | 7 | | | |
| 14 — Prospecção | 4 | | | |
| 15 — RAG | 5 | | | |
| 16 — Automação | 6 | | | |
| 17 — Segurança | 9 | | | |
| 18 — Dados Persistentes | 6 | | | |
| 19 — Roteiro Apresentação | 11 | | | |
| **TOTAL** | **124** | | | |

**Critério para apresentação:** Grupo 19 (roteiro) 100% e grupos 2, 3, 5 acima de 85%.
