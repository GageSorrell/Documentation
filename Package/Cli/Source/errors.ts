/**
 *
 *
 * @module @sorrell/docs-cli/Errors
 *
 * @file      errors.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Data } from "effect";

export class DocsFileSystemError extends Data.TaggedError("DocsFileSystemError")<{
    readonly operation: string;
    readonly path: string;
    readonly cause: unknown;
}> {}

export class DocsAtomicWriteError extends Data.TaggedError("DocsAtomicWriteError")<{
    readonly path: string;
    readonly cause: unknown;
}> {}

export class DocsTerminalError extends Data.TaggedError("DocsTerminalError")<{
    readonly operation: string;
    readonly cause: unknown;
}> {}

export class DocsProcessError extends Data.TaggedError("DocsProcessError")<{
    readonly command: string;
    readonly args: ReadonlyArray<string>;
    readonly exitCode: number | undefined;
    readonly stdout: string;
    readonly stderr: string;
    readonly cause: unknown;
}> {}
