/**
 * Sitemap Generator for ToolCheetah
 *
 * Generates a sitemap.xml for https://toolcheetah.com
 * including all static pages, categories, and tools.
 *
 * Usage:
 *   - Local: npm run generate-sitemap
 *   - Directly: npx tsx generate-sitemap.ts
 *   - Automatically runs during: npm run build
 *
 * The sitemap is written to public/sitemap.xml
 */

import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import categories and tools
import { categories, tools } from "./src/data/tools.js";

interface SitemapUrl {
  loc: string;
  changefreq: string;
  priority: string;
}

const BASE_URL = "https://toolcheetah.com";

const staticPages: SitemapUrl[] = [
  { loc: `${BASE_URL}/`, changefreq: "daily", priority: "1.0" },
  { loc: `${BASE_URL}/categories`, changefreq: "weekly", priority: "0.9" },
  { loc: `${BASE_URL}/popular`, changefreq: "weekly", priority: "0.9" },
  { loc: `${BASE_URL}/search`, changefreq: "weekly", priority: "0.8" },
  { loc: `${BASE_URL}/about`, changefreq: "monthly", priority: "0.7" },
  { loc: `${BASE_URL}/privacy-policy`, changefreq: "monthly", priority: "0.5" },
  { loc: `${BASE_URL}/contact`, changefreq: "monthly", priority: "0.7" },
  { loc: `${BASE_URL}/terms-of-service`, changefreq: "monthly", priority: "0.5" },
];

function generateUrls(): SitemapUrl[] {
  const urls: SitemapUrl[] = [...staticPages];

  // Categories
  categories.forEach((category) => {
    urls.push({
      loc: `${BASE_URL}/${category.id}`,
      changefreq: "weekly",
      priority: "0.8",
    });
  });

  // Tools
  tools.forEach((tool) => {
    urls.push({
      loc: `${BASE_URL}/${tool.category}/${tool.id}`,
      changefreq: "weekly",
      priority: "0.9",
    });
  });

  return urls;
}

function buildSitemapXml(urls: SitemapUrl[]): string {
  const xmlParts: string[] = [];
  xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');
  xmlParts.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

  urls.forEach((url) => {
    xmlParts.push("  <url>");
    xmlParts.push(`    <loc>${url.loc}</loc>`);
    xmlParts.push(`    <changefreq>${url.changefreq}</changefreq>`);
    xmlParts.push(`    <priority>${url.priority}</priority>`);
    xmlParts.push("  </url>");
  });

  xmlParts.push("</urlset>");
  return xmlParts.join("\n");
}

function main() {
  try {
    console.log("Generating sitemap...");

    const urls = generateUrls();
    const sitemapXml = buildSitemapXml(urls);

    const outputDir = join(__dirname, "public");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = join(outputDir, "sitemap.xml");
    writeFileSync(outputPath, sitemapXml, "utf-8");

    console.log(`✓ Sitemap generated at: ${outputPath}`);
    console.log(`✓ Total URLs: ${urls.length}`);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    process.exit(1);
  }
}

main();
