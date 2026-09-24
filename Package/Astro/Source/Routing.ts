/**
 * Route and canonical URL helpers for Astro documentation applications.
 *
 * @module @sorrell/docs-astro/Routing
 *
 * @file      Routing.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { SiteRouting } from "@sorrell/docs-core";

export const normalizeDocsPrefix = (prefix: string = "/docs"): string => {
    if (prefix === "/") {return "/";}
    return `/${prefix.replace(/^\/+/, "").replace(/\/+$/, "")}`;
};

export const docsPath = (prefix: string, path: string = ""): string => {
    const normalizedPrefix = normalizeDocsPrefix(prefix);
    const normalizedPath = path.replace(/^\/+/, "");
    return normalizedPath === "" ? `${normalizedPrefix}/` : `${normalizedPrefix}/${normalizedPath}`;
};

export const docsVersionPath = (prefix: string, version: string, path: string = ""): string =>
    docsPath(prefix, `${version.replace(/^\/+|\/+$/g, "")}/${path.replace(/^\/+/, "")}`);

export const canonicalUrl = (siteUrl: string, path: string): string => {
    const normalizedSite = siteUrl.replace(/\/+$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${normalizedSite}${normalizedPath}`;
};

export const documentationRouting = (routing?: Partial<SiteRouting>): SiteRouting => ({
    documentationPrefix: normalizeDocsPrefix(routing?.documentationPrefix),
    storybookPrefix: normalizeDocsPrefix(routing?.storybookPrefix ?? "/storybook")
});
