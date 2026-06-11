---
name: iso-27001-readiness
description: Preparacao para certificacao ISO 27001:2022 - SGSI (Sistema de Gestao de Seguranca da Informacao), 93 controles do Anexo A (4 categorias - Organizational, People, Physical, Technological), gap analysis, declaracao de aplicabilidade (SoA), analise de risco, polticias obrigatorias, evidencias para auditoria, integracao com NIST CSF e outros frameworks. Use ao preparar PME para certificacao, em consultoria de complilance, ou para validar maturidade de seguranca da DV Digital antes de servir cliente que exige. Aplicavel ao Brasil (clientes B2B exigentes - bancos, saude, governo).
---

# iso-27001-readiness

> **Frase-guia:** ISO 27001 não é checklist de tecnologia — é processo de gestão. Documentação é metade do trabalho, evidência operacional é a outra metade.

## 0. Regra suprema

ISO 27001 certifica o **SGSI** (Sistema de Gestão de SI), não a empresa. Sem comprometimento de gestão, política, e evidência operacional contínua, não há certificado. Em conflito entre velocidade e maturidade, **maturidade vence** — auditor pega tudo.

---

## 1. Objetivo

Preparar PME para certificação **ISO/IEC 27001:2022**:

- Entender estrutura (cláusulas 4-10 + Anexo A com 93 controles)
- Conduzir **gap analysis** vs estado atual
- Construir **SGSI** (políticas, processos, papéis)
- Análise de risco + tratamento
- **Declaração de Aplicabilidade (SoA)**
- Evidências operacionais para auditoria
- Auditoria interna + management review
- Auditoria de certificação (estágio 1 + 2)

---

## 2. Quando usar

- Cliente B2B (banco, saúde, governo) exige fornecedor certificado
- DV Digital quer maturidade demonstrável
- Preparação para LGPD aprofundada
- Pré-fundraising / due diligence
- Compliance multi-framework (ISO + SOC 2 + PCI overlap)

---

## 3. Estrutura ISO 27001:2022

### 3.1 Cláusulas principais (auditáveis)

| Cláusula | Tema |
|---|---|
| 4 | Contexto da organização (interno + externo, stakeholders, escopo) |
| 5 | Liderança (compromisso, política, papéis) |
| 6 | Planejamento (riscos + oportunidades, objetivos) |
| 7 | Suporte (recursos, competência, conscientização, documentação) |
| 8 | Operação (gestão de risco operacional) |
| 9 | Avaliação (monitoramento, auditoria interna, mgmt review) |
| 10 | Melhoria (não conformidades, ações corretivas) |

### 3.2 Anexo A (93 controles em 4 grupos)

| Grupo | # Controles | Tema |
|---|---|---|
| A.5 Organizational | 37 | Políticas, papéis, terceiros, gestão de incidentes |
| A.6 People | 8 | Screening, treinamento, NDA, term acceptance |
| A.7 Physical | 14 | Acesso físico, equipamento, ambiente |
| A.8 Technological | 34 | Acesso, criptografia, ops, comm security, dev seguro |

**Nem todos aplicam** — Declaração de Aplicabilidade (SoA) justifica inclusão/exclusão.

---

## 4. Roadmap de implementação (12 meses típico)

### Mês 1-2: Iniciação

- Aprovar projeto (sponsorship executivo)
- Definir escopo (DV Digital toda? produto específico?)
- Selecionar consultoria (opcional mas recomendado)
- Treinamento Lead Implementer (PECB, BSI)

### Mês 3-4: Diagnóstico

- **Gap analysis** vs 27001:2022
- Inventário de ativos (informação, hardware, software, terceiros)
- Mapeamento de processos

### Mês 5-6: Análise de risco

- Metodologia (ISO 27005, NIST 800-30, FAIR, OCTAVE)
- Identificar ativos críticos
- Identificar ameaças + vulnerabilidades
- Calcular risco (impact × likelihood)
- Plano de tratamento (mitigar, transferir, evitar, aceitar)

### Mês 7-9: Implementação

- Escrever **políticas** (~15-20 documentos)
- Configurar controles técnicos
- Treinamento de equipe
- Implementar monitoramento

### Mês 10: Auditoria interna

- Auditor interno qualificado
- Não conformidades identificadas + corrigidas

### Mês 11: Management Review

- Comitê de segurança revisa indicadores
- Aprovação de SoA + risco residual

### Mês 12: Certificação

- **Estágio 1** (documental): auditor verifica documentação
- **Estágio 2** (operacional): auditor verifica evidências
- Certificado emitido (válido 3 anos, surveillance audits anuais)

---

## 5. Políticas obrigatórias

Estas devem existir, ser comunicadas e revisadas:

| Política | Cláusula |
|---|---|
| Política de Segurança da Informação | 5.1 |
| Política de uso aceitável | A.5.10 |
| Política de controle de acesso | A.5.15 |
| Política de criptografia | A.8.24 |
| Política de classificação de informação | A.5.12 |
| Política de gestão de riscos | 6.1 |
| Política de continuidade do negócio | A.5.29 |
| Política de gestão de incidentes | A.5.24 |
| Política de fornecedores | A.5.19 |
| Política de RH (screening, off-boarding) | A.6.1, A.6.5 |
| Política de mídia removível | A.7.10 |
| Política de mesa limpa e tela limpa | A.7.7 |
| Política de desenvolvimento seguro | A.8.25 |
| Política de teletrabalho | A.6.7 |
| Política de privacidade (LGPD overlap) | A.5.34 |

---

## 6. Documentos obrigatórios

| Documento | Propósito |
|---|---|
| Escopo do SGSI | 4.3 |
| Declaração da Política | 5.2 |
| **Análise de risco** | 6.1 |
| **Plano de tratamento de risco** | 6.1 |
| Objetivos de SI | 6.2 |
| Competências | 7.2 |
| **Declaração de Aplicabilidade (SoA)** | 6.1.3 |
| Plano de comunicação | 7.4 |
| Plano de auditoria interna | 9.2 |
| Atas de Management Review | 9.3 |
| Plano de não-conformidades | 10.1 |

---

## 7. Declaração de Aplicabilidade (SoA)

Tabela com **TODOS os 93 controles**:

| Controle | Aplicável? | Justificativa | Implementado? | Evidência |
|---|---|---|---|---|
| A.5.1 Políticas de SI | Sim | Compliance obrigatório | Sim | Política aprovada 2026-Q1 |
| A.5.7 Threat intelligence | Sim | Cliente em setor target | Em progresso | Feed MISP 2026-Q3 |
| A.7.5 Securing offices | Não | Empresa 100% remoto | N/A | — |
| A.8.18 Privileged utility programs | Sim | Admin Windows + Linux | Sim | LAPS, sudo audit |
| ... |  |  |  |  |

---

## 8. Análise de risco — método prático

### 8.1 Inventário de ativos

```text
| ID | Ativo | Tipo | CIA | Owner | Valor |
|---|---|---|---|---|---|
| A001 | Banco de dados de clientes | Info | C:A I:A A:A | CTO | Alto |
| A002 | Servidor web prod | HW | C:M I:A A:A | DevOps | Alto |
| A003 | Código-fonte | Info | C:A I:M A:M | Dev Lead | Alto |
| A004 | E-mail corporativo | SaaS | C:A I:M A:M | TI | Médio |
```

CIA: Confidentiality, Integrity, Availability — A=Alto, M=Médio, B=Baixo.

### 8.2 Matriz de risco

```text
Likelihood × Impact = Risk Score

Impacto:
- 5: catastrófico (perda de negócio)
- 4: alto (perda significativa)
- 3: médio (interrupção)
- 2: baixo (incoveniente)
- 1: insignificante

Likelihood:
- 5: muito provável
- 4: provável
- 3: possível
- 2: pouco provável
- 1: raro

Risk = I × L
- 20-25: crítico, tratar imediato
- 12-19: alto, plano em 3 meses
- 6-11: médio, plano em 6 meses
- 1-5: baixo, aceitar ou monitorar
```

### 8.3 Tratamento

```text
Opções:
- Mitigar (reduzir L ou I via controle)
- Transferir (seguro, terceirizar)
- Evitar (descontinuar ativo/processo)
- Aceitar (risco residual aprovado)
```

---

## 9. Indicadores (KPIs) para Management Review

- Incidentes registrados (mês/trim)
- Tempo médio de detecção (MTTD)
- Tempo médio de resposta (MTTR)
- % de patches aplicados no SLA
- Não-conformidades abertas
- Treinamentos completados (%)
- Auditorias internas executadas
- Riscos aceitos vs mitigados

---

## 10. Estrutura organizacional típica

| Papel | Responsabilidade |
|---|---|
| CEO/Sponsor | Aprovação política, recursos |
| CISO ou Gerente de SI | Liderança do SGSI |
| ISMS Manager (pode = CISO) | Operação do SGSI |
| Risk Owner | Decisão de tratamento por ativo |
| Control Owner | Implementação de controle |
| Auditor interno | Verificação independente |
| Todos | Compliance individual |

---

## 11. Auditoria

### 11.1 Auditoria interna

- A cada ciclo (anual mínimo)
- Auditor independente do auditado
- Plano de auditoria escrito
- Findings → não-conformidades → plano de ação

### 11.2 Auditoria de certificação

- Acreditadora (BSI, DNV, Bureau Veritas, ABNT, NQA, SGS)
- **Estágio 1**: revisão documental (1 dia)
- **Estágio 2**: operacional (3-10 dias dependendo escopo)
- Não conformidades: maior (impede certificação), menor (plano de ação)
- Decisão: certificar ou não
- Custo: $5k-30k Brasil, dependendo escopo

### 11.3 Surveillance audits

- Anual, 1-2 dias
- Foco em mudanças e amostragem

### 11.4 Recertification

- A cada 3 anos
- Mais profunda

---

## 12. Custos típicos PME (10-100 funcionários)

| Item | Custo BRL |
|---|---|
| Consultoria implementação | R$ 30-100k |
| Treinamento equipe | R$ 5-15k |
| Ferramentas (SIEM, etc.) | R$ 20-200k/ano |
| Auditoria interna | R$ 10-30k/ano |
| Auditoria certificação | R$ 20-60k inicial + 10-30k/ano |
| Recursos internos (1 FTE) | R$ 80-200k/ano |
| **Total ano 1** | **R$ 165-605k** |
| **Ano 2-3** | **R$ 120-460k/ano** |

---

## 13. Sobreposição com outros frameworks

| Item ISO 27001 | NIST CSF | SOC 2 | LGPD |
|---|---|---|---|
| Política SI | Govern | CC1.4 | ~Política priv |
| Análise de risco | Identify | CC3.1 | RIPD (DPIA) |
| Controle de acesso | Protect (AC) | CC6.1 | Acesso restrito |
| Backup | Protect (PR.IP) | CC7.5 | — |
| Detecção | Detect | CC7.1 | — |
| Resposta | Respond | CC7.4 | Notificação ANPD |
| Recovery | Recover | CC7.5 | — |

Comprime esforço: 27001 + SOC 2 Type 2 alinhados ≈ 80% overlap.

---

## 14. Erros comuns

- ❌ Tratar como "tem que ter documento" sem operacionalizar
- ❌ Escopo muito amplo (demora 18+ meses)
- ❌ SoA com "Não aplicável" sem justificar
- ❌ Análise de risco superficial (lista de ameaças genéricas)
- ❌ Pouca conscientização (auditor pergunta para usuário random)
- ❌ Política sem versionamento ou data de revisão
- ❌ Não-conformidades sem prazo de tratamento
- ❌ Management Review sem indicadores
- ❌ Treinamento "uma vez no onboarding"
- ❌ Sem evidência (printscreens, logs, atas)

---

## 15. Tools úteis

- **Vanta**, **Drata**, **Secureframe** — compliance automation (caro mas reduz horas)
- **Eramba**, **OneTrust GRC** (GRC tools)
- **Confluence/Notion/SharePoint** — documentação
- **Jira/Asana** — não-conformidades e ações
- **Power BI/Tableau** — dashboards KPI
- **Knowbe4** — security awareness training
- **Hibob/Workday** — RH off-boarding

---

## 16. Integração com outras skills

- `/lgpd-compliance-check` — LGPD overlap (RIPD)
- `/soc-2-readiness` — overlap forte
- `/security-baseline-universal` — controles técnicos
- `/aws-security-baseline` + `/azure-security-baseline` + `/gcp-security-baseline` — controles cloud
- `/incident-diagnosis` — A.5.24
- `/backup-and-recovery-strategy` — A.8.13
- `/auth-and-session-hardening` — A.5.15-18
- `/secrets-and-env-guard` — A.8.24
- `/dependency-firewall` — A.8.30 (outsourced dev)

---

## 17. Checklist condensado

```text
# Gestão
[ ] Sponsor executivo aprovou
[ ] Escopo definido
[ ] Comitê SGSI formado
[ ] Política assinada
[ ] Roles definidos

# Risco
[ ] Inventário de ativos
[ ] Metodologia de risco definida
[ ] Análise executada
[ ] Plano de tratamento
[ ] SoA preenchido

# Operacional
[ ] Todas as políticas obrigatórias aprovadas
[ ] Treinamento de conscientização ano
[ ] Controles técnicos implementados
[ ] Evidências coletadas (logs, atas)
[ ] Monitoramento ativo

# Auditoria
[ ] Auditor interno qualificado
[ ] Plano de auditoria
[ ] Auditoria interna executada
[ ] Management review com indicadores
[ ] Não-conformidades fechadas

# Certificação
[ ] Acreditadora selecionada
[ ] Estágio 1 passado
[ ] Estágio 2 passado
[ ] Certificado emitido
[ ] Plano de surveillance
```

---

## 18. Frase-guia final

> **ISO 27001 não é tecnologia, é gestão. 80% é documentação + processo, 20% é controle técnico. Comece com escopo pequeno, gap analysis honesto, e crescimento iterativo. Vanta/Drata aceleram, mas evidência operacional vem do trabalho real.**
