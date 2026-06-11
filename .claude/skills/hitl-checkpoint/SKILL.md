---
name: hitl-checkpoint
description: Human-in-the-Loop operacional. Define quando uma ação exige aprovação humana, como pedir, registrar e auditar. Bloqueia ações Críticas/irreversíveis sem aprovação explícita. Use antes de DROP, deploy, push --force, envio em massa, ação de agente IA com efeito externo.
---

# hitl-checkpoint

Use **antes de qualquer ação Crítica/irreversível**. Bloqueia execução até aprovação humana explícita registrada.

## Classificação de risco da ação

### Baixo — não exige HITL
- Leitura, busca, listagem
- Mudança em arquivo de trabalho não comitado
- Execução de teste
- Build sem deploy

### Médio — informar e prosseguir, registrar
- `git add` / `git commit` em branch de feature
- Instalação de dependência **com análise prévia** via `/dependency-firewall`
- Migration **em ambiente de dev**
- Refator pequeno em código com testes verdes

### Alto — pedir confirmação, aguardar resposta
- Push em branch protegida (main/master/production)
- Deploy em staging
- Alteração de schema com migration
- Mudança em autenticação/autorização
- Adicionar/remover usuário com permissão
- Mudança em variável de ambiente de produção
- Mudança em CI/CD ou GitHub Actions
- Atualização de dependência com bump MAJOR
- Mudança em `.htaccess`, `nginx.conf`, regras de firewall

### Crítico — exige HITL explícito + registro + maker-checker
- **Deploy em produção**
- `DROP TABLE`, `DROP DATABASE`, `TRUNCATE`
- Migration irreversível (perda de dado)
- `git push --force` em branch compartilhada
- `rm -rf` em diretório com dado real
- Rotação de chave em produção
- Envio de e-mail/SMS em massa
- Pagamento, estorno, transferência financeira
- Cobrança em massa de clientes
- Exclusão de conta de usuário
- Vazamento corrigido (decisão de comunicar ANPD/usuários)
- Bloqueio em massa de usuários
- Mudança em política de privacidade publicada
- Mudança em termo de uso publicado
- Agente IA executando ação externa (e-mail, API que cobra, transferência)

## Protocolo HITL para ação Crítica

### 1. Apresentar a ação
```
=== AÇÃO CRÍTICA — REQUER APROVAÇÃO HUMANA ===
O que: [descrição da ação]
Onde: [ambiente, projeto, recurso]
Quando: [agora? agendada?]
Quem propôs: [Claude / nome do humano]
Comando exato: [...]
Reversibilidade: [reversível em X / irreversível]
Impacto: [usuários afetados, dados afetados, sistemas afetados]
Risco residual: [...]
```

### 2. Apresentar o plano de rollback
```
ROLLBACK
========
Como reverter: [passos exatos]
Tempo estimado para reverter: [...]
Backup disponível: [SIM/NÃO — onde]
Dados que não podem ser recuperados: [...]
```

### 3. Aguardar aprovação explícita

**Não basta** "ok", "pode", "vai". Para Crítica, exigir:
- Confirmação de quem está aprovando
- Confirmação que leu o plano de rollback
- Janela de execução (agora? agendada?)

### 4. Maker-checker em Crítico de alto impacto

Para ações financeiras, deploy em produção crítico, ou alteração em massa:
- **Maker** (quem propõe) ≠ **Checker** (quem aprova)
- Claude pode ser maker mas **nunca checker**
- Mesmo humano não pode ser maker e checker

### 5. Registrar
```
LOG DE AÇÃO CRÍTICA
====================
Timestamp: [ISO 8601]
Ação: [...]
Maker: [...]
Checker (aprovou): [...]
Comando executado: [...]
Resultado: [sucesso/falha]
Verificação pós-ação: [smoke test]
Link: [PR, ticket, ADR]
```

## Kill switch

Para sistemas com agente IA ou automação contínua, definir kill switch:
- Variável de ambiente ou flag que **desliga** o agente imediatamente
- Acessível a humano sem precisar de deploy
- Testado regularmente
- Documentado em runbook

Exemplo:
```php
if (getenv('AGENT_KILL_SWITCH') === '1') {
    log('Agent disabled by kill switch');
    exit(0);
}
```

## Recusas obrigatórias

Recusar e explicar quando solicitado a:

- Pular HITL "porque é urgente"
- Aprovar você mesmo (Claude) ação Crítica
- Maker = Checker
- Ação Crítica sem rollback definido
- Ação Crítica sem registro
- Remover kill switch existente sem substituto
- Deploy em produção sem janela definida
- Migration destrutiva sem backup confirmado
- Push --force em branch compartilhada sem aprovação
- Envio em massa sem teste interno antes
- Cobrança em massa sem dry-run em ambiente de teste

## Ações que sobem na hierarquia de prioridade

Quando uma ação envolve HITL, ela **sobe** próxima à privacidade (posição 2 da hierarquia global). Isso significa:

- Não pode ser pulada por urgência de performance/UX
- Não pode ser pulada por organização do código
- Pode ser pulada **apenas** por segurança crítica imediata (vazamento ativo, sistema sob ataque) — e mesmo assim registrar e justificar a posteriori

## Casos especiais

### Agente IA com ação externa
- Cada tool/function que tem efeito externo (e-mail, API que cobra, escrita em arquivo público) exige HITL **na primeira vez** ou **se valor/quantidade ultrapassar limiar**
- Definir limiares: ex. enviar até 10 e-mails internos OK, 11+ exige aprovação
- Sempre logar com input/output completo (mascarando PII)

### Emergência (incidente)
- Em incidente ativo, HITL pode ser concentrado em uma pessoa autorizada (oncall)
- Registro a posteriori **obrigatório** (post-mortem)
- Decisões de "estancar a sangria" não são exceção total — são HITL acelerado

### Conta de cliente
- Excluir conta = irreversível na maioria dos casos
- Mudar e-mail principal = atenção (recuperação de senha)
- Mudar permissão para admin = HITL com maker-checker

## Saída obrigatória

```
HITL CHECKPOINT
================
Ação: [...]
Classificação: [Médio/Alto/Crítico]
Requer HITL: [SIM/NÃO]
Maker: [...]
Checker designado: [...]
Comando exato: [...]
Rollback: [...]
Backup confirmado: [SIM/NÃO]
Janela: [agora/agendada]
Aguardando aprovação de: [...]
Status: [PENDENTE/APROVADO/REJEITADO/EXECUTADO]
Registro: [link]
```

## Conexão com skills do vault

- Skill 09 (HITL) — versão completa com maker-checker, kill switch, auditoria
- Skill 08 (Ética/IA) — agentes IA que exigem HITL por categoria de risco
- Skill 10 (Orquestrador) — HITL sobe na hierarquia em decisão difícil
- Skill 13 (DevOps/Deploy) — deploy em produção sempre HITL
- Skill 12 (Banco/Migrations) — DROP/TRUNCATE sempre HITL

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
