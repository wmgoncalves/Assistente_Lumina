---
name: security-baseline-universal
description: Triagem de segurança no início de qualquer projeto. Classifica stack, mapeia riscos, dados sensíveis, superfície de ataque e define checklist mínimo obrigatório antes de qualquer código ser escrito ou alterado.
---

# security-baseline-universal

Use esta skill **sempre que iniciar trabalho em um projeto**, seja ele novo ou já existente. Ela é o ponto de partida que informa quais outras skills devem ser ativadas.

## Perguntas internas obrigatórias (responder antes de agir)

1. Qual é o tipo de projeto? (site, API, app, automação, etc.)
2. Qual stack está sendo usada? (PHP, Node, Python, React, WP, etc.)
3. Qual é o ambiente de deploy? (hospedagem compartilhada, VPS, cloud, local, FTP, CI/CD)
4. Existem dados sensíveis? (usuários, pagamentos, saúde, PII, credenciais)
5. Há autenticação/login? Qual mecanismo?
6. Há banco de dados? Qual tipo?
7. Há integrações externas? (APIs, webhooks, IA, gateways de pagamento)
8. Há uploads de arquivo? De que tipo?
9. Há formulários públicos?
10. Existem dependências de terceiros? Quantas?
11. Existe .env ou arquivo de configuração com credenciais?
12. O projeto tem endpoints expostos publicamente?

## Classificação obrigatória do projeto

Marque TODAS que se aplicam:

- [ ] Site estático / landing page (HTML/CSS/JS puro)
- [ ] Frontend SPA (React, Vue, Next, Vite)
- [ ] PHP (puro ou framework)
- [ ] WordPress / CMS
- [ ] Node.js (backend, API, script)
- [ ] Python (backend, script, automação, ML)
- [ ] API REST / GraphQL
- [ ] Banco de dados (MySQL, PostgreSQL, SQLite, MongoDB, Firebase, Supabase)
- [ ] Docker / DevOps / CI/CD
- [ ] Automação / CLI / cron
- [ ] Integração com IA / LLM / agente
- [ ] Integração com pagamento (Stripe, PagSeguro, etc.)
- [ ] Integração externa (API de terceiro, webhook)
- [ ] Hospedagem compartilhada (HostGator, cPanel, FTP)
- [ ] VPS / cloud / container
- [ ] Outro: ______

## Identificação da superfície de ataque

Para cada item encontrado no projeto, registrar:

### Entradas de dados
- Formulários (tipo, campos, destino)
- Query strings / parâmetros de URL
- Corpo de requisição (JSON, form data, multipart)
- Headers HTTP processados pelo backend
- Cookies e sessão
- Uploads de arquivo
- Dados vindos de banco (tratados como não confiáveis)
- Dados retornados por APIs externas
- Dados retornados por IA/LLM

### Saídas de dados
- HTML renderizado para o usuário
- JSON de API
- Redirecionamentos
- Arquivos servidos
- E-mails enviados
- Logs gerados

### Pontos de autenticação e autorização
- Login / sessão / JWT / OAuth
- Rotas protegidas
- Ações administrativas
- Endpoints de API com chave

### Dados sensíveis identificados
- PII (nome, e-mail, CPF, telefone, endereço)
- Credenciais (senha, chave, token, API key)
- Dados financeiros
- Dados de saúde
- Dados de menores

## Checklist de riscos por stack

### Para qualquer projeto
- [ ] .env ou arquivo de credenciais presente → ativar secrets-and-env-guard
- [ ] Dependências de terceiros → ativar dependency-firewall
- [ ] Agente de IA trabalhando no código → ativar ai-agent-safe-coding

### Para projetos web (qualquer stack)
- [ ] Formulários → ativar webapp-hardening (XSS, CSRF, validação)
- [ ] Login/sessão → revisar cookies, HttpOnly, SameSite, expiração
- [ ] Uploads → revisar MIME, extensão, destino fora do public
- [ ] Banco de dados → ativar database-hardening

### Por stack específica
- PHP/hospedagem → ativar php-shared-hosting-hardening
- Node/Python/build → ativar node-python-build-hardening
- Frontend SPA → ativar frontend-hardening
- API/backend → ativar api-backend-hardening
- WordPress → ativar wordpress-cms-hardening
- Docker/DevOps → ativar docker-devops-hardening
- Antes de publicar qualquer coisa → ativar pre-deploy-security-review

## Medidas mínimas obrigatórias (todo projeto)

1. **Credenciais fora do código:** .env nunca commitado, nunca no public
2. **Dependências auditadas:** versão fixa, sem `*` ou `latest`, lockfile versionado
3. **Validação no servidor:** nunca confiar só no frontend
4. **Dados sensíveis fora dos logs:** sem PII, senha, token em logs
5. **Backup antes de qualquer alteração destrutiva**
6. **Deploy com checklist:** nunca subir sem revisar o que vai junto

## Saída obrigatória desta skill

Ao concluir o baseline, entregar:

```
RELATÓRIO DE BASELINE DE SEGURANÇA
====================================
1. Tipo de projeto: [...]
2. Stack detectada: [...]
3. Ambiente de deploy: [...]
4. Dados sensíveis encontrados: [...]
5. Riscos principais: [...]
6. Dependências críticas: [...]
7. Skills ativadas para este projeto: [...]
8. Medidas obrigatórias: [...]
9. Próximas ações seguras: [...]
10. Riscos residuais conhecidos: [...]
```

## Ações proibidas nesta fase

- Instalar qualquer dependência antes de mapear o projeto
- Alterar código de autenticação sem entender o sistema atual
- Criar arquivo .env com valores reais sem revisar .gitignore
- Assumir que o projeto é "simples demais para precisar de segurança"
- Pular esta skill "porque já conhece o projeto"

## Conexão com skills do vault (20-Templates/skills/)

Esta skill complementa as skills existentes:
- Skill 00 (Não Quebrar Código) — entender o que existe antes de alterar
- Skill 01 (Zero Trust) — mapear entradas não confiáveis
- Skill 03 (Auditoria Red Team) — ativar para auditoria completa
- Skill 10 (Orquestrador) — resolver conflitos entre skills ativadas
- Skill 14 (Supply Chain) — para dependências encontradas

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
