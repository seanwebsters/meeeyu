import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VoysNote",
    short_name: "VoysNote",
    description: "30 seconds a day from the world's most interesting people.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#EB4213",
    theme_color: "#0c0c0b",
    categories: ["social", "music", "lifestyle"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
