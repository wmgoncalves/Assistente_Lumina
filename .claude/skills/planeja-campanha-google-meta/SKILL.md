---
name: planeja-campanha-google-meta
description: Use esta skill quando precisar planejar, estruturar ou revisar campanha de tráfego pago no Google Ads ou Meta Ads — objetivo, funil, públicos, verba, criativos, UTMs, pixel com consentimento LGPD, métricas (CPL, CAC, ROAS) e remarketing.
---

# planeja-campanha-google-meta

## O que esta skill faz

Produz o **plano completo de campanha de tráfego pago**: estrutura de campanhas/conjuntos/anúncios, segmentação, distribuição de verba, briefing de criativos, plano de UTMs e eventos de conversão, metas numéricas e critérios de pausa/escala. Cobre Google Ads (Pesquisa, PMax, Display, YouTube) e Meta Ads (tráfego, leads, conversões, remarketing).

## Quando usar

- Cliente novo entrando em tráfego pago (estrutura do zero).
- Campanha nova para oferta/serviço específico.
- Revisão de campanha com CPL alto ou conversões caindo.
- Planejamento de remarketing sobre audiências existentes.
- Definição de verba e expectativa de resultado para proposta comercial.

## Entradas necessárias

1. **Oferta e LP de destino** (a LP existe? converte? — se não, acionar `/ui-conversion-landing-page` antes; tráfego pago para LP ruim é verba queimada).
2. **Verba mensal** disponível e ticket médio do cliente.
3. **Público**: região de atuação, B2B/B2C, quem decide a compra.
4. **Meta de negócio** (leads/mês, vendas, agendamentos) — não "engajamento".
5. **Ativos**: conta de anúncio, pixel/tag instalados?, criativos disponíveis, histórico de campanha se houver.
6. **Canal de conversão** (formulário, WhatsApp, ligação, compra).

## Processo obrigatório

1. **Diagnóstico de prontidão**: LP adequada, pixel/Google Tag instalados COM consentimento (modelo opt-out com rejeição real — decisão de produto da DV Digital), eventos de conversão definidos, WhatsApp/CRM pronto para receber lead.
2. **Escolher canal e tipo por intenção**: demanda existente (pessoa busca a solução) → Google Pesquisa; geração de demanda/desejo visual → Meta; remarketing → ambos. Não usar PMax como primeira campanha sem dados de conversão.
3. **Estruturar**: Google — campanhas por tema, grupos por intenção, palavras-chave com correspondência controlada + negativas desde o dia 1. Meta — campanha por objetivo, conjuntos por público (frio/morno/quente), 2–4 criativos por conjunto.
4. **Verba**: reservar 10–20% para teste; definir CPL alvo a partir do ticket (CPL máximo ≈ ticket × taxa de fechamento × margem aceitável); regra de decisão (pausar anúncio após X gastos sem conversão).
5. **Tracking**: plano de UTMs padronizado (`utm_source/medium/campaign/content`), eventos (form_submit, whatsapp_click), conversões importadas no Google/Meta. Pixels respeitam consentimento (`/lgpd-compliance-check`).
6. **Briefing de criativos**: ganchos por nível de consciência, copy via `/cria-copy-vendas-seo`, artes via `/cria-card-institucional-premium`.
7. **Rotina**: o que olhar em 72h, 7 dias e 30 dias; critérios de escala (subir verba ≤ 20–30% por vez) e de pausa.

## Checklist de qualidade

- [ ] LP validada antes de ligar a campanha.
- [ ] Conversão principal mensurável de ponta a ponta (clique → lead → atendimento).
- [ ] Palavras negativas iniciais listadas (Google).
- [ ] Públicos sem sobreposição grosseira entre conjuntos (Meta).
- [ ] UTMs padronizados e documentados.
- [ ] CPL alvo e verba de teste definidos com número, não "ver como performa".
- [ ] Consentimento de cookies funcionando antes de pixel disparar dados pessoais.
- [ ] Expectativa apresentada ao cliente é faixa realista, não promessa.

## Erros comuns que esta skill deve evitar

- Mandar tráfego para home ou LP sem CTA claro.
- PMax/Advantage+ no início sem histórico de conversão (a máquina otimiza para lixo).
- Verba pulverizada em 10 campanhas pequenas em vez de 2 bem alimentadas.
- Sem palavras negativas → verba em pesquisa irrelevante.
- Medir clique/impressão como sucesso em vez de lead/venda.
- Prometer ROAS/resultado garantido ao cliente.
- Pixel coletando sem consentimento ou rastreando dados sensíveis.
- Mudar tudo a cada 2 dias sem dar tempo de aprendizado ao algoritmo.

## Saída esperada

```text
1. DIAGNÓSTICO DE PRONTIDÃO (ok / pendências bloqueantes)
2. ESTRUTURA (árvore campanhas → conjuntos/grupos → anúncios)
3. SEGMENTAÇÃO (palavras-chave + negativas / públicos por temperatura)
4. VERBA (distribuição, CPL alvo, regras de pausa e escala)
5. PLANO DE TRACKING (UTMs, eventos, conversões, consentimento)
6. BRIEFING DE CRIATIVOS (ganchos, formatos, quantidades)
7. ROTINA DE OTIMIZAÇÃO (72h / 7d / 30d) e métricas-alvo
```

## Exemplo de uso

> "Campanha para a Blue Seguros captar leads de seguro de frota, R$ 1.500/mês."

Saída: Google Pesquisa com 2 campanhas (seguro de frota / seguro caminhão) + negativas ("grátis", "vaga", "curso"), conversão = WhatsApp + formulário, CPL alvo calculado sobre ticket, Meta remarketing apenas após 30 dias de dados, UTMs padronizados, criativos com gancho de risco/custo de frota parada.

---

## Conexão com o ecossistema

Antes: `/ui-conversion-landing-page` (LP pronta) e `/lgpd-compliance-check` (consentimento). Durante: `/cria-copy-vendas-seo` + `/cria-card-institucional-premium` (criativos). Depois: `/estrutura-funil-leads-whatsapp` (lead não pode morrer na caixa de entrada). Agente: `analista-trafego-google-meta`.

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
