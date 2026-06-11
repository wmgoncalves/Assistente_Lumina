---
name: git-workflow-commits
description: Higiene de Git — mensagens de commit (Conventional Commits), granularidade, branch/PR, descrição de PR, sem segredo no histórico, .gitignore, e remoção segura de segredo já commitado. Use ao commitar, abrir PR, ou organizar histórico. Complementa versioning-change-control (operacional do dia a dia).
---

# git-workflow-commits

Histórico limpo, auditável e sem segredos.

## Quando usar
- Ao commitar / abrir PR / organizar branch.
- Suspeita de segredo commitado.

## Commits (Conventional Commits)
- Formato: `tipo(escopo): resumo no imperativo` — `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `build`, `ci`, `revert`.
- **Uma intenção por commit** (não misturar fix + refactor + feature) — alinha com a ética de patch mínimo.
- Corpo explica **o porquê** (não o quê redundante); referencia issue.
- `BREAKING CHANGE:` no rodapé quando quebra contrato (aciona `/regression-safety`).

## Branch / PR
- Branch curta por tarefa: `feat/...`, `fix/...`; nunca commitar direto na `main` protegida.
- PR pequeno e revisável; descrição com: o que muda, por quê, riscos, como testar, **plano de rollback**.
- Antes do merge: review (delegar a `auditor-seguranca` + `revisor-codigo-geral`), CI verde.

## Segredos no histórico
- Prevenir: `.gitignore` (usar template), pre-commit com gitleaks/trufflehog.
- Se já commitou segredo: **(1) rotacionar a credencial imediatamente** (o segredo está comprometido mesmo após remoção); (2) remover do histórico (`git filter-repo` / BFG) — ação destrutiva, exige `/hitl-checkpoint`; (3) force-push coordenado (avisa `git push --force`).
- Nunca `git add .` sem revisar o que entra.

## Recusas
- `git push --force` em branch compartilhada sem aprovação.
- Reescrever histórico público sem coordenação/HITL.
- Commitar `.env`, chave, dump (o hook e o `.gitignore` já bloqueiam).
- "Squash" que apaga rastreabilidade de decisão importante sem registro.

## Saída
Mensagem(ns) de commit prontas, estratégia de branch, descrição de PR (com riscos/rollback) e, se houver segredo, o plano rotacionar→remover→force-push.

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
