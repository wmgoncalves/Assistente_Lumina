---
name: aprende-stack-nova-com-projeto-real
description: Use esta skill quando o usuário quiser aprender uma tecnologia nova (Laravel, Next.js, TypeScript, Docker, Supabase, PostgreSQL, n8n, MCP, Playwright, CI/CD…) com foco prático — comparação com a stack atual, armadilhas, mini-projeto aplicado aos trabalhos reais da DV e como virar serviço vendável.
---

# aprende-stack-nova-com-projeto-real

## O que esta skill faz

Transforma "quero aprender X" em **trilha prática ancorada nos projetos reais da DV Digital** — sem curso genérico. Explica o que a tecnologia resolve, compara com o padrão atual (PHP/MySQL/HostGator), define um mini-projeto real para aprender fazendo, lista as armadilhas de iniciante e fecha com o caminho para virar serviço vendável.

## Quando usar

- Antes de adotar tecnologia nova em projeto de cliente (aprender ANTES de prometer).
- `/escolhe-stack-ideal-projeto` recomendou stack que o usuário ainda não domina.
- Estudo dirigido (Laravel, Next, Docker, Supabase, testes, n8n, MCP…).
- Avaliar se vale o investimento de tempo em uma tecnologia da moda.

## Entradas necessárias

1. A tecnologia/tema e o que despertou o interesse (projeto? cliente? curiosidade?).
2. Tempo disponível por semana (define o tamanho da trilha).
3. Projeto real candidato a laboratório (de preferência interno, nunca produção de cliente).
4. Nível atual no assunto e pré-requisitos já dominados.

## Processo obrigatório

1. **O que é, em uma frase de negócio** — que problema resolve e para quem.
2. **Quando vale / quando NÃO vale** para a DV: comparação honesta com PHP/MySQL/HostGator (custo, hospedagem, manutenção por 1 pessoa, curva). Se a resposta for "não vale agora", dizer isso e parar — aprender por aprender tem custo de oportunidade.
3. **Pré-requisitos**: o que saber antes (ex.: Docker antes de CI/CD com containers; TypeScript antes de Next sério).
4. **Armadilhas de iniciante** específicas da tecnologia (as 5 que mais queimam tempo).
5. **Mini-projeto real** (1–2 semanas, escopo fechado): versão pequena de algo que a DV já faz, na tecnologia nova — ex.: refazer o formulário de leads em Next; containerizar o AtendaPro dev em Docker; um fluxo n8n de notificação. Critério de pronto definido ANTES.
6. **Trilha em 3 blocos**: (1) fundamentos mínimos para o mini-projeto · (2) mini-projeto com checkpoints · (3) aprofundamento só do que o projeto pediu. Nada de "estude tudo antes de começar".
7. **Guardas**: instalar qualquer coisa passa por `/dependency-firewall`; laboratório isolado de produção (`/environment-strategy`); nada de dado real de cliente em ambiente de estudo.
8. **Fechamento comercial**: o que esse domínio destrava como serviço (`/transforma-servico-em-produto-vendavel`) e quando a stack entra na régua da `/escolhe-stack-ideal-projeto`.
9. **Registrar o aprendizado**: nota em `30-Conhecimento/` do vault + memória via `curador-memoria` (o que funcionou, pegadinhas, decisão de adotar ou não).

## Checklist de qualidade

- [ ] Comparação com a stack atual é honesta (inclui razões para NÃO adotar).
- [ ] Mini-projeto tem escopo fechado e critério de pronto.
- [ ] Trilha cabe no tempo real disponível.
- [ ] Nenhum dado real de cliente no laboratório.
- [ ] Armadilhas listadas são específicas, não genéricas.
- [ ] Saída comercial identificada (ou declarado que é investimento de longo prazo).
- [ ] Aprendizado registrado no vault ao final.

## Erros comuns que esta skill deve evitar

- Trilha-curso de 40 horas de teoria antes do primeiro código.
- Aprender na produção do cliente.
- Adotar tecnologia pelo hype sem passar pela régua de decisão.
- Mini-projeto aberto que nunca termina ("vou fazer um SaaS completo pra aprender").
- Ignorar custo recorrente/lock-in da tecnologia na avaliação.
- Não registrar o aprendizado (em 3 meses, recomeça do zero).

## Saída esperada

```text
1. RESUMO: o que é, o que resolve, veredito (vale agora / não vale / vale depois)
2. COMPARAÇÃO com o padrão DV atual (tabela curta)
3. ARMADILHAS de iniciante (top 5)
4. MINI-PROJETO definido (escopo, critério de pronto, prazo)
5. TRILHA em 3 blocos com checkpoints
6. SAÍDA COMERCIAL (serviço/produto que destrava)
7. O QUE REGISTRAR no vault ao concluir
```

## Exemplo de uso

> "Quero aprender Docker. Vale?"

Saída: veredito — vale como investimento de médio prazo (não muda HostGator hoje, mas destrava VPS e ambientes reproduzíveis); armadilhas (volumes, networking, imagem gorda); mini-projeto: AtendaPro rodando local com `docker compose` (PHP+MySQL) em 2 semanas, critério = ambiente sobe com 1 comando; trilha de 3 blocos; saída comercial: propostas com VPS gerenciada; registro em `30-Conhecimento/docker.md`.

---

## Conexão com o ecossistema

Antes de adotar: `/escolhe-stack-ideal-projeto`. Instalação: `/dependency-firewall`. Ambiente: `/environment-strategy`. Stack aprendida → hardening correspondente (`/docker-devops-hardening`, `/react-rsc-node-rce-hardening`, `/supabase-integration`…). Registro: `curador-memoria`. Comercial: `/transforma-servico-em-produto-vendavel`.

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[agents-claude-code-MOC|🤖 Agentes]]
