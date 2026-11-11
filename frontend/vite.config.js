import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const proxy = {
  "/api": { target: "http://127.0.0.1:3000", changeOrigin: true },
};
export default defineConfig({
  plugins: [vue()],
  server: { host: "127.0.0.1", port: 5173, strictPort: true, proxy },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true, proxy },
});
