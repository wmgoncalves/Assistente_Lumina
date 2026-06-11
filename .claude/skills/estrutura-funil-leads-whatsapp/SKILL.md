---
name: estrutura-funil-leads-whatsapp
description: Use esta skill quando precisar estruturar funil comercial de captação e atendimento de leads via WhatsApp — etapas, mensagens, qualificação, etiquetas/status, follow-up, integração com formulário/CRM e consentimento LGPD.
---

# estrutura-funil-leads-whatsapp

## O que esta skill faz

Desenha o **funil comercial completo do lead**: da captação (LP, anúncio, formulário) até o fechamento e pós-venda, com mensagens prontas de WhatsApp por etapa, critérios de qualificação, sistema de etiquetas/status, cadência de follow-up e regras de não-abandono. Garante que lead gerado por tráfego pago vire conversa e conversa vire venda.

## Quando usar

- Cliente recebe leads mas "não dá conta" ou perde no WhatsApp.
- Nova campanha de captação entrando no ar (funil precisa existir ANTES).
- Padronizar atendimento comercial de cliente recorrente.
- Estruturar esteira de follow-up para leads que não responderam.
- Definir o fluxo formulário → WhatsApp → CRM de um projeto.

## Entradas necessárias

1. **Origem dos leads** (LP, anúncio, Instagram, indicação) e volume estimado/dia.
2. **Quem atende** (dono, equipe, quantas pessoas, horário).
3. **Processo de venda atual** (orçamento? agendamento? proposta? prazo de decisão típico).
4. **Critérios de lead bom** vs desqualificado (região, porte, orçamento mínimo).
5. **Ferramentas**: WhatsApp Business simples ou API? CRM existente ou planilha?
6. **Tom do cliente** (playbook em `10-Projetos/<cliente>/`).

## Processo obrigatório

1. **Mapear as etapas** (adaptar ao negócio):

```text
NOVO → PRIMEIRO CONTATO → QUALIFICADO → PROPOSTA/ORÇAMENTO →
NEGOCIAÇÃO → FECHADO ✔ | PERDIDO ✘ | FUTURO (re-contato agendado)
```

2. **Definir SLA de resposta**: lead de anúncio esfria em minutos — meta de primeira resposta ≤ 15 min em horário comercial; mensagem automática de boas-vindas fora do horário.
3. **Escrever as mensagens por etapa**: boas-vindas (confirma origem e nome), 3–5 perguntas de qualificação (uma por vez, não interrogatório), apresentação de proposta, contorno das 3 objeções mais comuns, fechamento, pedido de avaliação no pós.
4. **Follow-up com cadência definida**: sem resposta → D+1, D+3, D+7 (mensagens diferentes, com motivo novo, sem insistência vazia); depois mover para FUTURO com data de re-contato.
5. **Etiquetas/status no WhatsApp Business ou CRM** espelhando as etapas do funil + origem (ex.: `[google]`, `[meta]`, `[indicacao]`) para medir canal.
6. **LGPD**: lead consentiu contato no formulário (`/lgpd-compliance-check`); opt-out respeitado imediatamente ("não quero mais receber" → marcar e parar); sem compra de listas; sem disparo em massa para quem não pediu.
7. **Métricas do funil**: taxa por etapa (novo→qualificado→proposta→fechado), tempo médio de resposta, motivo de perda — revisar mensalmente.

## Checklist de qualidade

- [ ] Toda etapa tem: objetivo, mensagem modelo, critério de avanço e responsável.
- [ ] SLA de primeira resposta definido e viável para a equipe real.
- [ ] Follow-up tem fim (não perseguir lead para sempre).
- [ ] Mensagens soam humanas e no tom do cliente — não robóticas.
- [ ] Etiquetas/status simples o bastante para serem usadas de verdade (≤ 8).
- [ ] Origem do lead rastreável (UTM/etiqueta) para medir canal.
- [ ] Consentimento e opt-out tratados.
- [ ] Motivos de perda padronizados (preço, prazo, sumiu, fora do perfil).

## Erros comuns que esta skill deve evitar

- Funil bonito no papel que a equipe de 1 pessoa não consegue operar.
- Primeira mensagem pedindo dados demais (lead some).
- Follow-up idêntico repetido ("oi, conseguiu ver?" ×5).
- Disparo em massa sem consentimento (risco de bloqueio do número + LGPD).
- Não registrar motivo de perda (impossível melhorar oferta depois).
- Misturar WhatsApp pessoal com comercial.
- Automatizar tudo e perder o tom humano em negócio local.

## Saída esperada

```text
1. MAPA DO FUNIL (etapas, critérios de avanço, responsáveis, SLA)
2. KIT DE MENSAGENS por etapa (boas-vindas, qualificação, proposta,
   objeções, fechamento, follow-up D+1/D+3/D+7, pós-venda)
3. SISTEMA DE ETIQUETAS/STATUS (WhatsApp Business ou CRM)
4. REGRAS LGPD (consentimento, opt-out, retenção)
5. PAINEL DE MÉTRICAS (o que medir e onde anotar)
```

## Exemplo de uso

> "A 365 Logística recebe leads do site e perde metade sem resposta."

Saída: funil de 6 etapas, mensagem automática fora de horário, kit de qualificação (tipo de carga, rota, frequência), follow-up D+1/D+3/D+7, etiquetas `novo/qualificado/proposta/fechado/perdido/futuro` + origem, meta de resposta 15 min, planilha simples de motivos de perda.

---

## Conexão com o ecossistema

Recebe leads de `/ui-conversion-landing-page` e `/planeja-campanha-google-meta`. Formulário → WhatsApp: regras técnicas em `/ui-conversion-landing-page` §13–14. Consentimento: `/lgpd-compliance-check`. Integração com API oficial do WhatsApp: `/external-api-integration-safety`. Agente: `estrategista-conversao-digital`.

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
