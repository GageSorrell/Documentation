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

import type { AgentDocument } from "@sorrell/docs-core";
import { formatAgentDocument } from "@sorrell/docs-core";
import { useCallback, useState } from "react";

export/** @internal */
const formatLlmDocument = formatAgentDocument;

const copyWithFallback = async (value: string): Promise<void> =>
{
    if (typeof navigator !== "undefined" && navigator.clipboard !== undefined)
    {
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

export/** @internal */
const CopyForLlmButton = ({
    document
}: {
    readonly document: AgentDocument;
}) =>
{
    const [ copied, setCopied ] = useState(false);

    const onCopy = useCallback(async () =>
    {
        await copyWithFallback(formatAgentDocument(document));
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
    }, [ document ]);

    return (
        <button
            aria-live="polite"
            className="docs-copy-button"
            onClick={ onCopy }
            type="button">
            <span aria-hidden="true">
                { copied ? "✓" : "⧉" }
            </span>
            { copied ? "Copied" : "Copy for LLM" }
        </button>
    );
};
