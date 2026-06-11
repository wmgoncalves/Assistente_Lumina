---
name: cria-briefing-inteligente-projeto
description: Use esta skill quando um projeto novo chegar (site, LP, social, tráfego, sistema) e você precisar de um briefing que descubra o que realmente importa — incluindo o que o cliente não pediu mas precisa. Gera versão curta para WhatsApp e versão completa para formulário.
---

# cria-briefing-inteligente-projeto

## O que esta skill faz

Gera o **questionário de briefing certo para o tipo de projeto**, desenhado para extrair o que o cliente não diz espontaneamente: objetivo comercial real, objeções do público, concorrentes, conteúdo disponível, restrições técnicas e critérios de aprovação. Entrega em dois formatos: **curto** (WhatsApp, 8–12 perguntas) e **completo** (formulário estruturado).

## Quando usar

- Cliente novo fechou (ou está fechando) um projeto.
- Pedido vago chegou ("quero um site") e falta base para orçar — par com o `detetive-escopo-e-retrabalho`.
- Padronizar briefing de um serviço recorrente (todo projeto de LP usa o mesmo).
- Antes de reunião de kickoff.

## Entradas necessárias

1. Tipo de projeto (site, LP, social media, tráfego, sistema, identidade…).
2. O que já se sabe do cliente (não perguntar o que já foi respondido).
3. Canal de coleta (WhatsApp, formulário, reunião).
4. O que a entrega vai precisar tecnicamente (fotos? acessos? textos? domínio?).

## Processo obrigatório

1. Montar perguntas nas **15 áreas**, filtrando pelas relevantes ao tipo de projeto:
   negócio (o que vende, como ganha dinheiro) · público (quem decide, contexto) · oferta (o que promover primeiro) · concorrentes (2–3 com link) · diferenciais REAIS · objeções comuns dos clientes deles · tom de voz (com exemplo do que gosta/odeia) · identidade visual (logo em vetor? manual?) · conteúdo disponível (fotos, textos, depoimentos autorizados) · objetivo comercial mensurável · WhatsApp e atendimento (quem responde, em quanto tempo) · métrica de sucesso (como saberemos que deu certo) · restrições técnicas (hospedagem, domínio, sistemas atuais, acessos) · prazo e datas-limite reais · aprovação (quem aprova, em quanto tempo, quantas pessoas).
2. **Perguntas-reveladoras** (descobrem o que o cliente não pediu): "o que mais te faz perder cliente hoje?", "o que você tentou antes e não funcionou?", "o que não pode acontecer de jeito nenhum?", "depois que entregarmos, quem vai manter?".
3. Formular cada pergunta para leigo: uma coisa por pergunta, sem jargão, com exemplo quando ajudar.
4. **Versão WhatsApp**: 8–12 perguntas essenciais, numeradas, respondíveis por áudio.
5. **Versão completa**: agrupada por seção, com campos de anexo (logo, fotos, acessos — acessos NUNCA por texto aberto; orientar canal seguro).
6. Mapear cada resposta esperada para a decisão que ela alimenta (se não alimenta decisão, cortar a pergunta).

## Checklist de qualidade

- [ ] Nenhuma pergunta cuja resposta já se sabe ou não muda nada.
- [ ] Perguntas-reveladoras incluídas (mínimo 3).
- [ ] Critério de aprovação e responsável perguntados (maior causa de retrabalho).
- [ ] Conteúdo disponível e prazos do CLIENTE perguntados (dependências da proposta).
- [ ] Versão WhatsApp respondível em ≤ 10 minutos.
- [ ] Pedido de credenciais orienta canal seguro (nunca senha em chat aberto).

## Erros comuns que esta skill deve evitar

- Briefing-formulário-de-50-perguntas que o cliente abandona.
- Perguntar preferência estética demais e objetivo comercial de menos.
- Não perguntar sobre concorrentes e objeções (de onde sai a diferenciação).
- Esquecer restrições técnicas e descobrir na entrega que a hospedagem não suporta.
- Aceitar "quero algo bonito e moderno" como resposta final — sempre pedir exemplo concreto.

## Saída esperada

```text
1. BRIEFING WHATSAPP (8–12 perguntas numeradas, linguagem falada)
2. BRIEFING COMPLETO (por seção, com anexos e instrução de acesso seguro)
3. MAPA pergunta → decisão que alimenta
4. SINAIS DE ALERTA a observar nas respostas (escopo nebuloso, prazo irreal, aprovador ausente)
```

## Exemplo de uso

> "Briefing para a LP da clínica nova."

Saída: WhatsApp com 10 perguntas (serviço principal, público, o que faz perder paciente hoje, diferenciais, concorrente referência, depoimentos autorizados?, fotos reais?, quem responde o WhatsApp, meta de agendamentos, quem aprova); completo com seções + anexos; alerta: se não houver fotos reais nem depoimentos, prever no orçamento banco de imagem e prova alternativa.

---

## Conexão com o ecossistema

Alimenta `/cria-proposta-comercial-dv-digital` (escopo) e `/requirements-analysis` (sistemas). Respostas viram playbook (`/cria-playbook-cliente-recorrente`). Agente: `detetive-escopo-e-retrabalho`.

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
