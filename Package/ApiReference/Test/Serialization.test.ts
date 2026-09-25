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

import {
    createApiDataset,
    recordToAgentDocument,
    recordToLlmDocument,
    validateApiDataset
} from "../Source/Serialization.js";
import { describe, expect, it } from "vitest";
import type { ApiReferenceRecord } from "@sorrell/docs-core";
const record: ApiReferenceRecord = {
    breadcrumbs: [
        { current: false, label: "API Reference" },
        { current: true, label: "fixture" }
    ],
    categories: [
        { collapsed: false, id: "functions", label: "Functions", order: 0 }
    ],
    declarations: [
        {
            categoryId: "functions",
            description: "Says hello.",
            id: "hello",
            kind: "function",
            name: "hello",
            signature: "declare function hello(): string"
        }
    ],
    displayName: "fixture",
    exportCount: 1,
    module: "fixture",
    packageId: "fixture",
    packageName: "@sorrell/fixture",
    summary: "A fixture API.",
    version: "1.0.1"
};
describe("API-reference serialization", () =>
{
    it("creates a deterministic, validated dataset", () =>
    {
        const dataset = createApiDataset([ record ], {
            generatedAt: "2026-09-24T00:00:00.000Z",
            sourceRevision: "Master"
        });
        expect(validateApiDataset(dataset).valid).toBe(true);
        expect(dataset.checksum).toHaveLength(64);
        expect(
            createApiDataset([ record ], {
                generatedAt: dataset.generatedAt,
                sourceRevision: dataset.sourceRevision
            }).checksum
        ).toBe(dataset.checksum);
    });
    it("creates an LLM document from a reference record", () =>
    {
        const document = recordToLlmDocument(record);
        expect(document.title).toBe("fixture");
        expect(document.content).toContain("declare function hello(): string");
    });
    it("includes declaration kind and introduction metadata in the agent document", () =>
    {
        const document = recordToAgentDocument({
            ...record,
            introductionVersion: "1.0.1"
        });
        expect(document.kind).toBe("api-module");
        expect(document.content).toContain("Kind: function");
        expect(document.content).toContain("Added in 1.0.0");
    });
});
