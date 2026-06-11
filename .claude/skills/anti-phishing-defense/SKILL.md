---
name: anti-phishing-defense
description: Defesa contra phishing recebido (e-mail, WhatsApp, SMS, telefone, LinkedIn, OAuth). Cobre BEC (Business Email Compromise), OAuth phishing, vishing, smishing, golpe do WhatsApp clonado, golpe do falso suporte HostGator, golpe do PIX/boleto, falsa PR no GitHub, falso recrutador, homograph/typosquatting, reverse tabnabbing, quishing. Complementa email-and-notifications-hardening (lado emissor) cobrindo o lado RECEPTOR. Use quando suspeita de mensagem maliciosa recebida ou para auditoria preventiva de processos da equipe e clientes.
---

# anti-phishing-defense

> **Frase-guia:** Antes de clicar, baixar, pagar ou responder, **pare**. Phishing aposta na pressa. A defesa começa em desconfiar e confirmar pelo canal alternativo.

## 0. Regra suprema

Segurança tem prioridade absoluta sobre conveniência, prazo, "parecer formal" e UX. Em conflito:

- segurança vence conveniência
- segurança vence prazo do cliente
- segurança vence "evitar parecer paranoico"
- segurança vence rapidez de resposta a chefe/cliente urgente

A defesa contra phishing é **incremental, controlada e revisável**. Preserva evidências antes de bloquear/excluir. Não substitui `email-and-notifications-hardening`; complementa.

---

## 1. Objetivo

Defender [SEU_NOME], equipe [SUA_EMPRESA], clientes da [SUA_EMPRESA] e usuários finais dos sistemas hospedados contra:

- **Phishing por e-mail** (spear phishing dirigido, bulk phishing em massa)
- **BEC (Business Email Compromise)**: impersonação de cliente, fornecedor, CEO, contador, advogado, banco
- **OAuth phishing**: app malicioso pedindo escopo amplo ("autorize este app a acessar Google Drive/Gmail/GitHub")
- **Vishing** (golpe por telefone/voz, deepfake de voz)
- **Smishing** (golpe por SMS, golpe do FGTS, Receita Federal, banco)
- **Phishing por WhatsApp** (clone do número, sequestro de conta, falso "mudei de número")
- **Phishing por LinkedIn** (falso recrutador, falso cliente, falso head-hunter)
- **Phishing contra admin de hospedagem** (falso "suporte HostGator", "sua conta será suspensa")
- **Phishing contra desenvolvedor** (falsa PR maliciosa no GitHub, falso pacote npm, falso "teste técnico")
- **Quishing** (QR code malicioso em cardápio, propaganda, e-mail)
- **Phishing via anúncio Google/Facebook** (typosquatting de domínio: `dv-digitall.com`, `evolutionmentoria.com.br`)
- **Reverse tabnabbing** (aba aberta troca conteúdo em background via `window.opener`)
- **Homograph attack** (domínio com caracteres unicode parecidos: `meusіte.com` com `і` cirílico)
- **Clone phishing** (e-mail legítimo antigo reenviado com link trocado)
- **Pharming** (DNS comprometido redirecionando)
- **Golpe do PIX** (boleto fake, PIX de fornecedor com chave trocada)
- **Sequestro de conta** (Instagram, WhatsApp, Google) usado para phishing contra contatos

---

## 2. Por que esta skill existe

A skill `/email-and-notifications-hardening` cobre o **lado emissor** (configurar SPF/DKIM/DMARC para que seu domínio não seja falsificado). Esta skill cobre o **lado receptor**: quando você, sua equipe ou seus clientes **recebem** uma mensagem maliciosa.

Cenários reais que motivam a skill:

- Cliente da [SUA_EMPRESA] recebe "atualize sua senha do site" linkando para domínio falso
- Admin da hospedagem recebe "alerta urgente HostGator" com link para painel falso
- Cliente recebe "boleto atualizado" no lugar do real (golpe do PIX)
- Desenvolvedor recebe PR/issue no GitHub com link malicioso ou pacote npm typosquatting
- Time recebe "convite Google Drive" pedindo OAuth de app desconhecido
- Cliente recebe WhatsApp do "[NOME]" pedindo PIX (clone do número, mesma foto)
- Falso recrutador no LinkedIn pedindo "teste técnico" com repositório malicioso
- Cliente recebe SMS "Receita Federal: irregularidade no CPF, clique aqui"
- Atendimento da Evolution Mentorias recebe "sou aluno, esqueci minha senha, manda o link"
- Cliente faz busca por "[MARCA_1] Transportes" no Google e clica em anúncio falso

---

## 3. Prioridade interna

1. **Não clicar / não baixar / não pagar / não responder** (em ordem)
2. **Preservar evidência** (cabeçalho do e-mail, screenshot, URL completa sem visitar)
3. **Confirmar por canal alternativo** se houver dúvida
4. **Reportar** (provedor, banco, equipe)
5. **Bloquear** comunicação maliciosa adiante
6. **Educar** (registrar caso, atualizar processo interno, comunicar cliente afetado)
7. **Hardenizar** (2FA, revogar OAuth, rotacionar credenciais se houve clique)
8. Performance, UX, design (sempre por último)

---

## 4. Quando usar esta skill

Acione esta skill imediatamente quando:

- Receber mensagem suspeita (e-mail, WhatsApp, SMS, ligação, LinkedIn, DM)
- Cliente reportar mensagem suspeita usando seu nome ou marca
- Padrão de urgência + autoridade + ameaça aparecer em comunicação
- Link com domínio "parecido" com legítimo (caractere a mais, hífen, TLD diferente)
- Anexo inesperado (`.zip`, `.pdf`, `.docx`, `.html`, `.htm`)
- Solicitação de OAuth não esperada
- Pedido de PIX/boleto fora do padrão (mudança de chave, urgência, valor alto)
- E-mail "do CEO/chefe" pedindo ação financeira urgente
- Pacote npm/composer/pip sugerido por terceiro com nome suspeito
- PR no GitHub vindo de conta nova com mudanças amplas em segurança
- Pedido para "validar pagamento" via link
- Pedido para "confirmar dados" via formulário externo
- QR code recebido sem contexto claro
- SMS de banco pedindo confirmação fora do app oficial
- Ligação se identificando como "suporte" e pedindo acesso/senha

Também em **modo proativo**:

- Auditoria periódica do processo de comunicação (trimestral)
- Treinamento de equipe
- Configuração inicial de canal de comunicação com cliente
- Quando assumir conta nova de cliente (revisar OAuth grants)
- Após vazamento famoso (logo após, há onda de credential stuffing + phishing dirigido)

---

## 5. Quando pode não se aplicar

- Comunicação 100% interna autenticada (Slack/Discord interno com 2FA, ferramenta com SSO)
- Aplicação offline sem comunicação externa
- Projeto pessoal sem dados de terceiros

Mesmo nestes casos, manter higiene preventiva — 2FA não custa nada.

---

## 6. Sinais de phishing — checklist de identificação

### 6.1 Cabeçalho de e-mail

Em Gmail: três pontos → "Mostrar original". Em Outlook: "Exibir → Cabeçalhos da mensagem".

Sinais:

- `From:` diferente de `Reply-To:` (resposta vai para outro endereço)
- `Return-Path:` diferente do remetente aparente
- `Authentication-Results:` com `spf=fail`, `dkim=fail`, `dmarc=fail`
- `Received:` mostra servidor estranho, não relacionado ao remetente aparente
- `Message-ID` com domínio diferente do remetente
- Lookalike: `support@hostg4tor.com`, `daniel@dv-digitall.com`, `noreply@mer-cadolivre.com`
- Display name confiável + endereço diferente: `"HostGator" <suporte@servidor-aleatorio.tk>`

### 6.2 Conteúdo / linguagem

- **Urgência**: "últimas 24h", "sua conta será excluída", "responda imediatamente"
- **Autoridade**: "Banco Central", "Receita Federal", "Polícia Federal", "IT Support"
- **Medo**: "acesso suspeito detectado", "fatura vencida", "processo judicial"
- **Recompensa**: "você ganhou", "reembolso pendente", "prêmio sorteio"
- Erros de português ou tradução literal (vírgulas estranhas, ordem de palavras invertida)
- Saudação genérica ("Prezado usuário", "Caro cliente")
- Link com **texto** diferente do **destino** real (`<a href="evil.com">banco.com.br</a>`)
- Pedido para "confirmar/validar/atualizar" dados via link
- Pedido para mover conversa para outro canal ("me chama no WhatsApp pessoal")

### 6.3 Link / URL

- Domínio com hífen extra ou letra trocada (`face-book.com`, `mercadolivre-br.com`)
- Caracteres Unicode (Cyrillic `а` ≠ Latin `a`; `і` ≠ `i`)
- Subdomínio enganoso (`hostgator.suporte-atendimento.com` — o domínio real é `suporte-atendimento.com`)
- IP em vez de domínio (`http://203.0.113.45/banco/login`)
- Encurtador (bit.ly, tinyurl, encurtador.com.br) — verificar destino antes
- HTTPS sem cadeado válido OU cadeado mas domínio errado
- Form de login fora do domínio oficial
- TLD suspeito (`.top`, `.tk`, `.click`, `.xyz`, `.zip` quando deveria ser `.com.br`/`.com`)
- `@` no meio da URL (`https://banco.com.br@evil.com` — usuário@host, host é `evil.com`)

### 6.4 Anexo

- `.html`, `.htm` (form de phishing local — abre formulário falso no browser)
- `.zip`, `.rar`, `.7z` com `.exe`, `.js`, `.lnk`, `.scr`, `.bat`, `.cmd`, `.iso` dentro
- `.docx`, `.xlsx`, `.docm`, `.xlsm` com macro
- `.pdf` solicitando "habilitar conteúdo"
- Nome duplicado: `fatura.pdf.exe`, `boleto.pdf.html`
- Anexo > esperado (ex: "boleto" de 5MB)
- Anexo de remetente que normalmente não envia anexo

### 6.5 OAuth phishing

- App **desconhecido** pedindo `mail.modify`, `drive.readonly`, `admin.directory`, `repo` (GitHub)
- Redirect para domínio **não** Google/Microsoft/GitHub
- "Continue with Google" em site não confiável
- Escopo amplo demais para a função alegada
- App sem verificação ("este app não foi verificado pelo Google" — vermelho)
- Logo bonito mas nome estranho

### 6.6 WhatsApp / Telegram

- Mensagem "oi, mudei de número, é o [NOME]/Maria/..."
- Pedido de PIX/dinheiro/Pix por valor "baixo" (para parecer crível)
- Foto de perfil do conhecido mas número novo
- "Clique aqui para confirmar sua conta"
- Mensagem encaminhada com "muito importante, passa para todos"
- Áudio em voz parecida com conhecido (deepfake) pedindo ação
- Convite para grupo "VIP" de investimento/cripto

### 6.7 SMS / vishing

- "Receita Federal" pedindo CPF + clique
- "Banco" pedindo confirmação fora do app
- "Correio" sobre pacote retido + taxa
- Ligação se identificando como "suporte técnico" da Microsoft/Google
- Ligação do "banco" pedindo TOKEN/código por telefone
- Voz urgente, ameaça, pressão para resposta imediata

---

## 7. Vetores específicos do contexto da [SUA_EMPRESA]

### 7.1 Phishing contra [SEU_NOME] (admin)

- Falso "alerta HostGator" — sempre conferir pelo painel oficial, nunca pelo link
- Falso "renovação de domínio" — só renovar pelo registrar onde você comprou
- Falso "verificação de conta GitHub" — só pelo `github.com` digitado direto
- Falso "atualização Cloudflare urgente" — só pelo `dash.cloudflare.com`
- Pacote npm/composer "que resolve seu problema" sugerido em fórum/Discord

### 7.2 Phishing contra clientes da [SUA_EMPRESA]

- Cliente recebe e-mail "[SUA_EMPRESA]" pedindo pagamento via PIX fora do padrão
- Cliente recebe "atualize sua senha do painel" ([PLATAFORMA], etc.)
- Cliente recebe WhatsApp "do [NOME]" cobrando valor

Mitigação visível no produto: banner "Nunca pedimos senha por e-mail/WhatsApp. Sempre acesse pelo painel."

### 7.3 Phishing contra usuários finais dos sistemas

- Participante da Evolution recebe "seu link expirou, reenvie seus dados"
- Aluno recebe "novo certificado disponível, clique aqui"
- Cliente [MARCA_1] recebe "rastreamento da carga atrasado, clique aqui"

Mitigação: comunicação oficial **sempre** pelo painel/sistema, nunca por e-mail com link de ação crítica.

---

## 8. Comandos / ferramentas de diagnóstico

### 8.1 Inspecionar cabeçalho de e-mail

```bash
# Salvar cabeçalho em headers.txt e examinar:
grep -i "authentication-results" headers.txt
grep -i "received-spf" headers.txt
grep -i "dkim-signature" headers.txt
grep -i "return-path" headers.txt
grep -i "x-spam" headers.txt
grep -i "^from:" headers.txt
grep -i "^reply-to:" headers.txt
grep -i "x-mailer" headers.txt
```

### 8.2 Inspecionar URL sem clicar

```bash
# Ver redirecionamentos sem executar JS
curl -I -L --max-redirs 10 "https://suspeito.exemplo.com" 2>&1 | head -50

# Resolver DNS
dig +short suspeito.exemplo.com
dig +short suspeito.exemplo.com A
dig +short suspeito.exemplo.com NS

# Whois - quando o domínio foi registrado? (recente = suspeito)
whois suspeito.exemplo.com | grep -i "creation\|registrant\|created"

# Punycode reverso (detecta homograph)
python3 -c "print('xn--mesіte-1ua.com'.encode('idna').decode('ascii'))"
python3 -c "import idna; print(idna.decode('xn--exmple-1ua.com'))"
```

### 8.3 Verificar reputação (público, sem dados sensíveis)

- **VirusTotal** (URL/arquivo): manual, não automatizar com dados privados
- **urlscan.io**: análise pública
- **PhishTank**: base comunitária
- **Google Safe Browsing**: já filtra
- **APWG**: reportar phishing
- **Cofense** PhishMe: corporativo

### 8.4 Detectar lookalike de domínio próprio

```bash
# dnstwist - gera variações typosquatting de um domínio
dnstwist dvdigital.dev.br
dnstwist scapinitransportes.com.br
dnstwist evolutionmentorias.com.br

# Verifica se variações estão registradas (algumas podem ser de atacantes)
```

### 8.5 Verificar autenticidade de WhatsApp

- Confirmar **por canal alternativo** (ligação para número conhecido, presencial)
- Verificar foto de perfil em luz forte (clones usam foto de baixa qualidade)
- Pedir contexto que só a pessoa real sabe (perguntar algo específico do último encontro)
- Verificar se o contato tem o histórico de conversa antigo
- Conferir status/última visualização anômalos

### 8.6 Auditoria de OAuth grants (revisão periódica)

```text
Google: myaccount.google.com/permissions
GitHub: github.com/settings/applications
Microsoft: account.live.com/consent/Manage
Facebook: facebook.com/settings?tab=applications
Twitter/X: x.com/settings/connected_apps
Discord: discord.com/channels/@me/settings/authorized-apps
Slack: <workspace>.slack.com/apps/manage
Notion: notion.so/my-integrations
```

Revogar tudo que **não reconhece** ou **não usa há 90 dias**.

---

## 9. Fluxo defensivo (10 passos)

Quando suspeitar de phishing:

1. **NÃO CLICAR. NÃO BAIXAR. NÃO PAGAR. NÃO RESPONDER.**
2. **Preservar evidência**: screenshot da tela inteira, cabeçalho completo do e-mail, URL copiada (botão direito → "Copiar endereço do link", sem visitar)
3. **Inspecionar cabeçalho** (SPF/DKIM/DMARC, mismatch From/Reply-To, Received estranho)
4. **Inspecionar URL** via curl/whois sem clicar (§8.2)
5. **Confirmar por canal alternativo** se for pessoa conhecida — ligação no número conhecido, não responder no mesmo canal suspeito
6. **Se for relacionado a conta**: ir direto pelo site oficial (digitar URL no browser), nunca pelo link
7. **Reportar**:
   - E-mail: usar botão "Reportar phishing" do provedor (Gmail/Outlook); alimenta filtros globais
   - Phishing brasileiro: `cert@cert.br` (anônimo), provedor do remetente
   - PIX/Pagamento golpe: banco emissor + Polícia Civil (B.O.)
   - WhatsApp: denunciar contato + bloquear
   - LinkedIn: reportar perfil
   - Domínio falso `.br`: `registro.br`
   - Domínio internacional: registrar do TLD ou ICANN
8. **Bloquear**: remetente, contato, domínio
9. **Documentar caso** interno: data, vetor, conteúdo (anonimizado), lição aprendida, atualização de processo
10. **Se houve CLIQUE ou EXPOSIÇÃO acidental**:
    - Invocar `/incident-diagnosis`
    - Rotacionar credenciais expostas via máquina **limpa** (`/secrets-and-env-guard`)
    - Revisar OAuth grants e revogar suspeitos
    - Escanear máquina (antivírus, Malwarebytes)
    - Trocar senha de tudo que usa a mesma senha
    - Avisar contatos (se conta foi sequestrada)
    - Comunicar cliente afetado (se houve impacto em produto da [SUA_EMPRESA])
    - Verificar LGPD: se vazou PII de terceiro, há obrigação de notificar ANPD

---

## 10. Regras de proteção ativa

### 10.1 E-mail

- 2FA em todas as contas críticas (Google, Outlook, ProtonMail, Zoho)
- Preferir **passkey** ou **hardware key** (Yubikey) onde disponível
- Phishing filter nativo ativado (Gmail/Outlook já filtram bem)
- **Reportar** phishing pelo botão do provedor (alimenta filtro global)
- Não usar e-mail pessoal para coisa corporativa crítica
- Aliases para inscrições (`+inscricao@`, `me@dv...`)
- Bloquear remote images por padrão (não confirma "lido" para spammers)
- Evitar "responder com confirmação" em fluxos críticos

### 10.2 OAuth

- **Revisar grants periodicamente** (trimestral): Google, GitHub, Microsoft, Facebook, Slack
- **Revogar** apps não usados há 90 dias
- **Não autorizar** app desconhecido com escopos amplos
- Em projeto OAuth próprio: pedir **escopo mínimo necessário**
- Em PR de terceiro adicionando OAuth scope: revisar com cuidado
- Verificar status "verificado pelo Google" antes de autorizar

### 10.3 WhatsApp

- Ativar **2FA do WhatsApp** (PIN de 6 dígitos) — Configurações → Conta → Verificação em duas etapas
- Não autenticar dispositivos desconhecidos via WhatsApp Web
- Confirmar identidade por canal alternativo para pedido financeiro
- Bloquear adicionados em grupos sem permissão (Configurações → Privacidade → Grupos)
- Cuidado com áudios em voz familiar (deepfake) — confirmar antes de agir

### 10.4 Senhas

- Password manager (Bitwarden, 1Password, KeePass)
- Senhas **únicas** por serviço (vazamento em um não afeta outros)
- Passkey/hardware key onde disponível (resistente a phishing por design)
- Verificar vazamentos: `haveibeenpwned.com`
- Trocar senha imediatamente se conta aparecer em vazamento

### 10.5 DNS / browser

- DNS com filtro: Cloudflare `1.1.1.2` (Family filter), NextDNS, Quad9
- Browser com proteção anti-phishing ativa (Brave, Firefox com filtros, Chrome Safe Browsing)
- Extension uBlock Origin + filtros adicionais
- Privacy Badger
- Não desabilitar Safe Browsing por "estar lento"

### 10.6 Cliente final (sites/plataformas da [SUA_EMPRESA])

- Educação visível no fluxo do produto: "Nunca pedimos senha por e-mail ou WhatsApp"
- Padrão único de comunicação oficial (assinatura, domínio único, tom)
- DMARC do domínio em `quarantine` ou `reject` (combinar com `/email-and-notifications-hardening`)
- Banner de alerta automático em e-mail externo (no MX/gateway corporativo)
- Comunicação crítica (mudança de senha, cobrança) **sempre** dentro do painel autenticado
- Página oficial `/seguranca` ou `/golpes` explicando golpes comuns que mencionam a marca

---

## 11. OAuth phishing — regras específicas

OAuth phishing é especialmente perigoso porque o atacante não rouba sua senha — você **conscientemente** autoriza um app malicioso a agir como você.

### 11.1 Sinais de OAuth malicioso

- App pede `mail.send`, `mail.modify`, `gmail.readonly` (ler e-mail)
- App pede `drive` (não readonly) — pode mover/apagar arquivos
- App pede `admin.directory.user` em Google Workspace — acesso administrativo
- App pede `repo` no GitHub — push/clone qualquer repo, incluindo privados
- App pede `delete_repo` no GitHub — destrutivo
- App pede `admin:org` — controle de organização
- Domínio do redirect não bate com o nome do app
- Logo idêntico a app legítimo, mas nome ligeiramente diferente

### 11.2 Antes de autorizar

- Conferir **domínio do app** (não confiar em logo)
- Conferir **lista de escopos** pedidos
- Apps "marketing tool" pedindo `mail.send` = ⚠️ suspeito
- Apps de "produtividade" pedindo `admin.directory` = ⚠️ suspeito
- Em desenvolvimento próprio: pedir **menor escopo possível**, solicitar verificação do app

### 11.3 Após autorizar (revisão)

- Revisar a cada 90 dias todos os apps autorizados
- Revogar imediatamente o que não reconhece ou não usa
- Trocar senha + revogar OAuth se houve suspeita de comprometimento

---

## 12. BEC (Business Email Compromise) — regras específicas

BEC é golpe que impersona figura de autoridade (CEO, cliente importante, fornecedor habitual, advogado) para induzir pagamento ou mudança de dados.

### 12.1 Cenários típicos

- Falso CEO pede compra urgente de gift cards "para presente da equipe"
- Falso fornecedor envia "nova chave PIX, atualize por favor"
- Falso advogado envia "minuta de contrato — assine e envie"
- Falso cliente importante pede transferência urgente para "fechar negócio"
- Reply-chain hijack: atacante invade conta legítima, responde thread real com pedido novo

### 12.2 Sinais

- Mudança de canal ("não consigo te ligar agora, só por e-mail")
- Mudança de horário (fora do expediente, fim de semana)
- Urgência ("preciso resolver isso hoje")
- Sigilo ("não comente com ninguém, ainda não está oficial")
- Mudança de dados bancários
- Domínio lookalike sutil (`@dv-digital.com.br` em vez de `@dvdigital.dev.br`)
- Reply-To diferente do From

### 12.3 Regras

- **Toda mudança de dados bancários exige confirmação por TELEFONE com número CONHECIDO** (não o do e-mail)
- **Toda solicitação financeira fora do padrão exige DUPLA APROVAÇÃO**
- E-mail com "responda apenas para este endereço" é red flag
- Reply-To diferente do From é red flag
- Domínio lookalike é red flag
- Pedido com sigilo é red flag
- "Gift cards" como forma de pagamento é red flag (99% dos casos é golpe)

### 12.4 Processo interno para mudança de fornecedor

1. Solicitação de mudança chega
2. Confirmar com fornecedor por **canal independente** (telefone no contato salvo, presencial)
3. Documentar a mudança (data, quem solicitou, quem confirmou)
4. Validar primeira transação de teste com valor baixo
5. Comunicar equipe financeira/contábil
6. Atualizar registros

---

## 13. Phishing direcionado a desenvolvedor

### 13.1 GitHub / Git

- Falsas PRs em repo público com dependência maliciosa
- Falso "convite para contribuir em projeto urgente"
- Issue com link para "log de erro" externo (vai roubar token)
- PR alterando `package.json` adicionando lib desconhecida
- PR alterando `.github/workflows/*.yml` adicionando step com `curl | bash`
- App OAuth do GitHub pedindo `repo` + `delete_repo`

**Defesa:**
- Habilitar GitHub Advanced Security se disponível
- Não rodar `npm install` em PR antes de revisar diff completo
- Code review obrigatório em qualquer PR de fora da equipe
- Não autorizar OAuth GitHub sem revisar escopo
- 2FA + hardware key para conta

### 13.2 npm / composer / pip

- Pacote com nome muito parecido (typosquatting): `react-router-dom-pro`, `axiosx`, `lodash-utility`
- Pacote criado **recentemente** com versão `1.0.0` resolvendo problema famoso
- Pacote dependendo de **outro pacote suspeito** (verificar dependências)
- Postinstall script suspeito (`postinstall: "node setup.js"` que faz curl)

**Defesa:**
- `/dependency-firewall` antes de qualquer install
- Verificar data de publicação (< 7 dias = bloquear sem autorização)
- Lockfile sempre versionado
- `npm audit` regular
- Snyk/Socket.dev para análise prévia

### 13.3 Falso recrutador / fake interview

- Pedido de "teste técnico" com repositório malicioso para clonar e rodar
- Pedido para rodar pacote npm específico "para testar nosso stack"
- Pedido para acessar URL e "compartilhar a tela"
- Pedido de credenciais "para configurar ambiente da empresa"

**Defesa:**
- Nunca rodar código de "teste técnico" fora de container isolado
- Nunca compartilhar tela com credenciais reais visíveis
- Confirmar empresa via LinkedIn oficial + telefone do site oficial
- Suspeitar de oferta "boa demais"

---

## 14. Processo de resposta a clique acidental

Se você ou alguém da equipe clicou em link suspeito:

### 14.1 Imediato (< 5 min)

1. **Desconectar a máquina da rede** (Wi-Fi off, cabo desconectado)
2. **Não inserir credencial** se chegou em página de login
3. **Fechar o navegador** (não fechar aba só — fechar o processo)
4. **Documentar** o que clicou, hora, conteúdo da mensagem

### 14.2 Curto prazo (< 1h)

5. **Em máquina LIMPA**:
   - Trocar senha do serviço alvo do phishing
   - Trocar senha de qualquer outro serviço que usa senha igual/parecida
   - Habilitar/verificar 2FA
   - Revogar tokens de sessão (botão "Sair de todos os dispositivos")
6. **Revisar OAuth grants** (revogar suspeitos)
7. **Escanear a máquina suspeita**: antivírus + Malwarebytes + checagem de processos novos

### 14.3 Médio prazo (< 24h)

8. **Notificar contatos** se a conta foi sequestrada (atacante usa sua identidade)
9. **Comunicar cliente afetado** se houve impacto em produto da [SUA_EMPRESA]
10. **Verificar LGPD**: se vazou PII de terceiros, há obrigação de notificar ANPD
11. **Backup recente disponível?** Restaurar se necessário
12. **Reset completo da máquina** se houver suspeita de RAT/keylogger

### 14.4 Documentar incidente

- Timeline
- Vetor (canal, mensagem, link)
- Ações tomadas
- Lições aprendidas
- Atualização de processo
- Comunicação enviada

---

## 15. Template de comunicação ao cliente afetado

Quando há impacto em cliente da [SUA_EMPRESA] (ex: golpista usando nome da marca):

```text
Assunto: Aviso de segurança — golpe identificado

Olá [Nome],

Identificamos que golpistas estão enviando mensagens se passando por
[[SUA_EMPRESA] / [PLATAFORMA] / etc.] em [e-mail / WhatsApp / SMS].

A mensagem fraudulenta pede [descrever ação maliciosa].

REFORÇO IMPORTANTE:
- Nunca pedimos senha por e-mail, WhatsApp ou telefone.
- Comunicação oficial é sempre dentro do painel (https://...).
- Nossa chave PIX é [chave oficial], não atualizamos por mensagem.
- Se receber qualquer coisa suspeita, confirme com a gente pelo
  WhatsApp/telefone conhecido antes de agir.

Se você já clicou ou compartilhou dados, fale conosco imediatamente.

[Assinatura oficial]
```

---

## 16. Política interna sugerida

```markdown
# Política anti-phishing — [SUA_EMPRESA]

## Princípios
1. Toda dúvida = pare, confirme por canal alternativo
2. Toda urgência financeira fora do padrão = dupla aprovação
3. Toda mudança de dados bancários = confirmação por telefone

## 2FA obrigatório em
- E-mail principal e secundário
- WhatsApp (PIN 6 dígitos)
- Painéis de hospedagem (HostGator, Vercel, Cloudflare)
- GitHub, GitLab
- Senhas de cliente (gerenciador)
- Bancos
- PIX

## Revisão trimestral
- OAuth grants em Google, GitHub, Microsoft
- Sessões ativas em e-mail
- Lista de contatos de fornecedores
- Domínios próprios em haveibeenpwned

## Treinamento
- Repassar a política a cada novo membro da equipe
- Casos de phishing recebidos são compartilhados (anonimizados) no canal interno
- Simulação anual de phishing
```

---

## 17. Integração com skills existentes

- `/email-and-notifications-hardening` — lado emissor (SPF/DKIM/DMARC). **Esta skill é o lado RECEPTOR.**
- `/auth-and-session-hardening` — OAuth em projetos próprios + 2FA
- `/incident-diagnosis` — quando clique aconteceu, fluxo de incidente
- `/secrets-and-env-guard` — rotação pós-exposição
- `/ai-prompt-injection-defense` — phishing pode chegar via IA (link injetado em RAG, output de LLM)
- `/lgpd-compliance-check` — se houve vazamento por phishing, é incidente LGPD
- `/dns-and-subdomain-hardening` — typosquatting, lookalike, DMARC
- `/webshell-and-ioc-detection` — se clique levou a comprometimento de servidor
- `/skill-orchestrator` — em conflito entre skills

---

## 18. Checklist de auditoria

```text
# Identidade pessoal
[ ] 2FA ativo em e-mail principal
[ ] 2FA ativo em e-mail secundário
[ ] 2FA ativo no WhatsApp (PIN)
[ ] 2FA ativo em GitHub/GitLab
[ ] 2FA ativo em hospedagem (HostGator, Vercel, Cloudflare)
[ ] Password manager em uso (todas as senhas únicas)
[ ] Passkey/hardware key habilitada onde disponível
[ ] Lista de senhas em haveibeenpwned conferida
[ ] DNS com filtro anti-phishing ativo
[ ] Browser com anti-phishing ativo
[ ] uBlock Origin instalado

# OAuth
[ ] Google: OAuth grants revisados nos últimos 90 dias
[ ] GitHub: OAuth grants revisados nos últimos 90 dias
[ ] Microsoft: OAuth grants revisados nos últimos 90 dias
[ ] Facebook/Instagram: apps autorizados revisados
[ ] Slack/Discord: apps revisados
[ ] Apps desconhecidos revogados

# Identidade do domínio
[ ] DMARC do domínio em quarantine/reject
[ ] SPF do domínio sem includes obsoletos
[ ] dnstwist rodado nos domínios próprios (typosquatting)
[ ] Domínios lookalike registrados defensivamente quando viável

# Processos
[ ] Política de mudança de dados bancários com dupla confirmação
[ ] Processo de comunicação oficial documentado
[ ] Banner "nunca pedimos senha" visível em produtos
[ ] Página /seguranca ou /golpes explicando golpes comuns
[ ] Canal interno para reportar phishing
[ ] Treinamento documentado da equipe

# Resposta a incidente
[ ] Plano de resposta a clique acidental documentado
[ ] Lista de "máquina limpa" para rotação de credenciais
[ ] Template de comunicação a cliente afetado pronto
[ ] Contatos de reporte (CERT.br, registro.br, provedores) salvos
[ ] Backup recente da máquina + dados críticos
```

---

## 19. O que NÃO fazer

- ❌ Clicar para "ver o que é" sem inspecionar URL primeiro
- ❌ Responder e-mail suspeito perguntando "isso é golpe?" (confirma e-mail ativo)
- ❌ Compartilhar com outros sem anonimizar (pode espalhar o link)
- ❌ Pagar "para resolver rápido" — golpistas contam com a pressa
- ❌ Achar que "não vai acontecer comigo"
- ❌ Confiar em logo bonito ou design profissional
- ❌ Confiar em domínio só porque tem HTTPS (cadeado não valida legitimidade)
- ❌ Desabilitar 2FA "porque é chato"
- ❌ Reusar senha
- ❌ Salvar senha no navegador sem master password
- ❌ Autorizar OAuth sem ler escopos
- ❌ Acreditar em áudio/vídeo só porque a voz parece familiar (deepfake)

---

## 20. Critérios de aceite da skill

A skill será considerada aplicada corretamente quando:

- Equipe tem 2FA ativo em todas as contas críticas
- Processo de mudança de dados bancários exige dupla confirmação
- OAuth grants são revisados trimestralmente
- DMARC do domínio próprio está em quarantine/reject
- Banner anti-phishing visível em produtos para cliente
- Plano de resposta a clique acidental documentado
- Pelo menos uma simulação anual de phishing realizada
- Template de comunicação a cliente afetado pronto

---

## 21. Atualização do CLAUDE.md (sugestão)

Adicionar (sem apagar nada):

```markdown
## Defesa contra phishing recebido

Sempre que houver suspeita de mensagem maliciosa recebida (e-mail/WhatsApp/SMS/LinkedIn/ligação), invocar `/anti-phishing-defense` ANTES de clicar, responder ou pagar.

Combinar com:
- `/incident-diagnosis` se houver clique acidental
- `/secrets-and-env-guard` para rotação de credenciais expostas
- `/email-and-notifications-hardening` para reforço do lado emissor
- `/dns-and-subdomain-hardening` para lookalike/typosquatting

Regras críticas:
- Toda mudança de dados bancários por e-mail exige confirmação por canal alternativo (telefone, presencial)
- OAuth grants revisados a cada 90 dias
- 2FA obrigatório em e-mail, WhatsApp e contas críticas
- Lookalike domain é red flag — verificar caractere a caractere
- BEC contra cliente da [SUA_EMPRESA] é incidente — comunicar cliente imediatamente
- Áudio/vídeo familiar pode ser deepfake — sempre confirmar por canal alternativo
```

---

## 22. Recursos e referências

- **CERT.br** (`cert.br`) — denúncias, materiais educativos
- **APWG** (`apwg.org`) — reportar phishing internacional
- **PhishTank** (`phishtank.org`) — base comunitária
- **Have I Been Pwned** (`haveibeenpwned.com`) — vazamentos
- **urlscan.io** — análise de URL
- **dnstwist** — typosquatting do seu domínio
- **Google Safe Browsing** — base do Chrome
- **PSafe / FraudFighter** — bases brasileiras
- **registro.br** (`/abuse-handling`) — denunciar `.br` falsos

---

## 23. Frase-guia final

> **Phishing aposta na pressa. A defesa começa em desconfiar e confirmar pelo canal alternativo. Toda dúvida é motivo legítimo para pausar.**

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
