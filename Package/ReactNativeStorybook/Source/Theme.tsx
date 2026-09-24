/**
 *
 *
 * @module @sorrell/docs-react-native-storybook/Theme
 *
 * @file      Theme.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** @module @sorrell/docs-react-native-storybook/Theme */

import { Appearance, useColorScheme } from "react-native";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { readSelection, writeSelection } from "./Persistence.js";
import type { NativeTheme, NativeThemeColors, NativeThemeMode, SelectionStorage } from "./Types.js";

const lightColors: NativeThemeColors = {
    background: "#ffffff",
    surface: "#f5f5f5",
    foreground: "#111111",
    muted: "#666666",
    border: "#dddddd",
    accent: "#6d4aff",
    codeBackground: "#f0f0f0"
};

const darkColors: NativeThemeColors = {
    background: "#09090b",
    surface: "#18181b",
    foreground: "#fafafa",
    muted: "#a1a1aa",
    border: "#3f3f46",
    accent: "#a78bfa",
    codeBackground: "#18181b"
};

export const resolveNativeThemeMode = (mode: NativeThemeMode, systemMode: "light" | "dark" | null | undefined): "light" | "dark" => mode === "system" ? systemMode ?? "light" : mode;

export const createNativeTheme = (mode: NativeThemeMode, systemMode: "light" | "dark" | null | undefined): NativeTheme => {
    const resolvedMode = resolveNativeThemeMode(mode, systemMode);
    return { mode, resolvedMode, colors: resolvedMode === "dark" ? darkColors : lightColors };
};

interface ThemeContextValue {
    readonly theme: NativeTheme;
    readonly setThemeMode: (mode: NativeThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface NativeThemeProviderProps {
    readonly children: ReactNode;
    readonly initialMode?: NativeThemeMode;
    readonly storage?: SelectionStorage;
    readonly storageKey?: string;
}

export const NativeThemeProvider = ({ children, initialMode = "system", storage, storageKey = "sorrell-storybook-selection" }: NativeThemeProviderProps) => {
    const systemMode = useColorScheme();
    const [ mode, setMode ] = useState<NativeThemeMode>(initialMode);
    useEffect(() => {
        let active = true;
        if (storage !== undefined) {
            void readSelection(storage, storageKey).then((selection) => {
                if (active && selection.themeMode !== undefined) { setMode(selection.themeMode); }
            });
        }
        return () => { active = false; };
    }, [ storage, storageKey ]);
    useEffect(() => {
        if (storage !== undefined) { void writeSelection(storage, storageKey, { themeMode: mode }); }
    }, [ mode, storage, storageKey ]);
    useEffect(() => {
        const subscription = Appearance.addChangeListener(() => undefined);
        return () => subscription.remove();
    }, []);
    const theme = useMemo(() => createNativeTheme(mode, systemMode), [ mode, systemMode ]);
    return <ThemeContext.Provider value={ { theme, setThemeMode: setMode } }>{children}</ThemeContext.Provider>;
};

export const useNativeTheme = (): ThemeContextValue => useContext(ThemeContext) ?? {
    theme: createNativeTheme("system", "light"),
    setThemeMode: () => undefined
};
