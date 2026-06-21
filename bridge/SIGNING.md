# Bridge macOS signing (one-time setup)

Unsigned CI builds trigger macOS Gatekeeper (“damaged and can’t be opened”). End users should **not** need Terminal workarounds.

After this one-time setup, GitHub Actions produces a **signed + notarized** `.dmg` that installs like any normal Mac app.

## Requirements

- [Apple Developer Program](https://developer.apple.com/programs/) membership ($99/year)
- A Mac to create the signing certificate (Apple requirement)

## 1. Create a Developer ID Application certificate

1. On your Mac, create a [Certificate Signing Request](https://developer.apple.com/help/account/create-certificates/create-a-certificate-signing-request).
2. In [Certificates, IDs & Profiles](https://developer.apple.com/account/resources/certificates/list), create **Developer ID Application** (not “Apple Development”).
3. Download and double-click the `.cer` to add it to Keychain Access.

## 2. Export certificate for GitHub Actions

1. Keychain Access → **My Certificates** → expand **Developer ID Application: …**
2. Right-click the private key → **Export** → save as `certificate.p12` with a password.
3. Base64-encode for GitHub:

```bash
openssl base64 -A -in certificate.p12 -out certificate-base64.txt
```

## 3. Notarization credentials

**Option A — App Store Connect API key (recommended)**

1. [App Store Connect → Users and Access → Integrations → Keys](https://appstoreconnect.apple.com/access/integrations/api)
2. Create a key with **Developer** access.
3. Note **Issuer ID** and **Key ID**; download the `.p8` file once.

**Option B — Apple ID app-specific password**

1. [Create an app-specific password](https://support.apple.com/en-us/HT204397).
2. Use your Apple ID email + Team ID from [Membership](https://developer.apple.com/account#MembershipDetailsCard).

## 4. Add GitHub repository secrets

| Secret | Value |
|--------|--------|
| `APPLE_CERTIFICATE` | Contents of `certificate-base64.txt` |
| `APPLE_CERTIFICATE_PASSWORD` | `.p12` export password |
| `KEYCHAIN_PASSWORD` | Any strong random string (CI-only keychain) |
| `APPLE_TEAM_ID` | Your 10-character Team ID |

**If using API key:**

| Secret | Value |
|--------|--------|
| `APPLE_API_ISSUER` | Issuer ID from App Store Connect |
| `APPLE_API_KEY` | Key ID |
| `APPLE_API_KEY_CONTENT` | Full contents of the downloaded `.p8` private key file |

**If using Apple ID instead of API key:**

| Secret | Value |
|--------|--------|
| `APPLE_ID` | Apple ID email |
| `APPLE_PASSWORD` | App-specific password |

## 5. Re-run Bridge build

Push to `main` or run **Actions → Bridge build → Run workflow**. Download **aphogato-bridge-macos-latest** — the `.dmg` should open without Gatekeeper errors.

## Local signed build

With the certificate in your Mac keychain:

```bash
cd bridge
export APPLE_ID="you@example.com"
export APPLE_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"
npm run build
```

Tauri picks up the signing identity from the keychain automatically.
