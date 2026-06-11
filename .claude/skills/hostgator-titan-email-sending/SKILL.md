---
name: hostgator-titan-email-sending
description: Use ao implementar envio de e-mail transacional (recuperação de senha, convite, notificação) em projeto PHP cujo domínio está na HostGator com e-mail Titan (MX *.titan.email). Cobre SMTP autenticado via PHPMailer, por que NÃO usar mail(), config que funciona e o troubleshooting do erro 535.
---

# Envio de e-mail em domínio HostGator + Titan (PHP)

Padrão **comprovado** em produção (projeto *Site - Evolution*, `noreply@evolutionmentorias.com.br`) e reusado na *Plataforma de Gestão Profissional* (`noreply@cliente-a.exemplo.com.br`).

## Regra de ouro
**Use SMTP autenticado (PHPMailer). NÃO use `mail()`.**
Como o MX do domínio aponta para o Titan, enviar pelo `mail()` do servidor PHP da HostGator **falha SPF/DKIM → cai em spam**. O SMTP autenticado direto no Titan herda SPF/DKIM e entrega na caixa.

> `mail()` só serve como *fallback* de resiliência (transport `auto`), ciente do risco de spam.

## Config que funciona (igual nos dois projetos)
| Campo | Valor |
|---|---|
| Host | `smtp.titan.email` |
| Porta | `465` (SSL/SMTPS) — preferida · ou `587` (STARTTLS) |
| SMTPSecure | `465` → `ENCRYPTION_SMTPS` · `587` → `ENCRYPTION_STARTTLS` |
| Username | e-mail completo (ex.: `noreply@dominio.com.br`) |
| Password | **senha do mailbox** (ver gotcha abaixo) |
| CharSet | `UTF-8` |

## Implementação
1. **Vendore o PHPMailer** (3 arquivos: `PHPMailer.php`, `SMTP.php`, `Exception.php`, namespace `PHPMailer\PHPMailer`) numa pasta fora do public_html; `require_once` manual (não entra em autoloader PSR-4 de outro namespace).
2. Setup mínimo:
```php
$mail = new PHPMailer\PHPMailer\PHPMailer(true);
$mail->isSMTP();
$mail->Host = 'smtp.titan.email';
$mail->Port = 465;
$mail->SMTPAuth = true;
$mail->Username = $user;          // e-mail completo
$mail->Password = $pass;          // senha do mailbox
$mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS; // 465
$mail->CharSet = 'UTF-8';
$mail->setFrom($user, $fromName);
$mail->addAddress($to, $toName);
$mail->isHTML(true);
$mail->Subject = $subject; $mail->Body = $html; $mail->AltBody = strip_tags($html);
$mail->send();                    // lança Exception em falha
```
3. **Segredos**: senha SMTP só em `config.php` **fora do public_html** e **fora do git** (`.gitignore`). Nunca no front.
4. **Em dev/localhost**: deixe desabilitado (cai em log) — o Titan SMTP funciona de localhost se as credenciais estiverem certas, mas não force envio real em dev.

## Troubleshooting — `535 5.7.8 Error: authentication failed`
Significa **senha do mailbox errada/rejeitada no SMTP** — NÃO é código, porta nem método (o mesmo PHPMailer que funciona em outro domínio dá 535 com senha errada).
- **Logar no webmail NÃO valida a senha de SMTP.** O webmail `titan.hostgator.com.br/mail` abre por **SSO do painel HostGator** — não digita a senha do mailbox. Então "entro no webmail" ≠ "senha de SMTP correta".
- **Fix:** redefinir a senha **do mailbox** no admin Titan (painel HostGator → E-mail → gerenciar a caixa) e usar exatamente ela. Confirmar deslogando do webmail e logando **digitando** a senha.
- Servidor responde `smtp-out.flockmail.com` e anuncia `AUTH PLAIN LOGIN` → AUTH está habilitado; o 535 é por credencial.

## Para diagnosticar
PHPMailer com `SMTPDebug = SMTP::DEBUG_SERVER` mostra a conversa completa. Se chega em `334 Password:` e recebe `535`, é credencial.

## Checklist
- [ ] PHPMailer vendored + require manual.
- [ ] Host/porta/secure conforme tabela.
- [ ] Username = e-mail completo; Password = senha do **mailbox** (não a do painel).
- [ ] `CharSet='UTF-8'`, `isHTML(true)`, `AltBody` setado.
- [ ] Segredos fora do public_html e do git.
- [ ] Testado o envio real para uma caixa externa (Gmail/Hotmail), conferindo Spam.
- [ ] (Opcional) SPF `include:spf.titan.email`, DKIM e DMARC no DNS.
