/**
 *
 *
 * @module @sorrell/docs-create-website/Test/Routing.test
 *
 * @file      Routing.test.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { describe, expect, it } from "vitest";
import { createLandingRewrites } from "../Source/Routing.js";

describe("generated website routing", () => {
    it("preserves child base paths and nested assets", () => {
        const result = createLandingRewrites(
            { documentationPrefix: "/docs", storybookPrefix: "/storybook" },
            {
                documentation: { deploymentId: "docs-1", url: "https://docs.vercel.app/" },
                landing: { deploymentId: "landing-1", url: "https://landing.vercel.app" },
                storybook: { deploymentId: "storybook-1", url: "https://storybook.vercel.app/" }
            }
        );
        expect(result.rewrites).toEqual([
            { source: "/docs", destination: "https://docs.vercel.app/docs" },
            { source: "/docs/:path*", destination: "https://docs.vercel.app/docs/:path*" },
            { source: "/storybook", destination: "https://storybook.vercel.app/storybook" },
            { source: "/storybook/:path*", destination: "https://storybook.vercel.app/storybook/:path*" }
        ]);
    });

    it("omits Storybook rewrites when no Storybook deployment exists", () => {
        const result = createLandingRewrites(
            { documentationPrefix: "/reference", storybookPrefix: "/workbench" },
            { documentation: { deploymentId: "docs-1", url: "https://docs.vercel.app" }, landing: { deploymentId: "landing-1", url: "https://landing.vercel.app" } }
        );
        expect(result.rewrites).toHaveLength(2);
        expect(result.rewrites.some((rewrite) => rewrite.source.startsWith("/workbench"))).toBe(false);
    });
});
