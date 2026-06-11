---
name: previne-falhas-antes-entrega
description: Use esta skill para rodar um premortem antes de publicar ou entregar — assumir que o projeto DEU ERRADO e descobrir por quê, antes que aconteça. Cobre rejeição do cliente, confusão do usuário, não-conversão, mobile, retrabalho, problema técnico, segurança e comercial. Gera checklist de prevenção.
---

# previne-falhas-antes-entrega

## O que esta skill faz

Inverte a pergunta: em vez de "está bom?", pergunta **"isso falhou — por quê?"**. O premortem força enxergar riscos que a revisão normal não pega, porque parte do fracasso como fato e trabalha de trás para frente. Produz lista de causas prováveis de falha + checklist de prevenção acionável.

## Quando usar

- Antes de publicar site, LP ou campanha (especialmente com verba de mídia).
- Antes de entregar projeto grande ou primeira entrega para cliente novo.
- Antes de apresentar proposta importante.
- Em projeto que "parece pronto" — exatamente quando a confiança está alta.

## Entradas necessárias

1. O projeto/entrega e seu objetivo.
2. Quem é o cliente e o que ele valoriza (playbook).
3. Quem é o usuário final e em que contexto usa (celular, pressa).
4. Histórico: o que já deu errado em projetos parecidos (memórias do vault).

## Processo obrigatório

Assumir: *"foi entregue/publicado e deu errado"*. Gerar as causas mais prováveis em cada frente:

1. **Cliente não gostou** — expectativa desalinhada? estilo rejeitado antes? faltou o que ele pediu explicitamente?
2. **Usuário não entendeu** — promessa vaga? jargão? ordem das informações errada?
3. **Não converteu** — fricção no formulário? CTA fraco? prova ausente? público errado?
4. **Pareceu amador** — inconsistência visual? texto com erro? detalhe de acabamento?
5. **Quebrou no mobile** — testado em tela pequena real? formulário usável com polegar?
6. **Gerou retrabalho** — escopo ambíguo? aprovação pulada? placeholder esquecido?
7. **Problema técnico** — formulário não envia? e-mail cai em spam (`/hostgator-titan-email-sending`)? link quebrado? lentidão?
8. **Problema de segurança** — validação só no front? arquivo exposto? (rotear para `/pre-deploy-security-review` se for publicação)
9. **Problema comercial** — preço mal justificado? promessa que não se sustenta? cliente esperando manutenção não combinada?
10. Para cada causa plausível: **probabilidade (alta/média/baixa) + prevenção concreta**.

Fechar com **checklist de prevenção** ordenado: o que verificar/corrigir ANTES da entrega, começando pelas causas de probabilidade alta e custo de prevenção baixo.

## Checklist de qualidade

- [ ] Causas específicas deste projeto (não lista genérica reaproveitada).
- [ ] Cada causa tem prevenção executável, não "tomar cuidado".
- [ ] Histórico do cliente consultado (rejeições anteriores = probabilidade alta).
- [ ] Frentes técnicas roteadas para as skills certas quando profundas.
- [ ] Checklist final cabe na realidade do prazo (se tudo é crítico, nada é).

## Erros comuns que esta skill deve evitar

- Alarmismo: 40 riscos sem probabilidade nem priorização.
- Genericidade: os mesmos riscos para qualquer projeto.
- Ignorar o risco nº 1 da prática: **escopo/expectativa desalinhados com o cliente**.
- Parar no diagnóstico sem checklist de prevenção.
- Substituir as revisões formais (premortem complementa, não substitui).

## Saída esperada

```text
PREMORTEM: "deu errado porque…"
— causas por frente (cliente/usuário/conversão/visual/mobile/retrabalho/técnico/segurança/comercial)
— probabilidade + prevenção de cada uma
CHECKLIST DE PREVENÇÃO (ordenado, executável antes da entrega)
RISCOS ACEITOS conscientemente (com justificativa)
```

## Exemplo de uso

> "Premortem da LP + campanha da Blue antes de ligar o tráfego."

Saída: causas alta probabilidade — lead chega e ninguém responde em 15 min (prevenção: funil `/estrutura-funil-leads-whatsapp` ativo ANTES da campanha); formulário sem teste de envio real; promessa da LP diferente do anúncio (message match). Checklist de 8 itens pré-lançamento, 2 riscos aceitos documentados.

---

## Conexão com o ecossistema

Antes da entrega: esta skill (prospectiva) → `/revisa-entrega-final-360` (estado atual) → para sites: `/product-readiness-checklist` + `/pre-deploy-security-review`. Agente: `guardiao-qualidade-entrega-final`.

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
