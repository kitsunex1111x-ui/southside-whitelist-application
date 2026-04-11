import fs from "fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const certDir = path.resolve(__dirname, "certs");
const certFile = path.join(certDir, "localhost.pem");
const keyFile = path.join(certDir, "localhost-key.pem");
const https = undefined; // Temporarily disabled - fs.existsSync(certFile) && fs.existsSync(keyFile)
  // ? {
  //     key: fs.readFileSync(keyFile),
  //     cert: fs.readFileSync(certFile),
  //   }
  // : undefined;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    https,
    allowedHosts: ["localhost", "southsidewhapp", "*.southsidewhapp", "127.0.0.1"],
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
