---
name: implementa-kanban-fluxos-sistema
description: Use esta skill para implementar quadros Kanban, fluxos por status, funis, swimlanes, timelines e organogramas hierárquicos arrastáveis em sistemas — com persistência no banco, histórico de movimentação, permissões e alternativa mobile.
---

# implementa-kanban-fluxos-sistema

## O que esta skill faz

Implementa **visualizações de fluxo com drag-and-drop** que não viram bagunça: colunas/status com posição persistida, histórico de cada movimentação, permissões sobre quem move o quê, e versão mobile utilizável. Cobre Kanban, funil comercial, swimlanes, timeline e o **modo organograma hierárquico** (blocos de pessoas/cargos com vínculos).

## Quando usar

- Funil de leads/comercial (Plataforma de Leads, CRM).
- Gestão de tarefas/produção/atendimento por status.
- Organograma empresarial arrastável (estrutura de equipes, níveis, vínculos).
- Tela existente de "lista com status" que precisa virar quadro visual.

## Entradas necessárias

1. Tipo de fluxo: status horizontal · funil · swimlane por responsável · timeline · **organograma hierárquico**.
2. Quem pode mover/vincular o quê (matriz perfil × ação).
3. O que uma mudança de status DISPARA (notificação, data, automação) — efeitos explícitos.
4. Volume por coluna (50 cards ou 5.000 — muda paginação/virtualização).
5. Multi-tenant? (sim em SaaS → tudo filtrado por `tenant_id`).

## Processo obrigatório

1. **Modelo de dados antes da UI** (`/estrutura-banco-dados-mysql`):

```text
itens:        id, tenant_id, titulo, status_id, posicao, responsavel_id, ...
status:       id, tenant_id, nome, ordem, cor (colunas configuráveis)
movimentos:   id, item_id, de_status, para_status, usuario_id, criado_em  ← histórico
(organograma) pessoas: id, tenant_id, nome, cargo, nivel, superior_id (vínculo)
              posicoes_visuais: pessoa_id, x, y  ← posição visual SEPARADA do vínculo
```

2. **Toda ação visual persiste**: soltar o card = UPDATE de status+posição no servidor + INSERT no histórico, com **validação de permissão no backend** (frontend só desenha). Resposta de erro → card volta para onde estava, com aviso.
3. **Concorrência**: dois usuários movendo o mesmo item → UPDATE condicional (`WHERE status_id = :status_anterior`) e recarregar em conflito (`/open-redirect-and-race-conditions-hardening`); reordenação de posição com gaps (posição 10, 20, 30) para evitar reindexar tudo.
4. **Mudança de status com efeito** (notificar, travar, datar): efeitos rodam no servidor, idempotentes, nunca disparados só pelo JS.
5. **Modo organograma**: separar **vínculo hierárquico** (superior_id — relação de verdade) de **posição visual** (x,y — estética); arrastar sobre um bloco = vincular (confirmação); arrastar em área livre = só mover visual; área de "não vinculados"; botão de reset de layout; histórico de mudanças de vínculo.
6. **Mobile**: drag-and-drop é ruim no touch — alternativa obrigatória: lista agrupada por status com ação "mover para…" em menu; organograma mobile = árvore expansível vertical.
7. Estados: loading do quadro, coluna vazia com orientação, erro de movimentação com retry.

## Checklist de qualidade

- [ ] Movimento visual sempre persiste; permissão validada no servidor.
- [ ] Histórico de toda movimentação/vínculo (quem, quando, de→para).
- [ ] Conflito de concorrência tratado (UPDATE condicional + recarregar).
- [ ] Organograma: vínculo ≠ posição visual; reset disponível.
- [ ] Mobile tem alternativa sem drag (mover por menu).
- [ ] Colunas/status configuráveis por tenant sem precisar de programador.
- [ ] Volume grande: paginação/colapso por coluna (sem 5.000 nós no DOM).
- [ ] Sem dependência pesada sem análise (`/dependency-firewall`; preferir SortableJS-like leve ou nativo).

## Erros comuns que esta skill deve evitar

- Drag que só muda o DOM (F5 e voltou tudo).
- Permissão de mover só no frontend.
- Status sem histórico (impossível auditar "quem mandou pra Perdido?").
- Misturar vínculo hierárquico com posição visual no organograma (arrastar para arrumar a tela muda o chefe da pessoa).
- Reindexar todas as posições a cada movimento (lento + race).
- Kanban inutilizável no celular sem alternativa.
- Quadro que carrega TODOS os itens de todos os tempos.

## Saída esperada

```text
1. MODELO DE DADOS (tabelas, histórico, posições) + índices
2. CONTRATO DAS AÇÕES (mover/vincular: request, validações, efeitos, resposta)
3. ESPECIFICAÇÃO DA UI (colunas, cards, swimlanes/organograma, estados)
4. REGRAS DE PERMISSÃO por perfil (validadas no servidor)
5. ALTERNATIVA MOBILE
6. PLANO DE TESTE (mover, conflito, permissão negada, volume)
```

## Exemplo de uso

> "Funil de leads arrastável para a plataforma de leads."

Saída: colunas configuráveis (novo→contato→qualificado→proposta→fechado/perdido), motivo obrigatório ao soltar em "perdido", histórico por lead, vendedor move só os próprios leads (validação no servidor), posição com gaps, mobile = lista por etapa com "mover para…", métricas do funil alimentando `/cria-dashboard-metricas-saas`.

---

## Conexão com o ecossistema

Dados: `/estrutura-banco-dados-mysql`; concorrência: `/open-redirect-and-race-conditions-hardening`; estados de UI: `/ui-component-state-machine`; painel: `/cria-painel-admin-saas`; funil comercial (processo humano): `/estrutura-funil-leads-whatsapp`. Agente: `especialista-saas-crm-dashboard` + `especialista-php-mysql-hostgator`.

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
