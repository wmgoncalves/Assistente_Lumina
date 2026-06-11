---
name: react-rsc-node-rce-hardening
description: Hardening contra RCE em React Server Components, Server Actions, Next.js App Router, SSR e Node.js. Cobre CVE-2025-55182 (React2Shell) e CVE-2025-66478 (Next.js), desserializacao insegura, abuso de Server Actions, pacotes react-server-dom-*, dependencias vulneraveis, supply chain, APIs perigosas (eval/Function/child_process/vm), secrets e validacao server-side. Use quando o projeto tiver Node.js, React 19, Next.js App Router, RSC, Server Actions, SSR, serverless ou endpoint publico processando payload complexo.
---

# react-rsc-node-rce-hardening

## 0. Regra suprema

Segurança tem prioridade absoluta sobre design, UI/UX, conversão, estética, performance visual e conveniência de desenvolvimento.

- Em conflito entre segurança e design → segurança vence.
- Em conflito entre segurança e facilidade de implementação → segurança vence.
- Em conflito entre segurança e manter uma dependência vulnerável → segurança vence.
- Em conflito entre segurança e compatibilidade visual → segurança vence.

Correção é **incremental, controlada e segura**. Não apagar projeto. Não refazer do zero automaticamente. Não substituir arquitetura por preferência.

---

## 1. Objetivo

Prevenir, detectar e mitigar Remote Code Execution (RCE) e classes correlatas de vulnerabilidade em aplicações que usem:

- React
- React 19
- React Server Components (RSC)
- React Server Functions / Server Actions (`"use server"`)
- React Flight protocol
- Pacotes `react-server-dom-webpack`, `react-server-dom-parcel`, `react-server-dom-turbopack`
- Next.js (App Router, API Routes, Route Handlers, Middleware)
- Node.js em produção (SSR, serverless, Vercel, Netlify Functions, Cloudflare Workers com SSR)
- Vite SSR, React Router com RSC, Waku, RedwoodSDK/rwsdk
- Qualquer aplicação JavaScript server-side exposta à internet

Foco específico:

- Desserialização insegura em payloads RSC/Flight
- Execução server-side indevida via Server Actions
- Endpoints públicos sem validação
- Abuso de `react-server-dom-*`
- Supply chain attack via dependências vulneráveis
- Execução dinâmica insegura (`eval`, `new Function`, `vm`, `child_process` com input do usuário)
- Vazamento de secrets e variáveis sensíveis
- SSR/RSC adicionado sem necessidade real

---

## 2. Contexto da vulnerabilidade

Vulnerabilidades como **React2Shell / CVE-2025-55182** envolvem execução remota de código sem autenticação em React Server Components, causada por falhas no processamento ou desserialização de payloads enviados a endpoints relacionados a Server Functions / Server Components / Flight protocol.

A vulnerabilidade correlata **CVE-2025-66478** no Next.js afeta versões que expõem o pipeline RSC sem mitigação adequada.

**Ambientes potencialmente afetados (verificar advisories oficiais para confirmar):**

- React Server Components em versões vulneráveis
- React **19.0.0, 19.1.0, 19.1.1, 19.2.0**
- Pacotes `react-server-dom-webpack`, `react-server-dom-parcel`, `react-server-dom-turbopack` em versões afetadas
- Next.js com App Router
- Next.js **15.x vulnerável antes dos patches**
- Next.js **16.x vulnerável antes dos patches**
- Next.js **14.3.0-canary.77 e canaries posteriores** quando usando App Router/RSC

**IMPORTANTE:** Versões corrigidas e faixas afetadas podem mudar. **Sempre verificar advisories oficiais e fontes atualizadas antes de concluir diagnóstico:**

- GitHub Security Advisory (GHSA) do React e do Next.js
- NVD (CVE-2025-55182, CVE-2025-66478)
- Release notes oficiais
- Changelog do pacote afetado

---

## 3. Prioridade interna desta skill

Quando aplicada, a ordem de prioridade é:

1. Corrigir RCE e vulnerabilidades críticas
2. Atualizar dependências vulneráveis
3. Remover superfície de ataque desnecessária
4. Proteger secrets e variáveis de ambiente
5. Validar inputs server-side
6. Bloquear execução indevida de código
7. Isolar runtime
8. Preservar segurança de deploy
9. Preservar funcionalidades existentes
10. Preservar compatibilidade com o ambiente
11. Melhorar performance
12. UI/UX
13. Design

---

## 4. Quando usar esta skill

Acione esta skill sempre que o projeto tiver **qualquer um** destes sinais:

- arquivo `package.json` com `next` ou `react`
- React versão **19**
- pacotes `react-server-dom-webpack`, `react-server-dom-parcel`, `react-server-dom-turbopack`
- pasta `app/` ou `src/app/` (App Router)
- diretiva `"use server"` em qualquer arquivo
- Server Actions (formulários com `action={serverFn}`)
- arquivos `route.ts` ou `route.js` (Route Handlers)
- API routes em `pages/api/` ou `app/api/`
- SSR habilitado (Next.js, Remix, Vite SSR, Waku)
- serverless functions (Vercel, Netlify Functions, Cloudflare Workers com SSR)
- backend Node.js em produção
- endpoint público que processa payload complexo
- upload de arquivos
- webhooks
- integração com IA processando input do usuário
- uso de `child_process`, `eval`, `new Function`, `vm`
- `import()` dinâmico baseado em input do usuário
- `require()` dinâmico baseado em input do usuário

---

## 5. Quando esta skill pode não se aplicar diretamente

A vulnerabilidade específica de RSC/RCE **pode não se aplicar diretamente** quando o projeto for:

- HTML/CSS/JS totalmente estático
- PHP simples sem Node.js em produção
- frontend estático hospedado em `public_html` (HostGator/cPanel)
- React client-side puro **sem SSR e sem RSC**
- Next.js usando **somente Pages Router** em versão não afetada
- aplicação sem React Server Components
- aplicação sem Server Actions
- aplicação sem Node.js exposto em produção

Mesmo nesses casos, **manter as boas práticas preventivas** para evitar que o risco seja introduzido depois (especialmente quando alguém propuser migrar para Next.js só por estética).

---

## 6. Arquivos a verificar

```text
package.json
package-lock.json
pnpm-lock.yaml
yarn.lock
bun.lockb
next.config.js
next.config.mjs
next.config.ts
app/
src/app/
pages/
src/pages/
app/api/
pages/api/
middleware.ts
middleware.js
server.js
src/server/
.env
.env.local
.env.production
.env.example
Dockerfile
docker-compose.yml
vercel.json
netlify.toml
wrangler.toml
README.md
CLAUDE.md
.claude/
```

**Regra:** Nunca confiar apenas no `package.json`. Verificar também o **lockfile** e a versão **realmente resolvida** (uma dep transitiva pode trazer versão vulnerável).

---

## 7. Comandos de diagnóstico

Executar conforme o gerenciador de pacotes do projeto. **Não executar automaticamente** se o ambiente não permitir.

### npm

```bash
npm ls next react react-dom react-server-dom-webpack react-server-dom-parcel react-server-dom-turbopack
npm audit
npm outdated
```

### pnpm

```bash
pnpm list next react react-dom react-server-dom-webpack react-server-dom-parcel react-server-dom-turbopack
pnpm audit
pnpm outdated
```

### yarn

```bash
yarn why next
yarn why react
yarn why react-server-dom-webpack
yarn audit
```

### bun

```bash
bun pm ls
bun outdated
```

### Buscar padrões perigosos (bash/Linux/macOS)

```bash
grep -R "\"use server\"" .
grep -R "react-server-dom" .
grep -R "child_process" .
grep -R "eval(" .
grep -R "new Function" .
grep -R "vm\." .
grep -R "exec(" .
grep -R "spawn(" .
grep -R "import(" .
grep -R "require(" .
```

### Buscar padrões perigosos (PowerShell/Windows)

```powershell
Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js,*.jsx,*.mjs,*.cjs | Select-String '"use server"'
Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js,*.jsx,*.mjs,*.cjs | Select-String 'react-server-dom'
Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js,*.jsx,*.mjs,*.cjs | Select-String 'child_process'
Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js,*.jsx,*.mjs,*.cjs | Select-String 'eval\('
Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js,*.jsx,*.mjs,*.cjs | Select-String 'new Function'
Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js,*.jsx,*.mjs,*.cjs | Select-String 'vm\.'
Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js,*.jsx,*.mjs,*.cjs | Select-String 'exec\('
Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js,*.jsx,*.mjs,*.cjs | Select-String 'spawn\('
```

---

## 8. Versões e patches

**Regra geral:** sempre verificar advisory oficial antes de aplicar. Os números abaixo são orientativos da época da publicação e **podem ter mudado**.

**React:**

- **Afetado:** 19.0.0, 19.1.0, 19.1.1, 19.2.0
- **Corrigido (orientativo):** 19.0.1, 19.1.2, 19.2.1 ou superior dentro da linha segura

**Next.js:**

- **Afetado:** 15.x antes dos patches, 16.x antes dos patches, 14.3.0-canary.77+ (App Router/RSC)
- **Corrigido (orientativo):** 15.0.5, 15.1.9, 15.2.6, 15.3.6, 15.4.8, 15.5.7, 16.0.7 ou equivalentes superiores

**Onde confirmar:**

- GitHub Security Advisory do `react` e do `next`
- NVD (https://nvd.nist.gov)
- Release notes oficiais
- Changelog do projeto

**REGRA:** Nunca manter versão vulnerável em produção. Atualizar é prioridade máxima.

---

## 9. Fluxo de mitigação emergencial

Se o projeto usa React Server Components, Next.js App Router ou Server Actions **e** está em versão vulnerável:

1. **Classificar como incidente crítico.**
2. Parar mudanças de design/feature até corrigir segurança.
3. Atualizar dependências vulneráveis como prioridade máxima:
   - `react`
   - `react-dom`
   - `react-server-dom-webpack` / `react-server-dom-parcel` / `react-server-dom-turbopack`
   - `next` para a versão patchada da linha em uso
4. Reinstalar dependências limpando cache se necessário.
5. Atualizar lockfile (versionado).
6. Rodar `npm audit` / `pnpm audit` / `yarn audit`.
7. Rodar `npm run build` (ou equivalente).
8. Rodar suite de testes.
9. Revisar Server Actions, Route Handlers e API Routes manualmente.
10. Revisar logs do servidor em busca de tentativas de exploração.
11. **Rotacionar secrets** se a aplicação esteve exposta publicamente (ver §10).
12. Fazer redeploy limpo (não reaproveitar build cacheado).
13. Monitorar tentativas de exploração por pelo menos 7 dias.
14. Registrar o que foi corrigido (changelog interno).

### Comandos exemplo (npm)

```bash
# Atualizar para a versão corrigida da linha em uso (NÃO usar @latest cegamente em produção crítica)
npm install next@<versao-patchada> react@<versao-patchada> react-dom@<versao-patchada>
npm audit
npm run build
npm test
```

Se for necessário permanecer na mesma linha major (ex.: já está em 15.x), atualizar para o patch correspondente dentro da linha.

**Regra:** Não fazer "workaround visual" ou tentar mitigar RCE com WAF/regex apenas. RCE exige **correção real** (atualização da biblioteca).

---

## 10. Rotação de secrets

**Rotacionar secrets quando:**

- a aplicação vulnerável ficou pública
- houve tentativa de exploração (mesmo que sem sucesso confirmado)
- logs indicam comportamento suspeito
- há dúvida sobre comprometimento
- a aplicação tinha acesso a APIs, banco ou serviços externos

**Secrets a rotacionar (lista mínima):**

- `DATABASE_URL` / credenciais de banco
- JWT secret
- API keys (Stripe, Mercado Pago, OpenAI, Anthropic, etc.)
- tokens de pagamento (sandbox e produção)
- tokens de e-mail / SMTP credentials
- OAuth client secrets
- webhook secrets (assinatura HMAC)
- storage keys (S3, R2, Supabase Storage)
- tokens de deploy (Vercel, Netlify, Railway)
- tokens de GitHub / GitLab
- tokens de analytics sensíveis
- qualquer variável sensível no `.env`

**Como rotacionar com segurança:**

- Não rotacionar pela máquina possivelmente comprometida (usar máquina limpa)
- Atualizar primeiro no provedor (gerar novo) e só depois atualizar `.env` da aplicação
- Invalidar o segredo antigo só após confirmar que o novo funciona
- Em pagamentos, coordenar janela de manutenção

**Regra:** Nunca expor secrets em frontend, logs, prints, mensagens de erro ou commits.

Combinar com `/secrets-and-env-guard`.

---

## 11. Regras rígidas para Server Actions / `"use server"`

Toda Server Action deve:

- ✅ Validar input **no servidor** (não confiar em validação frontend)
- ✅ Verificar autenticação quando aplicável
- ✅ Verificar autorização quando manipular dados
- ✅ Validar ownership dos dados (este usuário pode tocar neste registro?)
- ✅ Tratar erros sem expor detalhes internos
- ✅ Limitar dados aceitos (schema/allowlist)
- ✅ Rejeitar campos desconhecidos quando possível
- ✅ Limitar payload size
- ✅ Evitar executar código dinâmico
- ✅ Evitar acesso a arquivos com paths vindos do usuário (path traversal)
- ✅ Registrar erros de forma segura
- ✅ Aplicar rate limit em ações sensíveis

### Proibições absolutas

```ts
// PROIBIDO
"use server"
export async function action(data) {
  eval(data.code)              // RCE garantido
}
```

```ts
// PROIBIDO
"use server"
export async function action(input) {
  exec(input)                  // command injection
}
```

```ts
// PROIBIDO
"use server"
export async function action(modulePath) {
  await import(modulePath)     // module hijack
}
```

```ts
// PROIBIDO
"use server"
export async function action(modulePath) {
  require(modulePath)          // module hijack
}
```

```ts
// PROIBIDO
"use server"
export async function action(filePath) {
  return fs.readFile(filePath) // path traversal
}
```

### Padrão correto (esqueleto)

```ts
"use server"
import { z } from "zod"
import { getSession } from "@/lib/auth"

const Schema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
}).strict() // rejeita campos desconhecidos

export async function updatePost(formData: unknown) {
  const session = await getSession()
  if (!session) throw new Error("Não autenticado")

  const parsed = Schema.safeParse(formData)
  if (!parsed.success) throw new Error("Dados inválidos")

  const { id, title } = parsed.data

  // Verificar ownership
  const post = await db.post.findUnique({ where: { id } })
  if (!post || post.authorId !== session.userId) {
    throw new Error("Não autorizado")
  }

  await db.post.update({ where: { id }, data: { title } })
}
```

---

## 12. Validação de input

Aplicar em **toda** entrada vinda do usuário (Server Action, Route Handler, API, webhook, upload):

- validar **tipo**
- validar **tamanho** (string min/max, array length, payload bytes)
- validar **formato** (regex, email, UUID, URL)
- validar **enum** (allowlist)
- validar **permissões** do usuário
- validar **ownership** dos dados
- validar **arquivos** (MIME real, magic bytes, extensão allowlist)
- validar **paths** (sem `..`, sem caminho absoluto)
- **rejeitar campos desconhecidos** (`.strict()` no Zod)
- usar **allowlist** sempre que possível
- limitar **payload size** (Next.js: `bodyParser.sizeLimit`)
- limitar **profundidade de objetos** (evitar parser bombs)
- **evitar desserialização insegura** (não `JSON.parse` payload arbitrário com reviver perigoso)
- não confiar em JSON complexo sem schema
- **não confiar em TypeScript como validação runtime** (tipos somem na compilação)
- não confiar em validação frontend
- **sanitizar** dados conforme contexto (HTML → escape; SQL → prepared statements; shell → não usar shell)
- **escapar saída** conforme contexto (HTML, JSON, log)
- aplicar **rate limit** em endpoints sensíveis (login, signup, pagamento, IA)

**Bibliotecas recomendadas (escolher uma, manter no servidor):**

- Zod, Valibot, Yup, ArkType, io-ts

> Tipos TypeScript **não substituem** validação em runtime. Tipo é compile-time; entrada é runtime.

Combinar com `/api-backend-hardening`, `/webapp-hardening`, `/file-upload-security`.

---

## 13. APIs perigosas — proibir ou exigir justificativa forte

```js
eval()
new Function()
setTimeout("string", 0)         // forma string = eval implícito
setInterval("string", 0)        // forma string = eval implícito
child_process.exec()
child_process.execFile()
child_process.spawn()
child_process.fork()
vm.runInNewContext()
vm.runInThisContext()
vm.createContext()
require(userInput)
import(userInput)
fs.readFile(userInput)
fs.writeFile(userInput)
fs.unlink(userInput)
fs.createReadStream(userInput)
```

**Se forem indispensáveis:**

- validar input com **allowlist estrita**
- não usar shell quando possível (`exec` → `execFile` ou `spawn` com args separados)
- usar argumentos separados, nunca concatenar string de comando
- restringir permissões (uid/gid, chroot, container)
- isolar processo (worker, container, sandbox)
- limitar **timeout**
- limitar **tamanho de output**
- capturar erro sem vazar detalhes
- não retornar output sensível para o cliente
- registrar de forma segura (sem PII)
- **documentar justificativa** no código (comentário curto com PR/issue)

### Exemplo de `child_process` mais seguro

```ts
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const pExecFile = promisify(execFile)

// allowlist explícita
const ALLOWED = new Set(["status", "version"])

export async function runSafe(cmd: string) {
  if (!ALLOWED.has(cmd)) throw new Error("Comando não permitido")
  const { stdout } = await pExecFile("/usr/bin/myapp", [cmd], {
    timeout: 5000,
    maxBuffer: 1024 * 64,
  })
  return stdout
}
```

---

## 14. Dependências e supply chain

- ❌ Não instalar dependências sem necessidade
- ❌ Não usar pacotes desconhecidos
- ❌ Não usar pacote com nome parecido com famoso (typosquatting)
- ❌ Não usar `canary`, `beta`, `alpha`, `rc` em produção sem justificativa explícita
- ❌ Não remover lockfile
- ❌ Não ignorar advisory crítico
- ❌ Não instalar biblioteca visual apenas por estética
- ❌ Não instalar pacote de animação pesado sem necessidade
- ❌ Não usar CDN externa sem auditoria (SRI + integrity)
- ✅ Verificar **lockfile** (resolução real)
- ✅ Rodar **audit** regularmente
- ✅ Atualizar dependências vulneráveis
- ✅ Revisar **changelog** de major updates
- ✅ Usar versões fixas ou ranges seguros conforme padrão do projeto
- ✅ Em vulnerabilidade crítica de RCE: **atualização tem prioridade**

Combinar com `/dependency-firewall` antes de instalar/atualizar qualquer pacote.

---

## 15. Hardening de Next.js

### Arquivos a revisar

```text
next.config.js
next.config.mjs
next.config.ts
middleware.ts
middleware.js
app/api/
pages/api/
route.ts
route.js
Server Actions
headers
redirects
rewrites
image domains
experimental flags
```

### Regras

- ❌ Evitar flags experimentais sem necessidade
- ❌ Evitar canary em produção
- ❌ Não expor variáveis sem prefixo correto
- ❌ **Nunca colocar segredo em `NEXT_PUBLIC_*`** (essas variáveis vão para o bundle do cliente)
- ❌ Não usar `unstable_*` em produção
- ✅ Validar API routes (`pages/api/*`)
- ✅ Validar Route Handlers (`app/api/.../route.ts`)
- ✅ Validar Server Actions
- ✅ Configurar headers seguros quando possível
- ✅ Evitar rewrites perigosos (proxy aberto)
- ✅ Evitar CORS aberto sem necessidade
- ✅ Revisar middlewares que mexem com autenticação
- ❌ Não confiar em middleware como **única** camada de autorização crítica (sempre revalidar no handler)
- ✅ `images.remotePatterns` restrito (não usar `*`)

### Headers recomendados (quando compatíveis com a app)

```text
Content-Security-Policy
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY  (ou frame-ancestors via CSP)
```

### Exemplo de header em `next.config.js`

```js
module.exports = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // CSP requer análise específica - não aplicar genérico sem testar
        ],
      },
    ]
  },
}
```

**Regra:** Não aplicar header quebrando funcionalidade sem análise. CSP em particular exige iteração.

---

## 16. Ambiente e runtime

- ❌ Não rodar container como root
- ✅ Limitar permissões (uid não-root, capabilities mínimas)
- ✅ Manter Node atualizado (versão LTS ativa)
- ✅ Usar versão LTS, não EOL
- ❌ Não expor portas desnecessárias
- ✅ Usar variáveis de ambiente seguras (não em `NEXT_PUBLIC_*`)
- ✅ Separar dev / staging / prod (ambientes, credenciais, banco)
- ❌ Evitar `.env` no repositório (`.gitignore`)
- ✅ Restringir acesso ao painel de deploy (2FA, SSO)
- ✅ Aplicar WAF / rate limiting quando disponível (Cloudflare, Vercel WAF)
- ✅ Monitorar logs
- ✅ Configurar alertas
- ✅ Manter backups
- ✅ Limitar permissões de filesystem
- ✅ Limitar permissões de rede quando possível
- ❌ Não deixar ferramentas de debug expostas em produção (DevTools, Prisma Studio, etc.)

Combinar com `/docker-devops-hardening`, `/environment-strategy`, `/safe-deploy-hosting`.

---

## 17. Observabilidade e indicadores de comprometimento

**Procurar:**

- Requisições estranhas para endpoints RSC (`/_next/`, `?_rsc=`, paths do Flight protocol)
- Headers HTTP incomuns ou malformados
- Payloads muito grandes
- Payloads codificados (base64, hex) onde não deveria
- Erros 500 repetidos do mesmo IP/range
- Execução inesperada de comandos
- Criação de arquivos suspeitos em pastas write-enabled
- Alteração em `.env` ou em arquivos de configuração
- Processos Node desconhecidos rodando
- Conexões externas suspeitas (egress para IPs desconhecidos)
- Uso anormal de CPU/memória
- Uso anormal de rede (data exfiltration)
- Tentativas repetidas sem autenticação
- Logs contendo strings relacionadas a RSC, Flight ou Server Actions vindas de origens não esperadas
- Acessos incomuns a endpoints internos
- Comportamento fora do horário normal
- Arquivos novos em diretórios públicos (`public/`, `static/`, `uploads/`)

**Regra:** Logs **não devem** expor dados sensíveis para o usuário final. Mensagem ao usuário = genérica. Detalhe técnico = log interno protegido.

Combinar com `/logs-and-errors-hardening`.

---

## 18. Resposta a incidente

Se houver suspeita de exploração:

1. **Isolar a aplicação** (modo de manutenção, bloquear tráfego, desligar instância vulnerável)
2. **Preservar logs** (snapshot antes de qualquer ação)
3. Bloquear tráfego malicioso quando possível (WAF, IP block)
4. **Atualizar dependências vulneráveis** (item §9)
5. **Rotacionar secrets** (item §10) — pela máquina **limpa**
6. Revisar arquivos alterados (timestamps recentes, hashes)
7. Revisar processos em execução
8. Revisar usuários/credenciais (criação suspeita)
9. Revisar banco de dados (registros novos, alterações suspeitas)
10. Revisar webhooks configurados
11. Revisar integrações externas (tokens delegados)
12. **Fazer redeploy limpo** (build novo, não cache)
13. Monitorar tráfego por pelo menos 7 dias
14. **Documentar incidente** (timeline, ações, lições aprendidas)
15. **Informar pontos de incerteza** — não prometer 100% seguro sem evidência

Combinar com `/incident-diagnosis` (protocolo geral de incidentes) e `/hitl-checkpoint` (aprovação humana para ações irreversíveis).

---

## 19. Regra para projetos HostGator / PHP / frontend estático

Se o projeto for hospedagem compartilhada (HostGator, cPanel), HTML estático ou PHP leve:

- ❌ Não introduzir Node.js em produção sem necessidade explícita
- ❌ Não migrar para Next.js apenas por estética ou modismo
- ❌ Não exigir build server-side
- ❌ Não depender de SSR
- ❌ Não depender de React Server Components
- ❌ Não criar Server Actions
- ✅ Manter compatibilidade com `public_html`
- ✅ Usar PHP leve quando necessário
- ✅ Preferir frontend estático + PHP leve quando esse for o padrão do projeto

Se o usuário pedir React apenas para a interface, considerar **build estático** (Vite/CRA) sem servidor Node, quando adequado.

**Regra:** Não aumentar a superfície de ataque sem necessidade. Hospedagem compartilhada + PHP simples tem **muito menor** superfície de ataque para RCE via RSC do que Next.js SSR com Server Actions.

Combinar com `/php-shared-hosting-hardening`.

---

## 20. Relação com skills de design

Nenhuma skill de design pode:

- ❌ Instalar Next.js por estética
- ❌ Ativar SSR por aparência
- ❌ Adicionar RSC sem necessidade
- ❌ Adicionar Server Actions sem necessidade funcional
- ❌ Adicionar dependência visual vulnerável
- ❌ Trocar projeto estático por stack server-side sem justificativa
- ❌ Esconder erro de segurança por estética
- ❌ Remover aviso legal por "layout limpo"
- ❌ Remover loading/erro/sucesso por visual
- ❌ Instalar pacote de animação sem auditoria
- ❌ Usar CDN externa apenas por efeito visual (sem SRI)
- ❌ Criar backend Node onde frontend estático resolveria

Design excelente **deve existir dentro** de uma arquitetura segura. Hierarquia global (`/skill-orchestrator`): segurança > LGPD > integridade > preservação > testes > estabilidade > performance > organização > UX/design.

---

## 21. Preservação de projetos existentes

Quando já existir um projeto, **não apagar tudo e refazer do zero**.

### Antes de corrigir vulnerabilidade

1. Analisar estrutura existente
2. Identificar stack atual
3. Identificar dependências vulneráveis específicas
4. Identificar lockfile e versões resolvidas
5. Identificar rotas críticas (não quebrar URLs indexadas)
6. Identificar Server Actions existentes
7. Identificar APIs
8. Identificar secrets em uso
9. Identificar pipeline de deploy
10. Aplicar correção **incremental**
11. Atualizar **apenas o necessário** (não fazer major bump sem motivo)
12. Testar build
13. Preservar funcionalidades
14. Preservar validações já corretas
15. Preservar integrações
16. Documentar mudanças

Refatoração completa só se for **indispensável e com justificativa clara**. Mesmo nesse caso, preservar: requisitos, SEO, URLs importantes, conteúdo aprovado, integrações, rastreamento, dados, arquivos, identidade visual, funcionalidades críticas.

Combinar com `/preserve-existing-behavior` (soberana) e `/versioning-change-control`.

---

## 22. Checklist de auditoria

```text
[ ] O projeto usa Node.js?
[ ] O projeto usa Next.js?
[ ] O projeto usa React?
[ ] O projeto usa React 19?
[ ] O projeto usa App Router?
[ ] O projeto usa React Server Components?
[ ] O projeto usa Server Actions?
[ ] Existe diretiva "use server"?
[ ] Existe pacote react-server-dom-*?
[ ] As versões estão corrigidas conforme advisory oficial?
[ ] O lockfile confirma versões corrigidas (incluindo transitivas)?
[ ] Há dependências canary/beta/rc em produção?
[ ] Há eval?
[ ] Há new Function?
[ ] Há child_process?
[ ] Há vm?
[ ] Há import dinâmico com input do usuário?
[ ] Há require dinâmico com input do usuário?
[ ] Há API routes sem validação server-side?
[ ] Há Route Handlers sem validação server-side?
[ ] Há Server Actions sem validação server-side?
[ ] Há secrets em NEXT_PUBLIC_* indevidamente?
[ ] Há .env commitado?
[ ] Há mensagens de erro expondo detalhes técnicos?
[ ] Há logs com PII ou secrets?
[ ] Há uploads sem validação (MIME, tamanho, allowlist)?
[ ] Há CORS aberto sem necessidade?
[ ] Há proxy aberto via rewrites?
[ ] Há headers de segurança configurados?
[ ] Há WAF/rate limiting disponível e ativo?
[ ] Foi feito build após atualização?
[ ] Foi feito audit após atualização?
[ ] Foi considerada rotação de secrets?
[ ] Há plano de rollback?
[ ] Há monitoramento ativo de tentativas de exploração?
```

---

## 23. Resumo operacional

**Em uma frase:**

> Em qualquer projeto com React 19, Next.js App Router, RSC, Server Actions ou Node.js exposto, **primeiro confirme versões no advisory oficial**, depois atualize, depois valide inputs no servidor, depois proteja secrets, depois bloqueie APIs perigosas, depois preserve o resto.

**Fluxo curto:**

1. Detectar (§4–7)
2. Versão segura? (§8)
3. Não → atualizar (§9)
4. Rotacionar secrets se exposto (§10)
5. Auditar Server Actions e Route Handlers (§11–13)
6. Hardening Next.js (§15)
7. Observar (§17)
8. Documentar e seguir o checklist (§22)

**Em conflito com outras skills:** invocar `/skill-orchestrator`. Em ação irreversível (rollback de versão major, rotação massa de secrets, redeploy emergencial): invocar `/hitl-checkpoint`.

---

## Skills relacionadas

- `/preserve-existing-behavior` — soberana, antes de qualquer alteração
- `/skill-orchestrator` — em conflito entre skills
- `/dependency-firewall` — antes de instalar/atualizar qualquer pacote
- `/secrets-and-env-guard` — proteção e rotação de segredos
- `/incident-diagnosis` — protocolo geral de incidente
- `/hitl-checkpoint` — aprovação humana em ação crítica
- `/api-backend-hardening` — endpoints e webhooks
- `/webapp-hardening` — XSS/CSRF/CORS/headers
- `/frontend-hardening` — CDN, SRI, segredos no bundle
- `/node-python-build-hardening` — lockfile, scripts npm, build
- `/file-upload-security` — uploads com validação
- `/docker-devops-hardening` — runtime, container, CI/CD
- `/php-shared-hosting-hardening` — quando o projeto for PHP/HostGator
- `/safe-deploy-hosting` — backup, rollback, ambiente correto
- `/pre-deploy-security-review` — checklist antes de publicar
- `/logs-and-errors-hardening` — mensagens e PII em logs
- `/lgpd-compliance-check` — dados pessoais envolvidos

---

## Frase-guia

> RCE em RSC não se resolve com workaround visual. Se a versão é vulnerável, atualize. Se a Server Action recebe input sem schema, valide. Se um segredo vazou, rotacione. Se a arquitetura SSR não era necessária, questione antes de aceitar o ônus.

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
