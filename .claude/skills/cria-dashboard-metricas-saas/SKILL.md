---
name: cria-dashboard-metricas-saas
description: Use esta skill para criar dashboards de métricas e KPIs em sistemas, SaaS e painéis de cliente — definir os indicadores certos para a decisão certa, cards, gráficos, filtros por período, comparativos e as queries necessárias. Evita dashboard bonito e inútil.
---

# cria-dashboard-metricas-saas

## O que esta skill faz

Projeta o **dashboard que sustenta decisão**: parte de quem usa e qual decisão precisa tomar, escolhe os KPIs mínimos, define cards/gráficos/filtros e entrega as queries (com atenção a volume). Vale para dashboard interno de SaaS e para painel de resultados de cliente (tráfego, leads, vendas).

## Quando usar

- Dashboard inicial ou gerencial de sistema/SaaS.
- Painel de resultados para cliente da DV (campanhas, leads, atendimento).
- Tela de relatórios que virou "monte de números" sem leitura.
- Definir métricas de um módulo novo antes de construir.

## Entradas necessárias

1. **Quem usa e qual decisão toma** com esse painel (a pergunta que mata o enfeite).
2. Dados que EXISTEM hoje (tabelas/fontes) — KPI sem dado é promessa.
3. Período de análise natural do negócio (dia, semana, mês).
4. Volume de dados (define agregação prévia vs query direta).
5. Quem NÃO pode ver o quê (financeiro por perfil; multi-tenant filtrado).

## Processo obrigatório

1. **Para cada perfil, responder**: qual decisão? → qual pergunta o painel responde? → qual métrica responde a pergunta? Métrica que não alimenta decisão é cortada.
2. **Hierarquia da tela** (`/ui-visual-hierarchy`): linha 1 = 3–5 cards do estado atual (número grande + comparativo vs período anterior + tendência ↑↓); linha 2 = gráfico principal da série temporal; depois = quebras (por serviço, canal, responsável) e lista de pendências/anomalias.
3. **Gráfico certo por pergunta**: evolução → linha; comparação entre categorias → barra; composição → pizza/donut só com ≤ 5 fatias; funil → funil. Nada de 3D, nada de gráfico para 2 números.
4. **Filtros mínimos**: período (com presets: hoje/7d/30d/mês) + 1–2 dimensões que mudam a leitura; filtro de tudo = tela confusa.
5. **Comparativos honestos**: sempre vs período anterior equivalente; cuidado com mês incompleto (comparar até o mesmo dia).
6. **Queries**: agregadas no banco (GROUP BY com índice — `/estrutura-banco-dados-mysql`), nunca trazer linhas cruas para somar no PHP/JS; volume grande → tabela de agregados diários alimentada por cron do cPanel.
7. **Alertas simples** quando houver decisão urgente: limite definido pelo dono (ex.: CPL acima de X, faltas acima de Y) — destaque visual, não notificação em massa.
8. Estados: loading (skeleton nos cards), vazio com explicação ("sem dados no período"), erro amigável.

## Checklist de qualidade

- [ ] Cada KPI tem dono, decisão e pergunta que responde.
- [ ] ≤ 5 cards na primeira dobra; número grande legível no celular.
- [ ] Comparativos com período equivalente (sem distorção de mês incompleto).
- [ ] Queries com caminho de índice; volume grande tem agregação prévia.
- [ ] Permissões: perfil vê só o que pode; tenant vê só o seu.
- [ ] Filtros com presets; estado vazio explicado.
- [ ] Zero métrica de vaidade ocupando lugar nobre.

## Erros comuns que esta skill deve evitar

- Dashboard-vitrine: 12 gráficos que ninguém usa para decidir nada.
- Somar/agregar no frontend trazendo milhares de linhas.
- Pizza com 9 fatias; gráfico 3D; eixo Y cortado que engana.
- Comparar mês corrente inteiro vs mês passado completo.
- Expor financeiro a perfil que não deveria ver.
- KPI calculado diferente em telas diferentes (definir a fórmula UMA vez).
- Tempo real onde atualização diária resolve (custo sem valor).

## Saída esperada

```text
1. MAPA DECISÃO → PERGUNTA → KPI (por perfil)
2. LAYOUT (cards linha 1, gráfico principal, quebras, pendências)
3. ESPECIFICAÇÃO de cada KPI (fórmula única, fonte, período)
4. QUERIES (agregadas, com índice sugerido) + estratégia para volume
5. FILTROS + presets · ALERTAS com limites
6. RESPONSIVIDADE (como os cards/gráficos empilham no mobile)
```

## Exemplo de uso

> "Dashboard para o dono da barbearia no AtendaPro."

Saída: decisão = "preciso agir hoje?"; cards: agendamentos hoje, ocupação da semana, faturamento do mês vs anterior, faltas do mês; gráfico de linha de faturamento diário; quebra por barbeiro e por serviço; alerta de faltas > 15%; queries agregadas por `tenant_id+data` com índice composto; mobile = cards empilhados.

---

## Conexão com o ecossistema

Vive dentro do `/cria-painel-admin-saas`. Dados: `/estrutura-banco-dados-mysql` + `/performance-web-vitals` (peso da tela). Visual: `/ui-visual-hierarchy`. Painel de campanha para cliente: métricas de `/planeja-campanha-google-meta`. Agente: `especialista-saas-crm-dashboard`.

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
