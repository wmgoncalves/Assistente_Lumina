---
name: gera-ideias-novas-servicos-dv
description: Use esta skill quando precisar identificar oportunidades novas para a DV Digital — serviços, pacotes, ofertas de entrada, automações, produtos e melhorias de processo — a partir dos clientes, projetos e aprendizados reais já registrados no vault.
---

# gera-ideias-novas-servicos-dv

## O que esta skill faz

Gera **ideias acionáveis de novos serviços e ofertas** ancoradas na operação real da DV Digital (não brainstorm genérico): lê o que existe no vault (clientes em `10-Projetos/`, memórias, playbooks, aprendizados), cruza com as capacidades já instaladas (skills técnicas, design, tráfego) e devolve oportunidades priorizadas por esforço × retorno, cada uma com próximo passo concreto.

## Quando usar

- Rotina mensal de evolução da DV Digital (junto do `curador-memoria`).
- Faturamento concentrado em poucos clientes — diversificar oferta.
- Após entregar um projeto que pode virar produto repetível.
- Capacidade ociosa ou vontade de criar oferta de entrada (ticket menor).
- Pedido explícito: "que mais dá pra vender / automatizar / empacotar?"

## Entradas necessárias

1. Acesso ao vault (clientes, playbooks, memórias, projetos arquivados).
2. Contexto atual: serviços que mais vendem, ticket médio, gargalos de tempo do usuário.
3. Restrições: o que o usuário NÃO quer fazer (nichos, modelos de cobrança, escala).
4. Opcional: tendências/observações de mercado trazidas pelo usuário.

## Processo obrigatório

1. **Ler a base real**: clientes ativos e seus segmentos, serviços recorrentes, problemas que se repetem entre clientes (cada problema repetido = candidato a produto).
2. **Cruzar com capacidades instaladas**: o que o ecossistema já sabe fazer bem (LP, auditoria, segurança, LGPD, tráfego, social, sistemas PHP/MySQL, SaaS) e que ainda não virou oferta empacotada.
3. **Gerar ideias em 4 categorias**:
   - **Oferta de entrada** (ticket baixo, porta de funil): ex. diagnóstico de presença digital, landing express.
   - **Pacote recorrente** (receita previsível): ex. social + tráfego + relatório mensal.
   - **Produto/automação** (vende sem hora do usuário): ex. dashboard simples, automação de WhatsApp, template premium.
   - **Upsell para base atual** (mais fácil de vender): por cliente, o que ele ainda não compra e precisaria.
4. **Priorizar** cada ideia: esforço (baixo/médio/alto) × retorno potencial × encaixe com a base atual. Matar ideias que exigem capacidade inexistente sem plano de aquisição.
5. **Próximo passo concreto** para o top 3 (ex.: "validar com cliente X na próxima reunião", "montar proposta-modelo com `/cria-proposta-comercial-dv-digital`").
6. **Registrar** as ideias aprovadas no vault (nota de oportunidades) via `curador-memoria` — ideia não registrada morre.

## Checklist de qualidade

- [ ] Cada ideia cita a evidência real que a sustenta (cliente, projeto, problema repetido).
- [ ] Cada ideia tem esforço, retorno estimado e encaixe declarados.
- [ ] Top 3 tem próximo passo executável em ≤ 1 semana.
- [ ] Nenhuma ideia depende de habilidade/ferramenta que não existe sem plano para obtê-la.
- [ ] Quantidade controlada: 5–10 ideias boas > 40 rasas.
- [ ] Upsell sugerido respeita o relacionamento e o momento do cliente.

## Erros comuns que esta skill deve evitar

- Brainstorm genérico de internet ("crie um curso!", "venda NFT!") sem ancoragem na base real.
- Ignorar o custo de oportunidade (toda ideia nova compete com o que já fatura).
- Sugerir escala que o modelo atual (1 pessoa) não suporta sem automação.
- Lista enorme sem priorização nem próximo passo.
- Repetir ideia já registrada e descartada anteriormente (consultar memórias antes).
- Transformar a sessão em promessa — ideias são hipóteses a validar com cliente real.

## Saída esperada

```text
1. LEITURA DA BASE (o que os clientes/projetos revelam)
2. IDEIAS POR CATEGORIA (entrada / recorrente / produto / upsell)
   — cada uma: descrição, evidência, esforço, retorno, encaixe
3. TOP 3 PRIORIZADO com próximo passo concreto
4. IDEIAS DESCARTADAS e por quê (para não voltar)
5. O QUE REGISTRAR no vault (nota de oportunidades)
```

## Exemplo de uso

> "Roda a rotina mensal de oportunidades."

Saída: leitura mostrando que 3 clientes de logística pedem cards avulsos → ideia priorizada de **pacote social media logística** (recorrente, esforço baixo com `/cria-card-institucional-premium` padronizada); diagnóstico-raio-x como oferta de entrada usando `/audita-site-conversao-seo-performance`; upsell de manutenção+segurança para clientes com site entregue; próximos passos com data.

---

## Conexão com o ecossistema

Roda com o agente `pesquisador-novas-oportunidades` e registra via `curador-memoria`. Ideia aprovada vira: proposta (`/cria-proposta-comercial-dv-digital`), pacote com playbook (`/cria-playbook-cliente-recorrente`) ou projeto (`/technical-governance-overview` se envolver sistema).

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
