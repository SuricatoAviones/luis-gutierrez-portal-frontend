import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const siteUrl = site ?? new URL("https://luisangelgutierrez.com");
  const sitemapUrl = new URL("/sitemap-index.xml", siteUrl);

  return new Response(
    `User-agent: *\nAllow: /\nSitemap: ${sitemapUrl.href}\n`,
    {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    },
  );
};