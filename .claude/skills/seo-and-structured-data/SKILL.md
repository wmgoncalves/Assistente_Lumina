---
name: seo-and-structured-data
description: SEO técnico e dados estruturados para sites e landing pages — meta tags, Open Graph, Twitter Card, canonical, sitemap.xml, robots.txt, hreflang e schema.org (JSON-LD). Use ao criar/revisar páginas públicas, blog, e-commerce, institucional. Integra com performance (Web Vitals) e acessibilidade.
---

# seo-and-structured-data

SEO técnico que não conflita com segurança, privacidade nem acessibilidade.

## Quando usar
- Criar/revisar página pública, landing page, blog, catálogo, institucional.
- Migração de domínio/URL (preservar ranking com redirects 301).

## Checklist técnico
- [ ] `<title>` único (50–60 car.) e `<meta name="description">` (150–160 car.) por página.
- [ ] **Canonical** (`<link rel="canonical">`) para evitar conteúdo duplicado.
- [ ] **Open Graph** (`og:title/description/image/url/type`) + **Twitter Card**.
- [ ] **Headings** semânticos (um `<h1>`, hierarquia sem pular) — alinha com `/accessibility-wcag-audit`.
- [ ] **sitemap.xml** atualizado + referência no `robots.txt`.
- [ ] **robots.txt** e `<meta name="robots">` corretos; **bloquear indexação de homologação** (alinha com `/environment-strategy`).
- [ ] **hreflang** se houver múltiplos idiomas/regiões.
- [ ] URLs limpas, estáveis; redirect **301** ao mudar URL (nunca quebrar link antigo — `/regression-safety`).
- [ ] **Core Web Vitals** bons (LCP/INP/CLS) — aplicar `/performance-web-vitals`.
- [ ] Imagens com `alt` (SEO + acessibilidade) e `width/height`.

## Dados estruturados (schema.org via JSON-LD)
- Tipos comuns: `Organization`, `WebSite`, `BreadcrumbList`, `Product`+`Offer`, `Article`, `FAQPage`, `LocalBusiness`, `Event`.
- Validar no Rich Results Test; **não** marcar conteúdo invisível ao usuário (risco de penalização).
- JSON-LD com dados reais da página (sem markup enganoso).

## Recusas
- Cloaking, texto oculto, keyword stuffing, markup de dados falsos (dark patterns de SEO).
- Indexar ambiente de homologação/staging.
- Quebrar URLs existentes sem redirect 301.
- Sacrificar acessibilidade/performance "pelo SEO".

## Saída
Bloco `<head>` (meta+OG+canonical), JSON-LD aplicável, entradas de sitemap/robots e plano de redirects (se migração).

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
