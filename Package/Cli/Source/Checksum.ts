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

import { Context, Effect, Layer } from "effect";
import { DocsFileSystem } from "./services.js";
import type { DocsFileSystemError } from "./errors.js";
import { createHash } from "node:crypto";

export/** @internal */
const checksumText = (value: string): string =>
    createHash("sha256").update(value, "utf8").digest("hex");
/** @internal */
export class ChecksumService extends Context.Service<
    ChecksumService,
    {
        readonly text: (value: string) => Effect.Effect<string>;
        readonly file: (
            path: string
        ) => Effect.Effect<string, DocsFileSystemError>;
    }
>()("sorrell/docs-cli/ChecksumService")
{
    static readonly layer: Layer.Layer<ChecksumService, never, never> =
        Layer.effect(
            ChecksumService,
            Effect.gen(function* ()
            {
                const fileSystem = yield* DocsFileSystem;
                return ChecksumService.of({
                    file: (path: string) =>
                        fileSystem
                            .readText(path)
                            .pipe(Effect.map(checksumText)),
                    text: (value: string) =>
                        Effect.sync(() => checksumText(value))
                });
            })
        ).pipe(Layer.provide(DocsFileSystem.layer));
}
