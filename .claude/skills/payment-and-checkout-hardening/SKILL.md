---
name: payment-and-checkout-hardening
description: Endurecimento de checkout, integração com gateway de pagamento, webhooks, idempotência, anti-fraude e PCI básico. Use em qualquer projeto com checkout, assinatura, cobrança, marketplace, doação ou repasse financeiro.
---

# payment-and-checkout-hardening

Use em **qualquer fluxo financeiro**. Falhas aqui custam dinheiro direto (cobrança duplicada, chargeback, fraude) e legal (PCI-DSS, LGPD).

## Princípios

1. **Não armazenar dados de cartão** — tokenizar com o gateway
2. **Não confiar no cliente** para valor, preço, cupom, frete — calcular no servidor
3. **Idempotência** em toda chamada financeira
4. **Webhooks assinados e verificados** antes de mudar estado
5. **Reconciliação** entre seu banco e o do gateway
6. **HITL** em estornos, transferências, ações em massa

## Tokenização (PCI baseline)

**Nunca armazenar:**
- PAN (número do cartão completo)
- CVV (nunca, em nenhuma circunstância — nem temporariamente)
- Track data (faixa magnética)

**Pode armazenar (com cuidado):**
- BIN (6 primeiros) + last4 (4 últimos) — para identificação visual
- Token do gateway (representa o cartão, não o número)
- Brand (Visa, Master, Elo)
- Vencimento (mês/ano)

**Fluxo correto:**
1. Frontend envia dado do cartão **direto ao gateway** (iframe, JS do gateway, ex: Stripe.js, PagSeguro/PagBank SDK, Mercado Pago Checkout, etc.)
2. Gateway retorna **token** ao frontend
3. Frontend envia **token** ao seu backend
4. Backend cobra usando o token
5. Backend salva: token, BIN+last4, brand, expiry — **nunca o número**

**Seu backend nunca toca o número do cartão.** Se tocar, você está sob escopo PCI-DSS completo (custoso e complexo).

## Valor e preço

### Calcular no servidor sempre
- Cliente envia: ID do produto, quantidade, ID do cupom
- Servidor calcula: preço, desconto, frete, imposto, total
- **Nunca** confiar em valor enviado pelo cliente
- Mesmo que o frontend mostre, recalcular antes de cobrar

### Cupons e descontos
- Validar: existe, está ativo, dentro da janela, dentro do limite de uso, aplicável ao item, ao usuário
- Anti-stacking quando regra define
- Lock por usuário (1 uso por pessoa)
- Auditar uso (quem, quando, valor)

### Frete e impostos
- Cotação no servidor, com cache curto
- Re-cotar no momento da cobrança se mais de N minutos

## Idempotência

### Por que importa
Cliente clica "comprar" duas vezes em conexão ruim. Sem idempotência: duas cobranças.

### Como implementar
- Cliente envia `Idempotency-Key` no header (UUID v4)
- Servidor armazena: chave + resultado da operação
- Mesma chave, mesma resposta — nunca processa duas vezes
- TTL da chave: 24h-7d
- Gateways modernos (Stripe, PagBank, etc.) suportam — repassar para eles

### Em webhooks
- Cada webhook tem ID único (do gateway)
- Armazenar IDs processados
- Receber o mesmo ID 2x = ignorar (deduplicação)
- TTL razoável (30 dias)

## Webhooks

### Verificação obrigatória
- **Assinatura HMAC** validada antes de processar
- Cada gateway tem sua função: `Stripe.webhooks.constructEvent`, etc.
- **Comparação constant-time** (`hash_equals` / `crypto.timingSafeEqual`)
- Validar **timestamp** — rejeitar se > 5 min de idade (anti-replay)

### Processamento
- Retornar **2xx rápido** (gateway tem timeout 5-10s)
- Processar **async** (queue) se a operação é lenta
- Idempotente: mesmo evento 2x = mesmo resultado
- Logar evento completo (mascarando PII)

### Allowlist de IPs do gateway
- Quando o gateway publica faixa de IPs, restringir webhook por firewall/middleware
- Combinado com assinatura, não em vez de

### Endpoint
- URL não óbvia (`/webhooks/stripe/abc123def456`) — defesa em profundidade
- HTTPS sempre
- Sem autenticação por sessão (é máquina-a-máquina)

## Estado do pedido

### Máquina de estados explícita
```
PENDING_PAYMENT
  ├─ PAID         (autorizado + capturado)
  ├─ CANCELLED    (cliente desistiu)
  └─ EXPIRED      (TTL para pagar acabou)
PAID
  ├─ FULFILLED    (entregue/processado)
  ├─ REFUNDED     (estornado)
  └─ DISPUTED     (chargeback)
```

### Transições válidas registradas
- Nunca pular estado
- Log de cada transição (quem, quando, motivo)
- Estado é **único source of truth** — preço, status, valor pago vêm dele

### Atualização via webhook só
- Não confiar em redirect de retorno ("success_url") para marcar como pago
- Cliente pode falsificar redirect
- Estado real vem do **webhook** do gateway

## Reconciliação

- Job diário/semanal compara: pedidos no seu banco vs pagamentos no gateway
- Detectar: pedido pago no gateway que não está como pago no seu banco
- Detectar: pedido pago no seu banco que não tem evento no gateway
- Alertar humano nas divergências
- Não corrigir automaticamente (HITL)

## Estornos e refunds

### Sempre HITL
- Estorno parcial e total exigem aprovação humana
- Maker-checker para estornos de alto valor
- Registro: motivo, quem aprovou, comprovante do gateway

### Anti-abuso de refund
- Limite por usuário em janela (alguém pedindo refund toda semana = sinalizar)
- Janela de elegibilidade definida (30/60/90 dias)

## Anti-fraude

### Sinais comuns
- Múltiplas tentativas com cartões diferentes
- Endereço de cobrança ≠ entrega (não é fraude per se, mas sinal)
- IP em país diferente do endereço
- Velocity: muitos pedidos em curto espaço
- E-mail descartável / criado recentemente
- Compra de valor alto + cliente novo

### Ferramentas
- Antifraude do gateway (Stripe Radar, Adyen Risk, gateway brasileiro tem similar)
- 3D-Secure quando disponível (transfere responsabilidade ao emissor)
- Manual review para sinais altos

### Não bloquear cego
- Falsos positivos doem (cliente bom recusado)
- Combinar com revisão humana para sinais médios

## Limites

### Por usuário
- Quantidade de tentativas de cartão em janela (5/h por exemplo)
- Valor máximo por pedido (configurável)
- Quantidade de pedidos por dia

### Por sistema
- Cap de pedidos por minuto
- Cap de valor processado por hora
- Kill switch para travar checkout em emergência

## LGPD em pagamento

- Base legal: execução de contrato (art. 7º, V)
- Dados financeiros têm sensibilidade alta — mascarar em logs
- BIN+last4 OK; PAN nunca
- Retenção: 5 anos (fiscal) ou conforme política
- DPA com gateway
- Transferência internacional: documentar se gateway estiver fora do Brasil

## Logs

**Logar:**
- ID do pedido, ID do usuário, valor, timestamp, status
- ID da cobrança no gateway
- Resultado (sucesso/erro) + código de erro
- Webhook recebido (ID, evento, status)

**Nunca logar:**
- PAN completo
- CVV
- Resposta de autorização contendo dado de cartão
- Token sem mascarar

## Recusas obrigatórias

- Armazenar PAN ou CVV
- Calcular preço/desconto no frontend e confiar
- Webhook sem verificação de assinatura
- Marcar pedido como pago via redirect do navegador (sem webhook)
- Estorno sem HITL
- Operação financeira sem idempotência
- Cobrar antes de validar valor no servidor
- Cobrar em background sem confirmação visível ao usuário
- Cobrar recorrência sem opt-in claro
- Esconder cancelamento de assinatura (dark pattern)

## Checklist mínimo

- [ ] Sem PAN/CVV armazenados — só token
- [ ] Frontend usa SDK do gateway (não envia número ao seu backend)
- [ ] Preço calculado no servidor
- [ ] Cupom validado no servidor (existe, ativo, válido para usuário)
- [ ] Idempotency-Key em chamadas ao gateway
- [ ] Webhook com assinatura verificada (HMAC + timestamp)
- [ ] Webhook idempotente (deduplicação por ID)
- [ ] Estado do pedido vem do webhook, não do redirect
- [ ] Reconciliação periódica gateway × banco
- [ ] Estornos com HITL e log
- [ ] Antifraude do gateway ativado
- [ ] 3D-Secure quando aplicável
- [ ] Limites por usuário e por sistema
- [ ] Cancelamento de assinatura tão fácil quanto a contratação
- [ ] LGPD: base legal, retenção, DPA, mascaramento em log
- [ ] Kill switch para travar checkout

## Conexão com skills do vault

- Skill 01 (Zero Trust) — entrada não confiável (valor, cupom)
- Skill 04 (Logs Seguros) — mascarar dado financeiro
- Skill 06 (LGPD) — base legal, retenção fiscal
- Skill 09 (HITL) — estornos, ações em massa
- Skill 17 (APIs/Integrações) — webhook signature, retry, idempotência
- Skill 12 (Banco) — transação correta, isolamento, idempotência via constraint

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
