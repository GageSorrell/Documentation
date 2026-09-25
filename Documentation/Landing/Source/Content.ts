/**
 *
 *
 * @module generated-documentation-landing/Content
 *
 * @file      Content.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { DesignTokens, LandingContent } from "@sorrell/docs-core";

export const content = {
    description: "Build readable documentation sites with a shared content, theme, and publishing system.",
    primaryAction: {
        href: "/docs/",
        label: "Read the docs"
    },
    sections: [
        {
            body: "Articles, API references, and durable guides for Sorrell products.",
            href: "/docs/",
            id: "docs",
            title: "Documentation"
        },
        {
            body: "Explore the reusable landing-page components in Storybook.",
            href: "/storybook/",
            id: "components",
            title: "Components"
        },
        {
            body: "Inspect the source, packages, and release workflow on GitHub.",
            href: "https://github.com/GageSorrell/Documentation",
            id: "source",
            title: "Open source"
        }
    ],
    title: "Sorrell Documentation"
} as const satisfies LandingContent;
export const tokens = {
    dark: {
        accent: "#93c5fd",
        background: "#09090b",
        border: "#27272a",
        codeBackground: "#18181b",
        foreground: "#f4f4f5",
        muted: "#a1a1aa"
    },
    light: {
        accent: "#2563eb",
        background: "#ffffff",
        border: "#e5e7eb",
        codeBackground: "#f3f4f6",
        foreground: "#111111",
        muted: "#6b7280"
    }
} as const satisfies DesignTokens;
