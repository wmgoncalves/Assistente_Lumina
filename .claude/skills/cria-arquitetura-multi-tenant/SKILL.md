---
name: cria-arquitetura-multi-tenant
description: Use esta skill ao criar ou revisar SaaS/plataforma com múltiplas empresas (AtendaPro e derivados) — isolamento por tenant_id, permissões por empresa, convites, planos com limites no servidor, base de MVP SaaS (onboarding, logs, auditoria, backup/exportação por empresa). Prioridade nº 1: nenhuma empresa vê dados de outra.
---

# cria-arquitetura-multi-tenant

## O que esta skill faz

Define a **arquitetura multi-tenant** completa: estratégia de isolamento de dados, filtragem obrigatória por tenant em toda consulta, papéis por empresa, convites, limites por plano aplicados no servidor — mais a **base mínima de um MVP SaaS robusto** (onboarding, logs/auditoria, backup e exportação por empresa) sem complexidade desnecessária.

## Quando usar

- SaaS novo (AtendaPro, plataforma de gestão, CRM multi-empresa).
- Sistema single-tenant que vai virar multi-empresa (migração delicada — preservação primeiro).
- Auditoria de isolamento em SaaS existente (suspeita/risco de vazamento entre empresas).
- Definir planos e limites de um produto.

## Entradas necessárias

1. Modelo de negócio: quantos tenants esperados, tamanho de cada um.
2. Quem cria contas: auto-cadastro? convite? só a DV?
3. Papéis dentro do tenant (dono, gestor, operador) + papel global (super admin DV).
4. Planos previstos e o que limita cada um (usuários, registros, módulos).
5. Stack/hospedagem (HostGator/MySQL → banco único com `tenant_id`; é a estratégia padrão DV).

## Processo obrigatório

1. **Estratégia de isolamento** (padrão DV em hospedagem compartilhada): **banco único + `tenant_id` em toda tabela de dados** (`/estrutura-banco-dados-mysql`). Banco-por-tenant só com justificativa forte (compliance, escala) e infra que comporte.
2. **Filtragem inegociável**: toda query passa por camada central que injeta `WHERE tenant_id = :tenant_da_sessao` (Model base/repository) — **nunca** confiar em cada query lembrar do filtro; ID vindo de URL/form NUNCA define o tenant (vem da sessão autenticada).
3. **Autorização em duas camadas**: (a) o usuário pertence ao tenant do recurso? (b) o papel dele permite a ação? — ambas no servidor (`/auth-and-session-hardening`); super admin DV: acesso global separado, logado e auditado.
4. **Convites**: dono convida por e-mail com token de uso único e expiração; convite cria vínculo usuário↔tenant↔papel (um usuário pode pertencer a N tenants).
5. **Planos e limites NO SERVIDOR**: tabela de planos + limites; checagem na ação (criar usuário nº 6 no plano de 5 → bloqueio com mensagem de upgrade); frontend só exibe o aviso. Flags simples por tenant para módulos ligados/desligados.
6. **Base MVP SaaS** (o mínimo robusto, sem superengenharia): onboarding (primeiro acesso guiado: criar empresa → configurar básico → primeiro registro) · logs de ação relevante com `tenant_id` + `user_id` (`/logs-and-errors-hardening`) · auditoria de ações sensíveis (exclusões, mudanças de plano, acessos do super admin) · backup geral + **exportação por tenant** (LGPD e saída do cliente — `/backup-and-recovery-strategy`).
7. **Testes de isolamento obrigatórios**: logado no tenant A, tentar acessar recurso do tenant B por URL direta, por ID em form e por API — tudo deve negar (registrar como caso de teste permanente em `/regression-safety`).
8. **LGPD**: dados pessoais por tenant mapeados; exclusão de conta do tenant tem procedimento definido (`/lgpd-compliance-check`).

## Checklist de qualidade

- [ ] `tenant_id` NOT NULL em 100% das tabelas de dados; UNIQUEs compostos com tenant.
- [ ] Filtro de tenant em camada central, não query a query.
- [ ] Tenant da sessão, nunca do input do usuário.
- [ ] Teste de acesso cruzado (A→B) negado nos 3 vetores (URL, form, API).
- [ ] Limites de plano aplicados no servidor com mensagem de upgrade.
- [ ] Convite com token único + expiração.
- [ ] Acesso de super admin auditado.
- [ ] Exportação de dados por tenant funcional.

## Erros comuns que esta skill deve evitar

- Confiar que "todas as queries filtram" sem camada central — UMA esquecida = vazamento.
- Tenant vindo de parâmetro de URL/form (IDOR direto entre empresas).
- Limite de plano só escondendo botão no frontend.
- UNIQUE global (e-mail único no sistema inteiro) quando deveria ser por tenant — ou o contrário, conforme o modelo de login.
- Super admin usando os mesmos endpoints do tenant sem trilha de auditoria.
- Superengenharia de MVP: feature flags complexas, billing automatizado e microsserviços antes do primeiro cliente pagar.
- Migrar single→multi-tenant sem backup + plano de rollback (`/hitl-checkpoint` antes).

## Saída esperada

```text
1. ESTRATÉGIA DE ISOLAMENTO (com justificativa) + modelo de dados
2. CAMADA DE FILTRAGEM central (especificação) + regras de sessão
3. MATRIZ papéis × ações (tenant e global) — validação no servidor
4. PLANOS E LIMITES (tabela + pontos de checagem)
5. FLUXOS: onboarding, convite, upgrade, exportação, exclusão
6. CASOS DE TESTE DE ISOLAMENTO (permanentes)
7. ROADMAP: o que fica fora do MVP de propósito
```

## Exemplo de uso

> "AtendaPro vai abrir para outras barbearias — revisa a arquitetura."

Saída: confirmação de `tenant_id` em todas as 14 tabelas (2 faltando → migração aditiva com backfill), Model base com filtro automático, papéis dono/barbeiro/recepção, plano Start (1 agenda) vs Pro (5 agendas) checado no servidor, convite por e-mail, exportação CSV por barbearia, 9 casos de teste de isolamento, auditoria do super admin.

---

## Conexão com o ecossistema

Dados: `/estrutura-banco-dados-mysql` + `/database-hardening`. Acesso: `/auth-and-session-hardening`. Painel: `/cria-painel-admin-saas`. Pagamento de planos: `/payment-and-checkout-hardening` (+ `/stripe-integration` se for o caso). LGPD: `/lgpd-compliance-check`. Agentes: `especialista-saas-crm-dashboard` (produto) + `especialista-banco-dados-sql` (modelo) + `auditor-seguranca` (isolamento).

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
