/**
 *
 *
 * @module @sorrell/docs-create-website/NativeTypes
 *
 * @file      NativeTypes.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** @module @sorrell/docs-create-website/NativeTypes */

export type NativeAppKind = "development" | "demonstration";
export type NativeAuthoringKind = "story" | "example" | "article";
export type NativePlatform = "android" | "ios" | "web" | "all";

export interface NativeAppGenerationOptions {
    readonly target: string;
    readonly kind?: NativeAppKind;
    readonly name?: string;
    readonly packageName?: string;
}

export interface NativeGeneratedFile {
    readonly path: string;
    readonly content: string;
}

export interface NativeGeneratedApp {
    readonly target: string;
    readonly kind: NativeAppKind;
    readonly name: string;
    readonly packageName: string;
    readonly files: ReadonlyArray<NativeGeneratedFile>;
}

export interface NativeAuthoringOptions {
    readonly target: string;
    readonly kind: NativeAuthoringKind;
    readonly name: string;
}
