/**
 * Astro configuration for the Sorrell documentation dogfood site.
 *
 * @file      astro.config.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";
import { docsAstroIntegration } from "@sorrell/docs-astro";

export default defineConfig({
    build: {
        format: "directory"
    },
    integrations: [ mdx(), docsAstroIntegration({ prefix: "/docs", site: "https://sorrell.sh" }) ],
    output: "static",
    srcDir: "./Source"
});
