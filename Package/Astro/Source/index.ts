/**
 * Public exports for the Astro documentation integration.
 *
 * @module @sorrell/docs-astro
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
export {
    documentationSlug,
    sortDocumentationPages,
    visibleDocumentationPages
} from "./Content.js";
export type {
    DocumentationFrontmatter,
    DocumentationPageSummary
} from "./Content.js";
export { docsAstroIntegration } from "./Integration.js";
export type { DocsAstroIntegrationOptions } from "./Integration.js";
export {
    canonicalUrl,
    documentationRouting,
    docsPath,
    docsVersionPath,
    normalizeDocsPrefix
} from "./Routing.js";
