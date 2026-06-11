---
name: secure-code-review
description: Revisão de código focada em segurança. Checklist operacional aplicável em qualquer PR. Use ao revisar próprio PR antes de abrir, ao revisar PR de outro, ou ao auditar branch antes de merge.
---

# secure-code-review

Use **antes de abrir PR** (auto-review) e **antes de aprovar PR** (peer review). Foca no que importa para segurança, sem virar nitpicking de estilo.

## O que esta skill NÃO faz

- Não substitui ferramenta automatizada (SAST, lint, secrets scan)
- Não é review de arquitetura — é review de segurança e correção
- Não é nitpick de estilo (espaço, vírgula, etc.) — use linter
- Não é review de produto/UX — é review técnica

## Antes de começar

- [ ] PR tem descrição clara do **porquê** (não só do "o quê")
- [ ] Tamanho razoável (idealmente < 400 linhas mudadas; > 1000 = sinal de alerta)
- [ ] Uma intenção (não mistura correção + refactor + feature)
- [ ] Testes acompanham mudança
- [ ] CI verde
- [ ] Sem TODO/FIXME novo sem dono + prazo

## Categorias de revisão

### 1. Validação de entrada
- [ ] Toda entrada do usuário é validada **no servidor**
- [ ] Tipo, formato, tamanho máximo definidos
- [ ] Allowlist preferida sobre denylist
- [ ] Schema validation onde aplicável (Zod, Joi, Pydantic)
- [ ] Sanitização antes de usar em HTML/SQL/shell/URL
- [ ] Charset / encoding explícito
- [ ] Limite de tamanho de body

### 2. SQL e banco
- [ ] Prepared statements em **toda** query — nenhuma concatenação
- [ ] ORM usado corretamente (sem raw queries com interpolação)
- [ ] Privilégio mínimo do user do banco
- [ ] Transações onde múltiplas escritas precisam ser atômicas
- [ ] Migration reversível
- [ ] Backup antes de migration destrutiva
- [ ] Índices em colunas usadas em WHERE/JOIN

### 3. XSS
- [ ] Escape automático do template engine ativado (Twig, Blade, EJS com escape, JSX)
- [ ] `innerHTML` com dado não-confiável: usa DOMPurify ou textContent
- [ ] `dangerouslySetInnerHTML` (React) com sanitização
- [ ] SVG de usuário rasterizado ou sanitizado
- [ ] CSP configurado

### 4. CSRF
- [ ] Token CSRF em POST/PUT/DELETE de formulário
- [ ] Validação do token no servidor
- [ ] Cookie SameSite definido

### 5. Autenticação e autorização
- [ ] Senha com bcrypt/argon2id
- [ ] Sessão com HttpOnly/Secure/SameSite
- [ ] Autorização **em cada rota** protegida (não só no menu)
- [ ] Verificação de **dono** do recurso (anti-IDOR)
- [ ] Roles aplicados no servidor
- [ ] Logout invalida sessão server-side

### 6. Segredos
- [ ] Nenhum segredo hardcoded
- [ ] `.env` no `.gitignore`
- [ ] `.env.example` com placeholders
- [ ] Nenhum segredo em variável `VITE_/NEXT_PUBLIC_/PUBLIC_/REACT_APP_`
- [ ] Nenhum segredo em log

### 7. Erros e logs
- [ ] Mensagem ao usuário genérica + correlation_id
- [ ] Stack trace não vai ao usuário em produção
- [ ] Log mascara PII
- [ ] Log não tem senha/token/CVV
- [ ] DEBUG/display_errors desligado em produção

### 8. Dependências
- [ ] Dependência nova justificada
- [ ] Versão fixa (não `*`/`latest`)
- [ ] Lockfile atualizado e versionado
- [ ] `npm audit` / `composer audit` sem crítico/alto
- [ ] Nenhum pacote publicado há < 7 dias sem motivo forte
- [ ] Scripts de instalação revisados (postinstall, prepare)

### 9. APIs (você expõe)
- [ ] Autenticação obrigatória em rotas protegidas
- [ ] Autorização por recurso
- [ ] Schema de input validado
- [ ] Content-Type verificado
- [ ] CORS com allowlist explícita (não `*` em autenticado)
- [ ] Rate limit
- [ ] Webhook com HMAC validado (timestamp + dedupe)
- [ ] Resposta de erro genérica
- [ ] Sem dado sensível em logs

### 10. APIs (você consome)
- [ ] Timeout sempre
- [ ] Retry com backoff
- [ ] Idempotency key em operações financeiras
- [ ] Token em header, não query
- [ ] Token em `.env`/secret manager
- [ ] Schema da resposta validado
- [ ] Anti-SSRF se aceita URL do usuário

### 11. Frontend
- [ ] Sem segredo em código público
- [ ] Token em cookie HttpOnly, não localStorage
- [ ] CDN com SRI (integrity hash)
- [ ] `console.log` removido antes de produção
- [ ] Source maps avaliados

### 12. Performance / DoS
- [ ] Limite de tamanho em uploads
- [ ] Limite de queries N+1
- [ ] Cache controlado (não expira segredo cacheado)
- [ ] Rate limit em endpoints caros
- [ ] Timeout em chamadas externas

### 13. LGPD
- [ ] Coleta mínima necessária
- [ ] Base legal por categoria
- [ ] Política de privacidade atualizada
- [ ] Direitos do titular implementáveis
- [ ] Retenção definida
- [ ] PII em log mascarada

### 14. Testes
- [ ] Teste cobrindo a mudança
- [ ] Teste de regressão se for correção
- [ ] Teste adversarial em endpoint público
- [ ] Cobertura não diminuiu
- [ ] Sem teste skipped novo sem justificativa

### 15. Deploy
- [ ] Sem mudança em CI/CD sem revisão extra
- [ ] Sem segredo em workflow
- [ ] Permissões corretas pós-deploy
- [ ] Rollback definido

## Sinais de alerta no diff

- [ ] Mudança em arquivo `.env` (deve estar gitignored — investigar)
- [ ] Mudança em `package.json` sem mudança em lockfile (ou vice-versa)
- [ ] String longa em base64 (pode ser segredo, código ofuscado, ou comprimido)
- [ ] `eval`, `exec`, `Function()`, `system()`, `shell_exec` novos
- [ ] `child_process` novo em Node
- [ ] Chamada de URL hardcoded em código (deveria estar em config)
- [ ] Comentário "TODO: validar isto" sem dono
- [ ] Comentário "fix later" / "hack" / "kludge"
- [ ] Função muito grande (> 100 linhas) — sinal de design ruim, esconde bug
- [ ] Mudança em código de auth/permissão sem teste correspondente
- [ ] Mudança em migration que parece grande demais
- [ ] Mudança em CI/Docker/Dockerfile sem revisão
- [ ] Adição de dependência transitiva inesperada no lockfile

## Padrões de busca

Usar grep antes de revisar manualmente:

```regex
# Segredos hardcoded
(api[_-]?key|secret|token|password)\s*=\s*['"][a-zA-Z0-9]{20,}
sk_(live|test)_[a-zA-Z0-9]+
xox[baprs]-[a-zA-Z0-9-]+    # Slack tokens
gh[pousr]_[a-zA-Z0-9]{36}    # GitHub tokens
AKIA[0-9A-Z]{16}              # AWS

# Eval e similares
\b(eval|exec)\s*\(
shell_exec\s*\(
child_process

# SQL com concatenação
"SELECT.*?\$|"SELECT.*?\+|`SELECT.*?\$\{

# innerHTML perigoso
\.innerHTML\s*=\s*(?!['"])
dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html

# console.log esquecido em produção
console\.(log|debug)\(

# TODO/FIXME sem dono
//\s*(TODO|FIXME|HACK|XXX)\b(?!.*@\w+)
```

## Severidade dos findings

Classificar e priorizar:

| Severidade | Definição | Ação |
|---|---|---|
| Crítico | RCE, vazamento ativo de PII, bypass de auth | Bloquear merge. Patch imediato. |
| Alto | XSS, SQLi, IDOR sem mitigação | Bloquear merge. Corrigir antes. |
| Médio | Falta de rate limit, log com PII parcial | Pedir correção neste PR ou criar ticket. |
| Baixo | Estilo, organização, otimização | Sugestão, não bloqueia. |

## Saída obrigatória

```
REVIEW DE SEGURANÇA — PR #...
==============================
Autor: [...]
Reviewer: [...]
Linhas mudadas: [...]
Categorias revisadas: [13/15]

FINDINGS:
  Crítico (N): [...]
  Alto (N): [...]
  Médio (N): [...]
  Baixo (N): [...]

Decisão: [APROVAR / PEDIR MUDANÇA / BLOQUEAR]
Bloqueios: [...]
Sugestões: [...]
```

## Recusas obrigatórias

- Aprovar PR sem ler diff
- Aprovar PR com Crítico não resolvido
- Aprovar PR sem teste em mudança funcional
- "LGTM" sem revisão real
- Aprovar próprio PR (em revisão de outro)
- Ignorar mudança em arquivo de segredo/CI/Docker
- Pular review por urgência sem registro

## Conexão com skills do vault

- Skill 03 (Auditoria Red Team) — versão completa de revisão adversarial
- Skill 01 (Zero Trust) — princípios de validação
- Skill 02 (Testes) — cobertura
- Skill 14 (Supply Chain) — dependências
- Skill 16 (Documentação) — PR description, changelog

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
