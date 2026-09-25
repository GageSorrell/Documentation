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

import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    View,
    type ViewStyle
} from "react-native";
import type { NativeStoryRenderer, StoryHeaderProps } from "./Types.js";
import { NativeStorybookProvider } from "./Provider.js";
import type { ReactNode } from "react";
import { useNativeTheme } from "./Theme.js";
const styles = StyleSheet.create({
    decorator: { flex: 1 },
    header: {
        borderBottomWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 12
    },
    subtitle: { fontSize: 13, marginTop: 3 },
    title: { fontSize: 18, fontWeight: "700" }
});
export/** @internal */
const StoryHeader = ({
    title,
    subtitle
}: StoryHeaderProps) =>
{
    const { theme } = useNativeTheme();
    return (
        <View
            style={ [
                styles.header,
                {
                    backgroundColor: theme.colors.surface,
                    borderBottomColor: theme.colors.border
                }
            ] }
        >
            <Text style={ [ styles.title, { color: theme.colors.foreground } ] }>
                {title}
            </Text>
            {subtitle === undefined ? null : (
                <Text style={ [ styles.subtitle, { color: theme.colors.muted } ] }>
                    {subtitle}
                </Text>
            )}
        </View>
    );
};
export/** @internal */
const StoryHeaderDecorator = (
    Story: NativeStoryRenderer,
    title: string,
    subtitle?: string
) => (
    <NativeStorybookProvider>
        <View style={ styles.decorator }>
            <StoryHeader
                title={ title }
                { ...(subtitle === undefined ? {} : { subtitle }) }
            />
            <Story />
        </View>
    </NativeStorybookProvider>
);
export/** @internal */
const ThemeDecorator = (Story: NativeStoryRenderer) => (
    <NativeStorybookProvider>
        <View
            style={ [
                styles.decorator,
                {
                    backgroundColor: useNativeTheme().theme.colors.background
                } as ViewStyle
            ] }
        >
            <Story />
        </View>
    </NativeStorybookProvider>
);
export/** @internal */
const KeyboardDecorator = (
    Story: NativeStoryRenderer
) => (
    <KeyboardAvoidingView
        behavior={ Platform.OS === "ios" ? "padding" : undefined }
        style={ styles.decorator }
    >
        <Story />
    </KeyboardAvoidingView>
);
export/** @internal */
const createNativeDecorators = (
    title: string = "Storybook"
) => [
    (Story: NativeStoryRenderer): ReactNode =>
        StoryHeaderDecorator(Story, title),
    (Story: NativeStoryRenderer): ReactNode => ThemeDecorator(Story),
    (Story: NativeStoryRenderer): ReactNode => KeyboardDecorator(Story)
];
