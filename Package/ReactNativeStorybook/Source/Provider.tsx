/**
 *
 *
 * @module @sorrell/docs-react-native-storybook/Provider
 *
 * @file      Provider.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** @module @sorrell/docs-react-native-storybook/Provider */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { NativeThemeProvider, useNativeTheme } from "./Theme.js";
import { readSelection, writeSelection } from "./Persistence.js";
import type { NativeStorybookContextValue, NativeStorybookProviderProps, SelectionStorage, StorySelection } from "./Types.js";

const SelectionContext = createContext<NativeStorybookContextValue | undefined>(undefined);

const SelectionState = ({ children, initialSelection = {}, storage, storageKey = "sorrell-storybook-selection" }: { readonly children: ReactNode; readonly initialSelection?: StorySelection; readonly storage?: SelectionStorage; readonly storageKey?: string }) => {
    const themeContext = useNativeTheme();
    const { setThemeMode } = themeContext;
    const [ selection, setSelectionState ] = useState<StorySelection>(initialSelection);
    useEffect(() => {
        let active = true;
        if (storage !== undefined) {
            void readSelection(storage, storageKey).then((next) => {
                if (active && Object.keys(next).length > 0) { setSelectionState(next); }
            });
        }
        return () => { active = false; };
    }, [ storage, storageKey ]);
    const setSelection = useCallback((next: StorySelection) => {
        setSelectionState(next);
        if (storage !== undefined) { void writeSelection(storage, storageKey, next); }
        if (next.themeMode !== undefined) { setThemeMode(next.themeMode); }
    }, [ setThemeMode, storage, storageKey ]);
    const value = useMemo(() => ({ selection, setSelection, theme: themeContext.theme, setThemeMode }), [ selection, setSelection, setThemeMode, themeContext.theme ]);
    return <SelectionContext.Provider value={ value }>{children}</SelectionContext.Provider>;
};

const ProviderBoundary = ({ children, component: Component }: { readonly children: ReactNode; readonly component: ComponentType<{ readonly children: ReactNode; readonly style?: object }> | undefined }) => Component === undefined ? <>{children}</> : <Component style={ { flex: 1 } }>{children}</Component>;

export const NativeStorybookProvider = ({ children, initialMode = "system", initialSelection, storage, storageKey, providers }: NativeStorybookProviderProps) => <ProviderBoundary component={ providers?.GestureHandlerRootView }>
    <ProviderBoundary component={ providers?.SafeAreaProvider }>
        <ProviderBoundary component={ providers?.KeyboardProvider }>
            <NativeThemeProvider initialMode={ initialMode }
                { ...(storage === undefined ? {} : { storage }) }
                { ...(storageKey === undefined ? {} : { storageKey }) }>
                <SelectionState { ...(initialSelection === undefined ? {} : { initialSelection }) }
                    { ...(storage === undefined ? {} : { storage }) }
                    { ...(storageKey === undefined ? {} : { storageKey }) }>{children}</SelectionState>
            </NativeThemeProvider>
        </ProviderBoundary>
    </ProviderBoundary>
</ProviderBoundary>;

export const useNativeStorybook = (): NativeStorybookContextValue => {
    const fallbackTheme = useNativeTheme();
    const context = useContext(SelectionContext);
    return context ?? {
        selection: {},
        setSelection: () => undefined,
        theme: fallbackTheme.theme,
        setThemeMode: fallbackTheme.setThemeMode
    };
};
