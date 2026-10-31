import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: 'github-light-high-contrast',
    },
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Perspective's WASM bootstrap uses top-level await
      target: 'esnext',
    },
    server: {
      allowedHosts: ['.netlify.app']
    }
  },
  adapter: netlify()
});
