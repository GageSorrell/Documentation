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

import { createElement, Fragment, useEffect, useState, type ComponentType, type ReactNode } from "react";

export const View: ComponentType<{ readonly children?: ReactNode; readonly style?: unknown }> = ({ children }) => createElement("div", null, children);
export const Text: ComponentType<{ readonly children?: ReactNode; readonly style?: unknown }> = ({ children }) => createElement("span", null, children);
export const ScrollView: ComponentType<{ readonly children?: ReactNode; readonly style?: unknown; readonly contentContainerStyle?: unknown }> = ({ children }) => createElement("div", null, children);
export const KeyboardAvoidingView: ComponentType<{ readonly children?: ReactNode; readonly style?: unknown; readonly behavior?: string }> = ({ children }) => createElement("div", null, children);
export const StyleSheet = { create: <StyleMap extends Record<string, unknown>>(styles: StyleMap): StyleMap => styles };
export const Platform = { OS: "web" } as const;
export const Appearance = { addChangeListener: () => ({ remove: () => undefined }) };
export const useColorScheme = (): "light" => "light";
export type ViewStyle = Record<string, unknown>;
export { Fragment, useEffect, useState };
