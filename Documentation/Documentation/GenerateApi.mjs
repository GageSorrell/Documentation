/**
 * Generate the dogfood site's TypeDoc API-reference snapshot.
 *
 * @file      GenerateApi.mjs
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { ApiReferenceSnapshotStore, generateApiDataset, writeApiSnapshot } from "@sorrell/docs-api-reference";
import { Effect } from "effect";
import { resolve } from "node:path";

const dataset = await generateApiDataset({
    generatedAt: process.env.SORRELL_API_GENERATED_AT ?? "2026-09-24T00:00:00.000Z",
    packages: [
        {
            entryPoints: [ resolve("../../Package/Core/Source/index.ts") ],
            id: "core",
            name: "@sorrell/docs-core",
            tsconfig: resolve("../../Package/Core/tsconfig.json"),
            version: "0.1.0"
        },
        {
            entryPoints: [ resolve("../../Package/Ui/Source/index.ts") ],
            id: "ui",
            name: "@sorrell/docs-ui",
            tsconfig: resolve("../../Package/Ui/tsconfig.json"),
            version: "0.1.0"
        }
    ],
    referencePrefix: "/docs/api",
    repositoryUrl: "https://github.com/GageSorrell/Documentation",
    revision: process.env.SORRELL_API_REVISION ?? "Master",
    sourceRoot: resolve("../..")
});

await Effect.runPromise(
    writeApiSnapshot(resolve("Source/data/ApiReference.json"), dataset).pipe(
        Effect.provide(ApiReferenceSnapshotStore.layer)
    )
);
process.stdout.write(`Generated ${dataset.records.length} API reference records (${dataset.checksum}).\n`);
