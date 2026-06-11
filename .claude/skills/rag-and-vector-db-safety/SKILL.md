---
name: rag-and-vector-db-safety
description: RAG (Retrieval-Augmented Generation) e bancos vetoriais seguros — ingestão/quarentena de fontes, embeddings, pgvector/Pinecone/Qdrant/Weaviate, retrieval com controle de acesso, e defesa contra injeção indireta de prompt via documentos. Use ao construir busca semântica, chatbot com base de conhecimento, ou pipeline de embeddings.
---

# rag-and-vector-db-safety

No RAG, o conteúdo recuperado entra no prompt — então a base de conhecimento é superfície de ataque (injeção indireta).

## Quando usar
- Chatbot/assistente sobre base de documentos.
- Busca semântica, recomendação por similaridade.
- Pipeline de embeddings/ingestão.

## Ingestão (procedência e quarentena)
- **Procedência:** registre origem/autor/data de cada documento (alinha com `/data-poisoning-integridade-dados` / Skill 07).
- **Quarentena:** conteúdo de fonte não confiável (web, upload de usuário) é sanitizado e marcado; não misturar com fontes confiáveis sem rótulo.
- Sanitizar texto: remover instruções ocultas (HTML/markdown malicioso, texto branco, zero-width) que tentem virar comando.

## Vector DB
- **Multi-tenant:** isolar por `tenant_id`/namespace; o retrieval **filtra por permissão do usuário** ANTES de devolver (não recuperar o que o usuário não pode ver — evita vazamento via similaridade).
- `pgvector` (Postgres) é ótimo p/ stack simples; Pinecone/Qdrant/Weaviate quando escala. Cada um sob `/dependency-firewall` e `/storage-database-files`.
- Metadados sem PII desnecessária; criptografia em repouso para conteúdo sensível.

## Geração (runtime)
- **Injeção indireta de prompt:** trate o trecho recuperado como **dado não confiável**, delimitado; instrua o modelo a não obedecer instruções vindas do contexto (aplicar `/ai-prompt-injection-defense`).
- **Citações/grounding:** exigir que a resposta cite a fonte; reduzir alucinação.
- **Output handling:** se a resposta vira ação (tool/SQL/HTML), validar (`/mcp-and-agent-sdk-safety`).
- **Custo/limite:** teto de tokens/custo, cache de embeddings (alinha com `/performance-web-vitals`).

## Privacidade
- Não enviar PII desnecessária ao provedor de embeddings/LLM; opt-out de treinamento; DPA (`/lgpd-compliance-check`).

## Recusas
- Recuperar trechos sem filtrar por permissão do usuário.
- Indexar fonte não confiável junto com confiável sem rótulo/quarentena.
- Tratar conteúdo recuperado como instrução confiável.
- Enviar dado sensível a embedding externo sem base legal.

## Saída
Arquitetura do pipeline (ingestão→quarentena→embedding→índice→retrieval filtrado→geração), controles de tenancy/authz no retrieval, defesa de injeção indireta e plano de custo.

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
