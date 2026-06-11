---
name: cria-proposta-comercial-dv-digital
description: Use esta skill quando precisar montar proposta comercial ou orçamento da DV Digital — escopo, entregáveis, limites, rodadas de alteração, prazos, condições, exclusões e garantias, em linguagem comercial clara que protege as duas partes.
---

# cria-proposta-comercial-dv-digital

## O que esta skill faz

Monta **propostas comerciais fechadas e defensáveis**: o que será entregue (e o que NÃO será), em quanto tempo, por quanto, com quantas rodadas de ajuste, com quais dependências do cliente e com quais condições. Evita o escopo infinito ("só mais um ajustezinho") e a proposta vaga que gera conflito na entrega.

## Quando usar

- Orçamento de site, landing page, sistema, identidade de social media, tráfego pago ou pacote recorrente.
- Formalizar serviço para cliente novo ou expansão de escopo de cliente atual.
- Revisar proposta existente que está gerando retrabalho não pago.
- Criar modelo de proposta para um novo serviço da DV Digital.

## Entradas necessárias

1. **Serviço(s)** e resultado esperado pelo cliente.
2. **Diagnóstico prévio** (o que existe hoje: site atual, contas de anúncio, materiais).
3. **Preço e forma de cobrança** (fechado, mensal recorrente, entrada + parcelas) — definidos pelo usuário; a skill estrutura, não inventa preço.
4. **Prazo realista** considerando dependências do cliente (conteúdo, acessos, aprovações).
5. **Limites desejados**: nº de páginas/artes/campanhas, rodadas de alteração, canais incluídos.

## Processo obrigatório

1. **Abrir com o problema e o resultado**, não com a lista técnica: 2–3 linhas conectando a dor do cliente ao que a proposta resolve.
2. **Escopo em entregáveis verificáveis**: "Landing page de 1 página com formulário integrado ao WhatsApp" (verificável) — nunca "melhorias no site" (infinito).
3. **Seção de limites e exclusões explícita**: o que NÃO está incluído (ex.: redação de conteúdo institucional, fotografia, verba de mídia, hospedagem, alterações estruturais após aprovação).
4. **Rodadas de alteração**: número definido (padrão: 2 rodadas por entregável); o que conta como rodada; alteração fora do escopo = orçamento adicional.
5. **Dependências do cliente com efeito no prazo**: materiais, acessos, aprovações — atraso do cliente desloca o cronograma na mesma proporção.
6. **Condições**: validade da proposta (ex.: 15 dias), forma de pagamento, início após confirmação, política de cancelamento de recorrência (aviso prévio de 30 dias).
7. **Garantias honestas**: o que a DV Digital garante (entrega conforme escopo, correção de defeito) e o que não pode garantir (posição no Google, número de vendas) — nunca prometer resultado de plataforma de terceiro.
8. **Fechamento com próximo passo único**: como aceitar e o que acontece em seguida.

## Checklist de qualidade

- [ ] Todo entregável é verificável (dá para apontar "está entregue / não está").
- [ ] Exclusões explícitas — pelo menos 4 itens "não incluído".
- [ ] Rodadas de alteração com número e definição.
- [ ] Prazo condicionado às dependências do cliente, por escrito.
- [ ] Validade da proposta definida.
- [ ] Nenhuma promessa de resultado que não depende só da DV (ranking, ROAS, vendas).
- [ ] Valores e condições de pagamento sem ambiguidade.
- [ ] Linguagem comercial clara — sem juridiquês, sem gírias.
- [ ] Dados do cliente corretos (nunca inventados; placeholders se faltarem).

## Erros comuns que esta skill deve evitar

- Escopo aberto ("ajustes em geral", "suporte", "melhorias contínuas" sem definição).
- Esquecer exclusões → cliente assume que tudo está incluído.
- Prazo sem condicionar às entregas do cliente.
- Prometer resultado de tráfego/SEO como garantia.
- Proposta-romance de 15 páginas que ninguém lê — máximo 3–5 páginas.
- Copiar proposta de outro cliente e esquecer nome/valores antigos no texto.
- Não definir o que acontece com alterações após aprovação.

## Saída esperada

```text
PROPOSTA ESTRUTURADA:
1. Contexto e objetivo (problema → resultado)
2. Escopo e entregáveis (lista verificável)
3. O que não está incluído
4. Prazos e dependências do cliente
5. Rodadas de alteração
6. Investimento e condições de pagamento
7. Garantias e limites de responsabilidade
8. Validade e próximo passo
```

Formato final: Markdown pronto para virar PDF (`/document-generation` ou plugin oficial de documentos).

## Modo Revisão — antes de enviar (adicionado em 2026-06-10)

Quando a proposta **já existe** e vai ser enviada, rodar este modo em vez de recriar:

1. **Clareza do escopo**: um leigo sabe exatamente o que vai receber? Algum item aberto ("ajustes em geral") que vire retrabalho?
2. **Valor percebido**: a proposta justifica o preço pelo resultado, ou parece lista de tarefas? Parece barata demais (desvaloriza) ou cara sem justificativa?
3. **Riscos de interpretação errada**: o que o cliente pode ENTENDER que está incluso e não está? Adicionar à seção de exclusões.
4. **Observações obrigatórias presentes?** Rodadas, dependências do cliente, validade, condição de pagamento, política de cancelamento.
5. **Resíduos de template**: nome/valores de outro cliente, placeholders esquecidos.
6. **Versão curta para WhatsApp**: resumo em 4–6 linhas (o quê, prazo, investimento, próximo passo) para acompanhar o PDF.
7. **Upsell natural**: 1 item complementar a oferecer (sem empurrar) — ex.: manutenção mensal junto do site.

Saída do modo revisão: problemas encontrados → proposta revisada → versão WhatsApp → sugestão de upsell.

## Exemplo de uso

> "Proposta de landing page + tráfego para clínica de fisioterapia."

Saída: proposta com 2 blocos (LP: escopo fechado, 2 rodadas, prazo 15 dias úteis após recebimento de materiais; tráfego: gestão mensal, verba de mídia paga pelo cliente diretamente à plataforma, sem garantia de nº de agendamentos, aviso prévio 30 dias), exclusões (fotos profissionais, vídeo, conteúdo de blog), validade 15 dias.

---

## Conexão com o ecossistema

Escopo técnico alimentado por `/requirements-analysis` e `/audita-site-conversao-seo-performance` (diagnóstico que vira proposta). Copy do texto: `/cria-copy-vendas-seo`. Geração de PDF: `/document-generation`. Registro da proposta aceita: playbook do cliente (`/cria-playbook-cliente-recorrente`).

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
