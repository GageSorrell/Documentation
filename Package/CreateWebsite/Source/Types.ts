/**
 * Models for generated website workspaces and deployment manifests.
 *
 * @module @sorrell/docs-create-website/Types
 *
 * @file      Types.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { DocsConfig, DocsConfigInput } from "@sorrell/docs-core";

export type WebsitePackageKind = "landing" | "documentation" | "storybook";

export interface WebsiteGenerationOptions {
    readonly target: string;
    readonly config?: DocsConfigInput;
    readonly revision?: string;
    readonly generatedAt?: string;
}

export interface GeneratedWebsiteFile {
    readonly path: string;
    readonly content: string;
}

export interface GeneratedWebsitePackage {
    readonly kind: WebsitePackageKind;
    readonly directory: string;
    readonly name: string;
    readonly routePrefix: string;
}

export interface GeneratedWebsite {
    readonly target: string;
    readonly config: DocsConfig;
    readonly packages: ReadonlyArray<GeneratedWebsitePackage>;
    readonly files: ReadonlyArray<GeneratedWebsiteFile>;
    readonly revision: string;
    readonly generatedAt: string;
}

export interface DeploymentTarget {
    readonly project?: string;
    readonly deploymentId: string;
    readonly url: string;
    readonly revision?: string;
}

export interface WebsiteDeployments {
    readonly documentation: DeploymentTarget;
    readonly landing: DeploymentTarget;
    readonly storybook?: DeploymentTarget;
}
