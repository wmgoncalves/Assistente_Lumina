---
name: webapp-hardening
description: Hardening de aplicações web. Use para qualquer site com formulário, login, sessão, painel ou interação com usuário. Cobre XSS, CSRF, CORS, headers de segurança, cookies, validação, sanitização, rate limit, uploads e anti-spam.
---

# webapp-hardening

Use esta skill em qualquer aplicação web com formulários, sessão, autenticação ou dados dinâmicos. Aplica ao backend que serve a aplicação, independente da stack.

## Perguntas internas obrigatórias

1. Há formulários que submetem dados? Para onde vão?
2. Há login/sessão/autenticação?
3. Há uploads de arquivo?
4. Dados dinâmicos são renderizados no HTML?
5. Há endpoints que alteram estado (POST/PUT/DELETE/PATCH)?
6. Quais cookies são definidos pela aplicação?
7. Quais são as origens CORS permitidas?
8. Há rate limit em formulários e endpoints sensíveis?
9. Erros retornam stack trace ou informações internas?
10. Logs capturam dados de formulário (incluindo senha)?

## XSS (Cross-Site Scripting)

### Vetores de risco
- `innerHTML` com dado do usuário
- Template strings com interpolação de dado externo
- Atributos HTML com dado não escapado
- `document.write` com dado de URL
- `eval()` com dado externo
- Redirecionamentos sem validação

### Proteções obrigatórias
- Escapar **toda** saída de dado externo no contexto correto (HTML, atributo, JS, URL)
- Em PHP: `htmlspecialchars($var, ENT_QUOTES, 'UTF-8')`
- Em JS: nunca usar `innerHTML` com dado não confiável — usar `textContent`
- Em templates: usar escaping automático do motor (Twig, Blade, Jinja2 fazem isso por padrão — não desabilitar)
- Implementar Content Security Policy (CSP) quando possível
- Não usar `dangerouslySetInnerHTML` em React sem sanitização prévia

## CSRF (Cross-Site Request Forgery)

### Quando proteger
Em **todo** endpoint que altera estado (POST, PUT, DELETE, PATCH) quando há sessão de usuário autenticado.

### Proteções obrigatórias
- Token CSRF sincronizado por sessão, incluído em todo formulário
- Verificar token no servidor antes de processar ação
- Token deve ser: aleatório, vinculado à sessão, expirar com a sessão
- Em SPA/API com JWT: usar `SameSite=Strict` ou `SameSite=Lax` nos cookies + verificar Origin/Referer

## CORS

### Regra
**Nunca** `Access-Control-Allow-Origin: *` em endpoint com dados sensíveis ou autenticado.

### Configuração correta
- Allowlist de origens explícita
- Não refletir `Origin` do request sem validação
- `Access-Control-Allow-Credentials: true` apenas quando necessário, e nunca junto com `*`
- Preflight cacheado adequadamente
- Métodos e headers permitidos explícitos, não abertos

## Cookies e sessão

### Atributos obrigatórios para cookies sensíveis
- `HttpOnly` — JavaScript não pode ler
- `Secure` — apenas HTTPS
- `SameSite=Lax` (mínimo) ou `Strict` para dados críticos
- `Path` e `Domain` restritos
- `Max-Age` ou `Expires` definidos (não sessão eterna)

### Gestão de sessão
- ID de sessão aleatório, suficientemente longo (≥ 128 bits)
- Regenerar ID após login (evita session fixation)
- Expiração por tempo de inatividade
- Invalidação completa no logout (no servidor, não só no cliente)
- Não armazenar dado sensível na sessão se puder evitar

## Validação e sanitização

### Regras
- Validar **no servidor**, sempre (frontend é camada de UX, não de segurança)
- Validar: tipo, formato, tamanho, faixa, allowlist de valores quando aplicável
- Rejeitar requisição inválida com erro claro (não tentar "corrigir" o input)
- Sanitizar **na saída** (escape antes de renderizar), não só na entrada
- Não depender de `strip_tags`, `addslashes` ou regex genérica como única defesa

## Rate limit e anti-spam

### Onde aplicar
- Login (tentativas de força bruta)
- Formulário de contato
- Recuperação de senha
- Registro de usuário
- Qualquer endpoint de ação sensível

### Como implementar
- Limite por IP + por conta de usuário
- Lockout temporário após N tentativas (não permanente por padrão)
- CAPTCHA ou honeypot para formulários públicos
- Honeypot: campo oculto que humanos não preenchem, bots sim

## Uploads de arquivo

### Riscos
- Upload de arquivo `.php` executável
- Upload de SVG com XSS embutido
- Upload com tamanho excessivo (DoS)
- Path traversal via nome de arquivo

### Proteções obrigatórias
- Allowlist de extensões (não blocklist)
- Verificar MIME type real (não confiar na extensão ou no Content-Type do cliente)
- Limitar tamanho máximo
- Renomear arquivo com nome gerado pelo servidor (UUID ou hash)
- Armazenar **fora do diretório público** quando possível
- Servir via script controlado com Content-Type correto
- Nunca executar arquivo enviado pelo usuário

## Headers de segurança

Headers a adicionar em toda resposta (adaptar conforme stack):

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: [configurar por projeto]
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## HTTPS

- Obrigatório em produção, sem exceção
- Redirecionar HTTP → HTTPS (301)
- HSTS habilitado
- Certificado válido e monitorado para renovação
- Sem conteúdo misto (HTTP em página HTTPS)

## Mensagens de erro

- Mensagens genéricas para o usuário: "Ocorreu um erro. Tente novamente."
- Nunca expor stack trace, caminho de arquivo, versão do software, query SQL
- Log técnico detalhado no servidor com correlation_id
- Mensagens de login genéricas: "Usuário ou senha incorretos" (não "Usuário não existe")

## Saída obrigatória — tabela de status

| Risco | Onde aparece no projeto | Proteção aplicada | Status |
|---|---|---|---|
| XSS | [campos/templates] | [escape/CSP] | OK/Atenção/Crítico |
| CSRF | [formulários/endpoints] | [token/SameSite] | OK/Atenção/Crítico |
| CORS | [endpoints de API] | [allowlist] | OK/Atenção/Crítico |
| Cookies | [login/sessão] | [HttpOnly/Secure/SameSite] | OK/Atenção/Crítico |
| Validação | [formulários/endpoints] | [servidor] | OK/Atenção/Crítico |
| Rate limit | [login/contato] | [implementado/pendente] | OK/Atenção/Crítico |
| Uploads | [se houver] | [allowlist/rename/fora do public] | OK/Atenção/Crítico |
| Headers | [toda resposta] | [configurados] | OK/Atenção/Crítico |
| HTTPS | [produção] | [HSTS/redirect] | OK/Atenção/Crítico |
| Erros | [toda resposta] | [genérico ao usuário] | OK/Atenção/Crítico |

## Conexão com skills do vault

- Skill 01 (Zero Trust) — detalha cada proteção desta skill
- Skill 03 (Auditoria Red Team) — ativa para buscar vulnerabilidades ativas
- Skill 04 (Logs Seguros) — mensagens de erro e logs sem PII
- Skill 06 (LGPD) — dados de formulário podem ser dados pessoais

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
