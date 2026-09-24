/**
 *
 *
 * @module @sorrell/docs-react-native-storybook/Decorators
 *
 * @file      Decorators.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** @module @sorrell/docs-react-native-storybook/Decorators */

import { KeyboardAvoidingView, Platform, StyleSheet, Text, View, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { NativeStorybookProvider } from "./Provider.js";
import { useNativeTheme } from "./Theme.js";
import type { NativeStoryRenderer, StoryHeaderProps } from "./Types.js";

const styles = StyleSheet.create({
    decorator: { flex: 1 },
    header: { borderBottomWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
    title: { fontSize: 18, fontWeight: "700" },
    subtitle: { fontSize: 13, marginTop: 3 }
});

export const StoryHeader = ({ title, subtitle }: StoryHeaderProps) => {
    const { theme } = useNativeTheme();
    return <View style={ [ styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border } ] }>
        <Text style={ [ styles.title, { color: theme.colors.foreground } ] }>{title}</Text>
        {subtitle === undefined ? null : <Text style={ [ styles.subtitle, { color: theme.colors.muted } ] }>{subtitle}</Text>}
    </View>;
};

export const StoryHeaderDecorator = (Story: NativeStoryRenderer, title: string, subtitle?: string) => <NativeStorybookProvider><View style={ styles.decorator }><StoryHeader title={ title }
    { ...(subtitle === undefined ? {} : { subtitle }) } /><Story /></View></NativeStorybookProvider>;

export const ThemeDecorator = (Story: NativeStoryRenderer) => <NativeStorybookProvider><View style={ [ styles.decorator, { backgroundColor: useNativeTheme().theme.colors.background } as ViewStyle ] }><Story /></View></NativeStorybookProvider>;

export const KeyboardDecorator = (Story: NativeStoryRenderer) => <KeyboardAvoidingView behavior={ Platform.OS === "ios" ? "padding" : undefined }
    style={ styles.decorator }><Story /></KeyboardAvoidingView>;

export const createNativeDecorators = (title = "Storybook") => [
    (Story: NativeStoryRenderer): ReactNode => StoryHeaderDecorator(Story, title),
    (Story: NativeStoryRenderer): ReactNode => ThemeDecorator(Story),
    (Story: NativeStoryRenderer): ReactNode => KeyboardDecorator(Story)
];
