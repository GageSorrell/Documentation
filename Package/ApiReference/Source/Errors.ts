/**
 * Typed errors for API-reference generation and snapshot operations.
 *
 * @module @sorrell/docs-api-reference/Errors
 *
 * @file      Errors.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/** @internal */
export class ApiReferenceError extends Error
{
    readonly _tag: string = "ApiReferenceError";
    constructor(message: string, options?: ErrorOptions)
    {
        super(message, options);
        this.name = "ApiReferenceError";
    }
}
/** @internal */
export class ApiReferenceValidationError extends ApiReferenceError
{
    override readonly _tag: "ApiReferenceValidationError" =
        "ApiReferenceValidationError" as const;
    constructor(public readonly errors: ReadonlyArray<string>)
    {
        super(`Invalid API-reference dataset: ${errors.join("; ")}`);
        this.name = "ApiReferenceValidationError";
    }
}
/** @internal */
export class ApiReferenceSnapshotError extends ApiReferenceError
{
    override readonly _tag: "ApiReferenceSnapshotError" =
        "ApiReferenceSnapshotError" as const;
    constructor(
        public readonly path: string,
        cause: unknown
    )
    {
        super(`API-reference snapshot operation failed for ${path}`, { cause });
        this.name = "ApiReferenceSnapshotError";
    }
}
