import { defineConfig, type ConfigEnv, type Plugin } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

function nitroForVercelBuild(): Plugin[] {
  return nitro({
    preset: "vercel",
    renderer: {
      handler: "./src/nitro-ssr-renderer.ts",
    },
  }).map((plugin) => {
    const originalApply = plugin.apply;

    return {
      ...plugin,
      apply(config, env: ConfigEnv) {
        if (env.command !== "build" && !env.isPreview) return false;

        if (typeof originalApply === "function") {
          return originalApply(config, env);
        }

        if (originalApply === "build") return env.command === "build";
        if (originalApply === "serve") return env.command === "serve";
        return true;
      },
    };
  });
}

const viteEnvDefines = Object.fromEntries(
  Object.entries(process.env)
    .filter(([key]) => key.startsWith("VITE_"))
    .map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
);

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  define: viteEnvDefines,
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
    ...nitroForVercelBuild(),
    viteReact(),
  ],
  resolve: {
    alias: {
      "@": `${process.cwd()}/src`,
      "@supabase/node-fetch": "@supabase/node-fetch/browser.js",
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
});
