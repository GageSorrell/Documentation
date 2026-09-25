/**
 *
 *
 * @module @sorrell/docs-react-native-storybook/Articles
 *
 * @file      Articles.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type {
    ArticleCalloutProps,
    ArticleCodeProps,
    ArticleExampleProps,
    ArticleProps,
    ArticleSectionProps
} from "./Types.js";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";
import { useNativeTheme } from "./Theme.js";
const styles = StyleSheet.create({
    article: { flex: 1 },
    callout: {
        borderLeftWidth: 3,
        borderRadius: 6,
        marginTop: 16,
        padding: 14
    },
    calloutTitle: { fontSize: 15, fontWeight: "700", marginBottom: 5 },
    code: {
        borderRadius: 8,
        fontFamily: "monospace",
        fontSize: 14,
        lineHeight: 21,
        padding: 14
    },
    codeLanguage: {
        fontSize: 11,
        fontWeight: "700",
        marginBottom: 6,
        textTransform: "uppercase"
    },
    content: { padding: 20, paddingBottom: 48 },
    example: { borderRadius: 10, marginTop: 16, padding: 16 },
    exampleTitle: { fontSize: 14, fontWeight: "700", marginBottom: 10 },
    prose: { fontSize: 16, lineHeight: 25 },
    section: { marginTop: 24 },
    sectionTitle: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
    title: { fontSize: 30, fontWeight: "800", marginBottom: 20 }
});
export/** @internal */
const Article = ({
    children,
    title,
    scroll = true
}: ArticleProps) =>
{
    const { theme } = useNativeTheme();
    const content = (
        <View
            style={ [
                styles.content,
                { backgroundColor: theme.colors.background }
            ] }
        >
            {title === undefined ? null : (
                <Text
                    style={ [ styles.title, { color: theme.colors.foreground } ] }
                >
                    {title}
                </Text>
            )}
            {children}
        </View>
    );
    return scroll ? (
        <ScrollView
            contentContainerStyle={ styles.content }
            style={ styles.article }
        >
            {content}
        </ScrollView>
    ) : (
        <View style={ styles.article }>{content}</View>
    );
};
export/** @internal */
const ArticleSection = ({
    children,
    title
}: ArticleSectionProps) =>
{
    const { theme } = useNativeTheme();
    return (
        <View style={ styles.section }>
            {title === undefined ? null : (
                <Text
                    style={ [
                        styles.sectionTitle,
                        { color: theme.colors.foreground }
                    ] }
                >
                    {title}
                </Text>
            )}
            <View>{children}</View>
        </View>
    );
};
export/** @internal */
const ArticleCode = ({
    children,
    language = "text"
}: ArticleCodeProps) =>
{
    const { theme } = useNativeTheme();
    return (
        <View
            style={ [
                styles.code,
                { backgroundColor: theme.colors.codeBackground }
            ] }
        >
            <Text style={ [ styles.codeLanguage, { color: theme.colors.muted } ] }>
                {language}
            </Text>
            <Text style={ { color: theme.colors.foreground } }>{children}</Text>
        </View>
    );
};
export/** @internal */
const ArticleCallout = ({
    children,
    title,
    tone = "note"
}: ArticleCalloutProps) =>
{
    const { theme } = useNativeTheme();
    const accent =
        tone === "warning"
            ? "#d97706"
            : tone === "tip"
                ? "#059669"
                : theme.colors.accent;
    return (
        <View
            style={ [
                styles.callout,
                {
                    backgroundColor: theme.colors.surface,
                    borderLeftColor: accent
                }
            ] }
        >
            {title === undefined ? null : (
                <Text
                    style={ [
                        styles.calloutTitle,
                        { color: theme.colors.foreground }
                    ] }
                >
                    {title}
                </Text>
            )}
            <Text style={ { color: theme.colors.foreground } }>{children}</Text>
        </View>
    );
};
export/** @internal */
const ArticleExample = ({
    children,
    title
}: ArticleExampleProps) =>
{
    const { theme } = useNativeTheme();
    return (
        <View
            style={ [
                styles.example,
                {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderWidth: 1
                }
            ] }
        >
            {title === undefined ? null : (
                <Text
                    style={ [
                        styles.exampleTitle,
                        { color: theme.colors.foreground }
                    ] }
                >
                    {title}
                </Text>
            )}
            {children}
        </View>
    );
};
export/** @internal */
const ArticleText = ({
    children
}: {
    readonly children: ReactNode;
}) =>
{
    const { theme } = useNativeTheme();
    return (
        <Text style={ [ styles.prose, { color: theme.colors.foreground } ] }>
            {children}
        </Text>
    );
};
