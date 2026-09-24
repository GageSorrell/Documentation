/**
 *
 *
 * @module @sorrell/docs-api-reference/Test/TypeDoc.test
 *
 * @file      TypeDoc.test.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { generateApiDataset } from "../Source/TypeDoc.js";

describe("TypeDoc generation", () => {
    it("discovers exported declarations programmatically", async () => {
        const entryPoint = fileURLToPath(new URL("./Fixtures/ApiFixture.ts", import.meta.url));
        const tsconfig = fileURLToPath(new URL("./Fixtures/tsconfig.json", import.meta.url));
        const dataset = await generateApiDataset({
            packages: [ { id: "fixture", name: "@sorrell/fixture", version: "1.0.0", entryPoints: [ entryPoint ], tsconfig } ],
            generatedAt: "2026-09-24T00:00:00.000Z"
        });
        expect(dataset.records).toHaveLength(1);
        expect(dataset.records[0]?.declarations.some((declaration) => declaration.name === "hello")).toBe(true);
    });
});
