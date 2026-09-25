import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
    addons: [ "@storybook/addon-docs", "@storybook/addon-themes" ],
    framework: { name: "@storybook/react-vite", options: {} },
    stories: [ "../Stories/**/*.mdx", "../Stories/**/*.stories.@(js|jsx|mjs|ts|tsx)" ],
    typescript: { reactDocgen: "react-docgen-typescript" },
    async viteFinal(value) {
        return {
            ...value,
            base: process.env.NODE_ENV === "production" ? "/storybook/" : "/",
            server: { ...value.server, allowedHosts: true }
        };
    }
};

export default config;
