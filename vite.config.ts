import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
// import tsconfigPaths from 'vite-tsconfig-paths'

import "react";
import "react-dom";

export default defineConfig({
  root: "./src/html",
  base: "./",
  build: {
    outDir: "../../public",
  },
  server: {
    proxy: {
      "/settings": "http://127.0.0.1:3000",
      "/civitai": "http://127.0.0.1:3000",
    },
  },
  plugins: [
    // tsconfigPaths(),
    react({ babel: { babelrc: true, configFile: true } }),
    tailwindcss(),
  ],
  optimizeDeps: {
    include: ["react/jsx-runtime"],
  },
});
