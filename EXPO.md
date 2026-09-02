# Testing meeeyu on your phone with Expo Go

This is the fastest way to see the app on a real device — **no Xcode, no
Apple Developer account, no App Store review, no build step.** Expo Go is a
free app from the App Store/Play Store that runs your project instantly by
scanning a QR code.

`expo-app/` wraps the deployed web app in a thin native shell (a full-screen
WebView) — same idea as the Xcode/TestFlight setup in `MOBILE.md`, but this
one you can test in the next two minutes instead of going through Xcode and
Apple's review.

## 1. Get the web app running somewhere reachable

Pick one:

- **Deployed** (works from anywhere): deploy to Vercel per the main README,
  then use that `https://....vercel.app` URL.
- **Local dev server** (works while your phone and computer are on the same
  WiFi): run `npm run dev` from the repo root, then find your computer's LAN
  IP (`ipconfig getifaddr en0` on Mac) — you'll use `http://<that-ip>:3000`,
  **not** `localhost` (your phone can't reach your computer's localhost).

## 2. Point the Expo shell at it

```bash
cd expo-app
npm install
cp .env.example .env
```

Edit `.env` and set `EXPO_PUBLIC_WEB_URL` to whichever URL you picked above.

## 3. Install Expo Go and run it

1. Install **Expo Go** on your phone (App Store / Google Play — free).
2. From `expo-app/`, run:
   ```bash
   npx expo start
   ```
3. A QR code prints in your terminal. Scan it:
   - iPhone: open the **Camera** app and point it at the QR code, tap the
     notification.
   - Android: open **Expo Go** and use its built-in QR scanner.
4. The app opens in Expo Go and loads your meeeyu site full-screen.

If your phone and computer aren't on the same WiFi (or you're testing from
this sandboxed environment, which isn't on any LAN your phone can join),
add `--tunnel` to the start command — `npx expo start --tunnel` — which
routes through Expo's relay so it works over the open internet instead of
requiring a shared network. It's slower to load but works from anywhere.

## Notes

- This is a WebView shell, same tradeoff as the Xcode version in
  `MOBILE.md`: it loads your real, live site rather than being a from-scratch
  native rewrite. Everything in the actual app (auth, onboarding, the
  scrapbook, themes) works exactly as it does in a browser, because it *is*
  the browser engine under the hood.
- This can't be used to submit to the App Store directly — Expo Go is a
  sandbox for development. To actually ship on TestFlight/the App Store,
  follow `MOBILE.md` instead (or run `npx eas build` if you want Expo's own
  cloud build service to produce a signed binary — that needs an Expo
  account and is a separate path from both `MOBILE.md` and this one).
