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
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const packageRoot = existsSync(resolve("Package/Core/Source/index.ts"))
    ? resolve("Package")
    : resolve("../../Package");
const sourceRoot = packageRoot.endsWith("/Package") || packageRoot.endsWith("\\Package")
    ? resolve(packageRoot, "..")
    : resolve("../..");

const dataset = await generateApiDataset({
    generatedAt: process.env.SORRELL_API_GENERATED_AT ?? "2026-09-24T00:00:00.000Z",
    packages: [
        {
            entryPoints: [ resolve(packageRoot, "Core/Source/index.ts") ],
            id: "core",
            name: "@sorrell/docs-core",
            tsconfig: resolve(packageRoot, "Core/tsconfig.json"),
            version: "1.0.1"
        },
        {
            entryPoints: [ resolve(packageRoot, "Ui/Source/index.ts") ],
            id: "ui",
            name: "@sorrell/docs-ui",
            tsconfig: resolve(packageRoot, "Ui/tsconfig.json"),
            version: "1.0.1"
        }
    ],
    referencePrefix: "/docs/api",
    repositoryUrl: "https://github.com/GageSorrell/Documentation",
    revision: process.env.SORRELL_API_REVISION ?? "Master",
    sourceRoot
});

await Effect.runPromise(
    writeApiSnapshot(resolve("Source/data/ApiReference.json"), dataset).pipe(
        Effect.provide(ApiReferenceSnapshotStore.layer)
    )
);
process.stdout.write(`Generated ${dataset.records.length} API reference records (${dataset.checksum}).\n`);
