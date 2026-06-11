---
name: regression-safety
description: Proteção contra regressão em mudanças de código, refator, atualização de dependência, migração de banco. Aplica política de compatibilidade, SemVer, expand-contract e janela de depreciação. Use em qualquer mudança que pode afetar contrato existente.
---

# regression-safety

Use **sempre que a mudança pode quebrar callers existentes**: API, função pública, schema de banco, contrato externo, formato de retorno, mensagem de erro parseável.

## Princípio

> **Hyrum's Law:** com usuários suficientes do contrato, todos os comportamentos observáveis serão dependidos por alguém — independente do que está documentado.

Tudo que é observável vira contrato implícito. Mudança "interna" pode quebrar consumidor que dependia de detalhe não-documentado.

## Tipos de mudança

### Mudança aditiva (BAIXO risco)
- Adicionar campo opcional em response
- Adicionar novo endpoint
- Adicionar parâmetro opcional
- Adicionar coluna no banco (nullable, com default)
- Adicionar nova feature flag desligada

**Padrão:** seguro, mas testar que o novo campo não quebra cliente velho.

### Mudança expansiva (MÉDIO risco)
- Aceitar input mais flexível (de string para string|number)
- Aceitar formato adicional (json|xml)
- Tornar opcional o que era obrigatório

**Padrão:** OK, mas garantir que o caminho antigo continua válido.

### Mudança restritiva (ALTO risco)
- Validação mais rigorosa
- Limite de tamanho menor
- Rate limit mais apertado
- Campo obrigatório novo
- Remoção de valor enum aceito

**Padrão:** depreciar com warning antes; janela; rollout gradual.

### Mudança quebradora (CRÍTICO)
- Renomear campo público
- Mudar tipo de retorno
- Remover endpoint/função
- Remover/renomear coluna do banco
- Mudar status HTTP em sucesso
- Mudar formato de erro
- Mudar ordem de campos em response (sim, isso quebra parser estrito)

**Padrão:** SemVer MAJOR, ADR, plano de migração, **nunca** silencioso.

## SemVer aplicado

```
MAJOR.MINOR.PATCH
  │     │     └── Bug fix sem mudança de API
  │     └──────── Feature aditiva, retro-compatível
  └────────────── Quebra de contrato (mudança quebradora)
```

### Em API REST
- Versionar via URL (`/v1/users`, `/v2/users`) ou header
- v2 coexiste com v1 por janela definida
- Comunicar deprecação no header `Sunset` ou body

### Em biblioteca
- MAJOR bump = changelog detalhado + guia de migração
- Sem MAJOR bump = sem quebra (princípio absoluto)

## Expand-Contract pattern

Para mudanças quebradoras em produção viva:

### 1. Expand (adicionar o novo, manter o velho)
- Novo campo/endpoint/coluna existe
- Velho continua funcionando
- Aplicação escreve em ambos (dual write)
- Aplicação lê do velho (fonte da verdade)

### 2. Migrate (mover dados/consumidores)
- Backfill: dados antigos copiados para o novo
- Consumidores atualizados um por um para usar o novo
- Aplicação começa a ler do novo (com fallback ao velho)

### 3. Contract (remover o velho)
- Janela de observação: ninguém mais usa o velho?
- Logs/métricas confirmam uso zero
- Removeção do velho

**Tempo entre etapas:** depende da criticidade. Mínimo 30 dias em produção viva.

## Depreciação

### Comunicação
- Documentação atualizada
- Changelog
- Header HTTP `Deprecation: true` + `Sunset: Sat, 31 Dec 2026 23:59:59 GMT`
- Warning em log do consumidor (quando possível)
- E-mail/notificação a clientes da API

### Janela
- Pública (cliente externo): 90-180 dias mínimo
- Interna (mesma empresa): 30-60 dias
- Hotfix de segurança: pode ser imediato com comunicação

## Banco de dados

### Mudanças seguras em migration
- Adicionar coluna nullable
- Adicionar índice (concurrently quando possível)
- Adicionar tabela
- Adicionar foreign key (com tabela já compatível)

### Mudanças quebradoras
- Remover coluna → primeiro deixar de escrever, depois deixar de ler, depois remover
- Renomear coluna → adicionar nova, dual write, migrar leitura, remover antiga (3 deploys)
- Mudar tipo → migration de cópia + dual write
- Adicionar NOT NULL em coluna com dados → backfill primeiro, depois constraint

### Sempre
- Migration reversível (down funcional)
- Backup antes
- Testar em staging com dado realista
- Janela de baixa carga
- Plan de rollback

## Testes de regressão

### Para cada mudança quebradora
- Teste **antes** confirmando comportamento atual
- Teste **depois** confirmando comportamento novo
- Teste de **compatibilidade**: cliente velho consegue funcionar?
- Teste de **migração**: dados antigos foram preservados?

### Contratos
- OpenAPI schema validation em CI
- Pact (consumer-driven contract testing)
- Snapshot test de response (alerta a qualquer mudança)

## Feature flags para mudanças graduais

```
flag: new_payment_flow
  default: false
  rollout: 0% → 10% → 50% → 100% (com observação entre etapas)
```

- Permite reverter sem deploy
- Permite A/B test
- Permite rollout para subgrupo (beta users primeiro)
- Não esquecer de **remover a flag** depois de estabilizada

## Sinais de regressão

Após deploy, monitorar:
- Erros 5xx subiram?
- Latência subiu?
- Erros 4xx em endpoint específico?
- Métricas de negócio caíram? (conversão, retenção)
- Suporte recebendo reclamação nova?
- Logs com erro novo?

Se sim → rollback (rápido) → investigar (calmo).

## Recusas obrigatórias

- Mudar contrato externo sem versionar
- Renomear campo de response em endpoint usado
- Remover endpoint sem evidência de uso zero
- Migration destrutiva sem backup
- Migration sem down funcional
- "Atualizar tudo de uma vez" em dependência
- Refator + correção de bug + feature no mesmo PR
- Reduzir cobertura de teste em refator
- Mudar resposta de erro que cliente externo pode parsear

## Checklist mínimo

- [ ] Contrato atual mapeado (request, response, side effects)
- [ ] Callers identificados (interno + externo)
- [ ] Mudança classificada (aditiva/expansiva/restritiva/quebradora)
- [ ] Se quebradora: SemVer MAJOR, ADR, plano de migração
- [ ] Se em banco: expand-contract, backup, reversível
- [ ] Janela de depreciação definida e comunicada
- [ ] Testes de regressão escritos e verdes
- [ ] Feature flag para rollout gradual quando aplicável
- [ ] Monitoramento ativo no deploy
- [ ] Rollback testado

## Conexão com skills do vault

- Skill 11 (Compatibilidade/Regressão) — versão completa, conceitual
- Skill 00 (Não Quebrar Código) — soberana, preservação primeiro
- Skill 02 (Testes) — teste de regressão
- Skill 12 (Banco/Migrations) — expand-contract no schema
- Skill 13 (Deploy/Rollback) — janela e plano

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
