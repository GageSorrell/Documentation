/**
 *
 *
 * @module @sorrell/docs-api-reference/Test/Serialization.test
 *
 * @file      Serialization.test.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { describe, expect, it } from "vitest";
import { createApiDataset, recordToLlmDocument, validateApiDataset } from "../Source/Serialization.js";
import type { ApiReferenceRecord } from "@sorrell/docs-core";

const record: ApiReferenceRecord = {
    packageId: "fixture",
    packageName: "@sorrell/fixture",
    module: "fixture",
    displayName: "fixture",
    version: "1.0.0",
    summary: "A fixture API.",
    breadcrumbs: [ { label: "API Reference", current: false }, { label: "fixture", current: true } ],
    categories: [ { id: "functions", label: "Functions", order: 0, collapsed: false } ],
    declarations: [ { id: "hello", name: "hello", kind: "function", categoryId: "functions", description: "Says hello.", signature: "declare function hello(): string" } ],
    exportCount: 1
};

describe("API-reference serialization", () => {
    it("creates a deterministic, validated dataset", () => {
        const dataset = createApiDataset([ record ], { generatedAt: "2026-09-24T00:00:00.000Z", sourceRevision: "Master" });
        expect(validateApiDataset(dataset).valid).toBe(true);
        expect(dataset.checksum).toHaveLength(64);
        expect(createApiDataset([ record ], { generatedAt: dataset.generatedAt, sourceRevision: dataset.sourceRevision }).checksum).toBe(dataset.checksum);
    });

    it("creates an LLM document from a reference record", () => {
        const document = recordToLlmDocument(record);
        expect(document.title).toBe("fixture");
        expect(document.content).toContain("declare function hello(): string");
    });
});
