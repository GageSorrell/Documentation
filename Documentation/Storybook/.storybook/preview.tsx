import type { Preview } from "@storybook/react";
import { withThemeByClassName } from "@storybook/addon-themes";
import { createThemeCss, docsUiCss } from "@sorrell/docs-ui";

const preview: Preview = {
    decorators: [
        (Story) => <><style>{docsUiCss}</style><style>{createThemeCss({dark:{accent:"#93c5fd", background:"#09090b", border:"#27272a", codeBackground:"#18181b", foreground:"#f4f4f5", muted:"#a1a1aa"}, light:{accent:"#2563eb", background:"#ffffff", border:"#e5e7eb", codeBackground:"#f3f4f6", foreground:"#111111", muted:"#6b7280"}})}</style><Story /></>,
        withThemeByClassName({
            defaultTheme: "light",
            themes: { light: "light", dark: "dark", system: "system" }
        })
    ],
    parameters: { layout: "fullscreen" },
    globalTypes: {
        theme: {
            defaultValue: "light",
            toolbar: {
                icon: "paintbrush",
                items: [ "light", "dark", "system" ]
            }
        }
    }
};

export default preview;
