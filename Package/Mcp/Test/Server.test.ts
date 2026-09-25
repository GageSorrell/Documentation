/**
 *
 *
 * @module @sorrell/docs-mcp/Test/Server.test
 *
 * @file      Server.test.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { buildSearchIndex, searchDocuments } from "../Source/index.js";
import { describe, expect, it } from "vitest";
import type { AgentCorpus } from "@sorrell/docs-core";
const corpus: AgentCorpus = {
    checksum: "corpus-checksum",
    documents: [
        {
            content: "Install the package and start here.",
            id: "article:current:guide",
            kind: "article",
            title: "Getting Started",
            url: "https://example.test/docs/guide",
            version: "current"
        },
        {
            content: "Core API exports and models.",
            id: "api:current:core",
            kind: "api-module",
            title: "Core API",
            url: "https://example.test/docs/api/core",
            version: "current"
        }
    ],
    generatedAt: "2026-09-24T00:00:00.000Z",
    version: 1
};
describe("documentation MCP index", () =>
{
    it("builds a deterministic lexical index and searches bounded results", () =>
    {
        const index = buildSearchIndex(corpus, corpus.checksum);
        expect(index.version).toBe(1);
        expect(index.entries).toHaveLength(2);
        expect(
            searchDocuments(corpus, "core API", "current", 1).map(
                (document: {
                    readonly id: string;
                    readonly kind: "article" | "api-module" | "component";
                    readonly url: string;
                    readonly content: string;
                    readonly title: string;
                    readonly version?: string;
                    readonly source?: {
                        readonly repositoryUrl: string;
                        readonly revision: string;
                        readonly file: string;
                        readonly line?: number;
                        readonly endLine?: number;
                    };
                    readonly description?: string;
                    readonly metadata?: {
                        readonly [x: string]: unknown;
                    };
                    readonly context?: string;
                }) => document.id
            )
        ).toEqual([ "api:current:core" ]);
        expect(searchDocuments(corpus, "missing")).toEqual([]);
    });
});
