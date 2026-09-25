/**
 * Tests for the shared agent-document model and Markdown normalization.
 *
 * @module @sorrell/docs-core/Test/Agent
 *
 * @file      Agent.test.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { describe, expect, it } from "vitest";
import {
    formatAgentDocument,
    normalizeAgentMarkdown
} from "../Source/Agent.js";
describe("agent documents", () =>
{
    it("formats one deterministic document for Copy for LLM and Markdown twins", () =>
    {
        const document = {
            content: "# Body\n\nReadable content.",
            description: "A guide.",
            id: "article:current:index",
            kind: "article" as const,
            title: "Getting started",
            url: "https://example.test/docs/"
        };
        expect(formatAgentDocument(document)).toBe(
            formatAgentDocument({ ...document })
        );
        expect(formatAgentDocument(document)).toContain("Kind: article");
    });
    it("converts Markdown-compatible MDX primitives and reports unresolved components", () =>
    {
        const result = normalizeAgentMarkdown(
            "<strong>Bold</strong>\n\n<Callout>Needs authoring</Callout>"
        );
        expect(result.markdown).toContain("**Bold**");
        expect(result.markdown).not.toContain("<Callout>");
        expect(result.diagnostics[0]?.code).toBe("unresolved-mdx-component");
    });
});
