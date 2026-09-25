/**
 *
 *
 * @module @sorrell/docs-react-native-storybook/Types
 *
 * @file      Types.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { ComponentType, ReactNode } from "react";

/** @internal */
export type NativeThemeMode = "light" | "dark" | "system";

/** @internal */
export interface NativeThemeColors {
    readonly background: string;
    readonly surface: string;
    readonly foreground: string;
    readonly muted: string;
    readonly border: string;
    readonly accent: string;
    readonly codeBackground: string;
}
/** @internal */
export interface NativeTheme {
    readonly mode: NativeThemeMode;
    readonly resolvedMode: "light" | "dark";
    readonly colors: NativeThemeColors;
}
/** @internal */
export interface SelectionStorage {
    readonly getItem: (key: string) => string | null | Promise<string | null>;
    readonly setItem: (key: string, value: string) => void | Promise<void>;
    readonly removeItem?: (key: string) => void | Promise<void>;
}
/** @internal */
export interface StorySelection {
    readonly storyId?: string;
    readonly themeMode?: NativeThemeMode;
}
/** @internal */
export interface NativeProviderComponentProps {
    readonly children: ReactNode;
    readonly style?: object;
}
/** @internal */
export type NativeProviderComponent =
    ComponentType<NativeProviderComponentProps>;
/** @internal */
export interface NativeProviderComposition {
    readonly GestureHandlerRootView?: NativeProviderComponent;
    readonly SafeAreaProvider?: NativeProviderComponent;
    readonly KeyboardProvider?: NativeProviderComponent;
}
/** @internal */
export interface NativeStorybookProviderProps {
    readonly children: ReactNode;
    readonly initialMode?: NativeThemeMode;
    readonly initialSelection?: StorySelection;
    readonly storage?: SelectionStorage;
    readonly storageKey?: string;
    readonly providers?: NativeProviderComposition;
}
/** @internal */
export interface NativeStorybookContextValue {
    readonly selection: StorySelection;
    readonly setSelection: (selection: StorySelection) => void;
    readonly theme: NativeTheme;
    readonly setThemeMode: (mode: NativeThemeMode) => void;
}
/** @internal */
export interface ControlsDefaults {
    readonly expanded?: boolean;
    readonly sort?: "alpha" | "requiredFirst" | "none";
    readonly hideNoControlsWarning?: boolean;
    readonly exclude?: ReadonlyArray<string>;
}
/** @internal */
export interface MetroConfig {
    readonly resolver?: Record<string, unknown>;
    readonly transformer?: Record<string, unknown>;
    readonly [key: string]: unknown;
}
/** @internal */
export interface MetroStorybookOptions {
    readonly enabled?: boolean;
    readonly configPath?: string;
    readonly storybookEntrypoint?: string;
    readonly withStorybook?: (
        config: MetroConfig,
        options: MetroStorybookOptions
    ) => MetroConfig;
}
/** @internal */
export type NativeStoryRenderer = (
    props?: Readonly<Record<string, unknown>>
) => ReactNode;
/** @internal */
export interface StoryHeaderProps {
    readonly title: string;
    readonly subtitle?: string;
}
/** @internal */
export interface ArticleProps {
    readonly children: ReactNode;
    readonly title?: string;
    readonly scroll?: boolean;
}
/** @internal */
export interface ArticleSectionProps {
    readonly children: ReactNode;
    readonly title?: string;
}
/** @internal */
export interface ArticleCodeProps {
    readonly children: ReactNode;
    readonly language?: string;
}
/** @internal */
export interface ArticleCalloutProps {
    readonly children: ReactNode;
    readonly title?: string;
    readonly tone?: "note" | "warning" | "tip";
}
/** @internal */
export interface ArticleExampleProps {
    readonly children: ReactNode;
    readonly title?: string;
}
