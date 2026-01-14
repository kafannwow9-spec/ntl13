import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

// تعريف المسارات لضمان عملها في Node.js 22 على Render
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(async () => {
  const plugins = [
    react(),
  ];

  // الحفاظ على إضافات Replit الأصلية (التي أرسلتها أنت)
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
        // استخدام __dirname بدلاً من import.meta.dirname لضمان التوافق
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    base: "/",
    build: {
      outDir: path.resolve(__dirname, "dist", "public"),
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
