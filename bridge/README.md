# Aphogato Bridge

Desktop companion for the Aphogato gallery. Reads a client **selection `.txt`** file, finds matching photos in a local source folder, and copies them into a clean output folder for Lightroom import.

Works fully offline. No accounts, no API keys.

## Requirements

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri) — install with:

  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  source "$HOME/.cargo/env"
  ```

  Open a **new terminal** (or `source ~/.zshrc`) so `cargo` is on your PATH before running Tauri.
- Platform tooling:
  - **macOS:** Xcode Command Line Tools (`xcode-select --install`)
  - **Windows:** Visual Studio Build Tools + WebView2

## Setup

```bash
cd bridge
npm install
npm run dev
```

This starts Vite on port 1420 and launches the Tauri window. Browse buttons and file dialogs require the bundled frontend — do not open `src/index.html` directly in a browser.

## Build

```bash
npm run build
```

- **macOS:** `.dmg` in `src-tauri/target/release/bundle/dmg/`
- **Windows:** NSIS `.exe` in `src-tauri/target/release/bundle/nsis/`

## Cross-platform CI

See `.github/workflows/bridge-build.yml` for GitHub Actions builds on `macos-latest` and `windows-latest`.

## Selection file format

One filename per line from the gallery export:

```text
DSC_0042.jpg
DSC_0087.ARW
# comments ignored
```

Extensions are optional. Matching is case-insensitive on base filenames.

## Output

Default output folder: `[source folder]/to-edit/`

Source files are never modified or deleted — copy only.

## Deep links (Open in Bridge)

The dashboard **Open in Bridge** button uses the `aphogato://` URL scheme. macOS and Windows only register this scheme when **Bridge is installed** from a built `.app` / `.exe` — not from `npm run dev` alone.

```bash
cd bridge
npm run build
```

- **macOS:** open the `.dmg` from `src-tauri/target/release/bundle/dmg/` and drag **Aphogato Bridge** to Applications
- **Windows:** run the NSIS installer from `src-tauri/target/release/bundle/nsis/`

Or download the latest artifact from GitHub Actions → **Bridge build**.

Test manually:

```bash
open "aphogato://import?project_id=YOUR_ID&token=YOUR_TOKEN&host=localhost:3000"
```
