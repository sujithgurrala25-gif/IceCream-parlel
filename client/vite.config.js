import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/IceCream-parlel/",
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:4000"
    }
  }
});
