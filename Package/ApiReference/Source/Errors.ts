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

export class ApiReferenceError extends Error {
    readonly _tag: string = "ApiReferenceError";

    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "ApiReferenceError";
    }
}

export class ApiReferenceValidationError extends ApiReferenceError {
    override readonly _tag = "ApiReferenceValidationError";

    constructor(public readonly errors: ReadonlyArray<string>) {
        super(`Invalid API-reference dataset: ${errors.join("; ")}`);
        this.name = "ApiReferenceValidationError";
    }
}

export class ApiReferenceSnapshotError extends ApiReferenceError {
    override readonly _tag = "ApiReferenceSnapshotError";

    constructor(public readonly path: string, cause: unknown) {
        super(`API-reference snapshot operation failed for ${path}`, { cause });
        this.name = "ApiReferenceSnapshotError";
    }
}
