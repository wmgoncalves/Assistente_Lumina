---
name: identifica-oportunidades-ia-clientes
description: Use esta skill para descobrir oportunidades práticas de IA, automação, formulários inteligentes, dashboards e WhatsApp no negócio DE UM CLIENTE — com dificuldade, impacto, faixa de preço e como apresentar. Diferente de gera-ideias-novas-servicos-dv (que olha para a DV); esta olha para o negócio do cliente.
---

# identifica-oportunidades-ia-clientes

## O que esta skill faz

Analisa o negócio de um cliente (atual ou prospect) e mapeia **onde IA e automação resolvem problema real**: tarefas manuais repetitivas, atendimento, captação, relatórios, organização de dados. Cada oportunidade sai com dificuldade, impacto, faixa de preço e roteiro de apresentação — pronta para virar proposta ou produto da DV Digital.

## Quando usar

- Reunião marcada com cliente e você quer chegar com oportunidades concretas.
- Cliente perguntou "dá pra usar IA no meu negócio?".
- Upsell para cliente que já tem site/social com a DV.
- Construir o portfólio de produtos de automação da DV (par com `/transforma-servico-em-produto-vendavel`).

## Entradas necessárias

1. Quem é o cliente: segmento, porte, como vende, como atende.
2. Processos conhecidos (do playbook, de conversas): onde gasta tempo manual?
3. Ferramentas que já usa (planilha, WhatsApp, sistema, nada).
4. Maturidade digital (define por onde começar — quem não tem formulário não começa por agente de IA).

## Processo obrigatório

1. **Mapear os pontos de dor automatizáveis** por categoria:
   - **Atendimento**: perguntas repetidas no WhatsApp, orçamento padrão, agendamento, follow-up esquecido.
   - **Captação**: formulário burro → formulário inteligente (qualifica e roteia), lead sem resposta rápida.
   - **Operação**: planilha manual, retrabalho de digitação, status que ninguém sabe, relatório montado à mão.
   - **Conteúdo**: pauta, variações de post, descrição de produto (sempre com revisão humana).
   - **Gestão**: dono sem visão do número (dashboard simples resolve mais que IA sofisticada).
2. Para cada oportunidade: **dificuldade** (baixa = formulário/planilha/automação simples; média = dashboard/integração WhatsApp; alta = sistema/agente IA) · **impacto** (horas economizadas ou leads recuperados) · **faixa de preço** + possível mensalidade · **pré-requisitos**.
3. **Regras de responsabilidade** (inegociáveis):
   - Dados pessoais de clientes do cliente → `/lgpd-compliance-check` antes de qualquer envio a LLM; PII desnecessária NUNCA vai para IA.
   - IA não decide autorização nem responde sozinha em tema sensível (saúde, jurídico, financeiro) — revisão humana.
   - Disclosure de IA visível quando o cliente final conversa com bot.
   - Automação de WhatsApp respeita opt-out e termos da plataforma (sem disparo em massa para quem não pediu).
4. **Priorizar**: começar pela oportunidade de menor dificuldade × maior impacto (ganho rápido gera confiança para vender as maiores).
5. **Roteiro de apresentação**: explicar pelo problema ("você perde X respondendo isso 20× por dia"), não pela tecnologia; mostrar 1 exemplo concreto; propor piloto pequeno.
6. Marcar quais oportunidades podem virar **produto repetível da DV** (mesma dor em vários clientes → `/transforma-servico-em-produto-vendavel`).

## Checklist de qualidade

- [ ] Toda oportunidade ancorada em dor real observada/relatada (não "IA porque sim").
- [ ] Dificuldade, impacto, faixa de preço e pré-requisitos em todas.
- [ ] LGPD e revisão humana tratados explicitamente nas que envolvem dados/atendimento.
- [ ] Primeira recomendação é executável em ≤ 2 semanas (piloto).
- [ ] Stack proposta compatível com a realidade (PHP/MySQL/HostGator quando for o caso; sem K8s para padaria).
- [ ] Apresentação fala problema → solução → resultado, sem jargão.

## Erros comuns que esta skill deve evitar

- Vender IA onde uma planilha bem feita resolve.
- Propor agente autônomo respondendo cliente final sem revisão/disclosure.
- Ignorar o custo recorrente de API na precificação da mensalidade.
- Prometer "a IA faz tudo" — automação boa tem fronteira humana clara.
- Mandar dados de clientes do cliente para LLM sem base legal e minimização.
- Começar pelo projeto grande em cliente de baixa maturidade digital.

## Saída esperada

```text
1. MAPA DE OPORTUNIDADES por categoria (atendimento/captação/operação/conteúdo/gestão)
   — cada uma: dor → solução → dificuldade → impacto → faixa de preço → pré-requisitos
2. TOP 3 priorizado (começando pelo piloto rápido)
3. GUARDAS: LGPD, revisão humana, disclosure, opt-out
4. ROTEIRO DE APRESENTAÇÃO ao cliente
5. CANDIDATAS A PRODUTO DV (dores repetidas entre clientes)
```

## Exemplo de uso

> "O que dá pra automatizar pra barbearia do AtendaPro Barber?"

Saída: lembrete automático de horário via WhatsApp (dificuldade baixa, reduz no-show, mensalidade pequena); formulário inteligente de agendamento que qualifica serviço; dashboard de ocupação por barbeiro; resposta automática fora de horário com agenda; guarda: opt-out nos lembretes, sem IA decidindo cancelamento; candidata a produto DV: pacote anti-no-show para negócios de agenda.

---

## Conexão com o ecossistema

Para a DV: `/gera-ideias-novas-servicos-dv`. Empacotar: `/transforma-servico-em-produto-vendavel`. Construção técnica: `engenheiro-dados-ia` + `/ai-prompt-injection-defense` + `/mcp-and-agent-sdk-safety`. Dados: `/lgpd-compliance-check`. Agente: `arquiteto-produtos-ia-clientes`.

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
