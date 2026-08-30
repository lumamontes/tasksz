// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    react(),
  ],
  image: {
    // Passthrough: the project currently ships SVG-only assets, which should
    // be served as-is. Switch to sharp if raster optimization is needed later.
    service: {
      entrypoint: 'astro/assets/services/noop',
    },
  },
  build: {
    inlineStylesheets: 'auto',
  },
});
