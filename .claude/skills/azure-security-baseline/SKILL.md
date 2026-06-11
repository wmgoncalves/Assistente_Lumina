---
name: azure-security-baseline
description: Baseline de seguranca em Azure - Entra ID (Azure AD) com MFA obrigatorio, Conditional Access policies, PIM (Privileged Identity Management), Defender for Cloud habilitado, Sentinel para SIEM, Azure Policy + Initiative, Key Vault para secrets, NSG + Application Security Group, Storage Account sem public blob, Azure Backup com soft delete, AzureMonitor logs, Microsoft Defender for Cloud Apps, RBAC least privilege, Management Groups + Azure Blueprints. Use ao migrar cliente para Azure, em audit M365+Azure, ou em hardening de tenant Microsoft 365. Complementa hosting-infrastructure-analysis com lado seguranca.
---

# azure-security-baseline

> **Frase-guia:** Microsoft default é "Get Started" — sem MFA, sem Conditional Access, sem Defender. Hardening transforma de "default insecure" para "enterprise-grade".

## 0. Regra suprema

Azure + Microsoft 365 são produtos diferentes mas mesma identity (Entra ID). Comprometimento Entra = comprometimento de tudo. MFA + Conditional Access são **inegociáveis**. Em conflito entre UX e MFA, **MFA vence sempre**.

---

## 1. Objetivo

Estabelecer baseline em tenant Azure / Microsoft 365:

- **Entra ID (Azure AD)** com MFA obrigatório + Conditional Access
- **PIM (Privileged Identity Management)** para roles elevadas
- **Defender for Cloud** (CSPM + CWP)
- **Microsoft Sentinel** como SIEM
- **Azure Policy** + **Blueprints** para guardrails
- **Key Vault** para secrets, com private endpoint
- **Network Security Groups** + **Application Security Groups** + **Azure Firewall**
- **Storage Accounts** sem blob público acidental
- **Azure Backup** com soft delete + immutability
- **Defender for Cloud Apps** (MCAS) para SaaS
- **RBAC** least privilege
- **Management Groups** + tenant hierarchy

---

## 2. Quando usar

- Cliente migra para Azure
- Tenant Microsoft 365 (sempre tem Entra ID)
- Auditoria de tenant existente
- Pré-deploy de workload crítica
- Preparação ISO 27001 / SOC 2
- Após alerta de Defender ou Sentinel

---

## 3. Prioridade

1. **MFA obrigatório** para todos (Conditional Access)
2. **Block Legacy Auth** (POP/IMAP/SMTP auth basic — vetor #1 de compromisso)
3. **Global Admin com PIM** (não permanent)
4. **Defender for Cloud** habilitado
5. **Conditional Access** baseline policies
6. **Audit Log** enabled
7. **Storage** sem blob público
8. **Key Vault** para secrets

---

## 4. Entra ID (Azure AD) — identity

### 4.1 MFA + Conditional Access

**Habilitar Security Defaults** (free tier) OU **Conditional Access** (P1+):

Policies essenciais:

```text
1. Require MFA for all users
2. Block legacy authentication
3. Require MFA for administrators
4. Require compliant device for admins
5. Block sign-in from suspicious locations
6. Require MFA for risky sign-ins (Identity Protection P2)
```

Via PowerShell:
```powershell
Connect-MgGraph -Scopes "Policy.ReadWrite.ConditionalAccess"
# Policies via JSON template
```

### 4.2 PIM (Privileged Identity Management) — P2

- **Nenhum usuário permanent em Global Admin**
- PIM ativa role por tempo limitado (1-8h)
- Aprovação humana opcional para roles críticas
- Audit completo

Roles críticas a colocar em PIM:
- Global Administrator
- Privileged Role Administrator
- Security Administrator
- Exchange Administrator
- SharePoint Administrator
- User Administrator
- Authentication Administrator

### 4.3 Identity Protection (P2)

- Detect risky users (leaked credentials, atypical travel)
- Auto-response: require password change, block

### 4.4 Break-glass account

```text
- 1-2 cloud-only accounts (não synced)
- Excluded from Conditional Access (only this account!)
- MFA hardware (FIDO2 key)
- Password 32+ chars random, store em physical safe
- Monitorado por alerta em qualquer sign-in
```

### 4.5 Service Principals

- Usar **Managed Identity** quando possível (sem secret)
- Se SP: secret/cert rotation
- Permissions least privilege (não `Application.ReadWrite.All`)

---

## 5. Defender for Cloud

```bash
az security pricing create --name VirtualMachines --tier Standard
az security pricing create --name AppServices --tier Standard
az security pricing create --name SqlServers --tier Standard
az security pricing create --name StorageAccounts --tier Standard
az security pricing create --name KeyVaults --tier Standard
az security pricing create --name Containers --tier Standard
```

### 5.1 CSPM (Cloud Security Posture Management)

- Secure Score
- Recommendations
- Regulatory compliance dashboard (CIS, NIST, PCI, ISO)

### 5.2 CWP (Cloud Workload Protection)

- Endpoint protection (Microsoft Defender for Servers)
- Container security (Defender for Containers)
- DB security (Defender for SQL)
- File integrity monitoring
- Adaptive application controls

---

## 6. Microsoft Sentinel

SIEM cloud-native. Setup:

```bash
az sentinel workspace create \
  --resource-group rg-security \
  --workspace-name law-sentinel
```

### 6.1 Data connectors essenciais

- Microsoft 365 (audit, Exchange, SharePoint, Teams)
- Entra ID sign-in/audit logs
- Azure Activity Log
- Microsoft Defender XDR (M365 Defender + Defender for Cloud)
- Office 365 Defender for Office
- Azure Firewall
- DNS analytics
- Linux/Windows events (AMA)

### 6.2 Analytics rules

- Habilitar templates built-in (~200+)
- Custom para contexto (sign-in fora de país)
- Schedule, near-realtime, fusion

### 6.3 Hunting queries

KQL exemplos:
```kql
// Sign-in fail seguido de success do mesmo IP em < 5min (brute force)
SigninLogs
| where ResultType != 0
| join kind=inner (SigninLogs | where ResultType == 0) on UserPrincipalName, IPAddress
| where TimeGenerated1 - TimeGenerated between (0s .. 5m)
```

```kql
// Mass file download from OneDrive
OfficeActivity
| where Operation == "FileDownloaded"
| summarize count() by UserId, bin(TimeGenerated, 1h)
| where count_ > 100
```

### 6.4 SOAR via Logic Apps

- Auto-disable user, auto-isolate device, auto-revoke token
- Aprovação humana para ações destrutivas

---

## 7. Azure Policy + Blueprints

```bash
# Policy: deny criação de Storage sem encryption
az policy definition create \
  --name "require-storage-encryption" \
  --rules policy.json
```

### 7.1 Built-in Policy Initiatives essenciais

- Azure Security Benchmark (most important)
- CIS Microsoft Azure Foundations Benchmark
- ISO 27001:2013
- NIST SP 800-53
- HIPAA HITRUST

### 7.2 Custom policies comuns

- Deny public IP on VMs
- Require tag (`Environment`, `Owner`)
- Allowed locations only
- Deny SQL with public network access
- Require Key Vault soft-delete

---

## 8. Key Vault

```bash
az keyvault create \
  --name kv-prod \
  --resource-group rg-prod \
  --location brazilsouth \
  --enable-rbac-authorization true \
  --enable-soft-delete true \
  --retention-days 90 \
  --enable-purge-protection true
```

Settings essenciais:
- **RBAC authorization** (em vez de Access Policies, mais granular)
- **Soft delete** + **purge protection** (anti-ransomware)
- **Private endpoint** (não público)
- **Network firewall** restringe IPs
- **Logging** para Sentinel

### 8.1 App acessa via Managed Identity

```python
# Python
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

cred = DefaultAzureCredential()  # MI da VM/App Service
client = SecretClient(vault_url="https://kv-prod.vault.azure.net/", credential=cred)
secret = client.get_secret("db-password").value
```

---

## 9. Network

### 9.1 NSG (Network Security Group)

- Deny by default outbound se possible
- Sem 22/3389 from `Internet`
- Use Service Tags em vez de IP ranges (`Storage.BrazilSouth`)

### 9.2 ASG (Application Security Group)

Agrupa VMs lógicamente:
```text
ASG: app-web
ASG: app-api
ASG: db-prod

NSG rule: app-web → app-api on 8080
NSG rule: app-api → db-prod on 5432
```

### 9.3 Azure Firewall

- Para ambientes maiores
- Threat intelligence-based filtering
- TLS inspection
- DNAT/SNAT

### 9.4 Private Endpoints

- Storage, SQL, Cosmos, Key Vault — todos suportam
- Tráfego pela backbone Microsoft, não internet
- DNS privado para resolução interna

### 9.5 NSG Flow Logs

```bash
az network watcher flow-log create \
  --resource-group rg-prod \
  --name nsg-flow-log \
  --nsg <nsg-id> \
  --storage-account <storage-id> \
  --enabled true \
  --retention 30 \
  --traffic-analytics-workspace <law-id>
```

Traffic Analytics insights em Sentinel.

---

## 10. Storage Account

```bash
az storage account create \
  --name stprod \
  --resource-group rg-prod \
  --sku Standard_LRS \
  --kind StorageV2 \
  --https-only true \
  --min-tls-version TLS1_2 \
  --allow-blob-public-access false \
  --default-action Deny \
  --bypass AzureServices \
  --require-infrastructure-encryption true
```

Settings:
- **`allow-blob-public-access false`** (account-level)
- **`default-action Deny`** (network)
- **Private endpoint** preferred
- **Encryption** at rest sempre (default mas confirmar)
- **Infrastructure encryption** para dados sensíveis
- **Versioning** + **soft delete** para blobs
- **Diagnostic logs** para Sentinel
- **Immutable policy** (WORM) para compliance

---

## 11. Azure Backup

```bash
az backup vault create \
  --name vault-prod \
  --resource-group rg-prod \
  --location brazilsouth

# Soft delete + immutability
az backup vault backup-properties set \
  --name vault-prod \
  --resource-group rg-prod \
  --soft-delete-feature-state Enabled \
  --immutability-state Locked
```

- **Soft delete** 14 days (free)
- **Immutability Locked** (ransomware protection)
- **Cross-region restore** se possible

---

## 12. Defender for Cloud Apps (MCAS)

Para SaaS visibility:

- Salesforce, GitHub, Box, Slack, GWS
- Anomaly detection (impossible travel, mass download)
- App discovery via firewall/proxy logs
- Conditional Access App Control (proxy inline)

---

## 13. RBAC

```bash
# Listar role assignments
az role assignment list --all -o table

# Custom role
az role definition create --role-definition '{
  "Name": "Storage Blob Reader Custom",
  "Description": "Read only blobs",
  "Actions": [],
  "DataActions": ["Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read"],
  "AssignableScopes": ["/subscriptions/xxx/resourceGroups/rg-prod"]
}'
```

Princípios:
- **Subscription Owner** → minimum (só break-glass account ou MG admin via PIM)
- Use **built-in roles** com escopo de RG/resource (não subscription)
- **Reader** para auditores
- **Contributor** com PIM (não permanent)

---

## 14. Management Groups

```text
Tenant Root
├── MG: Platform
│   ├── Sub: Connectivity (hub, firewall)
│   ├── Sub: Identity
│   └── Sub: Management (Sentinel, backup)
├── MG: Landing Zones
│   ├── MG: Production
│   │   └── Sub: prod-app-1, prod-app-2
│   └── MG: Non-Production
│       └── Sub: dev, staging
└── MG: Sandbox
```

Policies em Management Group cascateiam.

---

## 15. CIS Microsoft Azure — checklist condensado

```text
[ ] MFA obrigatório all users
[ ] Block legacy authentication
[ ] PIM para Global Admin
[ ] Break-glass account configurado
[ ] Defender for Cloud all plans Standard
[ ] Microsoft Sentinel configured
[ ] Azure Activity Log streamed to Sentinel
[ ] Sign-in logs streamed to Sentinel
[ ] Storage account public access denied
[ ] Storage HTTPS only + TLS 1.2 min
[ ] Key Vault soft-delete + purge protection
[ ] NSG no internet on admin ports
[ ] VPC Flow Logs enabled
[ ] Azure Policy Initiative ASB attached
[ ] Azure Backup soft-delete locked
[ ] No anonymous container access
[ ] No SQL public network
[ ] All data encrypted at rest
[ ] DDoS Standard (large workload)
[ ] Cost alerts configured
```

---

## 16. Tools

- **PSRule for Azure** (Microsoft, lint IaC)
- **ARMTTK** (ARM template tester)
- **Checkov** (multi-cloud IaC)
- **ScoutSuite** (audit)
- **Pacu** (red team — para testing)
- **AzureHound** (BloodHound for Azure)
- **Azure Inventory** (graph queries)

---

## 17. Custo

- Defender ~$15/recurso/mes (variável)
- Sentinel $2-5/GB ingested
- Backup proporcional GB
- Conditional Access P1 ~$6/usuário/mês
- PIM P2 ~$9/usuário/mês

**Vale para qualquer cliente enterprise.**

---

## 18. Integração com outras skills

- `/hosting-infrastructure-analysis` — escolha cloud
- `/anti-phishing-defense` — Conditional Access bloqueia phishing OAuth
- `/secrets-and-env-guard` — Key Vault
- `/incident-diagnosis` — Sentinel alertas
- `/lgpd-compliance-check` — Defender for Cloud Apps
- `/backup-and-recovery-strategy` — Azure Backup
- `/aws-security-baseline` — compatible practices
- `/iso-27001-readiness` + `/soc-2-readiness` — Azure Policy compliance

---

## 19. Frase-guia final

> **Em Microsoft 365/Azure, identity é perímetro. Comprometimento Entra = comprometimento total. MFA + Conditional Access + Block Legacy Auth + PIM em Global Admin: 4 controles que bloqueiam 95% dos ataques reais.**
