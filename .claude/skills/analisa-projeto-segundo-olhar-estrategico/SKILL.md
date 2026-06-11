---
name: analisa-projeto-segundo-olhar-estrategico
description: Use esta skill quando algo já estiver criado (site, LP, card, campanha, proposta, sistema) e você quiser um segundo olhar crítico e estratégico antes de entregar — o que preservar, o que está genérico, o que falta para parecer trabalho de agência grande e quais ajustes rendem mais com menos esforço.
---

# analisa-projeto-segundo-olhar-estrategico

## O que esta skill faz

Aplica o **olhar de consultor sênior** (marketing, design, conversão, produto, comportamento do usuário) sobre um trabalho já criado. Não é revisão de checklist (isso é `/revisa-entrega-final-360`) nem auditoria de página com métricas (isso é `/audita-site-conversao-seo-performance`): é leitura **estratégica** — maturidade, diferenciação, percepção de valor, pontos cegos.

## Quando usar

- Primeira versão pronta de qualquer entrega importante, antes de refinar.
- Trabalho "correto, mas sem força" — você sente que falta algo e não sabe o quê.
- Antes de apresentar direção de projeto ao cliente.
- Reavaliação de projeto antigo que vai ganhar nova fase.

## Entradas necessárias

1. O material ou a direção do projeto (texto, estrutura, conceito, link, descrição).
2. Objetivo comercial da peça e público.
3. Contexto do cliente (playbook em `10-Projetos/<cliente>/` quando existir).
4. O que já foi decidido e não está em discussão (para não re-litigar).

## Processo obrigatório

Responder, nesta ordem, com franqueza e sem elogio vazio:

1. **O que está bom e deve ser preservado** (Regra 00 vale para estratégia também — não destruir o que funciona).
2. **O que está comum, genérico ou fraco** — onde isso se pareceria com qualquer concorrente.
3. **O que falta para parecer premium** (respiro, consistência, especificidade, acabamento).
4. **O que destravaria mais conversão** (clareza de promessa, prova, fricção).
5. **O que aumentaria confiança** (transparência, credenciais reais, sinais de cuidado).
6. **O que reduziria dúvidas do cliente final** (objeções não respondidas).
7. **O que falta para parecer agência grande** (sistema visual, narrativa, detalhes).
8. **Pontos cegos prováveis** — o que ninguém envolvido está enxergando (suposições não testadas, público errado, momento errado).
9. **Pareto dos ajustes**: os 20% de mudanças que geram 80% da diferença.
10. **Direção geral melhorada** em um parágrafo — para onde o projeto deveria apontar.

## Checklist de qualidade

- [ ] Nenhum elogio vazio; críticas com evidência e caminho de correção.
- [ ] Item 1 (preservar) preenchido antes das críticas.
- [ ] Pontos cegos são hipóteses plausíveis, marcadas como hipóteses.
- [ ] Ajustes priorizados por esforço × impacto.
- [ ] Nada inviável para a operação real (1 pessoa, prazo, orçamento).
- [ ] Direção final preserva identidade do cliente e hierarquia global (segurança > LGPD > acessibilidade > ... > estética).

## Erros comuns que esta skill deve evitar

- Virar lista de defeitos sem priorização (paralisa).
- Sugerir reescrever do zero quando ajustes resolvem.
- Inventar complexidade para parecer profundo.
- Criticar estética ignorando objetivo comercial.
- Ignorar restrições reais do projeto (verba, prazo, material disponível).

## Saída esperada

```text
1. PRESERVAR (o que está bom)
2. DIAGNÓSTICO (genérico/fraco · premium · conversão · confiança · objeções · nível agência)
3. PONTOS CEGOS (hipóteses)
4. TOP AJUSTES (Pareto, em ordem)
5. DIREÇÃO MELHORADA (1 parágrafo)
```

## Exemplo de uso

> "Segundo olhar na LP da Evolution antes de eu refinar."

Saída: preservar estrutura de seções e prova social; fraco = headline genérica de mentoria e excesso de seções "sobre nós"; premium = falta sistema tipográfico consistente; ponto cego = página fala com iniciante mas o tráfego vem de público avançado; top ajuste = reescrever promessa para o público real (1h de trabalho, maior impacto).

---

## Conexão com o ecossistema

Antes de refinar: esta skill. Antes de enviar: `/revisa-entrega-final-360`. Página com métricas: `/audita-site-conversao-seo-performance`. Visual: `/melhora-direcao-arte-premium`. Agente: `provocador-criativo-dv-digital`.

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
