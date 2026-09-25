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
/** @internal */
export type NativeAppKind = "development" | "demonstration";

/** @internal */
export type NativeAuthoringKind = "story" | "example" | "article";

/** @internal */
export type NativePlatform = "android" | "ios" | "web" | "all";

/** @internal */
export interface NativeAppGenerationOptions {
    readonly target: string;
    readonly kind?: NativeAppKind;
    readonly name?: string;
    readonly packageName?: string;
}
/** @internal */
export interface NativeGeneratedFile {
    readonly path: string;
    readonly content: string;
}
/** @internal */
export interface NativeGeneratedApp {
    readonly target: string;
    readonly kind: NativeAppKind;
    readonly name: string;
    readonly packageName: string;
    readonly files: ReadonlyArray<NativeGeneratedFile>;
}
/** @internal */
export interface NativeAuthoringOptions {
    readonly target: string;
    readonly kind: NativeAuthoringKind;
    readonly name: string;
}
