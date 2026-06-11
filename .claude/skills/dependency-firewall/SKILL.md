---
name: dependency-firewall
description: Firewall de dependências. Obrigatório antes de qualquer instalação, atualização, remoção ou auditoria de pacote em qualquer ecossistema (npm, pip, composer, cargo, go, gem, docker, WP plugins). Exige análise prévia e aprovação explícita.
---

# dependency-firewall

Use esta skill **sempre que houver instalação, atualização, remoção ou auditoria de dependência**. Ela bloqueia ação impulsiva e força análise antes de qualquer código de terceiro entrar no projeto.

## Princípio

> Toda dependência é uma confiança herdada. Cada `require` / `import` / `<script>` é um voto de confiança em todos os mantenedores upstream — presentes e futuros.

## Perguntas internas obrigatórias (responder antes de sugerir qualquer install)

1. O projeto **realmente precisa** desta funcionalidade agora?
2. Pode ser resolvida com **código nativo** com esforço razoável?
3. O pacote está **mantido**? (último commit, último release — quando foi?)
4. Há **vulnerabilidades conhecidas** ativas? (npm audit, composer audit, OSV)
5. Quando foi a **última publicação** desta versão específica?
6. Foi publicado ou atualizado há **menos de 7 dias**? (regra de quarentena)
7. O **nome** é exatamente o esperado? (verificar typosquatting)
8. Há **scripts de instalação** (preinstall, install, postinstall, prepare)?
9. Qual é a **licença**? É compatível com uso comercial?
10. Quais são as **dependências transitivas**? Quantas são?
11. Qual é o **impacto no lockfile**?
12. Existe **alternativa sem dependência**?

## Ecossistemas cobertos

| Ecossistema | Comandos que exigem análise |
|---|---|
| npm | `npm install`, `npm i`, `npm update`, `npm audit fix`, `npm audit fix --force` |
| pnpm | `pnpm install`, `pnpm add`, `pnpm update` |
| yarn | `yarn add`, `yarn upgrade` |
| bun | `bun add`, `bun update` |
| pip | `pip install`, `poetry add`, `uv add`, `uv pip install` |
| composer | `composer require`, `composer update` |
| cargo | `cargo add` |
| go | `go get` |
| gem | `gem install` |
| docker | `docker pull` (verificar digest, não só tag) |
| WordPress | Instalar plugin ou tema (repositório oficial ou desconhecido?) |
| Script externo | `curl ... \| bash`, `wget ... \| bash`, `Invoke-WebRequest ... \| iex` |

## Regras obrigatórias

### Quarentena de 7 dias
**Não instalar pacotes publicados ou atualizados há menos de 7 dias**, salvo:
- patch de segurança crítico com CVE ativo
- autorização explícita do usuário com justificativa registrada

Razão: ataques de supply chain frequentemente comprometem pacotes em janelas curtas logo após publicação.

### Análise antes de sugerir
Antes de propor qualquer comando de instalação, informar obrigatoriamente:
- Nome exato do pacote (verificar ortografia)
- Versão pretendida (nunca `*` ou `latest` sem justificativa)
- Ecossistema
- Motivo real da instalação
- Alternativa sem dependência (e por que não serve)
- Data da última publicação da versão
- Se tem scripts de instalação e quais
- Repositório oficial
- Popularidade aproximada (downloads/semana ou estrelas)
- Vulnerabilidades conhecidas na versão pretendida
- Arquivos que serão alterados (lockfile, package.json, etc.)
- Comando exato proposto

### Lockfiles
- **Nunca deletar** lockfile sem autorização
- **Nunca commitar** com lockfile em estado inconsistente
- Em produção usar `npm ci`, `composer install --no-dev` (não `update` / `install`)
- Diff inesperado no lockfile em PR = sinal de alerta, investigar antes de aceitar

### Audit fix --force
**Proibido** sem análise prévia. `npm audit fix --force` pode fazer bump de MAJOR quebrando API. Fazer manualmente, uma dependência por vez.

### Scripts de pós-instalação
Para pacotes desconhecidos, considerar `--ignore-scripts` e revisar manualmente o que o script faz antes de executar.

### Typosquatting
Verificar o nome exato. Exemplos de ataques reais:
- `requets` vs `requests`
- `loadash` vs `lodash`
- `colour` vs `color`
- `crossenv` vs `cross-env`
Se houver qualquer dúvida sobre o nome, confirmar com o usuário antes de instalar.

### CDN e scripts externos
- Nunca incluir `<script src="...">` sem SRI (Subresource Integrity)
- Formato: `integrity="sha384-..."` + `crossorigin="anonymous"`
- Preferir self-hosting de libs estáticas quando possível
- Google Fonts envia IP do usuário → revisar privacidade/LGPD

## Ações proibidas (recusar e explicar)

- `npm audit fix --force` sem análise
- Usar `*` ou `latest` em versão
- Instalar pacote publicado há menos de 7 dias sem autorização
- `curl ... | bash` ou `wget ... | bash` (execução remota direta)
- Instalar múltiplas dependências de uma vez
- Deletar lockfile para "resolver problema"
- `composer update` em produção (deve ser `install`)
- Manter plugin WordPress abandonado (sem update há >12 meses)
- Ignorar resultado de `npm audit` / `composer audit`

## Saída obrigatória

```
ANÁLISE DE DEPENDÊNCIA
======================
Pacote: [nome exato]
Versão: [versão pretendida]
Ecossistema: [npm/pip/composer/etc.]
Idade da publicação: [data]
Quarentena ativa: [SIM/NÃO — publicado há menos de 7 dias?]
Motivo: [por que é necessário]
Alternativa sem pacote: [existe? por que não serve?]
Scripts de instalação: [sim/não — quais?]
Vulnerabilidades conhecidas: [sim/não — quais?]
Licença: [tipo — compatível com uso?]
Dependências transitivas: [quantas]
Repositório: [URL]
Risco: [BAIXO/MÉDIO/ALTO/CRÍTICO]
Comando proposto: [comando exato]
Aprovação necessária: [SIM — aguardar confirmação do usuário]
```

## Conexão com skills do vault

- Skill 14 (Supply Chain) — versão detalhada com SBOM, auditoria, lifecycle completo
- Skill 00 (Não Quebrar Código) — atualização não pode quebrar comportamento existente
- Skill 11 (Compatibilidade) — MAJOR bump = mudança de contrato externo
- Skill 13 (DevOps/Deploy) — lockfile atualizado entra no pipeline de deploy

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
