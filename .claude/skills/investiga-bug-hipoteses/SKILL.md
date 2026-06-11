---
name: investiga-bug-hipoteses
description: Use esta skill para bug confuso, intermitente ou que "já foi corrigido e voltou" — investiga com hipóteses concorrentes (frontend, backend, banco, cache, sessão, permissão, ambiente/deploy, integração), buscando evidência A FAVOR e CONTRA cada uma antes de corrigir. Evita o vício da primeira hipótese.
---

# investiga-bug-hipoteses

## O que esta skill faz

Estrutura o debug difícil como **investigação com hipóteses concorrentes**: em vez de seguir a primeira explicação plausível, lista as causas possíveis por camada, procura evidência a favor E contra cada uma, elimina as fracas e só então propõe a **menor correção possível** com teste de validação. Para suspeita de segurança/malware, a skill certa é `/incident-diagnosis` — não esta.

## Quando usar

- Bug intermitente ou não-reproduzível à primeira.
- Correção anterior "não pegou" ou o problema voltou.
- Sintoma que pode nascer em camadas diferentes (funciona local, quebra em produção).
- Você (ou o Claude) já está há 2+ tentativas presas na mesma teoria.

## Entradas necessárias

1. **Sintoma em uma frase** (o que acontece, onde, para quem, desde quando).
2. O que JÁ foi tentado e o resultado de cada tentativa.
3. O que mudou recentemente (deploy, dependência, config, dados, DNS).
4. Acesso a evidências: logs (filtrados!), console, resposta HTTP, dados.

## Processo obrigatório

1. **Congelar o sintoma**: descrição precisa + como reproduzir (ou por que não reproduz). Sem sintoma claro, não há investigação.
2. **Gerar hipóteses por camada** (só as plausíveis para ESTE sintoma):

```text
FRONTEND   — JS quebrado, cache do navegador, evento duplicado, validação
BACKEND    — lógica, exceção engolida, race condition, encoding
BANCO      — dado inconsistente, query errada, collation, timezone
CACHE      — opcode/objeto/CDN/navegador servindo versão velha
SESSÃO/AUTH— sessão expirada, cookie, permissão de perfil
AMBIENTE   — versão PHP, extensão ausente, permissão de arquivo, .htaccess,
             diferença local×produção, deploy parcial
INTEGRAÇÃO — API externa mudou, timeout, webhook duplicado, rate limit
```

3. **Para cada hipótese: evidência a favor E contra** — a pergunta-chave é *"se fosse isso, o que mais seria verdade?"* (se fosse cache, o erro sumiria em janela anônima; se fosse permissão de perfil, admin não veria o erro). Buscar o teste barato que discrimina entre hipóteses.
4. **Eliminar hipóteses fracas explicitamente** (com o porquê — isso evita revisitá-las amanhã).
5. Em bug muito confuso: rodar 2–3 hipóteses como **frentes paralelas somente leitura** (modo 7 da `/escolhe-modo-execucao`), cada uma tentando provar E derrubar a própria tese; consolidar na sessão principal.
6. **Correção mínima** da causa mais provável — patch pequeno via fluxo de preservação (`/preserve-existing-behavior`), nunca reescrever o módulo "aproveitando".
7. **Validar**: teste que reproduz o bug antes e passa depois; registrar como caso permanente se for fluxo crítico (`/regression-safety`).
8. **Registrar** causa raiz + fix no vault via `curador-memoria` se o bug puder reaparecer (categoria solução).

## Checklist de qualidade

- [ ] Sintoma descrito em 1 frase verificável.
- [ ] ≥ 3 hipóteses consideradas antes de qualquer correção (em bug não-trivial).
- [ ] Cada hipótese com evidência a favor E contra (não só a favor).
- [ ] Hipóteses eliminadas listadas com motivo.
- [ ] Correção é a mínima; sem refatoração de carona.
- [ ] Validação reproduzível descrita; risco de regressão avaliado.
- [ ] "O que mudou recentemente" foi investigado (causa nº 1 na prática).

## Erros comuns que esta skill deve evitar

- Vício da primeira hipótese: achar UMA explicação plausível e parar de procurar.
- Corrigir o sintoma sem entender a causa (volta semana que vem).
- Mudar 5 coisas de uma vez — se funcionar, não se sabe o que era.
- Ignorar diferenças local×produção (versão PHP, cache, .htaccess, dados).
- Despejar log inteiro no contexto em vez de filtrar (grep por timestamp/erro).
- Tratar indício de comprometimento como bug comum (→ `/incident-diagnosis` IMEDIATAMENTE).

## Saída esperada

```text
SINTOMA: [1 frase]
HIPÓTESES ANALISADAS: [camada → tese → evidência a favor / contra]
ELIMINADAS: [quais + por quê]
CAUSA MAIS PROVÁVEL: [tese + evidências]
CORREÇÃO MÍNIMA: [patch proposto]
COMO VALIDAR: [passo reproduzível]
RISCO DE REGRESSÃO: [baixo/médio/alto]
REGISTRAR: [memória/vault se reaproveitável]
```

## Exemplo de uso

> "Agendamento some do painel às vezes, mas o cliente recebe a confirmação."

Saída: hipóteses — (a) filtro de data com timezone no painel [a favor: some só perto da meia-noite], (b) cache da listagem, (c) tenant_id errado no INSERT [contra: confirmação usa o mesmo registro]; teste discriminante: conferir registro no banco com horário UTC vs local; causa provável = timezone na query do painel; correção mínima de 3 linhas + caso de teste permanente.

---

## Conexão com o ecossistema

Segurança/malware: `/incident-diagnosis` (protocolo próprio). Correção: `/preserve-existing-behavior` + `revisor-codigo-geral` no diff. Bug em produção HostGator: `especialista-php-mysql-hostgator`. Registro: `curador-memoria` (memories/solucoes). Modo paralelo: `/escolhe-modo-execucao` (modo 7).

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
