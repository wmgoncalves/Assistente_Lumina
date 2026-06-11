---
name: external-api-integration-safety
description: Consumo seguro de APIs externas. Cobre autenticação, retry exponencial, idempotência, timeout, circuit breaker, validação de schema, anti-SSRF e webhooks. Use ao integrar com qualquer serviço de terceiro (gateway, e-mail, SMS, IA, mapa, etc.).
---

# external-api-integration-safety

Use ao **consumir API de terceiro**: gateway de pagamento, e-mail (SendGrid, SES, Brevo), SMS, IA (OpenAI, Anthropic), maps, frete, CEP, qualquer webhook recebido.

## Princípios

1. **Toda chamada externa é não-confiável** — pode falhar, mentir, demorar, ser comprometida
2. **Timeout sempre** — sem timeout = sua app pode travar com a deles
3. **Retry com backoff** — não martelar API ruim
4. **Idempotência** — chamar 2x = resultado igual
5. **Validar resposta** — não confiar no formato esperado
6. **Falha graciosa** — sua app sobrevive se a API cair

## Autenticação

### Token no header
- `Authorization: Bearer ...` ou `X-API-Key: ...`
- **Nunca** na query string (vai pro log)
- Rotação periódica (90-365 dias)
- Token diferente por ambiente (dev/staging/prod)

### Armazenamento
- `.env` (nunca commitado)
- Secret manager (AWS Secrets Manager, Vault, GitHub Secrets em CI)
- **Nunca** hardcoded
- **Nunca** em config versionado

### Rotação
- Documentada (runbook)
- Testada (rotacionou semestralmente para garantir que funciona)
- Sem downtime (rolling: dois tokens válidos durante janela)

## Timeout

### Sempre definir
- Connection timeout: 3-5s
- Read timeout: 10-30s (curto para chamadas síncronas no fluxo de usuário)
- Total: 30s máximo em foreground

### Por tipo
| Tipo | Timeout sugerido |
|---|---|
| CEP, autocomplete | 2-3s |
| Pagamento | 10-30s |
| E-mail (envio) | 30s |
| IA (chat) | 60s (com streaming) |
| Webhook (você envia) | 10s |
| Webhook (você recebe) | responde 200 em < 5s |

### Quando estourar
- Cancelar requisição
- Logar com correlation_id
- Retornar erro ao usuário (genérico) ou enfileirar retry

## Retry

### Quando retentar
- 5xx (servidor)
- 429 (rate limit) — respeitar `Retry-After`
- Timeout (sem resposta)
- Conexão recusada

### Quando NÃO retentar
- 4xx (erro do cliente) — exceto 408, 425, 429
- Validação que falhou (não vai passar na próxima)
- Idempotência impossível (sem idempotency key)

### Backoff exponencial
```
Tentativa 1: imediato
Tentativa 2: 1-2s
Tentativa 3: 2-4s
Tentativa 4: 4-8s
Tentativa 5: 8-16s
Stop após 5 tentativas
```

Adicionar **jitter** (random) para evitar thundering herd.

### Máximo de tentativas
- Síncrono no usuário: 1-2 tentativas
- Assíncrono (queue/cron): 5-10 com backoff longo
- DLQ (dead letter queue) para falhas persistentes

## Idempotência

### Você chamando API externa
- Gerar `Idempotency-Key` (UUID v4) por operação lógica
- Mandar no header
- Em retry, **mesma key**
- Stripe, PagBank etc. suportam — repassar

### Recebendo webhook
- Cada webhook tem ID único do remetente
- Salvar IDs processados (TTL ~30 dias)
- ID já visto = ignorar (200 OK)
- Operação na primeira vez é idempotente

## Circuit breaker

Quando API externa está consistentemente falhando, **parar de tentar**.

### Estados
- **Closed**: tudo OK, requisições passam
- **Open**: falhas demais, parar de tentar (devolve erro imediato)
- **Half-open**: período de teste — uma requisição passa, se OK volta a closed

### Limiares típicos
- Abrir se 50% das requisições nos últimos 30s falharam
- Mínimo de 10 requisições para considerar
- Fica aberto por 30-60s
- Half-open: testa 1 requisição

### Bibliotecas
- Node: `opossum`
- Python: `pybreaker`
- PHP: implementar com cache (Redis com contador)
- Java: Resilience4j

## Validação de resposta

**Nunca** confiar que a API retornou o que documentou:

```python
# ❌ Ruim
response = api.get_user()
return response.email  # KeyError silencioso se faltar

# ✅ Bom
response = api.get_user()
data = validate_schema(response, USER_SCHEMA)  # falha cedo se inválido
return data['email']
```

- Schema validation (JSON Schema, Pydantic, Zod, Joi)
- Falhar cedo se resposta inesperada
- Logar resposta crua quando schema falha (para debug)
- Versionar schema com versão da API

## Anti-SSRF

Se você aceita URL do usuário para fazer fetch (webhook configurável, importação por URL, preview de link):

### Bloquear
- IPs privados: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
- Loopback: 127.0.0.0/8, ::1
- Link-local: 169.254.0.0/16 (metadata cloud — AWS 169.254.169.254)
- Multicast e reservados
- Protocolos não-HTTP (file://, gopher://, ftp://)

### Validar
- DNS resolve para IP público (resolver e checar)
- Cuidado com **DNS rebinding** (resolver muda entre check e fetch — usar IP resolvido)
- Allowlist de domínios quando possível
- Timeout curto
- Sem follow redirect, ou validar cada redirect

### Bibliotecas
- Node: `ssrf-req-filter`, `is-private-ip`
- Python: `safer_url_request`
- PHP: implementar manualmente com `gethostbyname` + checagem

## Webhooks (você recebe)

### Verificação
- **Assinatura HMAC** validada antes de processar (constant-time compare)
- **Timestamp** validado (rejeitar > 5 min)
- **ID** do evento para deduplicação

### Processamento
- Responder 2xx em < 5s
- Processar **async** (queue) se demorado
- Idempotente
- Logar evento completo (mascarando PII)

### Endpoint
- HTTPS obrigatório
- URL não óbvia (não /webhook, prefira /webhooks/stripe/h7f8d3...)
- Sem auth por sessão (é máquina-a-máquina)
- Allowlist de IPs quando o provedor publica

## Rate limit (você é o cliente)

- Respeitar `Retry-After`, `X-RateLimit-Remaining`
- Manter contador local para evitar 429
- Cache de respostas idempotentes (CEP, geocoding, conversão moeda)
- Distribuir carga ao longo do tempo

## Falha graciosa

### Degradação
- API de mapa fora → mostra endereço em texto
- API de IA fora → mostra mensagem padrão / desativa feature
- CEP fora → permite digitar manualmente
- Pagamento fora → mensagem clara + retry

### Fallback
- Cache de última resposta válida (TTL definido)
- Resposta default segura
- Modo offline / read-only

### Comunicação ao usuário
- "Serviço temporariamente indisponível. Tente novamente."
- Não revelar qual API caiu
- Status page interna para suporte

## Logging

**Logar:**
- Endpoint chamado
- Status retornado
- Duração
- Correlation_id
- Retry count

**Não logar:**
- Token completo
- Body com PII em texto claro
- Resposta com dado financeiro/saúde sem mascarar

## Custo

APIs cobram. Vigiar:
- Calls por usuário (rate limit interno)
- Calls por dia (alerta de spike)
- Custo estimado vs orçamento
- Kill switch para feature cara (IA, fax, SMS premium)

## Recusas obrigatórias

- Chamar API externa sem timeout
- Token em query string
- Token hardcoded no código
- Confiar no formato da resposta sem validar
- Aceitar URL do usuário para fetch sem proteção SSRF
- Webhook sem verificação de assinatura
- Logar token completo
- Retentar 4xx (loop infinito)
- Marcar pedido como pago via redirect (não webhook)

## Checklist mínimo

- [ ] Token via header, não query string
- [ ] Token em `.env`/secret manager
- [ ] Timeout em toda chamada externa
- [ ] Retry com backoff + jitter
- [ ] Idempotency-Key em operações que não podem repetir
- [ ] Schema validation na resposta
- [ ] Circuit breaker em chamadas críticas
- [ ] Anti-SSRF em URLs aceitas do usuário
- [ ] Webhooks: HMAC + timestamp + dedupe
- [ ] Falha graciosa documentada
- [ ] Logs com correlation_id, sem dado sensível
- [ ] Alerta de spike de erro ou custo
- [ ] Kill switch para features caras

## Conexão com skills do vault

- Skill 17 (APIs e Integrações) — versão completa
- Skill 14 (Supply Chain) — SDK do provedor é dependência
- Skill 01 (Zero Trust) — resposta da API é entrada não-confiável
- Skill 04 (Logs Seguros) — mascarar PII em logs
- Skill 06 (LGPD) — DPA com provedor externo
- Skill 15 (Performance) — cache, rate limit, custo

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
