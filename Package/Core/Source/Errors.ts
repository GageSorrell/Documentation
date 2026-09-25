/**
 *
 *
 * @module @sorrell/docs-core/Errors
 *
 * @file      Errors.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Data } from "effect";

/** @internal */
export type ConfigPathSegment = string | number;

/** @internal */
export interface DocsConfigDiagnostic
{
    readonly path: ReadonlyArray<ConfigPathSegment>;
    readonly message: string;
    readonly expected?: string;
    readonly actual?: unknown;
}

/** @internal */
export class DocsConfigError extends Data.TaggedError("DocsConfigError")<{
    readonly diagnostics: ReadonlyArray<DocsConfigDiagnostic>;
}>
{
    override get message(): string
    {
        return this.diagnostics.map(formatDiagnostic).join("\n");
    }
}

export/** @internal */
const formatConfigPath = (
    path: ReadonlyArray<ConfigPathSegment>
): string =>
{
    if (path.length === 0)
    {
        return "$";
    }
    return path.reduce<string>(
        (result: string, segment: ConfigPathSegment) =>
            typeof segment === "number"
                ? `${result}[${segment}]`
                : `${result}.${String(segment)}`,
        "$"
    );
};

export/** @internal */
const formatDiagnostic = (
    diagnostic: DocsConfigDiagnostic
): string =>
{
    const expected =
        diagnostic.expected === undefined
            ? ""
            : ` (expected ${diagnostic.expected})`;
    return `${formatConfigPath(diagnostic.path)}: ${diagnostic.message}${expected}`;
};
