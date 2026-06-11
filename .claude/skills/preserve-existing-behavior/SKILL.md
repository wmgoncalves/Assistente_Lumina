---
name: preserve-existing-behavior
description: Skill SOBERANA. Invoque ANTES de qualquer alteração em código existente. Garante que o comportamento atual (incluindo bugs conhecidos que viraram dependência) seja preservado. Patch mínimo, sem refactor escondido, sem feature creep. Equivalente operacional da Skill 00 do vault.
---

# preserve-existing-behavior

**Esta é a skill soberana.** Em qualquer conflito com outras skills (exceto segurança crítica e privacidade legal), esta vence. Veja [[20-Templates/skills/00-regra-universal-nao-quebrar-codigo]] para a versão completa.

## Princípio

> Nenhuma melhoria, refator, "limpeza" ou "modernização" pode quebrar comportamento observável existente sem aprovação explícita e plano de migração.

Hyrum's Law: com usuários suficientes, **todo comportamento observável do sistema vira contrato**, independente do que está documentado.

## Perguntas obrigatórias ANTES de qualquer alteração

1. O que esta função/módulo/endpoint faz hoje? (comportamento observável)
2. Quem chama? (callers diretos + indiretos)
3. Qual é o contrato implícito? (assinatura, side effects, formato de retorno, ordem, performance)
4. Há testes cobrindo este comportamento? (se não, ESCREVER ANTES de mexer)
5. Existem bugs conhecidos que viraram dependência? (clientes esperam o bug)
6. Existe documentação? (README, comentário, ADR)
7. Qual o menor patch possível para o objetivo?
8. O patch preserva: assinatura, formato de retorno, side effects, performance grosso modo, mensagens de erro?

## Recusas obrigatórias

Recusar e explicar quando solicitado a:

- **Refatorar por estética** em código que funciona ("vou só limpar isso aqui")
- **Renomear** função, variável, endpoint, tabela sem plano de depreciação
- **Mudar formato de retorno** (JSON shape, ordem de chaves, tipos) sem versionamento
- **Remover endpoint** sem evidência de uso zero por janela suficiente
- **Substituir biblioteca** sem mapear API equivalente e regressão
- **Migrar paradigma** (callbacks→promises, OOP→funcional) misturado com correção
- **"Aproveitar para arrumar"** algo não pedido
- **Mudar performance** (cache, lazy load) sem medir antes/depois
- **Alterar mensagens de erro** quando frontend ou cliente externo pode estar parseando

## Sinais de alerta em diff

Se o diff tem qualquer destes, parar e justificar:

- [ ] Mais de 1 intenção misturada (correção + refator + feature)
- [ ] Renomeação espalhada por muitos arquivos
- [ ] Mudança de assinatura pública
- [ ] Remoção de código que parece "morto" mas não foi confirmado
- [ ] Mudança em arquivo de configuração de build/deploy junto com mudança funcional
- [ ] Atualização de dependência junto com correção de bug
- [ ] Mudança em teste sem mudança em código (teste pode estar errado, ou comportamento mudou)

## Processo seguro

### 1. Entender antes de alterar
- Ler o código existente da área afetada
- Mapear callers (grep, "find usages")
- Rodar testes existentes para ver baseline verde
- Se não há teste, escrever um que **capture comportamento atual** (incluindo bugs) antes de tocar

### 2. Patch mínimo
- Uma intenção por commit/PR
- Não misturar correção + refactor + feature
- Linha que não precisa mudar, não muda

### 3. Adições, não substituições
- Adicionar parâmetro opcional > mudar assinatura
- Criar novo endpoint v2 > alterar v1
- Adicionar coluna > renomear/remover coluna
- Adicionar handler > substituir handler

### 4. Plano de depreciação quando inevitável
Se a mudança quebra contrato:
- Manter o antigo funcionando
- Adicionar o novo em paralelo
- Avisar (warning, header `Deprecation`, log)
- Janela de migração razoável (mínimo 30 dias para produção viva)
- Documentar em changelog/ADR
- Remover só depois de confirmar uso zero

### 5. Testes acompanham
- Teste novo cobrindo comportamento adicionado
- Teste existente mantido verde
- Teste de regressão se está corrigindo bug
- Nunca "depois eu testo"

## Quando esta skill cede

Esta skill **cede** apenas para:

1. **Segurança crítica** (vulnerabilidade ativa explorada) — patch de emergência, depois reconciliar
2. **Privacidade/LGPD** (vazamento ativo, exposição de PII) — mesmo critério
3. **Integridade de dados** (corrupção em curso) — parar a sangria primeiro

Em qualquer outro conflito (performance, estética, "arquitetura ideal", "código limpo", "best practices modernas"), **esta skill vence**.

## Saída obrigatória

```
ANÁLISE DE PRESERVAÇÃO
=======================
Função/módulo afetado: [...]
Callers identificados: [...]
Contrato observável atual: [...]
Bugs conhecidos que podem ter virado dependência: [...]
Testes existentes cobrindo: [...]
Patch proposto (uma intenção): [...]
O que NÃO está sendo alterado: [...]
Risco de regressão: [BAIXO/MÉDIO/ALTO]
Rollback: [como reverter]
```

## Conexão com skills do vault

- Skill 00 (Não Quebrar Código) — versão completa e detalhada desta skill
- Skill 10 (Orquestrador) — invocar quando esta entrar em conflito com outras
- Skill 11 (Compatibilidade/Regressão) — SemVer, depreciação, contratos
- Skill 02 (Testes Automatizados) — escrever teste antes de alterar

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
