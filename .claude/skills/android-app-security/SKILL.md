---
name: android-app-security
description: Seguranca de aplicativo Android - OWASP MASVS (Mobile Application Security Verification Standard) niveis L1/L2/R, analise estatica de APK/AAB (MobSF, APKTool, jadx-gui), analise dinamica (Frida, objection, Drozer), reverse engineering, exploring AndroidManifest.xml permissions/exported components, secure storage (Keystore vs SharedPreferences), certificate pinning, root detection bypass, Intent hijacking, deep link hijacking, WebView vulnerabilidades (JavaScript bridge, file://), SSL kill switch, hooks Frida para auth bypass, anti-reverse engineering (ProGuard, R8, Android Bouncer detection), Play Integrity API, comunicacao com backend, Termux para testing on-device. Use ao auditar/desenvolver app Android proprio ou de cliente, antes de publicar na Play Store, ou em pentest mobile autorizado. Complementa pentest-engagement-management e webapp-hardening.
---

# android-app-security

> **Frase-guia:** APK é arquivo zip + bytecode reversível. O que está no app **será visto** pelo atacante. Secret no app = secret público.

## 0. Regra suprema

Android app não tem **segredo**. Tudo no APK é decompilável. Lógica crítica e secrets **DEVEM** ficar no backend. Em conflito entre "fazer no app é mais rápido" e "validar no backend", **backend vence sempre**.

---

## 1. Objetivo

Cobrir security de Android apps:

- **OWASP MASVS** (L1, L2, R) compliance
- Static analysis (APK, AAB, source)
- Dynamic analysis (Frida, objection, Drozer)
- AndroidManifest review
- Secure storage (Keystore)
- Network security (cert pinning, TLS)
- WebView hardening
- Root detection + bypass awareness
- Anti-reverse engineering (ProGuard, R8)
- Play Integrity API
- Backend trust boundary

---

## 2. Quando usar

- Auditando app Android próprio
- Cliente B2C com app
- Pre-launch Play Store
- Pentest mobile autorizado
- Pós-incident em mobile

---

## 3. OWASP MASVS — Resumo

### 3.1 L1 (Standard Security)

Para todas apps:
- HTTPS only
- No hardcoded secrets
- Não armazenar PII desnecessária
- Permissions mínimas
- Validação de input

### 3.2 L2 (Defense-in-Depth)

Para apps que tratam dado sensitive:
- Cert pinning
- Secure storage (Keystore)
- Biometric auth para reauth
- Anti-debugger
- Code obfuscation

### 3.3 R (Resiliency)

Para apps com adversário ativo:
- Anti-tampering
- Anti-rooting
- Anti-Frida
- Integrity check
- Runtime application self-protection (RASP)

---

## 4. Tools

| Tool | Função |
|---|---|
| **MobSF** | Static + dynamic auto |
| **APKTool** | Decompile APK |
| **jadx-gui** | Decompile Java/Smali |
| **dex2jar + JD-GUI** | Decompile alt |
| **Frida** | Dynamic hook |
| **objection** | Frida wrapper |
| **Drozer** | Pentest framework |
| **adb** | Android Debug Bridge |
| **Burp Suite** | MITM proxy |
| **Charles Proxy** | MITM alt |
| **mitmproxy** | MITM CLI |
| **HTTP Toolkit** | Friendly MITM |

---

## 5. Static analysis workflow

### 5.1 Get APK

```bash
# Da Play Store via apkpure.com (sample)
# Ou de device:
adb shell pm list packages | grep target
adb shell pm path com.target.app
adb pull /data/app/com.target.app/base.apk
```

### 5.2 MobSF

```bash
docker run -p 8000:8000 opensecurity/mobile-security-framework-mobsf

# Upload APK pela UI
# Dashboard mostra: permissions, components, secrets, vulnerabilities
```

### 5.3 APKTool

```bash
apktool d base.apk -o base_decoded/
# Browse base_decoded/AndroidManifest.xml
# Browse base_decoded/res/values/strings.xml
# Browse base_decoded/smali/ (assembly)
```

### 5.4 jadx-gui

```bash
jadx-gui base.apk
# Browse Java source decompiled
# Search: "password", "api_key", "secret", "http://", "https://"
```

### 5.5 Hardcoded secrets

Common findings:
```bash
grep -r "AKIA" base_decoded/  # AWS keys
grep -r "sk_live" base_decoded/  # Stripe keys
grep -r "AIza" base_decoded/  # Google API key
grep -r "Bearer " base_decoded/
grep -r "password" base_decoded/
```

---

## 6. AndroidManifest review

```xml
<manifest>
  <!-- Permissions -->
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
  <!-- Watch for: SMS, CALL_LOG, LOCATION_BACKGROUND, READ_PHONE_STATE -->

  <application
    android:allowBackup="true"          <!-- VULN! Permite backup adb -->
    android:debuggable="true"           <!-- VULN! Debug em prod -->
    android:usesCleartextTraffic="true"> <!-- VULN! HTTP allowed -->

    <!-- Activities exportadas (acessíveis por outros apps) -->
    <activity android:name=".AdminActivity"
              android:exported="true"/>  <!-- VULN se não pretendido -->

    <!-- Deep links -->
    <activity>
      <intent-filter>
        <data android:scheme="myapp" android:host="open"/>
      </intent-filter>
    </activity>

    <!-- Content providers exportados -->
    <provider android:exported="true"
              android:authorities="com.target.provider"/>  <!-- VULN -->
  </application>
</manifest>
```

### Defesa:

- `android:allowBackup="false"`
- `android:debuggable="false"` (Gradle: release build)
- `android:usesCleartextTraffic="false"`
- Network Security Config: HTTPS only
- `exported="false"` por default (Android 12+)
- Permission minimum required

---

## 7. Network Security Config

```xml
<!-- res/xml/network_security_config.xml -->
<network-security-config>
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system"/>
    </trust-anchors>
  </base-config>

  <!-- Certificate pinning -->
  <domain-config>
    <domain includeSubdomains="true">api.example.com</domain>
    <pin-set expiration="2027-01-01">
      <pin digest="SHA-256">base64HashOfPinnedCert</pin>
      <pin digest="SHA-256">base64HashOfBackupCert</pin>
    </pin-set>
  </domain-config>
</network-security-config>
```

Manifest:
```xml
<application android:networkSecurityConfig="@xml/network_security_config">
```

---

## 8. Secure storage

### 8.1 Keystore (recomendado)

```kotlin
// Android Keystore — chave nunca sai do TEE
val keyStore = KeyStore.getInstance("AndroidKeyStore")
keyStore.load(null)

val keyGenerator = KeyGenerator.getInstance(
  KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore"
)
keyGenerator.init(
  KeyGenParameterSpec.Builder("myKey",
    KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
    .setUserAuthenticationRequired(true)  // Biometric
    .build()
)
```

### 8.2 EncryptedSharedPreferences

```kotlin
val masterKey = MasterKey.Builder(context)
  .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
  .build()

val sharedPrefs = EncryptedSharedPreferences.create(
  context,
  "secret_prefs",
  masterKey,
  EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
  EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
)
```

### 8.3 NUNCA

- SharedPreferences plaintext
- External Storage (`/sdcard/`)
- File em internal storage plaintext
- SQLite sem encryption (use **SQLCipher**)

---

## 9. Dynamic analysis — Frida

### 9.1 Setup

```bash
# Device rooted ou emulator
pip install frida-tools

# Push frida-server to device
adb push frida-server-android-arm64 /data/local/tmp/
adb shell "chmod 755 /data/local/tmp/frida-server"
adb shell "/data/local/tmp/frida-server &"

# Test connection
frida-ps -U
```

### 9.2 Hook example — SSL bypass

```javascript
// frida-ssl-bypass.js
Java.perform(function () {
  var X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
  var SSLContext = Java.use('javax.net.ssl.SSLContext');

  var TrustManager = Java.registerClass({
    name: 'com.evil.TrustManager',
    implements: [X509TrustManager],
    methods: {
      checkClientTrusted: function (chain, authType) {},
      checkServerTrusted: function (chain, authType) {},
      getAcceptedIssuers: function () { return []; }
    }
  });

  var TrustManagers = [TrustManager.$new()];
  var SSLContext_init = SSLContext.init.overload(
    '[Ljavax.net.ssl.KeyManager;',
    '[Ljavax.net.ssl.TrustManager;',
    'java.security.SecureRandom'
  );
  SSLContext_init.implementation = function (km, tm, sr) {
    SSLContext_init.call(this, km, TrustManagers, sr);
  };
});
```

Run:
```bash
frida -U -l frida-ssl-bypass.js -f com.target.app
```

### 9.3 objection

Frida wrapper friendly:
```bash
objection -g com.target.app explore

# Inside:
android sslpinning disable
android root disable
android hooking watch class com.target.AuthManager
android hooking generate simple com.target.AuthManager
```

---

## 10. Root detection bypass

Apps verificam root para bloquear. Frida bypass:

```javascript
// frida-root-bypass.js
Java.perform(function () {
  var Runtime = Java.use('java.lang.Runtime');
  Runtime.exec.overload('[Ljava.lang.String;').implementation = function (cmd) {
    if (cmd[0].indexOf("su") !== -1) {
      return Runtime.exec.overload('[Ljava.lang.String;').call(this, ["echo"]);
    }
    return Runtime.exec.overload('[Ljava.lang.String;').call(this, cmd);
  };
});
```

**Implication para dev**: root detection no app sozinho NÃO PROTEGE. Use Play Integrity API + backend trust.

---

## 11. WebView vulnerabilidades

### 11.1 JavaScript bridge

```java
WebView wv = findViewById(R.id.webview);
wv.getSettings().setJavaScriptEnabled(true);
wv.addJavascriptInterface(new JsBridge(), "Android");  // VULN!

class JsBridge {
  @JavascriptInterface
  public String getUserToken() {
    return userToken;  // Acessível via JavaScript no WebView!
  }
}
```

Atacante em XSS no WebView: `Android.getUserToken()` → exfil.

### 11.2 file:// scheme

```java
wv.getSettings().setAllowFileAccess(true);          // VULN
wv.getSettings().setAllowFileAccessFromFileURLs(true); // VULN
wv.getSettings().setAllowUniversalAccessFromFileURLs(true); // VULN!
```

### 11.3 Defesas WebView

```kotlin
wv.settings.apply {
  javaScriptEnabled = false  // Se possível
  allowFileAccess = false
  allowContentAccess = false
  allowFileAccessFromFileURLs = false
  allowUniversalAccessFromFileURLs = false
  mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
}

// Se precisar JS bridge: API mínima + auth check
wv.addJavascriptInterface(LimitedBridge(), "Bridge")

// Limit navigation
wv.webViewClient = object : WebViewClient() {
  override fun shouldOverrideUrlLoading(...): Boolean {
    val url = request.url.toString()
    return !url.startsWith("https://example.com/")  // Whitelist
  }
}
```

---

## 12. Intent hijacking

Activity exportada recebe Intent malicioso de outro app:

```java
// Vulnerable
Intent intent = getIntent();
String url = intent.getStringExtra("url");
webview.loadUrl(url);  // VULN! Outro app pode triggerar
```

Atacante:
```java
Intent i = new Intent();
i.setComponent(new ComponentName("com.target", "com.target.WebActivity"));
i.putExtra("url", "javascript:alert(1)");
startActivity(i);
```

Defesa:
- `android:exported="false"` se não pretendido público
- Validate input + whitelist URLs
- Verify caller (`getCallingPackage()`)

---

## 13. Deep link hijacking

App registra `myapp://`. Atacante pode:
1. Registrar mesmo scheme (Android < 12) e roubar
2. Trigger funções via deep link

Defesa:
- **App Links** (verified domain) — não scheme custom
- Validate parâmetros
- Auth check em handler

```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW"/>
  <category android:name="android.intent.category.DEFAULT"/>
  <category android:name="android.intent.category.BROWSABLE"/>
  <data android:scheme="https"
        android:host="example.com"
        android:pathPattern="/.*"/>
</intent-filter>
```

Plus `.well-known/assetlinks.json` em domínio.

---

## 14. Code obfuscation (ProGuard / R8)

```gradle
// build.gradle (app)
android {
  buildTypes {
    release {
      minifyEnabled true
      shrinkResources true
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'),
                    'proguard-rules.pro'
    }
  }
}
```

```proguard
# proguard-rules.pro
-keep class com.target.api.** { *; }   # Keep public API
-keepattributes Signature,Annotation

# Optimize aggressive
-optimizationpasses 5
-allowaccessmodification
```

R8 (default no AGP 3.4+) é melhor que ProGuard.

**Importante**: obfuscation atrasa atacante, não impede. Não confiar como única defesa.

---

## 15. Play Integrity API

Validação server-side de integridade:

```kotlin
val integrityManager = IntegrityManagerFactory.create(applicationContext)
val nonce = generateNonce()

integrityManager.requestIntegrityToken(
  IntegrityTokenRequest.builder()
    .setNonce(nonce)
    .build()
).addOnSuccessListener { response ->
  val token = response.token()
  // Envia para BACKEND validar
  sendToBackend(token, nonce)
}
```

Backend valida via Google Play Server:
- Device tier (genuine vs emulator)
- App tier (genuine Play install vs sideload)
- Account tier (licensed)
- Nonce check

---

## 16. Backend trust boundary

**LEMBRE**: cliente pode mentir.

- Toda validação crítica no **backend**
- Backend **NÃO confia** em headers do cliente (`X-User-Role`)
- Backend valida JWT/session do cliente
- Backend rate limita
- Backend logga
- Backend pode revogar (vide `/jwt-attack-prevention`)

---

## 17. Anti-Frida + anti-debug

Detect Frida:
```kotlin
fun detectFrida(): Boolean {
  try {
    File("/data/local/tmp/frida-server").exists() ||
    File("/data/local/tmp/re.frida.server").exists()
  } catch (e: Exception) { false }
}
```

Detect emulator:
```kotlin
fun isEmulator(): Boolean {
  return (Build.FINGERPRINT.startsWith("generic") ||
          Build.MODEL.contains("Emulator") ||
          Build.MODEL.contains("Android SDK"))
}
```

**Bypassable** — defesa em profundidade, não única.

---

## 18. Distribution

### 18.1 Play Store

- Upload AAB (Android App Bundle), não APK
- Google Play App Signing (Google holds private key)
- Internal Testing → Closed → Open → Production
- Crashlytics + Play Console vitals

### 18.2 Out of Play (B2B)

- Sign com keystore próprio (BACKUP!)
- Distribute via MDM (Intune, Workspace ONE)
- Update mechanism próprio

---

## 19. Checklist

```text
# Build
[ ] minifyEnabled = true em release
[ ] debuggable = false em release
[ ] allowBackup = false
[ ] usesCleartextTraffic = false
[ ] Network Security Config com cert pinning
[ ] R8 / ProGuard rules adequadas

# Manifest
[ ] Permissions minimas
[ ] Components exported = false por default
[ ] Deep links via App Links (autoVerify)
[ ] No content provider exposto

# Code
[ ] Secrets em Keystore, nao SharedPreferences
[ ] EncryptedSharedPreferences se usar
[ ] SQLCipher se DB local
[ ] No JS bridge em WebView OU bridge minimo
[ ] WebView com allowFileAccess = false
[ ] HTTPS only

# Backend
[ ] Validation toda no backend
[ ] JWT validation
[ ] Rate limit
[ ] Play Integrity API check
[ ] Trust boundary clara

# Static analysis
[ ] MobSF scan sem findings high
[ ] No hardcoded secret (grep clean)
[ ] AndroidManifest review

# Dynamic analysis (pen-test)
[ ] Cert pinning bypass attempted
[ ] Frida bypass attempted
[ ] Root detection bypass attempted
[ ] Intent hijacking testado
[ ] Deep link hijacking testado

# Release
[ ] AAB upload
[ ] Play App Signing enabled
[ ] Crashlytics + Sentry com PII scrub
```

---

## 20. Integração

- `/ios-app-security` — paralelo iOS
- `/pentest-engagement-management` — formalização
- `/auth-and-session-hardening` — JWT/session
- `/jwt-attack-prevention` — JWT
- `/secrets-and-env-guard` — secrets
- `/api-backend-hardening` — backend
- `/lgpd-compliance-check` — PII em mobile

---

## 21. Frase-guia final

> **APK é arquivo público. Obfuscation atrasa, não protege. Secrets ficam no backend; validation fica no backend; lógica crítica fica no backend. Cliente mobile valida UX, backend valida segurança.**
