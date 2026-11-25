import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from https://arielmulkin.github.io/GOAT/
export default defineConfig({
  plugins: [react()],
  base: "/GOAT/",
});
