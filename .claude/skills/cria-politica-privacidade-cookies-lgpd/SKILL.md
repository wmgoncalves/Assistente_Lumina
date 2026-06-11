---
name: cria-politica-privacidade-cookies-lgpd
description: Use esta skill quando precisar redigir ou adaptar política de privacidade, política de cookies, termos de uso e textos de consentimento em linguagem clara, alinhados à LGPD e às decisões de produto da DV Digital (opt-out com rejeição real, tom neutro).
---

# cria-politica-privacidade-cookies-lgpd

## O que esta skill faz

Redige os **textos legais do site/sistema**: política de privacidade, política de cookies, termos de uso e microcopy de consentimento (banner, formulários). Cobre o lado da **redação** — o lado técnico/operacional (base legal, minimização, retenção, direitos do titular) é da `/lgpd-compliance-check`, que deve rodar antes para levantar o tratamento real de dados.

## Quando usar

- Site/LP novo indo ao ar com formulário, analytics ou pixel.
- Sistema/SaaS com cadastro de usuários (AtendaPro e derivados).
- Atualização de política após mudança de tratamento (novo pixel, novo CRM, IA).
- Cliente sem política nenhuma (regularização).
- Banner de cookies novo ou ajuste do existente.

## Entradas necessárias

1. **Inventário real de tratamento** (da `/lgpd-compliance-check`): quais dados são coletados, onde, para quê, com quem são compartilhados (gateway, analytics, Meta/Google, CRM, hospedagem), por quanto tempo.
2. Dados institucionais do cliente: razão social, CNPJ, e-mail de contato — `[PLACEHOLDER]` se faltarem, **nunca inventar**.
3. Canais de tracking ativos (GA4, Meta Pixel, Google Ads) e ferramentas de terceiros.
4. Existe transferência internacional? (analytics/cloud dos EUA conta).
5. Já existe template aplicável em `20-Templates/legal/` no vault? **Busca-primeiro** — adaptar, não recriar.

## Processo obrigatório

1. **Verificar templates do vault** (`20-Templates/legal/`) — eles já seguem as decisões de produto; partir deles.
2. **Decisões de produto fixas da DV Digital** (não negociáveis sem aprovação do usuário):
   - Cookies: modelo **opt-out** com banner que tem **botão de rejeitar real e funcional**;
   - Tom **neutro** ("se aceitar… se rejeitar…") **sem expor o modelo/provedor de IA** quando desnecessário;
   - Linguagem clara PT-BR, sem juridiquês excessivo, sem promessas absolutas ("100% seguro" não existe).
3. **Estrutura da política de privacidade**: quem somos (controlador) → dados coletados e finalidades → bases legais → compartilhamento (nomear categorias de terceiros) → cookies (resumo + link) → retenção → direitos do titular e canal de exercício → segurança (descrição honesta) → transferência internacional se houver → atualizações → contato/encarregado.
4. **Política de cookies**: categorias (essenciais / estatística / marketing), o que cada uma faz, como rejeitar/alterar, tabela de cookies se disponível.
5. **Microcopy de consentimento**: banner (aceitar / rejeitar com mesmo peso visual — sem dark pattern), checkbox de formulário (nunca pré-marcada para finalidade não essencial), texto de finalidade junto ao campo.
6. **Coerência texto ↔ realidade**: a política só pode declarar o que o site realmente faz — política dizendo "não compartilhamos" com Meta Pixel ativo é pior que não ter política.
7. Entregar com data de vigência e nota de pendências `[A CONFIRMAR]`.

## Checklist de qualidade

- [ ] Tudo que a política declara corresponde ao tratamento real levantado.
- [ ] Banner tem rejeição real com mesmo destaque do aceite.
- [ ] Nenhuma checkbox pré-marcada para marketing.
- [ ] Direitos do titular listados com canal funcional de contato.
- [ ] Terceiros/categorias de compartilhamento nomeados.
- [ ] Tom neutro; provedor de IA não exposto sem necessidade.
- [ ] Sem juridiquês impenetrável; leitura ok para leigo.
- [ ] Placeholders claramente marcados; nenhum dado institucional inventado.
- [ ] Data de vigência presente.

## Erros comuns que esta skill deve evitar

- Copiar política genérica da internet que descreve tratamentos que o site não faz (ou omite os que faz).
- Banner sem botão de rejeitar, ou rejeitar escondido em "configurações" (dark pattern — recusa obrigatória).
- Prometer segurança absoluta ou anonimato impossível.
- Esquecer o pixel/analytics na lista de compartilhamento.
- Texto assinado com dados de outro cliente (reuso descuidado de template).
- Tratar a política como peça de marketing — é documento de transparência.

## Saída esperada

```text
1. politica-de-privacidade.md (pronta para publicar, com vigência)
2. politica-de-cookies.md (categorias + gestão de consentimento)
3. MICROCOPY: banner de cookies + checkboxes + textos de formulário
4. PENDÊNCIAS [A CONFIRMAR] para o cliente validar
5. Nota: ajustes técnicos necessários (ex.: pixel só dispara conforme escolha)
   → encaminhar para /lgpd-compliance-check e /frontend-hardening
```

## Exemplo de uso

> "Política de privacidade e cookies para a LP da Blue Seguros com GA4 e Meta Pixel."

Saída: política nomeando estatística (GA4) e marketing (Meta) como categorias com transferência internacional, cookies em 3 categorias com gestão de escolha, banner com Aceitar/Rejeitar no mesmo peso, checkbox de contato não pré-marcada, placeholders de CNPJ/e-mail e pendências para o cliente.

---

## Conexão com o ecossistema

**Antes**: `/lgpd-compliance-check` (inventário de tratamento — lado técnico). Templates base: `20-Templates/legal/` no vault. Implementação do banner: `/frontend-hardening` + `/webapp-hardening`. Validação final: `/product-readiness-checklist`. Agente: `privacidade-lgpd`.

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
