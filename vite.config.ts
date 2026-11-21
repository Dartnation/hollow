import { defineConfig } from "vite";

const port = Number(process.env.PORT) || 5183;

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port,
    strictPort: false,
  },
  preview: {
    host: "127.0.0.1",
    port,
    strictPort: false,
  },
});
