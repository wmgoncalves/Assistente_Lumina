---
name: api-backend-hardening
description: Hardening de APIs e backends. Use para endpoints PHP, Node.js, Python, webhooks, integrações externas e qualquer backend que recebe ou emite dados. Cobre autenticação, autorização, validação de schema, CORS, rate limit, webhooks com assinatura e logs seguros.
---

# api-backend-hardening

Use esta skill para qualquer API REST, GraphQL, webhook, ou backend que processa requisições HTTP.

## Perguntas internas obrigatórias

1. Quais métodos HTTP são aceitos em cada endpoint? (GET, POST, PUT, DELETE, PATCH, OPTIONS)
2. Há autenticação? Qual mecanismo? (API key, JWT, OAuth, sessão, Basic Auth)
3. Há autorização por papel/recurso? (usuário só acessa seus próprios dados?)
4. O schema de entrada é validado antes de processar?
5. Qual é o tamanho máximo de body aceito?
6. CORS está configurado? Para quais origens?
7. Há rate limit em endpoints sensíveis?
8. Webhooks têm verificação de assinatura?
9. Logs capturam dados de requisição com PII ou segredos?
10. Erros retornam informações internas (stack trace, query SQL)?

## Autenticação e autorização

### Autenticação
- Verificar token/sessão em **todo** endpoint que não é público
- API keys: receber no header `Authorization` ou `X-API-Key`, **nunca em query string** (aparece em logs)
- JWT: verificar assinatura, expiração (`exp`), emissor (`iss`), audiência (`aud`)
- Nunca confiar em `user_id` enviado pelo cliente no body — extrair do token verificado
- Basic Auth apenas sobre HTTPS

### Autorização por recurso (evitar IDOR)
```
// ERRADO — confia no ID enviado pelo cliente
GET /api/pedidos/{id}
→ SELECT * FROM pedidos WHERE id = ?

// CORRETO — verifica posse do recurso
GET /api/pedidos/{id}
→ SELECT * FROM pedidos WHERE id = ? AND usuario_id = ?  ← ID extraído do token
```

### Ações administrativas
- Verificar papel (role) no servidor, não apenas esconder rotas no frontend
- Separar endpoints de admin de endpoints de usuário
- Logar tentativas de acesso não autorizado

## Validação de entrada

### O que validar em todo endpoint
- **Método HTTP**: rejeitar métodos não esperados (405 Method Not Allowed)
- **Content-Type**: verificar que o corpo tem o tipo declarado
- **Schema completo**: campos obrigatórios, tipos, formatos, tamanhos máximos
- **Encoding**: UTF-8 correto, sem null bytes, sem caracteres de controle

### Tamanho de body
Definir limite explícito. Sem limite = vetor de DoS.

```php
// PHP
$input = file_get_contents('php://input');
if (strlen($input) > 1048576) { // 1MB
    http_response_code(413);
    exit(json_encode(['erro' => 'Requisição muito grande']));
}
```

```javascript
// Express
app.use(express.json({ limit: '1mb' }));
```

### Validação de schema (exemplos)
```javascript
// Node — exemplo com Zod
const schema = z.object({
  nome: z.string().min(1).max(100),
  email: z.string().email(),
  valor: z.number().positive().max(99999),
});
const resultado = schema.safeParse(req.body);
if (!resultado.success) return res.status(400).json({ erro: 'Dados inválidos' });
```

## Rate limit

### Onde aplicar obrigatoriamente
- Login / autenticação
- Recuperação de senha
- Registro de usuário
- Endpoints de envio de e-mail ou SMS
- Endpoints de busca (prevenir scraping)
- Qualquer operação cara (geração de PDF, processamento de imagem, chamada de IA)

### Estratégia
- Limite por IP e por usuário autenticado (separados)
- Resposta: `429 Too Many Requests` + header `Retry-After`
- Não expor o limite exato (facilita bypass por automação)

## CORS

```
// CORRETO
Access-Control-Allow-Origin: https://seusite.com.br
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: Content-Type, Authorization

// ERRADO — nunca em endpoint com dados
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true  ← erro crítico com *
```

## Webhooks com assinatura

Nunca confiar em webhook sem verificar que veio do remetente legítimo:

```php
// Exemplo Stripe
$payload = file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];
$secret = $_ENV['STRIPE_WEBHOOK_SECRET'];

try {
    $event = \Stripe\Webhook::constructEvent($payload, $sig_header, $secret);
} catch (\Exception $e) {
    http_response_code(400);
    exit();
}
```

Verificar também:
- Timestamp do webhook (evitar replay attacks — rejeitar se muito antigo, ex: >5min)
- Processar idempotentemente (webhook pode ser entregue mais de uma vez)

## Logs seguros em API

### O que NÃO logar
- Corpo completo de requisição (pode conter senha, cartão)
- Headers de autorização completos
- Query strings com tokens
- PII desnecessária

### O que logar
- Método + endpoint + status
- Correlation ID
- User ID (não dados pessoais)
- Timestamp
- IP (com retenção adequada)
- Duração da requisição
- Erro genérico (sem stack trace na resposta)

## Respostas de erro

```json
// ERRADO — vaza informação interna
{
  "erro": "SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry...",
  "arquivo": "/var/www/html/api/usuarios.php:145"
}

// CORRETO — genérico ao cliente, detalhe no log interno
{
  "erro": "Não foi possível completar a operação.",
  "codigo": "ERR_DUPLICATE",
  "correlation_id": "abc-123"
}
```

## Proteção contra ataques comuns em API

| Ataque | Proteção |
|---|---|
| SSRF | Allowlist de domínios em chamadas HTTP servidor→externo; bloquear IPs internos |
| Mass assignment | Allowlist de campos aceitos no endpoint (não `Object.assign(model, req.body)` direto) |
| Injection | Prepared statements + validação de schema |
| Replay attack | Verificar timestamp em webhooks + idempotency key |
| Enumeration | IDs não sequenciais (UUID); mensagens genéricas |
| Brute force | Rate limit por IP + lockout |
| DoS por body grande | Limite de tamanho de body |

## Checklist de saída

- [ ] Autenticação verificada no servidor em todos os endpoints protegidos
- [ ] Autorização por recurso verificada (sem IDOR)
- [ ] Schema de entrada validado (tipo, formato, tamanho obrigatório)
- [ ] Content-Type verificado
- [ ] Limite de tamanho de body definido
- [ ] CORS com allowlist explícita
- [ ] Rate limit em endpoints sensíveis
- [ ] Webhooks verificam assinatura HMAC
- [ ] Proteção contra replay attack em webhooks
- [ ] Logs sem PII / credencial / stack trace
- [ ] Respostas de erro genéricas ao cliente

## Conexão com skills do vault

- Skill 01 (Zero Trust) — detalhamento de cada proteção
- Skill 17 (APIs e Integrações) — contratos, retry, circuit breaker, idempotência
- Skill 04 (Logs Seguros) — mascaramento de dados em logs
- Skill 12 (Banco de Dados) — SQL injection, prepared statements

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
