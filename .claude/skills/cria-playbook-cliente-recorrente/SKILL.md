---
name: cria-playbook-cliente-recorrente
description: Use esta skill quando precisar criar ou atualizar o playbook de um cliente recorrente da DV Digital — identidade, tom de voz, serviços contratados, histórico, aprovações, preferências e erros a evitar. Salva em 10-Projetos/<cliente>/ no vault Obsidian.
---

# cria-playbook-cliente-recorrente

## O que esta skill faz

Cria/atualiza o **guia fixo de operação de um cliente**: tudo o que qualquer pessoa (ou agente) precisa saber para produzir para aquele cliente sem refazer perguntas — identidade visual, tom, serviços ativos, o que já foi aprovado/reprovado, contatos, acessos (referenciados, nunca em texto puro) e armadilhas conhecidas. É a memória operacional por cliente.

## Quando usar

- Cliente novo entrando em rotina recorrente (social media, tráfego, manutenção).
- Após primeira entrega aprovada (consolidar o que foi validado).
- Quando um padrão novo é aprovado ou um erro se repete ("cliente não gosta de X").
- Antes de delegar produção do cliente a qualquer agente/skill.

## Entradas necessárias

1. Nome do cliente e pasta correspondente em `10-Projetos/` (verificar se já existe — **busca-primeiro, nunca duplicar**).
2. Identidade: logo (onde está o arquivo), cores oficiais (hex), fontes, estilo aprovado.
3. Serviços contratados e cadência (ex.: 8 cards/mês, gestão de tráfego, manutenção do site).
4. Tom de voz e exemplos de textos aprovados.
5. Histórico relevante: o que já foi feito, o que funcionou, o que foi rejeitado e por quê.
6. Contatos e fluxo de aprovação (quem aprova, por onde, prazo típico).

## Processo obrigatório

1. Verificar se `10-Projetos/<cliente>/` existe no vault; se sim, **atualizar** o playbook existente em vez de criar outro.
2. Criar/atualizar `10-Projetos/<cliente>/playbook.md` com frontmatter do vault (tags, data, status) e as seções do modelo abaixo.
3. Dados que não existirem → placeholder `[A CONFIRMAR]` — nunca inventar CNPJ, telefone, números.
4. **Credenciais nunca entram no playbook** — apenas referência de onde estão guardadas (gerenciador de senhas). Regra de `/secrets-and-env-guard`.
5. Interligar com wikilinks: README do projeto, cards produzidos, campanhas, decisões.
6. Registrar no playbook a data de cada aprendizado novo (formato ISO).

### Modelo de seções

```text
1. RESUMO (quem é, segmento, desde quando é cliente)
2. IDENTIDADE VISUAL (logo, cores hex, fontes, estilo aprovado, proibições)
3. TOM DE VOZ (com 2–3 exemplos reais aprovados)
4. SERVIÇOS ATIVOS (o quê, cadência, escopo contratado, limites)
5. FLUXO DE APROVAÇÃO (quem, canal, prazo)
6. HISTÓRICO E DECISÕES (data + decisão + motivo)
7. ERROS A EVITAR (rejeições passadas e armadilhas)
8. CAMPANHAS E RESULTADOS (resumo com links)
9. ACESSOS (onde estão guardados — sem credencial em texto)
10. CONTATOS
```

## Checklist de qualidade

- [ ] Playbook único por cliente (sem duplicata no vault).
- [ ] Cores em hex exato, fontes nomeadas, local do logo indicado.
- [ ] Pelo menos 1 exemplo real de tom aprovado.
- [ ] Seção "erros a evitar" preenchida (é a mais valiosa).
- [ ] Nenhuma senha/token/chave no arquivo.
- [ ] Nenhum dado inventado; pendências com `[A CONFIRMAR]`.
- [ ] Wikilinks para projeto, MOC e materiais relacionados.
- [ ] Datas em formato ISO (YYYY-MM-DD).

## Erros comuns que esta skill deve evitar

- Criar playbook paralelo quando já existe um (duplicação).
- Guardar credencial em texto puro "para facilitar".
- Playbook genérico que serve para qualquer cliente (sem as particularidades reais).
- Não registrar rejeições — o erro se repete na próxima entrega.
- Deixar de atualizar após mudanças (playbook desatualizado é pior que nenhum).
- Inventar dados institucionais do cliente.

## Saída esperada

Arquivo `10-Projetos/<cliente>/playbook.md` no vault, com frontmatter, 10 seções, wikilinks e pendências marcadas — pronto para ser consumido por `/cria-card-institucional-premium`, `/cria-copy-vendas-seo`, `/planeja-campanha-google-meta` e pelos agentes especialistas de cliente.

## Exemplo de uso

> "Monta o playbook da Scapini com o que já temos."

Saída: `10-Projetos/scapini-transportes/playbook.md` com identidade (Exo 2, vermelho institucional), tom institucional-humano, serviços ativos, fluxo de aprovação, histórico de cards aprovados com wikilinks e seção de erros a evitar preenchida com rejeições reais.

---

## Conexão com o ecossistema

Consumida por todas as skills de produção (cards, copy, campanha, funil) e pelos agentes `especialista-clientes-logistica`, `especialista-produtos-digitais-saude`, `especialista-saas-crm-dashboard`. Registro contínuo: agente `curador-memoria`. Regras do vault: CLAUDE.md do Cérebro (kebab-case, frontmatter, busca-primeiro).

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
