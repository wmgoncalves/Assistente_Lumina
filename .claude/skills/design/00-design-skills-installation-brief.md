# 00 — Briefing de Instalação das Skills de Design, UI/UX e Conversão

> Documento de referência. Não é skill invocável.
> As skills invocáveis vivem em `.claude/skills/ui-*/SKILL.md`.

## 1. Objetivo

Pacote complementar de skills para melhorar **qualidade visual, experiência do usuário e conversão** dos projetos desenvolvidos com Claude Code, sem comprometer segurança, privacidade, acessibilidade ou manutenibilidade.

## 2. Contexto

Aplicável a:

- Sites institucionais
- Landing pages
- Páginas de serviço, captura e venda
- Sistemas administrativos e dashboards
- Formulários, fluxos de orçamento
- Páginas com integração WhatsApp/LGPD/cookies
- Interfaces em HTML, CSS, JS, PHP, React, Node ou stacks futuras

Melhorias:

- Hierarquia visual
- Padrões de leitura
- Organização por proximidade
- Affordance e estados
- Conversão
- Responsividade
- Design system
- Consistência de marca
- Revisão visual final

## 3. Regra suprema

**Segurança tem prioridade absoluta.**

Nenhuma skill de design pode:

- Remover regra de segurança
- Sobrescrever skill de segurança
- Enfraquecer validações
- Esconder mensagens de erro
- Remover sanitização
- Expor dados sensíveis
- Adicionar dependência suspeita ou CDN desnecessária
- Quebrar proteção contra XSS, CSRF, SQL Injection, path traversal
- Remover consentimento LGPD
- Esconder links legais
- Apagar controles de permissão
- Remover confirmação de ação destrutiva
- Quebrar autenticação
- Expor secrets, tokens, chaves de API

Em conflito design vs segurança, **segurança vence**.

## 4. Hierarquia de prioridades

1. Segurança
2. Privacidade / LGPD
3. Acessibilidade (WCAG 2.2 AA — direito legal: LBI 13.146/2015)
4. Performance
5. Manutenibilidade
6. Compatibilidade com ambiente de deploy
7. Clareza da informação
8. UI/UX
9. Conversão
10. Estética visual

## 5. Quantidade

- **1** briefing (este arquivo)
- **1** README (`design/README.md`)
- **10** skills invocáveis (`.claude/skills/ui-*/SKILL.md`)

## 6. Skills invocáveis

| Nº | Skill | Função |
|---|---|---|
| 01 | `/ui-visual-hierarchy` | Ponto focal, peso visual, evitar competição |
| 02 | `/ui-reading-patterns` | Padrões F, Z, Gutenberg, Camada |
| 03 | `/ui-gestalt-proximity` | Agrupamento, similaridade, proximidade |
| 04 | `/ui-affordance-interactions` | Hover, focus, active, disabled, loading |
| 05 | `/ui-component-state-machine` | Estados explícitos, sem inválidos |
| 06 | `/ui-conversion-landing-page` | LP, captura, venda |
| 07 | `/ui-minimal-design-system` | Tokens, primitivas |
| 08 | `/ui-premium-responsive-design` | Mobile-first, Web Vitals |
| 09 | `/ui-brand-fidelity` | [MARCA_1], [MARCA_2], [SUA_EMPRESA], outras |
| 10 | `/ui-final-design-review` | Review consolidado antes de publicar |

## 7. Ordem de uso

- Em projeto novo: 01 → 02 → 03 → 04 → 05 → 07 (system) → 08 (mobile) → 09 (marca) → 06 (LP se aplicável) → 10 (review)
- Em projeto existente: 10 (auditoria primeiro) → identificar áreas críticas → aplicar as específicas em etapas
- Antes de publicar: 10 + `/pre-deploy-security-review`

## 8. Antes de criar/instalar

Claude Code deve:

1. Ler o CLAUDE.md (global e do projeto)
2. Ler a estrutura `.claude/` atual
3. Identificar skills existentes (segurança e outras)
4. Identificar convenções de nome
5. Identificar regras para não alterar arquivos sensíveis
6. Planejar instalação sem apagar nada

## 9. Regras de não-conflito com segurança

Skills de design são complementares. Elas **não podem**:

- Disputar prioridade com skills de segurança
- Redefinir sanitização, autenticação, permissões
- Flexibilizar uso de pacote/CDN/script externo
- Substituir validação backend por validação visual
- Tratar feedback visual como segurança real
- Esconder erro por estética
- Reduzir logs seguros necessários
- Expor detalhes internos em mensagens de erro

## 10. Regra de preservação de layouts existentes

Quando já existe interface/layout/página/componente:

**Não** apagar e refazer do zero.

**Fazer:**

- Analisar estrutura atual
- Identificar o que funciona
- Apontar problemas objetivamente
- Sugerir melhorias por partes
- Preservar funcionalidades, validações, integrações, classes/IDs/hooks, responsividade, acessibilidade
- Aplicar mudanças incrementais

Refatoração completa = só com justificativa explícita.

## 11. Regra contra reconstrução destrutiva

Substituir página inteira só porque o visual pode melhorar = recusar.

Fazer:

1. Analisar a página atual
2. Apontar problemas
3. Melhorar o layout por etapas
4. Preservar o que funciona
5. Testar que nada quebrou

Combina com `/preserve-existing-behavior`.

## 12. Fluxo para melhorar layout existente

1. Ler arquivos atuais
2. Identificar estrutura
3. Identificar componentes/estilos/integrações/validações
4. Identificar problemas visuais
5. Identificar riscos da alteração
6. Propor plano por etapas
7. Aplicar menor alteração segura
8. Testar visualmente e funcionalmente
9. Verificar responsividade, acessibilidade, segurança
10. Concluir

## 13. Melhorias incrementais (exemplos)

- Ajustar hierarquia do título
- Reorganizar CTA
- Melhorar espaçamento, grid, fonte, contraste
- Aproximar elementos relacionados
- Separar seções confusas
- Adicionar hover/focus/loading
- Melhorar texto do botão e mensagens
- Corrigir mobile, otimizar imagem
- Revisar consistência de marca

## 14. Regra sobre dependências

Antes de propor qualquer nova dependência:

- HTML semântico resolve?
- CSS nativo (Flexbox, Grid, custom properties) resolve?
- JavaScript simples resolve?
- Componente existente do projeto resolve?

Se a resposta a qualquer dessas for "sim", **não adicionar dependência**.

Combina sempre com `/dependency-firewall`.

Evitar:

- Biblioteca só para hover/glow/animação simples
- CDN externa sem justificativa
- Scripts externos sem auditoria

## 15. Compatibilidade com deploy

### Hospedagem compartilhada (HostGator, cPanel)

- Sem Node.js em produção sem confirmação
- Sem build obrigatório
- `.htaccess` é a principal ferramenta
- PHP leve quando necessário

### React/Node

- Respeitar estrutura existente
- Não trocar framework sem justificativa
- Não alterar build sem necessidade

### Stack desconhecida

- Analisar antes de modificar
- Não assumir tecnologia

## 16. Acessibilidade obrigatória

Toda skill respeita:

- Contraste WCAG (4.5:1 corpo, 3:1 título grande)
- Focus visível
- Navegação por teclado
- Labels de formulário
- Textos alternativos
- Estrutura semântica
- Ordem dos headings
- Área de toque mobile (mín 44px)
- Mensagens de erro compreensíveis
- Não depender só de cor
- Não depender só de hover (mobile não tem)
- Não esconder informações essenciais

"Design bonito que não é acessível" = não é bom design.

## 17. LGPD e privacidade

Não esconder/reduzir importância de:

- Política de privacidade, termos, aviso de cookies
- Consentimento de formulário (não pré-marcado)
- Finalidade de coleta, links legais, contato
- Mensagens sobre envio de dados, aceites

Formulário pede apenas dados necessários.

Combina com `/lgpd-compliance-check`.

## 18. Formulários

Todo formulário deve ter:

- Label visível (não só placeholder)
- Validação visual + validação segura no servidor
- Loading ao enviar
- Erro e sucesso claros, exclusivos
- Prevenção de clique duplo
- Campos obrigatórios indicados
- Consentimento quando necessário
- Política de privacidade acessível
- Mensagens sem vazamento de dados internos

**Validação visual nunca substitui validação no servidor.**

## 19. Estados

Toda interação importante prevê:

```
default → hover → focus → active → disabled → loading → success/error
```

Para formulário:

```
inicial → typing → validating → submitting → success | field_error | network_error | server_error | rate_limited | blocked
```

Regras:

- Sucesso e erro nunca simultâneos
- Loading em toda ação assíncrona
- Erro com retry/saída clara

Combina com `/ui-component-state-machine`.

## 20. Marcas conhecidas

### [MARCA_1] Transportes

- Fonte preferencial: **Exo 2**
- Estilo: corporativo, forte, moderno, premium
- Cores: vermelho institucional + neutros
- Preservar logo

### [MARCA_2]

- Fonte preferencial: **Montserrat**
- Estilo: corporativo, técnico, premium, limpo
- Cores: base da logo
- Preservar logo

### [SUA_EMPRESA]

- Estilo: minimalista
- Base: preto, branco, neutros
- Foco: tráfego, sites, conversão
- Evitar excesso de cores

### Marcas novas

- Analisar arquivos existentes antes de inventar
- Não decidir identidade sem aprovação

Combina com `/ui-brand-fidelity`.

## 21. Atualização do CLAUDE.md

- Não apagar conteúdo existente
- Não substituir regras de segurança
- Adicionar seção complementar
- Deixar claro: design abaixo de segurança/privacidade/acessibilidade/performance/manutenibilidade

## 22. Critérios de aceite

- Arquivos no local correto (`.claude/skills/ui-*/SKILL.md`)
- 10 skills invocáveis presentes
- Briefing (este arquivo) presente
- CLAUDE.md atualizado sem apagar regras
- Nenhuma skill de segurança removida ou enfraquecida
- Skills deixam claro: segurança em primeiro lugar
- Regras explícitas: preservação, incrementais, sem reconstrução destrutiva
- Checklists de UX, acessibilidade e segurança presentes
- Cuidado com dependências e CDNs

## 23. Resultado esperado

Após instalação:

- Código continua seguro
- Validações preservadas
- Layouts ficam profissionais
- Páginas mais claras
- CTAs mais fortes
- Formulários confiáveis
- Componentes com estados
- Mobile com atenção real
- Identidade visual respeitada
- Projetos existentes evoluem por partes
- Nada é refeito do zero sem necessidade

---

**Histórico:** Instalado em 2026-05-14, junto com a expansão da estrutura de segurança (29 skills de segurança → 39 skills totais com 10 de design).

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
