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

/** @module @sorrell/docs-react-native-storybook/Types */

import type { ComponentType, ReactNode } from "react";

export type NativeThemeMode = "light" | "dark" | "system";

export interface NativeThemeColors {
    readonly background: string;
    readonly surface: string;
    readonly foreground: string;
    readonly muted: string;
    readonly border: string;
    readonly accent: string;
    readonly codeBackground: string;
}

export interface NativeTheme {
    readonly mode: NativeThemeMode;
    readonly resolvedMode: "light" | "dark";
    readonly colors: NativeThemeColors;
}

export interface SelectionStorage {
    readonly getItem: (key: string) => string | null | Promise<string | null>;
    readonly setItem: (key: string, value: string) => void | Promise<void>;
    readonly removeItem?: (key: string) => void | Promise<void>;
}

export interface StorySelection {
    readonly storyId?: string;
    readonly themeMode?: NativeThemeMode;
}

export interface NativeProviderComponentProps {
    readonly children: ReactNode;
    readonly style?: object;
}

export type NativeProviderComponent = ComponentType<NativeProviderComponentProps>;

export interface NativeProviderComposition {
    readonly GestureHandlerRootView?: NativeProviderComponent;
    readonly SafeAreaProvider?: NativeProviderComponent;
    readonly KeyboardProvider?: NativeProviderComponent;
}

export interface NativeStorybookProviderProps {
    readonly children: ReactNode;
    readonly initialMode?: NativeThemeMode;
    readonly initialSelection?: StorySelection;
    readonly storage?: SelectionStorage;
    readonly storageKey?: string;
    readonly providers?: NativeProviderComposition;
}

export interface NativeStorybookContextValue {
    readonly selection: StorySelection;
    readonly setSelection: (selection: StorySelection) => void;
    readonly theme: NativeTheme;
    readonly setThemeMode: (mode: NativeThemeMode) => void;
}

export interface ControlsDefaults {
    readonly expanded?: boolean;
    readonly sort?: "alpha" | "requiredFirst" | "none";
    readonly hideNoControlsWarning?: boolean;
    readonly exclude?: ReadonlyArray<string>;
}

export interface MetroConfig {
    readonly resolver?: Record<string, unknown>;
    readonly transformer?: Record<string, unknown>;
    readonly [key: string]: unknown;
}

export interface MetroStorybookOptions {
    readonly enabled?: boolean;
    readonly configPath?: string;
    readonly storybookEntrypoint?: string;
    readonly withStorybook?: (config: MetroConfig, options: MetroStorybookOptions) => MetroConfig;
}

export type NativeStoryRenderer = (props?: Readonly<Record<string, unknown>>) => ReactNode;

export interface StoryHeaderProps {
    readonly title: string;
    readonly subtitle?: string;
}

export interface ArticleProps {
    readonly children: ReactNode;
    readonly title?: string;
    readonly scroll?: boolean;
}

export interface ArticleSectionProps {
    readonly children: ReactNode;
    readonly title?: string;
}

export interface ArticleCodeProps {
    readonly children: ReactNode;
    readonly language?: string;
}

export interface ArticleCalloutProps {
    readonly children: ReactNode;
    readonly title?: string;
    readonly tone?: "note" | "warning" | "tip";
}

export interface ArticleExampleProps {
    readonly children: ReactNode;
    readonly title?: string;
}
