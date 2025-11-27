import path from "node:path";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import viteCompression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";

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
  server: {
    port: 5555,
  },
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
          // Check if it's in node_modules
          if (!id.includes("node_modules/")) {
            return undefined;
          }

          // Chunk mapping for vendor dependencies
          // NOTE: Order matters! More specific patterns must come first to avoid false matches
          const chunkMap = [
            { patterns: ["react-markdown/", "remark-"], chunk: "markdown" },
            { patterns: ["react/", "react-dom/"], chunk: "react-vendor" },
            { patterns: ["convex/", "@convex-dev/"], chunk: "convex" },
            { patterns: ["@blocknote/"], chunk: "editor" },
            { patterns: ["@mantine/"], chunk: "mantine" },
            { patterns: ["lucide-react/"], chunk: "icons" },
            { patterns: ["posthog-js/"], chunk: "analytics" },
            { patterns: ["driver.js/"], chunk: "tour" },
          ];

          // Find matching chunk
          for (const { patterns, chunk } of chunkMap) {
            if (patterns.some((pattern) => id.includes(pattern))) {
              return chunk;
            }
          }

          // Default vendor chunk for other node_modules
          return "vendor";
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
    include: ["react", "react-dom", "convex/react", "sonner", "clsx", "tailwind-merge"],
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
