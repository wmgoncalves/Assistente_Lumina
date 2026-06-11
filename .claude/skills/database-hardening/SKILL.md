---
name: database-hardening
description: Hardening de banco de dados. Use quando houver qualquer persistência de dados — MySQL, PostgreSQL, SQLite, MongoDB, Firebase, Supabase. Cobre SQL injection, prepared statements, migrations, backup, privilégio mínimo, dumps seguros e separação de ambientes.
---

# database-hardening

Use esta skill sempre que houver banco de dados ou qualquer forma de persistência. Aplica a todos os tipos de banco.

## Perguntas internas obrigatórias

1. Qual banco de dados é usado?
2. Queries SQL são construídas com prepared statements ou concatenação?
3. Qual é o usuário do banco? Tem privilégio mínimo ou é root?
4. Há migrations? São reversíveis?
5. Existe backup automatizado? Foi testado o restore?
6. Dados de usuário (PII) são armazenados? Como são protegidos?
7. Dumps do banco ficam onde? São acessíveis publicamente?
8. Há separação entre banco de dev, staging e produção?
9. Senhas são armazenadas com hash seguro?
10. Conexão com o banco é via credencial em .env ou hardcoded?

## SQL Injection — a maior vulnerabilidade de banco

### Regra absoluta
**Nunca** concatenar input do usuário em query SQL.

```php
// ERRADO — vulnerável a SQL Injection
$query = "SELECT * FROM usuarios WHERE email = '" . $_POST['email'] . "'";
$resultado = mysqli_query($conn, $query);

// CORRETO — prepared statement
$stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
$stmt->execute([$_POST['email']]);
$resultado = $stmt->fetchAll();
```

```python
# ERRADO
cursor.execute(f"SELECT * FROM usuarios WHERE email = '{email}'")

# CORRETO
cursor.execute("SELECT * FROM usuarios WHERE email = %s", (email,))
```

```javascript
// ERRADO (Node + mysql2)
connection.query(`SELECT * FROM usuarios WHERE email = '${email}'`);

// CORRETO
connection.query("SELECT * FROM usuarios WHERE email = ?", [email]);
```

### Regra para ORMs
ORMs também podem ser vulneráveis se mal usados:
```javascript
// ERRADO — Sequelize com raw query sem bind
await sequelize.query(`SELECT * FROM usuarios WHERE nome LIKE '%${nome}%'`);

// CORRETO
await sequelize.query('SELECT * FROM usuarios WHERE nome LIKE :nome', {
  replacements: { nome: `%${nome}%` }
});

// OU usar o ORM corretamente
await Usuario.findAll({ where: { nome: { [Op.like]: `%${nome}%` } } });
```

## Privilégio mínimo

### Regra
O usuário do banco da aplicação deve ter apenas as permissões necessárias.

```sql
-- Criar usuário com privilégio mínimo
CREATE USER 'app_usuario'@'localhost' IDENTIFIED BY 'senha_forte_aqui';
GRANT SELECT, INSERT, UPDATE, DELETE ON nome_banco.* TO 'app_usuario'@'localhost';
-- NÃO conceder DROP, CREATE, ALTER, GRANT, SUPER

-- Para aplicação somente leitura
GRANT SELECT ON nome_banco.* TO 'app_readonly'@'localhost';
```

- Nunca usar `root` em aplicação em produção
- Usuário de migration pode ter mais privilégio, mas separado do usuário de aplicação
- Credenciais no `.env`, nunca hardcoded

## Migrations

### Boas práticas
- Toda migration deve ser **reversível** (ter `up` e `down`)
- Testar o `down` antes de ir para produção
- Fazer backup antes de rodar migration em produção
- Rodar migrations em janela de manutenção quando alterar tabelas grandes
- Nunca rodar `DROP TABLE` ou `TRUNCATE` sem backup confirmado

### Padrão expand-contract para zero-downtime
1. **Expand**: adicionar nova coluna/tabela sem remover antiga
2. **Migrar dados**: preencher nova coluna
3. **Deploy** da aplicação que usa nova estrutura
4. **Contract**: remover coluna/tabela antiga após confirmar que tudo funciona

## Backup

### Regras mínimas
- Backup automatizado em produção
- Backup testado periodicamente (restore real, não apenas arquivo)
- Backup armazenado fora do servidor de produção
- Backup **fora do diretório público** (nunca em `public_html/backup.sql`)
- Backup protegido por senha ou criptografado
- Retenção definida (quantos dias/versões manter)

### Antes de qualquer migration destrutiva
1. Fazer backup manual
2. Confirmar que o backup é restaurável
3. Executar migration
4. Verificar integridade pós-migration

## Proteção de dados pessoais no banco

### Senhas
```php
// CORRETO — hash seguro
$hash = password_hash($senha, PASSWORD_BCRYPT);
// ou PASSWORD_ARGON2ID para maior segurança

// Verificação
if (password_verify($senha_digitada, $hash_do_banco)) { ... }

// ERRADO — nunca usar
$hash = md5($senha);
$hash = sha1($senha);
$hash = sha256($senha); // sem salt adequado
```

### PII (dados pessoais)
- Coletar apenas o necessário (minimização — LGPD)
- Considerar criptografia para dados sensíveis (CPF, dados de saúde)
- Mascarar em logs: `CPF: ***.***.***-XX`
- Definir política de retenção e deletar quando não mais necessário

## Dumps e exportações

- Nunca colocar dump em pasta pública
- Proteger arquivo de dump com senha quando enviado
- Não commitar dump no git
- Não enviar dump com PII por e-mail sem criptografia
- Limpar dados pessoais de dumps de desenvolvimento (usar dados fictícios)

## Paginação

Sempre paginar consultas que podem retornar muitos resultados:
```sql
-- Sem paginação — DoS potencial
SELECT * FROM produtos;

-- Com paginação
SELECT * FROM produtos ORDER BY id LIMIT 20 OFFSET 0;
```

## Separação de ambientes

- Banco de dev, staging e produção são **bancos diferentes**
- Credenciais completamente diferentes entre ambientes
- Dev pode ter dados fictícios; produção tem dados reais — não misturar
- Nunca conectar aplicação de dev no banco de produção

## Bancos NoSQL e outros

### MongoDB
- Usar queries parametrizadas (driver oficial faz isso por padrão)
- Validar schema de documento antes de inserir
- Configurar autenticação (não deixar MongoDB sem auth na porta padrão)
- Não expor porta do MongoDB na internet sem VPN/firewall

### Firebase / Firestore
- Regras de segurança configuradas (não deixar `allow read, write: if true`)
- Testar regras com o emulador
- Dados sensíveis considerados quanto à jurisdição dos servidores (LGPD)

### Redis (cache/sessão)
- Autenticação habilitada (requirepass)
- Não expor porta Redis na internet
- TTL definido para chaves de sessão

## Checklist de saída

- [ ] Todas as queries usam prepared statements (nenhuma concatenação de input)
- [ ] Usuário do banco com privilégio mínimo (não root)
- [ ] Credenciais do banco no .env, não hardcoded
- [ ] Migrations têm `up` e `down` reversíveis
- [ ] Backup automatizado e testado
- [ ] Backup fora do diretório público
- [ ] Senhas armazenadas com bcrypt ou argon2id
- [ ] PII minimizada e protegida
- [ ] Dumps fora do público e sem PII em dev
- [ ] Separação de banco por ambiente
- [ ] Paginação em consultas abertas
- [ ] NoSQL com autenticação e regras configuradas

## Conexão com skills do vault

- Skill 12 (Banco e Migrations) — versão completa com expand-contract, concorrência, transações
- Skill 01 (Zero Trust) — SQL injection como vetor de ataque
- Skill 06 (LGPD) — retenção, minimização, direitos do titular
- Skill 07 (Data Poisoning) — integridade de dados vindos do banco

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
