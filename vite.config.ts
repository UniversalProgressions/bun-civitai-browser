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
      "/settings": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/civitai_api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/gopeed": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/local-models": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
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
