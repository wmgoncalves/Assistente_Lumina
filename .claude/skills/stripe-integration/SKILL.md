---
name: stripe-integration
description: Integração com Stripe (pagamentos, assinaturas, Checkout, Payment Intents, webhooks, Connect) com padrões corretos e seguros. Use ao integrar Stripe num projeto. Foco em SDK/fluxo; a segurança de checkout/anti-fraude/PCI vem de payment-and-checkout-hardening.
---

# stripe-integration

Integrar Stripe certo na primeira vez. Segurança de checkout/PCI: aplicar sempre `/payment-and-checkout-hardening`.

## Quando usar
- Adicionar pagamento único, assinatura, marketplace (Connect) ou doação com Stripe.

## Padrões corretos
- **Nunca confiar no cliente para o valor:** criar PaymentIntent/Checkout Session **no servidor** com o preço vindo do seu banco/catálogo (não do front).
- **Chaves:** `pk_*` no front (pública), `sk_*` só no servidor (env, nunca no repo — `/secrets-and-env-guard`). `pk_test`/`sk_test` vs `pk_live`/`sk_live` por ambiente (`/environment-strategy`).
- **Checkout Session** (hospedado) reduz escopo PCI vs montar formulário de cartão.
- **Webhooks:** verificar **assinatura** (`Stripe-Signature` + webhook secret); processar de forma **idempotente** (Stripe reentrega) — alinha com `/open-redirect-and-race-conditions-hardening`. Confiar no webhook como fonte de verdade do pagamento, não no redirect de sucesso.
- **Assinaturas:** tratar `customer.subscription.*` e `invoice.*`; lidar com falha de cobrança (dunning), trial, cancelamento.
- **Idempotency-Key** em criação de cobrança (evita duplicidade em retry).
- **Reembolso/estorno:** ação **Crítica** → `/hitl-checkpoint`.

## Privacidade/LGPD
- Não armazenar PAN/CVV (deixar com a Stripe); guardar só `customer_id`/`payment_method_id`. Aplicar `/lgpd-compliance-check` e DPA da Stripe.

## Recusas
- Valor/preço vindo do front; confirmar pedido só pelo redirect (sem webhook).
- Webhook sem verificação de assinatura ou sem idempotência.
- `sk_live` no front/repo; misturar test/live.
- Guardar dados de cartão no seu banco.

## Saída
Fluxo escolhido (Checkout vs PaymentIntent), código servidor mínimo, handler de webhook (assinatura+idempotência) e checklist `/payment-and-checkout-hardening`.

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
