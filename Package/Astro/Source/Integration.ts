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

import type { AstroConfig, AstroIntegration } from "astro";
import { normalizeDocsPrefix } from "./Routing.js";

/** @internal */
export interface DocsAstroIntegrationOptions {
    readonly prefix?: string;
    readonly site?: string;
}
export/** @internal */
const docsAstroIntegration = (
    options: DocsAstroIntegrationOptions = {}
): AstroIntegration =>
{
    const prefix = normalizeDocsPrefix(options.prefix);
    interface HookArg {
        readonly updateConfig: (newConfig: Partial<AstroConfig>) => AstroConfig;
    }
    return {
        hooks: {
            "astro:config:setup": ({ updateConfig }: HookArg) =>
            {
                updateConfig({
                    base: prefix,
                    site: options.site
                });
            }
        },
        name: "@sorrell/docs-astro"
    };
};
