---
name: api-contract-openapi
description: Design contract-first de APIs com OpenAPI/Swagger — versionamento, compatibilidade retroativa, paginação, erros padronizados, idempotência e documentação. Use ao projetar ou evoluir uma API REST/HTTP. Complementa api-backend-hardening (segurança) e regression-safety (compatibilidade) com o lado de contrato/design.
---

# api-contract-openapi

O contrato é promessa pública: design-first, versionado, compatível.

## Quando usar
- Projetar API nova (REST/HTTP).
- Evoluir endpoint existente (sem quebrar consumidores).

## Contrato (OpenAPI 3.1)
- **Design-first:** escrever o `openapi.yaml` antes do código; gerar stubs/validação a partir dele.
- Recursos no plural, verbos HTTP corretos, status codes corretos (200/201/204/400/401/403/404/409/422/429/5xx).
- **Erros padronizados** (ex.: RFC 9457 Problem Details): `{type,title,status,detail,instance,correlation_id}` — sem vazar stack (alinha com `/logs-and-errors-hardening`).
- **Paginação** consistente (cursor/keyset preferível a offset) e documentada.
- Schemas com validação (tipos, formatos, required); validar no servidor (`/api-backend-hardening`).

## Versionamento e compatibilidade
- Versão na URL (`/v1`) ou header; **mudança compatível** (adicionar campo opcional) não sobe versão; **breaking** (remover/renomear campo, mudar tipo, novo required) exige nova versão + janela de depreciação (aplicar `/regression-safety` / Skill 11).
- Nunca remover campo/rota sem `Deprecation`/`Sunset` headers + prazo + aviso aos consumidores.

## Robustez operacional
- **Idempotência** em POST que cria/cobra (`Idempotency-Key`) — alinha com `/open-redirect-and-race-conditions-hardening` e `/payment-and-checkout-hardening`.
- **Rate limit** documentado (`429` + `Retry-After`).
- **Webhooks** (se emitir): assinatura HMAC, retry, idempotência no receptor.
- Documentação navegável (Swagger UI/Redoc) — **não** expor schema interno sensível.

## Recusas
- Quebrar contrato (remover/renomear campo, mudar tipo) sem versão + depreciação.
- Erro genérico sem código/correlation_id, ou erro que vaza interno.
- POST de cobrança sem idempotência.
- Documentar endpoint interno/admin em spec público.

## Saída
Trecho de `openapi.yaml` (paths/schemas/erros), política de versionamento, plano de depreciação (se evolução) e exemplos de request/response. Oficial relacionado: `postman` (ver [[anthropic-banco-oficial]]).

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
