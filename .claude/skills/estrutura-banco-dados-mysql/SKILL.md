---
name: estrutura-banco-dados-mysql
description: Use esta skill para MODELAR banco MySQL/MariaDB — entidades, relacionamentos, índices, constraints, soft delete, auditoria e multi-tenant — gerando DER textual e SQL inicial. O lado segurança vem de database-hardening; a decisão de onde guardar dados vem de storage-database-files.
---

# estrutura-banco-dados-mysql

## O que esta skill faz

Faz a **modelagem** do banco: do requisito às tabelas, com relacionamentos corretos, índices justificados, constraints de integridade, campos de auditoria e preparo para multi-tenant. Entrega DER textual + SQL inicial + seeds. Não cobre hardening (isso é `/database-hardening`) nem escolha de tecnologia de armazenamento (isso é `/storage-database-files`).

## Quando usar

- Módulo/sistema novo que precisa de tabelas (antes de escrever o primeiro CREATE TABLE).
- Revisar modelagem existente que está gerando inconsistência, lentidão ou gambiarra.
- Adicionar entidade a sistema vivo (migração compatível, não destrutiva).
- Preparar relatórios que o modelo atual não responde bem.

## Entradas necessárias

1. Entidades do negócio e como se relacionam (em linguagem de negócio).
2. Multi-tenant? (AtendaPro e SaaS: sim → `tenant_id`/`empresa_id` em tudo — `/cria-arquitetura-multi-tenant`).
3. Volumes realistas (centenas? milhões?) e consultas mais frequentes (define índices).
4. O que precisa de histórico/auditoria e o que pode ser sobrescrito.
5. Banco existente? Dump da estrutura atual (nunca modelar às cegas sobre sistema vivo).

## Processo obrigatório

1. **Entidades e relacionamentos**: 1:N e N:N (tabela pivô) explícitos; nada de coluna com lista separada por vírgula.
2. **Convenções DV**: tabela no plural snake_case; PK `id` (BIGINT UNSIGNED AUTO_INCREMENT); `created_at`/`updated_at` em toda tabela de negócio; `deleted_at` (soft delete) onde houver histórico importante; charset `utf8mb4` + collation `utf8mb4_unicode_ci`; engine InnoDB.
3. **Tipos corretos**: dinheiro = `DECIMAL(12,2)` (nunca FLOAT); datas = `DATETIME`/`DATE`; flags = `TINYINT(1)`; enums curtos = `VARCHAR` + CHECK/validação na aplicação (ENUM nativo engessa migração).
4. **Integridade**: FK com `ON DELETE` consciente (RESTRICT por padrão; CASCADE só com justificativa); UNIQUE para o que não pode duplicar (e-mail por tenant, cupom) — constraint no banco vale mais que checagem na aplicação (`/open-redirect-and-race-conditions-hardening`).
5. **Índices justificados**: toda FK; colunas de filtro/busca frequente; compostos na ordem da consulta. Cada índice anotado com a query que o justifica — índice sem uso é custo de escrita.
6. **Multi-tenant**: `tenant_id` NOT NULL em toda tabela de dados; índice composto começando por `tenant_id`; UNIQUE sempre composto com `tenant_id`.
7. **LGPD por modelagem**: dados pessoais minimizados e concentrados (facilita exclusão/exportação do titular — `/lgpd-compliance-check`); nada de senha em texto (hash via aplicação).
8. **Saída**: DER textual → SQL de criação → seeds essenciais → riscos do modelo. Em banco existente: migração **aditiva** com plano de rollback e backup antes (`/backup-and-recovery-strategy`).

## Checklist de qualidade

- [ ] Toda tabela: PK, timestamps, charset/engine padrão.
- [ ] Dinheiro em DECIMAL; nenhum FLOAT monetário.
- [ ] FKs com ON DELETE deliberado; UNIQUEs de negócio no banco.
- [ ] Cada índice tem a consulta que o justifica.
- [ ] Multi-tenant: `tenant_id` + índices/uniques compostos em 100% das tabelas de dados.
- [ ] Dados pessoais mapeados e minimizados.
- [ ] Migração sobre banco vivo é aditiva, com backup + rollback.
- [ ] Consultas críticas previstas têm caminho de índice (sem full scan em tabela grande).

## Erros comuns que esta skill deve evitar

- Tabela "genérica" (`dados`, `items` com coluna `tipo`) que vira lixão.
- FLOAT para dinheiro; VARCHAR para data.
- N:N resolvido com coluna de IDs concatenados.
- Índice em tudo "por garantia" (escrita lenta) ou em nada (leitura lenta).
- DELETE físico onde o negócio precisa de histórico.
- Esquecer `tenant_id` em UMA tabela — vazamento entre empresas.
- DROP/ALTER destrutivo em produção sem backup confirmado (recusa obrigatória).

## Saída esperada

```text
1. DER TEXTUAL (entidades, campos principais, relacionamentos)
2. SQL DE CRIAÇÃO (tabelas, FKs, índices, na ordem certa)
3. SEEDS essenciais (perfis, status, configurações)
4. ÍNDICES com justificativa (query → índice)
5. RISCOS do modelo + pontos de evolução futura
6. (banco vivo) PLANO DE MIGRAÇÃO aditiva + rollback
```

## Exemplo de uso

> "Modela o módulo de comissões do AtendaPro Barber."

Saída: entidades `comissoes_regras` (por tenant, por serviço/barbeiro, DECIMAL) e `comissoes_lancamentos` (FK para agendamento UNIQUE — impede comissão dupla, com `tenant_id` composto), índices por `tenant_id+barbeiro_id+periodo` (relatório mensal), soft delete em regras (histórico de % antiga), migração aditiva sem tocar tabelas existentes.

---

## Conexão com o ecossistema

Antes: `/storage-database-files` (decidir onde) e `/requirements-analysis` (o quê). Depois: `/database-hardening` (privilégios, dumps, prepared statements) e `/backup-and-recovery-strategy`. SaaS: `/cria-arquitetura-multi-tenant`. Agente: `especialista-banco-dados-sql`.

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
