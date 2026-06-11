---
name: melhora-direcao-arte-premium
description: Use esta skill quando uma arte, card, campanha ou conceito visual já existir mas estiver "correto porém sem força" — aplica o olhar de diretor de arte sênior para diagnosticar composição, hierarquia, legibilidade e preguiça visual, e devolve direção superior + prompt melhorado.
---

# melhora-direcao-arte-premium

## O que esta skill faz

É o lado **revisão/elevação** do design (o lado criação é `/cria-card-institucional-premium`). Diagnostica por que uma peça visual parece comum — onde falta intenção, contraste, respiro, personalidade — e propõe a direção de arte superior: paleta de apoio, uso de tipografia, estrutura de layout e, quando a peça usa IA, o prompt final melhorado.

## Quando usar

- Card/arte pronto que "está certo mas não impressiona".
- Série de posts que ficou monótona (preguiça visual).
- Conceito de campanha antes de produzir as N peças.
- Material recebido de terceiro/IA para elevar ao padrão DV Digital.
- Cliente reclamou que "ficou simples demais" ou "não parece premium".

## Entradas necessárias

1. A peça/conceito atual (imagem, descrição fiel ou prompt usado).
2. Cliente e identidade (playbook + `/ui-brand-fidelity`) — a melhoria nunca troca a marca.
3. Objetivo da peça e canal (feed, story, anúncio, impressão).
4. O que o cliente já rejeitou antes (para não propor de novo).

## Processo obrigatório

1. **Diagnóstico visual em 5 eixos** (apontar onde, não só "está fraco"):
   - **Composição**: ponto focal único? olho tem caminho? elementos competindo?
   - **Hierarquia**: 3 níveis claros? o mais importante é o maior/mais contrastado?
   - **Legibilidade**: contraste ≥ 4.5:1? texto sobre área limpa? tamanho ok no celular?
   - **Preguiça visual**: onde falta intenção, respiro, contraste, personalidade, sofisticação — o que está só "preenchendo espaço"?
   - **Identidade**: parece DESTA marca ou de qualquer empresa do setor?
2. **Direção superior**: o que mudar em layout (grid, margens, proporção dos elementos), tipografia (pesos, escala — contraste tipográfico é a sofisticação mais barata), paleta de apoio (tons da própria marca, não cores novas) e fotografia/imagem (luz, recorte, escala).
3. **Lista do que evitar** nesta peça (efeitos, sombras duras, ícones genéricos, excesso).
4. Se for IA: **prompt final melhorado** via `/cria-prompt-imagem-corporativa` (camadas + negative).
5. Validar que a direção nova preserva: identidade, legibilidade, acessibilidade e veracidade (sem logo IA, sem prova inventada).

## Checklist de qualidade

- [ ] Diagnóstico aponta o problema com localização ("o título compete com o ícone"), não genérico.
- [ ] Direção usa a identidade existente — não inventa rebranding.
- [ ] Melhorias executáveis com as ferramentas reais (Canva/editor + IA de imagem).
- [ ] Hierarquia final tem 1 ponto focal.
- [ ] Sofisticação por subtração (tirar) considerada antes de adição.
- [ ] Nada do que o cliente já rejeitou volta como proposta.

## Erros comuns que esta skill deve evitar

- "Melhorar" adicionando elementos (mais ícones, mais efeitos) — premium é quase sempre menos.
- Trocar a paleta/fonte da marca em nome da estética.
- Sofisticar a ponto de perder legibilidade ou o CTA.
- Criticar sem dar a direção executável.
- Propor produção inviável (foto profissional inexistente, 3D complexo).

## Saída esperada

```text
1. DIAGNÓSTICO (composição · hierarquia · legibilidade · preguiça visual · identidade)
2. DIREÇÃO SUPERIOR (layout, tipografia, paleta de apoio, imagem)
3. EVITAR NESTA PEÇA (lista negativa)
4. PROMPT MELHORADO (se IA) + nota de aplicação manual
5. ANTES → DEPOIS em 3 frases (para explicar ao cliente, se útil)
```

## Exemplo de uso

> "Esse card da 365 ficou sem graça, melhora a direção."

Saída: diagnóstico — sem ponto focal (título, foto e selo com mesmo peso), tipografia em peso único, fundo genérico de estrada; direção — título 2.5× maior em peso black, foto escurecida com luz lateral, selo reduzido ao rodapé, respiro dobrado nas margens; evitar — gradiente arco-íris, ícone de caminhão clip-art; prompt de fundo refeito com `--ar 4:5` e espaço negativo à esquerda.

---

## Conexão com o ecossistema

Criação: `/cria-card-institucional-premium`. Prompt: `/cria-prompt-imagem-corporativa`. Fundamentos: `/ui-visual-hierarchy`, `/ui-gestalt-proximity`, `/ui-brand-fidelity`. UI de produto: `revisor-design-ui`. Agente: `provocador-criativo-dv-digital` + `designer-prompt-visual`.

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
