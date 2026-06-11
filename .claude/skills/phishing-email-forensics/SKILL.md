---
name: phishing-email-forensics
description: Investigacao forense de e-mail de phishing recebido em ambiente corporativo - decode de header com Python, detonacao de URL/anexo em sandbox, identificacao de usuarios impactados, busca e purga em Microsoft 365/Google Workspace, integracao com Defender/Proofpoint/Mimecast/Splunk, cadeia de custodia, scoping de campanha, escrita de relatorio. Complementa anti-phishing-defense (defesa preventiva) com o lado investigacao apos clique ou denuncia. Use quando usuario reporta e-mail suspeito que precisa investigacao formal, em SOC operations, ou para auditar campanha de phishing dirigida.
---

# phishing-email-forensics

> **Frase-guia:** Antes de purgar, investigar. Antes de investigar, preservar. Antes de notificar, validar com canal alternativo.

## 0. Regra suprema

Investigação de phishing é **ação forense**. Toda análise tem cadeia de custódia. Não responder ao atacante, não clicar em link suspeito em browser normal, não baixar anexo fora de sandbox. Em conflito entre velocidade de resposta e preservação de evidência, **preservação vence**.

Esta skill é complementar a `/anti-phishing-defense` (preventiva). Foco aqui é **post-incidente** ou investigação forense formal.

---

## 1. Objetivo

Investigar e responder formalmente a incidente de phishing recebido em ambiente corporativo:

- **Análise técnica de e-mail** (header parsing, SPF/DKIM/DMARC results, hop analysis)
- **Detonação segura** de URL e anexo (sandbox, não em estação)
- **Identificação de escopo** (quantos usuários receberam, quantos clicaram, quantos forneceram credencial)
- **Containment** (purga via Defender Search & Purge, Google Workspace Investigation Tool, regras de gateway)
- **Identificação do atacante** quando possível (infra, registrar, campanhas relacionadas)
- **Mapeamento a MITRE ATT&CK** (T1566.001 spearphishing attachment, T1566.002 link, T1566.003 service, T1598 phishing for information)
- **Relatório formal** para cliente/management/regulador
- **Lições aprendidas** que viram regras de gateway/treinamento

---

## 2. Por que esta skill existe

A `/anti-phishing-defense` cobre **prevenção e resposta pessoal** (não clicar, reportar, rotacionar). Esta skill cobre o **trabalho forense estruturado** para:

- DV Digital atendendo cliente corporativo com SOC
- Investigação interna após user clicar
- Auditoria de campanha que escapou do gateway
- Relatório para diretoria/jurídico/ANPD
- Threat hunting retroativo (procurar quem mais recebeu nos últimos 30 dias)

---

## 3. Prioridade

1. **Preservar** original `.eml` + headers + screenshot do user
2. **Conter** o que ainda está chegando (regras temporárias de bloqueio)
3. **Avaliar escopo** (quantos receberam, clicaram, forneceram)
4. **Erradicar** mensagens (purga) e remediar usuários impactados (reset senha, revogar token)
5. **Investigar atacante** (infra, IOCs, atribuição)
6. **Documentar** cadeia de custódia e timeline
7. **Reportar** para stakeholders
8. **Hardenizar** para evitar recorrência (regras de gateway, treinamento, DMARC)

---

## 4. Quando usar

- Usuário reportou e-mail via botão "Reportar phishing" do Outlook/Gmail
- Helpdesk recebeu ticket com print de e-mail suspeito
- Gateway de e-mail flagou mensagem que passou pelo filtro inicial (Proofpoint, Mimecast, Defender)
- Detecção automática achou URL de credential harvesting ou anexo malicioso
- Campanha visando organização específica precisa scope assessment
- Auditoria mensal de e-mails marcados como spam de alta confiança
- Cliente da DV Digital com tenant Microsoft 365 ou Google Workspace foi alvo
- Suspeita de BEC (Business Email Compromise) — pedido de mudança de dados bancários

**Não usar para:**
- Spam comercial sem intenção maliciosa (rotear para email admin tunar filtro)
- Newsletter legítima não desejada (unsubscribe)
- E-mails internos com bug (corrigir, não investigar)

---

## 5. Prerequisites operacionais

Para fazer investigação séria, ter acesso a:

- Logs do gateway de e-mail (Proofpoint TAP, Mimecast Threat Intelligence, Microsoft Defender for Office 365)
- SIEM com ingestão de logs de e-mail (O365 Message Trace, Exchange tracking logs, Splunk, Sentinel)
- Sandbox para detonação (Any.Run, Joe Sandbox, Hybrid Analysis, VMRay)
- Microsoft Graph API ou Exchange Admin Center para busca e purga
- Google Workspace Investigation Tool (admin)
- URLScan.io + VirusTotal API keys (manual, não automatizar com URL de cliente)
- VirusTotal Enterprise (se houver) para search histórico
- urlscan.io API
- abuse.ch, PhishTank, OpenPhish bases comunitárias
- Estação de análise isolada (VM dedicated, ou Tails)

**Se não tiver tudo:** trabalhar com o que tem, documentar limitações no relatório.

---

## 6. Fluxo forense em 10 etapas

### Etapa 1 — Coleta inicial

1. **Solicitar `.eml` original** do usuário que reportou (em Outlook: arrastar e-mail para desktop)
2. **Não pedir forward** (perde headers originais)
3. **Confirmar identidade do reportante** (pode ser social engineering)
4. **Documentar hora exata** do recebimento e do report
5. **Hash do `.eml`** (SHA-256) para cadeia de custódia
6. **Arquivar `.eml`** em pasta de evidências com naming convention: `YYYY-MM-DD-HH-MM-<reporter>-<hash8>.eml`

### Etapa 2 — Análise de header

Decode automatizado com Python:

```python
#!/usr/bin/env python3
# header_analyzer.py
import email
import sys
from email import policy
import re
import json
import hashlib

def analyze(eml_path):
    with open(eml_path, 'rb') as f:
        msg = email.message_from_binary_file(f, policy=policy.default)

    result = {
        'sha256': hashlib.sha256(open(eml_path, 'rb').read()).hexdigest(),
        'from': msg.get('From'),
        'reply_to': msg.get('Reply-To'),
        'return_path': msg.get('Return-Path'),
        'sender': msg.get('Sender'),
        'to': msg.get('To'),
        'subject': msg.get('Subject'),
        'date': msg.get('Date'),
        'message_id': msg.get('Message-ID'),
        'auth_results': msg.get('Authentication-Results'),
        'spf': msg.get('Received-SPF'),
        'dkim': msg.get('DKIM-Signature'),
        'x_mailer': msg.get('X-Mailer'),
        'received_hops': [],
        'mismatch_from_replyto': False,
        'urls': [],
        'attachments': [],
    }

    # Hops de Received (do mais antigo para o mais recente)
    for hop in msg.get_all('Received', []):
        result['received_hops'].insert(0, hop[:200])

    # Mismatch From vs Reply-To
    if result['reply_to'] and result['from']:
        from_domain = re.search(r'@([\w.-]+)', result['from'])
        rto_domain = re.search(r'@([\w.-]+)', result['reply_to'])
        if from_domain and rto_domain and from_domain.group(1) != rto_domain.group(1):
            result['mismatch_from_replyto'] = True

    # Extrair URLs do corpo
    for part in msg.walk():
        ctype = part.get_content_type()
        if ctype in ('text/plain', 'text/html'):
            body = part.get_content() if part.get_content_disposition() != 'attachment' else ''
            urls = re.findall(r'https?://[^\s<>"\']+', body)
            result['urls'].extend(urls[:50])  # limite

        # Anexos
        if part.get_content_disposition() == 'attachment':
            fname = part.get_filename() or 'unknown'
            payload = part.get_payload(decode=True) or b''
            result['attachments'].append({
                'filename': fname,
                'size': len(payload),
                'sha256': hashlib.sha256(payload).hexdigest(),
                'content_type': ctype,
            })

    return result

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: header_analyzer.py <eml_file>")
        sys.exit(1)
    print(json.dumps(analyze(sys.argv[1]), indent=2, default=str))
```

Pontos críticos a observar no output:

- **`auth_results`**: SPF/DKIM/DMARC com `fail` ou `none` é red flag
- **`mismatch_from_replyto`**: `True` é red flag (atacante quer respostas em outro endereço)
- **`received_hops`**: servidor de origem estranho, IP em país inesperado
- **`message_id`**: domínio diferente do `From` é red flag
- **`x_mailer`**: software de envio (PHPMailer, sendmail-old) pode ser red flag
- **`urls`**: contar quantas, identificar domínios, lookalike

### Etapa 3 — Análise de URLs (sem clicar)

```bash
# Para cada URL extraída, sem visitar:
URL="https://suspeito.exemplo.com/login"

# Resolve sem visitar
dig +short "$(echo $URL | awk -F/ '{print $3}')"

# Whois
whois "$(echo $URL | awk -F/ '{print $3}')" | grep -iE "creation|registrant|created"

# URLScan público
curl -X POST "https://urlscan.io/api/v1/scan/" \
     -H "API-Key: $URLSCAN_KEY" \
     -H "Content-Type: application/json" \
     -d "{\"url\":\"$URL\",\"visibility\":\"public\"}"

# VirusTotal
curl -G "https://www.virustotal.com/api/v3/urls" \
     -H "x-apikey: $VT_KEY" \
     --data-urlencode "url=$URL"

# Reputação
curl "https://www.phishtank.com/checkurl/" -d "url=$URL"
```

### Etapa 4 — Detonação de anexo em sandbox

**Nunca abrir anexo em estação normal.** Upload em sandbox:

- **Any.Run** (interativo, vê comportamento em tempo real)
- **Joe Sandbox** (análise profunda)
- **Hybrid Analysis** (gratuito, do CrowdStrike)
- **VMRay** (enterprise)

Documentar do report do sandbox:
- Persistência criada (registry, scheduled task, startup folder)
- Conexões C2 (IP, domain, port)
- Arquivos criados (dropper, payload final)
- Comandos executados (PowerShell encoded, mshta, certutil)
- Hash do payload final
- Mapping a ATT&CK (T1204.002 — user execution malicious file)

### Etapa 5 — Identificar quem mais recebeu

**Microsoft 365 (Defender for Office 365):**

```text
Security & Compliance Center → Threat Management → Explorer
Filter: Sender = <atacante> OR Subject contains "<assunto>"
Range: últimos 30 dias
```

Ou via PowerShell:

```powershell
Connect-IPPSSession
Get-MessageTrace -StartDate (Get-Date).AddDays(-30) -EndDate (Get-Date) `
  -SenderAddress "atacante@evil.com" |
  Select-Object Received, SenderAddress, RecipientAddress, Subject, Status
```

**Google Workspace:**

Investigation Tool (admin) → Search:
```
metadata.sender_email: atacante@evil.com
metadata.date >= 2026-04-01
```

**Splunk genérico:**

```spl
index=email_logs sender="atacante@evil.com"
| stats count by recipient, subject
| sort -count
```

### Etapa 6 — Identificar quem clicou

**Microsoft 365 (URL Click Protection):**

```text
Security & Compliance → Threat Management → Explorer → URL clicks
Filter: URL = <url_do_phishing>
Result: lista de usuários que clicaram + verdict
```

**Proxy/SIEM (logs de saída):**

```spl
index=proxy_logs url="evil.com/login"
| stats count by user, src_ip, action
| where action="allowed"
```

**Caso confirme clique:** marcar usuário como impactado para etapa 8.

### Etapa 7 — Identificar quem forneceu credencial

Indicador forte: **login bem-sucedido logo após click** de usuário comprometido.

```spl
index=auth user=<usuario_que_clicou>
| where _time > <hora_do_click>
| stats values(src_ip), values(country), values(user_agent) by user
```

Red flags:
- IP em país diferente do habitual
- User-agent novo (TOR, datacenter)
- Login + criação de regra de inbox forwarding (BEC clássico)
- Login + envio em massa subsequente

### Etapa 8 — Containment

**Purgar mensagens** ainda na caixa de outros usuários:

```powershell
# M365 - Search & Purge
New-ComplianceSearch -Name "Phishing-2026-05-31" `
  -ExchangeLocation All `
  -ContentMatchQuery 'subject:"<assunto>" AND from:atacante@evil.com'
Start-ComplianceSearch -Identity "Phishing-2026-05-31"
# Aguardar conclusão...
New-ComplianceSearchAction -SearchName "Phishing-2026-05-31" `
  -Purge -PurgeType HardDelete
```

```text
Google Workspace: Investigation Tool → Actions → Delete or Mark as Spam
```

**Bloquear no gateway:**
- Adicionar regra: From contains `atacante@evil.com` → quarantine
- Adicionar regra: URL contains `evil-domain.com` → block
- Adicionar IP origem ao bloqueio (com cuidado para não bloquear hop legítimo)

**Reset de usuários impactados:**
- Reset senha (forçar mudança)
- Revogar todas as sessões ativas
- Revogar OAuth tokens
- Habilitar/verificar MFA
- Examinar regras de inbox (procurar forwarding rule maliciosa)
- Examinar app passwords criados recentemente

### Etapa 9 — Threat hunting retroativo

Procurar outras instâncias da mesma campanha:

```spl
# Mesmo sender em outros assuntos
index=email_logs sender="atacante@evil.com"
| stats count by subject, date_hour

# Mesmo domínio remetente, outros usuários
index=email_logs sender_domain="evil-domain.com"
| stats count by recipient

# Mesma URL em outros e-mails
index=email_logs url="evil-domain.com"
| stats count by sender, recipient

# IOC de payload (hash) em outros uploads/anexos
index=edr file_sha256="<hash_payload>"
```

### Etapa 10 — Documentar e reportar

Estrutura de relatório (modelo §11).

---

## 7. Decoder one-liner para inspeção rápida

Sem precisar do script Python:

```bash
# Salvar email em mail.eml e:
# Headers principais
grep -iE "^(from|to|reply-to|return-path|subject|date|message-id|authentication-results|received-spf|dkim-signature):" mail.eml | head -30

# URLs no corpo
grep -oE 'https?://[^[:space:]<>"]+' mail.eml | sort -u

# Hops Received (ordem reversa)
grep -i "^Received:" mail.eml | tac

# Anexos (Content-Disposition)
grep -i "Content-Disposition: attachment" mail.eml
```

---

## 8. IOCs comuns em campanhas

Padrões a coletar:

- **Sender**: e-mail completo, domínio
- **Reply-To**: e-mail diferente do sender
- **Subject**: padrão exato (variations comuns: "Re:", "Fwd:", "URGENT")
- **URLs**: domínio + path
- **Filename**: nome do anexo
- **Hash**: SHA-256 do anexo + dropper + final payload
- **C2**: domínios/IPs descobertos em sandbox
- **Mutex/Registry**: persistência do malware
- **Headers únicos**: X-PHP-Originating-Script, X-Mailer string customizada

Compartilhar em formato STIX/MISP quando possível (CERT.br aceita).

---

## 9. Integração com ferramentas SOC

### 9.1 Defender for Office 365

- Submissão de e-mail para Microsoft (aprende filtro global)
- Automated Investigation and Response (AIR) — automatiza purga
- Attack Simulation Training (para usar campanhas reais como treino, anonimizadas)

### 9.2 Proofpoint TAP

- TAP Dashboard → Forensics → ver detonação completa
- ET (Email Threat Detection) — verdict por mensagem
- TRAP — submissão para purga

### 9.3 Mimecast

- Targeted Threat Protection: URL Protect + Attachment Protect
- Threat Intelligence (export IOCs)
- Continuity (se tenant offline)

### 9.4 Splunk/Sentinel

Searches úteis:
```spl
# Phishing dashboard
index=email_logs (subject="*urgent*" OR subject="*confirm*" OR subject="*verify*")
| stats count by sender_domain
| sort -count

# Click rate
index=proxy_logs url_in_email=*
| stats count(eval(action="allowed")) AS clicks,
        count(eval(action="blocked")) AS blocked
        by user
```

### 9.5 SOAR (Tines, Splunk SOAR, Cortex XSOAR)

Playbook típico:
1. User reporta via "Phish Alert Button"
2. SOAR captura `.eml`
3. Análise automática (header, URL, hash)
4. Decisão: auto-purge ou escalar para humano
5. Notificar reporter ("recebido, analisando")
6. Notificar reporter ("malicioso confirmado" ou "falso positivo")

---

## 10. Cadeia de custódia

Tabela obrigatória no relatório:

| Evidência | Origem | Hora coletada | Hash SHA-256 | Coletor | Armazenamento |
|---|---|---|---|---|---|
| `mail.eml` | Outlook de `joao@cliente.com.br` | 2026-05-31 14:23:12 | `abc...` | [NOME] | `\\evid-server\phishing\2026-05-31\` |
| `payload.docx` | Anexo de `mail.eml` | 2026-05-31 14:25:00 | `def...` | [NOME] | idem |
| Screenshot do user | Outlook web do João | 2026-05-31 14:20:00 | `ghi...` | [NOME] | idem |

---

## 11. Modelo de relatório

```markdown
# Relatório de Incidente — Phishing dirigido a [Cliente]

## Resumo executivo

- Data do incidente: 2026-05-31
- Tipo: Spearphishing (T1566.001 — anexo)
- Severidade: [Baixa / Média / Alta / Crítica]
- Usuários impactados: X de Y total
- Containment: Concluído em HH:MM
- LGPD aplicável: [Sim/Não] — [justificar]

## Timeline

| Hora | Evento |
|---|---|
| 14:20 | E-mail recebido por João Silva |
| 14:23 | João reportou via Phish Alert Button |
| 14:25 | Análise iniciada por [NOME] |
| 14:40 | Confirmado malicioso (URL credential harvesting) |
| 14:45 | Containment: bloqueio no gateway + purge |
| 15:00 | 12 outros usuários receberam o mesmo e-mail |
| 15:10 | 2 usuários clicaram, 1 forneceu credencial |
| 15:15 | Reset senha + revogação de tokens dos 2 usuários |
| 15:30 | Relatório iniciado |

## Vetor

- Tipo: Spearphishing com anexo (T1566.001)
- Sender: `<email>` (domínio recém-registrado, 2026-05-15)
- Subject: "Atualização urgente de boleto"
- Anexo: `boleto.docx` (SHA-256: `abc...`)
- URL no corpo: `hxxps://lookalike-domain[.]com/login`

## Análise técnica

### Header
- SPF: Fail
- DKIM: None
- DMARC: Quarantine (mas tenant tem allowlist desnecessário — corrigir)
- Reply-To diferente do From (red flag)

### Anexo
- Tipo real: DOCX com macro VBA
- Sandbox: Any.Run job ID `<id>`
- Comportamento: download via PowerShell encoded → dropper `<hash>` em `%TEMP%`
- C2: `<ip>:443`

### URL
- VirusTotal: 8/89 detected
- urlscan.io: phishing confirmado, clone de Microsoft 365
- Whois: domínio registrado há 16 dias, registrant privado

## Escopo

- Receberam: 13 usuários
- Clicaram: 2 usuários
- Forneceram credencial: 1 usuário
- Conta comprometida: Maria Santos (`maria@cliente.com.br`)
- Atividade suspeita: criação de regra de forwarding para `attacker@gmail.com` 15 min após login

## Containment

- ✅ Bloqueio no gateway de sender + URL
- ✅ Purge de 11 mensagens restantes (Defender Search & Purge)
- ✅ Reset senha de Maria Santos
- ✅ Revogação de tokens OAuth
- ✅ Remoção da regra de forwarding maliciosa
- ✅ Verificação de outras regras (nenhuma adicional)
- ✅ Auditoria de envios de Maria nas últimas 24h (nenhum suspeito)

## Recomendações

- Treinamento dirigido com cenário desta campanha
- Habilitar MFA obrigatório para todos (atualmente opt-in)
- Endurecer DMARC: remover allowlist desnecessário
- Adicionar regra anti-lookalike no gateway
- Auditoria mensal de regras de inbox forwarding

## LGPD

- Dados afetados: credencial de e-mail corporativo de 1 usuário
- Dados pessoais expostos a terceiro: senha (já invalidada)
- Notificação ANPD: avaliar com jurídico (precedente de baixa severidade)
- Notificação ao titular: já feita por contato direto com Maria

## Anexos

- `mail.eml` (preservado em evidência)
- Hash do payload e IOCs
- Screenshot da regra de forwarding maliciosa
- Logs de busca e purga
- Relatório do sandbox
```

---

## 12. Integração com outras skills

- `/anti-phishing-defense` — defesa preventiva, treinamento, processo
- `/email-and-notifications-hardening` — lado emissor (SPF/DKIM/DMARC do próprio domínio)
- `/incident-diagnosis` — protocolo genérico (combinar)
- `/secrets-and-env-guard` — rotação pós-comprometimento
- `/lgpd-compliance-check` — notificação ANPD se PII vazou
- `/webshell-and-ioc-detection` — se phishing levou a comprometimento de servidor
- `/auth-and-session-hardening` — revogar tokens, MFA
- `/hitl-checkpoint` — purge em massa exige aprovação humana
- `/dns-and-subdomain-hardening` — typosquatting do domínio próprio (lookalike)

---

## 13. Checklist

```text
# Coleta
[ ] `.eml` original recebido (não forward)
[ ] Hash SHA-256 calculado
[ ] Cadeia de custódia documentada
[ ] Screenshot do user preservado

# Análise técnica
[ ] Header decoded
[ ] SPF/DKIM/DMARC results documentados
[ ] Mismatch From/Reply-To verificado
[ ] URLs extraídas e analisadas (urlscan, VT)
[ ] Anexo detonado em sandbox
[ ] Hash do payload final coletado
[ ] C2/IOCs documentados

# Escopo
[ ] Busca por outros recipients (último 30 dias)
[ ] Busca por clicks (Defender URL Protection ou proxy logs)
[ ] Busca por logins bem-sucedidos pós-click
[ ] Busca por atividade suspeita pós-credencial (forwarding rules)

# Containment
[ ] Mensagens purgadas (Defender ou GWS)
[ ] Gateway atualizado com regras de bloqueio
[ ] Senhas resetadas dos impactados
[ ] Tokens OAuth revogados
[ ] Regras de forwarding maliciosas removidas
[ ] MFA verificado/habilitado

# Threat hunting
[ ] IOCs em busca retroativa SIEM
[ ] Outros tenant do cliente verificados
[ ] Compartilhamento de IOCs (CERT.br, ISAC do setor)

# Relatório
[ ] Resumo executivo
[ ] Timeline
[ ] Vetor + análise técnica
[ ] Escopo
[ ] Containment ações
[ ] Recomendações
[ ] LGPD avaliada
[ ] Cadeia de custódia anexa
```

---

## 14. O que NÃO fazer

- ❌ Pedir user que faça forward (perde headers)
- ❌ Clicar em URL em browser normal
- ❌ Abrir anexo em estação
- ❌ Reset senha sem invalidar tokens (atacante mantém acesso)
- ❌ Purge sem confirmar com search prévio (pode apagar mensagens legítimas)
- ❌ Reportar a ANPD sem avaliar real escopo (notificação prematura)
- ❌ Bloquear IP do hop sem verificar (pode bloquear servidor compartilhado legítimo)
- ❌ Não preservar evidência por pressa de containment
- ❌ Não auditar regras de inbox da vítima (BEC clássico cria forwarding)
- ❌ Confiar em "MFA habilitado" sem validar que está ativo agora

---

## 15. Frase-guia final

> **Phishing investigação é cirurgia: preservar antes de remover, mapear escopo antes de purgar, validar comprometimento antes de notificar. Cadeia de custódia é a régua. SPF/DKIM/DMARC fail no header é só o começo — o ouro está nos hops Received e na detonação do anexo.**
