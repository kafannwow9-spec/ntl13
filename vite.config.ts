import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(async () => {
  const plugins = [
    react(),
  ];

  // Dynamically import Replit-specific plugins only if they exist
  try {
    const runtimeErrorOverlay = await import("@replit/vite-plugin-runtime-error-modal").then(m => m.default || m);
    if (runtimeErrorOverlay) plugins.push(runtimeErrorOverlay());
  } catch (e) {}

  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    try {
      const cartographer = await import("@replit/vite-plugin-cartographer").then(m => m.default || m);
      if (cartographer) plugins.push(cartographer.cartographer());
    } catch (e) {}

    try {
      const devBanner = await import("@replit/vite-plugin-dev-banner").then(m => m.default || m);
      if (devBanner) plugins.push(devBanner.devBanner());
    } catch (e) {}
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    base: "/",
    build: {
      outDir: path.resolve(import.meta.dirname, "dist", "public"),
      emptyOutDir: true,
    },
    server: {
      strictPort: true,
      port: 5000,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: false
      }
    },
  };
});
