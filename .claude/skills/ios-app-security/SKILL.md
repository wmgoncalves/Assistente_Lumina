---
name: ios-app-security
description: Seguranca de aplicativo iOS - OWASP MASVS aplicado a iOS (L1/L2/R), analise estatica de IPA (MobSF, class-dump, Hopper/Ghidra), analise dinamica com Frida + objection em dispositivo jailbroken, Keychain Services para secure storage, App Transport Security (ATS), certificate pinning com TrustKit/NSURLSession, deep link via Universal Links (vs URL schemes), WKWebView vs UIWebView (deprecated), JavaScriptBridge cuidados, jailbreak detection bypass awareness, anti-debugger (ptrace), code signing + App Store review process, Sandbox + entitlements minimo, biometric com LocalAuthentication, App Attest + DeviceCheck (anti-fraud), TLS pinning em SwiftUI, secrets management no app. Use ao auditar/desenvolver app iOS proprio ou cliente, antes de submeter App Store, em pentest mobile autorizado. Complementa android-app-security (cobertura mobile completa) e webapp-hardening.
---

# ios-app-security

> **Frase-guia:** App Store review é peneira, não fortaleza. Sandbox iOS é forte, mas IPA é decompilável em device jailbroken. Secrets ficam no backend.

## 0. Regra suprema

iOS Sandbox protege user-from-app, não app-from-user. Atacante com device jailbroken vê tudo: strings, Keychain (com bypass), traffic (sem cert pinning). Em conflito entre "App Store aprovou então é seguro" e "validar no backend", **backend vence**.

---

## 1. Objetivo

Security de iOS apps:

- **OWASP MASVS** aplicado a iOS
- Static analysis (IPA, Swift/Obj-C)
- Dynamic analysis (Frida + objection em jailbroken)
- Keychain Services
- App Transport Security (ATS) + cert pinning
- WKWebView hardening
- Universal Links vs URL schemes
- Code signing + sandboxing
- Biometric auth
- App Attest + DeviceCheck (anti-fraud)
- App Store submission review checklist

---

## 2. Quando usar

- Auditando app iOS próprio
- Cliente B2C com app iOS
- Pre-submit App Store
- Pentest mobile autorizado
- Pós-incident

---

## 3. iOS Security Architecture

```text
+--------------------------------------+
| App (sandboxed)                      |
+--------------------------------------+
| iOS Frameworks (UIKit, Foundation)   |
+--------------------------------------+
| iOS Kernel (XNU)                     |
+--------------------------------------+
| Secure Enclave (Keychain, Biometric) |
+--------------------------------------+
| Hardware (A-series chip)             |
+--------------------------------------+
```

Sandbox: app isolado, sem acesso a outros apps direto.
Secure Enclave: chip dedicado para keys + biometric.

---

## 4. Tools

| Tool | Função |
|---|---|
| **MobSF** | Static + dynamic auto (suporta IPA) |
| **class-dump** | Decompile Obj-C headers |
| **Hopper Disassembler** | Reverse engineering ($) |
| **Ghidra** | Reverse engineering (free) |
| **Frida** | Dynamic hook |
| **objection** | Frida wrapper |
| **Frida-iOS-Dump** | Dump decrypted IPA |
| **clutch** | Decrypt IPA from device |
| **Cycript** | Runtime injection (legacy) |
| **Burp Suite** | MITM |
| **mitmproxy** | MITM CLI |
| **Charles** | MITM iOS-friendly |
| **3uTools / iMazing** | iOS file browsing |

---

## 5. Get IPA

### 5.1 Apple Configurator 2

Para apps próprios + AppStore via mac.

### 5.2 frida-ios-dump (jailbroken device)

```bash
# Setup
git clone https://github.com/AloneMonkey/frida-ios-dump
cd frida-ios-dump
pip install -r requirements.txt

# Dump
python dump.py com.target.app
# Output: TargetApp.ipa (decrypted)
```

### 5.3 Decrypt na inspeção

IPA = ZIP. App binary criptografado pela App Store (FairPlay DRM). Para análise, precisa decrypt em device.

---

## 6. Static analysis

### 6.1 Unzip IPA

```bash
unzip TargetApp.ipa
cd Payload/TargetApp.app/
ls
# TargetApp (binary)
# Info.plist (config)
# *.nib (UI)
# Frameworks/
# embedded.mobileprovision
```

### 6.2 Info.plist review

```bash
plutil -p Info.plist
```

Procurar:
```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>           <!-- VULN! HTTP allowed -->
</dict>

<key>CFBundleURLSchemes</key>
<array>
  <string>myapp</string>  <!-- Deep link scheme — verificar handling -->
</array>

<key>NSCameraUsageDescription</key>
<string>...</string>     <!-- Permissão explicita -->
```

### 6.3 Strings

```bash
strings TargetApp | grep -iE "(api_key|password|secret|token|http://)"
```

### 6.4 class-dump

```bash
class-dump TargetApp -H -o headers/
# Lista Obj-C classes + methods
ls headers/
grep -r "login" headers/
```

### 6.5 Hopper / Ghidra

Decompile binary para pseudo-code:
- Hopper: $99-129, suporte ARM64
- Ghidra: free, NSA

### 6.6 Swift symbols

Swift demangling:
```bash
swift demangle _$s10MyApp10APIServiceC5loginyySSF
# → MyApp.APIService.login(_: Swift.String) -> ()
```

---

## 7. App Transport Security (ATS)

iOS 9+ exige HTTPS por default.

```xml
<!-- Info.plist -->
<key>NSAppTransportSecurity</key>
<dict>
  <!-- Default: HTTPS only, TLS 1.2+, forward secrecy -->

  <!-- BAD: bypass -->
  <key>NSAllowsArbitraryLoads</key>
  <true/>

  <!-- BAD: domain exception -->
  <key>NSExceptionDomains</key>
  <dict>
    <key>insecure-api.com</key>
    <dict>
      <key>NSExceptionAllowsInsecureHTTPLoads</key>
      <true/>
    </dict>
  </dict>
</dict>
```

App Store rejeita `NSAllowsArbitraryLoads=true` sem justification (raro aprovar).

---

## 8. Certificate pinning

### 8.1 NSURLSession manual

```swift
class PinningDelegate: NSObject, URLSessionDelegate {
  let pinnedHashes: [String] = ["sha256/AAAAA...", "sha256/BBBBB..."]

  func urlSession(_ session: URLSession,
                  didReceive challenge: URLAuthenticationChallenge,
                  completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
    guard let serverTrust = challenge.protectionSpace.serverTrust,
          let cert = SecTrustGetCertificateAtIndex(serverTrust, 0) else {
      completionHandler(.cancelAuthenticationChallenge, nil)
      return
    }

    let serverHash = sha256(SecCertificateCopyData(cert) as Data).base64()
    if pinnedHashes.contains("sha256/" + serverHash) {
      completionHandler(.useCredential, URLCredential(trust: serverTrust))
    } else {
      completionHandler(.cancelAuthenticationChallenge, nil)
    }
  }
}
```

### 8.2 TrustKit (recomendado)

```swift
import TrustKit

let config: [String: Any] = [
  kTSKSwizzleNetworkDelegates: true,
  kTSKPinnedDomains: [
    "api.example.com": [
      kTSKEnforcePinning: true,
      kTSKIncludeSubdomains: true,
      kTSKPublicKeyHashes: [
        "BASE64HASH1==",
        "BASE64HASH2=="   // Backup
      ],
      kTSKReportUris: ["https://example.com/report"]
    ]
  ]
]
TrustKit.initSharedInstance(withConfiguration: config)
```

### 8.3 Pin expiration

Pins **expiram**. Plano de rotation antes do cert renewal.

---

## 9. Secure storage — Keychain

```swift
import Security

// Store
let query: [String: Any] = [
  kSecClass as String: kSecClassGenericPassword,
  kSecAttrService as String: "com.target.app",
  kSecAttrAccount as String: "userToken",
  kSecValueData as String: tokenData,
  kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
  // ↑ não vai para iCloud backup, só desbloqueado
]
SecItemAdd(query as CFDictionary, nil)

// Retrieve
var result: AnyObject?
let getQuery: [String: Any] = [
  kSecClass as String: kSecClassGenericPassword,
  kSecAttrService as String: "com.target.app",
  kSecAttrAccount as String: "userToken",
  kSecReturnData as String: true,
  kSecMatchLimit as String: kSecMatchLimitOne
]
SecItemCopyMatching(getQuery as CFDictionary, &result)
```

### 9.1 Accessibility levels

| Constant | Quando |
|---|---|
| `kSecAttrAccessibleWhenUnlocked` | App ativo |
| `kSecAttrAccessibleAfterFirstUnlock` | Após primeiro unlock após boot |
| `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` | Não iCloud backup |
| `kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly` | Requer passcode + sem backup |

**Recomendação**: `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` ou `WhenPasscodeSetThisDeviceOnly` para tokens.

### 9.2 Biometric protection

```swift
let access = SecAccessControlCreateWithFlags(
  nil,
  kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly,
  .biometryCurrentSet,  // Face ID / Touch ID atual (não outros)
  nil
)!

let query: [String: Any] = [
  ...
  kSecAttrAccessControl as String: access
]
```

### 9.3 NUNCA

- UserDefaults para secret
- File no Documents/ plaintext
- Strings hardcoded (decompilable)

---

## 10. WKWebView hardening

UIWebView deprecated desde iOS 8 (removed iOS 12+). Use WKWebView.

```swift
let config = WKWebViewConfiguration()

// JavaScript: desabilita se possível
config.preferences.javaScriptEnabled = false   // ou true se precisar

// Não permitir abrir outras apps via window.open
config.preferences.javaScriptCanOpenWindowsAutomatically = false

// Limitar audio/video autoplay
config.mediaTypesRequiringUserActionForPlayback = .all

// Não permitir telephoneNumberDetection (deep link tel:)
config.dataDetectorTypes = []

let webView = WKWebView(frame: .zero, configuration: config)
webView.navigationDelegate = self

// Whitelist navegação
func webView(_ webView: WKWebView,
             decidePolicyFor navigationAction: WKNavigationAction,
             decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
  let url = navigationAction.request.url
  if let host = url?.host, host == "example.com" {
    decisionHandler(.allow)
  } else {
    decisionHandler(.cancel)
  }
}
```

### 10.1 Message handlers (JS → Swift bridge)

```swift
let userContentController = WKUserContentController()
userContentController.add(self, name: "bridge")
config.userContentController = userContentController

// JS: window.webkit.messageHandlers.bridge.postMessage({...})

// Swift: handle
func userContentController(_ userContentController: WKUserContentController,
                           didReceive message: WKScriptMessage) {
  if message.name == "bridge" {
    guard let body = message.body as? [String: Any] else { return }
    // VALIDATE input rigorosamente!
    handleBridge(body)
  }
}
```

Validar tudo. Cuidado com bridge expor função crítica.

---

## 11. Deep links — Universal Links vs URL schemes

### 11.1 URL Scheme (legacy, vulnerable)

```text
myapp://login?token=abc
```

Outro app pode registrar `myapp://` e roubar.

### 11.2 Universal Links (recomendado)

```text
https://example.com/login?token=abc
```

iOS verifica `https://example.com/.well-known/apple-app-site-association`:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.example.app",
        "paths": ["/login", "/profile/*"]
      }
    ]
  }
}
```

Sem este file no domínio, link abre Safari.

### 11.3 Handle no app

```swift
func application(_ application: UIApplication,
                 continue userActivity: NSUserActivity,
                 restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
  guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
        let url = userActivity.webpageURL else { return false }

  // Validate URL host + path
  guard url.host == "example.com" else { return false }

  // Process
  return handleDeepLink(url)
}
```

---

## 12. Code signing + entitlements

### 12.1 Code signing

iOS exige binary signed por Apple Developer cert. Tampering invalida assinatura.

### 12.2 Entitlements

`Entitlements.plist`:
```xml
<key>com.apple.developer.applesignin</key>
<array><string>Default</string></array>

<key>com.apple.developer.icloud-container-identifiers</key>
<array><string>iCloud.com.target.app</string></array>

<!-- Push -->
<key>aps-environment</key>
<string>production</string>
```

**Princípio**: pedir só o que usa. Excesso = App Store reject + risco.

### 12.3 App Sandbox

iOS app rodando em sandbox isolado:
- Próprio `Documents/`, `Library/`, `tmp/`
- Sem acesso file system geral
- Inter-app via `URLScheme`, `UIDocumentPickerViewController`, `App Groups`

---

## 13. Biometric auth — LocalAuthentication

```swift
import LocalAuthentication

let context = LAContext()
var error: NSError?

if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
  context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics,
                         localizedReason: "Autenticar para acessar dados sensiveis") { success, error in
    DispatchQueue.main.async {
      if success {
        // Liberar funcionalidade
      } else {
        // Falha
      }
    }
  }
}
```

**Cuidado**: biometric autoriza local — não autoriza no backend. Backend valida JWT/session.

---

## 14. App Attest + DeviceCheck (anti-fraud)

### 14.1 DeviceCheck (iOS 11+)

2 bits per-device armazenados pela Apple. Pode marcar fraud.

### 14.2 App Attest (iOS 14+)

Prova que request veio de **seu app não tampered em device genuine**:

```swift
import DeviceCheck

let attestService = DCAppAttestService.shared
if attestService.isSupported {
  attestService.generateKey { keyId, error in
    // Use keyId to attest each request
    attestService.attestKey(keyId, clientDataHash: hashOfChallenge) { attestation, error in
      // Send to backend
    }
  }
}
```

Backend valida:
- Attestation contém challenge correto
- Counter incrementing (não replay)
- App Bundle ID correto

---

## 15. Anti-jailbreak detection

```swift
func isJailbroken() -> Bool {
  // Suspicious files
  let paths = ["/Applications/Cydia.app",
               "/usr/sbin/sshd",
               "/etc/apt",
               "/private/var/lib/apt/",
               "/usr/bin/ssh"]
  for path in paths {
    if FileManager.default.fileExists(atPath: path) { return true }
  }

  // Try write outside sandbox
  let testPath = "/private/jb_test.txt"
  do {
    try "test".write(toFile: testPath, atomically: true, encoding: .utf8)
    try FileManager.default.removeItem(atPath: testPath)
    return true   // Conseguiu = jailbroken
  } catch {}

  // URL scheme cydia
  if UIApplication.shared.canOpenURL(URL(string: "cydia://")!) { return true }

  return false
}
```

**Bypassable** via Frida hook. Use App Attest como fonte autoritativa.

---

## 16. Anti-debugger

```swift
import Darwin

func enableAntiDebugger() {
  typealias PtraceFunc = @convention(c) (_ request: Int32, _ pid: Int32, _ addr: Int32, _ data: Int32) -> Int32
  let handle = dlopen(nil, RTLD_NOW)
  let sym = dlsym(handle, "ptrace")
  let ptrace = unsafeBitCast(sym, to: PtraceFunc.self)
  let PT_DENY_ATTACH: Int32 = 31
  _ = ptrace(PT_DENY_ATTACH, 0, 0, 0)
}
```

**Cuidado**: App Store pode rejeitar uso de `ptrace` (private API). Geralmente aceito mas validar.

---

## 17. Privacy nutrition labels (App Store)

Desde 2020: declarar coleta de dados. Audit:

- Contact info?
- Health & Fitness?
- Financial Info?
- Location?
- Sensitive Info?
- Identifiers (IDFA)?
- Usage Data?
- Diagnostics?

Cada um:
- Linked to user? Y/N
- Used for tracking? Y/N

Falsificar = remoção do App Store.

---

## 18. App Tracking Transparency (ATT)

iOS 14.5+: tracking entre apps exige permissão.

```swift
import AppTrackingTransparency

if #available(iOS 14, *) {
  ATTrackingManager.requestTrackingAuthorization { status in
    switch status {
    case .authorized: // OK use IDFA
    case .denied, .restricted, .notDetermined: // Sem IDFA
    @unknown default: break
    }
  }
}
```

Se denied: `ASIdentifierManager.shared().advertisingIdentifier` retorna zeros.

---

## 19. App Store submission checklist

```text
[ ] App Transport Security configurado (HTTPS only)
[ ] Privacy nutrition labels precisos
[ ] ATT prompt se trackear
[ ] App Privacy Report compliance
[ ] Não usa private APIs
[ ] No backdoor / hidden features
[ ] Crash-free
[ ] Não viola HIG
[ ] Termos de uso + privacy policy URLs
[ ] In-App Purchase para conteúdo digital (não Stripe direto)
[ ] Account Deletion option (obrigatório desde 2022)
[ ] App icon + screenshots
[ ] Demo account para review team
```

---

## 20. Checklist Security

```text
# Build
[ ] No NSAllowsArbitraryLoads
[ ] HTTPS only
[ ] Code signing valid
[ ] Entitlements mínimas
[ ] Bitcode/strip symbols em release

# Storage
[ ] Keychain para tokens
[ ] kSecAttrAccessibleWhenUnlockedThisDeviceOnly mínimo
[ ] Biometric protect para sensitive
[ ] No UserDefaults para secret
[ ] No file plaintext em Documents/

# Network
[ ] Certificate pinning (TrustKit)
[ ] Pin rotation plan
[ ] TLS 1.2+
[ ] ATS strict

# WKWebView
[ ] WKWebView (não UIWebView)
[ ] JS desabilitado se possível
[ ] Bridge mensagens validadas
[ ] Navigation whitelist

# Deep links
[ ] Universal Links (não custom scheme)
[ ] apple-app-site-association published
[ ] Validation no handler

# Anti-fraud
[ ] App Attest implementado
[ ] Backend valida attestation
[ ] Jailbreak detection (não única defesa)

# Backend
[ ] Validation toda no backend
[ ] JWT validation
[ ] Rate limit
[ ] Account deletion endpoint

# App Store
[ ] Privacy nutrition labels precisos
[ ] ATT prompt se trackear
[ ] In-App Purchase para digital
[ ] Demo account preparado
```

---

## 21. Integração

- `/android-app-security` — paralelo Android
- `/pentest-engagement-management` — formalização
- `/auth-and-session-hardening` — sessão
- `/jwt-attack-prevention` — JWT
- `/oauth-advanced-security` — OAuth (PKCE obrigatório mobile)
- `/secrets-and-env-guard`
- `/api-backend-hardening` — backend
- `/lgpd-compliance-check` — PII

---

## 22. Frase-guia final

> **iOS Sandbox protege user, não app. Jailbroken device vê tudo. Keychain + cert pinning + App Attest + backend validation = defense in depth. App Store review é peneira, não fortaleza. Account deletion é obrigatório (2022).**
