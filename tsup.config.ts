import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  platform: "node",
  target: "node20",
  outDir: "dist",
  external: [
    "pg-native",
    "@prisma/client",
    "@prisma/client-runtime-utils",
    "@prisma/adapter-pg",
    "./generated/prisma/*",
    "../generated/prisma/*",
    "../../generated/prisma/*",
  ],
  noExternal: [],
  skipNodeModulesBundle: true,
  shims: true,
  outExtension() {
    return { js: ".mjs" };
  },
  clean: true,
  splitting: false,
  bundle: true,
  esbuildOptions(options) {
    options.mainFields = ["module", "main"];
  },
  esbuildPlugins: [
    {
      name: 'external-prisma',
      setup(build) {
        // Mark all Prisma imports as external
        build.onResolve({ filter: /@prisma\// }, args => {
          return { external: true };
        });
        // Mark generated Prisma as external and rewrite path
        build.onResolve({ filter: /generated\/prisma/ }, args => {
          // Rewrite any depth of relative path to ./generated/prisma
          return { 
            external: true,
            path: './generated/prisma/index.js'
          };
        });
      }
    }
  ]
});