/**
 *
 *
 * @module @sorrell/docs-create-website/Test/Deployment.test
 *
 * @file      Deployment.test.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { DocsIntegrationError, VercelService } from "@sorrell/docs-cli";
import { createGeneratedWebsite } from "../Source/Generator.js";
import { deployWebsite } from "../Source/Deployment.js";

describe("website deployment orchestration", () => {
    it("deploys children before Landing and writes child rewrites", async () => {
        const target = await mkdtemp(join(tmpdir(), "sorrell-deploy-"));
        await mkdir(join(target, "Landing"));
        const order: Array<string> = [];
        const layer = Layer.succeed(VercelService, VercelService.of({
            deploy: (directory) => Effect.sync(() => {
                const project = directory.split(/[\\/]/).at(-1) ?? "unknown";
                order.push(project);
                return `https://${project.toLowerCase()}.vercel.app`;
            }),
            inspect: () => Effect.succeed("ready"),
            promote: () => Effect.void,
            rollback: () => Effect.void,
            remove: () => Effect.void
        }));
        const result = await Effect.runPromise(deployWebsite(createGeneratedWebsite({ target, config: { storybook: { enabled: true } } })).pipe(Effect.provide(layer)));
        expect(order).toEqual([ "Documentation", "Storybook", "Landing" ]);
        expect(result.deployments.landing.url).toBe("https://landing.vercel.app");
        expect(await readFile(join(target, "Landing/vercel.json"), "utf8")).toContain("https://documentation.vercel.app/docs");
    });

    it("removes child deployments when Landing fails", async () => {
        const target = await mkdtemp(join(tmpdir(), "sorrell-deploy-fail-"));
        await mkdir(join(target, "Landing"));
        const removed: Array<string> = [];
        const layer = Layer.succeed(VercelService, VercelService.of({
            deploy: (directory) => directory.endsWith("Landing")
                ? Effect.fail(new DocsIntegrationError({ provider: "vercel", operation: "deploy", cause: "failure" }))
                : Effect.succeed(directory.endsWith("Storybook") ? "https://storybook.vercel.app" : "https://documentation.vercel.app"),
            inspect: () => Effect.succeed("ready"),
            promote: () => Effect.void,
            rollback: () => Effect.void,
            remove: (deployment) => Effect.sync(() => { removed.push(deployment); })
        }));
        const result = await Effect.runPromiseExit(deployWebsite(createGeneratedWebsite({ target, config: { storybook: { enabled: true } } })).pipe(Effect.provide(layer)));
        expect(result._tag).toBe("Failure");
        expect(removed).toEqual([ "https://documentation.vercel.app", "https://storybook.vercel.app" ]);
    });
});
