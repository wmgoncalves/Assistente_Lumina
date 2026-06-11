---
name: dns-and-subdomain-hardening
description: Higiene de DNS e prevencao de subdomain takeover, MX orfao, SPF stale, DKIM stale, DMARC fraco, CAA ausente, DNSSEC, wildcard perigoso, NS lame. Cobre detecao via dig+curl+crt.sh+dnstwist, fingerprints de takeover por servico (Heroku, GitHub Pages, Vercel, Netlify, S3, Azure, Fastly, Surge), mitigacao por tipo, inventario de zona em Markdown, auditoria trimestral. Complementa email-and-notifications-hardening (lado emissor) e safe-deploy-hosting (DNS em deploy). Use a cada 90 dias, antes de descontinuar servico/subdominio, apos migracao, ou em suspeita de phishing usando seu dominio.
---

# dns-and-subdomain-hardening

> **Frase-guia:** Todo subdomínio precisa ter dono, finalidade e data de revisão. CNAME órfão é fronteira de ataque esperando ser explorada.

## 0. Regra suprema

Segurança tem prioridade absoluta. Conveniência de "deixar o subdomínio antigo lá, ninguém vai descobrir" **não** justifica manter CNAME órfão. Subdomain takeover é vetor real, fácil e usado em phishing direcionado.

Correção **incremental**: catalogar zona, identificar órfãos, remover ou reapontar. Nunca remover registro sem verificar uso.

---

## 1. Objetivo

Detectar, mitigar e prevenir:

- **Subdomain takeover**: CNAME apontando para serviço expirado/abandonado (Heroku, Vercel, Netlify, GitHub Pages, AWS S3, Azure, Fastly, Surge, Tumblr, Shopify, Bitbucket, Cargo) que atacante pode registrar
- **Dangling DNS records**: A/AAAA para IP que outro cliente do provedor pegou
- **NS hijack**: nameserver delegado para conta abandonada
- **MX órfão**: registro apontando para servidor de e-mail morto (e-mails vão pro vazio ou são interceptados)
- **SPF stale**: include de serviço que não usa mais (vetor para spoofing)
- **DKIM stale**: chave pública de serviço antigo ainda válida
- **DMARC mal configurado**: `p=none` permanente, sem RUA, sem alinhamento
- **Wildcards perigosos**: `*.dominio.com` apontando para tudo
- **CAA ausente**: qualquer CA pode emitir cert
- **DNSSEC ausente**: zona vulnerável a cache poisoning
- **NS lame**: NS records que não respondem (instabilidade)
- **DNS rebinding**: TTL baixíssimo combinado com IP interno
- **Tipos antigos não removidos**: SPF type (deprecated), HINFO, RP expondo info do servidor

---

## 2. Contexto e cenários

### 2.1 Subdomain takeover — fluxo típico

1. Em 2023, você criou `app-antigo.dominio.com` apontando para `myapp.herokuapp.com`
2. Em 2024, removeu o app do Heroku mas **esqueceu o CNAME**
3. Atacante percebe que `myapp.herokuapp.com` é livre
4. Atacante registra `myapp` no Heroku
5. Agora `https://app-antigo.dominio.com` serve conteúdo do atacante
6. Atacante:
   - Faz phishing com URL legítima (do seu domínio próprio!)
   - Rouba cookies do domínio principal (se SameSite/cookie domain permitir)
   - Emite cert Let's Encrypt válido para o subdomínio
   - Quebra a confiança da marca

### 2.2 Serviços comumente abusados

| Serviço | Fingerprint de takeover |
|---|---|
| Heroku (`*.herokuapp.com`) | "There's nothing here yet" |
| GitHub Pages (`*.github.io`) | "There isn't a GitHub Pages site here" |
| Vercel (`*.vercel.app`) | "404: NOT_FOUND" + header `x-vercel-error` |
| Netlify (`*.netlify.app`) | "Not Found - Request ID" |
| AWS S3 (`*.s3.amazonaws.com`) | "NoSuchBucket" |
| Azure (`*.azurewebsites.net`) | "404 Web Site not found" |
| Bitbucket | "Repository not found" |
| Fastly | "Fastly error: unknown domain" |
| Surge | "project not found" |
| Tumblr | "Whatever you were looking for doesn't currently exist" |
| Shopify | "Sorry, this shop is currently unavailable" |
| Wordpress.com | "Do you want to register..." |

Lista atualizada: [github.com/EdOverflow/can-i-take-over-xyz](https://github.com/EdOverflow/can-i-take-over-xyz)

### 2.3 MX órfão — cenário

1. Migrou de Zoho para Google Workspace
2. Removeu Google MX, manteve Zoho MX por engano (ordem reversa)
3. Conta Zoho expirou
4. Outro inquilino abre conta Zoho com seu domínio → recebe seus e-mails

### 2.4 SPF stale — cenário

1. SPF tem `include:mailgun.org` de 2020
2. Você não usa mais Mailgun
3. Atacante abre conta Mailgun com seu domínio (até validação)
4. Spoofa e-mail saindo de IP autorizado pelo SPF
5. Recebedor valida SPF: passa

---

## 3. Prioridade

1. Identificar **CNAMEs órfãos** (alto risco — takeover)
2. Identificar **MX órfãos** (e-mail desviado)
3. Limpar **SPF stale** (spoofing)
4. Limpar **DKIM stale** (substituição de assinatura)
5. Endurecer **DMARC** (de `p=none` para `quarantine`/`reject`)
6. Adicionar **CAA** (controle de emissão de cert)
7. Considerar **DNSSEC** quando provider suporta
8. Remover **registros obsoletos** (SPF type, HINFO, RP)
9. Documentar zona em inventário versionado

---

## 4. Quando usar

- **Auditoria periódica** (trimestral) de zona DNS
- **Antes** de descontinuar serviço/subdomínio
- **Após** migração de servidor/provedor (e-mail, CDN, app)
- **Após** receber alerta de takeover (security researcher)
- Suspeita de phishing usando seu domínio
- Configuração inicial de domínio novo
- Antes de campanha publicitária (verificar saúde antes de tráfego pago)
- Após observar e-mails do domínio em spam (DMARC report)

---

## 5. Quando pode não se aplicar

- Domínio interno apenas, sem exposição pública
- Subdomínio gerenciado integralmente por provedor (Wix, Squarespace, Shopify) sem acesso a DNS

Mesmo assim, manter inventário básico.

---

## 6. Inventário de zona — primeiro passo sempre

Catálogo mínimo por registro:

- Nome
- Tipo (A, AAAA, CNAME, MX, TXT, NS, CAA, SRV)
- Valor
- TTL
- **Em uso?** (sim/não/desconhecido)
- **Dono / responsável**
- **Apontando para próprio ou terceiro?**
- **Próxima revisão**
- Última verificação

### 6.1 Template Markdown — exemplo de inventário

```markdown
---
data: 2026-05-16
proxima-revisao: 2026-08-16
responsavel: [SEU_NOME]
---

# Zona dvdigital.dev.br — Inventário

## Apex (dvdigital.dev.br)
| Registro | Valor | TTL | Em uso | Responsável | Notas |
|---|---|---|---|---|---|
| A | 1.2.3.4 (Cloudflare proxy → HostGator) | Auto | ✅ Sim | usuário | Origem HostGator |
| MX 10 | mail.dvdigital.dev.br | Auto | ✅ Sim | usuário | HostGator |
| TXT (SPF) | v=spf1 include:_spf.hostgator.com -all | Auto | ✅ Sim | usuário | Revisado 2026-05 |
| TXT (DMARC) | _dmarc → v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@... | Auto | ✅ Sim | usuário | Progressão concluída |
| CAA | 0 issue "letsencrypt.org" | Auto | ✅ Sim | usuário | Adicionado 2026-05 |
| CAA | 0 issuewild ";" | Auto | ✅ Sim | usuário | Nega wildcard |
| CAA | 0 iodef "mailto:security@..." | Auto | ✅ Sim | usuário | Alerta de emissão |

## Subdomínios
| Subdomínio | Tipo | Valor | Em uso | Responsável | Notas |
|---|---|---|---|---|---|
| www | A | 1.2.3.4 | ✅ Sim | usuário | |
| mail | CNAME | mx.hostgator.com | ✅ Sim | usuário | Cinza (não-proxy) |
| staging | CNAME | stg.vercel.app | ✅ Sim | usuário | Revisar 2026-08 |
| app-antigo | CNAME | app-antigo.herokuapp.com | ❌ ÓRFÃO | — | **REMOVER** |
| _dmarc | TXT | (ver acima) | ✅ Sim | usuário | |
| _domainkey | DKIM | (HostGator selector) | ✅ Sim | usuário | |
```

### 6.2 Domínios para inventariar ([SUA_EMPRESA] — auditar)

- `scapini.com.br`
- `transliquidos.com.br`
- `365logistica.com.br`
- `blueseguros.seg.br`
- `dvdigital.dev.br`
- `cliente-c.exemplo.com.br`
- `evolutionmentorias.com.br`
- `cliente-a.exemplo.com.br`
- `cliente-b.exemplo.adv.br`
- `cliente-d.exemplo.com.br`
- `umamulher-empoderada.com.br`

---

## 7. Comandos de auditoria

### 7.1 Listar todos os registros

```bash
# ANY (muitas resolvers limitam, mas tente)
dig dominio.com.br ANY +noall +answer
dig @1.1.1.1 dominio.com.br ANY

# Por tipo
dig dominio.com.br A +short
dig dominio.com.br AAAA +short
dig dominio.com.br MX +short
dig dominio.com.br NS +short
dig dominio.com.br TXT +short
dig dominio.com.br CAA +short
dig dominio.com.br DS +short  # DNSSEC
dig dominio.com.br SOA +short

# Forçar transferência de zona (raramente permitido, mas vale tentar)
dig @ns1.provedor.com dominio.com.br AXFR
```

### 7.2 Enumeração via Certificate Transparency (histórico)

```bash
# Descobre todos os subdomínios que já tiveram cert SSL
curl -s "https://crt.sh/?q=%25.dominio.com.br&output=json" |
  jq -r '.[].name_value' | sort -u

# Filtrar apenas únicos do domínio
curl -s "https://crt.sh/?q=%25.dominio.com.br&output=json" |
  jq -r '.[].name_value' | tr ',' '\n' | sort -u | grep -i dominio
```

### 7.3 Brute force de subdomínios comuns

```bash
for sub in www mail ftp app api staging dev test homologacao admin painel app2 blog loja shop \
            cdn assets static api2 v2 portal cliente cliente1 cliente2 erp crm wiki docs; do
  ip=$(dig +short ${sub}.dominio.com.br)
  if [ -n "$ip" ]; then
    echo "$sub.dominio.com.br → $ip"
  fi
done
```

### 7.4 Verificar CNAME apontando para serviço expirado

```bash
# 1. Pega o CNAME
cname=$(dig +short app-antigo.dominio.com.br CNAME)
echo "CNAME: $cname"

# 2. Testa se destino responde como esperado
curl -sI https://app-antigo.dominio.com.br | head -20

# 3. Verifica conteúdo do erro (fingerprint)
curl -s https://app-antigo.dominio.com.br | grep -iE "no such app|nothing here|not found|nosuchbucket"
```

### 7.5 Subjack (ferramenta dedicada)

```bash
# Instalar (Go)
go install github.com/haccer/subjack@latest

# Rodar
subjack -w subdominios.txt -t 50 -ssl -c ~/go/src/github.com/haccer/subjack/fingerprints.json -v
```

### 7.6 Verificar SPF

```bash
dig +short TXT dominio.com.br | grep -i spf1

# Validar limite de 10 DNS lookups
# Cada include: gasta 1 lookup
# Cada redirect=, a=, mx=, ptr=, exists= gasta 1 lookup
# Acima de 10 → SPF inválido, recebedor pode rejeitar

# Calcular includes:
spf=$(dig +short TXT dominio.com.br | grep spf1)
echo "$spf" | grep -oE 'include:[a-zA-Z0-9._-]+' | wc -l
```

### 7.7 Verificar DKIM (brute force de selectors)

```bash
for sel in google default mail dkim s1 s2 selector1 selector2 mailo k1 k2 \
            hostgator gator zoho mandrill mailgun sendgrid amazonses; do
  result=$(dig +short TXT ${sel}._domainkey.dominio.com.br)
  if [ -n "$result" ]; then
    echo "== $sel ==="
    echo "$result"
  fi
done
```

### 7.8 Verificar DMARC

```bash
dig +short TXT _dmarc.dominio.com.br

# Procurar:
# v=DMARC1
# p= (none|quarantine|reject)
# pct= (0..100)
# rua= (mailto: para relatórios agregados)
# ruf= (mailto: para relatórios forenses)
# sp= (subdomain policy)
# aspf= (alinhamento SPF: r=relaxed, s=strict)
# adkim= (alinhamento DKIM: r=relaxed, s=strict)
```

### 7.9 Verificar CAA

```bash
dig +short CAA dominio.com.br

# Procurar registros:
# 0 issue "letsencrypt.org"          # permite Let's Encrypt
# 0 issuewild ";"                    # nega wildcards
# 0 iodef "mailto:security@..."      # alerta de violação
```

### 7.10 Verificar DNSSEC

```bash
# DS record (existe quando DNSSEC ativo)
dig +short DS dominio.com.br

# Validar resposta com flags
dig +dnssec dominio.com.br
# Procurar: ad flag (authenticated data)

# Validador online:
# dnssec-analyzer.verisignlabs.com
```

### 7.11 Verificar MX (e-mail)

```bash
dig +short MX dominio.com.br

# Para cada MX, verificar se responde SMTP
for mx in $(dig +short MX dominio.com.br | awk '{print $2}'); do
  echo "== ${mx%.} =="
  nc -zv ${mx%.} 25 2>&1 | head -1
done
```

### 7.12 Ferramentas online complementares

- `mxtoolbox.com` — completo, free
- `dnscheck.tools` — auditoria rápida
- `intodns.com` — saúde da zona
- `dmarcian.com` — parser DMARC
- `easydmarc.com` — DMARC progressivo
- `hardenize.com` — auditoria completa free
- `securitytrails.com` — histórico de DNS
- `crt.sh` — certificate transparency

---

## 8. Subdomain takeover — detecção

### 8.1 Sinais

- CNAME aponta para `*.herokuapp.com`, `*.github.io`, `*.vercel.app`, etc.
- Destino HTTP responde com fingerprint conhecido (§2.2)
- A/AAAA aponta para IP que dá `connection refused`
- NXDOMAIN no destino do CNAME
- Cert SSL não bate com o CNAME

### 8.2 Procedimento de validação

```bash
# 1. Listar todos os CNAMEs
for sub in $(curl -s "https://crt.sh/?q=%25.dominio.com.br&output=json" | jq -r '.[].name_value' | sort -u); do
  cname=$(dig +short "$sub" CNAME 2>/dev/null | head -1)
  if [ -n "$cname" ]; then
    echo "$sub → $cname"
  fi
done

# 2. Para cada CNAME externo, testar HTTP
for sub in $(...); do
  resp=$(curl -sk --max-time 5 "https://$sub")
  echo "$sub: $(echo "$resp" | grep -oiE 'no such app|nothing here yet|nosuchbucket|404 web site not found|fastly error' | head -1)"
done
```

---

## 9. Mitigação por tipo de problema

### 9.1 CNAME órfão

1. **Confirmar** que não está em uso (404 dias, sem tráfego em logs, sem referência no código)
2. **Verificar** que removeu acesso no provider antes
3. **Remover registro** no DNS
4. **Aguardar propagação** (TTL)
5. **Documentar** no inventário

Se ainda usa parcialmente:
- Recriar o recurso no provider antes de remover DNS
- Ou apontar para uma página própria de "este recurso foi descontinuado"

### 9.2 MX órfão

1. Confirmar que e-mail funciona pelo MX atual (enviar teste real)
2. **Remover MX antigo**
3. Verificar SPF (remover include relacionado ao provider antigo)
4. Remover DKIM selector antigo
5. TTL baixo durante a janela de migração
6. Atualizar inventário

### 9.3 SPF stale

1. Listar todos os `include:`
2. Para cada, perguntar: "ainda usamos?"
3. **Remover não-usados**
4. Validar limite de 10 lookups DNS
5. Terminar em `-all` (reject) ou `~all` (softfail — só em transição)

Exemplo:
```text
# Antes (problemático — 12 lookups + mailgun não-usado)
v=spf1 include:_spf.google.com include:_spf.hostgator.com include:mailgun.org include:sendgrid.net ~all

# Depois (3 lookups, sem stale, hard fail)
v=spf1 include:_spf.google.com include:_spf.hostgator.com -all
```

### 9.4 DKIM stale

1. Listar selectors via brute force (§7.7)
2. Verificar com o provider atual qual selector está ativo
3. **Remover selectors órfãos**
4. Verificar que o atual ainda é assinado

### 9.5 DMARC frágil

Progressão recomendada:

```text
# Fase 1 — Monitoramento (2-4 semanas)
v=DMARC1; p=none; rua=mailto:dmarc@dominio.com.br; pct=100

# Fase 2 — Quarantine progressivo
v=DMARC1; p=quarantine; pct=10; rua=mailto:dmarc@dominio.com.br
# → depois pct=25, 50, 100

# Fase 3 — Reject
v=DMARC1; p=reject; rua=mailto:dmarc@dominio.com.br; sp=reject; adkim=s; aspf=s
```

Configurar `rua=mailto:dmarc@dominio.com.br` para receber relatórios agregados.

Parser sugerido: `dmarcian.com` ou `easydmarc.com` (free tier funciona).

### 9.6 CAA ausente

Adicionar:
```text
0 issue "letsencrypt.org"             # se usa Let's Encrypt
0 issue ";"                            # nega outras CAs (cuidado)
0 issuewild ";"                        # nega wildcards
0 iodef "mailto:security@dominio.com.br"  # alerta de violação
```

### 9.7 DNSSEC

Se provedor suporta (Cloudflare, AWS Route53, Google Cloud DNS sim; HostGator nem sempre):

1. **Habilitar DNSSEC** no DNS provider
2. **Atualizar DS record** no registrar (Registro.br, etc.)
3. **Aguardar propagação**
4. **Validar**: `dnssec-analyzer.verisignlabs.com`

### 9.8 Tipos obsoletos

Remover (se existirem):
- SPF type (deprecated; SPF vai em TXT)
- HINFO (revela host info)
- RP (responsável pelo domínio em texto)
- LOC (localização geográfica)

---

## 10. Fluxo de auditoria

### Sequência operacional

1. **Listar zona completa** (`dig ANY` + `crt.sh` para subdomínios históricos)
2. **Catalogar** em planilha/markdown
3. Para cada registro, identificar **em uso? aponta para quê?**
4. **CNAME** → verificar destino (HTTP + fingerprint de erro)
5. **SPF** → listar includes, validar uso, contar lookups
6. **DKIM** → brute force de selectors, validar atual
7. **DMARC** → conferir política, RUA, progressão
8. **CAA** → adicionar se ausente
9. **DNSSEC** → habilitar se possível
10. **Documentar findings**
11. **Aplicar mitigações** em ordem de risco (CNAME órfão > MX órfão > SPF stale > DMARC fraco > CAA ausente > DNSSEC)
12. **Re-verificar** pós-mudança
13. **Agendar próxima auditoria** (90 dias)

### Política antes de remover registro

```text
[ ] Verificou logs nos últimos 30 dias?
[ ] Confirmou com responsável (lista de inventário)?
[ ] Não há referência no código (grep no projeto)?
[ ] Baixou TTL para 5 min nas últimas 24h?
[ ] Criou backup/export da zona?
[ ] Comunicou equipe?
[ ] Definiu janela de rollback?
```

---

## 11. Política de subdomínio

Para todo subdomínio criado:

- **Dono atribuído** (quem é responsável)
- **Finalidade** documentada
- **Data de criação**
- **Data de expiração / próxima revisão**
- **Provider de destino**
- **Se temporário** (homologação, evento): data clara para remoção

Subdomínio órfão deve ser:
- **Removido** se sem uso confirmado, OU
- **Apontado** para página própria segura ("Este recurso foi descontinuado")

---

## 12. Integração com skills existentes

- `/email-and-notifications-hardening` — SPF/DKIM/DMARC do emissor (esta skill amplia para higiene completa)
- `/safe-deploy-hosting` — DNS em deploy/migração
- `/hosting-infrastructure-analysis` — escolha de provider de DNS (Cloudflare > HostGator nativo)
- `/incident-diagnosis` — durante incidente de phishing usando seu domínio
- `/anti-phishing-defense` — typosquatting, lookalike, vetor cruzado
- `/lgpd-compliance-check` — se subdomain takeover expôs PII
- `/waf-and-bot-mitigation` — proxy Cloudflare facilita
- `/preserve-existing-behavior` — antes de remover registro
- `/hitl-checkpoint` — remoção de registro DNS é ação delicada

---

## 13. Checklist de auditoria

```text
# Inventário
[ ] Lista completa de zonas DNS dos domínios da [SUA_EMPRESA]
[ ] Para cada zona, todos os registros catalogados em markdown
[ ] crt.sh consultado para subdomínios históricos
[ ] Cada subdomínio tem dono e finalidade documentados
[ ] Inventário versionado em _auditoria/dns/

# CNAMEs
[ ] Todos os CNAMEs externos testados (curl + fingerprint)
[ ] CNAMEs órfãos identificados e removidos
[ ] Política de "criar no provider antes do DNS, remover do DNS depois" em vigor

# MX
[ ] MX records validados (todos respondem SMTP)
[ ] MX órfãos removidos
[ ] Apenas o provider atual presente

# SPF
[ ] SPF revisado, includes atualizados
[ ] SPF abaixo do limite de 10 lookups
[ ] SPF termina em -all (ou ~all em transição)
[ ] Sem includes de provider não-usado

# DKIM
[ ] Selectors enumerados via brute force
[ ] Selectors órfãos removidos
[ ] Selector atual validado com envio teste

# DMARC
[ ] DMARC configurado (p=quarantine ou reject)
[ ] DMARC RUA configurado e monitorado
[ ] Parser de DMARC ativo (dmarcian/easydmarc)
[ ] Progressão de pct documentada

# CAA
[ ] CAA presente com issue da CA usada
[ ] CAA issuewild bloqueando wildcards (se não usa)
[ ] CAA iodef para alerta

# DNSSEC
[ ] DNSSEC habilitado (se provider suporta)
[ ] DS record atualizado no registrar
[ ] Validação ok (dnssec-analyzer)

# Higiene geral
[ ] Tipos obsoletos (SPF type, HINFO, RP) removidos
[ ] Wildcards revisados (sem * apontando para tudo)
[ ] TTL apropriado (baixo em migração, padrão em estável)
[ ] Hardenize.com / dnscheck.tools rodado e revisado

# Operacional
[ ] Próxima auditoria agendada (90 dias)
[ ] Política de subdomínio (dono + finalidade + revisão) em vigor
[ ] Inventário em _auditoria/dns/ atualizado
```

---

## 14. Atualização do CLAUDE.md (sugestão)

```markdown
## Higiene de DNS e prevenção de subdomain takeover

A cada 90 dias, ou antes/depois de descontinuar serviço, migrar provider ou em suspeita de phishing usando o domínio, invocar `/dns-and-subdomain-hardening`.

Domínios da [SUA_EMPRESA] a auditar trimestralmente:
- scapini.com.br, transliquidos.com.br, 365logistica.com.br, blueseguros.seg.br
- dvdigital.dev.br, evolutionmentorias.com.br, cliente-a.exemplo.com.br
- cliente-b.exemplo.adv.br, cliente-c.exemplo.com.br, cliente-d.exemplo.com.br

Regras:
- Todo CNAME para serviço terceiro tem ciclo de vida: criar no provider PRIMEIRO, remover do DNS DEPOIS de remover do provider
- DMARC progressivo: p=none (monitoramento) → quarantine 10% → quarantine 100% → reject
- SPF abaixo de 10 lookups; includes não usados removidos
- CAA presente em todo domínio público
- Inventário versionado em _auditoria/dns/ por domínio
- Subdomínio temporário precisa ter dono e data de expiração
- DNSSEC habilitado quando provider suporta
```

---

## 15. O que NÃO fazer

- ❌ Deixar CNAME apontando para serviço que parou de usar
- ❌ Manter MX antigo "por segurança"
- ❌ SPF com 15 includes (recebedor rejeita)
- ❌ `p=none` permanente (DMARC monitoramento eterno)
- ❌ Confiar em "ninguém vai descobrir o subdomínio"
- ❌ Remover registro sem TTL baixo nas 24h anteriores
- ❌ Remover sem inventariar primeiro
- ❌ Permitir wildcard CAA quando não precisa
- ❌ Esquecer CAA `iodef` (alerta de emissão indevida)
- ❌ Subdomínio temporário sem data de expiração

---

## 16. Critérios de aceite

- Inventário versionado em `_auditoria/dns/<dominio>.md`
- Todos os CNAMEs externos validados (sem fingerprint de takeover)
- MX limpo (apenas provider atual)
- SPF com ≤ 10 lookups e sem includes obsoletos
- DKIM com apenas selectors do provider atual
- DMARC em `quarantine` ou `reject` com RUA
- CAA presente com issue + iodef
- DNSSEC habilitado quando possível
- Próxima auditoria agendada (90 dias)

---

## 17. Frase-guia final

> **Todo subdomínio precisa ter dono, finalidade e data de revisão. CNAME órfão é fronteira de ataque esperando ser explorada. DMARC progressivo é o caminho — mas chegar em `reject` é a meta.**

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
