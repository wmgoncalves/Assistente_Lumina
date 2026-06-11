---
name: cria-copy-vendas-seo
description: Use esta skill quando precisar escrever ou revisar copy de venda com SEO — headlines, seções de site, landing pages, anúncios Google/Meta, posts, propostas e CTAs. PT-BR, persuasão ética, foco em conversão e clareza, sem promessa falsa.
---

# cria-copy-vendas-seo

## O que esta skill faz

Escreve e revisa **texto comercial que converte e rankeia**: headline com promessa específica, estrutura de argumento (dor → solução → prova → ação), microcopy de formulário/CTA e otimização on-page (title, meta description, H1–H3, palavra-chave sem stuffing). Tom DV Digital: prático, direto, profissional, sem enrolação.

## Quando usar

- Headline/subtítulo de hero, seções de LP ou site institucional.
- Anúncios: títulos e descrições Google Ads (limites de caracteres), primary text/headline Meta Ads.
- Posts e legendas com objetivo comercial.
- Texto de proposta, e-mail comercial, mensagem de WhatsApp de funil.
- Revisão de copy existente que não está convertendo.

## Entradas necessárias

1. **Oferta**: o que é vendido, para quem, qual transformação entrega.
2. **Público**: nível de consciência (não sabe que tem o problema → já compara soluções).
3. **Diferencial real** e provas disponíveis (anos, números, certificações, depoimentos REAIS).
4. **Ação desejada** (orçamento, WhatsApp, download, compra).
5. **Palavra-chave alvo** (se houver objetivo SEO) e canal (LP, anúncio, post, e-mail).
6. **Tom do cliente** (consultar playbook em `10-Projetos/<cliente>/`).

## Processo obrigatório

1. Definir a **promessa central**: específica, verificável, no vocabulário do público. Testar contra o padrão fraco/forte da `/ui-conversion-landing-page` §7.2.
2. Escolher a estrutura: PAS (problema-agitação-solução) para público com dor consciente; benefício direto para público pronto; autoridade primeiro para B2B institucional.
3. Escrever em camadas: headline → subtítulo (como + para quem) → benefícios (valor, não recurso) → prova → objeções → CTA específico.
4. SEO on-page quando aplicável: 1 palavra-chave primária por página; title ≤ 60 chars com a keyword no início; meta description ≤ 155 chars com CTA; H1 único; variações semânticas nos H2/H3 — nunca stuffing.
5. Para anúncios: respeitar limites (Google RSA: títulos 30, descrições 90; Meta: primary text enxuto com gancho na 1ª linha).
6. Revisar contra a régua ética (abaixo) e cortar 20% do texto na revisão final.

## Checklist de qualidade

- [ ] A promessa é específica (alguém poderia cobrar por ela?).
- [ ] Benefício ≠ recurso: cada item responde "e daí?".
- [ ] CTA com verbo + resultado ("Solicitar orçamento", não "Enviar").
- [ ] Prova social real e citável; nenhuma inventada.
- [ ] PT-BR natural, frases curtas, sem jargão vazio ("soluções inovadoras").
- [ ] SEO: title, meta, H1 e keyword coerentes entre si.
- [ ] Limites de caracteres do canal respeitados.
- [ ] Leitura em voz alta passa sem tropeço.

## Erros comuns que esta skill deve evitar

- Promessa absoluta ou enganosa ("garantido", "o melhor do Brasil" sem prova).
- Falsa escassez/urgência inventada (dark pattern — recusa obrigatória).
- Keyword stuffing e título caça-clique que a página não entrega.
- Copy sobre a empresa em vez de sobre o cliente ("nós somos…" em 80% do texto).
- Depoimento, número ou case inventado.
- Texto longo demais para o canal (anúncio com copy de LP).
- Ignorar o tom já aprovado no playbook do cliente.

## Saída esperada

```text
COPY FINAL pronta para uso (por seção ou por peça de anúncio)
VARIAÇÕES de headline (2–3) com racional de cada uma
SEO (quando aplicável): title / meta description / H1 / keywords secundárias
NOTAS: prova pendente de confirmação com o cliente, limites usados
```

## Exemplo de uso

> "Headline para LP da AtendaPro Barber."

Saída: 3 opções de promessa ("Agenda cheia sem caderninho: agendamento online para a sua barbearia", …), subtítulo, CTA "Testar grátis", title/meta com keyword "sistema para barbearia", nota: confirmar número real de barbearias atendidas antes de usar como prova.

---

## Conexão com o ecossistema

Par com `/ui-conversion-landing-page` (estrutura) e `/seo-and-structured-data` (técnico). Anúncios: `/planeja-campanha-google-meta`. Ética e LGPD em formulários: `/lgpd-compliance-check`. Agente: `copywriter-vendas-seo`.

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
