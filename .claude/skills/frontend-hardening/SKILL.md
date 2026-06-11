---
name: frontend-hardening
description: Hardening de frontend. Use para HTML, CSS, JS puro, React, Vue, Next.js, Vite, landing pages e qualquer código que roda no navegador do usuário. Foco em segredos expostos, scripts externos, CDN, SRI, localStorage e source maps.
---

# frontend-hardening

Use esta skill para qualquer código que será executado no navegador do usuário. O frontend é ambiente público — qualquer JavaScript, variável de ambiente com prefixo público ou arquivo estático pode ser inspecionado.

## Princípio

> O navegador é território do usuário. Qualquer segredo colocado no frontend SERÁ descoberto. A questão é quando, não se.

## Perguntas internas obrigatórias

1. Há variáveis de ambiente com prefixo `VITE_`, `NEXT_PUBLIC_`, `PUBLIC_`, `REACT_APP_`?
2. O que essas variáveis contêm? São seguras para exposição pública?
3. Há scripts externos carregados via `<script src="...">` ou CDN?
4. Esses scripts externos têm SRI (Subresource Integrity)?
5. Há uso de `innerHTML` com dado não confiável?
6. Há `console.log` com dados sensíveis?
7. O build gera source maps expostos publicamente?
8. Tokens de autenticação são armazenados em `localStorage`?
9. Há chamadas de API que expõem chaves em headers no JavaScript?
10. Há dependências externas (Google Fonts, Google Analytics, Meta Pixel, etc.)?

## Variáveis de ambiente no frontend

### Regra de ouro
Variáveis de ambiente com prefixo público são **embutidas no bundle JavaScript** durante o build. Qualquer pessoa pode ver seu valor inspecionando o código.

### Permitido em variáveis públicas
- URLs de endpoints públicos de API
- IDs de analytics (Google Analytics G-XXXXXXXX — mas revisar privacidade)
- Feature flags públicas
- Versão do app
- Nomes de buckets públicos

### Proibido em variáveis públicas
- Chaves secretas de API (mesmo que "só de leitura")
- Tokens de autenticação de backend
- Segredos JWT
- Senhas de banco (absurdo, mas acontece)
- Tokens de acesso a serviços com billing
- Service account credentials

### Como proteger segredos no contexto de frontend + backend
- Chave secreta fica no backend (`.env` do servidor)
- Frontend chama o backend que chama a API externa
- Backend retorna apenas o dado necessário, nunca a chave

## Scripts externos e CDN

### Riscos
- Script comprometido no CDN atinge todos os usuários
- Script atualizado pelo provedor pode mudar comportamento sem aviso
- Scripts de terceiros coletam dados do usuário (analytics, pixels, fonts)

### Subresource Integrity (SRI)
Para todo `<script>` ou `<link>` externo, usar:
```html
<script 
  src="https://cdn.exemplo.com/lib.min.js"
  integrity="sha384-HASH_AQUI"
  crossorigin="anonymous">
</script>
```
- Gerar hash com: `openssl dgst -sha384 -binary arquivo.js | openssl base64 -A`
- Ou usar ferramenta online **após verificar a fonte**
- Se o arquivo mudar no CDN, o navegador bloqueia o carregamento

### Self-hosting preferido
Quando possível, copiar a versão específica para o projeto:
- Mais controle sobre quando atualizar
- Sem dependência de CDN externo
- Mais privado (não envia requisição para terceiro)
- Funciona offline e sem falhas de CDN

### Google Fonts
Envia o IP do usuário para os servidores do Google. Em contexto LGPD:
- Self-host as fontes via `@font-face` local
- Ou obter consentimento explícito antes de carregar

## XSS no frontend

### `innerHTML` e similares
```javascript
// ERRADO — vulnerável a XSS
elemento.innerHTML = dadoDoUsuario;

// CORRETO — seguro
elemento.textContent = dadoDoUsuario;

// Se precisar de HTML, sanitizar com DOMPurify primeiro
elemento.innerHTML = DOMPurify.sanitize(dadoDoUsuario);
```

### `dangerouslySetInnerHTML` em React
```jsx
// ERRADO
<div dangerouslySetInnerHTML={{ __html: dadoDoUsuario }} />

// CORRETO — só quando HTML é necessário, com sanitização
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(dadoDoUsuario) }} />
```

### Evitar também
- `document.write()`
- `eval()` com dado externo
- `setTimeout(string, ...)` e `setInterval(string, ...)` — preferir funções
- Template literals em `innerHTML`
- `v-html` no Vue com dado não confiável

## localStorage e armazenamento no cliente

### O que pode ir em localStorage
- Preferências de UI (tema, idioma)
- Estado de aplicação não-sensível
- Cache de dados públicos

### O que NÃO deve ir em localStorage
- Tokens de autenticação (vulnerável a XSS — se XSS ocorrer, token vaza)
- Chaves de API
- Dados pessoais sensíveis
- Informações de pagamento

### Alternativa para tokens de autenticação
Usar cookie `HttpOnly` + `Secure` + `SameSite` — JavaScript não consegue ler, XSS não consegue roubar.

## console.log e debugging

Remover antes de produção:
- `console.log` com tokens, senhas, dados de usuário
- `console.dir`, `console.table` com objetos sensíveis
- Comentários com credenciais ou informações internas

Ferramentas de build (Vite, Next, Webpack) podem remover console.log em produção com configuração.

## Source maps

Source maps em produção expõem o código-fonte original:
- Avaliar se o código-fonte pode ser exposto
- Se o projeto é open-source: source maps são aceitáveis
- Se há lógica de negócio proprietária ou segredos em comentários: desabilitar source maps em produção
- Nunca usar source maps com credenciais ou segredos nos comentários do código

## Dependências de frontend

- Auditar regularmente: `npm audit`
- Fixar versões no `package.json`
- Manter `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml`
- Verificar tamanho do bundle: dependência desnecessária = superfície de ataque + performance
- Usar `bundlephobia.com` antes de instalar (após validar o nome do pacote)

## Checklist de saída

- [ ] Variáveis públicas (VITE_, NEXT_PUBLIC_, etc.) revisadas — nenhuma contém segredo
- [ ] Scripts externos com SRI ou self-hosted
- [ ] Google Fonts / CDN avaliado quanto a privacidade
- [ ] `innerHTML` com dado do usuário usa sanitização
- [ ] Tokens de auth em cookie HttpOnly (não localStorage)
- [ ] `console.log` sensíveis removidos para produção
- [ ] Source maps configurados adequadamente para produção
- [ ] `npm audit` sem vulnerabilidades críticas/altas abertas
- [ ] Bundle não inclui dependências de desenvolvimento desnecessárias

## Conexão com skills do vault

- Skill 01 (Zero Trust) — XSS, sanitização, validação
- Skill 14 (Supply Chain) — dependências de frontend, CDN, SRI
- Skill 06 (LGPD) — scripts de terceiros que coletam dados
- Skill 15 (Performance) — bundle size, render-blocking scripts

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
