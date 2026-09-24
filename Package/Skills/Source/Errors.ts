/**
 * Errors raised by the managed skill installer.
 *
 * @module @sorrell/docs-skills/Errors
 *
 * @file      Errors.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Data } from "effect";

export class SkillError extends Data.TaggedError("SkillError")<{
    readonly operation: string;
    readonly path: string;
    readonly cause?: unknown;
}> {}

export class SkillNotFoundError extends Data.TaggedError("SkillNotFoundError")<{
    readonly name: string;
}> {}

export class SkillCollisionError extends Data.TaggedError("SkillCollisionError")<{
    readonly name: string;
    readonly directory: string;
}> {}

export class SkillNotManagedError extends Data.TaggedError("SkillNotManagedError")<{
    readonly name: string;
    readonly directory: string;
}> {}

export class SkillValidationError extends Data.TaggedError("SkillValidationError")<{
    readonly directory: string;
    readonly diagnostics: ReadonlyArray<string>;
}> {}
