# CLAUDE.md — [NOME DO PROJETO] (template DV Digital)

> Template para `.claude/CLAUDE.md` de projeto novo. Copiar, preencher os colchetes e apagar esta linha. As regras globais do ecossistema (~/.claude/CLAUDE.md) continuam valendo — este arquivo só adiciona o contexto DO PROJETO. Não repetir aqui o que é global.

## O que é este projeto

- **Cliente:** [NOME] (playbook: `10-Projetos/[cliente]/playbook.md` no vault)
- **O que faz:** [1–2 frases]
- **Stack:** [PHP 8.x + MySQL / outra — decidida via /escolhe-stack-ideal-projeto, ADR em decisoes.md]
- **Hospedagem:** [HostGator/cPanel — domínio, versão PHP do servidor]
- **Multi-tenant:** [sim/não — se sim, /cria-arquitetura-multi-tenant aplicada]

## Estrutura

- Entrypoint: [public/index.php / index.php]
- [Mapa curto das pastas que fogem do padrão /cria-projeto-php-mysql-hostgator]

## O que NÃO pode quebrar (Regra 00 deste projeto)

- [Fluxos vivos: ex. agendamento, formulário de leads, integração X]
- [URLs públicas que não podem mudar]
- [Integrações ativas: pixel, webhook, e-mail]

## Dados e LGPD

- Dados pessoais tratados: [quais, onde]
- Banco: [nome], usuário de privilégio mínimo; backup: [onde/frequência]
- `.env` no servidor em [local], chmod 600 — nunca versionado, nunca lido sem autorização

## Comandos e ambiente

- Rodar local: [comando]
- Testes: [comando ou "manuais — ver checklist abaixo"]
- Deploy: [FTP/File Manager/git] — SEMPRE via /pre-deploy-security-review + /safe-deploy-hosting

## Convenções específicas deste projeto

- [Só o que difere do padrão global — ex.: nomes de tabela em PT, prefixo de rota]

## Checklist mínimo antes de declarar pronto

1. Validação no servidor em todo input novo
2. Mobile/tablet testados (360/768/1024)
3. Estados loading/vazio/erro nas telas tocadas
4. Teste dos fluxos da seção "O que NÃO pode quebrar"
5. /product-readiness-checklist antes de entregar ao cliente

## Decisões e histórico

- Decisões técnicas: `decisoes.md` (mini-ADRs com data)
- Aprendizados → `curador-memoria` ao final de cada tarefa
