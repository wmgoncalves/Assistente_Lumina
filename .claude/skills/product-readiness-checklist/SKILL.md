---
name: product-readiness-checklist
description: Validacao final de prontidao do produto (requisitos, visual, UX, mobile, funcional, conteudo, SEO, rastreamento, LGPD, seguranca, performance, infraestrutura, dados, deploy, documentacao). Define status: aprovado, aprovado com pendencias ou reprovado para producao. Use ao finalizar pagina, site, sistema, plataforma ou antes de entregar para cliente.
---
# 07 — Product Readiness Checklist

## Nome da skill

`07-product-readiness-checklist`

## Categoria

Checklist de entrega, qualidade de produto, validação final, QA, UX, responsividade, funcionalidade, SEO, rastreamento, LGPD, segurança, infraestrutura, documentação e aceite.

## Objetivo principal

Esta skill orienta o Claude Code a validar se um site, sistema, plataforma, landing page, painel administrativo, área logada ou produto digital está realmente pronto para entrega, homologação ou publicação em produção.

O objetivo é impedir que um projeto seja considerado “finalizado” apenas porque o código foi gerado ou o layout ficou bonito.

Um projeto só deve ser considerado pronto quando:

- funciona corretamente;
- está visualmente consistente;
- está responsivo;
- preserva requisitos;
- atende ao objetivo principal;
- possui CTAs funcionando;
- formulários foram testados;
- integrações foram validadas;
- SEO básico foi revisado;
- rastreamento foi conferido;
- LGPD e privacidade foram consideradas;
- segurança básica foi verificada;
- arquivos e dados estão protegidos;
- ambiente correto está configurado;
- backup e rollback foram considerados;
- documentação mínima existe;
- pendências estão claras.

A regra central é:

> Entrega pronta não é apenas código pronto. Entrega pronta é produto validado, testado, seguro, publicável, utilizável e alinhado aos requisitos.

---

# 1. Relação com as outras skills

Esta skill deve ser usada depois ou em conjunto com:

- `00-technical-governance-overview`
- `01-requirements-analysis`
- `02-versioning-change-control`
- `03-environment-strategy`
- `04-safe-deploy-hosting`
- `05-hosting-infrastructure-analysis`
- `06-storage-database-files`
- skills de segurança existentes
- skills de design existentes

## 1.1. Papel desta skill no pacote

As outras skills ajudam a planejar, versionar, hospedar, publicar e armazenar dados.

Esta skill responde:

> Está realmente pronto para entregar?

---

# 2. Quando usar esta skill

Use esta skill sempre que:

- finalizar uma página;
- finalizar um site;
- finalizar uma landing page;
- finalizar uma plataforma;
- finalizar uma funcionalidade;
- finalizar uma área logada;
- finalizar um painel;
- finalizar uma integração;
- finalizar um deploy;
- preparar entrega para cliente;
- preparar publicação;
- revisar homologação;
- revisar produção;
- validar produto digital;
- validar página de vendas;
- validar sistema interno;
- validar formulário;
- validar rastreamento;
- validar SEO;
- validar segurança básica;
- validar requisitos.

---

# 3. Regra principal

Antes de considerar uma entrega pronta, o Claude Code deve revisar o projeto em camadas:

1. Requisitos;
2. Visual;
3. UX;
4. Responsividade;
5. Funcionalidade;
6. Conteúdo;
7. SEO;
8. Rastreamento;
9. LGPD;
10. Segurança;
11. Performance;
12. Infraestrutura;
13. Dados e arquivos;
14. Deploy;
15. Documentação;
16. Pendências;
17. Critérios de aceite.

Não basta testar apenas o que foi alterado. Em mudanças médias, altas ou críticas, também é necessário testar o impacto nas partes relacionadas.

---

# 4. Classificação da entrega

Antes da checklist, classificar o tipo de entrega.

## 4.1. Entrega visual

Exemplos:

- nova seção;
- ajuste de layout;
- redesign;
- melhoria de responsividade;
- troca de imagens;
- alteração de identidade visual.

Foco da checklist:

- fidelidade ao design;
- responsividade;
- contraste;
- hierarquia;
- preservação de funcionalidade;
- performance de imagens.

## 4.2. Entrega funcional

Exemplos:

- formulário;
- filtro;
- busca;
- WhatsApp automático;
- login;
- painel;
- upload;
- API;
- integração.

Foco da checklist:

- fluxo completo;
- validação;
- erros;
- permissões;
- dados;
- segurança;
- rastreamento.

## 4.3. Entrega de conteúdo

Exemplos:

- páginas novas;
- textos;
- SEO;
- blog;
- páginas institucionais;
- políticas.

Foco da checklist:

- ortografia;
- clareza;
- hierarquia;
- SEO;
- links;
- consistência;
- marca.

## 4.4. Entrega de infraestrutura

Exemplos:

- deploy;
- hospedagem;
- banco;
- SSL;
- domínio;
- migração;
- ambiente de homologação.

Foco da checklist:

- ambiente correto;
- backup;
- rollback;
- segurança;
- DNS;
- SSL;
- banco;
- validação pós-deploy.

## 4.5. Entrega completa

Exemplos:

- site completo;
- plataforma;
- produto digital;
- sistema interno.

Foco da checklist:

- todas as camadas.

---

# 5. Checklist de requisitos

Antes de validar visual ou código, verificar se a entrega atende ao que foi pedido.

## 5.1. Perguntas

- O objetivo principal foi atendido?
- O público-alvo foi considerado?
- As funcionalidades obrigatórias foram entregues?
- As funcionalidades desejáveis foram separadas corretamente?
- As pendências foram documentadas?
- O projeto respeita as decisões anteriores?
- A arquitetura está compatível com o ambiente real?
- O que foi entregue corresponde ao escopo?
- Alguma funcionalidade foi criada sem necessidade?
- Alguma funcionalidade obrigatória ficou faltando?

## 5.2. Checklist

```md
## Requisitos

- [ ] Objetivo principal atendido.
- [ ] Público-alvo considerado.
- [ ] Escopo obrigatório entregue.
- [ ] Escopo desejável identificado.
- [ ] Pendências documentadas.
- [ ] Regras de negócio respeitadas.
- [ ] Restrições técnicas respeitadas.
- [ ] Decisões anteriores preservadas.
- [ ] Critérios de aceite revisados.
```

---

# 6. Checklist visual e identidade

## 6.1. Layout

Verificar:

- alinhamento;
- espaçamento;
- hierarquia visual;
- equilíbrio;
- grid;
- proporções;
- seções bem separadas;
- excesso de informação;
- consistência entre páginas;
- áreas de respiro;
- legibilidade.

## 6.2. Identidade visual

Verificar:

- logo correta;
- proporção da logo preservada;
- cores oficiais;
- fontes corretas;
- estilo compatível com a marca;
- ícones coerentes;
- imagens no padrão;
- botões consistentes;
- cards consistentes.

## 6.3. Checklist

```md
## Visual e identidade

- [ ] Layout está organizado.
- [ ] Hierarquia visual está clara.
- [ ] Espaçamentos estão consistentes.
- [ ] Logo está correta e sem distorção.
- [ ] Cores respeitam a identidade.
- [ ] Fontes respeitam a identidade.
- [ ] Botões seguem padrão.
- [ ] Cards seguem padrão.
- [ ] Ícones estão coerentes.
- [ ] Imagens estão proporcionais.
- [ ] Não há elementos apertados ou desalinhados.
- [ ] O design não prejudica a leitura.
```

---

# 7. Checklist de UX

## 7.1. Clareza

Verificar:

- o usuário entende o que fazer?
- o CTA principal está claro?
- a navegação está simples?
- a página tem excesso de opções?
- a ordem das informações faz sentido?
- os textos orientam a ação?
- mensagens de erro são claras?
- mensagens de sucesso são claras?

## 7.2. Conversão

Para sites comerciais e landing pages:

- CTA acima da dobra;
- CTA repetido quando necessário;
- benefícios claros;
- prova social, se houver;
- formulário simples;
- WhatsApp fácil;
- objeções respondidas;
- fluxo sem atrito.

## 7.3. Checklist

```md
## UX

- [ ] O objetivo da página é claro.
- [ ] O CTA principal é visível.
- [ ] A navegação é intuitiva.
- [ ] O fluxo tem começo, meio e fim.
- [ ] O usuário sabe qual ação tomar.
- [ ] O formulário não pede dados desnecessários.
- [ ] Mensagens de erro são compreensíveis.
- [ ] Mensagens de sucesso são compreensíveis.
- [ ] Não há excesso de cliques.
- [ ] Não há distrações prejudicando a conversão.
```

---

# 8. Checklist mobile e responsividade

A maioria dos projetos precisa funcionar muito bem no celular.

## 8.1. Verificar

- menu mobile;
- botões;
- formulários;
- textos;
- imagens;
- cards;
- tabelas;
- espaçamentos;
- modais;
- carrosséis;
- embeds;
- WhatsApp;
- performance;
- elementos fixos;
- rodapé.

## 8.2. Problemas comuns

- texto pequeno;
- botão pequeno;
- seção apertada;
- imagem cortada indevidamente;
- menu não abre;
- modal maior que a tela;
- tabela estoura a largura;
- CTA fica escondido;
- formulário difícil de preencher;
- header fixo cobre conteúdo;
- rodapé poluído.

## 8.3. Checklist

```md
## Mobile e responsividade

- [ ] Página funciona em celular.
- [ ] Página funciona em desktop.
- [ ] Menu mobile abre e fecha.
- [ ] Botões são fáceis de tocar.
- [ ] Textos têm tamanho legível.
- [ ] Imagens não distorcem.
- [ ] Cards empilham corretamente.
- [ ] Formulários são fáceis de preencher.
- [ ] Tabelas não quebram a largura.
- [ ] Modais cabem na tela.
- [ ] CTAs continuam visíveis.
- [ ] Não há rolagem horizontal indevida.
```

---

# 9. Checklist funcional

## 9.1. Links

Verificar:

- menu;
- rodapé;
- CTAs;
- links internos;
- links externos;
- links de telefone;
- links de e-mail;
- WhatsApp;
- download;
- redes sociais.

```md
## Links

- [ ] Menu funciona.
- [ ] Rodapé funciona.
- [ ] CTAs funcionam.
- [ ] Links externos abrem corretamente.
- [ ] Links internos apontam para URLs certas.
- [ ] Links de telefone estão corretos.
- [ ] Links de e-mail estão corretos.
- [ ] Links de WhatsApp estão corretos.
- [ ] Downloads funcionam.
```

## 9.2. Formulários

Verificar:

- campos obrigatórios;
- validação;
- máscara;
- mensagem de erro;
- mensagem de sucesso;
- envio;
- destino;
- e-mail;
- WhatsApp;
- banco;
- planilha;
- CRM;
- anti-spam;
- consentimento;
- rastreamento.

```md
## Formulários

- [ ] Campos obrigatórios validados.
- [ ] Campos opcionais funcionam.
- [ ] Máscaras funcionam.
- [ ] Mensagem de erro clara.
- [ ] Mensagem de sucesso clara.
- [ ] Envio funciona.
- [ ] Destino está correto.
- [ ] WhatsApp abre corretamente, se aplicável.
- [ ] E-mail chega corretamente, se aplicável.
- [ ] Dados são salvos corretamente, se aplicável.
- [ ] Proteção anti-spam considerada.
- [ ] Consentimento LGPD considerado.
- [ ] Evento de conversão testado.
```

## 9.3. WhatsApp

Verificar:

- número correto;
- DDI correto;
- mensagem preenchida;
- caracteres especiais;
- abertura no celular;
- abertura no desktop;
- rastreamento de clique;
- origem do formulário.

```md
## WhatsApp

- [ ] Número correto.
- [ ] DDI correto.
- [ ] Mensagem formatada.
- [ ] Campos do formulário entram na mensagem.
- [ ] Link funciona no celular.
- [ ] Link funciona no desktop.
- [ ] Clique é rastreável, se necessário.
```

## 9.4. Login e painel

Se houver área logada:

```md
## Login e painel

- [ ] Login com usuário válido funciona.
- [ ] Login com senha errada falha.
- [ ] Logout funciona.
- [ ] Página privada bloqueia visitante.
- [ ] Sessão expira ou é controlada.
- [ ] Permissões estão corretas.
- [ ] Usuário comum não acessa admin.
- [ ] Admin acessa recursos necessários.
- [ ] CRUD funciona.
- [ ] Mensagens de erro são seguras.
- [ ] Senhas não são exibidas.
```

## 9.5. Uploads

```md
## Uploads

- [ ] Tipos permitidos definidos.
- [ ] Arquivos inválidos bloqueados.
- [ ] Tamanho máximo definido.
- [ ] Arquivo é renomeado com segurança.
- [ ] Upload não permite execução de scripts.
- [ ] Arquivo fica no local correto.
- [ ] Arquivo privado não fica público.
- [ ] Exclusão funciona, se aplicável.
```

## 9.6. Busca e filtros

```md
## Busca e filtros

- [ ] Busca retorna resultados corretos.
- [ ] Filtro funciona.
- [ ] Estado vazio é tratado.
- [ ] Erros são tratados.
- [ ] Performance é aceitável.
- [ ] Mobile funciona.
```

---

# 10. Checklist de conteúdo

## 10.1. Texto

Verificar:

- ortografia;
- gramática;
- clareza;
- tom de voz;
- consistência;
- promessas;
- dados técnicos;
- informações legais;
- contatos;
- endereços;
- datas;
- nomes;
- cargos;
- números.

## 10.2. Conteúdo provisório

Remover:

- lorem ipsum;
- textos de exemplo;
- imagens placeholder;
- botões sem destino;
- links `#`;
- comentários visíveis;
- dados fictícios;
- banners de teste.

## 10.3. Checklist

```md
## Conteúdo

- [ ] Textos revisados.
- [ ] Ortografia revisada.
- [ ] Tom compatível com a marca.
- [ ] Informações de contato corretas.
- [ ] Nomes e cargos corretos.
- [ ] Datas corretas.
- [ ] Não há lorem ipsum.
- [ ] Não há placeholder visível.
- [ ] Não há botões sem destino.
- [ ] Não há links `#` em produção.
- [ ] Imagens finais foram usadas.
```

---

# 11. Checklist SEO

## 11.1. Básico

Verificar:

- title;
- meta description;
- H1;
- H2;
- URLs;
- alt;
- canonical;
- Open Graph;
- favicon;
- robots;
- sitemap.

```md
## SEO básico

- [ ] Title definido.
- [ ] Meta description definida.
- [ ] H1 único e claro.
- [ ] Headings em ordem lógica.
- [ ] URLs amigáveis.
- [ ] Imagens relevantes com alt.
- [ ] Canonical correto.
- [ ] Open Graph configurado.
- [ ] Favicon configurado.
- [ ] Sitemap revisado, se aplicável.
- [ ] Robots.txt revisado.
```

## 11.2. Produção

Verificar erro crítico:

```md
## SEO em produção

- [ ] Produção não está com `noindex` indevido.
- [ ] Robots.txt não bloqueia o site inteiro.
- [ ] Canonical aponta para domínio oficial.
- [ ] Sitemap usa URLs oficiais.
- [ ] Links internos não apontam para homologação.
```

## 11.3. Homologação

```md
## SEO em homologação

- [ ] Homologação está com `noindex`.
- [ ] Homologação não está no sitemap.
- [ ] Homologação não está linkada publicamente.
- [ ] Homologação está protegida, se possível.
```

---

# 12. Checklist de rastreamento

## 12.1. Ferramentas

Verificar conforme o projeto:

- Google Analytics;
- Google Tag Manager;
- Meta Pixel;
- eventos de conversão;
- eventos de WhatsApp;
- eventos de formulário;
- página de obrigado;
- UTMs;
- scripts de remarketing.

```md
## Rastreamento

- [ ] Google Analytics instalado, se aplicável.
- [ ] Google Tag Manager instalado, se aplicável.
- [ ] Meta Pixel instalado, se aplicável.
- [ ] Não há duplicidade de tags.
- [ ] Eventos principais configurados.
- [ ] Clique no WhatsApp rastreado, se necessário.
- [ ] Envio de formulário rastreado, se necessário.
- [ ] Página de obrigado funciona, se aplicável.
- [ ] UTMs são preservadas, se necessário.
- [ ] Homologação não dispara conversões reais.
```

## 12.2. Conversões principais

Para marketing e tráfego pago:

```md
## Conversões

- [ ] Lead enviado.
- [ ] Clique no WhatsApp.
- [ ] Clique no telefone.
- [ ] Clique no e-mail.
- [ ] Compra.
- [ ] Cadastro.
- [ ] Download.
- [ ] Inscrição.
```

---

# 13. Checklist LGPD e privacidade

## 13.1. Quando aplicar

Aplicar quando houver:

- formulário;
- cookies;
- Analytics;
- Pixel;
- login;
- cadastro;
- área logada;
- banco;
- upload;
- dados pessoais;
- dados sensíveis;
- remarketing;
- envio para terceiros.

## 13.2. Checklist

```md
## LGPD e privacidade

- [ ] Há política de privacidade.
- [ ] Há link para política no rodapé.
- [ ] Formulários informam finalidade.
- [ ] Campos coletam apenas o necessário.
- [ ] Consentimento foi considerado.
- [ ] Banner de cookies foi considerado.
- [ ] Dados pessoais estão protegidos.
- [ ] Dados sensíveis têm proteção reforçada.
- [ ] Acesso aos dados é restrito.
- [ ] Existe forma de atender solicitação de exclusão/correção, quando aplicável.
- [ ] Terceiros envolvidos foram considerados.
```

## 13.3. Dados sensíveis

Se houver dados sensíveis:

- revisar armazenamento;
- revisar permissões;
- revisar exposição;
- revisar backup;
- revisar retenção;
- revisar logs;
- revisar downloads;
- revisar ambiente de homologação.

---

# 14. Checklist de segurança

Esta checklist não substitui skills específicas de segurança. Ela é uma verificação final mínima.

## 14.1. Geral

```md
## Segurança geral

- [ ] HTTPS ativo.
- [ ] Arquivos `.env` não publicados.
- [ ] `.git` não publicado.
- [ ] Backups não estão públicos.
- [ ] Dumps SQL não estão públicos.
- [ ] Logs não estão públicos.
- [ ] Diretórios não listam arquivos.
- [ ] Debug desligado em produção.
- [ ] Erros técnicos não aparecem ao usuário.
- [ ] Credenciais não estão no frontend.
- [ ] Permissões de arquivos revisadas.
```

## 14.2. Formulários

```md
## Segurança de formulários

- [ ] Validação no front-end.
- [ ] Validação no back-end, se houver backend.
- [ ] Sanitização de entrada.
- [ ] Proteção contra spam avaliada.
- [ ] Mensagens de erro não expõem detalhes técnicos.
```

## 14.3. Banco

```md
## Segurança de banco

- [ ] Prepared statements usados.
- [ ] Credenciais protegidas.
- [ ] Erros SQL não aparecem em produção.
- [ ] Backup feito.
- [ ] Permissões mínimas consideradas.
```

## 14.4. Login

```md
## Segurança de login

- [ ] Senhas com hash seguro.
- [ ] Páginas privadas protegidas.
- [ ] Permissões respeitadas.
- [ ] Logout funciona.
- [ ] Sessão protegida.
- [ ] Mensagens de erro genéricas.
```

---

# 15. Checklist de performance

## 15.1. Básico

```md
## Performance

- [ ] Imagens otimizadas.
- [ ] Imagens em tamanho adequado.
- [ ] CSS sem excesso evidente.
- [ ] JavaScript sem excesso evidente.
- [ ] Scripts externos necessários.
- [ ] Vídeos não pesam carregamento inicial.
- [ ] Lazy loading considerado.
- [ ] Cache considerado.
- [ ] Mobile carrega de forma aceitável.
```

## 15.2. Problemas comuns

- imagem enorme usada como thumbnail;
- vídeo carregando automaticamente;
- carrossel pesado;
- bibliotecas desnecessárias;
- scripts duplicados;
- fontes externas demais;
- CSS não usado;
- plugin excessivo;
- embeds pesados.

---

# 16. Checklist de acessibilidade básica

## 16.1. Verificar

```md
## Acessibilidade básica

- [ ] Contraste adequado.
- [ ] Texto legível.
- [ ] Botões identificáveis.
- [ ] Links reconhecíveis.
- [ ] Imagens importantes com alt.
- [ ] Formulários têm labels ou identificação clara.
- [ ] Foco visual não foi removido indevidamente.
- [ ] Não depende apenas de cor para comunicar erro.
- [ ] Clique/toque tem tamanho adequado no mobile.
```

---

# 17. Checklist de infraestrutura

## 17.1. Hospedagem

```md
## Infraestrutura

- [ ] Hospedagem compatível com o projeto.
- [ ] PHP compatível, se aplicável.
- [ ] MySQL configurado, se aplicável.
- [ ] Node.js não é exigido em produção sem suporte.
- [ ] `public_html` correto.
- [ ] SSL ativo.
- [ ] Domínio correto.
- [ ] Subdomínios corretos.
- [ ] E-mails preservados.
- [ ] Limites de upload considerados.
- [ ] Espaço em disco considerado.
```

## 17.2. Ambientes

```md
## Ambientes

- [ ] Desenvolvimento separado.
- [ ] Homologação separada, se necessário.
- [ ] Produção validada.
- [ ] Homologação bloqueada contra indexação.
- [ ] Produção não bloqueada indevidamente.
- [ ] Configurações de ambiente corretas.
```

---

# 18. Checklist de dados e armazenamento

```md
## Dados e armazenamento

- [ ] Dados classificados.
- [ ] Dados pessoais protegidos.
- [ ] Dados sensíveis protegidos.
- [ ] Banco adequado ao projeto.
- [ ] Google Sheets não expõe dados indevidos.
- [ ] CSV/JSON público não contém dados privados.
- [ ] Uploads validados.
- [ ] Arquivos privados não estão públicos.
- [ ] Backups configurados.
- [ ] Retenção/exclusão considerada.
```

---

# 19. Checklist de deploy

```md
## Deploy

- [ ] Backup feito antes da publicação.
- [ ] Arquivos corretos enviados.
- [ ] Arquivos proibidos removidos.
- [ ] `.htaccess` preservado/revisado.
- [ ] Configuração de produção correta.
- [ ] Cache limpo, se necessário.
- [ ] Rollback definido.
- [ ] Validação pós-deploy feita.
```

---

# 20. Checklist de documentação

Mesmo projetos simples precisam de documentação mínima.

## 20.1. Documentar

- como publicar;
- onde estão arquivos;
- quais integrações existem;
- onde configurar WhatsApp;
- onde configurar e-mails;
- onde configurar tags;
- onde fica banco;
- como fazer backup;
- como restaurar;
- quais pendências existem.

## 20.2. Checklist

```md
## Documentação

- [ ] Estrutura de pastas explicada.
- [ ] Instruções de deploy registradas.
- [ ] Integrações documentadas.
- [ ] Credenciais não foram documentadas em local público.
- [ ] Configurações importantes registradas.
- [ ] Changelog atualizado, se aplicável.
- [ ] Pendências registradas.
- [ ] Critérios de aceite registrados.
```

---

# 21. Checklist de changelog

Para mudanças relevantes:

```md
## Changelog

- [ ] Versão identificada.
- [ ] Tipo de mudança descrito.
- [ ] Arquivos alterados listados.
- [ ] Itens preservados listados.
- [ ] Testes realizados/recomendados.
- [ ] Rollback descrito.
```

---

# 22. Critérios de aceite

Critérios de aceite devem ser objetivos.

## 22.1. Modelo geral

```md
## Critérios de aceite

A entrega será considerada pronta quando:

- [ ] O objetivo principal estiver atendido.
- [ ] As funcionalidades obrigatórias funcionarem.
- [ ] O layout estiver validado no desktop.
- [ ] O layout estiver validado no mobile.
- [ ] Formulários e CTAs estiverem funcionando.
- [ ] SEO básico estiver revisado.
- [ ] Rastreamento estiver conferido.
- [ ] Segurança básica estiver validada.
- [ ] LGPD estiver considerada.
- [ ] Deploy estiver validado.
- [ ] Pendências estiverem documentadas.
```

## 22.2. Critério de aceite para landing page

```md
A landing page será considerada pronta quando:

- [ ] CTA principal funciona.
- [ ] WhatsApp abre com mensagem correta.
- [ ] Formulário funciona, se houver.
- [ ] Pixel/eventos estão configurados.
- [ ] Página carrega bem no mobile.
- [ ] Conteúdo está revisado.
- [ ] Política de privacidade está acessível.
- [ ] Não há links quebrados.
```

## 22.3. Critério de aceite para área logada

```md
A área logada será considerada pronta quando:

- [ ] Login funciona.
- [ ] Logout funciona.
- [ ] Usuário sem login não acessa área privada.
- [ ] Permissões estão corretas.
- [ ] Dados aparecem corretamente.
- [ ] Senhas são protegidas.
- [ ] Erros não expõem informações técnicas.
- [ ] Backup do banco foi considerado.
```

## 22.4. Critério de aceite para painel admin

```md
O painel será considerado pronto quando:

- [ ] Admin consegue criar registros.
- [ ] Admin consegue editar registros.
- [ ] Admin consegue listar registros.
- [ ] Admin consegue inativar/excluir conforme regra.
- [ ] Usuário não autorizado não acessa.
- [ ] Validações funcionam.
- [ ] Dados são persistidos.
- [ ] Interface funciona no desktop e, se necessário, no mobile.
```

---

# 23. Níveis de aprovação

## 23.1. Aprovado

Tudo essencial funciona, sem pendências críticas.

## 23.2. Aprovado com pendências

Pode ir ao ar, mas existem pendências não críticas documentadas.

Exemplos:

- ajustar imagem secundária;
- incluir novo depoimento depois;
- melhorar texto de uma seção;
- adicionar animação futura.

## 23.3. Reprovado para produção

Não deve ir ao ar.

Motivos:

- formulário não funciona;
- produção está com `noindex`;
- login falha;
- dados privados expostos;
- SSL ausente;
- layout mobile quebrado;
- CTA principal quebrado;
- banco sem backup antes de alteração;
- erro crítico no console;
- pagamento não validado.

---

# 24. Modelo de relatório final de prontidão

```md
# Relatório de Prontidão do Produto

## Projeto

Nome:
Tipo:
Ambiente:
Versão:

## Status geral

[ ] Aprovado
[ ] Aprovado com pendências
[ ] Reprovado para produção

## 1. Requisitos

Resumo:
Pendências:

## 2. Visual e UX

Resumo:
Pendências:

## 3. Mobile

Resumo:
Pendências:

## 4. Funcionalidades

Resumo:
Pendências:

## 5. SEO

Resumo:
Pendências:

## 6. Rastreamento

Resumo:
Pendências:

## 7. LGPD e privacidade

Resumo:
Pendências:

## 8. Segurança

Resumo:
Pendências:

## 9. Infraestrutura e deploy

Resumo:
Pendências:

## 10. Dados e arquivos

Resumo:
Pendências:

## 11. Documentação

Resumo:
Pendências:

## Conclusão

[Descrever se está pronto, se pode ir para homologação, se pode ir para produção ou se precisa correção antes.]
```

---

# 25. Modelo de resposta curta ao finalizar uma alteração

```md
## Validação final

Status:
- Aprovado com pendências leves

Verificado:
- Layout desktop
- Layout mobile
- Links principais
- CTA de WhatsApp
- SEO básico
- Arquivos publicados
- Ausência de arquivos sensíveis

Pendências:
- Validar evento do Meta Pixel após publicação
- Revisar texto final da seção FAQ
```

---

# 26. Modelo de resposta quando não está pronto

```md
## Status da entrega

Ainda não recomendo publicar em produção.

Motivos:
- O formulário principal ainda não foi validado.
- O ambiente de homologação está sem proteção contra indexação.
- A produção pode ficar com `noindex` se os arquivos forem copiados como estão.
- Não há rollback definido.

Próximo passo seguro:
1. Corrigir configuração de ambiente.
2. Testar formulário.
3. Fazer backup.
4. Validar SEO e rastreamento.
5. Só então publicar.
```

---

# 27. Erros que esta skill deve evitar

O Claude Code não deve:

- considerar pronto só porque gerou código;
- ignorar mobile;
- ignorar formulário;
- ignorar WhatsApp;
- ignorar SEO;
- ignorar rastreamento;
- ignorar LGPD;
- ignorar segurança;
- ignorar backup;
- ignorar rollback;
- ignorar ambiente;
- ignorar arquivos privados;
- ignorar dados sensíveis;
- ignorar documentação;
- entregar com lorem ipsum;
- entregar com links `#`;
- entregar com `noindex` em produção;
- entregar homologação indexável;
- entregar sem testar CTA principal;
- entregar sem validar login;
- entregar sem validar permissões;
- entregar sem conferir console;
- entregar sem registrar pendências.

---

# 28. Saída esperada desta skill

Ao aplicar esta skill, o Claude Code deve entregar uma ou mais destas saídas:

- checklist de requisitos;
- checklist visual;
- checklist mobile;
- checklist funcional;
- checklist SEO;
- checklist de rastreamento;
- checklist LGPD;
- checklist de segurança;
- checklist de performance;
- checklist de infraestrutura;
- checklist de dados;
- checklist de deploy;
- relatório de prontidão;
- critérios de aceite;
- lista de pendências;
- status de aprovação;
- recomendação de próxima etapa.

---

# 29. Frase-guia da skill

> Produto pronto é produto que atende ao objetivo, funciona no uso real, respeita requisitos, protege dados, carrega bem, converte corretamente, pode ser publicado com segurança e deixa claro o que ainda está pendente.

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
