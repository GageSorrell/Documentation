/**
 *
 *
 * @module @sorrell/docs-react-native-storybook/Persistence
 *
 * @file      Persistence.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** @module @sorrell/docs-react-native-storybook/Persistence */

import type { SelectionStorage, StorySelection } from "./Types.js";

export const createMemorySelectionStorage = (initial: Readonly<Record<string, string>> = {}): SelectionStorage => {
    const values = new Map(Object.entries(initial));
    return {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => { values.set(key, value); },
        removeItem: (key) => { values.delete(key); }
    };
};

export const createAsyncStorageSelectionStorage = (storage: {
    readonly getItem: (key: string) => Promise<string | null>;
    readonly setItem: (key: string, value: string) => Promise<void>;
    readonly removeItem?: (key: string) => Promise<void>;
}): SelectionStorage => ({
    getItem: storage.getItem,
    setItem: storage.setItem,
    ...(storage.removeItem === undefined ? {} : { removeItem: storage.removeItem })
});

export const encodeSelection = (selection: StorySelection): string => JSON.stringify(selection);

export const decodeSelection = (value: string | null): StorySelection => {
    if (value === null) { return {}; }
    try {
        const decoded: unknown = JSON.parse(value);
        if (typeof decoded !== "object" || decoded === null || Array.isArray(decoded)) { return {}; }
        const candidate = decoded as { storyId?: unknown; themeMode?: unknown };
        return {
            ...(typeof candidate.storyId === "string" ? { storyId: candidate.storyId } : {}),
            ...(candidate.themeMode === "light" || candidate.themeMode === "dark" || candidate.themeMode === "system" ? { themeMode: candidate.themeMode } : {})
        };
    } catch {
        return {};
    }
};

export const readSelection = async (storage: SelectionStorage, key: string): Promise<StorySelection> => decodeSelection(await storage.getItem(key));

export const writeSelection = async (storage: SelectionStorage, key: string, selection: StorySelection): Promise<void> => {
    await storage.setItem(key, encodeSelection(selection));
};
