---
name: logs-and-errors-hardening
description: Logs e mensagens de erro seguros. Garante mascaramento de PII, sem vazamento via stack trace, mensagens genéricas ao usuário, correlation_id para debug. Use em qualquer projeto com logging ou tratamento de erro.
---

# logs-and-errors-hardening

Use em **qualquer projeto** — logs e erros são fontes silenciosas de vazamento de PII, credenciais e detalhes internos.

## Princípios

1. **Usuário vê mensagem genérica + correlation_id**
2. **Operador vê detalhe técnico** (em log interno, com mascaramento)
3. **Atacante não aprende nada útil** do erro
4. **PII nunca em texto claro** em log persistido
5. **Stack trace nunca** ao usuário em produção
6. **Log é evidência** — íntegro, retido conforme política, com tempo confiável

## Mensagem ao usuário

### Em erro
```
Mensagem genérica + correlation_id

Exemplo:
  "Algo deu errado. Tente novamente em alguns instantes.
   Se persistir, informe o código: ERR-2026-05-14-7b3a..."
```

### Nunca ao usuário
- Stack trace
- Nome de função interna
- Path de arquivo (`/var/www/app/...`)
- Query SQL
- Versão de framework
- Mensagem original do banco (`Duplicate entry...`)
- Nome de tabela/coluna
- IP interno
- Token, hash, ID interno bruto

### Padrão genérico por categoria
| Categoria | Mensagem ao usuário | Status HTTP |
|---|---|---|
| Validação | "Verifique os campos destacados" | 400/422 |
| Auth | "Credenciais inválidas" (sem dizer qual) | 401 |
| Permissão | "Você não tem permissão para isso" | 403 |
| Not found | "Não encontramos o recurso" | 404 |
| Rate limit | "Muitas tentativas. Tente em alguns minutos" | 429 |
| Servidor | "Algo deu errado. Código: {correlation_id}" | 500 |

## Log interno

### Estrutura recomendada (JSON estruturado)
```json
{
  "timestamp": "2026-05-14T15:30:00.000Z",
  "level": "ERROR",
  "correlation_id": "ERR-2026-05-14-7b3a",
  "service": "checkout-api",
  "user_id": "u_12345",
  "action": "process_payment",
  "error": "PaymentGateway.connect() timeout",
  "duration_ms": 5012,
  "trace_id": "abc123def456"
}
```

### Níveis
- **DEBUG**: detalhe técnico, só em dev/staging
- **INFO**: eventos esperados (login OK, pedido criado)
- **WARN**: situação anômala mas tolerada (retry teve sucesso, fallback acionado)
- **ERROR**: falha que precisou de tratamento
- **CRITICAL**: falha que afeta serviço inteiro

Em produção: INFO+. DEBUG só com flag/sob demanda.

## Mascaramento obrigatório

### Antes de logar:

| Tipo | Como mascarar |
|---|---|
| E-mail | `joao.silva@email.com` → `j***@e***.com` |
| CPF | `123.456.789-00` → `12X.XXX.XXX-X0` |
| Telefone | `+5511987654321` → `+55119876XXXXX` |
| Cartão | `4532 0000 0000 0000` → `4532 **** **** 0000` |
| Senha | **NUNCA logar** — nem mascarada |
| CVV | **NUNCA logar** |
| Token de sessão | `abc123...xyz` → `abc1***xyz` ou só hash |
| Chave API | `sk_live_abc...` → `sk_live_***` |
| Token JWT | só decodificar header (não payload) |
| Endereço | logar só CEP, não rua completa |
| IP | em log de auditoria OK; em log de produto, anonimizar último octeto (`192.168.1.X`) |

### Função helper
Sempre ter um `redact(data)` central que mascara antes de qualquer log.

## Correlation ID

- Gerado no início da requisição (CSPRNG, 16 chars)
- Propagado em **todos** os logs daquela requisição
- Propagado em **header HTTP** (`X-Correlation-ID`) para chamadas internas
- Retornado ao usuário em mensagem de erro
- Permite achar **todos** os logs de uma operação rapidamente

## Stack trace

- Capturar **internamente** sempre
- **Nunca** retornar ao usuário em produção
- Verificar:
  - PHP: `display_errors = Off` em produção
  - Node: middleware de erro genérico, não `errorhandler` em produção
  - Django: `DEBUG = False`
  - Rails: `config.consider_all_requests_local = false`

## Retenção e armazenamento

### Retenção
- **Logs de aplicação:** 30-90 dias
- **Logs de auditoria** (login, ação financeira, mudança de permissão): 1 ano+ (depende da exigência)
- **Logs de acesso HTTP:** 1 ano (Marco Civil 19.965/2014)
- **Logs com PII:** menor possível, conforme LGPD

### Armazenamento
- Fora do servidor de aplicação quando possível (CloudWatch, Datadog, Loki, etc.)
- Acesso restrito (operadores autorizados)
- Imutável (append-only) em audit logs
- Criptografia em repouso para logs com PII

### Acesso
- RBAC: dev acessa app log, finance acessa audit log
- Cada acesso ao log é... logado (meta-audit)
- Quando exportar log para análise, anonimizar PII

## Logs proibidos

**Nunca logar:**
- Senha (texto claro, hash, ou criptografada)
- CVV
- Número de cartão completo
- Token de sessão completo
- Chave privada (.pem, .key)
- Resposta inteira do banco em endpoints que retornam PII
- Body de webhook financeiro completo (mascarar antes)

## Erros estruturados

### Em vez de
```php
try { ... } catch (Exception $e) { 
    echo $e->getMessage();  // ❌ pode ter detalhe interno
}
```

### Use
```php
try { 
    // ...
} catch (Exception $e) {
    $cid = generateCorrelationId();
    log_error($cid, $e->getMessage(), $e->getTraceAsString(), $context);
    http_response_code(500);
    echo json_encode([
        'error' => 'internal_error',
        'message' => 'Algo deu errado.',
        'correlation_id' => $cid
    ]);
}
```

## Monitoramento

### Alertas
- Spike de erros (10x média recente)
- Erros em fluxo crítico (login, pagamento)
- Stack trace recorrente
- 4xx em massa de mesmo IP (possível attack)

### SLO razoáveis
- Erro 5xx: < 0.1% das requisições
- Tempo de resposta P95: < 500ms (web), < 2s (API)

## Frameworks de erro

### Sentry / Bugsnag / Rollbar
- Configurar `before_send` para mascarar PII antes de enviar
- Não enviar dados de requisição completos
- Sample rate < 100% se volume alto
- DPA com o provedor (LGPD)

## Recusas obrigatórias

- Stack trace ao usuário em produção
- Logar senha, CVV, token em texto claro
- "Console.log({user})" no frontend de produção
- Echo $e->getMessage() para o cliente
- Log sem mascaramento de PII
- Acesso irrestrito a logs
- Logs em arquivo do public (acessível por URL)
- Logs com tamanho ilimitado (sem rotação)

## Checklist mínimo

- [ ] Mensagens de erro ao usuário são genéricas + correlation_id
- [ ] Stack trace nunca vai ao usuário em produção
- [ ] DEBUG/display_errors desligado em produção
- [ ] Função `redact()` mascarando PII antes de logar
- [ ] Logs estruturados (JSON) com correlation_id
- [ ] Logs fora do diretório público
- [ ] Rotação configurada (não enche disco)
- [ ] Retenção definida por categoria
- [ ] Acesso aos logs com RBAC
- [ ] Alertas em spike de erro
- [ ] DPA com provedor de log/monitoring

## Conexão com skills do vault

- Skill 04 (Erros e Logs Seguros) — versão completa, conceitual
- Skill 06 (LGPD) — PII em log
- Skill 01 (Zero Trust) — não revelar interno via erro
- Skill 09 (HITL) — alertas em incidente

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
