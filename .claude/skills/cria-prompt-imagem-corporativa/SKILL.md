---
name: cria-prompt-imagem-corporativa
description: Use esta skill quando precisar gerar prompt detalhado para IA de imagem (Midjourney, DALL-E, Ideogram, Canva IA) em contexto corporativo — fundos de card, fachadas, banners, mockups, campanhas e artes publicitárias. Estrutura o prompt em camadas e aplica regras negativas anti-bug.
---

# cria-prompt-imagem-corporativa

## O que esta skill faz

Converte um pedido solto ("uma imagem de caminhão para o card") em um **prompt profissional em camadas** — assunto, composição, iluminação, lente, estilo, paleta, contexto — mais o **negative prompt** que evita os defeitos clássicos de imagem gerada por IA. Também decide o que NÃO deve ir no prompt (texto, logo, rosto de pessoa real).

## Quando usar

- Fundo de card institucional ou anúncio.
- Banner de site/landing page.
- Mockup de produto digital (planilha, e-book, dashboard).
- Fachada/ambiente conceitual para apresentação.
- Imagem de campanha quando não há foto própria do cliente.

## Entradas necessárias

1. Uso final da imagem (card, hero de LP, anúncio…) e proporção (1:1, 4:5, 9:16, 16:9).
2. Cliente/segmento e paleta da marca (a imagem deve aceitar a sobreposição da identidade).
3. Assunto principal e clima desejado (sério, acolhedor, tecnológico, premium).
4. Ferramenta de geração, se conhecida (sintaxe varia: Midjourney aceita `--ar`, `--no`; outras usam campo negativo separado).
5. Restrições do cliente (ex.: transportadora que não opera caminhão X; clínica que não mostra procedimento Y).

## Processo obrigatório

1. Confirmar que **texto, logo e marcas registradas ficam FORA do prompt** — entram na edição manual.
2. Montar o prompt em camadas:

```text
[ASSUNTO] sujeito principal + ação + ambiente
[COMPOSIÇÃO] enquadramento, ângulo, regra dos terços, espaço negativo para texto
[LUZ] tipo (golden hour, estúdio, difusa), direção, clima
[LENTE/CÂMERA] 35mm/50mm/85mm, profundidade de campo, foto realista ou ilustração
[ESTILO] fotografia corporativa / 3D clean / flat premium — um só
[PALETA] tons dominantes compatíveis com a marca
[QUALIDADE] high detail, sharp focus, proporção
```

3. Reservar **espaço negativo** deliberado onde o título do card vai entrar.
4. Montar o negative prompt padrão e acrescentar os específicos do caso.
5. Adaptar sintaxe à ferramenta e entregar 1 prompt principal + 1–2 variações.

## Checklist de qualidade

- [ ] Sem pedido de texto/letreiro/logo dentro da imagem.
- [ ] Proporção declarada compatível com o uso final.
- [ ] Espaço negativo previsto para sobreposição de texto.
- [ ] Estilo único e coerente (não misturar foto realista com cartoon).
- [ ] Paleta compatível com a marca do cliente.
- [ ] Negative prompt presente.
- [ ] Sem pessoa identificável real, sem marca de terceiros, sem placa legível.

## Erros comuns que esta skill deve evitar

- Texto gerado pela IA (sempre sai bugado).
- Logo inventada ou marca de terceiro reconhecível.
- Anatomia quebrada: mãos com 6 dedos, membros fundidos — sempre no negative.
- Veículos/equipamentos impossíveis (caminhão com 2 cabines, eixo flutuante).
- Layout poluído sem área para texto.
- Prompt vago ("imagem bonita de logística") — sem camadas, sem controle.
- Misturar 3 estilos no mesmo prompt.

## Saída esperada

```text
PROMPT PRINCIPAL (em inglês, em camadas, pronto para colar)
NEGATIVE PROMPT (defeitos + exclusões específicas do caso)
PARÂMETROS (proporção, qualidade, sintaxe da ferramenta)
VARIAÇÕES (1–2 alternativas de composição)
NOTA DE EDIÇÃO (o que aplicar manualmente: texto, logo, filtro da marca)
```

## Exemplo de uso

> "Fundo para card da Translíquidos, transporte de líquidos, tom sério."

Saída: prompt de caminhão-tanque branco sem marcas em rodovia ao amanhecer, composição com terço direito livre para texto, luz fria azulada (paleta da marca), lente 35mm, estilo fotografia corporativa; negative: no text, no logos, no license plates, no deformed truck, no extra axles; `--ar 4:5`.

---

## Conexão com o ecossistema

Alimenta `/cria-card-institucional-premium` e `/roteiriza-video-reels-institucional` (thumbnails). Identidade por cliente: `/ui-brand-fidelity`. Agente: `designer-prompt-visual`.

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
