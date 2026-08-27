import type { CapacitorConfig } from "@capacitor/cli";

// This wraps the deployed meeeyu web app in a native iOS shell so it can be
// built, signed, and uploaded to TestFlight from Xcode. It does NOT bundle
// the Next.js app itself (Next's server-rendered auth/cookies flow doesn't
// work as a static export) — the shell just loads the live site below.
const config: CapacitorConfig = {
  appId: "com.meeeyu.app",
  appName: "meeeyu",
  webDir: "mobile/www",
  server: {
    // Replace with your deployed URL (e.g. after `vercel --prod`).
    // For local testing against `npm run dev`, use your Mac's LAN IP —
    // not localhost, the simulator/device can't reach your host's
    // localhost — e.g. "http://192.168.1.23:3000", and set cleartext: true.
    url: "https://meeeyu.vercel.app",
    cleartext: false,
  },
};

export default config;
