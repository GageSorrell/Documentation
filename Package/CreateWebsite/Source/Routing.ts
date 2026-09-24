/**
 * Public route and Vercel rewrite generation.
 *
 * @module @sorrell/docs-create-website/Routing
 *
 * @file      Routing.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { DocsConfig, SiteRouting } from "@sorrell/docs-core";
import type { DeploymentTarget, WebsiteDeployments } from "./Types.js";

export interface VercelRewrite {
    readonly source: string;
    readonly destination: string;
}

export interface LandingVercelConfig {
    readonly version: 2;
    readonly rewrites: ReadonlyArray<VercelRewrite>;
}

const normalizedUrl = (url: string): string => url.replace(/\/+$/, "");

const rewriteFor = (prefix: string, deployment: DeploymentTarget): ReadonlyArray<VercelRewrite> => {
    const destination = `${normalizedUrl(deployment.url)}${prefix}`;
    return [
        { source: prefix, destination },
        { source: `${prefix}/:path*`, destination: `${destination}/:path*` }
    ];
};

export const createLandingRewrites = (routing: SiteRouting, deployments: WebsiteDeployments): LandingVercelConfig => ({
    version: 2,
    rewrites: [
        ...rewriteFor(routing.documentationPrefix, deployments.documentation),
        ...(deployments.storybook === undefined ? [] : rewriteFor(routing.storybookPrefix, deployments.storybook))
    ]
});

export const createPlaceholderDeployments = (config: DocsConfig): WebsiteDeployments => ({
    documentation: { deploymentId: "pending-documentation", url: "https://documentation.invalid" },
    landing: { deploymentId: "pending-landing", url: config.metadata.url || "https://landing.invalid" },
    ...(config.storybook.enabled ? { storybook: { deploymentId: "pending-storybook", url: "https://storybook.invalid" } } : {})
});

export const publicUrl = (siteUrl: string, prefix: string, path = ""): string => {
    const normalizedSite = normalizedUrl(siteUrl);
    const normalizedPath = path.replace(/^\/+/, "");
    return `${normalizedSite}${prefix}${normalizedPath === "" ? "" : `/${normalizedPath}`}`;
};
