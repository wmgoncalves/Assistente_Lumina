---
name: observability-monitoring
description: Observabilidade e monitoramento de produção — error tracking (Sentry/Bugsnag), uptime, logs estruturados, métricas, tracing, alertas e SLO/SLI. Use ao colocar algo em produção, ao investigar lentidão/erro intermitente, ou ao definir alertas. Complementa logs-and-errors-hardening (logging seguro) com o lado operacional.
---

# observability-monitoring

Enxergar o que acontece em produção — sem vazar dados sensíveis.

## Quando usar
- Antes/depois de publicar (definir como vou saber se quebrou).
- Erro intermitente, lentidão, comportamento estranho relatado.
- Definir alertas, dashboards, SLO.

## Os 3 pilares + uptime
- **Logs** estruturados (JSON) com `correlation_id`; mascarar PII/segredos (aplicar `/logs-and-errors-hardening`). Níveis corretos (debug/info/warn/error).
- **Métricas**: latência (p50/p95/p99), taxa de erro, throughput, saturação (CPU/mem), fila.
- **Tracing**: spans por request em fluxos distribuídos/integrações (OpenTelemetry quando viável).
- **Uptime/health**: endpoint `/health` (sem vazar versão/infra), monitor externo (UptimeRobot/BetterStack), checagem sintética dos fluxos críticos.

## Error tracking
- Sentry/Bugsnag/Logfire: **scrub de PII e segredos** antes de enviar (DSN não é segredo crítico, mas configurar `beforeSend`/data scrubbing).
- Agrupar por fingerprint; alertar em **regressão/novo erro**, não em ruído.
- Source maps privados (não públicos — alinha com `/frontend-hardening`).

## Alertas e SLO
- Definir **SLI** (ex.: % requests < 500ms, taxa de erro < 1%) e **SLO** + orçamento de erro.
- Alertar por **sintoma ao usuário** (erro/latência), não por causa isolada; evitar alert fatigue.
- Runbook por alerta (o que fazer) — alinha com `/incident-diagnosis` e `/backup-and-recovery-strategy`.

## Ambiente alvo (hospedagem compartilhada)
- Sem agente permanente: usar logs do cPanel + serviço externo de uptime + error tracking SaaS leve. Sem worker permanente (cron para agregação).

## Recusas
- Logar PII/segredo/token "para debugar".
- Expor stack trace, versão ou infra no `/health` ou ao usuário.
- Alerta sem runbook / sem dono.

## Saída
Plano de instrumentação (o que logar/medir/alertar), config de scrubbing, endpoint de health, SLO proposto e runbook por alerta crítico.

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
