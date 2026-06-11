---
name: divide-tarefa-agentes-paralelos
description: Use esta skill antes de paralelizar agentes numa tarefa grande — divide em frentes realmente independentes, define dono único por arquivo (config global, migrations, CSS e rotas nunca compartilhados), prevê conflitos e estabelece a ordem e o formato de consolidação dos resultados.
---

# divide-tarefa-agentes-paralelos

## O que esta skill faz

Transforma uma tarefa grande em **frentes paralelas seguras**: testa se a divisão é realmente independente, atribui dono único a cada arquivo, lista o que fica FORA do paralelismo e define como os resultados serão consolidados sem relatório duplicado. Se a independência não existir, a recomendação é honesta: **não paralelizar**.

## Quando usar

- Modo 6 (equipe paralela) escolhido pela `/escolhe-modo-execucao`.
- Revisão paralela somente leitura (modos 4–5) com 2+ lentes.
- Sempre que dois ou mais agentes forem trabalhar na mesma base ao mesmo tempo.

## Entradas necessárias

1. Objetivo final único da tarefa.
2. Mapa do módulo/projeto (estrutura de pastas; sem abrir tudo).
3. O que cada frente candidata precisaria LER e ALTERAR.
4. Dependências entre frentes (B precisa do resultado de A?).

## Processo obrigatório

1. **Teste de independência** (os 3 precisam passar para paralelizar ESCRITA):
   - Arquivos de escrita disjuntos entre frentes?
   - Nenhuma frente depende do resultado da outra para começar?
   - O custo de coordenar é menor que o ganho de tempo?
   Falhou algum → executar sequencial (ou paralelizar só a parte de leitura/análise).
2. **Posse de arquivos** — regra de dono único:

```text
SEMPRE FORA do paralelismo (dono = sessão principal/maestro):
  config global (.env, config/, CLAUDE.md, .htaccess)
  migrations/schema de banco (centralizadas, sequenciais)
  CSS global / design system
  rotas globais
  arquivos compartilhados por 2+ frentes (tirar do paralelo)
```

3. **Contrato por frente**: missão (1 frase) · arquivos permitidos (ler/alterar) · arquivos proibidos · entregável esperado · limite de escopo ("não mexer em X mesmo que pareça útil").
4. **Leitura paralela é barata e segura; escrita paralela é cara e arriscada** — revisão/auditoria/pesquisa paralelizam livremente em somente leitura; implementação exige o teste do passo 1.
5. **Consolidação** (papel da sessão principal, não de um agente extra): juntar achados → agrupar duplicados → classificar crítico/alto/médio/baixo → separar obrigatório de opcional → plano mínimo + o que NÃO corrigir agora. Cada frente devolve resumo curto (máx. ~10 achados por lente em revisões).
6. Conflito detectado no meio da execução → pausar a frente, consolidar o que há, reatribuir.

## Checklist de qualidade

- [ ] Teste de independência aplicado e documentado.
- [ ] Todo arquivo tocado tem exatamente 1 dono.
- [ ] Config global, migrations, CSS global e rotas fora do paralelo.
- [ ] Cada frente com missão, limites e entregável definidos ANTES de começar.
- [ ] Ordem de consolidação definida (quem integra primeiro).
- [ ] Recomendação "não paralelizar" dada quando o teste falha (sem constrangimento).

## Erros comuns que esta skill deve evitar

- Paralelizar frentes que compartilham o mesmo arquivo "só um pouquinho".
- Frente de testes começando antes da implementação existir (dependência ignorada).
- Criar agente coordenador/consolidador — coordenação é da sessão principal.
- Frentes sem limite de escopo (cada uma "melhora" o que vê pela frente).
- Consolidação que vira relatório triplicado em vez de decisão única.
- Paralelizar tarefa pequena (overhead > ganho).

## Saída esperada

```text
VEREDITO: paralelizar [N frentes] / NÃO paralelizar (motivo)
FRENTE 1: missão · arquivos permitidos · proibidos · entregável
FRENTE 2: …
FORA DO PARALELO (dono = sessão principal): [lista]
CONFLITOS PREVISTOS + mitigação
ORDEM DE CONSOLIDAÇÃO + formato (crítico/alto/médio/baixo, obrigatório×opcional)
```

## Exemplo de uso

> "Módulo de agendamentos do AtendaPro: backend, telas e testes."

Saída: NÃO paralelizar escrita de backend+testes (testes dependem da API pronta); paralelizar fase 1 = backend (escrita) ∥ revisão de UX das telas atuais (leitura); fase 2 = frontend (escrita) ∥ casos de teste (escrita em pasta própria); migrations e rotas com a sessão principal; consolidação: backend → frontend → testes → revisão final.

---

## Conexão com o ecossistema

Acionada pelo modo 6 da `/escolhe-modo-execucao`. Implementação de cada frente segue os gatilhos normais (§13: preservação, dependências). Revisão 360: `/revisa-entrega-final-360`. Mudança arriscada numa frente → worktree (modo 8).

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
