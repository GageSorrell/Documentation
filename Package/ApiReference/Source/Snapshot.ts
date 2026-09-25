/**
 * Effect-managed API-reference snapshot persistence.
 *
 * @module @sorrell/docs-api-reference/Snapshot
 *
 * @file      Snapshot.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Context, Effect, Layer } from "effect";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import type { ApiReferenceDataset } from "./Types.js";
import { ApiReferenceSnapshotError } from "./Errors.js";
import { assertValidApiDataset } from "./Serialization.js";
import { dirname } from "node:path";

/** @internal */
export class ApiReferenceSnapshotStore extends Context.Service<
    ApiReferenceSnapshotStore,
    {
        readonly write: (
            path: string,
            dataset: ApiReferenceDataset
        ) => Effect.Effect<void, ApiReferenceSnapshotError>;
        readonly read: (
            path: string
        ) => Effect.Effect<ApiReferenceDataset, ApiReferenceSnapshotError>;
        readonly publish: (
            source: string,
            target: string
        ) => Effect.Effect<void, ApiReferenceSnapshotError>;
        readonly restore: (
            source: string,
            target: string
        ) => Effect.Effect<void, ApiReferenceSnapshotError>;
    }
>()("sorrell/docs-api-reference/ApiReferenceSnapshotStore")
{
    static readonly layer: Layer.Layer<
        ApiReferenceSnapshotStore,
        never,
        never
    > = Layer.succeed(
        ApiReferenceSnapshotStore,
        ApiReferenceSnapshotStore.of({
            publish: (source: string, target: string) =>
                Effect.tryPromise({
                    catch: (cause: unknown) =>
                        new ApiReferenceSnapshotError(
                            `${source} -> ${target}`,
                            cause
                        ),
                    try: async () =>
                    {
                        await mkdir(dirname(target), { recursive: true });
                        await copyFile(source, target);
                    }
                }),
            read: (path: string) =>
                Effect.tryPromise({
                    catch: (cause: unknown) =>
                        cause instanceof ApiReferenceSnapshotError
                            ? cause
                            : new ApiReferenceSnapshotError(path, cause),
                    try: async () =>
                    {
                        const dataset = JSON.parse(
                            await readFile(path, "utf8")
                        ) as ApiReferenceDataset;
                        return assertValidApiDataset(dataset);
                    }
                }),
            restore: (source: string, target: string) =>
                Effect.tryPromise({
                    catch: (cause: unknown) =>
                        new ApiReferenceSnapshotError(
                            `${source} -> ${target}`,
                            cause
                        ),
                    try: async () =>
                    {
                        await mkdir(dirname(target), { recursive: true });
                        await copyFile(source, target);
                    }
                }),
            write: (path: string, dataset: ApiReferenceDataset) =>
                Effect.tryPromise({
                    catch: (cause: unknown) =>
                        new ApiReferenceSnapshotError(path, cause),
                    try: async () =>
                    {
                        assertValidApiDataset(dataset);
                        await mkdir(dirname(path), { recursive: true });
                        await writeFile(
                            path,
                            `${JSON.stringify(dataset, null, 2)}\n`,
                            "utf8"
                        );
                    }
                })
        })
    );
}
export/** @internal */
const writeApiSnapshot = (
    path: string,
    dataset: ApiReferenceDataset
) =>
    Effect.gen(function* ()
    {
        const store = yield* ApiReferenceSnapshotStore;
        return yield* store.write(path, dataset);
    });
export/** @internal */
const readApiSnapshot = (path: string) =>
    Effect.gen(function* ()
    {
        const store = yield* ApiReferenceSnapshotStore;
        return yield* store.read(path);
    });
