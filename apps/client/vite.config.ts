import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2022",
    sourcemap: true,
    rollupOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "phaser", test: /[\\/]phaser[\\/]/ },
            { name: "react", test: /[\\/](?:react-dom|react)[\\/]/ },
          ],
        },
      },
    },
  },
  worker: {
    format: "es",
  },
});
