---
name: secrets-and-env-guard
description: Guarda de segredos e credenciais. Use quando houver .env, API keys, tokens, senhas, service accounts, integrações externas ou qualquer configuração sensível. Impede exposição acidental e orienta proteção correta.
---

# secrets-and-env-guard

Use esta skill sempre que o projeto envolver credenciais, chaves de API, tokens, senhas ou qualquer informação que não pode ser pública.

## Regra fundamental

> Segredos não pertencem ao código. Nunca devem aparecer em log, commit, HTML, JS público, URL, erro ou resposta de API.

## Perguntas internas obrigatórias

1. Existe arquivo `.env` ou similar no projeto?
2. Há chaves de API, tokens ou senhas mencionadas no contexto?
3. O `.env` está no `.gitignore`?
4. Existe `.env.example` com placeholders (sem valores reais)?
5. Algum segredo pode estar hardcoded em código fonte?
6. Variáveis públicas de frontend (VITE_, NEXT_PUBLIC_, PUBLIC_) contêm algo sensível?
7. Logs podem estar capturando valores de variáveis sensíveis?
8. Segredos estão sendo passados via query string ou URL?
9. A aplicação tem secrets manager configurado (ou deveria ter)?
10. Houve algum commit anterior que possa ter exposto segredo?

## Arquivos e padrões sensíveis — NUNCA ler, copiar, imprimir ou commitar sem autorização explícita

```
.env
.env.local
.env.development
.env.production
.env.staging
.env.*
secrets/
.secrets/
*.pem
*.key
*.p12
*.pfx
id_rsa
id_ed25519
*.pub (chaves SSH públicas — contêm informação de identidade)
service-account*.json
credentials*.json
gcp-*.json
firebase-adminsdk*.json
*.token
auth.json
.npmrc (pode conter token npm)
.pypirc (pode conter token PyPI)
Makefile (pode conter secrets em targets)
docker-compose.override.yml (frequentemente tem credenciais locais)
*.sql (dump de banco pode conter dados sensíveis)
*.dump
backup*.zip
backup*.tar.gz
```

## Ações proibidas

- **Ler** conteúdo de `.env` sem autorização explícita do usuário
- **Imprimir** ou **logar** valor de variável de ambiente que possa ser segredo
- **Commitar** arquivo com credencial real
- **Copiar** valor de chave para outro arquivo
- **Passar** segredo como argumento de linha de comando (aparece em `ps aux` / histórico)
- **Colocar** segredo real em `.env.example`
- **Armazenar** token sensível em `localStorage` ou `sessionStorage`
- **Enviar** segredo via query string (aparece em logs de servidor)
- **Incluir** API key secreta em JavaScript público
- **Commitar** `.npmrc` com `//registry.npmjs.org/:_authToken=...`

## Ações obrigatórias

### Configuração de .env
1. Verificar se `.env` existe no `.gitignore` — se não, adicionar imediatamente
2. Criar `.env.example` com todos os campos necessários e placeholders:
   ```
   DATABASE_URL=postgresql://usuario:SENHA_AQUI@host:5432/banco
   API_KEY_SERVICO=SUA_CHAVE_AQUI
   JWT_SECRET=GERE_UM_SEGREDO_ALEATORIO_AQUI
   ```
3. Nunca colocar valor real no `.env.example`
4. Documentar onde e como o usuário deve obter cada valor

### Verificação de frontend
Para React/Vite/Next/Vue/qualquer SPA, verificar:
- `VITE_*` → exposto no bundle JavaScript (público)
- `NEXT_PUBLIC_*` → exposto no bundle JavaScript (público)
- `PUBLIC_*` → exposto no bundle JavaScript (público)
- **Nunca** colocar nessas variáveis: chave secreta, token de admin, senha, segredo JWT
- Permitido: IDs públicos de analytics, URLs de endpoint público, feature flags

### Checklist de proteção
- [ ] `.env` no `.gitignore`
- [ ] `.env.example` existe com placeholders
- [ ] Nenhum segredo hardcoded no código fonte
- [ ] Nenhum segredo em variável de frontend público
- [ ] Logs não capturam valores sensíveis
- [ ] Segredos não passados via query string
- [ ] Cookies de sessão com `HttpOnly`, `Secure`, `SameSite`
- [ ] Tokens não armazenados em `localStorage` para aplicações sensíveis
- [ ] `.npmrc` / `.pypirc` com token no `.gitignore`
- [ ] Backups e dumps fora do diretório público

### Se houve vazamento (suspeita ou confirmado)

1. **Não revogar** o token pela máquina potencialmente comprometida
2. Usar **máquina limpa** para acessar o painel do serviço
3. **Revogar** a chave comprometida imediatamente
4. **Gerar** nova chave
5. **Verificar** logs de acesso no painel do serviço (uso indevido?)
6. **Verificar** commits anteriores: `git log --all -- .env`
7. Se estava no git: usar `git filter-branch` ou BFG Repo Cleaner + force push + notificar colaboradores
8. Registrar o incidente e ativar a skill `incident-diagnosis`

### Privilégio mínimo
- Criar chave de API com permissões mínimas necessárias (não admin por padrão)
- Usar usuário de banco com privilégio mínimo (não root)
- Rotacionar chaves periodicamente
- Usar secrets manager quando disponível (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault, Doppler)

## Saída obrigatória

```
RELATÓRIO DE SEGREDOS E CREDENCIAIS
=====================================
Segredos necessários identificados: [lista]
Onde devem ser configurados: [.env local, painel do serviço, CI/CD secrets]
Arquivos a criar: [.env.example, atualização de .gitignore]
Arquivos a não commitar: [lista]
Checklist de proteção: [itens pendentes]
Riscos identificados: [variáveis expostas, segredo em código, etc.]
Ações imediatas necessárias: [ordenadas por prioridade]
```

## Conexão com skills do vault

- Skill 01 (Zero Trust) — regras de cookies de sessão, headers seguros
- Skill 04 (Logs Seguros) — mascaramento de PII e credenciais em logs
- Skill 06 (LGPD) — proteção de dados pessoais associados
- Skill 13 (DevOps) — secrets em CI/CD, variáveis de ambiente em produção

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
