/**
 * Storybook configuration for the independent Sorrell web component surface.
 *
 * @module @sorrell/docs-storybook-web/.storybook/main
 *
 * @file      main.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { StorybookConfig } from "@storybook/react-vite";

const reactDocgen = process.env.SORRELL_STORYBOOK_DOCGEN === "react-docgen"
    ? "react-docgen"
    : "react-docgen-typescript";

const config: StorybookConfig = {
    addons: [ "@storybook/addon-docs", "@storybook/addon-themes" ],
    framework: {
        name: "@storybook/react-vite",
        options: {}
    },
    stories: [ "../Stories/**/*.mdx", "../Stories/**/*.stories.@(js|jsx|mjs|ts|tsx)" ],
    typescript: { reactDocgen },
    async viteFinal(viteConfig) {
        return { ...viteConfig, base: "/storybook/" };
    }
};

export default config;
