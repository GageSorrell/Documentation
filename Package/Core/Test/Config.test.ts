/**
 *
 *
 * @module @sorrell/docs-core/Test/config.test
 *
 * @file      Config.test.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { describe, expect, it } from "vitest";
import { Result, Schema } from "effect";
import { VercelReleaseManifestSchema } from "../Source/Schemas.js";
import { decodeDocsConfig, decodeDocsConfigEffect, decodeDocsConfigSync, DocsConfigError } from "../Source/index.js";

describe("docs-core configuration", () => {
    it("decodes and normalizes a minimal configuration deterministically", () => {
        const config = decodeDocsConfigSync({ metadata: { name: "Example" } });
        expect(config.metadata.title).toBe("Example");
        expect(config.versions).toEqual([ { id: "current", label: "Current", directory: ".", current: true, order: 0 } ]);
        expect(config.api.enabled).toBe(false);
        expect(config.tokens.dark.codeBackground).toBe("#18181b");
        expect(config.routing).toEqual({ documentationPrefix: "/docs", storybookPrefix: "/storybook" });
        expect(config.vercel.projects.landing.directory).toBe("Landing");
        expect(config.vercel.projects.documentation.routePrefix).toBe("/docs");
        expect(config.vercel.projects.storybook).toBeUndefined();
    });

    it("normalizes custom routes and Vercel project metadata", () => {
        const config = decodeDocsConfigSync({
            metadata: { name: "Example" },
            routing: { documentationPrefix: "/reference", storybookPrefix: "/workbench" },
            storybook: { enabled: true },
            vercel: {
                projects: {
                    landing: { project: "example-landing" },
                    documentation: { project: "example-documentation" },
                    storybook: { project: "example-storybook", origin: "https://storybook.example.test" }
                }
            }
        });
        expect(config.vercel.projects.landing.project).toBe("example-landing");
        expect(config.vercel.projects.documentation.routePrefix).toBe("/reference");
        expect(config.vercel.projects.storybook?.origin).toBe("https://storybook.example.test");
    });

    it("rejects invalid or overlapping application routes", () => {
        const invalid = decodeDocsConfig({ metadata: { name: "Example" }, routing: { documentationPrefix: "docs", storybookPrefix: "/storybook" } });
        expect(Result.isFailure(invalid)).toBe(true);
        if (Result.isFailure(invalid)) {
            expect(invalid.failure.diagnostics.some((diagnostic) => diagnostic.path.join(".") === "routing.documentationPrefix")).toBe(true);
        }

        const overlapping = decodeDocsConfig({ metadata: { name: "Example" }, routing: { documentationPrefix: "/docs", storybookPrefix: "/docs/storybook" } });
        expect(Result.isFailure(overlapping)).toBe(true);
        if (Result.isFailure(overlapping)) {expect(overlapping.failure.diagnostics.some((diagnostic) => diagnostic.path.join(".") === "routing")).toBe(true);}
    });

    it("reports schema paths and cross-field paths", () => {
        const invalid = decodeDocsConfig({
            metadata: { name: 42 },
            redirects: [ { from: "old", to: "new" } ]
        });
        expect(Result.isFailure(invalid)).toBe(true);
        if (Result.isFailure(invalid)) {
            expect(invalid.failure).toBeInstanceOf(DocsConfigError);
            expect(invalid.failure.diagnostics.some((diagnostic) => diagnostic.path.join(".") === "metadata.name")).toBe(true);
        }

        const crossField = decodeDocsConfig({ metadata: { name: "Example" }, redirects: [ { from: "old", to: "/new" } ] });
        expect(Result.isFailure(crossField)).toBe(true);
        if (Result.isFailure(crossField)) {expect(crossField.failure.diagnostics[0]?.path).toEqual([ "redirects", 0, "from" ]);}
    });

    it("is available as an Effect without importing Node services", async () => {
        const value = await import("effect").then(({ Effect }) => Effect.runPromise(decodeDocsConfigEffect({ metadata: { name: "Example" } })));
        expect(value.metadata.name).toBe("Example");
    });

    it("decodes a release manifest for the independently deployed packages", () => {
        const manifest = Schema.decodeUnknownSync(VercelReleaseManifestSchema)({
            revision: "abc123",
            generatedAt: "2026-09-23T00:00:00.000Z",
            routes: { documentationPrefix: "/docs", storybookPrefix: "/storybook" },
            landing: { project: "example-landing", deploymentId: "landing-1", url: "https://landing.vercel.app" },
            documentation: { project: "example-documentation", deploymentId: "documentation-1", url: "https://documentation.vercel.app" },
            storybook: { project: "example-storybook", deploymentId: "storybook-1", url: "https://storybook.vercel.app" },
            apiSnapshot: "snapshot-1"
        });
        expect(manifest.documentation.url).toBe("https://documentation.vercel.app");
    });
});
