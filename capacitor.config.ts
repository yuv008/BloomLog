import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config for BloomLog — remote URL / server-mode shell.
 *
 * The WebView loads the production Vercel deployment; no static export required.
 * To point at a staging branch, override server.url at build time or in a
 * separate capacitor.config.staging.ts and pass --config to cap commands.
 */
const config: CapacitorConfig = {
  appId: "app.bloomlog",
  appName: "BloomLog",
  webDir: "out", // only used for local asset fallback; not relevant in server mode

  server: {
    // Primary content source — the live Vercel deployment.
    // Change this to https://bloomlog.app once the custom domain is live.
    url: "https://bloomlog-six.vercel.app",

    // Allow navigating to Supabase auth callback URLs and any future
    // sub-domains (e.g. staging preview URLs on Vercel).
    allowNavigation: [
      "*.supabase.co",
      "*.supabase.in",
      "bloomlog-*.vercel.app",
      "bloomlog.app",
      "*.bloomlog.app",
    ],

    // Use https scheme on Android to keep cookie/storage semantics
    // consistent with a real HTTPS origin.
    androidScheme: "https",

    // Prevent the WebView from clearing local storage between sessions.
    cleartext: false,
  },

  ios: {
    // Allow the status bar area to be used by the web content (full-bleed).
    // The web app should handle safe-area-inset via CSS env() variables.
    contentInset: "automatic",

    // Required for Supabase "Sign in with Apple" and OAuth redirects.
    // The URL scheme registered in Info.plist should match this.
    scheme: "bloomlog",

    // Scroll behaviour: native feels more appropriate for a journal app.
    scrollEnabled: true,

    // Prefer native back-gesture over the JS history stack.
    allowsLinkPreview: false,
  },

  android: {
    // Allow mixed content only when explicitly needed; keep off by default.
    allowMixedContent: false,

    // Capture back button and let the JS app router handle navigation.
    captureInput: true,

    // Minimum WebView version (Chrome 60+) — Capacitor default.
    minWebViewVersion: 60,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0f0f0f",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      iosSpinnerStyle: "small",
      spinnerColor: "#a855f7",
    },

    StatusBar: {
      // Overlay the web content under the status bar (translucent).
      overlaysWebView: true,
      style: "DARK",
      backgroundColor: "#00000000",
    },

    // App plugin — handles deep-links / universal links for Supabase OAuth.
    App: {
      // iOS Universal Links: configure in apple-app-site-association on server
      // Android App Links: configure in assetlinks.json on server
    },
  },
};

export default config;
