---
name: storage-database-files
description: Decisao de armazenamento de dados e arquivos. Classifica dado (publico/interno/pessoal/sensivel/critico) e recomenda HTML/JSON/CSV/Sheets/MySQL/PostgreSQL/Firebase/Supabase/storage conforme caso. Bloqueia senha em texto puro, dados sensiveis em planilha publica, arquivo privado por URL publica. Use ao planejar banco, upload, download, planilha ou storage.
---
# 06 — Storage, Database and Files

## Nome da skill

`06-storage-database-files`

## Categoria

Armazenamento, banco de dados, arquivos, uploads, documentos, Google Sheets, CSV, JSON, MySQL, PostgreSQL, Firebase, Supabase, storage, backups, privacidade e LGPD.

## Objetivo principal

Esta skill orienta o Claude Code a decidir de forma segura e organizada onde os dados e arquivos de um projeto digital devem ficar.

Ela deve ser usada sempre que o projeto envolver:

- formulários;
- leads;
- cadastros;
- usuários;
- login;
- painel administrativo;
- área restrita;
- uploads;
- downloads;
- PDFs;
- imagens;
- documentos privados;
- planilhas;
- Google Sheets;
- CSV;
- JSON;
- banco MySQL;
- banco PostgreSQL;
- Firebase;
- Supabase;
- storage em Cloud;
- arquivos sensíveis;
- dados pessoais;
- dados de saúde;
- dados financeiros;
- dados de clientes;
- backup;
- LGPD.

O objetivo é evitar improvisos perigosos, como:

- salvar dados sensíveis em planilha pública;
- deixar PDFs privados acessíveis por link direto;
- deixar uploads executáveis;
- armazenar leads sem política de privacidade;
- usar arquivo CSV como banco crítico;
- expor banco ou credenciais;
- misturar arquivos públicos com privados;
- perder dados em deploy;
- publicar backups;
- não ter plano de exclusão de dados;
- não ter backup;
- escolher banco complexo sem necessidade;
- escolher armazenamento simples demais para dados importantes.

A regra central é:

> Antes de salvar qualquer dado ou arquivo, classifique o tipo de informação, defina quem pode acessar, escolha o armazenamento adequado, proteja o acesso, planeje backup e considere LGPD.

---

# 1. Relação com as outras skills

Esta skill deve seguir:

- `00-technical-governance-overview`
- `01-requirements-analysis`
- `02-versioning-change-control`
- `03-environment-strategy`
- `04-safe-deploy-hosting`
- `05-hosting-infrastructure-analysis`
- `07-product-readiness-checklist`
- skills de segurança existentes

## 1.1. Prioridade

Em caso de conflito:

1. Segurança dos dados;
2. LGPD e privacidade;
3. Controle de acesso;
4. Backup e recuperação;
5. Compatibilidade com hospedagem;
6. Simplicidade operacional;
7. Custo;
8. Conveniência de implementação.

---

# 2. Regra principal desta skill

O Claude Code não deve escolher armazenamento apenas por facilidade.

Antes de decidir entre CSV, JSON, Google Sheets, MySQL, PostgreSQL, Firebase, Supabase ou storage externo, deve analisar:

- o dado é público, interno, pessoal ou sensível?
- precisa de login?
- quem pode ver?
- quem pode editar?
- precisa de histórico?
- precisa de backup?
- precisa de exclusão?
- precisa de auditoria?
- precisa de segurança?
- vai crescer?
- precisa ser pesquisado?
- precisa ser filtrado?
- precisa ser acessado por múltiplos usuários?
- a hospedagem suporta a tecnologia?
- o custo é aceitável?

---

# 3. Quando esta skill deve ser usada

Use esta skill quando o usuário pedir:

- salvar dados;
- criar banco;
- usar Google Sheets;
- usar CSV;
- usar JSON;
- criar painel admin;
- criar login;
- criar área do usuário;
- criar upload;
- criar biblioteca de documentos;
- disponibilizar PDFs;
- vender documentos digitais;
- criar plataforma de cursos;
- armazenar respostas de teste;
- armazenar leads;
- armazenar pacientes;
- armazenar alunos;
- armazenar clientes;
- armazenar arquivos privados;
- criar sistema de documentos;
- criar storage;
- configurar backup;
- proteger downloads;
- importar dados;
- exportar dados;
- migrar planilha para banco;
- migrar banco;
- integrar API com dados.

---

# 4. Classificação dos dados

Antes de armazenar, o Claude Code deve classificar os dados.

## 4.1. Dados públicos

Dados que podem ser exibidos publicamente.

Exemplos:

- nome da empresa;
- descrição de serviço;
- imagens institucionais;
- posts públicos;
- ofertas públicas;
- catálogo público;
- depoimentos autorizados;
- arquivos públicos;
- documentos de divulgação.

Armazenamento possível:

- HTML;
- JSON;
- CSV;
- CMS;
- banco;
- Google Sheets, com cuidado;
- pasta pública;
- CDN.

Risco:

- baixo, desde que não contenha dados pessoais indevidos.

## 4.2. Dados internos

Dados usados pela equipe, mas que não devem aparecer publicamente sem controle.

Exemplos:

- lista interna de leads;
- status de atendimento;
- observações administrativas;
- controles operacionais;
- relatórios internos;
- registros de tarefas;
- dados de clientes sem sensibilidade alta.

Armazenamento possível:

- MySQL;
- sistema com login;
- Google Sheets privado;
- painel administrativo;
- banco gerenciado.

Risco:

- médio.

Cuidados:

- controle de acesso;
- backup;
- permissões;
- evitar links públicos;
- evitar exposição em frontend.

## 4.3. Dados pessoais

Dados que identificam uma pessoa.

Exemplos:

- nome;
- telefone;
- e-mail;
- CPF;
- endereço;
- data de nascimento;
- profissão;
- imagem pessoal;
- assinatura;
- localização;
- dados de contato.

Armazenamento possível:

- banco com controle de acesso;
- planilha privada com restrição;
- sistema autenticado;
- CRM adequado.

Risco:

- médio a alto.

Cuidados:

- política de privacidade;
- finalidade clara;
- consentimento quando aplicável;
- acesso restrito;
- backup;
- exclusão quando solicitado;
- não expor publicamente.

## 4.4. Dados sensíveis

Dados que exigem proteção reforçada.

Exemplos:

- dados de saúde;
- laudos;
- prontuários;
- informações psicológicas;
- respostas de testes emocionais;
- dados financeiros detalhados;
- documentos pessoais;
- dados biométricos;
- informações sobre menores;
- dados trabalhistas sensíveis;
- dados jurídicos privados.

Armazenamento recomendado:

- banco seguro;
- storage privado;
- acesso autenticado;
- permissões específicas;
- criptografia quando aplicável;
- logs de acesso quando necessário.

Risco:

- alto.

Cuidados obrigatórios:

- não usar planilha pública;
- não deixar arquivos em pasta pública;
- não expor em frontend;
- restringir permissões;
- revisar LGPD;
- revisar backup;
- revisar retenção;
- revisar exclusão;
- revisar consentimento.

## 4.5. Dados críticos

Dados que, se perdidos ou corrompidos, prejudicam a operação.

Exemplos:

- pedidos;
- pagamentos;
- usuários;
- certificados;
- histórico de acesso;
- registros operacionais;
- dados de plataforma;
- banco de clientes;
- arquivos comprados;
- permissões.

Cuidados:

- backup frequente;
- restauração testada;
- controle de alteração;
- logs;
- versionamento de schema;
- acesso restrito;
- plano de recuperação.

---

# 5. Classificação dos arquivos

Antes de salvar arquivos, classificar.

## 5.1. Arquivos públicos

Exemplos:

- logos;
- imagens do site;
- banners;
- PDFs institucionais públicos;
- catálogos;
- materiais promocionais;
- favicon;
- arquivos CSS e JS.

Podem ficar em pasta pública, desde que não contenham informação privada.

## 5.2. Arquivos internos

Exemplos:

- planilhas operacionais;
- materiais de treinamento interno;
- documentos administrativos;
- relatórios;
- arquivos usados por equipe.

Devem ter acesso restrito.

## 5.3. Arquivos privados

Exemplos:

- contratos;
- documentos de clientes;
- laudos;
- arquivos de pacientes;
- documentos comprados por usuário;
- certificados;
- comprovantes;
- anexos de formulário;
- imagens pessoais.

Não devem ficar acessíveis apenas por URL pública simples.

## 5.4. Arquivos sensíveis

Exemplos:

- exames;
- avaliações de saúde;
- documentos pessoais;
- dados financeiros;
- arquivos jurídicos;
- respostas de testes;
- material protegido por direito autoral;
- banco exportado;
- backups.

Exigem controle forte.

---

# 6. Matriz de decisão de armazenamento

```md
| Tipo de dado/arquivo | Armazenamento possível | Evitar | Observação |
|---|---|---|---|
| Texto público do site | HTML/JSON/CMS | Banco complexo sem necessidade | Simples e versionável |
| Lista pública pequena | CSV/JSON/Sheets | Banco pesado sem necessidade | Validar campos |
| Leads simples | MySQL/CRM/Sheets privado | Sheets público | Exige LGPD |
| Usuários e senhas | Banco com hash | CSV/Sheets | Nunca salvar senha em texto puro |
| Arquivos públicos | Pasta pública/CDN | Storage complexo sem necessidade | Otimizar imagens |
| PDFs privados | Storage privado/pasta protegida | public_html aberto | Exige controle de acesso |
| Dados sensíveis | Banco seguro | Sheets público/CSV público | Exige política e acesso restrito |
| Vídeos | Plataforma de vídeo/CDN | public_html | Evitar streaming no servidor simples |
| Backups | Local protegido/offsite | public_html | Nunca deixar público |
```

---

# 7. Opções de armazenamento de dados

## 7.1. Sem armazenamento

Quando usar:

- formulário abre WhatsApp;
- formulário envia e-mail sem salvar;
- landing page simples;
- site institucional básico.

Vantagens:

- simples;
- menos risco;
- menos LGPD operacional;
- menos manutenção.

Cuidados:

- mesmo sem salvar, pode haver coleta temporária;
- informar finalidade se houver formulário;
- rastreamento ainda pode envolver cookies/dados.

## 7.2. HTML estático

Quando usar:

- conteúdo público;
- páginas institucionais;
- dados que mudam pouco.

Vantagens:

- simples;
- rápido;
- seguro;
- fácil deploy.

Limitações:

- edição exige alterar arquivo;
- não serve para dados dinâmicos frequentes.

## 7.3. JSON

Quando usar:

- configurações;
- listas públicas;
- conteúdo simples;
- catálogos pequenos;
- cards;
- FAQs;
- dados de frontend.

Vantagens:

- simples;
- fácil leitura por JavaScript;
- bom para dados públicos.

Cuidados:

- se estiver público, qualquer pessoa pode acessar;
- não colocar dados privados;
- validar antes de exibir;
- cuidado com cache.

## 7.4. CSV

Quando usar:

- tabelas simples;
- listas públicas;
- dados exportáveis;
- catálogos pequenos;
- protótipos.

Vantagens:

- simples;
- fácil edição;
- compatível com planilhas.

Cuidados:

- não usar para dados sensíveis;
- não usar para múltiplos usuários editando;
- não usar como banco crítico;
- validar separadores e encoding;
- cuidado com injeção em CSV quando exportar.

## 7.5. Google Sheets

Quando usar:

- listas simples;
- administração por equipe não técnica;
- ofertas públicas;
- dados de catálogo;
- dados que precisam ser atualizados sem painel;
- protótipos.

Vantagens:

- fácil edição;
- sem criar painel;
- rápido para MVP;
- bom para conteúdo semissistematizado.

Cuidados:

- permissões;
- exposição pública;
- limites;
- instabilidade;
- estrutura de colunas;
- validação;
- dados sensíveis;
- cache;
- dependência externa.

Regra:

> Google Sheets pode ser útil como fonte simples de dados, mas não deve ser tratado como banco seguro para dados sensíveis, autenticação, permissões ou registros críticos.

## 7.6. MySQL

Quando usar:

- hospedagem compartilhada;
- PHP;
- sistemas simples e médios;
- cadastros;
- leads;
- painéis;
- produtos digitais;
- áreas logadas;
- registros históricos.

Vantagens:

- disponível em cPanel/HostGator;
- bom custo;
- conhecido;
- adequado para CRUD;
- compatível com PHP.

Cuidados:

- prepared statements;
- backup;
- permissões;
- charset;
- índices;
- proteção de credenciais;
- não expor erros;
- migrações cuidadosas.

## 7.7. PostgreSQL

Quando usar:

- sistemas mais robustos;
- dados relacionais mais complexos;
- VPS/Cloud;
- queries avançadas;
- aplicações maiores.

Vantagens:

- robusto;
- recursos avançados;
- boa integridade de dados.

Cuidados:

- hospedagem compartilhada pode não oferecer;
- exige mais configuração;
- backup e manutenção.

## 7.8. Firebase

Quando usar:

- autenticação;
- apps modernos;
- tempo real;
- MVPs;
- aplicações serverless;
- sincronização.

Cuidados:

- regras de segurança;
- custos;
- estrutura de dados;
- backup;
- dependência externa;
- exposição por regra mal configurada.

## 7.9. Supabase

Quando usar:

- PostgreSQL gerenciado;
- autenticação;
- APIs automáticas;
- storage;
- MVPs;
- aplicações modernas.

Cuidados:

- RLS bem configurado;
- chaves protegidas;
- custos;
- permissões;
- backup;
- dependência externa.

---

# 8. Opções de armazenamento de arquivos

## 8.1. Pasta pública

Exemplo:

```txt
/public_html/assets/img
/public_html/downloads
```

Usar para:

- imagens públicas;
- CSS;
- JS;
- PDFs públicos;
- materiais institucionais.

Não usar para:

- documentos privados;
- contratos;
- dados de pacientes;
- backups;
- dumps SQL;
- credenciais;
- arquivos comprados que exigem restrição;
- uploads sensíveis.

## 8.2. Pasta protegida no servidor

Quando possível, salvar fora da pasta pública:

```txt
/storage/private
```

ou acima de:

```txt
/public_html
```

O acesso deve ser feito por script autorizado.

## 8.3. Pasta pública com bloqueio

Se não for possível salvar fora da pasta pública, usar bloqueios de servidor quando compatível.

Exemplo conceitual `.htaccess`:

```apache
Options -Indexes

<FilesMatch "\.(php|phtml|phar|cgi|pl|py|sh)$">
  Require all denied
</FilesMatch>
```

Para arquivos privados, preferir bloquear acesso direto e servir via backend.

## 8.4. Storage externo

Quando usar:

- muitos arquivos;
- arquivos grandes;
- documentos privados;
- vídeos;
- downloads frequentes;
- necessidade de escalabilidade;
- necessidade de URLs temporárias;
- separação entre app e arquivos.

Cuidados:

- permissões;
- buckets públicos;
- URLs assinadas;
- custos;
- backup;
- LGPD;
- política de retenção.

---

# 9. Uploads

Uploads são uma das áreas mais perigosas.

## 9.1. Regra principal

Nunca aceitar upload sem validação.

## 9.2. Verificações obrigatórias

- extensão permitida;
- MIME type;
- tamanho máximo;
- nome seguro;
- renomeação do arquivo;
- pasta correta;
- bloqueio de execução;
- antivírus quando aplicável;
- autenticação se necessário;
- autorização;
- logs;
- backup;
- exclusão;
- privacidade.

## 9.3. Extensões permitidas

Definir lista positiva, não lista negativa.

Exemplo:

```txt
jpg
jpeg
png
webp
pdf
doc
docx
xls
xlsx
csv
```

Depende do projeto.

## 9.4. Extensões perigosas

Evitar permitir:

```txt
php
phtml
phar
exe
sh
bat
cmd
js
html
svg sem sanitização
```

Atenção: SVG pode conter scripts se não for tratado.

## 9.5. Renomeação segura

Não confiar no nome original.

Exemplo:

```txt
documento-cliente.pdf
```

pode virar:

```txt
upload_20260514_8f3a9c.pdf
```

## 9.6. Bloqueio de execução

Arquivos enviados não devem ser executáveis.

Especialmente em hospedagem PHP, nunca permitir execução de `.php` dentro de uploads.

## 9.7. Tamanho máximo

Definir por tipo:

- imagem: limite razoável;
- PDF: limite conforme uso;
- vídeo: preferir plataforma externa;
- documentos: limite compatível com hospedagem.

---

# 10. Downloads privados

Se um arquivo é privado, não basta esconder o link.

## 10.1. Problema

Se o arquivo está em:

```txt
public_html/uploads/contrato.pdf
```

qualquer pessoa com a URL pode baixar.

## 10.2. Solução recomendada

- salvar fora da pasta pública;
- exigir login;
- verificar permissão;
- servir arquivo por script;
- registrar acesso quando necessário;
- usar URL temporária quando possível.

## 10.3. Exemplo conceitual de fluxo

```txt
Usuário logado -> solicita arquivo -> sistema verifica permissão -> sistema entrega arquivo
```

Não:

```txt
Usuário recebe link público permanente para arquivo privado
```

---

# 11. Senhas e autenticação

## 11.1. Nunca salvar senha em texto puro

Senhas devem ser armazenadas com hash seguro.

Em PHP, usar:

```php
password_hash($senha, PASSWORD_DEFAULT)
password_verify($senha, $hash)
```

## 11.2. Não usar CSV ou Google Sheets para senhas

Credenciais de usuários não devem ficar em:

- CSV;
- JSON público;
- Google Sheets;
- planilha compartilhada;
- frontend;
- código JavaScript.

## 11.3. Reset de senha

Se houver recuperação de senha:

- usar token temporário;
- expiração;
- envio seguro;
- não revelar se e-mail existe;
- não enviar senha antiga.

---

# 12. Google Sheets com segurança

## 12.1. Quando pode ser adequado

- lista pública de ofertas;
- catálogo sem dados sensíveis;
- dados institucionais;
- agenda pública;
- conteúdo que equipe atualiza;
- protótipo.

## 12.2. Quando não é adequado

- dados de pacientes;
- dados de alunos privados;
- CPF;
- documentos;
- dados financeiros;
- senhas;
- permissões;
- logs críticos;
- pagamentos;
- informações internas sensíveis.

## 12.3. Permissões

Verificar:

- planilha pública?
- qualquer pessoa com link pode ver?
- qualquer pessoa pode editar?
- há dados ocultos em abas?
- há colunas internas?
- há histórico sensível?
- API expõe mais do que deveria?

## 12.4. Estrutura de colunas

Documentar colunas.

Exemplo:

```md
| Coluna | Tipo | Obrigatória | Exibição pública | Observação |
|---|---|---:|---:|---|
| titulo | Texto | Sim | Sim | Nome da oferta |
| status | Texto | Sim | Não | ativo/inativo |
| destaque | Booleano | Não | Não | Usado para layout |
```

## 12.5. Regra para status

Se usar planilha como fonte pública, implementar status:

- ativo;
- inativo;
- rascunho;
- destaque, quando aplicável.

Itens inativos não aparecem no site público.

---

# 13. CSV/JSON público

## 13.1. Regra

Tudo que estiver em CSV/JSON público pode ser lido por qualquer pessoa.

Não colocar:

- telefone privado;
- e-mail privado;
- CPF;
- token;
- senha;
- chave de API;
- dados internos;
- observações administrativas;
- dados sensíveis.

## 13.2. Validação

Mesmo dados vindos de CSV/JSON devem ser tratados como não confiáveis.

Validar:

- campos obrigatórios;
- tipos;
- URLs;
- imagens;
- status;
- valores;
- caracteres especiais.

---

# 14. Banco MySQL em hospedagem compartilhada

## 14.1. Uso adequado

Bom para:

- leads;
- formulários;
- usuários;
- painel admin;
- produtos;
- documentos;
- posts;
- registros simples.

## 14.2. Cuidados

- usar prepared statements;
- proteger credenciais;
- backup;
- charset UTF-8;
- permissões mínimas;
- não expor erro SQL;
- validar entrada;
- sanitizar saída;
- paginar listagens;
- criar índices quando necessário.

## 14.3. Credenciais

Não colocar credenciais em JavaScript.

Credenciais de banco devem ficar no backend.

---

# 15. Backup

Todo armazenamento relevante precisa de backup.

## 15.1. O que fazer backup

- banco;
- uploads;
- arquivos de configuração;
- arquivos do site;
- planilhas;
- documentos;
- storage;
- logs importantes;
- chaves de configuração, com proteção adequada.

## 15.2. Frequência

Depende da criticidade.

### Baixa criticidade

- antes de alterações;
- após grandes entregas.

### Média criticidade

- backup semanal ou diário;
- antes de deploy.

### Alta criticidade

- backup diário ou mais frequente;
- cópia externa;
- restauração testada.

## 15.3. Teste de restauração

Backup só é confiável se puder ser restaurado.

O Claude Code deve lembrar:

> Fazer backup é importante, mas saber restaurar é essencial.

## 15.4. Backups públicos

Nunca deixar backup em pasta pública.

Evitar:

```txt
public_html/backup.zip
public_html/dump.sql
public_html/export.csv
```

---

# 16. Retenção e exclusão de dados

Projetos com dados pessoais devem prever:

- por quanto tempo manter;
- quem pode excluir;
- como excluir;
- se exclusão é física ou lógica;
- se há backup contendo dados;
- como atender solicitação do titular.

## 16.1. Exclusão lógica

Marca registro como excluído.

Exemplo:

```txt
deleted_at
status = excluido
```

Vantagem:

- preserva histórico.

Risco:

- dado ainda existe.

## 16.2. Exclusão física

Remove do banco.

Vantagem:

- dado deixa de existir no banco principal.

Risco:

- pode quebrar histórico;
- pode ainda existir em backups.

---

# 17. Logs

Logs podem conter dados sensíveis.

## 17.1. Cuidados

- não registrar senha;
- não registrar token completo;
- não registrar CPF sem necessidade;
- não registrar dados de saúde;
- proteger arquivos de log;
- limpar logs antigos;
- não deixar logs públicos.

## 17.2. Logs úteis

Registrar com cuidado:

- erros;
- tentativas de login;
- ações administrativas;
- upload;
- exclusão;
- falha de integração.

---

# 18. Importação e exportação de dados

## 18.1. Importação

Antes de importar:

- validar arquivo;
- validar colunas;
- validar encoding;
- evitar duplicidade;
- testar em homologação;
- fazer backup;
- tratar erros;
- limitar tamanho.

## 18.2. Exportação

Antes de exportar:

- verificar permissão;
- limitar dados;
- proteger arquivo;
- evitar expor dados sensíveis;
- remover arquivo exportado temporário;
- registrar ação quando necessário.

## 18.3. CSV Injection

Ao exportar CSV, cuidado com valores que começam com:

```txt
=
+
-
@
```

Podem ser interpretados como fórmula em planilhas.

---

# 19. Migração de dados

Migração exige plano.

## 19.1. Exemplos

- CSV para MySQL;
- Google Sheets para MySQL;
- MySQL para PostgreSQL;
- servidor antigo para novo;
- pasta pública para storage privado;
- planilha para painel.

## 19.2. Checklist

- backup da origem;
- backup do destino;
- mapeamento de campos;
- tratamento de encoding;
- teste com amostra;
- validação de totais;
- validação de registros;
- rollback;
- logs da migração.

---

# 20. LGPD

Sempre que houver dados pessoais ou sensíveis, considerar LGPD.

## 20.1. Princípios práticos

- coletar o mínimo necessário;
- explicar finalidade;
- restringir acesso;
- proteger dados;
- permitir correção/exclusão quando aplicável;
- definir retenção;
- evitar compartilhamento desnecessário;
- ter política de privacidade;
- registrar consentimento quando necessário.

## 20.2. Formulários

Formulários que coletam dados pessoais devem ter:

- finalidade clara;
- link para política de privacidade;
- consentimento quando adequado;
- campos mínimos;
- segurança no envio.

## 20.3. Dados sensíveis

Dados sensíveis exigem proteção reforçada.

Se o projeto envolver saúde, pacientes, avaliações, documentos, dados financeiros ou informações íntimas, o Claude Code deve alertar e recomendar armazenamento restrito.

---

# 21. Controle de acesso

## 21.1. Perguntas

- Quem pode ver?
- Quem pode criar?
- Quem pode editar?
- Quem pode excluir?
- Quem pode baixar?
- Quem pode exportar?
- Quem pode gerenciar permissões?

## 21.2. Matriz de permissões

```md
| Recurso | Visitante | Usuário | Editor | Admin |
|---|---:|---:|---:|---:|
| Ver arquivo público | Sim | Sim | Sim | Sim |
| Ver documento privado | Não | Dono | Sim | Sim |
| Enviar arquivo | Não | Sim | Sim | Sim |
| Excluir arquivo | Não | Não | Não | Sim |
| Exportar dados | Não | Não | Não | Sim |
```

---

# 22. Separação entre público e privado

Estrutura recomendada conceitual:

```txt
/public_html
  /assets
  /downloads-publicos
  index.php

/storage
  /private
  /uploads
  /backups
  /logs
```

Quando não for possível criar pasta fora de `public_html`, usar proteção extra e evitar colocar dados sensíveis no servidor simples.

---

# 23. Estrutura de banco recomendada

Para projetos com banco, o Claude Code deve considerar:

- tabelas bem nomeadas;
- IDs;
- timestamps;
- status;
- usuário criador;
- usuário editor;
- exclusão lógica quando adequado;
- índices;
- chaves estrangeiras quando aplicável.

## 23.1. Campos comuns

```txt
id
created_at
updated_at
deleted_at
status
created_by
updated_by
```

Nem todos são necessários em projetos simples, mas devem ser considerados.

---

# 24. Status de registros

Usar status evita exclusões desnecessárias.

Exemplos:

- ativo;
- inativo;
- rascunho;
- publicado;
- arquivado;
- excluido;
- pendente;
- aprovado;
- recusado.

Para dados públicos, regra comum:

> Somente registros com status `ativo` ou `publicado` aparecem no site.

---

# 25. Dados em frontend

Nunca colocar no frontend:

- senha;
- token secreto;
- chave privada;
- credencial de banco;
- dados pessoais privados;
- dados sensíveis;
- regras internas sigilosas;
- URLs privadas sem controle.

Tudo no JavaScript público pode ser visto.

---

# 26. API e dados

Se o projeto tiver API:

- validar autenticação;
- validar autorização;
- limitar campos retornados;
- não retornar dados internos;
- paginar respostas;
- tratar erros;
- limitar taxa;
- proteger tokens;
- usar HTTPS;
- documentar endpoints.

---

# 27. Dados de teste

Ambiente de teste deve usar dados fictícios.

Se precisar usar dados reais:

- mascarar;
- limitar;
- proteger;
- remover após uso;
- não expor publicamente.

---

# 28. Modelo de análise de armazenamento

```md
# Análise de Armazenamento, Banco e Arquivos

## 1. Dados envolvidos

| Dado | Tipo | Sensibilidade | Origem | Destino |
|---|---|---|---|---|

## 2. Arquivos envolvidos

| Arquivo | Público/Privado | Local | Acesso | Backup |
|---|---|---|---|---|

## 3. Armazenamento recomendado

Opção:
- [Sem armazenamento / JSON / CSV / Google Sheets / MySQL / PostgreSQL / Firebase / Supabase / Storage]

Justificativa:
- [Motivo]

## 4. Controle de acesso

- Quem visualiza:
- Quem edita:
- Quem exclui:
- Quem exporta:

## 5. Segurança

- Validação:
- Proteção:
- Backup:
- Logs:
- LGPD:

## 6. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|

## 7. Critérios de aceite

- [Critério 1]
- [Critério 2]
```

---

# 29. Modelo de recomendação simples

```md
Para este projeto, não recomendo banco de dados neste primeiro momento.

Motivo:
- O formulário apenas abrirá o WhatsApp.
- Não há necessidade de histórico.
- Não haverá área logada.
- Não serão armazenados dados pessoais no servidor.

Recomendação:
- Usar HTML/CSS/JS.
- Montar a mensagem do WhatsApp no frontend.
- Incluir política de privacidade por causa de rastreamento e coleta de contato via WhatsApp.
```

---

# 30. Modelo de recomendação com MySQL

```md
Neste caso, recomendo MySQL.

Motivo:
- Haverá cadastro de usuários.
- Haverá painel administrativo.
- Os dados precisam de histórico.
- A hospedagem compartilhada suporta PHP + MySQL.
- Google Sheets não é adequado para login e permissões.

Cuidados:
- Usar prepared statements.
- Salvar senhas com hash.
- Proteger painel.
- Fazer backup do banco.
- Não expor erros SQL em produção.
```

---

# 31. Modelo de alerta contra Google Sheets

```md
Não recomendo Google Sheets para este caso.

Motivo:
- Os dados incluem informações pessoais/sensíveis.
- A planilha pode ser exposta por permissões incorretas.
- Não há controle robusto de autenticação.
- Não é adequada para senhas, permissões e dados críticos.

Alternativa:
- Usar banco com login e controle de acesso.
- Salvar arquivos privados fora da pasta pública.
- Criar painel administrativo com permissões.
```

---

# 32. Erros que esta skill deve evitar

O Claude Code não deve:

- salvar dados sensíveis em JSON público;
- salvar dados sensíveis em CSV público;
- usar Google Sheets público para dados privados;
- salvar senha em texto puro;
- colocar credencial no frontend;
- colocar backup em `public_html`;
- deixar upload executar PHP;
- deixar documento privado acessível por URL pública;
- misturar arquivos públicos e privados;
- usar banco sem backup;
- importar dados sem validar;
- exportar dados sem permissão;
- usar planilha como autenticação;
- ignorar LGPD;
- coletar dados sem finalidade;
- salvar mais dados do que precisa;
- ignorar retenção e exclusão;
- usar storage público para arquivos privados;
- expor logs;
- expor dumps SQL.

---

# 33. Saída esperada desta skill

Ao aplicar esta skill, o Claude Code deve entregar uma ou mais destas saídas:

- classificação dos dados;
- classificação dos arquivos;
- recomendação de armazenamento;
- mapa de dados;
- matriz de permissões;
- estrutura de banco;
- estrutura de pastas;
- alerta de LGPD;
- plano de backup;
- plano de retenção;
- plano de upload seguro;
- plano de download privado;
- recomendação contra armazenamento inadequado;
- plano de migração de dados;
- checklist de segurança para arquivos.

---

# 34. Frase-guia da skill

> Dado e arquivo não são detalhe técnico: são responsabilidade. Antes de armazenar, classifique. Antes de expor, proteja. Antes de crescer, planeje. Antes de publicar, garanta que nada privado ficou público.

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
