# Sessão Noturna — 19 de junho de 2026

## Resumo
Sessão autônoma noturna com pesquisa web e implementação de melhorias em 5 frentes simultâneas: conhecimento técnico do CGI Consultors, dados reais do setor de transporte 2024-2025, personalidade mais humana e natural da Lúmina, calibração de prompts e thinkingBudget, e correções de estabilidade/QA. Total de ~130 linhas adicionadas, ~30 corrigidas.

## Frentes concluídas
- [x] FRENTE 1 — CGI/Consultors
- [x] FRENTE 2 — Setor de transporte
- [x] FRENTE 3 — Lúmina mais humana
- [x] FRENTE 4 — Lúmina mais inteligente
- [x] FRENTE 5 — QA estabilidade

## O que foi adicionado/corrigido

### FRENTE 1 — CGI/Consultors (detectLocalInfo)
- Bloco CGI expandido de 3 para **7 respostas** em dois blocos (sistema + Phase 2)
- Identifica a Consultors como **CGI Consultoria Gaúcha de Informática Ltda** — softhouse do RS
- Detalha todos os **8 módulos ativos**: Fiscal (CT-e/MDFe), Operacional, Frota, Manutenção, Financeiro, DRE, RH, Relatórios
- Cobre **terminologia interna** usada pelos funcionários: "abrir viagem", "fechar viagem", "empresa 12", "relatório de posição", "lançar no CGI"
- Fluxo de viagem expandido para 2 respostas com 8 etapas detalhadas
- **Novo bloco Phase 2**: o que a Lúmina fará integrada ao CGI via API (consulta de status, disponibilidade, DRE, alertas)
- Regex de detecção expandido: `+cgi.*modulo`, `+cgi.*erp`, `+como.*abre.*viagem`, `+como.*fecha.*viagem`, `+cgi.*phase`, `+lumina.*integr.*cgi`

### FRENTE 2 — Setor de transporte (detectLocalInfo)
- **Tabela ANTT 2025**: piso mínimo obrigatório, valores por tipo de carga e eixos
  - Truck 6 eixos: ~R$ 3,57/km | Carreta LS: ~R$ 3,09/km | Bitrem: ~R$ 3,83/km
  - Reajuste fev/2025: +2,13% base IPCA + diesel S-10 referência R$ 6,02/L
  - Link oficial: calculadorafrete.antt.gov.br
- **Diesel RS**: média nacional ANP ~R$ 6,06/L, custo por km calculado (~R$ 2,14/km)
  - Impacto em viagem Lajeado–São Paulo (1.100 km): ~R$ 2.357 só em combustível
- **Mercado 2024-2025**: crescimento 7% no 1º semestre de 2025, fracionadas +40% em 2024
  - Modal rodoviário = 64% da movimentação nacional
  - Projeção: US$ 54,2 bilhões até 2029 (CAGR 4,8%)
- **Custo operacional**: R$ 3,35–3,85/km para carreta, composição de custos detalhada
  - Diesel ~40%, manutenção ~15%, pneus ~8%, motorista ~20%, seguro ~7%, pedágio ~10%
- **Regulamentações ANTT**: RNTRC, CIOT obrigatório, jornada Lei 13.103/2015, SASSMAQ

### FRENTE 3 — Lúmina mais humana
- **buildSystem()**: novas diretivas de personalidade:
  - DATA ATUAL dinâmica injetada no system prompt (`${new Date().toLocaleDateString(...)}`)
  - Diretiva de EMPATIA: reconhecer frustração antes de resolver
  - Diretiva de NATURALIDADE: usar contrações e expressões do português coloquial
  - Diretiva RESPOSTAS LONGAS: blocos curtos, bullets, nunca parágrafos enormes
  - Proibição explícita de "Claro!", "Certamente!", "Com prazer!" (frases de chatbot genérico)
  - Variação de início de resposta enforçada
- **Agradecimentos** (tryLocalResponse): ampliado de 5 para 8 respostas variadas e naturais
- **Despedidas** (tryLocalResponse): 4 opções por período do dia (antes: 2-3), tom mais caloroso
- **Cumprimentos**: followUp com pick() entre 3 opções ao invés de string fixa
- **localFallback() final**: 6 respostas variadas, mais naturais, menos genéricas (antes: 3)

### FRENTE 4 — Lúmina mais inteligente
- **`_thinkingBudget()`** — nível 2048 expandido com padrões Scapini:
  - `tabela.*antt`, `piso.*minimo`, `custo.*operacional.*km`, `roi.*frota`
  - `inadimplencia`, `cobrança.*juridica`, `rescisão.*contrato`, `multa.*contratual`
  - `renegociação`, `contrato.*cliente`, `auditoria.*cgi`, `divergência.*faturamento`
  - `margem.*contribuição`, `rentabilidade.*cliente`, `custo.*filial`, `resultado.*filial`
- **`_thinkingBudget()`** — nível 512 expandido com procedimentos Scapini:
  - `ciot.*como`, `como.*emite.*cte`, `como.*abre.*viagem`, `como.*fecha.*viagem`
  - `procedimento.*sinistro`, `protocolo.*acidente`, `checklist.*veiculo`
  - `onboarding.*motorista`, `sassmaq`, `rntrc`, `documentacao.*carga`
  - `norma.*antt`, `regulamentacao`, `como.*funciona.*cgi`, `modulo.*cgi`
- **`FRETE_CMD`** — regex expandido para capturar mais variações naturais:
  - `quanto sai`, `quanto seria`, `me faz uma cotação`, `calcule o frete`
  - `calcule o transporte`, `custo de frete`, `custo do transporte`
  - `levar uma carga`, `transportar de/para`, `quanto fica pra levar`

### FRENTE 5 — QA estabilidade
- **`openWebPopup()`**: guarda `if (!frame || !modal) return;` antes de `frame.src = ''`
  (crash possível se web-frame não existisse no DOM)
- **`openCamera()`**: substituído acesso direto por variável com guarda + `?.classList`
- **`closeCamera()`**: trocado `.classList` por `?.classList` no cam-modal
- **`captureAndAnalyze()`**: adicionado guarda `if (!vid || !canvas)` com toast de erro
- **`showWebError()`**: verifica `if (frame)` antes de `frame.style.display = 'none'`
- **`closeWebPopup()`**: usa `?.classList` no web-modal e guarda no web-frame
- **DEMO_QA regex genérico** (localFallback, linha ~6680): adicionado `\b` word boundaries
  (antes: `/dica|ideia/` poderia capturar substrings de palavras maiores)
- CNPJ regex verificado — captura corretamente `05.896.206/0001-65` e `05896206000165` ✓
- `_findMotorista()` verificado — normalização NFD/U+0300-U+036F correta ✓

## Commits desta sessão
- `be21143` — feat: CGI Consultors — módulos, fluxo de viagem e terminologia interna
  *(inclui também Frentes 2, 3 e 4 — foram staged juntas neste commit)*
- `f3d4a4b` — fix: QA estabilidade — getElementById, DEMO_QA, câmera, web modal

## Pendências / próxima sessão
- Criar commits separados para Frentes 2, 3 e 4 (foram comitadas junto com Frente 1)
- Testar FRETE_CMD expandido com frases naturais: "quanto sai levar carga de Lajeado pra SP?"
- Adicionar mais motoristas ao MOTORISTAS_DEMO com dados variados (turno, experiência, veículos)
- Enriquecer bloco de operação Souza Cruz/BAT com mais terminologia interna
- Validar data dinâmica no system prompt do Gemini em sessão real
- Considerar adicionar variações de contexto de "bom humor" para apresentação ao vivo (julho/2026)
- Revisar se `_thinkingBudget` nível 512 para `cgi` não está sobrecarregando chamadas simples
