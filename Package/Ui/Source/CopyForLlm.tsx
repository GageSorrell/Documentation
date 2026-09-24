/**
 *
 *
 * @module @sorrell/docs-ui/CopyForLlm
 *
 * @file      CopyForLlm.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** @module @sorrell/docs-ui/CopyForLlm */

import { useState } from "react";
import type { LlmDocument } from "./Types.js";

export const formatLlmDocument = (document: LlmDocument): string => [
    `# ${document.title}`,
    document.context === undefined ? undefined : `Context: ${document.context}`,
    document.url === undefined ? undefined : `URL: ${document.url}`,
    "",
    document.content.trim()
].filter((line): line is string => line !== undefined).join("\n");

const copyWithFallback = async (value: string): Promise<void> => {
    if (typeof navigator !== "undefined" && navigator.clipboard !== undefined) {
        await navigator.clipboard.writeText(value);
        return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
};

export const CopyForLlmButton = ({ document }: { readonly document: LlmDocument }) => {
    const [ copied, setCopied ] = useState(false);
    const onCopy = async () => {
        await copyWithFallback(formatLlmDocument(document));
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
    };
    return <button aria-live="polite"
        className="docs-copy-button"
        onClick={ onCopy }
        type="button">
        <span aria-hidden="true">{copied ? "✓" : "⧉"}</span>
        {copied ? "Copied" : "Copy for LLM"}
    </button>;
};
