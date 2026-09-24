/**
 *
 *
 * @module @sorrell/docs-ui/Theme
 *
 * @file      Theme.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** @module @sorrell/docs-ui/Theme */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { DesignTokens } from "@sorrell/docs-core";
import type { ThemeMode } from "./Types.js";

interface ThemeContextValue {
    readonly mode: ThemeMode;
    readonly resolvedMode: "light" | "dark";
    readonly setMode: (mode: ThemeMode) => void;
    readonly toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const resolveMode = (mode: ThemeMode): "light" | "dark" => {
    if (mode !== "system") {return mode;}
    if (typeof window === "undefined") {return "light";}
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const createThemeCss = (tokens: DesignTokens): string => `:root {\n  --docs-background: ${tokens.light.background};\n  --docs-foreground: ${tokens.light.foreground};\n  --docs-muted: ${tokens.light.muted};\n  --docs-border: ${tokens.light.border};\n  --docs-accent: ${tokens.light.accent};\n  --docs-code-background: ${tokens.light.codeBackground};\n}\n\n[data-theme="dark"] {\n  --docs-background: ${tokens.dark.background};\n  --docs-foreground: ${tokens.dark.foreground};\n  --docs-muted: ${tokens.dark.muted};\n  --docs-border: ${tokens.dark.border};\n  --docs-accent: ${tokens.dark.accent};\n  --docs-code-background: ${tokens.dark.codeBackground};\n}`;

export const ThemeProvider = ({ children, initialMode = "system" }: { readonly children: ReactNode; readonly initialMode?: ThemeMode }) => {
    const [ mode, setMode ] = useState<ThemeMode>(() => {
        if (typeof window === "undefined") {return initialMode;}
        return (window.localStorage.getItem("sorrell-docs-theme") as ThemeMode | null) ?? initialMode;
    });
    const resolvedMode = resolveMode(mode);
    useEffect(() => {
        document.documentElement.dataset.theme = resolvedMode;
        document.documentElement.style.colorScheme = resolvedMode;
        window.localStorage.setItem("sorrell-docs-theme", mode);
    }, [ mode, resolvedMode ]);
    const value = useMemo<ThemeContextValue>(() => ({
        mode,
        resolvedMode,
        setMode,
        toggleMode: () => setMode(resolvedMode === "dark" ? "light" : "dark")
    }), [ mode, resolvedMode ]);
    return <ThemeContext.Provider value={ value }>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => useContext(ThemeContext) ?? {
    mode: "system",
    resolvedMode: "light",
    setMode: () => undefined,
    toggleMode: () => undefined
};

export const ThemeToggle = () => {
    const theme = useTheme();
    return <button aria-label={ `Use ${theme.resolvedMode === "dark" ? "light" : "dark"} theme` }
        className="docs-icon-button"
        onClick={ theme.toggleMode }
        type="button">
        {theme.resolvedMode === "dark" ? "☼" : "☾"}
    </button>;
};
