---
name: accessibility-wcag-audit
description: Auditoria operacional de acessibilidade WCAG 2.2 AA (direito legal — LBI 13.146/2015). Use ao criar/alterar qualquer interface, formulário, componente ou página, e antes de publicar. Cobre contraste, foco visível, navegação por teclado, ARIA, leitores de tela, alvos de toque, texto alternativo, legendas e ordem de leitura. Complementa /ui-final-design-review focando no direito de acesso.
---

# accessibility-wcag-audit

Acessibilidade é **direito legal** (LBI 13.146/2015, Decreto 9.508/2018) e fica acima de UI/UX/estética/conversão na hierarquia — análoga à privacidade. Nenhuma decisão estética pode remover acessibilidade existente.

## Quando usar
- Ao criar/alterar UI, formulário, modal, menu, tabela, carrossel, componente interativo.
- Antes de publicar (junto com `/ui-final-design-review`).
- Ao revisar HTML/CSS/JS, React, Vue, templates PHP.

## Checklist WCAG 2.2 AA (operacional)

### Perceptível
- [ ] **Contraste** texto normal ≥ 4.5:1; texto grande (≥24px ou 18.66px bold) e ícones/bordas de UI ≥ 3:1.
- [ ] **Texto alternativo** em toda imagem informativa (`alt` descritivo); imagem decorativa com `alt=""`.
- [ ] **Não depender só de cor** para transmitir informação (erro/sucesso também com ícone/texto).
- [ ] **Mídia**: vídeo com legenda; áudio com transcrição.
- [ ] **Reflow**: utilizável a 320px de largura sem scroll horizontal (zoom 400%).
- [ ] **Texto redimensionável** a 200% sem perda de conteúdo/função.

### Operável
- [ ] **Teclado**: tudo acessível por Tab/Shift+Tab/Enter/Espaço/setas; sem armadilha de foco (keyboard trap).
- [ ] **Foco visível** (WCAG 2.2 — 2.4.11): indicador de foco claro, contraste ≥ 3:1, não obscurecido.
- [ ] **Ordem de foco** lógica e previsível (segue a leitura).
- [ ] **Skip link** "pular para o conteúdo".
- [ ] **Alvos de toque** ≥ 24×24px (2.5.8 AA; mire 44×44 quando possível).
- [ ] **Sem dependência de gesto complexo** (arrastar tem alternativa — 2.5.7).
- [ ] **Sem flashes** > 3x/segundo (risco de convulsão).
- [ ] **Tempo**: avisos/sessões com opção de estender; sem timeout silencioso.

### Compreensível
- [ ] `lang` no `<html>` (ex: `pt-BR`).
- [ ] **Labels** associadas a inputs (`<label for>` ou `aria-label`); placeholder NÃO é label.
- [ ] **Erros de formulário** identificados em texto, associados ao campo (`aria-describedby`), com sugestão de correção (3.3.1/3.3.3).
- [ ] **Entrada redundante** (3.3.7): não repedir info já fornecida na mesma sessão.
- [ ] Navegação consistente entre páginas.

### Robusto
- [ ] HTML válido; landmarks (`<header><nav><main><footer>`), um `<h1>`, hierarquia de headings sem pular níveis.
- [ ] **ARIA só quando necessário** (HTML nativo primeiro). `role`, `aria-expanded`, `aria-controls`, `aria-live` corretos.
- [ ] Componentes custom (dropdown, tabs, modal, accordion) seguem o **WAI-ARIA Authoring Practices**.
- [ ] **Foco gerenciado** em modal (move para o modal, retorna ao gatilho ao fechar; `Esc` fecha).
- [ ] Mensagens dinâmicas em `aria-live` (região polite/assertive).

## Recusas
- Remover foco visível (`outline: none`) sem substituto equivalente.
- Usar `div`/`span` clicável sem `role`/teclado em vez de `<button>`/`<a>`.
- Placeholder como única label.
- Contraste abaixo do mínimo "por estética".
- Carrossel/auto-play sem controle de pausa.

## Como testar
- **Teclado**: navegue a página inteira sem mouse.
- **Leitor de tela**: NVDA (Windows), VoiceOver (Mac), TalkBack (Android).
- **Automático** (pega ~30–40%): axe DevTools, Lighthouse a11y, WAVE, Pa11y. O resto exige teste manual.
- **Contraste**: verificar tokens de cor no design system (`/ui-minimal-design-system`).

## Saída
Tabela: **Critério WCAG · Status (OK/Falha/N.A.) · Elemento (seletor) · Correção mínima**. Priorize falhas que bloqueiam uso por teclado e leitor de tela. Preserve marcação/comportamento existente ao corrigir (combina com `/preserve-existing-behavior`).

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[18-ux-funcional|🎯 Skill 18 — UX]] · [[agents-claude-code-MOC|🤖 Agentes]]
