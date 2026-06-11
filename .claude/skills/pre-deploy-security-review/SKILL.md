---
name: pre-deploy-security-review
description: Revisão de segurança obrigatória antes de publicar qualquer projeto. Revisa segredos, arquivos proibidos, dependências, autenticação, banco, headers, permissões e rollback. Entrega tabela de status com OK/Atenção/Crítico.
---

# pre-deploy-security-review

Use esta skill **antes de publicar qualquer projeto em qualquer ambiente** — produção, staging, cliente, repositório público ou qualquer publicação externa.

Esta skill é um STOP obrigatório. Não publicar sem passar por ela.

## Perguntas internas obrigatórias

1. Há arquivos sensíveis que podem ir junto sem perceber?
2. O `.gitignore` está correto e testado?
3. Credenciais estão em `.env.example` com placeholders ou hardcoded?
4. O build/pacote de produção foi inspecionado manualmente?
5. Dependências têm vulnerabilidades conhecidas?
6. Há arquivos de debug, teste ou diagnóstico que precisam ser removidos antes?
7. O banco de dados tem backup antes do deploy?
8. Há plano de rollback definido e testado?
9. HTTPS está configurado?
10. Permissões de arquivo estão corretas?

## Bloco 1 — Segredos e arquivos proibidos

Verificar se nenhum dos itens abaixo será publicado:

```
Arquivos proibidos em qualquer deploy:
- .env (qualquer variação)
- .env.local
- .env.production
- .env.*
- *.pem
- *.key
- id_rsa, id_ed25519
- service-account*.json
- credentials*.json
- *.token
- database.sql
- backup*.sql
- *.dump
- backup*.zip
- backup*.tar.gz
- .git/ (toda a pasta)
- .claude/ (toda a pasta)
- node_modules/ (exceto caso específico)
- vendor/ (verificar se necessário)
- phpinfo.php
- info.php
- test.php
- logs/ (arquivos de log com PII)
- coverage/ (relatórios de cobertura)
- .nyc_output/
- .DS_Store
- Thumbs.db
- *.log
```

Para Git — verificar antes de commitar:
```bash
git status  # ver arquivos staged
git diff --staged  # ver diff completo do que vai ser commitado
git log --oneline -5  # confirmar histórico
```

Para FTP/File Manager — listar manualmente o que será enviado.

## Bloco 2 — Dependências

- [ ] `npm audit --production` ou `composer audit` sem Crítico/Alto aberto
- [ ] Lockfile atualizado e versionado
- [ ] Não há dependência com versão `*` ou `latest`
- [ ] Não há dependência publicada há menos de 7 dias (sem autorização)
- [ ] Scripts externos com SRI configurado
- [ ] Plugins WordPress atualizados e de fonte oficial

Se houver vulnerabilidade CRÍTICA ou ALTA: **parar o deploy** e corrigir primeiro.

## Bloco 3 — Autenticação e autorização

- [ ] Login protegido com hash de senha (bcrypt/argon2id)
- [ ] Sessão com cookie HttpOnly + Secure + SameSite
- [ ] CSRF token em formulários que alteram estado
- [ ] Autorização verificada no servidor (não só no frontend)
- [ ] Rotas de admin separadas e protegidas por papel
- [ ] Força bruta limitada (rate limit + captcha/honeypot)
- [ ] 2FA para administradores (quando aplicável)

## Bloco 4 — Banco de dados

- [ ] Backup do banco feito antes deste deploy
- [ ] Migrations testadas e reversíveis
- [ ] Usuário do banco com privilégio mínimo (não root)
- [ ] Credenciais do banco em .env, não hardcoded
- [ ] Dumps de banco fora do diretório público
- [ ] Queries usando prepared statements (nenhuma concatenação)
- [ ] Banco de dev/staging separado do banco de produção

## Bloco 5 — Formulários e entrada de dados

- [ ] Todos os formulários validam no servidor
- [ ] Uploads validam MIME, extensão, tamanho e são renomeados
- [ ] Uploads armazenados fora do diretório público (ou com PHP bloqueado)
- [ ] Anti-spam / honeypot em formulários públicos
- [ ] Rate limit em formulários de contato e login

## Bloco 6 — Headers de segurança e HTTPS

- [ ] HTTPS configurado e funcional
- [ ] Redirecionamento HTTP → HTTPS ativo
- [ ] HSTS configurado
- [ ] Sem conteúdo misto (HTTP em página HTTPS)
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY (ou SAMEORIGIN se necessário)
- [ ] Referrer-Policy configurado
- [ ] Content Security Policy configurada (ideal — não obrigatória em todos os casos)

## Bloco 7 — Permissões de arquivo (PHP/hospedagem)

- [ ] Arquivos PHP: 644
- [ ] Pastas: 755
- [ ] .env / config: 600
- [ ] Nenhum arquivo ou pasta com 777
- [ ] .htaccess configurado para bloquear listagem de diretório

## Bloco 8 — Logs e erros

- [ ] `display_errors = Off` em produção
- [ ] Stack trace não exposto ao usuário
- [ ] Logs não capturam senha, token ou PII desnecessária
- [ ] Mensagens de erro genéricas ao usuário
- [ ] Correlation ID nos logs para rastreabilidade

## Bloco 9 — Rollback e backup

- [ ] Plano de rollback definido antes de publicar
- [ ] Backup de arquivos do site atual (antes de sobrescrever)
- [ ] Backup do banco antes de qualquer migration
- [ ] Como reverter se algo der errado: [descrever os passos]
- [ ] Janela de manutenção definida para deploys críticos

## Bloco 10 — Verificações finais

- [ ] Testar funcionamento básico após deploy (smoke test)
- [ ] Verificar `/uploads/` retorna 403 (não lista arquivos)
- [ ] Verificar `/.env` retorna 404 ou 403
- [ ] Verificar `phpinfo.php` não existe ou retorna 404
- [ ] Verificar HTTPS funciona sem aviso de certificado
- [ ] Verificar formulário principal funciona
- [ ] Verificar login funciona (se houver)
- [ ] Monitorar logs por 30 minutos após deploy

## Saída obrigatória — tabela de status

```
RELATÓRIO PRÉ-DEPLOY
====================
Data: 2026-XX-XX
Projeto: [nome]
Ambiente: [produção/staging/cliente]

| Item | Status | Ação necessária |
|---|---|---|
| Arquivos proibidos | OK/Atenção/Crítico | [...] |
| Dependências | OK/Atenção/Crítico | [...] |
| Autenticação | OK/Atenção/Crítico | [...] |
| Banco de dados | OK/Atenção/Crítico | [...] |
| Formulários | OK/Atenção/Crítico | [...] |
| Headers/HTTPS | OK/Atenção/Crítico | [...] |
| Permissões | OK/Atenção/Crítico | [...] |
| Logs/Erros | OK/Atenção/Crítico | [...] |
| Rollback | OK/Atenção/Crítico | [...] |
| Smoke test | OK/Atenção/Crítico | [...] |

RESULTADO GERAL: [APROVADO / ATENÇÃO — revisar itens marcados / BLOQUEADO — corrigir antes de publicar]
```

**BLOQUEADO** significa que NÃO deve publicar até corrigir os itens Críticos.

## Conexão com skills do vault

- Skill 13 (DevOps/Deploy) — checklist completo de deploy e rollback
- Skill 01 (Zero Trust) — autenticação, autorização, validação
- Skill 14 (Supply Chain) — dependências e audit
- Skill 04 (Logs Seguros) — logs sem PII em produção

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
