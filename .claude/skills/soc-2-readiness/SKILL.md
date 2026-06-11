---
name: soc-2-readiness
description: Preparacao para SOC 2 Type 1 e Type 2 - Trust Services Criteria (Security obrigatorio + opcionais Availability, Confidentiality, Processing Integrity, Privacy), gap analysis vs Common Criteria CC1-CC9, controles obrigatorios, periodo de observacao para Type 2 (3-12 meses de evidencia), auditoria por CPA firm, Vanta/Drata/Secureframe automation, integracao com AWS/Azure/GCP audit, compliance multi-framework (overlap ISO 27001), custo, runbook. Use ao preparar SaaS B2B para certificacao exigida por cliente enterprise, em consultoria de compliance, ou validacao de maturidade tecnica de SaaS. Aplicavel quando cliente B2B nos EUA exige SOC 2 (cada vez mais comum no Brasil tambem).
---

# soc-2-readiness

> **Frase-guia:** SOC 2 Type 1 prova que controles existem; Type 2 prova que funcionam continuamente. Type 2 é o que cliente quer.

## 0. Regra suprema

SOC 2 é **atestação**, não certificação. Auditor (CPA firm) emite relatório, não certificado. Type 2 requer **3-12 meses de evidência operacional contínua**. Sem ferramenta automation (Vanta/Drata), o esforço é proibitivo.

---

## 1. Objetivo

Preparar SaaS para **SOC 2 Type 1 ou Type 2**:

- Entender Trust Services Criteria (TSC)
- Selecionar criterios aplicáveis (Security obrigatório + opcionais)
- **Gap analysis** vs Common Criteria (CC1-CC9)
- Implementar controles
- **Período de observação** para Type 2
- Selecionar auditor (CPA firm)
- Coleta de evidências
- Auditoria + relatório SOC 2
- Compartilhamento com cliente (NDA)

---

## 2. Quando usar

- SaaS B2B com cliente enterprise (EUA ou BR exigente)
- Pré-fundraising
- Compliance vendor management
- Diferenciação competitiva
- Setor regulado (saúde, financeiro)

**Não usar para:**
- Produto B2C
- Cliente sem exigência específica
- Empresa muito pequena (1-5 funcionários)

---

## 3. Type 1 vs Type 2

| Aspecto | Type 1 | Type 2 |
|---|---|---|
| O que prova | Controles existem em data X | Controles operam efetivamente em período |
| Período | Point-in-time | 3-12 meses |
| Custo auditoria | $15k-30k | $30k-80k |
| Tempo preparação | 3-6 meses | 6-12 meses |
| Valor para cliente | Baixo (snapshot) | Alto (track record) |
| Quando | Primeiro passo | O que cliente realmente quer |

**Recomendação:** Type 1 primeiro (3 meses), Type 2 6 meses depois (cover período inicial + 3 meses observação adicional).

---

## 4. Trust Services Criteria (TSC)

### 4.1 Security (obrigatório)

Common Criteria (CC1-CC9):
- **CC1** Control Environment (cultura, integridade)
- **CC2** Communication & Information (políticas, training)
- **CC3** Risk Assessment
- **CC4** Monitoring
- **CC5** Control Activities
- **CC6** Logical & Physical Access Controls
- **CC7** System Operations (change, incident, vulnerability)
- **CC8** Change Management
- **CC9** Risk Mitigation

### 4.2 Availability (opcional)

- Uptime targets
- DR (Disaster Recovery)
- Backup
- Monitoring

### 4.3 Confidentiality (opcional)

- Data classification
- Encryption
- Access restriction

### 4.4 Processing Integrity (opcional)

- Sistema processa data corretamente
- Validação de input
- Error handling

### 4.5 Privacy (opcional)

- Notice & consent
- Data minimization
- Retention

**Recomendação inicial:** Security + Availability + Confidentiality (3 dos 5).

---

## 5. Controles típicos (sample)

### CC1 — Control Environment

- Organograma + responsabilidades documentadas
- Código de conduta assinado
- Background check em hires
- Treinamento de SI anual

### CC2 — Communication

- Políticas comunicadas (intranet, all-hands)
- Canal de denúncia (whistleblower)
- Newsletter de SI

### CC3 — Risk Assessment

- Análise de risco anual
- Risk register vivente
- Riscos novos disparam análise

### CC6 — Access Control

- SSO + MFA
- Least privilege
- Periodic access review (quarterly)
- Off-boarding < 24h
- Privileged access (PAM/PIM)

### CC7 — Operations

- Vulnerability scanning quinzenal
- Patching SLA (critical: 7d, high: 30d)
- Incident response plan + drill anual
- Pen test anual

### CC8 — Change Management

- Code review obrigatório
- CI/CD com tests + security gates
- Production change com approval
- Rollback documentado

---

## 6. Roadmap Type 2 (12 meses)

### Mês 1-2: Setup

- Selecionar auditor (CPA firm)
- Escolher Trust Service Categories
- Subscribe Vanta/Drata
- Connect AWS/GCP/Azure + GitHub + Okta + HRIS

### Mês 3-4: Implementação

- Gap analysis automated
- Implementar controles faltantes
- Políticas escritas e aprovadas
- Treinamento de equipe

### Mês 5-7: Observation period (Type 1 ready)

- Coleta de evidências contínua
- Type 1 audit (ready)
- Type 2 observation começa

### Mês 8-11: Continue observation

- Surveillance contínua
- Não-conformidades corrigidas
- Evidências em cada controle

### Mês 12: Audit Type 2

- Auditor coleta amostras
- Test of controls
- Report draft → final
- Distribuir para clientes (NDA)

---

## 7. Vanta/Drata/Secureframe

### 7.1 O que fazem

- **Connect integrations** (AWS, GitHub, Okta, Slack, Linear, etc.)
- **Continuous monitoring** dos controles
- **Auto-collect evidence** (screenshots, queries)
- **Templates** de políticas
- **Dashboard** com status
- **Audit prep** workspace
- **HR offboarding** workflow
- **Vendor management**

### 7.2 Comparação

| Tool | Pros | Cons | Custo |
|---|---|---|---|
| **Vanta** | Mais maduro, popular | Caro | $12-30k/ano |
| **Drata** | Forte automation | Pricing por user | $10-25k/ano |
| **Secureframe** | Bom UX | Menos integrations | $8-20k/ano |
| **Sprinto** | Brasil-friendly | Menor escala | $5-15k/ano |
| **Thoropass** | Multi-framework | Newer | Custom |

**ROI**: tool ~$15k/ano + 0.3 FTE vs sem tool ~1.5 FTE. Break-even rápido.

---

## 8. Auditores (CPA firms)

### 8.1 Tier 1 (Big 4)

- Deloitte, KPMG, EY, PwC
- Caros, brand value alto
- Necessário para grandes deals enterprise

### 8.2 Specialized SOC 2 firms

- A-LIGN
- Schellman
- Coalfire
- BARR Advisory
- Insight Assurance
- Sensiba (formerly Sensiba San Filippo)

**Recomendação para PME**: specialized firm. Custo menor, expertise igual.

### 8.3 Brasil

- BDO, Grant Thornton (têm prática SOC 2)
- Mais comum: usar US firm remoto

---

## 9. Coleta de evidências

### 9.1 Tipo de evidência

| Controle | Evidência típica |
|---|---|
| MFA enforced | Print Okta + lista de exceções |
| Access review | Spreadsheet aprovado quarterly |
| Background check | Política + samples |
| Vuln scan | Reports + remediation tickets |
| Patching | Patch management reports |
| Incident response | Tickets + post-mortems |
| Backup | Backup logs + restore tests |
| Change mgmt | PR samples com approvals |
| Onboarding | Checklist completado por hire |
| Offboarding | Access removal logs |

### 9.2 Automation via Vanta

Vanta coleta automaticamente:
- AWS: IAM, S3 public, CloudTrail
- GitHub: code review, branch protection
- Okta: MFA, user listing
- Linear/Jira: ticket samples
- Slack: alerts setup

---

## 10. Sample size — Type 2

Auditor pega samples por controle ao longo do período. Tamanhos típicos:

| Frequency | Sample size |
|---|---|
| Quarterly | 4 samples (todos) |
| Monthly | 12 samples |
| Weekly | 24-40 samples |
| Daily | 25-60 samples |
| Continuous (auto) | Audit logs query |

Vanta facilita por evidenciar **continuous** em maioria.

---

## 11. Riscos comuns que auditor verifica

- **Shared credentials** (root, admin accounts)
- **MFA bypass exceptions**
- **Stale access** (ex-employees ativos)
- **Public S3 buckets**
- **Patching SLA missed**
- **Vendor management gaps**
- **Backup not tested**
- **DR plan not exercised**
- **Production change sem approval**
- **Incident sem post-mortem**
- **Vulnerability não tratada past SLA**

---

## 12. Trust Service overlap com outros frameworks

```text
SOC 2 Security        ≈ ISO 27001 (controles técnicos overlap ~80%)
SOC 2 Confidentiality ≈ ISO 27001 + LGPD
SOC 2 Privacy         ≈ LGPD + GDPR
SOC 2 Availability    ≈ ISO 22301 (continuidade)
SOC 2 Processing Int. ≈ COSO + ITGC
```

Cliente que pede SOC 2 + ISO 27001 = 80% overlap. Implementar uma vez, certificar duas.

---

## 13. Erros comuns

- ❌ Pular Type 1, ir direto Type 2 (sem track record)
- ❌ Sem ferramenta automation (esforço explode)
- ❌ Auditor caro sem necessidade (PME → specialized firm)
- ❌ Observação muito curta (3 meses é mínimo, 6 melhor)
- ❌ Não treinar equipe
- ❌ Evidência inconsistente (mês com gap)
- ❌ Não rodar drill de incident response
- ❌ Vendor management ignorado (auditor SEMPRE pergunta)
- ❌ Background check ausente
- ❌ Off-boarding > 24h

---

## 14. Custos típicos (SaaS 10-50 funcs)

| Item | Custo USD |
|---|---|
| Vanta/Drata | $10-25k/ano |
| Auditor Type 1 | $15-25k |
| Auditor Type 2 | $30-50k/ano |
| Pen test anual | $15-30k |
| Vulnerability scanner | $5-15k/ano |
| SIEM/monitoring | $10-40k/ano |
| Security training | $3-10k/ano |
| Internal resource (0.5 FTE) | $40-80k/ano |
| **Total ano 1** | **$130-280k** |
| **Ano 2+** | **$110-240k/ano** |

Em BRL: ~R$700k-1.5M ano 1 (high), R$600k-1.2M continuing.

---

## 15. Relatório SOC 2 — como é

```text
Seção 1: Independent Service Auditor's Report
  Opinion (unqualified, qualified, adverse, disclaimer)
Seção 2: Management's Assertion
  Statement of compliance
Seção 3: System Description
  How the system works
Seção 4: Trust Services Criteria + Controls
  Para cada criterio: control activities + test results
Seção 5: Other information (optional)
```

Distribuído sob NDA para clientes.

---

## 16. Integração

- `/iso-27001-readiness` — overlap forte
- `/lgpd-compliance-check` — Privacy criterion
- `/aws-security-baseline` + `/azure-security-baseline` + `/gcp-security-baseline`
- `/incident-diagnosis` — IR control
- `/backup-and-recovery-strategy` — Availability
- `/auth-and-session-hardening` — Access controls
- `/secrets-and-env-guard` — sensitive data
- `/dependency-firewall` — vendor management

---

## 17. Checklist

```text
# Foundation
[ ] Trust Service Categories selecionados
[ ] Auditor CPA firm selecionada
[ ] Vanta/Drata/Secureframe deployed
[ ] Integrations connected

# Controls
[ ] Políticas escritas e aprovadas
[ ] Background check process
[ ] Treinamento anual de SI
[ ] MFA universal
[ ] Access review trimestral
[ ] Off-boarding < 24h
[ ] Vulnerability scanning continuo
[ ] Patching SLA documentado
[ ] Pen test anual
[ ] Incident response plan + drill
[ ] Change management documentado
[ ] Backup + test de restore
[ ] DR plan
[ ] Vendor management process

# Period
[ ] Type 1: data definida
[ ] Type 2: período de observação > 3 meses
[ ] Evidence collection contínuo
[ ] Não conformidades fechadas

# Audit
[ ] Auditor agendado
[ ] Pre-audit (Vanta) clean
[ ] Type 1 report received
[ ] Type 2 report received
[ ] NDA template para clients
```

---

## 18. Frase-guia final

> **SOC 2 Type 2 é o que cliente enterprise pede. Sem Vanta/Drata, esforço é proibitivo para PME. Período de observação é o gargalo — começa 6 meses antes de precisar. Auditor specialized firm vence Big 4 em ROI para SaaS pequeno.**
