import { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";

// Set this via `.env` (EXPO_PUBLIC_WEB_URL=...) — see expo-app/.env.example.
// Falls back to the deployed URL so a fresh checkout still opens *something*.
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || "https://meeeyu.vercel.app";

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <WebView
        source={{ uri: WEB_URL }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        // meeeyu uses cookie-based auth (Supabase) — third-party cookie
        // rules don't apply here since everything is first-party to WEB_URL,
        // but sharedCookiesEnabled keeps sessions consistent across reloads.
        sharedCookiesEnabled
        allowsBackForwardNavigationGestures
        decelerationRate="normal"
      />
      {loading && (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator size="large" color="#ff6f9c" />
          <Text style={styles.loadingText}>loading your meeeyu…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf5ec",
  },
  webview: {
    flex: 1,
    backgroundColor: "#faf5ec",
  },
  loading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#faf5ec",
    gap: 12,
  },
  loadingText: {
    color: "#6b6258",
    fontSize: 14,
  },
});
