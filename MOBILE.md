# Getting meeeyu on TestFlight

This wraps the deployed web app in a native iOS shell (via
[Capacitor](https://capacitorjs.com)) so Xcode can build, sign, and upload it
to TestFlight. It does **not** bundle the Next.js app itself — Next's
server-rendered auth/cookie flow doesn't survive a static export — the
native shell just opens the live deployed site in a full-screen WKWebView,
the same way apps like Twitter/X's early iOS app or many Shopify storefronts
work.

You'll need: a Mac with Xcode installed, and an [Apple Developer
Program](https://developer.apple.com/programs/) membership ($99/year) — that
second one is required for TestFlight regardless of how the app is built.

## 1. Deploy the web app first

TestFlight testers need something live to load. Deploy to Vercel (or
anywhere) first — see the main README for the Supabase setup steps, then:

```bash
npm install
npx vercel --prod
```

Copy the resulting `https://....vercel.app` URL (or your custom domain).

## 2. Point the native shell at your deployed URL

Edit `capacitor.config.ts` at the repo root — replace the placeholder in
`server.url` with your real deployed URL, then re-sync:

```bash
npx cap sync ios
```

(`npx cap sync` regenerates `ios/App/App/capacitor.config.json` from
`capacitor.config.ts` — always re-run it after changing the config.)

## 3. Open it in Xcode

```bash
npx cap open ios
```

This opens `ios/App/App.xcodeproj`. In Xcode:

1. Select the **App** target → **Signing & Capabilities** → choose your Team
   (from your Apple Developer account). Xcode will auto-generate a
   provisioning profile.
2. Pick a simulator or your plugged-in iPhone and hit **Run** to sanity-check
   it loads your deployed site correctly.
3. Add a real app icon: `ios/App/App/Assets.xcassets/AppIcon.appiconset` —
   Capacitor ships a placeholder; Apple requires a real 1024×1024 icon before
   App Store Connect will process a build.

## 4. Archive and upload

1. Select **Any iOS Device (arm64)** as the run destination (not a
   simulator — archives can't be built for simulator targets).
2. **Product → Archive**.
3. When the Organizer window opens, **Distribute App → App Store Connect →
   Upload**, using your Team's signing.
4. Processing takes a few minutes to an hour. Once done, go to
   [App Store Connect](https://appstoreconnect.apple.com) → your app →
   **TestFlight** tab, and add the build to a testing group.
5. Invite testers by email (internal testers: your team, up to 100, no
   review needed) or submit for **external** testing (needs a quick Apple
   review, but supports public links / thousands of testers).

## Local testing against `npm run dev` instead of the deployed URL

The simulator/device can't reach your Mac's `localhost`. Instead:

1. Find your Mac's LAN IP (`ipconfig getifaddr en0`).
2. In `capacitor.config.ts`, temporarily set `server.url` to
   `http://<that-ip>:3000` and `cleartext: true`.
3. In `ios/App/App/Info.plist`, add an `NSAppTransportSecurity` exception for
   that IP (Apple blocks plain HTTP by default) — or just test against the
   deployed HTTPS URL instead, which needs no extra config and is usually
   easier.
4. `npx cap sync ios`, then re-run from Xcode.

Revert `server.url`/`cleartext` back to your deployed HTTPS URL before
archiving for TestFlight.

## Bundle ID

`capacitor.config.ts` currently sets `appId: "com.meeeyu.app"` — change this
to whatever reverse-DNS identifier you've registered (or will register) in
your Apple Developer account before archiving, then `npx cap sync ios`.
