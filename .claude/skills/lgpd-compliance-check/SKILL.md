---
name: lgpd-compliance-check
description: Conformidade LGPD operacional. Identifica PII, define base legal, aplica minimização, configura retenção e direitos do titular. Use ao tratar dado pessoal de cidadão brasileiro em formulário, login, e-mail, analytics, IA ou banco.
---

# lgpd-compliance-check

Use **sempre que** o projeto coletar, processar, armazenar, transmitir, compartilhar ou descartar dado pessoal de pessoa natural identificada/identificável no Brasil. Lei 13.709/2018.

## O que conta como dado pessoal (PII)

**Dado pessoal:**
nome, e-mail, telefone, CPF, RG, endereço, IP, cookie, geolocalização, biometria, foto, voz, perfil em rede social, ID de dispositivo, comportamento de navegação atribuível.

**Dado pessoal sensível** (proteção reforçada — art. 5º, II):
origem racial/étnica, convicção religiosa, opinião política, filiação sindical, dado sobre saúde, vida sexual, dado genético, dado biométrico, dado de criança/adolescente.

**Quando coletar dado sensível, base legal e finalidade precisam ser muito mais explícitas** e há restrições adicionais.

## Bases legais (art. 7º e 11)

Para qualquer tratamento, identificar a base:

| Base | Quando aplicar |
|---|---|
| Consentimento | Marketing, cookies não essenciais, IA generativa sobre dado do usuário |
| Cumprimento de obrigação legal | Nota fiscal, retenção fiscal, registro de acesso (Marco Civil 1 ano) |
| Execução de contrato | Login, pagamento, entrega — necessário para servir o cliente |
| Legítimo interesse | Antifraude, segurança do sistema, ajuste fino do produto — **com balanceamento** |
| Proteção da vida | Emergência (raro em sites comuns) |
| Tutela da saúde | Aplicações de saúde (sensível) |
| Política pública | Geralmente não se aplica a sites privados |
| Estudos por órgão de pesquisa | Anonimização obrigatória |
| Proteção do crédito | Análise de crédito, antifraude financeiro |

**Sensível (art. 11):** consentimento específico, ou hipóteses estritas.

## Princípios obrigatórios (art. 6º)

- **Finalidade:** propósitos legítimos, específicos, explícitos e informados ao titular
- **Adequação:** compatibilidade com finalidade informada
- **Necessidade:** mínimo necessário (data minimization)
- **Livre acesso:** consulta facilitada do titular aos seus dados
- **Qualidade dos dados:** exatidão, clareza, relevância, atualização
- **Transparência:** informação clara sobre tratamento
- **Segurança:** proteção contra acesso não autorizado, perda, alteração
- **Prevenção:** medidas para evitar dano
- **Não discriminação:** vedação a tratamento ilícito/abusivo
- **Responsabilização e prestação de contas:** demonstração de adoção de medidas eficazes

## Direitos do titular (art. 18) — devem estar implementáveis

1. Confirmação de existência de tratamento
2. Acesso aos dados
3. Correção de dados incompletos/inexatos/desatualizados
4. Anonimização, bloqueio ou eliminação
5. Portabilidade
6. Eliminação dos dados tratados com consentimento (com exceções)
7. Informação sobre compartilhamento
8. Informação sobre possibilidade de não consentir e consequências
9. Revogação do consentimento

**Canal obrigatório** para o titular exercer esses direitos (e-mail, formulário ou rota dedicada). Resposta em **até 15 dias** (art. 19).

## Cookies (modelo padrão do vault: opt-out)

Padrão do [SEU_NOME]/[SUA_EMPRESA] (já alinhado):
- Pixels disparam antes do aceite
- Banner explícito com botão de **rejeitar real** (não dark pattern)
- Se rejeitar, pixels param
- Política em tom neutro "se aceitar... se rejeitar..."
- Nunca expor modelo de IA na política quando não necessário

**Cookies essenciais** (sessão, CSRF, carrinho): não exigem consentimento — só informar.
**Cookies de medição/marketing:** exigem opt-out funcional.

## Cuidados específicos por área

### Formulários
- Coletar só o necessário
- Campo opcional ≠ obrigatório
- Justificar campos sensíveis (CPF: por quê?)
- Checkbox de consentimento **não pré-marcado** quando aplicável
- Link para política de privacidade visível

### E-mail / marketing
- Base legal (geralmente consentimento ou legítimo interesse com opt-out)
- Opt-out funcional em todo e-mail (1 clique)
- Histórico de consentimento (data, IP, versão do termo aceito)

### Login / autenticação
- Senha armazenada com bcrypt/argon2id
- Não logar senha em texto claro nem mascarada de forma reversível
- Recuperação de senha via token expirável
- Logs de acesso (Marco Civil: 1 ano para conexão)

### Analytics
- Google Analytics: anonimizar IP (`anonymizeIp: true` no GA4 é default agora)
- Avaliar provedor (GA está nos EUA — transferência internacional)
- Considerar alternativas first-party (Plausible self-hosted, Matomo)

### Pagamentos
- Não armazenar PAN (número de cartão completo) — usar tokenização do gateway
- Tokenização do Stripe/PagSeguro/Mercado Pago é PCI compliant
- Logs sem CVV nunca

### IA / LLM
- Base legal específica para envio a provedor de IA
- DPA com provedor (OpenAI, Anthropic, etc.)
- Opt-out de treinamento ativado
- Filtro pré-IA para PII desnecessária
- Disclosure de uso de IA na política e na UI

### Banco de dados
- PII em colunas identificáveis (não esconder em coluna genérica "data")
- Criptografia em repouso para dados sensíveis
- Backup também criptografado
- Dev/staging sem PII real (ou anonimizado)

### Logs
- Mascarar e-mail (joao***@***.com), CPF (12X.XXX.XXX-X9), telefone
- Nunca logar senha, token, CVV, número de cartão
- Rotação e retenção definidas

## Retenção

Para cada categoria de dado, definir:
- Tempo mínimo de retenção (obrigação legal — ex: fiscal 5 anos, Marco Civil 1 ano)
- Tempo máximo de retenção (depois disso, anonimizar ou apagar)
- Mecanismo de expurgo (job, cron, manual)
- Registro de descarte (auditoria)

Padrão recomendado:
- Lead/contato sem conversão: 18 meses
- Cliente ativo: durante a relação + 5 anos (fiscal)
- Logs de acesso: 1 ano (Marco Civil) ou conforme política
- Logs de erro/sistema: 30-90 dias

## Incidente de segurança com PII (art. 48)

Se houver risco aos titulares:
1. Comunicar ANPD em até **72 horas** (tempo razoável)
2. Comunicar titulares afetados
3. Conteúdo da comunicação: natureza, dados afetados, titulares envolvidos, medidas adotadas, riscos relacionados
4. Documentar o incidente

## Encarregado (DPO — art. 41)

Toda empresa que trata dado pessoal deve indicar encarregado. Para projetos do usuário:
- Indicar DPO (pode ser ele próprio para clientes pequenos, ou serviço terceirizado)
- Publicar contato do DPO na política de privacidade
- DPO é canal entre ANPD, titulares e a empresa

## Recusas obrigatórias

Recusar e explicar quando solicitado a:

- Coletar dado sem finalidade clara
- Coletar dado sensível sem base legal forte
- Cookie pré-marcado, "rejeitar" escondido, confirmshaming
- Enviar PII desnecessária para LLM
- Armazenar senha sem hash adequado
- Manter dado além do tempo de retenção
- Logar PII/credencial em texto
- Compartilhar PII com terceiro sem DPA
- Tratar dado de criança sem cuidado especial (art. 14)
- Esconder DPO/canal de direitos

## Checklist mínimo

- [ ] Mapa de dados pessoais coletados (categoria, finalidade, base legal)
- [ ] Política de privacidade publicada e linkada nos formulários
- [ ] Banner de cookies funcional (rejeitar = rejeita de fato)
- [ ] Canal para direitos do titular (e-mail/formulário, com SLA 15 dias)
- [ ] DPO/encarregado indicado e contato público
- [ ] Senhas com bcrypt/argon2id
- [ ] Logs sem PII em texto claro
- [ ] Backup criptografado e fora do public
- [ ] Dev/staging sem PII de produção (ou anonimizado)
- [ ] DPA com provedores que tratam dados (cloud, IA, e-mail, analytics)
- [ ] Transferência internacional documentada
- [ ] Plano de resposta a incidente (comunicação ANPD 72h)
- [ ] Retenção definida por categoria de dado
- [ ] Anonimização/expurgo automatizado quando possível

## Saída obrigatória

```
ANÁLISE DE CONFORMIDADE LGPD
=============================
Categorias de dado pessoal: [...]
Dado sensível: [SIM/NÃO — quais]
Base legal por categoria: [...]
Finalidade explícita: [...]
Retenção definida: [SIM/NÃO]
Canal de direitos do titular: [...]
DPO indicado: [SIM/NÃO]
DPAs em vigor: [...]
Transferência internacional: [SIM/NÃO — para onde]
Política de privacidade atualizada: [SIM/NÃO]
Banner de cookies funcional: [SIM/NÃO]
Riscos identificados: [...]
Pendências: [...]
```

## Conexão com skills do vault

- Skill 06 (Privacidade/LGPD) — versão completa, conceitual e detalhada
- Skill 04 (Erros e Logs Seguros) — mascaramento em logs
- Skill 07 (Data Poisoning) — anonimização e procedência
- Skill 08 (Ética/IA) — base legal para IA, DPA, opt-out de treino
- Skill 09 (HITL) — decisões sobre dado sensível

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
