---
name: escolhe-modo-execucao
description: Use esta skill no início de tarefas médias ou grandes no Claude Code para escolher o MENOR modo de execução que entrega com qualidade — sessão única, skill, implementador+revisor, agentes paralelos somente leitura, equipe por módulos, debug por hipóteses ou worktree isolado. Inclui regras de contexto mínimo e modo ultra econômico.
---

# escolhe-modo-execucao

## O que esta skill faz

Decide **como executar** antes de gastar tokens: classifica a tarefa, estima escopo e escolhe entre os 8 modos — sempre o menor arranjo capaz de entregar com qualidade. Tokens são orçamento de projeto: mais agentes ≠ melhor resultado.

## Quando usar

- Início de tarefa média/grande (o maestro aplica antes de rotear).
- Quando houver tentação de "chamar todo mundo" para uma tarefa.
- Quando o usuário pedir modo econômico explícito.
- NÃO usar para tarefa trivialmente pequena — isso já é sessão única; decidir seria overhead.

## Entradas necessárias

1. A tarefa e o resultado esperado.
2. Estimativa de arquivos afetados (1–3? um módulo? vários módulos?).
3. Risco envolvido (segurança, banco, auth, pagamento, produção = alto).
4. É implementação, revisão, investigação ou refatoração?

## Processo obrigatório

1. **Classificar** a tarefa: simples · média · grande · arriscada · investigativa · revisão.
2. **Escolher o modo** (do mais barato ao mais caro — parar no primeiro que basta):

```text
1. SESSÃO ÚNICA — pequena, poucos arquivos, sem revisão especializada.
2. SESSÃO ÚNICA + SKILL — existe procedimento/checklist repetível.
3. IMPLEMENTADOR + REVISOR — mudança importante ou com risco (financeiro,
   auth, banco, agenda): desenvolvedor-feature implementa; revisor-codigo-geral
   (ou auditor-seguranca, se segurança) revisa O DIFF.
4. 2 AGENTES PARALELOS SOMENTE LEITURA — duas lentes de análise sem edição.
5. REVISÃO 360 PARALELA (somente leitura) — pré-entrega; máx. ~10 achados
   por lente; consolidar sem duplicar (/revisa-entrega-final-360 como roteiro).
6. EQUIPE PARALELA POR MÓDULOS — só com arquivos independentes; exige
   /divide-tarefa-agentes-paralelos antes.
7. DEBUG POR HIPÓTESES — bug confuso/recorrente: /investiga-bug-hipoteses.
8. WORKTREE/ISOLADO — refatoração grande, mudança de arquitetura, auth,
   banco, pagamento, ou comparação de duas soluções.
```

3. **Contexto mínimo** (vale para qualquer modo): ler primeiro CLAUDE.md do projeto + estrutura resumida + arquivos diretamente ligados à tarefa; expandir só com dependência comprovada; nunca abrir vendor/node_modules/dist/storage/backups; logs grandes sempre filtrados (grep), nunca inteiros.
4. **Modo ultra econômico** (quando pedido): sessão única se resolver, zero relatório, zero explicação do óbvio — só plano curto, alteração, validação e riscos; se faltar contexto, pedir o arquivo exato em vez de varrer.
5. **Regras invioláveis em qualquer modo**: paralelismo de ESCRITA só com arquivos independentes; revisor começa pelo diff; diff pequeno vence refatoração (refatorar só se bloquear a entrega ou reduzir bug real); relatório longo só sob pedido; cada agente devolve resumo curto (o que analisou, achou, recomenda, arquivos, riscos, próximo passo).
6. Tarefa de código continua sob os gatilhos da §13 (preservação, dependências, deploy, HITL) — o modo NUNCA pula essas camadas.

## Checklist de qualidade

- [ ] Foi escolhido o modo mais barato que basta (não o mais impressionante).
- [ ] Lista de arquivos iniciais é curta e justificada.
- [ ] Paralelismo (se houver) tem independência de arquivos verificada.
- [ ] Risco classificado; modo 3+ para mexer em dinheiro/auth/banco.
- [ ] Plano mínimo tem 3–7 passos, não 20.

## Erros comuns que esta skill deve evitar

- Paralelizar por empolgação (revisões paralelas custam ~N× tokens).
- Ler o projeto inteiro "para garantir".
- Criar agente para papel de coordenação (despachar/consolidar é da sessão principal).
- Usar a própria skill para tarefa trivial (overhead de decisão).
- Modo econômico como desculpa para pular validação no servidor ou gatilhos de segurança.

## Saída esperada

```text
Modo recomendado: [1–8] — por quê (1 frase)
Skills/agentes necessários: [lista mínima]
Arquivos iniciais a ler: [lista curta]
Risco de conflito de edição: baixo/médio/alto
Plano mínimo: [3–7 passos]
```

## Exemplo de uso

> "Adicionar campo de observações no cadastro de clientes do AtendaPro."

Saída: Modo 3 (toca formulário + banco) — `desenvolvedor-feature` com migração aditiva, `revisor-codigo-geral` no diff; arquivos iniciais: controller/model/view de clientes + SQL; sem paralelismo (1 módulo); plano em 5 passos.

---

## Conexão com o ecossistema

Aplicada pelo `maestro` antes da matriz de roteamento. Paralelismo: `/divide-tarefa-agentes-paralelos`. Debug: `/investiga-bug-hipoteses`. Dupla implementador+revisor: `desenvolvedor-feature` + `revisor-codigo-geral`. Pré-entrega: `/revisa-entrega-final-360` + `guardiao-qualidade-entrega-final`. Prompts prontos: `referencias/prompts-operacao-eficiente-claude-code.md` no vault.

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
