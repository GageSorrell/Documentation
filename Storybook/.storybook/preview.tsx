/**
 * Preview decorators, controls, and theme synchronization for Storybook.
 *
 * @module @sorrell/docs-storybook-web/.storybook/preview
 *
 * @file      preview.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react-vite";
import { ThemeProvider, createThemeCss, docsUiCss } from "@sorrell/docs-ui";
import { storybookConfig } from "../Source/Configuration.js";

const preview: Preview = {
    decorators: [
        withThemeByClassName({
            defaultTheme: "dark",
            themes: {
                dark: "dark",
                light: "light"
            }
        }),
        (Story, context) => {
            const mode = context.globals.theme === "light" ? "light" : "dark";
            return <ThemeProvider initialMode={mode}>
                <style>{`${docsUiCss}\n${createThemeCss(storybookConfig.tokens)}\n.storybook-preview { min-height: 100vh; padding: 32px; }`}</style>
                <div className="storybook-preview"><Story /></div>
            </ThemeProvider>;
        }
    ],
    globalTypes: {
        theme: {
            defaultValue: "dark",
            description: "Global color theme",
            toolbar: {
                icon: "circlehollow",
                items: [ "light", "dark" ]
            }
        }
    },
    parameters: {
        backgrounds: { disable: true },
        controls: { expanded: true },
        docs: { toc: true }
    }
};

export default preview;
