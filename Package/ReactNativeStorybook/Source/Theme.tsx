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

import { Appearance, useColorScheme } from "react-native";
import type {
    NativeTheme,
    NativeThemeColors,
    NativeThemeMode,
    SelectionStorage,
    StorySelection
} from "./Types.js";
import {
    type ReactNode,
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";
import { readSelection, writeSelection } from "./Persistence.js";
const lightColors: NativeThemeColors = {
    accent: "#6d4aff",
    background: "#ffffff",
    border: "#dddddd",
    codeBackground: "#f0f0f0",
    foreground: "#111111",
    muted: "#666666",
    surface: "#f5f5f5"
};
const darkColors: NativeThemeColors = {
    accent: "#a78bfa",
    background: "#09090b",
    border: "#3f3f46",
    codeBackground: "#18181b",
    foreground: "#fafafa",
    muted: "#a1a1aa",
    surface: "#18181b"
};
export/** @internal */
const resolveNativeThemeMode = (
    mode: NativeThemeMode,
    systemMode: "light" | "dark" | null | undefined
): "light" | "dark" => (mode === "system" ? (systemMode ?? "light") : mode);
export/** @internal */
const createNativeTheme = (
    mode: NativeThemeMode,
    systemMode: "light" | "dark" | null | undefined
): NativeTheme =>
{
    const resolvedMode = resolveNativeThemeMode(mode, systemMode);
    return {
        colors: resolvedMode === "dark" ? darkColors : lightColors,
        mode,
        resolvedMode
    };
};
interface ThemeContextValue {
    readonly theme: NativeTheme;
    readonly setThemeMode: (mode: NativeThemeMode) => void;
}
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
/** @internal */
export interface NativeThemeProviderProps {
    readonly children: ReactNode;
    readonly initialMode?: NativeThemeMode;
    readonly storage?: SelectionStorage;
    readonly storageKey?: string;
}
export/** @internal */
const NativeThemeProvider = ({
    children,
    initialMode = "system",
    storage,
    storageKey = "sorrell-storybook-selection"
}: NativeThemeProviderProps) =>
{
    const systemMode = useColorScheme();
    const [ mode, setMode ] = useState<NativeThemeMode>(initialMode);
    useEffect(() =>
    {
        let active = true;
        if (storage !== undefined)
        {
            void readSelection(storage, storageKey).then(
                (selection: StorySelection) =>
                {
                    if (active && selection.themeMode !== undefined)
                    {
                        setMode(selection.themeMode);
                    }
                }
            );
        }
        return () =>
        {
            active = false;
        };
    }, [ storage, storageKey ]);
    useEffect(() =>
    {
        if (storage !== undefined)
        {
            void writeSelection(storage, storageKey, { themeMode: mode });
        }
    }, [ mode, storage, storageKey ]);
    useEffect(() =>
    {
        const subscription = Appearance.addChangeListener(() => undefined);
        return () => subscription.remove();
    }, []);
    const theme = useMemo(
        () => createNativeTheme(mode, systemMode),
        [ mode, systemMode ]
    );
    return (
        <ThemeContext.Provider value={ { setThemeMode: setMode, theme } }>
            {children}
        </ThemeContext.Provider>
    );
};
export/** @internal */
const useNativeTheme = (): ThemeContextValue =>
    useContext(ThemeContext) ?? {
        setThemeMode: () => undefined,
        theme: createNativeTheme("system", "light")
    };
