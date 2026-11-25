import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" makes the build work on GitHub Pages project sites
// (e.g. you.github.io/goat-game/) without hardcoding the repo name.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
