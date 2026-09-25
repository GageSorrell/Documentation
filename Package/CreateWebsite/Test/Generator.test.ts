/**
 *
 *
 * @module @sorrell/docs-create-website/Test/Generator.test
 *
 * @file      Generator.test.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { describe, expect, it } from "vitest";
import { createGeneratedWebsite } from "../Source/Generator.js";
describe("three-package website generation", () =>
{
    it("generates Landing and Documentation without Storybook by default", () =>
    {
        const website = createGeneratedWebsite({
            generatedAt: "2026-09-24T00:00:00.000Z",
            revision: "abc123",
            target: "generated"
        });
        expect(
            website.packages.map(
                (item: GeneratedWebsitePackage) => item.directory
            )
        ).toEqual([ "Landing", "Documentation" ]);
        expect(
            website.files.some((file: GeneratedWebsiteFile) =>
                file.path.startsWith("Storybook/")
            )
        ).toBe(false);
        expect(
            website.files.find(
                (file: GeneratedWebsiteFile) =>
                    file.path === "Landing/RouteManifest.json"
            )?.content
        ).not.toContain("storybook");
        expect(
            website.files.find(
                (file: GeneratedWebsiteFile) =>
                    file.path === "Landing/vercel.json"
            )?.content
        ).toContain("/docs/:path*");
        expect(
            website.files.some(
                (file: GeneratedWebsiteFile) =>
                    file.path === "VercelProjects.snapshot.json"
            )
        ).toBe(true);
    });
    it("generates the optional Storybook package with a matching base path", () =>
    {
        const website = createGeneratedWebsite({
            config: {
                routing: {
                    documentationPrefix: "/reference",
                    storybookPrefix: "/workbench"
                },
                storybook: { enabled: true }
            },
            generatedAt: "2026-09-24T00:00:00.000Z",
            revision: "abc123",
            target: "generated"
        });
        expect(
            website.packages.map(
                (item: GeneratedWebsitePackage) => item.directory
            )
        ).toEqual([ "Landing", "Documentation", "Storybook" ]);
        const storybookConfig = website.files.find(
            (file: GeneratedWebsiteFile) =>
                file.path === "Storybook/.storybook/main.ts"
        )?.content;
        expect(storybookConfig).toContain("base: \"/workbench/\"");
        expect(website.config.vercel.projects.storybook?.routePrefix).toBe(
            "/workbench"
        );
        expect(
            website.files.some(
                (file: GeneratedWebsiteFile) =>
                    file.path === "Storybook/vercel.snapshot.json"
            )
        ).toBe(true);
    });
    it("generates the optional MCP function package without adding a Landing route", () =>
    {
        const website = createGeneratedWebsite({
            config: {
                agent: { mcp: { enabled: true } },
                metadata: { url: "https://example.test" }
            },
            target: "generated"
        });
        expect(
            website.packages.map(
                (item: GeneratedWebsitePackage) => item.directory
            )
        ).toEqual([ "Landing", "Documentation", "Mcp" ]);
        expect(
            website.files.some(
                (file: GeneratedWebsiteFile) =>
                    file.path.startsWith("Mcp/") &&
                    file.path.endsWith("api/index.mjs")
            )
        ).toBe(true);
        expect(
            website.files.find(
                (file: GeneratedWebsiteFile) =>
                    file.path === "Landing/vercel.json"
            )?.content
        ).not.toContain("mcp");
        expect(website.config.mcpEndpoint).toBe("https://mcp.example.test");
    });
});
