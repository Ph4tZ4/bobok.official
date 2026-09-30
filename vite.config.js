import { defineConfig } from "vite";
import { resolve } from "node:path";
export default defineConfig({
  plugins: [
    {
      name: "admin-directory-index",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === "/admin/" || req.url === "/admin")
            req.url = "/admin/index.html";
          next();
        });
      },
    },
  ],
  server: {
    port: 65535,
    strictPort: true,
    proxy: { "/api": { target: "http://127.0.0.1:8080", changeOrigin: true } },
  },
  preview: {
    port: 65535,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, "index.html"),
        services: resolve(import.meta.dirname, "services/index.html"),
        solutions: resolve(import.meta.dirname, "solutions/index.html"),
        about: resolve(import.meta.dirname, "about/index.html"),
        process: resolve(import.meta.dirname, "process/index.html"),
        contact: resolve(import.meta.dirname, "contact/index.html"),
      },
    },
  },
});
