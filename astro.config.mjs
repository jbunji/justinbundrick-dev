import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://justinbundrick.dev",
  integrations: [tailwind()],
});
