---
name: cria-card-institucional-premium
description: Use esta skill quando precisar criar direção de arte e prompt de card institucional premium (feed, story, capa) para clientes da DV Digital — Scapini, Translíquidos, 365 Logística, Blue Seguros e outros. Garante identidade visual, hierarquia, legibilidade, proporção correta e regras negativas anti-bug.
---

# cria-card-institucional-premium

## O que esta skill faz

Transforma um pedido de card/arte institucional em uma **direção de arte completa**: especificação visual (formato, grid, margens, tipografia, paleta), texto hierarquizado do card e, quando for gerar por IA, o prompt de imagem com regras negativas. O resultado deve parecer **premium**: limpo, profissional, com respiro e foco em uma mensagem só.

## Quando usar

- Card de feed, story, capa ou destaque para cliente recorrente.
- Comunicado institucional (aviso, vaga, data comemorativa, campanha interna).
- Card de serviço/diferencial para tráfego orgânico ou pago.
- Padronização de série de cards (mesmo sistema visual em N peças).

## Entradas necessárias

1. **Cliente** (define identidade): consultar playbook em `10-Projetos/<cliente>/` no vault. Identidades já decididas: Scapini = Exo 2 / vermelho; Translíquidos = Montserrat / azul; DV Digital = minimalista (ver `/ui-brand-fidelity`).
2. **Objetivo do card** (informar, atrair lead, autoridade, vaga, data).
3. **Mensagem principal** (uma só) + apoio opcional + CTA se houver.
4. **Formato**: feed 1080×1080 (1:1), retrato 1080×1350 (4:5), story 1080×1920 (9:16).
5. **Assets reais disponíveis**: logo, fotos próprias, cores oficiais. Se faltar, **perguntar — nunca inventar**.

## Processo obrigatório

1. Identificar cliente e carregar identidade (fonte, paleta, tom). Sem identidade definida → perguntar antes.
2. Definir a **hierarquia em 3 níveis**: (1) mensagem principal dominante, (2) apoio, (3) marca/CTA. Um único ponto focal (`/ui-visual-hierarchy`).
3. Especificar o layout: grid, margens de segurança (mín. 5% por lado; story: respeitar zonas de UI do app no topo/rodapé), área do logo, alinhamentos.
4. Especificar tipografia: família da marca, tamanhos relativos (título ≥ 2× o apoio), peso, contraste mínimo 4.5:1 sobre o fundo.
5. Se a imagem for gerada por IA: montar o prompt com `/cria-prompt-imagem-corporativa`, deixando o texto e o logo para aplicação manual (Canva/editor) — IA não renderiza texto e logo com fidelidade.
6. Listar regras negativas da peça (ver erros comuns).
7. Entregar a direção completa + variação para os demais formatos solicitados.

## Checklist de qualidade

- [ ] Uma única mensagem principal; nada compete com ela.
- [ ] Fonte e cores são as oficiais do cliente (não aproximações).
- [ ] Contraste de texto ≥ 4.5:1; legível em tela de celular a um braço de distância.
- [ ] Margens de segurança respeitadas; nada cortado nos formatos de destino.
- [ ] Espaço reservado para o logo real (nunca logo gerada por IA).
- [ ] Estética premium: respiro, poucos elementos, sem sombras/efeitos excessivos.
- [ ] CTA (quando houver) claro e único.
- [ ] Sem dados inventados (telefones, números, depoimentos, selos).

## Erros comuns que esta skill deve evitar

- Logo falsa ou redesenhada pela IA.
- Texto renderizado pela IA (sai deformado) — texto entra na edição, não no prompt.
- Card poluído: 3+ mensagens, 3+ fontes, ícones genéricos em excesso.
- Cores "parecidas" com as da marca em vez das exatas.
- Story com conteúdo nas zonas cobertas pela UI do Instagram/WhatsApp.
- Tom genérico de banco de imagem — sem relação com a operação real do cliente.
- Anatomia quebrada, objetos impossíveis, caminhões/equipamentos irreais em clientes de logística.

## Saída esperada

```text
1. DIREÇÃO DE ARTE
   - Cliente, objetivo, formato(s)
   - Layout (grid, margens, posição de cada elemento)
   - Tipografia (família, tamanhos, pesos)
   - Paleta (códigos hex oficiais)
2. TEXTO DO CARD (título / apoio / CTA / assinatura)
3. PROMPT DE IMAGEM DE FUNDO (se aplicável) + regras negativas
4. CHECKLIST de aplicação manual (logo, texto, exportação)
```

## Exemplo de uso

> "Card de feed para a Scapini sobre segurança na operação."

Saída: direção 1080×1350 com Exo 2, vermelho institucional sobre foto escurecida de operação real (ou prompt de imagem corporativa de caminhão-tanque genérico SEM logomarcas), título "Segurança não é etapa. É rotina.", apoio curto, espaço para logo Scapini no rodapé direito, regras negativas (sem logo IA, sem texto na imagem, sem placas legíveis).

---

## Conexão com o ecossistema

Trabalha junto com: `/ui-brand-fidelity` (identidade por cliente), `/ui-visual-hierarchy` (ponto focal), `/cria-prompt-imagem-corporativa` (prompt do fundo), agente `designer-prompt-visual`. Hierarquia global preservada: estética nunca acima de veracidade (nada de prova social inventada).

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
