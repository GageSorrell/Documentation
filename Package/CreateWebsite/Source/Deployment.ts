/**
 * Child-first deployment and release-manifest orchestration.
 *
 * @module @sorrell/docs-create-website/Deployment
 *
 * @file      Deployment.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Effect, Layer, Result } from "effect";
import { AtomicWriter, DocsPath, VercelService } from "@sorrell/docs-cli";
import { createLandingRewrites, type LandingVercelConfig } from "./Routing.js";
import type { DeploymentTarget, GeneratedWebsite, WebsiteDeployments } from "./Types.js";

export interface WebsiteDeploymentOptions {
    readonly production?: boolean;
    readonly revision?: string;
    readonly generatedAt?: string;
}

export interface WebsiteReleaseManifest {
    readonly version: 1;
    readonly generatedAt: string;
    readonly revision: string;
    readonly routes: GeneratedWebsite["config"]["routing"];
    readonly deployments: WebsiteDeployments;
    readonly landingConfig: LandingVercelConfig;
}

const targetFrom = (project: string, output: string, revision: string | undefined): DeploymentTarget => ({
    deploymentId: output,
    url: output,
    ...(revision === undefined ? {} : { revision }),
    project
});

export const deployWebsite = (website: GeneratedWebsite, options: WebsiteDeploymentOptions = {}): Effect.Effect<WebsiteReleaseManifest, unknown, VercelService | AtomicWriter | DocsPath> => Effect.gen(function*() {
    const vercel = yield* VercelService;
    const writer = yield* AtomicWriter;
    const path = yield* DocsPath;
    const deployOptions = options.production === undefined ? {} : { production: options.production };
    const documentationOutput = yield* vercel.deploy(`${website.target}/Documentation`, deployOptions);
    const documentation = targetFrom("documentation", documentationOutput, options.revision);
    const storybookOutput = website.config.storybook.enabled
        ? yield* vercel.deploy(`${website.target}/Storybook`, deployOptions).pipe(Effect.result)
        : Result.succeed(undefined);
    if (Result.isFailure(storybookOutput)) {
        yield* vercel.remove(documentationOutput).pipe(Effect.ignore);
        return yield* Effect.fail(storybookOutput.failure);
    }
    const storybook = storybookOutput.success === undefined ? undefined : targetFrom("storybook", storybookOutput.success, options.revision);
    const childDeployments: WebsiteDeployments = { documentation, landing: targetFrom("landing", "pending", options.revision), ...(storybook === undefined ? {} : { storybook }) };
    const landingConfig = createLandingRewrites(website.config.routing, childDeployments);
    yield* writer.writeText(path.join(website.target, "Landing", "vercel.json"), `${JSON.stringify(landingConfig, null, 2)}\n`);
    const landingResult = yield* vercel.deploy(`${website.target}/Landing`, deployOptions).pipe(Effect.result);
    if (Result.isFailure(landingResult)) {
        yield* vercel.remove(documentationOutput).pipe(Effect.ignore);
        if (storybookOutput.success !== undefined) {yield* vercel.remove(storybookOutput.success).pipe(Effect.ignore);}
        return yield* Effect.fail(landingResult.failure);
    }
    const landingOutput = landingResult.success;
    const landing = targetFrom("landing", landingOutput, options.revision);
    return {
        version: 1 as const,
        generatedAt: options.generatedAt ?? website.generatedAt,
        revision: options.revision ?? website.revision,
        routes: website.config.routing,
        deployments: { ...childDeployments, landing, ...(storybook === undefined ? {} : { storybook }) },
        landingConfig
    };
}).pipe(Effect.provide(Layer.mergeAll(AtomicWriter.layer, DocsPath.layer)));

export const writeReleaseManifest = (target: string, manifest: WebsiteReleaseManifest): Effect.Effect<void, unknown> => Effect.gen(function*() {
    const writer = yield* AtomicWriter;
    const path = yield* DocsPath;
    yield* writer.writeText(path.join(target, "ReleaseManifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}).pipe(Effect.provide(Layer.mergeAll(AtomicWriter.layer, DocsPath.layer)));
