---
name: backup-and-recovery-strategy
description: Estratégia de backup e recuperação de desastre. Define o que, quando, onde, retenção, criptografia e teste de restore. Use antes de qualquer migration, deploy, mudança em produção ou para revisar política de backup de qualquer projeto.
---

# backup-and-recovery-strategy

Use **antes de qualquer operação que pode perder dado** e ao revisar política de backup do projeto. Backup que não é testado = não é backup, é esperança.

## Princípio 3-2-1

- **3** cópias dos dados (1 produção + 2 backups)
- **2** mídias diferentes (banco produção + cloud, ou cloud + storage local)
- **1** offsite (geograficamente separado — outra região, outro provedor)

Para projetos críticos, considerar **3-2-1-1-0**:
- **+1** cópia offline ou imutável (defesa contra ransomware)
- **0** erros de verificação (restore testado periodicamente)

## O que fazer backup

### Sempre
- Banco de dados (full + incrementais)
- Uploads de usuário
- Configuração (`.env`, configs, certificados — em local seguro)
- Código (Git + tags + branches relevantes)
- Logs de auditoria (cumprimento legal)

### Frequência
| Tipo | Frequência | Retenção |
|---|---|---|
| Banco produção | Diária (full) + incremental 6/h | 30d daily, 12 weekly, 12 monthly |
| Uploads | Diária ou em mudança | 30d versionado |
| Config | Em cada mudança | Versionado em vault/secret manager |
| Logs auditoria | Streaming | 1+ ano |
| Snapshot infra | Semanal | 4 últimas |

### Antes de mudança Crítica
- Migration destrutiva → backup completo + verificado antes
- Deploy grande → snapshot antes
- Mudança em config crítica → versionar antes

## Onde armazenar

### Não em
- Mesmo servidor da aplicação (perde junto)
- Diretório público (`public_html/backups/` — acessível por URL)
- Sem criptografia
- Disco compartilhado sem controle de acesso

### Sim em
- Object storage com versionamento (S3 + versioning, Backblaze B2)
- Servidor separado com transferência via SFTP/SSH
- Cloud separado do provedor da aplicação (defesa em profundidade)
- Mídia offline para dado crítico (HD rotacionado)

### Criptografia
- **Em repouso**: AES-256 (server-side encryption do provedor é OK)
- **Em trânsito**: TLS sempre
- **Chave**: gerenciada separadamente do backup (HSM, KMS, ou cofre)
- **Restore testado** com a chave correta antes de confiar

## Restore (testar regularmente)

### Métricas
- **RPO (Recovery Point Objective)**: quanto dado pode perder (ex: 1 hora = backup horário)
- **RTO (Recovery Time Objective)**: quanto tempo para voltar (ex: 4 horas)

Definir para cada sistema. Documentar.

### Teste de restore
- **Periódico**: trimestral no mínimo
- **Realista**: restaurar em ambiente isolado, validar integridade
- **Documentado**: tempo gasto, problemas, comandos exatos

### Runbook de restore
Para cada sistema, ter documento com:
1. Onde está o backup
2. Como acessar (credenciais — referência ao cofre, não no doc)
3. Comandos exatos para restaurar
4. Tempo estimado
5. Como verificar que restore funcionou
6. Quem contatar se falhar

## Comandos por stack

### MySQL/MariaDB
```bash
# Backup
mysqldump --single-transaction --quick --routines --triggers \
  -u USER -p DATABASE | gzip > backup_$(date +%F).sql.gz

# Restore
gunzip < backup_2026-05-14.sql.gz | mysql -u USER -p DATABASE
```

- Para tabelas InnoDB: `--single-transaction` (consistente sem lock)
- Para tabelas grandes: `mysqlpump` ou Percona XtraBackup

### PostgreSQL
```bash
# Backup
pg_dump -Fc DATABASE > backup_$(date +%F).dump

# Restore
pg_restore -d DATABASE backup_2026-05-14.dump
```

### Uploads
```bash
# Sync para S3 (idempotente, incremental)
aws s3 sync /var/uploads/ s3://meu-bucket/uploads/ \
  --storage-class STANDARD_IA
```

### Hospedagem compartilhada (HostGator/cPanel)
- Backup do cPanel (semanal manual ou via automated backup)
- Baixar para máquina pessoal/cloud
- Verificar tamanho razoável (não está vazio)

## Backup de credenciais e config

### Não no Git
- `.env` não vai
- Chaves privadas não vão
- Tokens não vão

### Sim em
- Cofre pessoal (Bitwarden, 1Password)
- Secret manager (AWS Secrets, Vault)
- Documento criptografado offline (GPG)

### Rotação documentada
- Quando rotacionar (90/180/365 dias)
- Como rotacionar sem downtime
- Onde ficam as anteriores (não apagar imediatamente — janela de transição)

## Disaster recovery

### Cenários a planejar
1. **Banco corrompido**: restore do último backup OK
2. **Servidor perdido** (provider quebrou, conta hackeada): infra como código + restore
3. **Ransomware** / acesso malicioso: backup offline/imutável
4. **Exclusão acidental** (DROP, rm -rf): restore do snapshot mais recente
5. **Erro de aplicação corrompendo dado em massa**: rollback de aplicação + restore parcial
6. **Conta de cloud comprometida**: backup em conta separada

### Playbook por cenário
Para cada cenário, runbook:
- Detecção (como saber?)
- Decisão (quem aciona DR?)
- Restore (passos)
- Validação (funcionou?)
- Comunicação (usuários, equipe, ANPD se aplicável)
- Post-mortem

## Backup como evidência

Para auditoria/LGPD:
- Logs imutáveis (append-only, ou storage WORM)
- Retenção legal cumprida (fiscal 5 anos, etc.)
- Chain of custody documentado
- Não apagar logs durante incidente sem cópia

## Custo

Backup tem custo (storage + transferência). Otimizar:
- Compressão (gzip/zstd) — economia 70-90%
- Storage class apropriado (S3 IA, Glacier para arquivamento)
- Retenção tiered (recente em hot, antigo em cold)
- Deduplicação quando possível

## Recusas obrigatórias

- Backup só no mesmo servidor da aplicação
- Backup em diretório público (acessível por URL)
- Backup sem criptografia
- Migration destrutiva sem backup verificado
- "Eu testo o restore depois"
- Apagar backup sem confirmar que o novo funciona
- Backup com PII sem mascaramento em ambiente de dev/staging
- Chave de cripto junto com o backup (mesma localização)
- Confiar em backup sem testar restore há > 6 meses

## Checklist mínimo

- [ ] 3-2-1 implementado (3 cópias, 2 mídias, 1 offsite)
- [ ] Backup automatizado (cron, job, snapshot)
- [ ] Frequência adequada ao RPO definido
- [ ] Criptografia em repouso e em trânsito
- [ ] Retenção definida e aplicada
- [ ] Backup fora do diretório público
- [ ] Chave de cripto separada do backup
- [ ] Restore testado nos últimos 3 meses
- [ ] RTO/RPO documentados
- [ ] Runbook de restore atualizado
- [ ] Playbook de DR para cenários principais
- [ ] Logs de auditoria com retenção legal
- [ ] Backup de uploads (não só do banco)
- [ ] Backup imutável/offline para defesa contra ransomware

## Conexão com skills do vault

- Skill 12 (Banco/Migrations) — backup antes de migration
- Skill 13 (DevOps/Deploy) — backup antes de deploy crítico
- Skill 06 (LGPD) — retenção legal, comunicação de incidente
- Skill 04 (Logs Seguros) — logs como evidência

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
