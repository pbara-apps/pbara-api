import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "api/index.js",
  sourcemap: true,
  packages: "external",
  alias: {
    "@": "./src",
  },
  logLevel: "info",
});

console.log("Build complete: api/index.js");
