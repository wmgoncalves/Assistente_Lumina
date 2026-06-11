---
name: wordpress-plugin-theme-dev
description: Desenvolvimento SEGURO de plugins e temas WordPress — hooks, nonces, sanitização/escaping, $wpdb com prepare, REST API, capabilities, enqueue de assets. Use ao criar/alterar plugin ou tema WP. Foco em desenvolvimento; o hardening de instalação/operação vem de wordpress-cms-hardening.
---

# wordpress-plugin-theme-dev

Escrever plugin/tema WP sem abrir buraco. Hardening da instalação (updates, 2FA, wp-config): `/wordpress-cms-hardening`.

## Quando usar
- Criar/alterar plugin, tema (ou child theme), bloco Gutenberg, endpoint REST custom.

## Segurança WordPress (as armadilhas clássicas)
- **Saída:** escapar SEMPRE no output — `esc_html()`, `esc_attr()`, `esc_url()`, `wp_kses()` (anti-XSS).
- **Entrada:** sanitizar — `sanitize_text_field()`, `absint()`, etc.; validar no servidor.
- **SQL:** `$wpdb->prepare()` sempre (nunca interpolar) — anti-SQLi.
- **CSRF:** `wp_nonce_field()` + `check_admin_referer()`/`wp_verify_nonce()` em toda ação que muda estado.
- **Autorização:** `current_user_can('capability')` antes de ação sensível (não confiar no papel presumido).
- **REST API:** `permission_callback` obrigatório (nunca `__return_true` em rota que muda/expõe dado); validar `args`.
- **AJAX:** `wp_ajax_*` com nonce + capability; cuidado com `nopriv`.
- **Assets:** `wp_enqueue_script/style` (não `<script>` hardcoded); versionar; SRI em CDN externo (`/frontend-hardening`).
- **Arquivos:** uploads via API do WP, validar tipo real; bloquear PHP em uploads (`/file-upload-security`).

## Qualidade / preservação
- Prefixar funções/hooks/option names (evitar colisão).
- Não editar core nem plugin de terceiro direto (use hooks/child theme) — alinha com `/preserve-existing-behavior`.
- Desinstalação limpa (`register_uninstall_hook`), sem deixar lixo/PII.
- i18n (`__()`, `_e()`), text domain.

## Recusas
- Output sem escaping; SQL sem `prepare`; ação sem nonce; REST sem `permission_callback`.
- Editar core/plugin de terceiro direto; plugin "nulled".
- Confiar em capability presumida sem `current_user_can`.

## Saída
Código do plugin/tema com escaping+nonce+capability+`prepare`, hooks usados, e checklist `/wordpress-cms-hardening` para a instalação.

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
