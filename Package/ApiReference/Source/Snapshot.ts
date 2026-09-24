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
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { dirname } from "node:path";
import { ApiReferenceSnapshotError } from "./Errors.js";
import { assertValidApiDataset } from "./Serialization.js";
import type { ApiReferenceDataset } from "./Types.js";

export class ApiReferenceSnapshotStore extends Context.Service<ApiReferenceSnapshotStore, {
    readonly write: (path: string, dataset: ApiReferenceDataset) => Effect.Effect<void, ApiReferenceSnapshotError>;
    readonly read: (path: string) => Effect.Effect<ApiReferenceDataset, ApiReferenceSnapshotError>;
    readonly publish: (source: string, target: string) => Effect.Effect<void, ApiReferenceSnapshotError>;
    readonly restore: (source: string, target: string) => Effect.Effect<void, ApiReferenceSnapshotError>;
}>()("sorrell/docs-api-reference/ApiReferenceSnapshotStore") {
    static readonly layer = Layer.succeed(ApiReferenceSnapshotStore, ApiReferenceSnapshotStore.of({
        write: (path, dataset) => Effect.tryPromise({
            try: async () => {
                assertValidApiDataset(dataset);
                await mkdir(dirname(path), { recursive: true });
                await writeFile(path, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");
            },
            catch: (cause) => new ApiReferenceSnapshotError(path, cause)
        }),
        read: (path) => Effect.tryPromise({
            try: async () => {
                const dataset = JSON.parse(await readFile(path, "utf8")) as ApiReferenceDataset;
                return assertValidApiDataset(dataset);
            },
            catch: (cause) => cause instanceof ApiReferenceSnapshotError ? cause : new ApiReferenceSnapshotError(path, cause)
        }),
        publish: (source, target) => Effect.tryPromise({
            try: async () => {
                await mkdir(dirname(target), { recursive: true });
                await copyFile(source, target);
            },
            catch: (cause) => new ApiReferenceSnapshotError(`${source} -> ${target}`, cause)
        }),
        restore: (source, target) => Effect.tryPromise({
            try: async () => {
                await mkdir(dirname(target), { recursive: true });
                await copyFile(source, target);
            },
            catch: (cause) => new ApiReferenceSnapshotError(`${source} -> ${target}`, cause)
        })
    }));
}

export const writeApiSnapshot = (path: string, dataset: ApiReferenceDataset) => Effect.gen(function*() {
    const store = yield* ApiReferenceSnapshotStore;
    return yield* store.write(path, dataset);
});

export const readApiSnapshot = (path: string) => Effect.gen(function*() {
    const store = yield* ApiReferenceSnapshotStore;
    return yield* store.read(path);
});
