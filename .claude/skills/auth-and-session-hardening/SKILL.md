---
name: auth-and-session-hardening
description: Endurecimento de autenticação, sessão, JWT, OAuth, password reset, MFA, magic links. Use em qualquer projeto com login, área restrita, painel admin ou autenticação de API. Cobre senha, sessão, cookies, tokens, fluxos de recuperação e MFA.
---

# auth-and-session-hardening

Use em **qualquer projeto com login ou autenticação de API**. Cobre o ciclo: cadastro → senha → login → sessão → recuperação → MFA → logout.

## Cadastro e senha

### Hash de senha
- **bcrypt** (cost ≥ 12) ou **argon2id** (parâmetros m=64MB, t=3, p=4)
- **Nunca** md5, sha1, sha256 direto, "criptografia reversível"
- Salt automático (já vem em bcrypt/argon2)

### Política de senha
- Mínimo 12 caracteres (NIST 800-63B: comprimento > complexidade artificial)
- Verificar contra lista de senhas vazadas (Have I Been Pwned, k-anonymity API)
- Permitir paste de senha (não bloquear — atrapalha gerenciadores)
- Não exigir troca periódica sem motivo (NIST mudou essa recomendação)
- Mostrar força com indicador, não bloquear por regra rígida

### Validação do e-mail/usuário
- E-mail: regex razoável + envio de link de confirmação
- Username: allowlist de caracteres, tamanho 3-30
- Não revelar se e-mail existe ("usuário ou senha inválido" — não "usuário não existe")

## Login

### Anti-enumeration
- Resposta genérica: "credenciais inválidas" — nunca "senha errada" ou "usuário não existe"
- Mesmo tempo de resposta para "usuário não existe" e "senha errada" (timing attack)
- Recuperação de senha: sempre confirmar "se o e-mail existir, enviamos link", independente de existir

### Rate limit
- 5-10 tentativas por minuto por IP **e** por usuário
- Backoff exponencial após 3 falhas
- Lock temporário (15 min) após N falhas
- CAPTCHA depois de 3 falhas (hCaptcha, Turnstile, reCAPTCHA v3)
- Notificar usuário por e-mail em falhas suspeitas

### Brute force / credential stuffing
- Detectar IP com muitas falhas em curto espaço
- Detectar usuário com falhas de múltiplos IPs
- Lista de senhas comprometidas verificada no momento do login (HIBP)
- Bloquear IPs em listas de Tor/proxy quando aplicável ao contexto

## Sessão

### Cookies de sessão
```
Set-Cookie: SESSIONID=...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=...
```
- **HttpOnly** sempre (bloqueia leitura por JS — defesa XSS)
- **Secure** sempre em produção (HTTPS only)
- **SameSite=Lax** (default) ou **Strict** para painéis administrativos
- **Path** restrito quando faz sentido
- **Max-Age** ou **Expires** explícito

### ID de sessão
- Gerar com CSPRNG (crypto.randomBytes / random_bytes)
- Tamanho mínimo: 128 bits (32 hex chars)
- Rotacionar após login bem-sucedido (anti session fixation)
- Rotacionar após mudança de senha
- Invalidar todas as sessões em mudança de senha

### Armazenamento server-side
- Redis, Memcached, banco — não no cookie em texto claro
- Armazenar: user_id, role, ip, user_agent, created_at, last_seen
- TTL: 30 min (apps comuns), 8h (apps de trabalho), 24h (apps de uso casual)
- Sliding expiration vs absolute: definir política

### Logout
- Invalidar a sessão server-side (não basta apagar cookie)
- "Logout de todos os dispositivos" como opção visível
- Logout automático por inatividade

## JWT (se for usar)

### Quando usar
JWT é bom para autenticação **stateless** entre serviços. **Não é bom** para sessões web tradicionais — cookie de sessão com store server-side é mais simples e seguro para a maioria dos casos.

### Se usar JWT:
- Algoritmo: **RS256** ou **ES256**, **nunca** HS256 com segredo fraco, **nunca** `alg: none`
- TTL curto: 5-15 min para access token
- Refresh token rotacionável, com revogação possível
- Não armazenar PII no JWT (é decodificável por qualquer um)
- Armazenar access token em memória; refresh em cookie HttpOnly
- **Nunca** em `localStorage` (vulnerável a XSS)
- Lista de revogação (mesmo com TTL curto, para casos de comprometimento)
- Validar `iss`, `aud`, `exp`, `nbf` sempre

## OAuth / SSO

- Usar fluxo **Authorization Code com PKCE** (não Implicit)
- Validar `state` (anti-CSRF)
- Validar `nonce` (OIDC, replay)
- Validar `iss`, `aud` no ID token
- Verificar assinatura com chaves do JWKS do provedor
- Allowlist de redirect URIs (exato, sem wildcard)
- Validar e-mail verificado pelo provedor antes de criar conta local
- Linkar conta externa com cuidado (atacante poderia criar conta com seu e-mail no provedor)

## Recuperação de senha

### Fluxo seguro
1. Usuário pede recuperação por e-mail
2. Resposta genérica: "se o e-mail existir, enviamos um link"
3. Se existir: gerar token CSPRNG (256 bits) + salvar hash no banco com TTL 15-30 min
4. Enviar link com token em URL: `https://site/reset?token=...`
5. Ao usar: validar token + TTL + uso único (invalidar após uso)
6. Nova senha exige confirmação
7. Invalidar todas as sessões existentes
8. Notificar usuário por e-mail: "sua senha foi alterada às X — não foi você? clique aqui"

### Anti-abuso
- Rate limit por e-mail (1 link/hora)
- Rate limit por IP
- CAPTCHA no formulário público
- Não vazar timing (sempre 200 OK)

## MFA / 2FA

### Tipos
- **TOTP** (Google Authenticator, Authy, 1Password): padrão recomendado
- **WebAuthn / Passkeys**: melhor segurança, melhor UX, recomendado para novos
- **SMS**: usar **só como último recurso** — SIM swap, intercepção
- **E-mail OTP**: melhor que nada, pior que TOTP

### Implementação TOTP
- Segredo armazenado **criptografado** no banco (não texto claro)
- Janela de tolerância: ±1 step (30s)
- Códigos de backup (8-10), uso único, mostrar uma vez só
- Permitir recuperação de MFA via processo manual (suporte) — não automático

### MFA obrigatório para
- Conta admin
- Conta com acesso a dado financeiro
- Conta com acesso a dado sensível (saúde, dados de menores)
- Mudanças críticas (e-mail, senha, MFA, exclusão)

## Magic links (passwordless)

- Token CSPRNG 256 bits, TTL 15 min, uso único
- Avisar: "link expira em X minutos"
- Após uso, invalidar
- Combinar com rate limit forte
- Considerar como adicional, não único — usuário pode preferir senha

## API authentication

### Token de API
- Gerar com CSPRNG (256 bits)
- Armazenar **hash** no banco, não o token cru
- Prefixo identificável (`sk_live_`, `sk_test_`) — facilita scan e revogação
- Mostrar o token **uma vez** ao criar — nunca mais
- Allowlist de IPs quando aplicável
- Scopes / permissões granulares
- Revogação fácil
- Rate limit por token

### Webhook signature
- Verificar HMAC do payload antes de processar
- Validar timestamp (rejeitar > 5 min de idade — anti-replay)
- Comparação constant-time (`hash_equals` PHP, `crypto.timingSafeEqual` Node)

## Headers de segurança em autenticação

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY            (ou usar CSP frame-ancestors)
Content-Security-Policy: ...
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: ...
```

## CSRF

- Token CSRF em **todo** POST/PUT/DELETE de formulário
- Validar no servidor
- Cookie `SameSite=Lax` ajuda mas **não substitui** token
- Para SPA com JWT em header: SameSite + checagem de Origin/Referer

## Logging seguro de autenticação

Logar:
- Login bem-sucedido: user_id, IP, user_agent, timestamp
- Login falho: user (mascarado se sensível), IP, motivo (sem revelar)
- Mudança de senha
- Mudança de MFA
- Login de novo dispositivo/IP
- Pedido de recuperação

**Nunca** logar:
- Senha (nem texto claro, nem hash — você não precisa do hash em log)
- Token de sessão completo (mascarar)
- CVV, número de cartão
- Resposta de pergunta de segurança

## Recusas obrigatórias

- Senha sem hash adequado (md5, sha1, sha256 direto)
- Token de sessão em localStorage (vulnerabilidade XSS)
- JWT com `alg: none` ou HS256 fraco
- Cookie sem HttpOnly em sessão
- Cookie sem Secure em produção
- Recuperação de senha sem token expirável
- Login sem rate limit
- "Lembre minha senha" salvando texto claro
- MFA opcional para conta admin
- E-mail de "sua senha é X" (você não deveria ter a senha)
- Pergunta de segurança como único fator
- OAuth sem state/nonce
- Webhook sem verificação de assinatura

## Checklist mínimo

- [ ] Senha com bcrypt cost ≥ 12 ou argon2id
- [ ] Resposta genérica em login/recovery (anti-enumeration)
- [ ] Rate limit em login, signup, recovery
- [ ] Cookie de sessão: HttpOnly + Secure + SameSite
- [ ] Session ID com CSPRNG, ≥ 128 bits
- [ ] Sessão rotaciona após login e mudança de senha
- [ ] Logout invalida server-side
- [ ] CSRF token em formulários
- [ ] Token de recovery: CSPRNG, TTL, uso único
- [ ] MFA disponível, obrigatório para admin
- [ ] Notificação de eventos sensíveis por e-mail
- [ ] Logs sem senha/token completo
- [ ] HTTPS forçado (HSTS)
- [ ] API tokens armazenados como hash

## Conexão com skills do vault

- Skill 01 (Zero Trust) — princípio geral
- Skill 04 (Erros e Logs Seguros) — não vazar via erro/log
- Skill 06 (LGPD) — base legal, retenção, direitos
- Skill 17 (APIs/Integrações) — auth em API e webhooks

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
