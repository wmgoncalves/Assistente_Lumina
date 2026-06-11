---
name: aws-security-baseline
description: Baseline de seguranca em AWS - IAM least privilege com permission boundaries, S3 bucket sem acesso publico (block public access account-level), CloudTrail multi-region + organization trail, GuardDuty + Security Hub + AWS Config, KMS para criptografia, VPC com Flow Logs, Secrets Manager (nao .env), Inspector para EC2/ECR, network ACLs vs Security Groups, RDS encryption em rest + transit, S3 bucket policy + SSE-KMS, root account MFA hardware, SCP em Organizations. Use ao migrar cliente para AWS, em audit inicial, ou ao construir landing zone. Complementa hosting-infrastructure-analysis (escolha) com o lado seguranca da implementacao.
---

# aws-security-baseline

> **Frase-guia:** Default AWS é inseguro. Tudo aberto, tudo público potencial. Hardening começa antes do primeiro recurso.

## 0. Regra suprema

AWS shared responsibility: AWS protege a infraestrutura, você protege "**no**" cloud. Default não é seguro — `s3:PutPublicAccessBlock`, `iam:CreateUser` sem MFA, `ec2 sg open 0.0.0.0/0` são comuns. Cada decisão de menos privilégio é menos exposição. Em conflito entre velocidade de entrega e baseline, **baseline vence** (configurar uma vez, sofrer para sempre se pular).

---

## 1. Objetivo

Estabelecer baseline de segurança em conta AWS nova ou auditar existente:

- **IAM** least privilege + MFA + access keys rotation
- **S3** sem público acidental
- **CloudTrail** multi-region + organization
- **GuardDuty** + **Security Hub** + **AWS Config**
- **KMS** para criptografia + key rotation
- **VPC Flow Logs** + Security Groups restritivos
- **Secrets Manager** + **Parameter Store** (não `.env`)
- **Inspector** v2 para EC2/ECR
- **Macie** se houver PII
- **Service Control Policies (SCPs)** em Organizations
- **Backup** com Backup Vault Lock
- **Compliance**: CIS Benchmark, AWS Foundational Security Best Practices

---

## 2. Quando usar

- Cliente migra para AWS pela primeira vez
- Auditoria de conta existente
- Construção de Landing Zone (multi-account)
- Pré-deploy de aplicação crítica
- Resposta a finding do Security Hub
- Preparação para SOC 2 / ISO 27001
- Após incidente (lock down posterior)

---

## 3. Prioridade absoluta

1. **Root account com MFA hardware** + sem access keys + único uso para conta inicial
2. **CloudTrail multi-region enabled**
3. **GuardDuty enabled** (R$ baratíssimo, valor altíssimo)
4. **S3 Block Public Access** account-level
5. **IAM password policy** strong
6. **Default VPC SG** com 0 regras
7. **KMS keys** com rotation
8. **Secrets** fora do código

---

## 4. IAM

### 4.1 Root account

- **Nunca** usar root para operação diária
- MFA **hardware** (YubiKey) no root
- Sem access keys no root (deletar)
- E-mail de root protegido com 2FA + senha única
- Telefone de recovery atualizado

### 4.2 Usuários humanos

- **Use IAM Identity Center (SSO)** em vez de IAM users diretos (preferido)
- Se IAM user: MFA obrigatório, access keys rotacionadas a cada 90 dias
- Policy: permission boundary para limitar escopo máximo
- Sem `*:*` action sem condição

### 4.3 Service accounts (IAM Roles)

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject"],
    "Resource": "arn:aws:s3:::my-bucket/uploads/*",
    "Condition": {
      "StringEquals": {
        "aws:SourceVpc": "vpc-12345"
      }
    }
  }]
}
```

- **Use IAM Roles** para EC2/Lambda/ECS (não access keys)
- IRSA para EKS (Kubernetes service account → IAM role)
- Trust policy restritiva (não `Service: ec2.amazonaws.com` sem condition)

### 4.4 Password policy

```text
Min length: 14
Require lowercase, uppercase, numbers, symbols
Max age: 90 days
Prevent reuse: 24
Require MFA: Yes (via IAM Identity Center)
```

### 4.5 Access Advisor

Use IAM Access Advisor para descobrir permissions não usadas e remover.

### 4.6 Access Analyzer

Ativar para detectar resources com acesso externo não-intencional.

---

## 5. CloudTrail

### 5.1 Trail organização (recomendado)

```bash
# Via CloudFormation ou Terraform
aws cloudtrail create-trail \
  --name "org-trail" \
  --s3-bucket-name "company-cloudtrail-logs" \
  --is-multi-region-trail \
  --is-organization-trail \
  --enable-log-file-validation
```

- Multi-region: capture API calls em todas as regiões
- Org trail: aplica em todas as contas (se Organizations)
- S3 bucket dedicado, encryption KMS, lifecycle to Glacier
- **Log file validation** (detecta tampering)
- Send to CloudWatch Logs (alertas)

### 5.2 Eventos críticos a alertar

```text
- RootAccountUsage
- IAMPolicyChange
- ConsoleSignInFailures > 3
- SecurityGroupChange
- NetworkACLChange
- VPCChange
- S3BucketPolicyChange
- CloudTrailConfigChange
- KMSKeyDeletion
- UnauthorizedAPICall (errors)
```

CloudWatch metric filter + alarm + SNS → e-mail/Slack.

---

## 6. S3 — sem acesso público acidental

### 6.1 Account-level Block Public Access

```bash
aws s3control put-public-access-block \
  --account-id 123456789012 \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

Isso impede qualquer bucket de ficar público mesmo se config errar.

### 6.2 Bucket policy explícita

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "DenyInsecureTransport",
    "Effect": "Deny",
    "Principal": "*",
    "Action": "s3:*",
    "Resource": ["arn:aws:s3:::my-bucket", "arn:aws:s3:::my-bucket/*"],
    "Condition": {
      "Bool": {"aws:SecureTransport": "false"}
    }
  }]
}
```

### 6.3 SSE-KMS

```bash
aws s3api put-bucket-encryption \
  --bucket my-bucket \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms",
        "KMSMasterKeyID": "alias/my-key"
      },
      "BucketKeyEnabled": true
    }]
  }'
```

### 6.4 Versioning + MFA Delete

```bash
aws s3api put-bucket-versioning \
  --bucket my-bucket \
  --versioning-configuration Status=Enabled,MFADelete=Enabled \
  --mfa "<root-mfa-serial> <mfa-code>"
```

### 6.5 Logging

```bash
aws s3api put-bucket-logging \
  --bucket my-bucket \
  --bucket-logging-status file://logging.json
```

---

## 7. GuardDuty

```bash
# Habilitar em todas as regiões (via Organizations)
aws guardduty create-detector --enable
```

- Aproximadamente USD $4-15/conta/mês (vale)
- Detecta: compromisso de instância, mineração, recon, exfil
- Findings → Security Hub
- Auto-archive findings benignos com filter

### 7.1 Plugins

- **GuardDuty S3 Protection**
- **GuardDuty EKS Protection**
- **GuardDuty Malware Protection** (escaneia EBS)
- **GuardDuty RDS Protection**
- **GuardDuty Runtime Monitoring** (EKS, ECS, EC2)

---

## 8. Security Hub

```bash
aws securityhub enable-security-hub \
  --enable-default-standards
```

Padrões habilitados:
- CIS AWS Foundations Benchmark v1.4
- AWS Foundational Security Best Practices

Dashboard agrega findings de GuardDuty, Inspector, Macie, Config, IAM Access Analyzer.

---

## 9. AWS Config

```bash
aws configservice put-configuration-recorder \
  --configuration-recorder name=default,roleARN=arn:aws:iam::xxx:role/aws-config-role \
  --recording-group allSupported=true,includeGlobalResourceTypes=true
```

Rules essenciais a ativar:
- `restricted-ssh` (SG 22 não 0.0.0.0/0)
- `s3-bucket-public-read-prohibited`
- `s3-bucket-public-write-prohibited`
- `iam-password-policy`
- `iam-user-mfa-enabled`
- `root-account-mfa-enabled`
- `cloudtrail-enabled`
- `rds-instance-public-access-check`
- `encrypted-volumes`

Auto-remediation via AWS Systems Manager para alguns.

---

## 10. KMS

```bash
# Customer-managed key (CMK) com rotation automatic
aws kms create-key \
  --description "App data encryption" \
  --key-usage ENCRYPT_DECRYPT \
  --key-spec SYMMETRIC_DEFAULT

aws kms enable-key-rotation --key-id <key-id>
```

- **Key rotation annual** automatic
- **Key policy** restritiva (não `Principal: "*"`)
- **Alias** para legibilidade (`alias/app-prod`)
- **Tags** para billing
- **Deletion protection** (window 30 days)

---

## 11. VPC

### 11.1 Default VPC

- **Deletar** default VPC se não usa
- Ou: clear all default SGs

### 11.2 Custom VPC

```text
10.0.0.0/16
├── Public subnets    10.0.1.0/24, 10.0.2.0/24    (ALB, NAT)
├── Private subnets   10.0.10.0/24, 10.0.11.0/24  (App)
└── Data subnets      10.0.20.0/24, 10.0.21.0/24  (RDS, ElastiCache)
```

### 11.3 VPC Flow Logs

```bash
aws ec2 create-flow-logs \
  --resource-type VPC \
  --resource-ids vpc-12345 \
  --traffic-type ALL \
  --log-destination-type cloud-watch-logs \
  --log-group-name vpc-flow-logs
```

### 11.4 Security Groups

- **Never** 0.0.0.0/0 em SSH (22), RDP (3389), DB ports
- Use **SG references** entre tiers (não CIDR):
  ```text
  RDS SG: allow 5432 from <app-sg-id>
  ```
- 0.0.0.0/0 só em ALB/CloudFront (entrada pública controlada)

### 11.5 NACLs

- Stateless, complementam SGs
- Use para defesa em profundidade (block specific IPs/subnets)

### 11.6 PrivateLink + VPC Endpoints

- Use **VPC endpoints** para S3, DynamoDB, etc. (tráfego interno AWS)
- **PrivateLink** para services externos (sem internet)

---

## 12. Secrets Manager / Parameter Store

```bash
# Secrets Manager (com rotation automatic)
aws secretsmanager create-secret \
  --name prod/app/db-password \
  --secret-string '{"password":"xxx"}' \
  --kms-key-id alias/secrets-key

# Parameter Store (SecureString) - mais barato
aws ssm put-parameter \
  --name "/prod/app/api-key" \
  --type SecureString \
  --value "xxx" \
  --key-id alias/secrets-key
```

Em app:
```python
import boto3
client = boto3.client('secretsmanager')
secret = client.get_secret_value(SecretId='prod/app/db-password')
```

**Nunca** `.env` em produção em AWS. Use IAM role + Secrets Manager.

---

## 13. Inspector v2

```bash
aws inspector2 enable \
  --resource-types EC2 ECR LAMBDA
```

- Escaneia EC2, ECR images, Lambda functions
- Vulnerabilidades CVE com severity
- Integração com Security Hub
- Custo proporcional ao volume

---

## 14. Macie (se houver PII)

```bash
aws macie2 enable-macie
```

- Detecta PII em S3 (CPF brasileiro, e-mail, CC, etc.)
- Importante para LGPD
- Custo proporcional aos buckets escaneados

---

## 15. SCPs (Service Control Policies)

Se usa AWS Organizations, SCPs aplicam **DENY** em toda OU/conta.

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "DenyDisableSecurityHub",
    "Effect": "Deny",
    "Action": [
      "securityhub:DisableSecurityHub",
      "guardduty:DisableOrganizationAdminAccount",
      "cloudtrail:DeleteTrail"
    ],
    "Resource": "*"
  }]
}
```

SCPs essenciais:
- DenyDisableSecurity (GD, SH, Config, CT)
- DenyRegionRestriction (apenas regiões usadas)
- DenyRootAccountAccessKeys
- DenyDeletionOfCloudTrailLogs
- DenyPublicS3Buckets

---

## 16. Backup

### 16.1 AWS Backup

```bash
# Backup vault com lock (WORM)
aws backup create-backup-vault \
  --backup-vault-name prod-vault \
  --encryption-key-arn arn:aws:kms:...

# Lock - ransomware protection
aws backup put-backup-vault-lock-configuration \
  --backup-vault-name prod-vault \
  --min-retention-days 30 \
  --max-retention-days 365 \
  --changeable-for-days 3
```

Lock impede deletion mesmo por root. Compliance/IR essencial.

### 16.2 Backup plan

```text
Daily backup, retain 30 days, copy to second region
Weekly full, retain 90 days
Monthly, retain 365 days
```

---

## 17. CIS Benchmark — checklist condensado

```text
[ ] Root MFA hardware
[ ] No root access keys
[ ] Password policy enforced
[ ] MFA on all human users
[ ] Access keys rotated 90d
[ ] CloudTrail multi-region enabled
[ ] CloudTrail log file validation
[ ] CloudTrail integrated with CloudWatch
[ ] AWS Config enabled in all regions
[ ] S3 bucket access logging enabled
[ ] S3 Block Public Access account-level
[ ] No EBS unencrypted
[ ] No RDS public access
[ ] No security groups 0.0.0.0/0 to admin ports
[ ] VPC Flow Logs enabled
[ ] Default SG restricts all traffic
[ ] CMK rotation enabled
[ ] GuardDuty enabled all regions
[ ] Security Hub enabled with standards
[ ] Inspector v2 enabled
[ ] IAM Access Analyzer enabled
[ ] EBS snapshots not public
[ ] RDS snapshots not public
```

---

## 18. Tools

- **Prowler** (open source) — escaneia conta inteira, hits CIS
- **ScoutSuite** — multi-cloud audit
- **CloudSploit** (Aqua)
- **CloudMapper** — visualizar VPC
- **Cartography** (Lyft) — graph de relações
- **Stelligent cfn-nag** — Lint de CloudFormation
- **Checkov** — IaC security

---

## 19. Custo

Configurar **AWS Budgets** e **Cost Anomaly Detection**:

```bash
aws budgets create-budget \
  --account-id 123456789012 \
  --budget '{
    "BudgetName": "monthly-limit",
    "BudgetLimit": {"Amount": "500", "Unit": "USD"},
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }'
```

Alarms a 50%, 80%, 100%.

---

## 20. Integração com outras skills

- `/hosting-infrastructure-analysis` — decisão de cloud
- `/secrets-and-env-guard` — Secrets Manager
- `/docker-devops-hardening` — Inspector ECR
- `/incident-diagnosis` — quando GuardDuty alerta
- `/lgpd-compliance-check` — Macie
- `/backup-and-recovery-strategy` — AWS Backup
- `/iso-27001-readiness` — controles
- `/soc-2-readiness` — controles
- `/kubernetes-security-baseline` — EKS

---

## 21. Frase-guia final

> **AWS default é inseguro: S3 público potencial, SG aberto, root sem MFA. Baseline em dia 1: GuardDuty + CloudTrail + Block Public Access + Config Rules + IAM SSO. Custo de não fazer: muito maior que custo de fazer.**
