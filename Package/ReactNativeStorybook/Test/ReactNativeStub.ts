/**
 *
 *
 * @module @sorrell/docs-react-native-storybook/Test/ReactNativeStub
 *
 * @file      ReactNativeStub.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    type ComponentType,
    Fragment,
    type ReactNode,
    createElement,
    useEffect,
    useState
} from "react";
export/** @internal */
const View: ComponentType<{
    readonly children?: ReactNode;
    readonly style?: unknown;
}> = ({
    children
}: {
    readonly children?: ReactNode;
    readonly style?: unknown;
}) => createElement("div", null, children);
export/** @internal */
const Text: ComponentType<{
    readonly children?: ReactNode;
    readonly style?: unknown;
}> = ({
    children
}: {
    readonly children?: ReactNode;
    readonly style?: unknown;
}) => createElement("span", null, children);
export/** @internal */
const ScrollView: ComponentType<{
    readonly children?: ReactNode;
    readonly style?: unknown;
    readonly contentContainerStyle?: unknown;
}> = ({
    children
}: {
    readonly children?: ReactNode;
    readonly style?: unknown;
    readonly contentContainerStyle?: unknown;
}) => createElement("div", null, children);
export/** @internal */
const KeyboardAvoidingView: ComponentType<{
    readonly children?: ReactNode;
    readonly style?: unknown;
    readonly behavior?: string;
}> = ({
    children
}: {
    readonly children?: ReactNode;
    readonly style?: unknown;
    readonly behavior?: string;
}) => createElement("div", null, children);
export/** @internal */
const StyleSheet = {
    create: <StyleMap extends Record<string, unknown>>(
        styles: StyleMap
    ): StyleMap => styles
};
export/** @internal */
const Platform = { OS: "web" } as const;
export/** @internal */
const Appearance = {
    addChangeListener: () => ({ remove: () => undefined })
};
export/** @internal */
const useColorScheme = (): "light" => "light";

/** @internal */
export type ViewStyle = Record<string, unknown>;
export { Fragment, useEffect, useState };
