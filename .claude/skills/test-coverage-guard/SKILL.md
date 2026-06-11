---
name: test-coverage-guard
description: Garante cobertura de testes antes de alterar código, em correção de bug, em refator e em deploy. Define teste primeiro (red), patch (green), regressão. Use sempre que houver alteração funcional, especialmente em código sem teste.
---

# test-coverage-guard

Use **antes de alterar qualquer código** que afeta comportamento observável. Patch sem teste = patch que pode quebrar amanhã.

## Princípios

1. **Bug = teste que falha primeiro** (red), patch que faz passar (green), garantia que não volta
2. **Refator** = testes verdes antes E depois — mesma cobertura
3. **Feature** = teste + código no mesmo PR, nunca "depois"
4. **Código legado sem teste** = capturar comportamento atual (incluindo bugs) antes de mexer
5. **Teste de segurança** = adversarial, não só happy path

## Pirâmide de testes

```
       /\        E2E / smoke         (poucos, lentos, caros — só fluxos críticos)
      /  \
     /----\      Integração          (médio — partes interagindo)
    /------\
   /--------\    Unit                 (muitos, rápidos — lógica isolada)
```

Distribuição saudável: ~70% unit, 20% integração, 10% E2E.

## Tipos de teste por situação

### Unit
- Função pura testada isoladamente
- Mock só o externo (banco, API, FS) — não mockar coisa interna
- Cobertura ideal: lógica de negócio, cálculos, validação, transformação

### Integração
- Componentes reais conversando (controller + service + banco)
- Banco de teste real (não mock)
- Testa contrato entre camadas
- Mais lento, mais fidedigno

### E2E / smoke
- Fluxo completo: clicar no botão → ver resultado
- Playwright, Cypress
- Só **fluxos críticos**: login, checkout, fluxo principal do produto
- Não testar tudo aqui (caro, frágil)

### Regressão
- Teste que cobre **bug específico já corrigido**
- Garante que não volta
- Sempre escrever ao corrigir bug

### Adversarial / negativo
- Input malicioso (XSS payload, SQL injection, path traversal)
- Limites (string gigante, número negativo, null, undefined, vazio)
- Race condition (concorrência)
- Estado inválido
- Falha de dependência (API fora, banco lento)

### Idempotência
- Mesma operação 2x = mesmo resultado
- Crítico em pagamento, webhook, ações financeiras

## Fluxo TDD adaptado

### Para bug
1. **Reproduzir** o bug manualmente
2. **Escrever teste** que falha (red) — captura o bug exato
3. **Patch mínimo** que faz passar (green)
4. **Refator** se necessário, mantendo verde
5. **Garantir** que testes antigos continuam verdes
6. **Commit** com referência ao bug

### Para feature
1. Especificar comportamento esperado
2. Escrever teste do happy path
3. Implementar até passar
4. Escrever testes adversariais
5. Cobrir edge cases
6. Commit/PR único: código + teste + doc

### Para refator
1. Testes verdes **antes** (baseline)
2. Refator em passos pequenos
3. Testes verdes **depois** de cada passo
4. Cobertura **mesma** ou maior — nunca menor
5. Comportamento observável **inalterado**

## Cobertura

### Métricas
- **Lines:** % de linhas executadas
- **Branches:** % de ramos do if/else executados (mais informativo)
- **Functions:** % de funções chamadas

### Metas razoáveis
- Lógica de negócio crítica: > 90% branches
- Código de infraestrutura/glue: > 60% lines
- Frontend: cobertura de componente, não pixel-perfect
- E2E: cobrir caminhos críticos, não totalidade

### Cobertura é métrica, não objetivo
- 100% de cobertura **não significa** sem bug
- Cobertura sem assertion = mentira
- Foque em **mutações sobrevividas** (mutation testing) > linhas executadas

## Testes que NÃO valem

- Teste que sempre passa (sem assertion real)
- Teste que duplica a implementação (testa o "como" em vez do "quê")
- Teste com mock excessivo (testa o mock, não o código)
- Teste flaky (passa às vezes) — corrigir ou deletar
- Teste lento na suite principal (mover para suite separada)
- Teste com dependência de ordem (deveria rodar em qualquer ordem)
- Teste tocando banco/API real em CI sem container/test double

## Teste de segurança específico

Cobertura adversarial deve incluir:

- [ ] XSS: input com `<script>`, `javascript:`, `onerror=`, payloads do OWASP
- [ ] SQL injection: `' OR 1=1 --`, `' UNION SELECT ...`
- [ ] Path traversal: `../../../etc/passwd`, `..\..\..\windows\system32`
- [ ] Command injection: `; rm -rf`, `$(curl ...)`
- [ ] CSRF: requisição sem token
- [ ] IDOR: usuário A acessa recurso de B
- [ ] Mass assignment: campo extra no body (`is_admin: true`)
- [ ] Open redirect: `?url=https://atacante.com`
- [ ] Race condition: duas requisições simultâneas
- [ ] Replay: webhook reenviado
- [ ] Auth bypass: token vencido, manipulado, ausente

## Mock e fixtures

### Quando mock é OK
- API externa (HTTP)
- Sistema de arquivos
- Hora atual (`Date.now()`)
- Random
- Banco em unit test (mas integração deve usar real)

### Quando mock atrapalha
- Mock do que você está testando
- Mock muito profundo (cadeia de mocks)
- Fixture muito complexa (sinal de design ruim)

### Test doubles
- **Dummy:** placeholder
- **Fake:** implementação simplificada (in-memory DB)
- **Stub:** retorna valor fixo
- **Spy:** stub + registra chamadas
- **Mock:** spy + verifica comportamento esperado

## CI/CD

- Testes rodam em **todo PR** — bloqueia merge se vermelho
- Testes rodam em **branch principal** — alerta se vermelho
- Smoke test após deploy em staging
- Smoke test após deploy em produção (subset crítico)

## Recusas obrigatórias

- "Depois eu escrevo o teste"
- Comitar com teste vermelho
- Deletar teste que falha sem entender por quê
- Mock que esconde o bug
- Reduzir cobertura em refator
- Teste apenas no caminho feliz
- Skip permanente sem justificativa documentada

## Checklist mínimo

- [ ] Teste cobrindo cada bug corrigido (regressão)
- [ ] Teste cobrindo cada feature nova (positivo + adversarial)
- [ ] Cobertura > 80% em código de negócio
- [ ] Testes rodam em CI, bloqueando merge se vermelhos
- [ ] Smoke test pós-deploy
- [ ] Testes determinísticos (sem flaky)
- [ ] Testes adversariais para entradas não confiáveis
- [ ] Mocks limitados ao externo

## Conexão com skills do vault

- Skill 02 (Testes Automatizados) — versão completa, conceitual
- Skill 00 (Não Quebrar Código) — capturar comportamento atual antes de mexer
- Skill 11 (Compatibilidade) — teste de contrato
- Skill 03 (Auditoria Red Team) — testes adversariais
- Skill 13 (Deploy/Rollback) — smoke test pós-deploy

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
