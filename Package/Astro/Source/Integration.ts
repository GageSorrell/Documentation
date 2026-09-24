/**
 * Astro integration for the normalized Sorrell documentation route.
 *
 * @module @sorrell/docs-astro/Integration
 *
 * @file      Integration.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { AstroIntegration } from "astro";
import { normalizeDocsPrefix } from "./Routing.js";

export interface DocsAstroIntegrationOptions {
    readonly prefix?: string;
    readonly site?: string;
}

export const docsAstroIntegration = (options: DocsAstroIntegrationOptions = {}): AstroIntegration => {
    const prefix = normalizeDocsPrefix(options.prefix);
    return {
        hooks: {
            "astro:config:setup": ({ updateConfig }) => {
                updateConfig({
                    base: prefix,
                    site: options.site
                });
            }
        },
        name: "@sorrell/docs-astro"
    };
};
