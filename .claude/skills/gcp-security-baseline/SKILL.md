---
name: gcp-security-baseline
description: Baseline de seguranca em Google Cloud Platform (GCP) - Cloud IAM least privilege com Conditions e Tags, Organization Policy constraints, Cloud Audit Logs (Admin Activity sempre + Data Access selective), Security Command Center premium, Cloud Asset Inventory, Cloud KMS para criptografia, VPC Service Controls, Private Google Access, Secret Manager (nao .env), Container Analysis para Artifact Registry, Workload Identity para GKE, Cloud Armor para WAF/DDoS, Cloud DLP para PII. Use ao migrar cliente para GCP, em audit de projeto/organization, ou em landing zone com Terraform. Complementa hosting-infrastructure-analysis (escolha) com o lado seguranca de implementacao.
---

# gcp-security-baseline

> **Frase-guia:** GCP é mais segura por default que AWS, mas IAM ainda é o vetor #1. Org Policy é poder absoluto — use sem medo.

## 0. Regra suprema

Google Cloud tem defaults melhores (audit log default, encryption default, IAM granular), mas escala mal sem rigidez de Organization Policy. Cada permissão é potencial RCE quando aplicada errado. Em conflito entre velocidade e controle, **Org Policy + Workload Identity** vencem.

---

## 1. Objetivo

Estabelecer baseline em GCP organization/project:

- **Cloud IAM** least privilege com Conditions
- **Organization Policy** constraints
- **Cloud Audit Logs** (Admin sempre + Data Access selective)
- **Security Command Center (SCC)** Premium
- **Cloud Asset Inventory** + change history
- **Cloud KMS** customer-managed keys
- **VPC Service Controls** (perimeter)
- **Private Google Access** (sem internet para APIs)
- **Secret Manager** com IAM
- **Container Analysis** para Artifact Registry
- **Workload Identity** para GKE (sem service account keys)
- **Cloud Armor** WAF + DDoS protection
- **Cloud DLP** para PII em BigQuery/Cloud Storage

---

## 2. Quando usar

- Cliente migra para GCP
- Audit de project ou organization existente
- Pré-deploy de workload crítica
- Compliance prep (ISO, SOC 2)
- Após alerta de SCC

---

## 3. Prioridade

1. **Org Policy** constraints essenciais
2. **Audit logs** flow para BigQuery/Cloud Logging
3. **SCC Premium** habilitado
4. **No service account keys** (use Workload Identity)
5. **Cloud Storage** sem allUsers/allAuthenticatedUsers
6. **IAM** sem `roles/editor` ou `roles/owner` em humanos
7. **2FA** + Google Cloud Identity / SSO

---

## 4. Cloud IAM

### 4.1 Principles

- **Principle of least privilege**
- **Predefined roles** > Basic roles (Owner/Editor/Viewer)
- **Custom roles** quando predefined não cabe
- **IAM Conditions** para temporal/contextual access
- **Tags** para resource-level policies

### 4.2 Avoid Basic Roles

❌ `roles/owner`, `roles/editor`, `roles/viewer` em humanos
✅ Predefined granular: `roles/storage.objectViewer`, `roles/compute.instanceAdmin.v1`

### 4.3 Service Accounts

- **Workload Identity** para GKE (sem keys)
- **Service Account Impersonation** para humanos acessarem SA temporariamente
- **No service account keys** em CI/CD (use Workload Identity Federation)
- Se SA key inevitável: rotation 90 days, store em Secret Manager

### 4.4 IAM Conditions

```text
expression: "request.time < timestamp('2026-12-31T00:00:00Z')"
title: "Temporary access until end of year"
```

Combinações úteis:
- Tempo limitado
- IP source allowlist
- Resource name pattern

### 4.5 Recommender

GCP IAM Recommender sugere remoção de permissões não usadas.

```bash
gcloud recommender recommendations list \
  --project=my-project \
  --recommender=google.iam.policy.Recommender \
  --location=global
```

---

## 5. Organization Policy

Constraints aplicam em **toda a organization** ou OU.

### 5.1 Essenciais

```yaml
# Deny external sharing in Drive
constraints/iam.allowedPolicyMemberDomains:
  allowed_values:
    - "C0123456"  # customer ID

# Restrict VM external IPs
constraints/compute.vmExternalIpAccess:
  denied_values:
    - "projects/*/instances/*"

# Restrict allowed regions
constraints/gcp.resourceLocations:
  allowed_values:
    - "in:southamerica-east1"
    - "in:us-east1"

# Disable Cloud Storage anonymous access
constraints/storage.publicAccessPrevention: enforced

# Disable service account key creation
constraints/iam.disableServiceAccountKeyCreation: enforced

# Require Shielded VM
constraints/compute.requireShieldedVm: enforced

# Disable default network creation
constraints/compute.skipDefaultNetworkCreation: enforced

# Restrict cross-project SA usage
constraints/iam.disableCrossProjectServiceAccountUsage: enforced
```

### 5.2 Custom constraints

```yaml
name: "requireLabels"
resource_types: ["compute.googleapis.com/Instance"]
methodTypes: ["CREATE"]
condition: "resource.labels.environment != null && resource.labels.owner != null"
actionType: "DENY"
```

---

## 6. Cloud Audit Logs

### 6.1 Tipos

| Tipo | Default | Recomendação |
|---|---|---|
| Admin Activity | Sempre ON | Manter |
| System Event | Sempre ON | Manter |
| Data Access | OFF (cuidado: volume) | ON em projects críticos |
| Policy Denied | Sempre ON | Manter |

### 6.2 Sink para BigQuery

```bash
# Export todos os audit logs para BigQuery (queryable)
gcloud logging sinks create audit-logs-sink \
  bigquery.googleapis.com/projects/security-project/datasets/audit_logs \
  --log-filter='logName:"cloudaudit.googleapis.com"' \
  --include-children
```

Permite queries históricas:
```sql
SELECT timestamp, proto_payload.authentication_info.principal_email, proto_payload.method_name
FROM `security-project.audit_logs.cloudaudit_googleapis_com_activity_*`
WHERE proto_payload.method_name LIKE "%delete%"
ORDER BY timestamp DESC
LIMIT 100
```

### 6.3 Alerting

Cloud Monitoring → log-based metrics → alert:
- Root project change
- IAM policy change
- VPC firewall change
- BigQuery export jobs (data exfil?)

---

## 7. Security Command Center

```bash
# Habilitar SCC Premium (org-level)
# Via console: Security → Security Command Center → Settings → Tier: Premium
```

Premium inclui:
- **Security Health Analytics** (CIS, NIST, PCI-DSS posture)
- **Event Threat Detection** (Cloud-native EDR)
- **Container Threat Detection** (GKE runtime)
- **VM Threat Detection** (memory-resident malware)
- **Web Security Scanner**
- **Continuous Exports** (BigQuery, Pub/Sub)
- **Findings management** (assigne, mute, suppress)

Custo: ~5-15% do seu spend GCP (premium).

---

## 8. Cloud Asset Inventory

```bash
# Export atual + histórico
gcloud asset export \
  --organization=123456 \
  --bigquery-table=projects/sec/datasets/asset/tables/assets \
  --asset-types='compute.googleapis.com/Instance' \
  --content-type=resource
```

- Inventário multi-project
- 5 anos de change history
- Queries em BigQuery

---

## 9. Cloud KMS

```bash
# Keyring + key
gcloud kms keyrings create prod-keyring --location=southamerica-east1
gcloud kms keys create app-key \
  --keyring=prod-keyring \
  --location=southamerica-east1 \
  --purpose=encryption \
  --rotation-period=90d \
  --next-rotation-time=$(date -d '+90 days' --iso-8601=seconds)
```

CMEK em quase tudo (Cloud Storage, BigQuery, Compute disks, Cloud SQL).

### 9.1 Cloud HSM

Para chaves com requirement FIPS 140-2 Level 3 (compliance):
```bash
gcloud kms keys create app-key \
  --protection-level=hsm \
  --purpose=encryption
```

### 9.2 External Key Manager (EKM)

Chaves on-premises (Thales, Fortanix) via EKM.

---

## 10. VPC Service Controls

Cria "perímetros" lógicos que isolam APIs sensitive:

```yaml
name: prod-perimeter
type: REGULAR
status:
  resources:
    - projects/12345  # PROD project
  restrictedServices:
    - bigquery.googleapis.com
    - storage.googleapis.com
    - cloudkms.googleapis.com
  accessLevels:
    - accessPolicies/12/accessLevels/corporate-network
```

Impede exfil mesmo com credencial roubada (request fora do perímetro = deny).

---

## 11. Private Google Access + Private Service Connect

- VMs sem IP externo acessam APIs (`storage.googleapis.com`) sem internet
- Cloud SQL, Memorystore via Private Service Connect
- Reduce attack surface

---

## 12. Secret Manager

```bash
gcloud secrets create db-password \
  --replication-policy=automatic

echo -n "supersecret" | gcloud secrets versions add db-password --data-file=-

# Grant access (Workload Identity SA)
gcloud secrets add-iam-policy-binding db-password \
  --member="serviceAccount:my-sa@project.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

App acessa:
```python
from google.cloud import secretmanager
client = secretmanager.SecretManagerServiceClient()
name = f"projects/123/secrets/db-password/versions/latest"
response = client.access_secret_version(request={"name": name})
secret = response.payload.data.decode("UTF-8")
```

Rotation:
- Cloud Function trigged by Pub/Sub
- Notify dependents

---

## 13. Container security

### 13.1 Artifact Registry + Container Analysis

```bash
# Habilitar Container Analysis
gcloud services enable containeranalysis.googleapis.com

# Push image
gcloud auth configure-docker southamerica-east1-docker.pkg.dev
docker push southamerica-east1-docker.pkg.dev/my-project/repo/app:v1

# Vulnerability scan automatic
gcloud container images list-tags \
  southamerica-east1-docker.pkg.dev/my-project/repo/app \
  --format=json
```

### 13.2 Binary Authorization

Impede deploy de image sem assinatura ou com vuln CRITICAL:

```yaml
admissionRule:
  evaluationMode: REQUIRE_ATTESTATION
  enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG
  requireAttestationsBy:
    - projects/my-project/attestors/vuln-scanner
```

---

## 14. GKE security

### 14.1 Workload Identity

```bash
# No service account JSON keys!
gcloud iam service-accounts add-iam-policy-binding \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:my-project.svc.id.goog[default/my-ksa]" \
  my-gsa@my-project.iam.gserviceaccount.com

# Annotate K8s SA
kubectl annotate serviceaccount my-ksa \
  iam.gke.io/gcp-service-account=my-gsa@my-project.iam.gserviceaccount.com
```

### 14.2 Cluster hardening

```bash
gcloud container clusters create prod-cluster \
  --enable-shielded-nodes \
  --enable-private-nodes \
  --master-ipv4-cidr 172.16.0.0/28 \
  --enable-master-authorized-networks \
  --master-authorized-networks 203.0.113.0/24 \
  --enable-network-policy \
  --enable-intra-node-visibility \
  --release-channel rapid \
  --workload-pool=my-project.svc.id.goog
```

- Private cluster (no public IP nodes)
- Authorized networks (control plane)
- Network policies (Calico)
- Shielded GKE Nodes
- Release channel (auto-update)
- Workload Identity

### 14.3 GKE security posture

Ativar Dashboard → Security:
- Misconfig detection
- CVE scanning
- Network policy recommendations

---

## 15. Cloud Armor (WAF + DDoS)

```yaml
# Security policy
- name: deny-bad-ips
  priority: 1000
  match:
    versionedExpr: SRC_IPS_V1
    config:
      srcIpRanges: ["1.2.3.4/32"]
  action: deny(403)

- name: rate-limit
  priority: 2000
  rateLimitOptions:
    rateLimitThreshold:
      count: 100
      intervalSec: 60
    enforceOnKey: IP
  action: rate_based_ban

- name: preconfig-waf
  priority: 3000
  match:
    expr:
      expression: "evaluatePreconfiguredExpr('sqli-v33-stable') || evaluatePreconfiguredExpr('xss-v33-stable')"
  action: deny(403)
```

- DDoS protection (Network e Application)
- WAF com OWASP rules
- Adaptive Protection (ML-based)
- Bot management (Premium)

---

## 16. Cloud DLP (Data Loss Prevention)

Detecta PII em Cloud Storage, BigQuery, datastores:

```bash
gcloud dlp inspect content \
  --inspect-config '{
    "infoTypes": [{"name":"EMAIL_ADDRESS"},{"name":"BRAZIL_CPF_NUMBER"}],
    "minLikelihood": "POSSIBLE"
  }' \
  --content-item '{"value":"João CPF 123.456.789-00"}'
```

Templates re-utilizáveis. Importante para LGPD.

---

## 17. CIS GCP — checklist condensado

```text
[ ] Org Policy: storage.publicAccessPrevention enforced
[ ] Org Policy: iam.disableServiceAccountKeyCreation
[ ] Org Policy: compute.requireShieldedVm
[ ] Org Policy: compute.skipDefaultNetworkCreation
[ ] Org Policy: gcp.resourceLocations restricted
[ ] No basic roles (Owner/Editor) on humans
[ ] All SA without keys (Workload Identity)
[ ] Audit logs sink to BigQuery
[ ] SCC Premium enabled
[ ] CMEK for all sensitive data
[ ] VPC Service Controls perimeter
[ ] Private Google Access enabled
[ ] No firewall rules 0.0.0.0/0 to admin ports
[ ] Cloud Armor on public-facing
[ ] GKE: Workload Identity + Private Cluster + Network Policy + Shielded
[ ] Binary Authorization enforced
[ ] Container Analysis enabled
[ ] Cloud DLP scans Storage/BQ
[ ] Bucket-level uniform IAM (no ACL)
```

---

## 18. Tools

- **Forseti Security** (open source, descontinuado mas ainda útil)
- **gcloud asset** + BigQuery queries
- **CIS Benchmark scanner** (Prowler GCP)
- **Cartography** (Lyft, multi-cloud graph)
- **Terraform validator** (compliance gate)
- **gcp-iam-recommender** (Recommender API)
- **G-Scout** (audit)

---

## 19. Integração com outras skills

- `/hosting-infrastructure-analysis` — escolha cloud
- `/secrets-and-env-guard` — Secret Manager
- `/docker-devops-hardening` — Artifact Registry + Binary Authorization
- `/kubernetes-security-baseline` — GKE specific
- `/incident-diagnosis` — SCC alertas
- `/lgpd-compliance-check` — Cloud DLP
- `/backup-and-recovery-strategy` — Cloud Storage versioning + retention
- `/aws-security-baseline` + `/azure-security-baseline` — multi-cloud
- `/iso-27001-readiness` + `/soc-2-readiness` — controles

---

## 20. Frase-guia final

> **GCP é menos hostil que AWS por default, mas IAM ainda é o vetor primário. Org Policy bloqueia coisa estúpida no atacado. Workload Identity elimina service account keys de uma vez. Cloud Armor barato e excelente.**
