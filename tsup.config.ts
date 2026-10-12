import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts", "api/index.ts"],
  format: ["esm"],
  clean: true,
  target: "es2023",
  sourcemap: true,
});
