# FloMo — Your money, with clarity

**FloMo is an original, mobile-first, installable personal finance web app (PWA).**

> Other apps show your money. FloMo helps you protect your money.

Built with real HTML, CSS and JavaScript — **no build tools, npm installation, cloud account, server, or third-party JavaScript libraries required**. The entire website can be published to GitHub Pages directly and opened on an iPhone or Android phone.

![FloMo icon](./logo-full.png)

## What actually works

- Welcome experience and a sample-money demo, or onboarding with your own money settings.
- Daily **Safe to Spend** calculation: current balance minus recorded recurring bills due before payday, safety cushion and monthly savings reserve, divided by days to payday.
- A projected bill-only cash-flow chart (14 days), available money and next payday.
- Add and delete expense/income transactions; balance updates as transactions are added.
- Spending breakdown by category for the last 30 days.
- Create, edit, pause and remove recurring monthly bills.
- Create and edit savings goals and log contributions, with optional balance deduction.
- **Ask FloMo**: a privacy-preserving *offline financial decision engine* that evaluates a contemplated purchase against bills, buffers and remaining daily budget. It clearly explains its reasoning.
- Responsive light and dark themes plus automatic adaptation to the device's system setting.
- Offline-capable PWA, home-screen icon, bottom navigation, accessible dialogs, and reduced-motion support.
- JSON backup export, restore, and local-data reset.
- No user registration, login, bank account integration, analytics SDK, external fonts, or tracking.

**Important AI disclosure:** The included Ask FloMo is a working **rule-based financial decision engine**, **not** an LLM or a real-time AI chatbot. It operates completely offline. A production cloud-LLM assistant would require secure server-side API integration, rate limiting, user accounts and appropriate privacy, billing and compliance systems. Never put paid API keys in client-side JavaScript hosted on GitHub Pages.

**Important finance disclosure:** Safe-spend estimates rely only on what the user enters. FloMo does **not** automatically know bank balances, unrecorded bills, account fees, upcoming income or emergencies. It is a prototype planning tool, **not** financial advice or a guarantee of affordability.

## Publish to GitHub Pages without coding

The ZIP contains everything you need. GitHub Pages supplies HTTPS, required for home-screen installation and offline service workers.

1. Unzip `FloMo-Mobile-PWA.zip` on your computer.
2. On [GitHub](https://github.com/new), create a repository named, for example, `flomo-mobile`. **Public** is the straightforward free-tier option. You do not need to add a GitHub-generated README.
3. Open the repository, click **Add file → Upload files**, and upload all the files from **inside** the extracted `flomo-mobile` directory, keeping `index.html` at the top level. Commit to the `main` branch.
4. Go to **Settings → Pages → Build and deployment**. Under **Source**, select **Deploy from a branch**. Select branch **main** and folder **/(root)**, then **Save**.
5. Once Pages displays its site URL, open that HTTPS address on your phone. A project repository usually has a URL like `https://YOUR-USERNAME.github.io/flomo-mobile/`.
6. Add FloMo to your home screen for an app-like, full-screen experience.

The ZIP also includes an optional ready-made GitHub Actions deployment workflow at `.github/workflows/deploy.yml`. If you prefer it, choose **GitHub Actions** as your Pages source instead. The simple branch-publishing method above is easier and does not depend on uploading the hidden `.github` directory.

### Install on iPhone

Open the GitHub Pages URL in **Safari**, tap **Share**, select **Add to Home Screen**, and then **Add**. Launch FloMo from the new icon. This requires a supported iOS version and may vary slightly by OS version.

### Install on Android

Open the GitHub Pages URL in **Chrome**, choose the browser's **Install app** or **Add to Home screen** option, then open the home-screen icon.

Once loaded successfully, FloMo's app files are cached for offline use; offline functionality should be verified on your device. Financial data is stored separately in each browser or home-screen app. **It does not sync between phones**, and data may be lost if browser storage is cleared, so export regular backups in Settings.

### Local preview on a computer (optional)

If you have Python installed:

```bash
cd flomo-mobile
python3 -m http.server 5173
```

Open `http://localhost:5173`. **Do not open `index.html` directly from a file manager**: browsers generally block JavaScript module loading from `file://` URLs.

### Update later

Commit changed HTML, CSS, JavaScript or images to `main`, and the GitHub Action republishes automatically. The service worker uses a versioned cache; update the `CACHE` name in `sw.js` when shipping a significant new version.

## Project files

| File | Responsibility |
|---|---|
| `index.html` | Mobile web app document, metadata and PWA links |
| `app.js` | Screens, navigation, dialogs, forms, local persistence |
| `finance.js` | Pure finance/date calculations and test demo data |
| `styles.css` | Responsive layout, original visual design, semantic colors |
| `manifest.webmanifest` | Installable PWA metadata and icons |
| `sw.js` | Offline app-shell caching |
| `logo-full.png` | Full-size custom FloMo logo artwork |
| `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `favicon.svg` | Platform icon formats |
| `.github/workflows/deploy.yml` | One-click GitHub Pages deployment |
| `finance.test.js` | Automated planning-logic checks |
| `DESIGN.md` | Design rationale, palette and accessibility choices |

## Run unit tests (optional)

With Node.js 20 or later:

```bash
node --test
```

## Data, privacy, and production readiness

- No personal financial data is included in the repository. The demo data is fictional.
- Private financial entries stay in your device's local browser storage; there is no server, encryption-at-rest guarantee, cross-device sync, payment plan, or bank integration.
- **Do not commit exported JSON backups or private financial information to GitHub.** They are readable plaintext files.
- A publicly hosted PWA's frontend source code is viewable by users. This version is an installable, functional MVP—not a native iOS/Android App Store package or an operational subscription business.
- Before selling commercially, add identity and access management, cloud data storage and sync, secure AI backend, subscriptions, professional security review, accessibility testing on real devices, and financial/privacy/legal disclosures appropriate to your customers.
- Third-party use rights are not defined by a LICENSE file in this package. Choose a license deliberately if you decide to open-source the application.

## Inspiration and design principles

The design is original rather than a copy of Apple software. It takes general inspiration from Apple's Human Interface Guidelines around visual hierarchy, semantic dark-mode colors, sufficient contrast, comfortable hit targets, modest motion, native system typography and memorable app icons.

Relevant guidance:

- [Apple — Color](https://developer.apple.com/design/human-interface-guidelines/color)
- [Apple — Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)
- [Apple — Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- [Apple — App icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)

---

**Version:** 1.0.0. Built for FloMo.
