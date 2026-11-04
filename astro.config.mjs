import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Incrusta los CSS de /_astro/ directamente en el HTML para eliminar
// solicitudes que bloquean el renderizado (el bundle es único y pequeño).
function inlineCss() {
  let outDir;
  return {
    name: 'inline-css',
    hooks: {
      'astro:config:done': ({ config }) => {
        outDir = config.outDir instanceof URL
          ? fileURLToPath(config.outDir)
          : config.outDir;
      },
      'astro:build:done': () => {
        const htmlFiles = [];
        const walk = (dir) => {
          for (const entry of readdirSync(dir)) {
            const p = join(dir, entry);
            if (statSync(p).isDirectory()) walk(p);
            else if (entry.endsWith('.html')) htmlFiles.push(p);
          }
        };
        walk(outDir);
        for (const file of htmlFiles) {
          let html = readFileSync(file, 'utf8');
          html = html.replace(
            /<link rel="stylesheet" href="(\/_astro\/[^"]+\.css)"[^>]*>/g,
            (match, href) => {
              const cssPath = join(outDir, href.replace(/^\//, ''));
              if (!statSync(cssPath).isFile()) return match;
              return `<style>${readFileSync(cssPath, 'utf8')}</style>`;
            },
          );
          writeFileSync(file, html);
        }
      },
    },
  };
}

// En producción, public/.htaccess reescribe /blog/<slug> hacia la plantilla
// /blog/post/ (el artículo se carga en el navegador). Esto replica esa regla
// en `astro dev` para que las URLs de artículos funcionen en local.
function blogSlugDevRewrite() {
  return {
    name: 'blog-slug-dev-rewrite',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use((req, _res, next) => {
          const [pathname, query] = (req.url ?? '').split('?');
          const match = pathname.match(/^\/blog\/([^/.]+)\/?$/);

          if (req.method === 'GET' && match && match[1] !== 'post') {
            req.url = query ? `/blog/post/?${query}` : '/blog/post/';
          }

          next();
        });
      },
    },
  };
}

export default defineConfig({
  env: {
    schema: {
      // Se incrusta en el JS del navegador: el contenido se consulta en cliente.
      WP_API_URL: envField.string({
        context: 'client',
        access: 'public',
        url: true,
      }),
      CF7_FORM_ID: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
    },
  },
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/$/, '');
        return path !== '/404' && path !== '/blog/post';
      },
    }),
    inlineCss(),
    blogSlugDevRewrite(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'static',
  site: 'https://luisangelgutierrez.com',
  image: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.luisangelgutierrez.com',
      },
    ],
  },
});
