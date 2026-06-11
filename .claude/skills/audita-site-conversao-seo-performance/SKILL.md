---
name: audita-site-conversao-seo-performance
description: Use esta skill quando precisar auditar um site ou landing page (do cliente, de concorrente ou feito por IA) sob a ótica de conversão, SEO, performance e mobile — diagnóstico com severidade, quick wins e plano de melhoria. É o serviço de diagnóstico/raio-x da DV Digital.
---

# audita-site-conversao-seo-performance

## O que esta skill faz

Executa **auditoria de presença digital orientada a resultado comercial**: por que o site não converte, por que não rankeia, onde perde o visitante. Produz relatório com achados classificados (Crítico / Importante / Melhoria), quick wins de implementação rápida e plano priorizado. É auditoria de leitura — **não altera código**; correções viram plano que passa pelas skills técnicas.

## Quando usar

- Diagnóstico de entrada para prospect ("raio-x" que vira proposta).
- Cliente reclama que "o site não traz cliente".
- Antes de ligar tráfego pago em página existente.
- Análise de concorrente para posicionamento.
- Revisão de página/site gerado por IA antes de assumir manutenção.

## Entradas necessárias

1. URL(s) a auditar e objetivo de negócio da página (lead, venda, agendamento).
2. Público-alvo e região de atuação.
3. Acesso a dados, se houver (GA4, Search Console, gestor de tráfego) — a auditoria funciona sem, mas fica mais precisa com.
4. Palavras-chave que o cliente gostaria de ser encontrado (para confronto com a realidade).
5. Concorrentes de referência (opcional).

## Processo obrigatório

1. **Conversão** (visão de visitante, 5 segundos): a promessa é clara? para quem? qual ação? CTA visível sem rolar? prova social real? formulário com fricção? WhatsApp acessível? — critérios da `/ui-conversion-landing-page`.
2. **SEO on-page**: title/meta/H1 únicos e coerentes, hierarquia de headings, conteúdo responde a intenção de busca, URLs limpas, imagens com alt, dados estruturados (`/seo-and-structured-data`).
3. **SEO técnico**: indexação (robots, sitemap, canonical), HTTPS, redirecionamentos, páginas órfãs, mobile-friendly.
4. **Performance**: Core Web Vitals (LCP, INP, CLS) via PageSpeed/Lighthouse, peso de imagens, scripts bloqueantes, fontes (`/performance-web-vitals`).
5. **Mobile e tablet**: quebras, scroll lateral, alvos de toque, texto pequeno, formulário difícil (`/ui-premium-responsive-design`).
6. **Confiança e conformidade visíveis**: política de privacidade, banner de cookies com rejeição real, dados da empresa, contraste/acessibilidade básica (`/accessibility-wcag-audit` quando aprofundar).
7. Classificar cada achado: **Crítico** (perde lead/venda agora) / **Importante** / **Melhoria**; separar **quick wins** (≤ 1 dia de trabalho).
8. Fechar com plano priorizado por impacto × esforço e, se for prospect, gancho para `/cria-proposta-comercial-dv-digital`.

## Checklist de qualidade

- [ ] Cada achado tem: evidência concreta (onde/o quê), impacto no negócio e recomendação.
- [ ] Sem "achismo" — afirmações verificáveis (medições, prints, exemplos do texto real).
- [ ] Severidade atribuída a todos os achados.
- [ ] Quick wins separados do plano longo.
- [ ] Linguagem que o dono do negócio entende (jargão técnico traduzido).
- [ ] Auditoria de concorrente usa apenas informação pública (sem scraping agressivo, sem acesso indevido).
- [ ] Nenhuma alteração feita no site durante a auditoria.

## Erros comuns que esta skill deve evitar

- Relatório de ferramenta crua (despejo de Lighthouse) sem tradução para negócio.
- Apontar 60 problemas sem priorização — paralisa o cliente.
- Criticar estética ignorando conversão (página "feia" que converte não é o problema nº 1).
- Recomendar reescrever do zero quando ajustes incrementais resolvem (Regra 00).
- Ignorar mobile — onde está a maioria do tráfego local.
- Prometer posição no Google como resultado da correção.

## Saída esperada

```text
RELATÓRIO DE AUDITORIA
1. Resumo executivo (3–5 frases, visão do dono)
2. Achados por área (Conversão / SEO / Performance / Mobile / Confiança)
   — cada um: evidência → impacto → recomendação → severidade
3. Quick wins (lista de ação imediata)
4. Plano priorizado (impacto × esforço)
5. Métricas de linha de base (para comparar depois)
```

## Exemplo de uso

> "Audita o site da clínica da Cliente Saúde antes da campanha."

Saída: relatório apontando (ex.) hero sem promessa específica [Crítico/Conversão], title duplicado em 3 páginas [Importante/SEO], LCP 4,8s por imagem de 2MB [Crítico/Performance], botão de WhatsApp ausente no mobile [Crítico/Conversão], banner de cookies sem botão rejeitar [Importante/LGPD] — com quick wins e plano em 2 fases.

---

## Conexão com o ecossistema

Correções de código passam por `/preserve-existing-behavior` antes. Aprofundamentos: `/seo-and-structured-data`, `/performance-web-vitals`, `/accessibility-wcag-audit`, `/security-baseline-universal` (se sinais de problema de segurança → `auditor-seguranca`). Diagnóstico vira proposta: `/cria-proposta-comercial-dv-digital`. Agente: `estrategista-conversao-digital`.

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
