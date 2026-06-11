---
name: skill-orchestrator
description: Resolve conflitos entre skills. Aplica hierarquia global (segurança > privacidade > integridade > preservação > testes > estabilidade > performance > organização > UX). Use quando duas ou mais skills divergirem sobre como proceder. Equivalente operacional da Skill 10 do vault.
---

# skill-orchestrator

Use esta skill **sempre que duas ou mais recomendações entrarem em conflito**. Ela aplica a hierarquia global e registra a decisão.

## Hierarquia global de prioridade

Em qualquer conflito, aplicar nesta ordem:

| Posição | Prioridade | Exemplos |
|---|---|---|
| 1 | **Segurança da aplicação** | XSS, CSRF, SQL injection, autenticação, autorização, supply chain |
| 2 | **Privacidade / LGPD / acessibilidade legal** | PII, base legal, retenção, WCAG (LBI) |
| 3 | **Integridade de dados e banco** | Concorrência, transação, FK, migration reversível |
| 4 | **Preservação de funcionalidades** (Skill 00) | Não quebrar contrato observável existente |
| 5 | **Testes e regressão** | Cobertura mínima, teste antes de mexer |
| 6 | **Estabilidade de produção** | Janela de deploy, rollback, smoke test |
| 7 | **Performance** | Cache, índices, otimizações |
| 8 | **Organização do código** | Pastas, nomes, padrões |
| 9 | **Design / estética / UX puro** | Ajuste visual, refactor estético |

**Acessibilidade tem proteção análoga à privacidade** (direito legal — LBI 13.146/2015).
**HITL em ação Crítica** sobe na hierarquia (próximo a privacidade).
**Em empate de mesmo nível**, escalar para humano — não decidir sozinho.

## Regra cardeal

> **Nenhuma melhoria de prioridade inferior pode reduzir/remover proteção de prioridade superior.**

Exemplos práticos:
- Não reduzir validação no servidor "porque o frontend já valida" (UX < segurança)
- Não remover log de erro "porque polui a saída" (organização < integridade)
- Não cachear endpoint autenticado "porque é mais rápido" (performance < segurança/privacidade)
- Não trocar bcrypt por hash mais rápido "porque CPU está alta" (performance < segurança)
- Não trocar prepared statement por query montada "porque é mais legível" (organização < segurança)

## Tipos de conflito comuns e como resolver

### Segurança vs Preservação
**Exemplo:** Endpoint legado retorna senha em log. Corrigir quebra clientes que parseiam o log.
**Resolução:** Segurança vence (1 > 4). Patch imediato. Avisar clientes em paralelo.

### Privacidade vs Performance
**Exemplo:** Cache global tem PII e acelera 10x.
**Resolução:** Privacidade vence (2 > 7). Cache por usuário, TTL curto, ou remover PII do cache.

### Integridade vs UX
**Exemplo:** Validação no servidor rejeita formato que UI permite digitar.
**Resolução:** Integridade vence (3 > 9). Alinhar UI ao servidor, não o contrário.

### Preservação vs Testes
**Exemplo:** Teste falha porque o comportamento "correto" não é o atual.
**Resolução:** Preservação vence (4 > 5). Teste está validando o desejado, não o real — corrigir o teste para refletir o que está em produção e abrir card separado para mudar o comportamento.

### Testes vs Performance
**Exemplo:** Adicionar testes deixa CI lento.
**Resolução:** Testes vencem (5 > 7). Otimizar suite (paralelizar, mock onde seguro), não cortar cobertura.

## Quando esta skill é obrigatória

- 2+ skills divergem sobre o que fazer
- Decisão envolve trade-off entre segurança/privacidade e qualquer outra coisa
- Mudança quebra contrato observável
- Ação Crítica/irreversível
- Decisão de produto com impacto técnico
- Refactor grande proposto em código que funciona

## Saída obrigatória — ADR enxuto

```
DECISÃO ORQUESTRADA
====================
Conflito: [skill A] vs [skill B]
Contexto: [resumo do problema]
Opções consideradas:
  1. [opção] — prós: [...]  contras: [...]
  2. [opção] — prós: [...]  contras: [...]
Hierarquia aplicada: [prioridade vencedora]
Decisão: [...]
Justificativa: [por que essa opção dentro da hierarquia]
Trade-off aceito: [o que estamos abrindo mão e por quê]
HITL necessário: [SIM/NÃO — se sim, quem aprovou]
Rollback: [como reverter]
Registro: [link/caminho do ADR completo]
```

## Quando escalar para humano

- Empate de prioridade (duas decisões na mesma posição da hierarquia)
- Decisão de produto que afeta usuário final visível
- Mudança em contrato externo (API pública, integração com cliente)
- Custo financeiro significativo (cloud, licença, BD)
- Implicação legal não-óbvia (LGPD, contrato, propriedade intelectual)
- Risco residual não-trivial após mitigação

**Não decidir sozinho** nesses casos. Apresentar opções, recomendar uma, **aguardar**.

## Ações proibidas

- Aplicar skills sem ordem (cada uma tirando a proteção da outra)
- "Aceitar todas as recomendações" sem detectar conflitos
- Reduzir segurança para satisfazer UX
- Reduzir privacidade para satisfazer performance
- Decidir trade-off Crítico sem HITL
- Esconder decisão (sempre registrar ADR)

## Conexão com skills do vault

- Skill 10 (Orquestrador) — versão completa, conceitual e detalhada
- Skill 00 (Não Quebrar Código) — soberana junto com esta para conflito vs preservação
- Skill 09 (Human-in-the-Loop) — invocar quando esta skill mandar escalar
- Skill 16 (Documentação) — registrar decisão em ADR

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
