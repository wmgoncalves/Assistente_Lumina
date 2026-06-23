# Changelog

## 2.1.0 — 2026-06-22

### Recrutamento

- Falhas do Gemini agora encaminham a candidatura para revisão manual, sem nota zero ou rejeição automática.
- Respostas duplicadas durante a avaliação são bloqueadas para evitar laudos concorrentes.
- O laudo, a nota e a classificação interna deixaram de ser retornados pela API pública da entrevista.
- Nome, vaga, e-mail, respostas e laudos são neutralizados antes de entrar em HTML.
- A pergunta de CNH não solicita mais o número do documento.
- Datas das notificações automáticas agora são comparadas corretamente pelo SQLite.
- E-mails são mascarados nos logs do recrutamento.
- Banco local de recrutamento e saídas temporárias de teste foram adicionados ao `.gitignore`.

### Verificação

- `node --check server.js`
- `node --check app.js`
- `git diff --check`

### Rollback

- Reverter `server.js`, `.gitignore` e este changelog para a versão anterior. O banco não sofreu migration destrutiva.
