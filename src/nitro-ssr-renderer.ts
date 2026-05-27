import { fetchViteEnv } from "nitro/vite/runtime";

export default function nitroSsrRenderer(event: { req: Request }) {
  return fetchViteEnv("ssr", event.req);
}
