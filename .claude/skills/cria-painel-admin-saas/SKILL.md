---
name: cria-painel-admin-saas
description: Use esta skill para criar ou melhorar painéis administrativos de SaaS, sistemas internos e plataformas — navegação, dashboard inicial, CRUDs com filtros/busca/paginação, tabelas que viram cards no mobile, estados vazios e permissões por perfil.
---

# cria-painel-admin-saas

## O que esta skill faz

Define a **estrutura de produto do painel admin**: navegação, páginas de listagem/cadastro/edição/detalhe, filtros, estados e responsividade — com permissões aplicadas em cada tela. Os fundamentos visuais vêm das skills `ui-*`; esta skill os aplica ao padrão específico de painel.

## Quando usar

- Painel novo para SaaS/sistema (AtendaPro e derivados).
- Painel existente confuso: navegação bagunçada, telas inconsistentes, mobile inutilizável.
- Adicionar módulo a painel existente seguindo o padrão da casa.

## Entradas necessárias

1. Quem usa o painel (perfis: super admin, admin do tenant, operador, cliente) e o que cada um pode fazer.
2. Entidades/CRUDs necessários e quais ações de cada um.
3. O que o usuário precisa ver PRIMEIRO ao entrar (dashboard inicial).
4. Volume típico das listagens (10 itens ou 10 mil — muda filtro/paginação).
5. Identidade visual do produto (`/ui-brand-fidelity` / design system existente).

## Processo obrigatório

1. **Navegação por frequência de uso**: itens diários no topo, configuração no fim; máx. ~7 itens de primeiro nível; sidebar no desktop → recolhível no tablet → menu hamburguer ou bottom nav no mobile.
2. **Dashboard inicial** responde "como estão as coisas e o que preciso fazer agora": 3–5 cards de resumo + lista de pendências/ações (`/cria-dashboard-metricas-saas` quando houver KPIs de verdade).
3. **Padrão de CRUD consistente** (igual em TODOS os módulos):

```text
LISTAGEM: busca + filtros relevantes + paginação + ação primária destacada
  + ações por linha (ver/editar/excluir conforme permissão)
CADASTRO/EDIÇÃO: form em 1 coluna, agrupado por seção, validação dupla
  (front+back), estados loading/erro/sucesso (/ui-component-state-machine)
DETALHE: dados + histórico/auditoria + ações contextuais
EXCLUSÃO: confirmação explícita; soft delete quando há histórico
```

4. **Estados obrigatórios em toda tela**: loading (skeleton), vazio (com orientação do que fazer + CTA), erro (mensagem amigável + correlation_id), sucesso (feedback visível).
5. **Mobile**: tabela ≥ 4 colunas vira card empilhado; ações em menu de contexto; alvos de toque ≥ 44px; nada de scroll lateral.
6. **Permissões na interface E no servidor**: esconder o que o perfil não pode usar é UX; **bloquear no backend é segurança** (`/auth-and-session-hardening`) — os dois sempre.
7. Multi-tenant: tudo que aparece é filtrado pelo tenant (`/cria-arquitetura-multi-tenant`); super admin tem visão separada e auditada.

## Checklist de qualidade

- [ ] Navegação com ≤ ~7 itens de primeiro nível, ordenada por uso.
- [ ] Todos os CRUDs seguem o MESMO padrão de listagem/form/detalhe.
- [ ] Estados loading/vazio/erro/sucesso em toda tela.
- [ ] Tabelas usáveis no mobile (cards) e busca/filtros funcionais.
- [ ] Permissão de cada ação validada no servidor (não só escondida).
- [ ] Ações destrutivas com confirmação; histórico onde importa.
- [ ] Acessibilidade básica: foco visível, labels, contraste (`/accessibility-wcag-audit`).

## Erros comuns que esta skill deve evitar

- Cada módulo com layout/padrão diferente (usuário reaprende a cada tela).
- Dashboard de enfeite (gráficos que ninguém usa) no lugar de pendências acionáveis.
- Filtro/busca ausentes em listagem que vai crescer.
- Permissão só no frontend (botão escondido ≠ rota protegida).
- Tabela de 8 colunas espremida no celular.
- Estado vazio em branco (usuário acha que quebrou).
- Excluir sem confirmação ou sem soft delete onde há dependências.

## Saída esperada

```text
1. MAPA DE NAVEGAÇÃO (itens, ordem, comportamento por breakpoint)
2. DASHBOARD INICIAL (cards + pendências por perfil)
3. ESPECIFICAÇÃO DOS CRUDs (telas, campos, filtros, ações × permissão)
4. MATRIZ PERFIL × AÇÃO (o que cada papel pode fazer, validado no servidor)
5. PADRÕES DE ESTADO (loading/vazio/erro/sucesso)
6. ADAPTAÇÃO MOBILE/TABLET por tela
```

## Exemplo de uso

> "Estrutura o painel do AtendaPro Barber."

Saída: navegação (Agenda · Clientes · Serviços · Barbeiros · Financeiro · Relatórios · Configurações), dashboard com agenda do dia + faltas + faturamento do mês, CRUDs padronizados, matriz de permissões (dono vê financeiro; barbeiro só a própria agenda — validado no servidor), agenda mobile como lista vertical por horário.

---

## Conexão com o ecossistema

Fundamentos visuais: `/ui-minimal-design-system`, `/ui-component-state-machine`, `/ui-premium-responsive-design`. Segurança de acesso: `/auth-and-session-hardening` + `/webapp-hardening`. Dados: `/estrutura-banco-dados-mysql`. Produto: agente `especialista-saas-crm-dashboard`. Review antes de entregar: `revisor-design-ui` + `/product-readiness-checklist`.

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
