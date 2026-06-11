---
name: supabase-integration
description: Integração com Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) com Row Level Security correto. Use ao usar Supabase como backend. Foco crítico em RLS e na diferença entre anon key e service_role key. Complementa database-hardening e auth-and-session-hardening.
---

# supabase-integration

Supabase expõe seu Postgres direto ao cliente — **RLS é a sua autorização**. Sem RLS = dados abertos.

## Quando usar
- Backend com Supabase (BaaS): banco, login, storage, realtime, edge functions.

## RLS — o ponto crítico
- **Habilitar RLS em TODA tabela** exposta. Sem RLS + `anon`/`authenticated` = qualquer um lê/escreve tudo.
- Policies por operação (select/insert/update/delete) baseadas em `auth.uid()` / claims.
- Testar policy com usuário real (não só como admin) — alinha com `/test-coverage-guard`.
- Nunca expor dado sensível confiando só em filtro no front.

## Chaves (não confundir)
- **`anon` key:** pública, vai pro front; só funciona dentro do que a RLS permite.
- **`service_role` key:** **bypassa RLS** — só no **servidor/edge function**, nunca no front/repo (`/secrets-and-env-guard`). Vazar = banco inteiro exposto.

## Auth / Storage / Edge
- **Auth:** confiar no JWT validado pelo Supabase; aplicar `/auth-and-session-hardening` (sessão, refresh, MFA).
- **Storage:** buckets privados por padrão; políticas de acesso por path; signed URLs com expiração (`/file-upload-security`). Validar tipo real do upload.
- **Edge Functions:** validar entrada no servidor; segredos via env; sem SSRF (`/api-backend-hardening`).
- **Migrations** versionadas e reversíveis (`/database-hardening` / Skill 12); backup (`/backup-and-recovery-strategy`).

## Recusas
- Tabela exposta sem RLS; `service_role` no front/repo.
- Bucket público para arquivo privado; URL pública para conteúdo sensível.
- Confiar em validação/autorização só no cliente.

## Saída
Schema + policies RLS (por operação), separação anon/service_role, políticas de storage e plano de migration/backup.

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
