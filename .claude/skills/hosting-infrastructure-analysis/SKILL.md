---
name: hosting-infrastructure-analysis
description: Analise de hospedagem (compartilhada vs VPS vs Cloud) e infraestrutura conforme requisitos reais. Evita Cloud sem necessidade ou hospedagem compartilhada para projeto que nao suporta. Considera dados, trafego, custo, manutencao, LGPD, e-mail e backup. Use ao decidir onde hospedar ou se a hospedagem atual atende.
---
# 05 — Hosting and Infrastructure Analysis

## Nome da skill

`05-hosting-infrastructure-analysis`

## Categoria

Hospedagem, infraestrutura, Cloud, VPS, hospedagem compartilhada, escalabilidade, custos, recursos técnicos, compatibilidade, operação e manutenção.

## Objetivo principal

Esta skill orienta o Claude Code a analisar qual infraestrutura é adequada para um projeto digital antes de definir arquitetura, banco de dados, armazenamento, deploy ou contratação de recursos.

Ela deve ser usada sempre que o projeto envolver:

- escolha de hospedagem;
- avaliação de HostGator, cPanel ou hospedagem compartilhada;
- necessidade de VPS;
- necessidade de Cloud;
- banco de dados;
- storage de arquivos;
- upload;
- vídeos;
- sistema com login;
- painel administrativo;
- API;
- plataforma;
- produto digital;
- tráfego pago;
- muitos acessos;
- escalabilidade;
- custo mensal;
- segurança operacional;
- manutenção.

O objetivo é evitar dois erros comuns:

1. Usar uma hospedagem simples demais para um projeto que precisa de estrutura robusta.
2. Contratar Cloud, VPS ou serviços caros sem necessidade real.

A regra central é:

> A infraestrutura deve ser escolhida pelo requisito real do projeto, não por modismo técnico. Primeiro entenda o uso, os dados, o tráfego, a segurança, o orçamento e a capacidade de manutenção; depois escolha a hospedagem.

---

# 1. Relação com as outras skills

Esta skill deve seguir:

- `00-technical-governance-overview`
- `01-requirements-analysis`
- `02-versioning-change-control`
- `03-environment-strategy`
- `04-safe-deploy-hosting`
- `06-storage-database-files`
- `07-product-readiness-checklist`
- skills de segurança existentes

## 1.1. Prioridade

Em caso de conflito:

1. Segurança;
2. Dados e LGPD;
3. Compatibilidade com o ambiente real;
4. Estabilidade;
5. Custo controlado;
6. Facilidade de manutenção;
7. Escalabilidade;
8. Conveniência técnica;
9. Modernidade da stack.

---

# 2. Regra principal desta skill

Antes de recomendar uma hospedagem, servidor, Cloud, banco, storage ou serviço pago, o Claude Code deve justificar a escolha com base em requisitos concretos.

Não basta dizer:

> “Use Cloud porque é mais moderno.”

A resposta correta deve analisar:

- tipo de projeto;
- número estimado de usuários;
- volume de acessos;
- necessidade de login;
- necessidade de banco;
- necessidade de upload;
- necessidade de vídeos;
- criticidade dos dados;
- orçamento;
- conhecimento técnico para manutenção;
- ambiente de deploy;
- backups;
- segurança;
- escalabilidade;
- custo mensal;
- complexidade operacional.

---

# 3. Quando esta skill deve ser usada

Use esta skill quando o usuário perguntar ou o projeto exigir decisão sobre:

- onde hospedar;
- se HostGator serve;
- se precisa de Cloud;
- se precisa de VPS;
- se precisa de banco;
- se precisa de storage;
- se precisa contratar mais recursos;
- se precisa CDN;
- se precisa servidor dedicado;
- se pode usar Google Sheets;
- se pode usar MySQL;
- se precisa PostgreSQL;
- se precisa Firebase;
- se precisa Supabase;
- se precisa bucket de arquivos;
- se precisa escalar;
- se a hospedagem atual aguenta;
- se o projeto será publicado em `public_html`;
- se a aplicação precisa de Node.js em produção;
- se o backend pode ser PHP;
- se uma plataforma pode rodar em hospedagem compartilhada.

---

# 4. Diagnóstico inicial de infraestrutura

Antes de recomendar qualquer tecnologia, o Claude Code deve responder:

## 4.1. Sobre o projeto

- É site institucional?
- É landing page?
- É sistema interno?
- É plataforma?
- É produto digital?
- É portal de documentos?
- É área logada?
- É e-commerce?
- É app web?
- É apenas frontend?
- Precisa de backend?
- Precisa de banco?
- Precisa de upload?
- Precisa de pagamento?
- Precisa de muitos usuários simultâneos?

## 4.2. Sobre o tráfego

- Quantos acessos por mês são esperados?
- Quantos acessos simultâneos são esperados?
- Haverá tráfego pago?
- Haverá picos de campanha?
- O site precisa carregar rápido em celular?
- O público é local, nacional ou internacional?
- Haverá arquivos pesados?
- Haverá download de PDFs, vídeos ou imagens grandes?

## 4.3. Sobre dados

- Quais dados serão salvos?
- São dados pessoais?
- São dados sensíveis?
- São dados financeiros?
- São dados de saúde?
- São documentos privados?
- Precisam de backup?
- Precisam de controle de acesso?
- Precisam de criptografia?
- Precisam de retenção e exclusão?

## 4.4. Sobre operação

- Quem vai manter?
- Existe equipe técnica?
- O usuário terá acesso ao cPanel?
- Existe acesso SSH?
- Existe domínio configurado?
- Existe e-mail no domínio?
- Existe backup automático?
- Existe suporte da hospedagem?
- O deploy será manual?
- O deploy será via Git?
- O deploy será via File Manager?
- O projeto precisa ser simples de manter?

## 4.5. Sobre custo

- Há orçamento mensal?
- Pode contratar Cloud?
- Pode contratar VPS?
- Pode contratar storage?
- Pode contratar CDN?
- Pode contratar banco gerenciado?
- O custo precisa ser mínimo?
- O custo pode crescer com uso?
- Existe risco de cobrança inesperada?

---

# 5. Classificação de projetos por infraestrutura

## 5.1. Site institucional simples

Exemplos:

- site de empresa;
- página sobre serviços;
- contato via WhatsApp;
- formulário simples;
- páginas estáticas;
- SEO básico.

Infraestrutura recomendada:

- hospedagem compartilhada;
- HTML/CSS/JS;
- PHP leve se precisar de formulário;
- MySQL apenas se realmente necessário.

Normalmente não precisa de:

- Cloud;
- VPS;
- Node.js em produção;
- banco avançado;
- storage externo;
- arquitetura complexa.

## 5.2. Landing page de campanha

Exemplos:

- página de venda;
- página de captura;
- página para tráfego pago;
- CTA para WhatsApp;
- formulário simples.

Infraestrutura recomendada:

- hospedagem compartilhada ou deploy estático;
- foco em velocidade;
- rastreamento correto;
- SSL;
- cache;
- imagens otimizadas.

Atenção:

- Meta Pixel;
- Google Tag Manager;
- eventos de conversão;
- página de obrigado;
- LGPD;
- estabilidade em picos de campanha.

## 5.3. Site com blog ou conteúdo frequente

Infraestrutura possível:

- WordPress em hospedagem compartilhada;
- site estático com CMS externo;
- PHP + MySQL;
- plataforma de blog.

Avaliar:

- frequência de publicação;
- SEO;
- usuários editores;
- segurança de plugins;
- backup;
- performance;
- cache.

## 5.4. Sistema interno simples

Exemplos:

- cadastro interno;
- painel simples;
- controle de registros;
- relatórios básicos;
- substituição de planilha.

Infraestrutura possível:

- PHP + MySQL em hospedagem compartilhada;
- VPS pequena se precisar mais controle;
- Supabase/Firebase se fizer sentido.

Avaliar:

- login;
- permissões;
- backup;
- dados pessoais;
- volume de uso;
- segurança.

## 5.5. Plataforma com usuários

Exemplos:

- alunos;
- clientes;
- área restrita;
- cursos;
- materiais;
- certificados;
- progresso.

Infraestrutura possível:

- PHP + MySQL para MVP simples;
- VPS para mais controle;
- Cloud/Supabase/Firebase para autenticação e escala;
- storage externo para arquivos pesados.

Avaliar obrigatoriamente:

- autenticação;
- permissões;
- banco;
- storage;
- backup;
- dados pessoais;
- LGPD;
- escalabilidade;
- suporte;
- custo.

## 5.6. Plataforma com vídeos

Vídeos não devem ser hospedados diretamente em hospedagem compartilhada sem análise.

Opções:

- YouTube não listado;
- Vimeo;
- plataforma de vídeo;
- storage/CDN;
- serviço de streaming.

Evitar:

- subir vídeos pesados no `public_html`;
- usar hospedagem compartilhada como servidor de streaming;
- consumir banda sem controle;
- deixar vídeos privados acessíveis por URL pública.

## 5.7. Sistema com uploads

Uploads exigem infraestrutura mais cuidadosa.

Avaliar:

- tipo de arquivo;
- tamanho máximo;
- volume total;
- acesso público ou privado;
- antivírus;
- backup;
- storage;
- bloqueio de execução;
- LGPD.

Hospedagem compartilhada pode servir para uploads pequenos e simples, mas não para grande volume ou arquivos sensíveis sem proteção.

## 5.8. E-commerce ou pagamento

Avaliar:

- gateway;
- SSL;
- webhooks;
- segurança;
- LGPD;
- estabilidade;
- rastreamento;
- backup;
- antifraude;
- suporte.

Pode usar plataformas prontas quando fizer sentido.

Não improvisar pagamento sem requisitos claros.

## 5.9. SaaS ou aplicação crítica

Exige análise robusta.

Normalmente precisa de:

- Cloud ou VPS;
- banco gerenciado ou bem administrado;
- backup automatizado;
- monitoramento;
- autenticação forte;
- logs;
- storage;
- escalabilidade;
- controle de custos;
- plano de disponibilidade.

---

# 6. Opções de hospedagem

## 6.1. Hospedagem compartilhada

### Quando é indicada

Boa para:

- sites institucionais;
- landing pages;
- páginas de vendas;
- blogs pequenos;
- formulários simples;
- PHP leve;
- MySQL simples;
- projetos com baixo ou médio tráfego;
- projetos com deploy manual via cPanel;
- projetos com orçamento reduzido.

### Vantagens

- custo baixo;
- fácil acesso;
- cPanel;
- e-mail incluso em muitos planos;
- PHP e MySQL disponíveis;
- SSL simples;
- deploy via File Manager;
- boa para clientes pequenos e médios.

### Limitações

- pouco controle do servidor;
- limites de CPU e memória;
- limitações de processos longos;
- Node.js pode não estar disponível;
- tarefas em tempo real são difíceis;
- escalabilidade limitada;
- uploads grandes podem ser problema;
- APIs pesadas podem ser problema;
- pouca flexibilidade para stacks modernas.

### Cuidados

- proteger arquivos sensíveis;
- não subir backups públicos;
- preservar `.htaccess`;
- revisar permissões;
- evitar scripts pesados;
- otimizar imagens;
- usar PHP compatível;
- fazer backup manual quando necessário.

## 6.2. VPS

### Quando é indicada

Boa para:

- sistemas com backend próprio;
- APIs;
- aplicações com mais controle;
- múltiplos projetos;
- jobs agendados;
- Node.js em produção;
- Python;
- Docker simples;
- bancos maiores;
- necessidades específicas de servidor.

### Vantagens

- mais controle;
- configurações personalizadas;
- suporte a Node/Python/etc.;
- melhor isolamento;
- mais flexibilidade;
- escalabilidade vertical.

### Limitações

- exige manutenção;
- exige segurança ativa;
- exige atualização de sistema;
- exige configuração de firewall;
- exige backup configurado;
- exige monitoramento;
- pode dar mais trabalho.

### Cuidados

- configurar firewall;
- configurar SSH seguro;
- atualizar sistema;
- configurar SSL;
- configurar backups;
- proteger banco;
- configurar logs;
- monitorar recursos.

## 6.3. Cloud

### Quando é indicada

Boa para:

- plataformas escaláveis;
- muitos usuários;
- alta disponibilidade;
- storage grande;
- banco gerenciado;
- filas;
- processamento;
- aplicações críticas;
- crescimento previsto;
- times técnicos.

### Vantagens

- escalabilidade;
- serviços gerenciados;
- storage robusto;
- banco gerenciado;
- CDN;
- monitoramento;
- alta disponibilidade.

### Limitações

- custo pode crescer;
- complexidade maior;
- exige arquitetura;
- exige controle de permissões;
- exige monitoramento de custos;
- pode ser exagero para sites simples.

### Cuidados

- configurar alertas de custo;
- limitar permissões;
- proteger buckets;
- configurar backup;
- revisar regras de firewall;
- separar ambientes;
- documentar arquitetura;
- não deixar recursos esquecidos.

## 6.4. Deploy estático

Exemplos de uso:

- sites HTML/CSS/JS;
- landing pages;
- documentação;
- páginas institucionais;
- portfólios.

Vantagens:

- rápido;
- seguro;
- baixo custo;
- simples;
- escalável para conteúdo estático.

Limitações:

- sem backend nativo;
- formulários dependem de serviço externo ou backend;
- login real exige serviço adicional;
- banco exige integração externa.

## 6.5. Backend as a Service

Exemplos conceituais:

- Firebase;
- Supabase;
- serviços de autenticação;
- bancos gerenciados.

Bom para:

- autenticação;
- banco em tempo real;
- MVPs;
- apps modernos;
- reduzir backend manual.

Cuidados:

- regras de segurança;
- controle de custos;
- dependência externa;
- permissões;
- backup;
- LGPD;
- chaves públicas e privadas.

---

# 7. Compatibilidade com HostGator/cPanel/public_html

Quando o usuário não especificar outra infraestrutura, e principalmente para projetos simples e médios, o Claude Code deve priorizar compatibilidade com hospedagem compartilhada.

## 7.1. Arquitetura padrão recomendada

- frontend estático;
- PHP leve quando necessário;
- MySQL quando banco for necessário;
- estrutura publicável via `public_html`;
- sem Node.js em produção, salvo confirmação;
- sem dependências complexas;
- sem serviços permanentes em segundo plano;
- sem build obrigatório no servidor;
- sem arquitetura Cloud desnecessária.

## 7.2. Projetos adequados para esse padrão

- sites institucionais;
- landing pages;
- páginas de venda;
- formulários para WhatsApp;
- formulários por e-mail;
- blogs pequenos;
- painéis simples;
- cadastros simples;
- produtos digitais simples;
- áreas restritas pequenas.

## 7.3. Projetos que exigem cautela nesse padrão

- plataforma de cursos com muitos alunos;
- vídeos hospedados diretamente;
- uploads grandes;
- sistema com muitos usuários simultâneos;
- API pesada;
- relatórios complexos;
- tarefas automáticas frequentes;
- notificações em tempo real;
- chat;
- SaaS;
- multiempresa;
- e-commerce grande.

---

# 8. Critérios para recomendar hospedagem compartilhada

Recomendar hospedagem compartilhada quando:

- o projeto é simples ou médio;
- o orçamento é limitado;
- o tráfego é baixo ou moderado;
- não há necessidade de Node.js em produção;
- PHP + MySQL atende;
- o deploy manual é aceitável;
- não há grande volume de uploads;
- não há processamento pesado;
- não há usuários simultâneos em grande quantidade;
- não há necessidade de alta disponibilidade.

## 8.1. Alerta

Hospedagem compartilhada não deve ser tratada como Cloud.

Não exigir dela:

- processamento pesado;
- filas complexas;
- streaming de vídeo;
- muitos jobs simultâneos;
- APIs de alta demanda;
- escalabilidade automática;
- execução contínua de processos;
- armazenamento massivo.

---

# 9. Critérios para recomendar VPS

Recomendar VPS quando:

- precisa de Node.js em produção;
- precisa de backend próprio;
- precisa de controle de servidor;
- precisa de jobs agendados mais robustos;
- precisa de API persistente;
- precisa configurar serviços customizados;
- precisa de mais performance que hospedagem compartilhada;
- precisa isolar projetos;
- precisa configurar Nginx/Apache de forma específica.

## 9.1. Não recomendar VPS quando

- o projeto é simples;
- não há conhecimento para manter;
- não há backup planejado;
- não há necessidade real;
- o custo e complexidade não se justificam.

---

# 10. Critérios para recomendar Cloud

Recomendar Cloud quando:

- o projeto precisa escalar;
- haverá muitos usuários;
- haverá muitos acessos simultâneos;
- há necessidade de alta disponibilidade;
- há storage grande;
- há banco gerenciado;
- há filas;
- há processamento;
- há múltiplos serviços;
- há necessidade de arquitetura profissional;
- há orçamento e capacidade de manutenção.

## 10.1. Não recomendar Cloud quando

- é apenas site institucional;
- é landing page simples;
- é página de venda sem backend;
- é formulário simples;
- o orçamento é baixo;
- o usuário não quer complexidade;
- não há necessidade de escala;
- a hospedagem compartilhada resolve.

## 10.2. Controle de custos

Sempre que sugerir Cloud, considerar:

- custo mensal mínimo;
- custo por tráfego;
- custo por storage;
- custo por banco;
- custo por requisição;
- custo por backup;
- custo por logs;
- custo por CDN;
- risco de cobrança inesperada.

---

# 11. Critérios para recomendar storage externo

Recomendar storage externo quando houver:

- muitos arquivos;
- arquivos grandes;
- vídeos;
- documentos privados;
- downloads frequentes;
- necessidade de CDN;
- separação entre app e arquivos;
- crescimento previsto;
- backup e disponibilidade;
- controle de acesso por URL assinada.

## 11.1. Não usar storage externo quando

- há poucos arquivos públicos;
- imagens são pequenas;
- PDFs são leves;
- hospedagem atual atende;
- custo e complexidade não se justificam.

---

# 12. Critérios para CDN

CDN pode ser útil quando:

- há público geograficamente distribuído;
- imagens pesadas;
- muitos acessos;
- tráfego pago;
- necessidade de performance;
- proteção básica contra picos;
- cache de assets.

CDN pode ser desnecessária quando:

- site é pequeno;
- público é local;
- tráfego é baixo;
- hospedagem entrega bem;
- imagens já estão otimizadas.

---

# 13. Banco de dados e infraestrutura

## 13.1. MySQL

Boa opção para:

- hospedagem compartilhada;
- PHP;
- painéis simples;
- formulários com histórico;
- cadastros;
- produtos digitais;
- áreas logadas pequenas e médias.

## 13.2. PostgreSQL

Boa opção para:

- aplicações mais robustas;
- sistemas maiores;
- dados relacionais complexos;
- ambientes Cloud/VPS;
- consultas avançadas.

## 13.3. Firebase/Supabase

Bons para:

- autenticação;
- apps modernos;
- MVPs;
- tempo real;
- APIs rápidas;
- reduzir backend customizado.

Cuidados:

- regras de segurança;
- custos;
- backup;
- permissões;
- dependência externa.

## 13.4. Google Sheets

Pode ser usado para:

- listas públicas;
- protótipos;
- administração simples;
- conteúdo leve;
- ofertas;
- catálogos pequenos.

Não usar como banco seguro para:

- dados sensíveis;
- dados financeiros;
- dados de saúde;
- autenticação;
- permissões;
- sistema crítico.

---

# 14. E-mail e hospedagem

Muitas hospedagens compartilhadas incluem e-mail.

Antes de migrar ou alterar DNS, verificar:

- MX;
- SPF;
- DKIM;
- DMARC;
- contas existentes;
- webmail;
- redirecionamentos;
- envio por formulário;
- SMTP.

## 14.1. Risco

Migrar site sem preservar DNS de e-mail pode derrubar e-mails do domínio.

---

# 15. SSL

Todo projeto em produção deve usar HTTPS.

Verificar:

- certificado ativo;
- renovação automática;
- subdomínios;
- redirects;
- conteúdo misto;
- APIs com HTTPS;
- formulários seguros.

---

# 16. Backup

Infraestrutura adequada precisa de backup.

## 16.1. Tipos de backup

- arquivos do site;
- banco de dados;
- uploads;
- configurações;
- DNS;
- e-mails;
- logs importantes;
- storage.

## 16.2. Frequência

Depende do projeto:

### Site estático

- backup antes de alterações;
- backup após grandes versões.

### Site com formulário e banco

- backup regular do banco;
- backup antes de deploy.

### Plataforma com usuários

- backup automático diário ou mais frequente;
- política de retenção;
- teste de restauração.

### Sistema crítico

- backup frequente;
- cópia externa;
- monitoramento;
- plano de desastre.

---

# 17. Monitoramento

Projetos simples podem exigir monitoramento mínimo.

Projetos maiores precisam de mais controle.

## 17.1. Monitoramento básico

- site online;
- SSL válido;
- formulário funcionando;
- erros críticos;
- espaço em disco;
- uso de banco.

## 17.2. Monitoramento avançado

- CPU;
- memória;
- logs;
- filas;
- banco;
- latência;
- erros 500;
- uptime;
- custos Cloud;
- ataques;
- tentativas de login.

---

# 18. Segurança de infraestrutura

Avaliar:

- firewall;
- permissões;
- SSH;
- FTP/SFTP;
- senhas;
- usuários do cPanel;
- banco exposto;
- backups públicos;
- logs públicos;
- listagem de diretórios;
- uploads executáveis;
- credenciais no código;
- dependências vulneráveis.

## 18.1. Regra

Infraestrutura mais avançada exige mais responsabilidade.

Cloud e VPS não são automaticamente mais seguros; eles precisam ser configurados corretamente.

---

# 19. Escalabilidade

Antes de falar em escala, entender o crescimento esperado.

## 19.1. Escala vertical

Aumentar recursos do servidor:

- CPU;
- memória;
- disco.

Boa para crescimento simples.

## 19.2. Escala horizontal

Adicionar múltiplas instâncias, balanceamento, storage separado.

Boa para aplicações maiores.

## 19.3. Escala desnecessária

Não criar arquitetura complexa para projeto que ainda não validou uso real.

Para MVP, simplicidade costuma ser melhor.

---

# 20. Performance

Infraestrutura ajuda, mas não substitui otimização.

Antes de trocar de hospedagem, verificar:

- imagens pesadas;
- CSS excessivo;
- JS pesado;
- plugins demais;
- banco sem índice;
- cache ausente;
- servidor lento;
- scripts externos;
- vídeos carregando direto.

## 20.1. Regra

Não culpar hospedagem antes de revisar problemas básicos de performance.

---

# 21. Matriz de recomendação rápida

```md
| Tipo de projeto | Infraestrutura inicial recomendada | Observação |
|---|---|---|
| Landing page simples | Estático ou hospedagem compartilhada | Foco em velocidade e tracking |
| Site institucional | Hospedagem compartilhada | PHP leve se precisar |
| Site com blog pequeno | WordPress ou PHP/MySQL | Cuidar de plugins e backup |
| Sistema interno simples | PHP + MySQL | Pode rodar em cPanel |
| Painel admin simples | PHP + MySQL | Exige login seguro |
| Plataforma de cursos MVP | PHP + MySQL ou BaaS | Avaliar vídeos e acesso |
| Plataforma com muitos usuários | VPS/Cloud | Exige backup e monitoramento |
| Uploads grandes | Storage externo | Não sobrecarregar hospedagem |
| Vídeos | Plataforma de vídeo/CDN | Evitar public_html |
| SaaS | Cloud/VPS bem arquitetado | Exige operação contínua |
```

---

# 22. Análise de custo

Toda recomendação de infraestrutura deve considerar custo.

## 22.1. Custos diretos

- hospedagem;
- VPS;
- Cloud;
- banco;
- storage;
- CDN;
- e-mail;
- backup;
- domínio;
- SSL, se pago;
- monitoramento;
- serviço de vídeo.

## 22.2. Custos indiretos

- manutenção;
- configuração;
- atualizações;
- segurança;
- suporte;
- tempo técnico;
- complexidade;
- treinamento;
- risco de erro.

## 22.3. Regra

A solução mais barata tecnicamente pode sair cara em manutenção.

A solução mais robusta pode ser desperdício se o projeto não precisa.

---

# 23. Quando contratar mais recursos

Contratar mais recursos quando houver evidência ou requisito claro.

Exemplos:

- site lento por limite real de servidor;
- alto volume de tráfego;
- banco crescendo;
- uploads excedendo espaço;
- muitos usuários simultâneos;
- necessidade de API;
- hospedagem não suporta tecnologia necessária;
- risco de indisponibilidade;
- necessidade de backup profissional;
- necessidade de storage privado.

## 23.1. Quando não contratar ainda

Não contratar quando:

- o projeto ainda é MVP simples;
- o problema é imagem pesada;
- o problema é código ruim;
- o problema é plugin excessivo;
- o problema é falta de cache;
- o tráfego é baixo;
- a funcionalidade pode ser simplificada;
- uma solução PHP/MySQL atende.

---

# 24. Sinais de que a hospedagem atual pode não servir

- erros 500 frequentes;
- limite de CPU atingido;
- site cai em campanha;
- uploads falham;
- banco lento;
- processos finalizados;
- falta de suporte a tecnologia necessária;
- sem cron adequado;
- sem acesso a configurações necessárias;
- espaço insuficiente;
- e-mail instável;
- backup insuficiente;
- segurança limitada para o tipo de dado.

---

# 25. Sinais de que Cloud/VPS seria exagero

- projeto é apenas institucional;
- tráfego é baixo;
- não há login;
- não há banco crítico;
- não há upload relevante;
- não há API;
- o usuário não quer manutenção;
- orçamento é limitado;
- deploy manual resolve;
- PHP leve resolve;
- site estático resolve.

---

# 26. Perguntas que o Claude Code deve fazer apenas quando necessário

Evitar perguntas excessivas. Mas perguntar quando a decisão impactar:

- custo mensal;
- segurança;
- dados sensíveis;
- arquitetura difícil de mudar;
- login;
- pagamento;
- upload;
- Cloud;
- VPS;
- migração;
- DNS;
- e-mail.

Exemplos de perguntas úteis:

```md
Antes de recomendar Cloud ou VPS, preciso confirmar uma coisa: esse projeto terá usuários logados e upload de arquivos privados, ou será apenas site institucional com formulário?
```

```md
A hospedagem final será HostGator/cPanel com public_html? Isso muda a arquitetura, porque nesse caso é melhor evitar Node.js em produção e priorizar HTML/PHP/MySQL.
```

---

# 27. Modelo de análise de infraestrutura

```md
# Análise de Hospedagem e Infraestrutura

## 1. Tipo de projeto

[Site institucional / Landing page / Sistema / Plataforma / Produto digital]

## 2. Requisitos técnicos

- Frontend:
- Backend:
- Banco:
- Upload:
- Login:
- Pagamento:
- Integrações:

## 3. Volume esperado

- Acessos mensais:
- Usuários simultâneos:
- Arquivos:
- Dados:
- Picos:

## 4. Dados e segurança

- Tipo de dados:
- Sensibilidade:
- Controle de acesso:
- LGPD:
- Backup:

## 5. Opções avaliadas

### Hospedagem compartilhada
Vantagens:
Riscos:
Indicação:

### VPS
Vantagens:
Riscos:
Indicação:

### Cloud
Vantagens:
Riscos:
Indicação:

## 6. Recomendação

Infraestrutura recomendada:
Justificativa:
Custo/complexidade:
Plano de evolução:

## 7. Próximos passos

- [Item 1]
- [Item 2]
```

---

# 28. Modelo de recomendação simples

```md
Pelo tipo de projeto, a recomendação inicial é manter uma estrutura simples:

- Frontend estático;
- PHP leve apenas se precisar processar formulário;
- MySQL somente se houver necessidade real de salvar dados;
- Deploy em `public_html`;
- Sem Node.js em produção;
- Sem Cloud neste primeiro momento.

Motivo:
O projeto não exige usuários simultâneos em grande volume, upload pesado, streaming, API complexa ou alta disponibilidade. Assim, Cloud agora adicionaria custo e complexidade sem benefício proporcional.
```

---

# 29. Modelo de recomendação para Cloud/VPS

```md
Neste caso, hospedagem compartilhada pode ser limitada.

Motivos:
- haverá usuários logados;
- haverá upload de arquivos;
- haverá banco com dados importantes;
- haverá painel administrativo;
- o projeto pode crescer;
- será necessário controle maior de segurança e backup.

Recomendação:
Avaliar VPS ou Cloud com:
- banco separado;
- storage para arquivos;
- backup automático;
- SSL;
- monitoramento;
- ambiente de homologação;
- controle de custos.
```

---

# 30. Erros que esta skill deve evitar

O Claude Code não deve:

- recomendar Cloud sem necessidade;
- recomendar VPS sem considerar manutenção;
- recomendar hospedagem compartilhada para sistema crítico sem alerta;
- ignorar limites do `public_html`;
- assumir que Node.js roda em qualquer hospedagem;
- assumir que Google Sheets é banco seguro;
- hospedar vídeos pesados em servidor compartilhado sem análise;
- armazenar documentos privados em pasta pública;
- esquecer custos recorrentes;
- esquecer backup;
- esquecer SSL;
- esquecer e-mails ao mudar DNS;
- ignorar LGPD;
- ignorar monitoramento;
- escolher tecnologia antes de entender requisitos;
- criar arquitetura complexa para MVP simples.

---

# 31. Saída esperada desta skill

Ao aplicar esta skill, o Claude Code deve entregar uma ou mais destas saídas:

- diagnóstico da hospedagem atual;
- recomendação de infraestrutura;
- comparação entre hospedagem compartilhada, VPS e Cloud;
- análise de custo e complexidade;
- limites da hospedagem atual;
- riscos de infraestrutura;
- plano de evolução;
- requisitos mínimos de servidor;
- recomendação de banco;
- recomendação de storage;
- recomendação de backup;
- orientação de monitoramento;
- alerta sobre tecnologias incompatíveis.

---

# 32. Frase-guia da skill

> Infraestrutura boa é aquela que atende ao projeto real com segurança, estabilidade, custo controlado e manutenção possível. Nem tudo precisa de Cloud; nem tudo cabe em hospedagem simples. A decisão certa vem dos requisitos, não da moda.

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
