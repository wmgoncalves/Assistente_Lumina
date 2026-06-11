---
name: transforma-servico-em-produto-vendavel
description: Use esta skill para empacotar serviços/habilidades da DV Digital em produtos vendáveis — nome, promessa, escopo fechado, faixa de preço, como vender por WhatsApp e LP. Inclui modo escada de valor (entrada → diagnóstico → principal → premium → recorrência) e modo mini-consultoria.
---

# transforma-servico-em-produto-vendavel

## O que esta skill faz

Converte "o que eu sei fazer" em **oferta com nome, promessa, escopo e preço** — vendável sem reunião longa. Três modos:
- **Produto único**: empacotar um serviço específico.
- **Escada de valor**: organizar o portfólio em entrada → diagnóstico → oferta principal → premium → recorrência, com upsell/cross-sell naturais.
- **Mini-consultoria**: produto de diagnóstico rápido, alto valor percebido, porta de entrada.

## Quando usar

- Serviço entregue repetidamente que ainda se vende "sob medida" toda vez.
- Criar oferta de entrada (ticket menor) para abrir funil.
- Organizar o portfólio inteiro em escada (o que vender primeiro, o que vem depois).
- Ideia do `/gera-ideias-novas-servicos-dv` aprovada e pronta para virar oferta.

## Entradas necessárias

1. O serviço/habilidade base e 1–2 exemplos reais de entrega.
2. Tempo real de produção (horas/dias) — base do preço.
3. Público que mais compra isso (segmento, porte).
4. Faixas de preço praticadas até hoje (a skill estrutura faixa; o preço final é do usuário).
5. Capacidade: quantas unidades/mês a operação atual entrega.

## Processo obrigatório

1. **Definir a transformação**, não a tarefa: o cliente não compra "8 cards", compra "presença profissional no Instagram sem se preocupar".
2. **Estruturar o produto**: nome próprio (memorável, sem genérico) · para quem é (e para quem NÃO é) · dor que resolve · promessa principal honesta · entregáveis verificáveis · prazo padrão · o que NÃO está incluso · faixa de preço (com racional: tempo × valor percebido × mercado) · garantia honesta.
3. **Roteiro de venda por WhatsApp**: mensagem de oferta (3–5 linhas), resposta às 3 objeções mais prováveis, fechamento com próximo passo único.
4. **Esqueleto de LP** (se valer página): via `/ui-conversion-landing-page` + `/cria-copy-vendas-seo`.
5. **Modo escada**: posicionar cada produto num degrau; definir o próximo passo natural de cada um (quem compra diagnóstico → recebe oferta principal); marcar upsells/cross-sells; identificar degraus vazios.
6. **Modo mini-consultoria**: tema → o que o cliente recebe (relatório padrão + reunião de entrega) → duração fixa → checklist de produção → modelo de relatório → próximo serviço a oferecer depois (a mini-consultoria existe para revelar o problema que o serviço principal resolve).
7. **Validar viabilidade**: a operação entrega isso com qualidade no prazo prometido? Se não, reduzir escopo do produto, não a qualidade.
8. Classificar o resultado: mais fácil de vender agora · mais lucrativo · mais estratégico · melhor recorrência.

## Checklist de qualidade

- [ ] Promessa honesta e específica (sem "resultado garantido").
- [ ] Entregáveis verificáveis + exclusões explícitas (≥ 4).
- [ ] Faixa de preço com racional, não chute.
- [ ] Produto entregável pela operação real (1 pessoa) sem heroísmo.
- [ ] Próximo passo natural definido (nenhum produto é beco sem saída).
- [ ] Para quem NÃO é declarado (evita cliente errado).
- [ ] Mensagem de WhatsApp pronta para copiar e enviar.

## Erros comuns que esta skill deve evitar

- Produto com nome genérico ("Pacote Premium de Marketing").
- Promessa de resultado que depende de terceiros (ranking, ROAS).
- Empacotar sem limitar — produto vira serviço sob medida de novo no 2º cliente.
- Preço por hora disfarçado (produto se precifica por valor da transformação).
- Escada com degrau de entrada caro demais (mata o funil).
- Ignorar capacidade: vender 10/mês podendo entregar 3.

## Saída esperada

```text
PRODUTO: nome · para quem (e para quem não) · dor · promessa · entregáveis ·
prazo · exclusões · faixa de preço + racional · garantia
VENDA: mensagem WhatsApp · 3 objeções respondidas · próximo passo
LP: esqueleto de seções (se aplicável)
ESCADA (modo escada): degraus + fluxo de upsell + degraus vazios
CLASSIFICAÇÃO: fácil de vender · lucrativo · estratégico · recorrente
```

## Exemplo de uso

> "Transforma a auditoria de site em produto de entrada."

Saída: **Raio-X Digital** — diagnóstico de site+presença em 5 dias úteis, relatório com top 10 problemas priorizados + reunião de 40 min; para empresas com site que não gera contato; não inclui execução das correções; faixa R$ X–Y (racional: ~6h de produção via `/audita-site-conversao-seo-performance` padronizada); próximo passo natural: proposta de correção (`/cria-proposta-comercial-dv-digital`); mensagem de WhatsApp pronta.

---

## Conexão com o ecossistema

Ideias entram de `/gera-ideias-novas-servicos-dv`; produção do produto usa as skills correspondentes; venda registra no playbook do cliente. Proposta formal: `/cria-proposta-comercial-dv-digital`. Agentes: `pesquisador-novas-oportunidades` + `arquiteto-produtos-ia-clientes` (quando o produto envolve IA/automação).

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
