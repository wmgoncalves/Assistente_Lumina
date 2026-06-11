---
name: kubernetes-security-baseline
description: Baseline de seguranca em Kubernetes - RBAC least privilege com Roles/ClusterRoles, Pod Security Standards (restricted), Network Policies com Calico/Cilium, secrets via sealed-secrets/external-secrets/vault, image scanning com Trivy/Grype, admission control com OPA Gatekeeper/Kyverno, runtime protection com Falco, etcd encryption at rest, audit logging, ServiceAccount tokens com projected volumes, no privileged containers, no hostPath/hostNetwork. Cobre EKS+AKS+GKE+self-managed (kubeadm). Use ao instalar/auditar cluster, em CIS Benchmark, ou ao receber cluster heredado. Complementa docker-devops-hardening (Docker layer) com a layer K8s.
---

# kubernetes-security-baseline

> **Frase-guia:** Kubernetes default é hostile demais para amador. Sem RBAC, Pod Security, Network Policy e admission control, é só uma plataforma de execução remota.

## 0. Regra suprema

K8s expõe atacante a 4 camadas (cluster, node, pod, container). Hardening sem todas as 4 = falha. Em conflito entre conveniência de dev e segurança, **segurança vence** — config é dor curta, exploit é dor longa.

---

## 1. Objetivo

Baseline em cluster Kubernetes:

- **RBAC** least privilege + ServiceAccount discipline
- **Pod Security Standards** (restricted profile)
- **Network Policies** (default deny + allowlist)
- **Secrets** via Vault/External Secrets/Sealed Secrets (não plaintext)
- **Image scanning** em CI + admission
- **Admission control** com OPA Gatekeeper / Kyverno
- **Runtime protection** com Falco
- **etcd encryption** at rest
- **Audit logging** + SIEM
- **CIS Benchmark** + kube-bench
- **Multi-tenancy** com namespaces + ResourceQuota + LimitRange

---

## 2. Quando usar

- Instalando cluster novo (EKS/AKS/GKE/kubeadm)
- Receber cluster herdado de cliente
- Auditoria periódica (trimestral)
- Resposta a incidente
- Preparação compliance (SOC 2, ISO 27001)
- Após CVE em runtime (containerd/runc/etcd)

---

## 3. Prioridade

1. **RBAC** — eliminar `cluster-admin` em humanos diários
2. **Pod Security Standards** (restricted) em namespaces de app
3. **Network Policies** (default deny)
4. **Image scanning** + admission
5. **Secrets** fora de plain ConfigMap/manifests
6. **Audit logs** capturados
7. **Runtime**: Falco rules + alertas
8. **CIS Benchmark** validado

---

## 4. RBAC

### 4.1 Princípios

- Sem `cluster-admin` em ServiceAccount de app
- Sem `cluster-admin` em humanos rotineiros (use namespaced Role)
- Role → namespace específico
- ClusterRole → cluster-wide
- ServiceAccount por app (não default)

### 4.2 Role exemplo (least privilege)

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: app-reader
  namespace: prod
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get"]
  resourceNames: ["app-config", "app-secrets"]  # named specifically
```

### 4.3 ServiceAccount per workload

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
  namespace: prod
automountServiceAccountToken: false  # se não precisa
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: app-binding
  namespace: prod
subjects:
- kind: ServiceAccount
  name: app-sa
  namespace: prod
roleRef:
  kind: Role
  name: app-reader
  apiGroup: rbac.authorization.k8s.io
```

### 4.4 Token projection

K8s 1.21+: tokens projetados expire automatic (90 min default), audience-bound:
```yaml
serviceAccountToken:
  audience: "vault"
  expirationSeconds: 3600
  path: token
```

### 4.5 Auditar RBAC

```bash
# Quem pode fazer X?
kubectl auth can-i --list --as=system:serviceaccount:prod:app-sa

# Bindings de uma SA
kubectl get rolebindings,clusterrolebindings --all-namespaces -o json |
  jq '.items[] | select(.subjects[]?.name=="app-sa")'

# rakkess (open source) — view who can what
rakkess --as system:serviceaccount:prod:app-sa
```

---

## 5. Pod Security Standards

PSS replace deprecated PodSecurityPolicy. 3 profiles: Privileged, Baseline, Restricted.

### 5.1 Aplicar restricted

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: prod-app
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

### 5.2 O que `restricted` exige

- `runAsNonRoot: true`
- `allowPrivilegeEscalation: false`
- `privileged: false`
- Drop ALL capabilities
- `readOnlyRootFilesystem: true` (recomendado)
- Volumes restritos
- No `hostPath`, `hostNetwork`, `hostPID`, `hostIPC`
- Seccomp profile (RuntimeDefault)
- AppArmor profile (em nodes com suporte)

### 5.3 Pod compliant

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  serviceAccountName: app-sa
  automountServiceAccountToken: false
  securityContext:
    runAsUser: 10001
    runAsGroup: 10001
    runAsNonRoot: true
    fsGroup: 10001
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    image: registry.example.com/app:v1.2.3@sha256:abc...  # immutable
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop: ["ALL"]
    resources:
      requests:
        cpu: 100m
        memory: 128Mi
      limits:
        cpu: 500m
        memory: 512Mi
    livenessProbe:
      httpGet:
        path: /healthz
        port: 8080
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
```

---

## 6. Network Policies

### 6.1 Default deny

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: prod-app
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

### 6.2 Allow específico

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-web-to-api
  namespace: prod-app
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: web
    ports:
    - protocol: TCP
      port: 8080
```

### 6.3 Allow DNS + egress mínimo

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-and-api-egress
  namespace: prod-app
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
  - to:
    - podSelector:
        matchLabels:
          app: db
    ports:
    - protocol: TCP
      port: 5432
```

### 6.4 CNI providers

- **Calico** — NetworkPolicy + extensions, eBPF
- **Cilium** — eBPF, L7 policies (HTTP method/path)
- **Weave** — simples
- **Kube-router**

Cilium permite policies L7:
```yaml
endpointSelector:
  matchLabels:
    app: api
ingress:
- toPorts:
  - ports:
    - port: "8080"
    rules:
      http:
      - method: "GET"
        path: "/api/v1/.*"
```

---

## 7. Secrets

### 7.1 Default K8s Secret é insuficiente

K8s Secret armazena em etcd **base64** (não encrypted by default).

### 7.2 Habilitar etcd encryption at rest

```yaml
# EncryptionConfiguration
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
    - secrets
    providers:
    - aescbc:
        keys:
        - name: key1
          secret: <base64 32-byte key>
    - identity: {}
```

Restart apiserver com `--encryption-provider-config`.

### 7.3 External Secrets Operator

Sync de Vault/AWS Secrets Manager/GCP Secret Manager/Azure Key Vault para K8s:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-secret
  namespace: prod
spec:
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: db-secret
  data:
  - secretKey: password
    remoteRef:
      key: secret/data/prod/db
      property: password
```

### 7.4 Sealed Secrets (Bitnami)

Encrypta secret antes de commit em git:
```bash
echo -n mypassword | kubectl create secret generic db --dry-run=client \
  --from-file=password=/dev/stdin -o yaml |
  kubeseal -o yaml > sealed-db.yaml
git commit sealed-db.yaml
```

### 7.5 Vault Agent Injection

Sidecar Vault Agent renew tokens, write secret em volume:
```yaml
annotations:
  vault.hashicorp.com/agent-inject: "true"
  vault.hashicorp.com/agent-inject-secret-db: "secret/prod/db"
```

---

## 8. Image scanning + admission

### 8.1 CI scanning

```bash
# Trivy
trivy image registry.example.com/app:v1 --severity HIGH,CRITICAL --exit-code 1

# Grype
grype registry.example.com/app:v1 --fail-on high
```

### 8.2 Admission via OPA Gatekeeper

```yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequirenonroot
spec:
  crd:
    spec:
      names:
        kind: K8sRequireNonRoot
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequirenonroot
        violation[{"msg": msg}] {
          c := input.review.object.spec.containers[_]
          not c.securityContext.runAsNonRoot
          msg := sprintf("Container %v must runAsNonRoot", [c.name])
        }
```

### 8.3 Admission via Kyverno

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-image-signature
spec:
  validationFailureAction: enforce
  rules:
  - name: verify-image
    match:
      resources:
        kinds: [Pod]
    verifyImages:
    - imageReferences:
      - "registry.example.com/*"
      attestors:
      - entries:
        - keys:
            publicKeys: |
              -----BEGIN PUBLIC KEY-----
              ...
              -----END PUBLIC KEY-----
```

### 8.4 Sigstore/Cosign

```bash
# Sign image
cosign sign --key cosign.key registry.example.com/app:v1

# Verify
cosign verify --key cosign.pub registry.example.com/app:v1
```

---

## 9. Runtime: Falco

Detecta comportamento anômalo em runtime:

```yaml
- rule: Shell in Container
  desc: Detect shell spawning in container
  condition: container.id != host and (proc.name in (shell_binaries))
  output: "Shell in container (user=%user.name container=%container.name)"
  priority: WARNING
  tags: [container, shell]
```

Rules built-in detectam:
- Privilege escalation
- File system writes em paths system
- Network connections unexpected
- crypto miners
- Reverse shells

Falco → alerts → Slack/Sentinel/Pagerduty.

---

## 10. Audit logs

```yaml
# audit-policy.yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
- level: RequestResponse
  resources:
  - group: ""
    resources: ["secrets", "configmaps"]
- level: Request
  resources:
  - group: "rbac.authorization.k8s.io"
    resources: ["*"]
- level: Metadata
  omitStages: ["RequestReceived"]
```

API server flags:
```text
--audit-policy-file=/etc/k8s/audit-policy.yaml
--audit-log-path=/var/log/k8s-audit.log
--audit-log-maxage=30
--audit-log-maxbackup=10
--audit-log-maxsize=100
```

Send to SIEM via Filebeat/Fluentd.

---

## 11. etcd hardening

- TLS client + peer
- Encryption at rest (configurado §7.2)
- Sem acceso public
- Backup + restore tested

```bash
# Backup
ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/k8s/ca.crt --cert=/etc/k8s/etcd-client.crt --key=/etc/k8s/etcd-client.key \
  snapshot save /backup/etcd-$(date +%F).db
```

---

## 12. CIS Benchmark

```bash
# kube-bench (Aqua Security)
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml
kubectl logs job/kube-bench
```

Hits típicos a corrigir:
- API server: enable audit
- Controller: profiling disabled
- Kubelet: anonymous-auth false
- etcd: encryption-provider-config
- RBAC: no cluster-admin em SA default

---

## 13. Multi-tenancy

```yaml
# ResourceQuota
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-quota
  namespace: tenant-a
spec:
  hard:
    pods: "50"
    requests.cpu: "10"
    requests.memory: "20Gi"
    limits.cpu: "20"
    limits.memory: "40Gi"
---
# LimitRange
apiVersion: v1
kind: LimitRange
metadata:
  name: tenant-limits
  namespace: tenant-a
spec:
  limits:
  - max:
      cpu: "2"
      memory: "4Gi"
    min:
      cpu: "100m"
      memory: "128Mi"
    type: Container
```

---

## 14. Managed K8s — provider specifics

### 14.1 EKS

- IRSA (`eks.amazonaws.com/role-arn` annotation)
- VPC CNI security groups for pods
- Pod Identity (mais recente)
- AWS Inspector + Trivy
- Combinar com `/aws-security-baseline`

### 14.2 GKE

- Workload Identity (mandatory)
- Private cluster + Authorized Networks
- Binary Authorization
- Confidential GKE Nodes
- Combinar com `/gcp-security-baseline`

### 14.3 AKS

- Microsoft Entra integration + RBAC
- Azure Policy add-on
- Defender for Containers
- Pod Identity v2
- Combinar com `/azure-security-baseline`

### 14.4 Self-managed (kubeadm)

- Patch OS regularmente
- kubeadm upgrade
- etcd separado em nodes dedicated
- Maior responsabilidade operacional

---

## 15. Checklist

```text
# RBAC
[ ] No cluster-admin in app ServiceAccounts
[ ] No cluster-admin in human users (use namespaced)
[ ] Each app has own ServiceAccount
[ ] automountServiceAccountToken: false when not needed
[ ] Token expiration < 1h (1.21+ default)

# Pod Security
[ ] PSS restricted on app namespaces
[ ] No privileged containers
[ ] runAsNonRoot all containers
[ ] readOnlyRootFilesystem
[ ] No hostPath/hostNetwork/hostPID/hostIPC
[ ] Drop ALL capabilities
[ ] seccomp RuntimeDefault

# Network
[ ] CNI with NetworkPolicy support
[ ] Default deny in all namespaces
[ ] Allowlist policies per service
[ ] Egress restricted (DNS + specific destinations)

# Secrets
[ ] etcd encryption at rest
[ ] External Secrets / Vault / Sealed Secrets
[ ] No secrets em ConfigMap or env directly

# Image
[ ] Scanning in CI (Trivy/Grype)
[ ] Admission policy (Gatekeeper/Kyverno)
[ ] Image signed + verified (Cosign)
[ ] Pin by SHA256 digest

# Runtime
[ ] Falco deployed
[ ] Falco rules tuned
[ ] Alerts → SIEM/Slack

# Audit
[ ] Audit policy configured
[ ] Logs to SIEM
[ ] Sensitive resources logged at RequestResponse

# Cluster
[ ] kube-bench passing essential checks
[ ] CNI updated
[ ] runtime (containerd) updated
[ ] kubelet/control plane updated
[ ] etcd backup tested

# Multi-tenancy
[ ] ResourceQuota per namespace
[ ] LimitRange per namespace
[ ] NetworkPolicy isolation
```

---

## 16. Tools

- **kube-bench** — CIS scan
- **kubesec.io** — manifest analyzer
- **kubectl-rakkess** — RBAC viewer
- **Trivy/Grype** — image scan
- **OPA Gatekeeper** / **Kyverno** — admission
- **Falco** — runtime
- **External Secrets Operator** / **Sealed Secrets** / **Vault**
- **kube-hunter** — penetration test
- **Polaris** — best practices linter
- **Datree** — policy as code
- **Checkov** — IaC scan

---

## 17. Integração

- `/docker-devops-hardening` — Docker layer
- `/aws-security-baseline` — EKS
- `/azure-security-baseline` — AKS
- `/gcp-security-baseline` — GKE
- `/secrets-and-env-guard` — secrets management
- `/incident-diagnosis` — runtime alerts
- `/dependency-firewall` — image deps
- `/iso-27001-readiness` + `/soc-2-readiness` — compliance

---

## 18. Frase-guia final

> **K8s sem RBAC + Pod Security + Network Policy + admission é só uma plataforma de execução remota. Hardening em 4 camadas: cluster (kube-bench), node (CIS), pod (PSS restricted), runtime (Falco). Image scan em CI + admission = supply chain controlado.**
