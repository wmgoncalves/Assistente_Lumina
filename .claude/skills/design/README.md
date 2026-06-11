# Skills de Design, UI/UX e Conversão

Esta pasta contém o **briefing consolidado** do pacote de skills de design. As skills propriamente ditas são invocáveis com `/nome`, cada uma em sua pasta no nível raiz `.claude/skills/`.

## Skills invocáveis (10)

| Skill | Quando usar |
|---|---|
| [/ui-visual-hierarchy](../ui-visual-hierarchy/SKILL.md) | Hierarquia visual de página/componente |
| [/ui-reading-patterns](../ui-reading-patterns/SKILL.md) | Padrões F, Z, Gutenberg, Camada |
| [/ui-gestalt-proximity](../ui-gestalt-proximity/SKILL.md) | Agrupamento, similaridade, proximidade |
| [/ui-affordance-interactions](../ui-affordance-interactions/SKILL.md) | Hover, focus, active, disabled, loading |
| [/ui-component-state-machine](../ui-component-state-machine/SKILL.md) | Estados de componente como máquina explícita |
| [/ui-conversion-landing-page](../ui-conversion-landing-page/SKILL.md) | LP, captura, venda, página de serviço |
| [/ui-minimal-design-system](../ui-minimal-design-system/SKILL.md) | Tokens, primitivas, consistência |
| [/ui-premium-responsive-design](../ui-premium-responsive-design/SKILL.md) | Mobile-first, breakpoints, Web Vitals |
| [/ui-brand-fidelity](../ui-brand-fidelity/SKILL.md) | Identidade de marca ([MARCA_1], [MARCA_2], [SUA_EMPRESA]) |
| [/ui-final-design-review](../ui-final-design-review/SKILL.md) | Revisão final consolidada antes de publicar |

## Ordem recomendada de aprendizado

1. `/ui-visual-hierarchy` (O QUE destacar)
2. `/ui-reading-patterns` (ONDE colocar)
3. `/ui-gestalt-proximity` (COMO agrupar)
4. `/ui-affordance-interactions` (como o usuário INTERAGE)
5. `/ui-component-state-machine` (estados completos)
6. `/ui-conversion-landing-page` (aplicação em LP)
7. `/ui-minimal-design-system` (tokens e consistência)
8. `/ui-premium-responsive-design` (mobile-first + Web Vitals)
9. `/ui-brand-fidelity` (identidade da marca)
10. `/ui-final-design-review` (revisão consolidada)

## Prioridade absoluta

Design **fica abaixo** de:

1. **Segurança** (validação, XSS, CSRF, SQL injection, supply chain, segredos)
2. **Privacidade/LGPD** (base legal, consentimento, retenção, direitos)
3. **Acessibilidade** (WCAG 2.2 AA — direito legal — LBI 13.146/2015)
4. **Performance** (Web Vitals)
5. **Manutenibilidade** (preservação do existente)

Só DEPOIS:

6. UI/UX
7. Conversão
8. Estética visual

**Nenhuma decisão estética pode remover, enfraquecer ou contornar regras de segurança, privacidade ou acessibilidade existentes.**

## Regra de preservação

Ao alterar layouts existentes:

- **NÃO** apagar página/componente inteiro para refazer do zero
- **SIM** analisar, apontar problemas, melhorar em etapas
- Preservar funcionalidades, validações, integrações, classes, IDs, hooks, responsividade e acessibilidade existentes
- Refatoração completa só com justificativa explícita

Combina sempre com [/preserve-existing-behavior](../preserve-existing-behavior/SKILL.md).

## Briefing completo

Veja [`00-design-skills-installation-brief.md`](00-design-skills-installation-brief.md) para o briefing original detalhado.

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
