import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "Cascade - Project Management",
        short_name: "Cascade",
        description: "Collaborative project management platform with real-time editing",
        theme_color: "#3b82f6",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // TEMPORARY: Increase limit until bundle is optimized
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MB
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
    // Gzip compression
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
    }),
    // Brotli compression (better than gzip)
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
    }),
    // Bundle analyzer
    mode === "analyze"
      ? visualizer({
          open: true,
          filename: "dist/stats.html",
          gzipSize: true,
          brotliSize: true,
        })
      : null,
    // Chef dev mode
    mode === "development"
      ? {
          name: "inject-chef-dev",
          transform(code: string, id: string) {
            if (id.includes("main.tsx")) {
              return {
                code: `${code}

/* Added by Vite plugin inject-chef-dev */
window.addEventListener('message', async (message) => {
  if (message.source !== window.parent) return;
  if (message.data.type !== 'chefPreviewRequest') return;

  const worker = await import('https://chef.convex.dev/scripts/worker.bundled.mjs');
  await worker.respondToMessage(message);
});
            `,
                map: null,
              };
            }
            return null;
          },
        }
      : null,
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Target modern browsers for smaller bundle
    target: "esnext",
    // Enable minification
    minify: "esbuild",
    // Source maps for production debugging
    sourcemap: mode === "production" ? "hidden" : true,
    // CSS code splitting
    cssCodeSplit: true,
    // Chunk size warnings
    chunkSizeWarningLimit: 500, // KB
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: (id) => {
          // React and React DOM
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "react-vendor";
          }

          // Convex (backend)
          if (
            id.includes("node_modules/convex/") ||
            id.includes("node_modules/@convex-dev/")
          ) {
            return "convex";
          }

          // BlockNote editor (HEAVY - lazy load this!)
          if (id.includes("node_modules/@blocknote/")) {
            return "editor";
          }

          // Mantine UI (HEAVY)
          if (id.includes("node_modules/@mantine/")) {
            return "mantine";
          }

          // Icons
          if (id.includes("node_modules/lucide-react/")) {
            return "icons";
          }

          // Analytics (can be lazy loaded)
          if (id.includes("node_modules/posthog-js/")) {
            return "analytics";
          }

          // Onboarding tour
          if (id.includes("node_modules/driver.js/")) {
            return "tour";
          }

          // Markdown rendering
          if (
            id.includes("node_modules/react-markdown/") ||
            id.includes("node_modules/remark-")
          ) {
            return "markdown";
          }

          // Other vendor chunks
          if (id.includes("node_modules/")) {
            return "vendor";
          }
        },
        // Optimize chunk names
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    // Increase chunk size for better compression
    reportCompressedSize: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "convex/react",
      "sonner",
      "clsx",
      "tailwind-merge",
    ],
    exclude: [
      // Lazy load these
      "@blocknote/core",
      "@blocknote/react",
      "@blocknote/mantine",
      "driver.js",
      "posthog-js",
    ],
  },
}));
