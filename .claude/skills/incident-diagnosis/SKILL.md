---
name: incident-diagnosis
description: Triagem e diagnóstico de incidentes de segurança. Use quando houver suspeita de malware, pacote comprometido, token vazado, comportamento estranho no servidor ou qualquer indicador de comprometimento. Define o protocolo de resposta inicial.
---

# incident-diagnosis

Use esta skill imediatamente quando houver **qualquer suspeita** de comprometimento, comportamento anômalo, token vazado ou malware. A velocidade de resposta importa.

## Princípio

> Em incidente, a ordem correta é: PARAR → PRESERVAR → ISOLAR → ROTACIONAR → INVESTIGAR. Não ao contrário.

## Sinais que ativam esta skill

- Tráfego de saída incomum no servidor
- Arquivo novo em pasta que não deveria ter arquivo novo
- Código PHP/JS não reconhecido no projeto
- Email ou notificação de acesso não autorizado
- Chave de API usada em horário/local estranho
- Package.json, composer.json, requirements.txt modificados sem explicação
- Lockfile com hash diferente do esperado
- GitHub Actions ou webhooks ativados sem commit correspondente
- Conta de admin com atividade desconhecida
- Banco de dados com dados adicionados/alterados inexplicavelmente
- Notificação de CVE em dependência usada pelo projeto
- Aviso de "push" ou "commit" que você não fez

## Protocolo de resposta imediata

### FASE 1 — PARAR (primeiros 5 minutos)

1. **Parar todos os comandos** em andamento no terminal
2. **NÃO instalar** nenhuma dependência
3. **NÃO atualizar** nenhum pacote
4. **NÃO executar** scripts do repositório suspeito
5. **NÃO revogar** tokens ou chaves **pela máquina suspeita** — a máquina pode estar comprometida e a revogação pode ser logada pelo atacante
6. **NÃO fazer backup** executando scripts do projeto (podem estar comprometidos)
7. Anotar hora exata da descoberta

### FASE 2 — PRESERVAR (evidências)

8. Fazer screenshot dos arquivos suspeitos antes de qualquer alteração
9. Anotar o que foi encontrado: onde, quando, o que parece ser
10. Se possível, fazer dump de logs do servidor antes de continuar
11. Não deletar nada ainda — evidências podem ser necessárias

### FASE 3 — ISOLAR

12. Colocar site em modo de manutenção (desabilitar acesso público temporariamente)
13. Revogar sessões ativas de usuários se possível
14. Bloquear acesso externo ao admin se possível
15. Se VPS: snapshot do servidor antes de qualquer ação

### FASE 4 — ROTACIONAR CREDENCIAIS (máquina LIMPA)

16. Usar **outra máquina** (celular, outro computador) para:
    - Revogar tokens e chaves comprometidos ou possivelmente expostos
    - Gerar novas credenciais
    - Alterar senhas de admin de serviços
    - Verificar logs de acesso nos painéis dos serviços (AWS, Stripe, etc.)
17. Alterar senha do FTP/cPanel pela máquina limpa
18. Alterar senha do banco pela máquina limpa
19. Verificar usuários ativos no painel de hospedagem

### FASE 5 — INVESTIGAR

20. Verificar cada item da lista abaixo

## O que investigar

### Package.json / composer.json / requirements.txt
```bash
# Verificar modificações recentes
git log --oneline --all -- package.json
git log --oneline --all -- composer.json
git diff HEAD package.json

# Procurar scripts suspeitos
# Em package.json, verificar scripts: preinstall, postinstall, prepare
```

### Lockfiles
```bash
# Verificar se lockfile foi alterado sem commit correspondente
git diff HEAD package-lock.json
git log --oneline -- package-lock.json

# Hash diferente do esperado é sinal de alerta
```

### Hooks Git
```bash
# Verificar hooks que podem executar código na instalação
ls -la .git/hooks/
cat .git/hooks/pre-commit
cat .git/hooks/post-checkout
```

### GitHub Actions / CI workflows
```bash
# Verificar modificações em workflows
git log --oneline -- .github/workflows/
git diff HEAD .github/workflows/
```

### Código suspeito — procurar padrões

Para PHP:
```bash
# Funções de execução de código frequentemente usadas em backdoors
grep -r "eval(" . --include="*.php"
grep -r "base64_decode" . --include="*.php"
grep -r "system(" . --include="*.php"
grep -r "exec(" . --include="*.php"
grep -r "shell_exec" . --include="*.php"
grep -r "preg_replace.*\/e" . --include="*.php"
grep -r "\$_POST\[" . --include="*.php" | grep -v "form"
```

Para JavaScript/Node:
```bash
grep -r "child_process" . --include="*.js" --include="*.ts"
grep -r "require('child_process')" . --include="*.js"
grep -r "exec(" . --include="*.js" | grep -v "test"
grep -r "spawn(" . --include="*.js" | grep -v "test"
grep -r "process.env" . --include="*.js" | head -50
grep -r "curl " . --include="*.js"
grep -r "wget " . --include="*.js"
grep -r "rm -rf" . --include="*.js"
```

Para qualquer projeto — tokens expostos:
```bash
# Procurar padrões de token/chave
grep -r "sk-" . --include="*.js" --include="*.ts" --include="*.py" --include="*.php"
grep -r "AKIA" . --include="*.js" --include="*.py"  # AWS Access Key
grep -rE "token|secret|password|api_key" . --include="*.json" | grep -v ".env.example"
grep -r "ghp_" .   # GitHub token
grep -r "glpat-" . # GitLab token
```

### Novos arquivos suspeitos
```bash
# Arquivos criados recentemente
find . -newer . -type f -name "*.php" 2>/dev/null | head -20
find . -name "*.php" -mtime -7 2>/dev/null | head -20  # últimos 7 dias

# Arquivos em lugares incomuns
find ./public_html -name "*.php" -path "*/uploads/*"
find ./public_html -name "*.php" -path "*/images/*"
find ./public_html -name "*.php" -path "*/cache/*"
```

### Chamadas de rede suspeitas no código
```bash
grep -r "curl_exec\|file_get_contents.*http\|wp_remote_get" . --include="*.php" | grep -v "test"
grep -r "fetch(" . --include="*.js" | grep -v "test\|spec"
```

## Plano de recuperação

Após identificar o vetor de ataque:

1. **Remover** o código malicioso
2. **Restaurar** de backup limpo (de data anterior ao comprometimento, se identificada)
3. **Atualizar** todas as dependências vulneráveis
4. **Corrigir** a vulnerabilidade que permitiu o acesso
5. **Testar** o ambiente restaurado em staging antes de voltar para produção
6. **Documentar** o incidente: vetor, data provável, impacto, ações tomadas
7. **Notificar** usuários afetados se houver vazamento de dados pessoais (LGPD: prazo de 72h para comunicar a ANPD em caso de risco)

## O que NÃO fazer em incidente

- Continuar operando normalmente enquanto investiga
- Instalar ferramentas de diagnóstico por `pip install` ou `npm install` sem verificar a máquina
- Revogar token pela máquina comprometida
- Deletar evidências antes de documentar
- Executar scripts do projeto suspeito "para ver o que fazem"
- Restaurar backup sem antes corrigir a vulnerabilidade que causou o incidente

## Saída obrigatória

```
RELATÓRIO DE INCIDENTE — TRIAGEM INICIAL
==========================================
Data/hora da descoberta: [...]
Descoberto por: [...]
Descrição do sintoma: [...]

INDICADORES DE COMPROMETIMENTO ENCONTRADOS:
[lista de achados]

VETORES SUSPEITOS:
[...]

DADOS POTENCIALMENTE AFETADOS:
[...]

AÇÕES TOMADAS:
[X] Parado comandos
[X] Credenciais rotacionadas (máquina limpa)
[X] Site isolado
[ ] Análise em andamento

PRÓXIMOS PASSOS:
1. [...]
2. [...]

NOTIFICAÇÃO NECESSÁRIA: [Sim/Não — usuários afetados? ANPD (72h)?]
```

## Conexão com skills do vault

- Skill 03 (Auditoria Red Team) — análise adversarial do código comprometido
- Skill 04 (Logs Seguros) — análise de logs do servidor
- Skill 13 (DevOps/Deploy) — rollback e restauração de backup
- Skill 06 (LGPD) — obrigação de notificação em caso de vazamento

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
