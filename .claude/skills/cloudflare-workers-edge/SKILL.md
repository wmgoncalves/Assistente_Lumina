---
name: cloudflare-workers-edge
description: Desenvolvimento na edge da Cloudflare — Workers, Pages, D1, R2, KV, Durable Objects, Queues. Use ao construir/deployar compute serverless na Cloudflare. Foco em código/arquitetura edge; proteção de borda (WAF/bot/DDoS) vem de waf-and-bot-mitigation.
---

# cloudflare-workers-edge

Compute na edge: rápido e barato, mas com limites e armadilhas próprias. Proteção de borda (WAF/Bot/Rate limit): aplicar `/waf-and-bot-mitigation`.

## Quando usar
- API/função serverless em Workers; site em Pages; storage D1/R2/KV.

## Padrões e limites
- **Segredos:** via `wrangler secret`/bindings, nunca em `wrangler.toml` versionado (`/secrets-and-env-guard`). Vars públicas separadas das secrets.
- **Limites do Worker:** CPU time por request, tamanho de subrequest, sem filesystem; cuidado com loops/recursão. Sem estado em memória entre requests (use KV/D1/DO).
- **D1** (SQLite): prepared statements (anti-SQLi — `/database-hardening`); migrations versionadas; backup/export.
- **R2** (objetos): buckets privados; acesso por binding/signed URL; validar upload (`/file-upload-security`).
- **KV:** eventually consistent — não usar para dado que exige leitura-após-escrita forte; bom para cache/config.
- **Durable Objects:** estado forte/coordenação (locks, contadores) — útil contra race conditions (`/open-redirect-and-race-conditions-hardening`).
- **Queues/Cron Triggers:** processamento assíncrono (substitui worker permanente).

## Segurança
- Validar entrada no Worker (servidor); CORS correto; headers de segurança (usar nosso template nginx/apache como referência de CSP/HSTS).
- Não confiar em headers do cliente (`CF-Connecting-IP` é confiável vindo da CF; outros não).
- Verificar assinatura de webhooks recebidos no Worker.
- Deploy reproduzível via `wrangler`; ambientes separados (`/environment-strategy`); rollback de versão.

## Recusas
- Secret em `wrangler.toml` commitado.
- KV como banco transacional; confiar em validação só no cliente.
- SQL concatenado em D1.

## Saída
Arquitetura edge (Workers + D1/R2/KV/DO conforme o caso), bindings/secrets, validação de entrada e plano de deploy/rollback + `/waf-and-bot-mitigation` na borda.

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
