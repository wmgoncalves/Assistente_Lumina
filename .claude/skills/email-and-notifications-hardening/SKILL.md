---
name: email-and-notifications-hardening
description: Endurecimento de envio de e-mail, SMS e notificações. Cobre SPF/DKIM/DMARC, anti-phishing, validação de e-mail do usuário, rate limit, anti-abuse, opt-out funcional, sandbox. Use em qualquer projeto que envie e-mail/SMS para usuários.
---

# email-and-notifications-hardening

Use em **qualquer projeto que envie e-mail/SMS** — transacionais (recibo, recuperação de senha) ou marketing.

## Princípios

1. **Domínio autenticado** (SPF + DKIM + DMARC) ou o e-mail vira spam
2. **Conteúdo seguro** — sem dado sensível desnecessário, sem link suspeito
3. **Opt-out funcional** sempre que aplicável
4. **Anti-abuso** — não permitir que sua API vire vetor de phishing
5. **Logs** com mascaramento

## Autenticação de domínio

### SPF (Sender Policy Framework)
- Registro TXT no DNS do domínio remetente
- Lista IPs/serviços autorizados a enviar em nome do domínio

```
v=spf1 include:_spf.google.com include:sendgrid.net -all
```
- `-all` (hard fail) ou `~all` (soft fail) — preferir `-all` quando confiante

### DKIM (DomainKeys Identified Mail)
- Assinatura criptográfica no header do e-mail
- Chave pública publicada no DNS
- Provedor (SendGrid, SES, Brevo, Resend) gera e gerencia
- Configurar **antes** de começar a enviar — afeta deliverability

### DMARC (Domain-based Message Authentication, Reporting and Conformance)
- Política que diz o que fazer quando SPF/DKIM falham
- Registro TXT em `_dmarc.<domínio>`

```
v=DMARC1; p=quarantine; rua=mailto:dmarc@dvdigital.com.br; pct=100
```
- `p=none` (monitor) → `p=quarantine` (suspeito vai pra spam) → `p=reject` (rejeita)
- Subir gradualmente, monitorar relatórios

### BIMI (opcional)
- Logo do seu domínio aparece na caixa de entrada do destinatário
- Requer DMARC `p=quarantine` ou `p=reject` + VMC

## Provedor de envio

### Recomendados
- **SendGrid, AWS SES, Brevo (ex-Sendinblue), Resend, Mailgun, Postmark**
- Têm reputação de IP + ferramentas anti-spam
- DKIM/SPF orientado

### NÃO usar
- SMTP da hospedagem compartilhada para volume sério (IP compartilhado, reputação ruim)
- Servidor SMTP próprio sem expertise (manter reputação é trabalho dedicado)
- Provedor sem DPA (LGPD)

### DPA
- Provedor processa PII (e-mails dos clientes)
- DPA obrigatório
- Verificar onde armazenam (transferência internacional)

## Validação de e-mail do usuário

### Sintaxe
- Regex razoável (não tentar regex "perfeito")
- Aceitar `+` no local part (`user+tag@gmail.com` é válido)
- Aceitar Unicode (IDN — `usuario@açai.com.br`)

### Existência (opcional)
- MX record check (domínio tem servidor de e-mail?)
- Não fazer SMTP probing (mal visto, pode bloquear sua reputação)
- Sempre **confirmar com link** (double opt-in)

### Anti-disposable
- Lista de domínios descartáveis (mailinator, 10minutemail, etc.)
- Se contexto exige (signup com benefício), bloquear ou pedir verificação extra

## Double opt-in (LGPD)

Para listas de marketing:
1. Usuário se cadastra
2. Sistema envia e-mail com link de confirmação
3. Usuário clica → conta confirmada
4. Só envia marketing após confirmação

Registrar:
- Data, hora, IP da inscrição
- Data, hora do clique de confirmação
- Versão do termo aceito

## Conteúdo do e-mail

### Cabeçalhos
- `From: Nome <noreply@seudominio.com.br>` (domínio que você controla)
- `Reply-To: contato@seudominio.com.br` (se aplicável)
- `List-Unsubscribe: <https://...>, <mailto:...>` (em marketing, obrigatório)
- `Message-ID:` único

### Corpo
- HTML + texto puro (multipart)
- Sem JavaScript (não renderiza, e mesmo se renderizasse seria perigoso)
- Imagens hospedadas em servidor confiável (não em CDN suspeito)
- Sem tracking pixel sem consentimento (LGPD)
- Tom claro, sem urgência falsa
- Sem anexo executável (.exe, .scr, etc.)

### Link
- HTTPS sempre
- Domínio reconhecível (não link encurtado em transacional — parece phishing)
- Token de ação com expiração curta
- Não passar PII em query string

### Dados sensíveis
- **Nunca** enviar senha (você não deveria nem ter a senha)
- **Nunca** enviar dado de cartão completo
- Mascarar quando referenciar (`****-****-****-1234`)
- Códigos OTP: expiração curta (5-10 min), uso único

### Aviso de "não responder"
Se for noreply, dizer claramente. Mas preferir um e-mail que tem resposta humana (suporte).

## Recuperação de senha

- Token CSPRNG (256 bits)
- TTL curto (15-30 min)
- Uso único
- Notificar conta após reset bem-sucedido
- Notificar antes — "se não foi você, ignore" — mesmo se conta não existir (genérico)
- Não revelar se e-mail existe

## Rate limit e anti-abuse

### Por destinatário
- Máximo N e-mails para mesmo destinatário em janela (anti-loop, anti-spam)

### Por origem (formulário)
- "Esqueci minha senha": 3-5 por hora por e-mail
- "Convidar amigo": limite para não virar vetor de spam
- Contato/feedback: rate limit + CAPTCHA

### Por sistema
- Limite global (anti-vetor — se sua app for invadida, atacante não envia 1M de e-mails)
- Alertas em spike anômalo
- Kill switch global

## Anti-phishing reflexão

Se sua app envia link clicável vinculado a ação:
- Tokens, não dados em URL
- Aviso visual em mudança de e-mail/senha
- Banner: "este link é válido por X minutos. Se você não solicitou, ignore."

## SMS

### Provedores
- Twilio, Zenvia (Brasil), SmsKing, etc.
- Custo por mensagem — vigiar limite

### Conteúdo
- Curto (160 chars)
- Identificar remetente
- Sem link encurtado (parece phishing)
- OTP: curto, expira rápido

### Rate limit
- Por número
- Anti-abuso (não permitir spam de SMS premium)

### LGPD
- Consentimento para marketing
- Opt-out funcional ("PARE" reenvia stop confirmation)

## Notificações push

- Token de dispositivo armazenado com cuidado (vincula ao usuário)
- Permissão pedida com contexto (não no primeiro segundo da visita)
- Conteúdo sem PII (visível na tela bloqueada)
- Opt-out fácil

## Logs

**Logar:**
- Destinatário (mascarar: `j***@e***.com`)
- Tipo (transacional/marketing)
- Status (enviado, entregue, aberto, clicado, bounced)
- Provider message ID

**Não logar:**
- Corpo completo
- Conteúdo de OTP
- Token de ação cru

## Monitoramento

- **Bounce rate**: > 5% = problema (lista suja ou reputação)
- **Complaint rate**: > 0.1% = problema (conteúdo ruim ou consentimento questionável)
- **Open rate**: queda súbita = entregabilidade afetada
- **Spam rate**: monitorar Google Postmaster Tools

## Recusas obrigatórias

- Enviar senha por e-mail
- Enviar cartão completo por e-mail
- Marketing sem consentimento (opt-in)
- Marketing sem opt-out funcional
- E-mail sem SPF/DKIM/DMARC em produção
- Cookie tracking sem consentimento (LGPD)
- API de envio sem rate limit (vetor de spam)
- Anexo executável
- Link encurtado em transacional
- "Confirme sua senha respondendo este e-mail"

## Checklist mínimo

- [ ] SPF, DKIM e DMARC configurados no domínio
- [ ] DMARC monitor → quarantine → reject (gradual)
- [ ] Provedor de envio com DPA
- [ ] Double opt-in para marketing
- [ ] List-Unsubscribe em e-mails de marketing
- [ ] Tokens de ação com TTL e uso único
- [ ] Rate limit em endpoints de envio (recuperação, convite)
- [ ] Logs com mascaramento
- [ ] Monitoramento de bounce/complaint
- [ ] Kill switch global
- [ ] OTP com expiração curta
- [ ] Sem PII em URL/log

## Conexão com skills do vault

- Skill 06 (LGPD) — base legal, opt-in, opt-out, retenção
- Skill 14 (Supply Chain) — SDK do provedor
- Skill 04 (Logs Seguros) — mascaramento
- Skill 17 (APIs/Integrações) — webhook do provedor (bounce, click)
- Skill 01 (Zero Trust) — entrada do usuário (e-mail) não-confiável

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
