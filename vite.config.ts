// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";
import type { ConfigEnv, Plugin } from "vite";

function nitroForVercelBuild(): Plugin[] {
  return nitro({ preset: "vercel" }).map((plugin) => {
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

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// Nitro's Vercel preset emits .vercel/output so Vercel routes all SSR requests to the server function.
// @cloudflare/vite-plugin builds from this; wrangler.jsonc main alone is insufficient.
export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: nitroForVercelBuild(),
    resolve: {
      alias: {
        "@supabase/node-fetch": "@supabase/node-fetch/browser.js",
      },
    },
  },
});
