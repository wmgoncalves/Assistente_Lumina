---
name: revisa-entrega-final-360
description: Use esta skill como última revisão antes de enviar qualquer entrega ao cliente ou publicar — card, copy, proposta, post, vídeo, página. Dá nota 0–10, lista o que impede a nota 10, separa correções obrigatórias de melhorias e gera a mensagem de apresentação ao cliente. Para site/sistema completo, roteia para product-readiness-checklist.
---

# revisa-entrega-final-360

## O que esta skill faz

É o **portão final de qualidade** da DV Digital: revisa a entrega em 13 dimensões (clareza, profissionalismo, design, copy, conversão, mobile, segurança, performance, SEO, LGPD, escopo, risco de retrabalho, impressão geral), dá **nota 0–10** com justificativa e separa o que é **obrigatório corrigir** do que é recomendável/opcional. Se aprovada, entrega a mensagem pronta para apresentar ao cliente.

## Quando usar

- Antes de enviar QUALQUER material ao cliente (card, proposta, copy, post, roteiro, relatório).
- Antes de publicar peça avulsa (anúncio, página simples).
- **Site/sistema/plataforma completos**: usar `/product-readiness-checklist` + `/pre-deploy-security-review` como revisão principal — esta skill entra só na camada de percepção/apresentação.

## Entradas necessárias

1. A entrega final (ou descrição fiel dela).
2. O que foi combinado com o cliente (escopo/proposta — para checar aderência).
3. Canal de publicação/envio.
4. Playbook do cliente (tom, erros a evitar, aprovações passadas).

## Processo obrigatório

1. **Checar contra o escopo combinado** primeiro: a entrega corresponde ao que foi vendido? Algo prometido faltando = correção obrigatória automática.
2. Revisar as 13 dimensões aplicáveis (pular as que não se aplicam, declarando):
   clareza · profissionalismo · design (hierarquia, identidade, acabamento) · copy (promessa, erros de português) · conversão (CTA, fricção) · mobile · segurança · performance · SEO · LGPD (consentimento, política, dados expostos) · escopo · risco de retrabalho · impressão geral de primeira vez.
3. Para dimensões técnicas profundas, delegar: segurança → `/pre-deploy-security-review`; acessibilidade → `/accessibility-wcag-audit`; vitals → `/performance-web-vitals`.
4. **Nota 0–10** + o que exatamente impede a nota 10.
5. Separar em três listas: **obrigatórias** (bloqueiam envio) / **recomendadas** / **opcionais**.
6. Se aprovado (sem obrigatórias): escrever a **mensagem de apresentação ao cliente** — o que está sendo entregue, decisões principais, o que ele precisa validar, próximo passo.
7. Registrar rejeições/aprendizados no playbook do cliente.

## Checklist de qualidade

- [ ] Escopo combinado conferido item a item.
- [ ] Nota justificada (não nota de cortesia).
- [ ] Obrigatórias são realmente bloqueantes (não preferência estética).
- [ ] Nenhum dado inventado ou placeholder esquecido (`[A CONFIRMAR]`, lorem ipsum, dados de outro cliente).
- [ ] Mensagem ao cliente em PT-BR claro, sem jargão, com próximo passo único.
- [ ] Dimensões puladas declaradas explicitamente.

## Erros comuns que esta skill deve evitar

- Aprovar por pressa com "obrigatórias" rebaixadas para "recomendadas".
- Nota inflada para agradar.
- Revisar estética e esquecer escopo (a maior fonte de retrabalho).
- Substituir as revisões técnicas profundas (não substitui product-readiness nem pre-deploy).
- Deixar passar resquício de template (nome de outro cliente, valores antigos).

## Saída esperada

```text
NOTA: X/10 — justificativa
O QUE IMPEDE O 10: lista objetiva
CORREÇÕES OBRIGATÓRIAS (bloqueiam envio)
MELHORIAS RECOMENDADAS
MELHORIAS OPCIONAIS
ADERÊNCIA AO ESCOPO: ok / desvios
MENSAGEM PRONTA PARA O CLIENTE (se aprovado)
REGISTRAR NO PLAYBOOK: aprendizados
```

## Exemplo de uso

> "Revisa o pacote de 8 cards da Translíquidos antes de eu mandar."

Saída: nota 7/10 — obrigatórias: card 3 usa azul fora da paleta oficial, card 6 com texto cortado no formato story; recomendadas: CTA repetido em 5 cards, variar; aderência: escopo era 8 cards + 2 stories — faltam os stories; mensagem ao cliente pronta para depois das correções.

---

## Conexão com o ecossistema

Portão final para entregas comerciais. Pares: `/previne-falhas-antes-entrega` (antes, premortem) · `/product-readiness-checklist` + `/pre-deploy-security-review` (site/sistema) · `/ui-final-design-review` (UI). Agente: `guardiao-qualidade-entrega-final`.

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
