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

export class DocsWorkspaceError extends Data.TaggedError("DocsWorkspaceError")<{
    readonly operation: string;
    readonly path: string;
    readonly cause: unknown;
}> {}

export class DocsTargetError extends Data.TaggedError("DocsTargetError")<{
    readonly target: string;
    readonly reason: string;
}> {}

export class DocsTemplateError extends Data.TaggedError("DocsTemplateError")<{
    readonly path: string;
    readonly cause: unknown;
}> {}

export class DocsManifestError extends Data.TaggedError("DocsManifestError")<{
    readonly path: string;
    readonly cause: unknown;
}> {}

export class DocsIntegrationError extends Data.TaggedError("DocsIntegrationError")<{
    readonly provider: "git" | "github" | "vercel";
    readonly operation: string;
    readonly cause: unknown;
}> {}

export class DocsArchiveError extends Data.TaggedError("DocsArchiveError")<{
    readonly operation: string;
    readonly path: string;
    readonly cause: unknown;
}> {}

export class DocsStageError extends Data.TaggedError("DocsStageError")<{
    readonly stage: string;
    readonly cause: unknown;
}> {}
