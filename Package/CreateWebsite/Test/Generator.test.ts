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

describe("three-package website generation", () => {
    it("generates Landing and Documentation without Storybook by default", () => {
        const website = createGeneratedWebsite({ target: "generated", generatedAt: "2026-09-24T00:00:00.000Z", revision: "abc123" });
        expect(website.packages.map((item) => item.directory)).toEqual([ "Landing", "Documentation" ]);
        expect(website.files.some((file) => file.path.startsWith("Storybook/"))).toBe(false);
        expect(website.files.find((file) => file.path === "Landing/RouteManifest.json")?.content).not.toContain("storybook");
        expect(website.files.find((file) => file.path === "Landing/vercel.json")?.content).toContain("/docs/:path*");
    });

    it("generates the optional Storybook package with a matching base path", () => {
        const website = createGeneratedWebsite({
            target: "generated",
            config: { routing: { documentationPrefix: "/reference", storybookPrefix: "/workbench" }, storybook: { enabled: true } },
            generatedAt: "2026-09-24T00:00:00.000Z",
            revision: "abc123"
        });
        expect(website.packages.map((item) => item.directory)).toEqual([ "Landing", "Documentation", "Storybook" ]);
        const storybookConfig = website.files.find((file) => file.path === "Storybook/.storybook/main.ts")?.content;
        expect(storybookConfig).toContain("base: \"/workbench/\"");
        expect(website.config.vercel.projects.storybook?.routePrefix).toBe("/workbench");
    });
});
