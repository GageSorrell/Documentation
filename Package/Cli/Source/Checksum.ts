/**
 *
 *
 * @module @sorrell/docs-cli/Checksum
 *
 * @file      Checksum.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** @module @sorrell/docs-cli/Checksum */

import { createHash } from "node:crypto";
import { Context, Effect, Layer } from "effect";
import { DocsFileSystem } from "./services.js";
import type { DocsFileSystemError } from "./errors.js";

export const checksumText = (value: string): string => createHash("sha256").update(value, "utf8").digest("hex");

export class ChecksumService extends Context.Service<ChecksumService, {
    readonly text: (value: string) => Effect.Effect<string>;
    readonly file: (path: string) => Effect.Effect<string, DocsFileSystemError>;
}>()("sorrell/docs-cli/ChecksumService") {
    static readonly layer = Layer.effect(
        ChecksumService,
        Effect.gen(function*() {
            const fileSystem = yield* DocsFileSystem;
            return ChecksumService.of({
                text: (value) => Effect.sync(() => checksumText(value)),
                file: (path) => fileSystem.readText(path).pipe(Effect.map(checksumText))
            });
        })
    ).pipe(Layer.provide(DocsFileSystem.layer));
}
