# BloomLog Mobile (Capacitor Shell)

BloomLog ships as a **thin native shell** built with [Capacitor](https://capacitorjs.com/).
The WebView loads the live Vercel deployment — **no static export, no separate mobile codebase.**
All business logic, routing, and UI live on the web; the shell adds app-store distribution,
native status-bar integration, and splash screen.

```
Architecture
────────────
iOS / Android Shell (Capacitor)
  └─ WebView ──────► https://bloomlog-six.vercel.app  (Vercel / Next.js)
                          └─ Supabase (auth + DB)
```

---

## Prerequisites

### Shared (all platforms)
| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 18 | `node -v` |
| npm | ≥ 9 | bundled with Node |
| Java JDK | 17 (LTS) | required for Android Gradle |

```bash
npm install          # install deps incl. Capacitor
```

### iOS (macOS only)
| Tool | Install |
|------|---------|
| macOS | Ventura 13+ recommended |
| Xcode | ≥ 15 — [Mac App Store](https://apps.apple.com/app/xcode/id497799835) |
| Xcode Command Line Tools | `xcode-select --install` |
| CocoaPods | `sudo gem install cocoapods` (or `brew install cocoapods`) |

After installing CocoaPods run once inside `ios/App/`:

```bash
cd ios/App && pod install
```

### Android (Windows / macOS / Linux)
| Tool | Install |
|------|---------|
| Android Studio | [developer.android.com](https://developer.android.com/studio) |
| Android SDK API 34+ | via Android Studio → SDK Manager |
| `ANDROID_HOME` env var | set by Android Studio installer |

---

## Local Development Workflow

```bash
# 1. Sync config + plugins to native projects (run after changing capacitor.config.ts)
npm run cap:sync          # = npx cap sync

# 2a. Open in Xcode (macOS only)
npm run cap:open:ios      # = npx cap open ios

# 2b. Open in Android Studio (any OS)
npm run cap:open:android  # = npx cap open android
```

Once the IDE opens:
- **iOS**: select a simulator from the device toolbar → press ▶ Run.
- **Android**: select an AVD (or a connected device) → press ▶ Run.

> The WebView will load `https://bloomlog-six.vercel.app` directly.
> You need an internet connection; there is no offline bundle.

---

## Changing the Loaded URL

Edit `capacitor.config.ts` at the repo root:

```ts
server: {
  url: "https://your-staging-url.vercel.app",
  // ...
}
```

Then sync:

```bash
npm run cap:sync
```

No rebuild of native code is needed — only `cap sync` to push the updated
`capacitor.config.json` into the native projects.

For staging workflows you can maintain a second config file and pass it explicitly:

```bash
npx cap sync --config capacitor.config.staging.ts
```

---

## App Icons & Splash Screens

Capacitor does **not** generate icons automatically. Use the official tool:

```bash
npm install --save-dev @capacitor/assets
npx capacitor-assets generate
```

Place source images in `resources/` at the repo root (created by the tool):

| File | Size | Purpose |
|------|------|---------|
| `resources/icon.png` | 1024 × 1024 px | App icon (no transparency) |
| `resources/icon-foreground.png` | 1024 × 1024 px | Adaptive icon foreground (Android) |
| `resources/icon-background.png` | 1024 × 1024 px | Adaptive icon background (Android) |
| `resources/splash.png` | 2732 × 2732 px | Splash screen (centered subject) |
| `resources/splash-dark.png` | 2732 × 2732 px | Dark-mode splash (optional) |

The generated assets land in `ios/App/App/Assets.xcassets/` and
`android/app/src/main/res/` — both of which are tracked in git.

---

## Supabase Auth Deep-Links

OAuth and magic-link flows redirect back into the app via custom URL schemes.

### iOS — `Info.plist`
Add a URL scheme `bloomlog` in Xcode:
**Target → Info → URL Types → +**

| Key | Value |
|-----|-------|
| Identifier | `app.bloomlog` |
| URL Schemes | `bloomlog` |

### Android — `AndroidManifest.xml`
Add an intent filter to `MainActivity`:

```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https" android:host="bloomlog-six.vercel.app" />
</intent-filter>
<!-- Custom scheme fallback -->
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="bloomlog" />
</intent-filter>
```

In Supabase Dashboard → Authentication → URL Configuration, add:

```
bloomlog://auth/callback
https://bloomlog-six.vercel.app/auth/callback
```

---

## App Store / Play Store Submission Checklist

### Both Stores
- [ ] Unique app icons at all required sizes (use `@capacitor/assets`)
- [ ] Splash screens generated and verified on real devices
- [ ] App version / build number bumped in `ios/App/App.xcodeproj` and `android/app/build.gradle`
- [ ] Privacy policy URL ready (required by both stores)
- [ ] Sign in with Apple entitlement added (iOS) if using Supabase Apple OAuth

### iOS (App Store Connect)
- [ ] Signing certificate & provisioning profile configured in Xcode
- [ ] `NSCameraUsageDescription`, `NSMicrophoneUsageDescription` etc. added to `Info.plist` only if features are used
- [ ] App Transport Security allows `bloomlog-six.vercel.app` (default HTTPS — no changes needed)
- [ ] Universal Links / Associated Domains entitlement: `applinks:bloomlog-six.vercel.app`
- [ ] Export compliance: the app uses HTTPS but contains no custom crypto (tick "No")
- [ ] Review screenshots at 6.7", 6.1", and iPad sizes

### Android (Google Play Console)
- [ ] `keystore` file generated and stored securely (not in git)
- [ ] `android/app/build.gradle` `signingConfigs` block references the keystore
- [ ] Target SDK 34+ (required by Play Store since 2024)
- [ ] `android:networkSecurityConfig` not needed (HTTPS only)
- [ ] Data safety section completed in Play Console

---

## Architecture Notes

- **Core app logic lives entirely on Vercel.** This native shell has zero business logic.
- Deploying a new feature requires only a Vercel deployment — no new app store release.
- Breaking native-shell changes (new plugins, permission declarations, OS version bumps)
  require a new store release.
- The `server.url` can be changed via `cap:sync` without recompiling Swift/Kotlin, as long as
  the new URL is already in `server.allowNavigation`.

---

## Custom Domain

Once `bloomlog.app` is live on Vercel, update `capacitor.config.ts`:

```ts
server: {
  url: "https://bloomlog.app",
  allowNavigation: [
    "*.supabase.co",
    "*.supabase.in",
    "bloomlog-*.vercel.app",   // keep for staging
    "bloomlog.app",
    "*.bloomlog.app",
  ],
}
```

Then run `npm run cap:sync` and cut a new app-store release if you want the
store listing to reflect the new domain (screenshots, privacy policy URL etc.).
