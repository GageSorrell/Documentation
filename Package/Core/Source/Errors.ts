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

/** @module @sorrell/docs-core/Errors */

import { Data } from "effect";

export type ConfigPathSegment = string | number;

export interface DocsConfigDiagnostic {
    readonly path: ReadonlyArray<ConfigPathSegment>;
    readonly message: string;
    readonly expected?: string;
    readonly actual?: unknown;
}

export class DocsConfigError extends Data.TaggedError("DocsConfigError")<{
    readonly diagnostics: ReadonlyArray<DocsConfigDiagnostic>;
}> {
    override get message(): string {
        return this.diagnostics.map(formatDiagnostic).join("\n");
    }
}

export const formatConfigPath = (path: ReadonlyArray<ConfigPathSegment>): string => {
    if (path.length === 0) {return "$";}
    return path.reduce<string>(
        (result, segment) => typeof segment === "number" ? `${result}[${segment}]` : `${result}.${String(segment)}`,
        "$"
    );
};

export const formatDiagnostic = (diagnostic: DocsConfigDiagnostic): string => {
    const expected = diagnostic.expected === undefined ? "" : ` (expected ${diagnostic.expected})`;
    return `${formatConfigPath(diagnostic.path)}: ${diagnostic.message}${expected}`;
};
