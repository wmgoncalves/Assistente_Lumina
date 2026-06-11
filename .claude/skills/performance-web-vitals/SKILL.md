---
name: performance-web-vitals
description: Otimização de performance web (Core Web Vitals — LCP, INP, CLS) e de backend/banco, sem quebrar comportamento nem segurança. Use ao notar lentidão, antes de publicar, ou ao revisar páginas pesadas, queries lentas e uso de cache. Cobre imagens, fontes, JS, cache, CDN, N+1, índices e limites de custo. Equivalente operacional da Skill 15.
---

# performance-web-vitals

Performance vem **depois** de segurança, privacidade, acessibilidade e preservação na hierarquia — otimize sem enfraquecer nenhuma delas e sem quebrar comportamento existente.

## Quando usar
- Página/app lento, TTFB alto, layout "pulando".
- Antes de publicar (orçamento de performance).
- Query lenta, listagem sem paginação, suspeita de N+1.
- Decisão de cache, CDN, compressão.

## Metas Core Web Vitals (campo, p75)
- **LCP** (carregamento) ≤ 2.5s
- **INP** (interatividade) ≤ 200ms
- **CLS** (estabilidade visual) ≤ 0.1

## Frontend

### LCP
- [ ] Otimizar a maior imagem/above-the-fold: formato moderno (AVIF/WebP), dimensões corretas, `loading="eager"` + `fetchpriority="high"` no herói; `loading="lazy"` no resto.
- [ ] `width`/`height` (ou `aspect-ratio`) em toda imagem/vídeo para reservar espaço (evita CLS).
- [ ] Fontes: `font-display: swap`, `preconnect`/`preload` da fonte crítica, subset; evitar FOIT.
- [ ] CSS crítico inline ou priorizado; remover CSS/JS não usado.
- [ ] HTML server-rendered/estático para conteúdo crítico quando possível.

### INP
- [ ] Quebrar tarefas longas de JS (> 50ms); `requestIdleCallback`/`scheduler.yield`.
- [ ] Debounce/throttle em input, scroll, resize.
- [ ] Evitar JS bloqueante; `defer`/`async`; code splitting; carregar o não-crítico sob demanda.
- [ ] Virtualizar listas grandes.

### CLS
- [ ] Dimensões reservadas para imagem, iframe, ad, embed.
- [ ] Não injetar conteúdo acima do existente após carregar (banner, cookie) sem reservar espaço.
- [ ] `font-display: swap` com fallback de métrica parecida (`size-adjust`).

### Transferência
- [ ] Compressão Brotli/gzip (ver templates de headers).
- [ ] Cache-Control: assets versionados `immutable, max-age=31536000`; HTML `no-cache`.
- [ ] CDN para estáticos; HTTP/2 ou HTTP/3.
- [ ] SRI ao usar CDN de terceiros (combina com `/frontend-hardening`).

## Backend / Banco
- [ ] Identificar **N+1** (query dentro de loop) → eager loading/join/batch.
- [ ] **Índice** nas colunas de `WHERE`/`JOIN`/`ORDER BY` (medir com `EXPLAIN`).
- [ ] **Paginação** obrigatória em listagens (keyset/cursor para grandes volumes; evitar `OFFSET` alto).
- [ ] `SELECT` apenas das colunas necessárias (sem `SELECT *` em hot path).
- [ ] Cache de leitura controlado (com invalidação clara); não cachear dado por usuário em cache público.
- [ ] Rate limit para proteger custo e abuso (combina com `/api-backend-hardening` e `/waf-and-bot-mitigation`).

## IA / custo (se aplicável)
- [ ] Limite de tokens/custo por requisição e por período; kill switch.
- [ ] Cache de respostas determinísticas; streaming para reduzir latência percebida.

## Recusas
- "Otimização" que remove validação, sanitização ou autenticação.
- Cache de conteúdo sensível/por-usuário em camada pública/compartilhada.
- Lazy-load na imagem LCP (piora o LCP).
- Micro-otimização sem medir antes (medir → mudar → medir).
- Refatoração ampla "por performance" sem evidência (preserve comportamento — `/preserve-existing-behavior`).

## Como medir
- Lab: Lighthouse, WebPageTest, `EXPLAIN ANALYZE`, profiler da linguagem.
- Campo: CrUX / RUM (dados reais p75 — o que conta para ranqueamento).
- Sempre **medir antes e depois**; registrar ganho na memória (`curador-memoria`).

## Saída
Tabela: **Métrica/Alvo · Valor atual · Gargalo (arquivo/query) · Otimização proposta · Ganho esperado · Risco**. Mudança que toca contrato/observável passa por `/regression-safety`.

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[15-performance-segura|🎯 Skill 15 — Performance]] · [[agents-claude-code-MOC|🤖 Agentes]]
