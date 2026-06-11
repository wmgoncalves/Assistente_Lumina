---
name: docker-devops-hardening
description: Hardening para Docker, VPS, cloud, CI/CD, GitHub Actions e infraestrutura. Cobre imagens seguras, secrets em CI, GitHub Actions fixados, permissões de token, exposição de portas, backup e rollback em ambientes automatizados.
---

# docker-devops-hardening

Use esta skill para projetos com Docker, VPS, cloud (AWS, GCP, Azure, DigitalOcean), CI/CD (GitHub Actions, GitLab CI, Bitbucket, CircleCI) ou deploy automatizado.

## Perguntas internas obrigatórias

1. O Dockerfile usa imagem `latest` ou versão fixada?
2. A imagem base é de fonte oficial ou verificada?
3. O `.env` está sendo copiado para dentro da imagem?
4. O processo dentro do container roda como root?
5. Secrets do CI/CD estão configurados como variáveis de ambiente protegidas (não hardcoded no YAML)?
6. Actions do GitHub estão fixadas em commit hash ou apenas em tag/branch?
7. Quais portas estão expostas? Todas são necessárias?
8. Há plano de rollback para o deploy atual?
9. Logs do container capturam dados sensíveis?
10. Os tokens de CI têm permissão mínima?

## Docker — Dockerfile seguro

### Versão fixada (nunca `latest` em produção)
```dockerfile
# ERRADO
FROM node:latest
FROM python:latest
FROM php:latest

# CORRETO — versão e variant específicos
FROM node:20.11.0-alpine3.19
FROM python:3.12.2-slim-bookworm
FROM php:8.3.4-fpm-alpine3.19
```

Razão: `latest` pode mudar sem aviso, quebrando o build ou introduzindo mudança inesperada.

### Imagem base
- Preferir imagens **oficiais** do Docker Hub (publisher = "Docker Official Image")
- Para aplicações menores, preferir variantes Alpine (menor superfície de ataque)
- Preferir `slim` ou `alpine` quando possível
- Verificar que a imagem não tem vulnerabilidades conhecidas (docker scout, trivy)

### Não copiar .env para a imagem
```dockerfile
# ERRADO — .env vai para a imagem e fica visível em docker inspect
COPY . .

# CORRETO — criar .dockerignore
# .dockerignore:
# .env
# .env.*
# .git
# node_modules
# *.log
# backups/
```

### Usuário não-root
```dockerfile
# Criar usuário sem privilégio
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Mudar para usuário não-root antes do CMD/ENTRYPOINT
USER appuser

CMD ["node", "server.js"]
```

### Multi-stage build (reduzir superfície)
```dockerfile
# Stage 1: Build
FROM node:20.11.0-alpine3.19 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime — apenas o necessário
FROM node:20.11.0-alpine3.19 AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
CMD ["node", "dist/server.js"]
```

### Portas
- Expor (`EXPOSE`) apenas as portas necessárias
- Não mapear porta de admin/banco diretamente para internet (usar rede interna Docker)
- Banco de dados nunca exposto na internet (apenas na rede interna do compose)

```yaml
# docker-compose.yml
services:
  app:
    ports:
      - "443:443"  # Público
  db:
    # Sem 'ports' — acessível apenas internamente
    expose:
      - "5432"
```

## Secrets em CI/CD

### Regra absoluta
**Nunca** colocar secret hardcoded no YAML de CI/CD.

```yaml
# ERRADO
env:
  DATABASE_URL: postgresql://usuario:senha123@host/banco
  API_KEY: sk-abc123...

# CORRETO — usar secrets configurados no painel
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  API_KEY: ${{ secrets.API_KEY }}
```

### GitHub Secrets
- Configurar em: Settings → Secrets and Variables → Actions
- Secrets são mascarados nos logs automaticamente
- Usar `GITHUB_TOKEN` com permissão mínima para cada workflow
- Revisar periodicamente quem tem acesso ao repositório

### Mascarar secrets em logs
```yaml
# Se precisar processar secret, garantir que não aparece em logs
- name: Deploy
  run: |
    echo "::add-mask::${{ secrets.API_KEY }}"  # Mascara nos logs
    deploy.sh
  env:
    API_KEY: ${{ secrets.API_KEY }}
```

## GitHub Actions — fixar versões

### Risco
Uma action como `actions/checkout@v4` aponta para uma branch ou tag. Se o repositório for comprometido, a versão muda sem aviso.

### Como fixar em commit hash
```yaml
# MENOS seguro — tag pode ser movida
uses: actions/checkout@v4

# MAIS seguro — hash do commit específico
uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2

# Como obter o hash:
# Ir ao repositório da action → releases → copiar hash do commit
```

### Permissões mínimas de token
```yaml
permissions:
  contents: read      # apenas leitura do repositório
  # Não adicionar permissions que não são necessárias
  # Por padrão, não use: write-all, packages: write, etc.
```

### Revisar actions de terceiros
- Preferir actions oficiais (GitHub) ou de organizações conhecidas
- Verificar o repositório da action antes de usar
- Actions desconhecidas podem exfiltrar secrets

## VPS e cloud — configurações básicas

### Acesso SSH
```
# Desabilitar login root por SSH
PermitRootLogin no

# Usar apenas chave SSH (desabilitar senha)
PasswordAuthentication no

# Porta SSH não padrão (obscuridade — não é segurança, mas reduz ruído)
Port 2222

# Reiniciar SSH após mudanças
systemctl restart sshd
```

### Firewall básico (UFW)
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 2222/tcp   # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw enable
```

### Updates de segurança
```bash
# Ubuntu/Debian — atualizações de segurança automáticas
apt install unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades
```

## Rollback e backup em infraestrutura

### Estratégia mínima
- Sempre ter imagem anterior disponível antes de deploy
- Testar rollback periodicamente (não só o deploy)
- Backup de volumes de dados antes de migration de banco

### Docker
```bash
# Salvar imagem anterior
docker tag minha-app:latest minha-app:previous

# Rollback
docker service update --image minha-app:previous minha-app
```

### GitHub Actions — deploy com rollback
```yaml
- name: Deploy
  run: |
    # Salvar versão atual antes de subir nova
    CURRENT=$(kubectl get deployment minha-app -o jsonpath='{.spec.template.spec.containers[0].image}')
    echo "PREVIOUS_IMAGE=$CURRENT" >> $GITHUB_ENV
    # Deploy nova versão...

- name: Rollback on failure
  if: failure()
  run: |
    kubectl set image deployment/minha-app minha-app=${{ env.PREVIOUS_IMAGE }}
```

## Checklist de saída

- [ ] Dockerfile usa versão fixada (não `latest`)
- [ ] Imagem base é oficial e verificada
- [ ] `.dockerignore` exclui `.env`, `.git`, backups, logs
- [ ] Processo no container roda como usuário não-root
- [ ] Banco de dados sem porta exposta para internet
- [ ] Secrets em CI/CD como variáveis protegidas (não hardcoded)
- [ ] GitHub Actions fixadas em commit hash (não apenas tag)
- [ ] Permissões de token GITHUB_TOKEN mínimas
- [ ] SSH: sem login root, sem senha, apenas chave
- [ ] Firewall configurado (apenas portas necessárias abertas)
- [ ] Plano de rollback testado
- [ ] Backup de volumes e banco antes de migration

## Conexão com skills do vault

- Skill 13 (DevOps/Deploy) — deploy com rollback, ambientes, smoke test
- Skill 14 (Supply Chain) — imagens Docker são dependências
- Skill 01 (Zero Trust) — nunca confiar em ambiente externo
- Skill 09 (HITL) — deploy em produção requer aprovação humana

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
