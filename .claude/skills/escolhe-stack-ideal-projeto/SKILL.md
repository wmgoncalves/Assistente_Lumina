---
name: escolhe-stack-ideal-projeto
description: Use esta skill ANTES de começar projeto novo para decidir a stack — PHP/MySQL simples, Laravel, WordPress, Next.js/React, Node, Supabase/Firebase ou híbrida — por critérios reais (orçamento, hospedagem, manutenção, prazo, conhecimento atual). Inclui auditoria anti-overengineering para projeto que está complexo demais.
---

# escolhe-stack-ideal-projeto

## O que esta skill faz

Decide **em que stack construir** (ou auditar se a atual está exagerada), comparando opções por critérios objetivos e devolvendo recomendação única com justificativa (mini-ADR). Complementa `/hosting-infrastructure-analysis` (que decide ONDE hospedar): esta decide COM O QUÊ construir.

## Quando usar

- Projeto novo, antes de qualquer linha de código (junto da `/technical-governance-overview`).
- Cliente pediu tecnologia específica ("quero em WordPress/React") — validar se faz sentido.
- **Auditoria anti-overengineering**: projeto ficando caro/complexo demais para a necessidade real.
- Avaliar migração de stack de projeto existente (ônus da prova é de quem quer migrar).

## Entradas necessárias

1. O que o sistema faz (módulos, usuários, volume esperado realista).
2. Orçamento e prazo.
3. Hospedagem disponível/definida (HostGator? VPS? a definir → `/hosting-infrastructure-analysis`).
4. Quem mantém depois (usuário? cliente? equipe?).
5. Necessidades especiais: realtime, app mobile futuro, integrações pesadas, SEO de conteúdo.

## Processo obrigatório

1. **Aplicar a régua padrão DV Digital** (default vence em empate — Regra 16 do CLAUDE.md):

```text
PHP/MySQL simples → padrão para HostGator/cPanel, orçamento menor, sistema
  pequeno/médio, manutenção fácil, prazo curto. Evitar se: realtime avançado,
  equipe grande, escala alta comprovada.
WordPress → site institucional/blog onde o CLIENTE edita conteúdo; nunca para
  sistema com lógica de negócio complexa (+ /wordpress-cms-hardening).
Laravel → sistema médio/grande com necessidade real de framework (filas,
  policies, testes) E hospedagem que suporte; não cabe em compartilhada apertada.
Next.js/React/TS → frontend rico/SPA com justificativa real; lembrar: sem
  Node em produção salvo confirmação explícita (+ /react-rsc-node-rce-hardening).
Node/NestJS → API/realtime com VPS; nunca em HostGator compartilhada.
Supabase/Firebase → MVP rápido com auth/DB gerenciados; atenção a custo
  recorrente, lock-in e LGPD (+ /supabase-integration).
Híbrida → site PHP + serviço pontual externo (ex.: automação n8n) quando 1
  requisito isolado justificar.
```

2. **Pontuar cada candidata** (1–5) em: custo inicial · custo recorrente · prazo · manutenção por 1 pessoa · compatibilidade com a hospedagem · segurança/maturidade no ecossistema DV · risco técnico · facilidade para o cliente.
3. **Modo anti-overengineering** (quando auditar projeto em andamento): listar cada tecnologia presente e perguntar "que problema REAL resolve aqui?"; tecnologia sem resposta = candidata a remoção; comparar complexidade vs orçamento/prazo/equipe; propor simplificação concreta.
4. **Recomendação única** + plano B; registrar como mini-ADR (decisão, contexto, alternativas descartadas e porquê) em `decisoes.md` do projeto.
5. Stack nova para o usuário? Encadear `/aprende-stack-nova-com-projeto-real` e `/dependency-firewall` antes de instalar qualquer coisa.

## Checklist de qualidade

- [ ] Comparação por critérios pontuados, não por moda.
- [ ] Custo RECORRENTE considerado (mensalidade de serviço, manutenção).
- [ ] Compatível com a hospedagem real do cliente.
- [ ] Mantível pela operação atual (1 pessoa) sem heroísmo.
- [ ] Recomendação única com justificativa — sem "depende" como resposta final.
- [ ] ADR registrado no projeto.
- [ ] Em empate ou dúvida: **manter o padrão PHP/MySQL/HostGator**.

## Erros comuns que esta skill deve evitar

- Escolher stack pelo hype ("todo mundo usa React") sem requisito que a exija.
- Ignorar quem mantém: stack que só o usuário-de-hoje entende vira passivo.
- Subestimar custo recorrente de BaaS/serviços (Supabase/Firebase crescem com uso).
- Forçar PHP simples onde há requisito real de realtime/escala (o default não é dogma).
- Migrar stack de sistema estável por estética (recusa obrigatória).
- WordPress para sistema transacional com regras de negócio.

## Saída esperada

```text
1. REQUISITOS QUE DECIDEM (os 3–5 que realmente importam)
2. TABELA comparativa pontuada (candidatas × critérios)
3. RECOMENDAÇÃO ÚNICA + plano B
4. MINI-ADR para decisoes.md
5. (modo auditoria) TECNOLOGIAS SEM JUSTIFICATIVA + plano de simplificação
6. ENCADEAMENTO (aprendizado, dependências, hardening da stack escolhida)
```

## Exemplo de uso

> "Cliente quer um sistema de agendamento; ele tem HostGator. Faço em Laravel?"

Saída: requisitos (agendamento, 2 perfis, ~200 usuários, WhatsApp) não exigem framework; HostGator compartilhada penaliza Laravel (deploy, workers); recomendação: PHP/MySQL padrão DV com `/cria-projeto-php-mysql-hostgator`, plano B Laravel se migrar para VPS; ADR registrado.

---

## Conexão com o ecossistema

Par com `/hosting-infrastructure-analysis` (onde) e `/technical-governance-overview` (processo). Stack escolhida → skill de scaffold correspondente + hardenings da stack. Aprendizado: `/aprende-stack-nova-com-projeto-real`. Agentes: `arquiteto-projeto` + `especialista-php-mysql-hostgator`.

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
