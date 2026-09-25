/**
 * A typed component fixture used to verify Storybook Autodocs extraction.
 *
 * @module @sorrell/docs-storybook-web/ShowcaseCard
 *
 * @file      ShowcaseCard.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { HTMLAttributes, ReactNode } from "react";

export interface ShowcaseCardProps extends HTMLAttributes<HTMLDivElement> {
    /** The primary label displayed by the fixture. */
    readonly title: string;
    /** The visual treatment used by the fixture. */
    readonly tone?: "neutral" | "accent";
    /** Optional supporting content. */
    readonly children?: ReactNode;
    /** Optional numeric metadata shown beside the title. */
    readonly count?: number;
    /** Optional callback invoked by the action button. */
    readonly onAction?: (value: string) => void;
}

export const ShowcaseCard = ({ children, count = 0, onAction, title, tone = "neutral", ...props }: ShowcaseCardProps) =>
    <article
        {...props}
        style={{
            background: tone === "accent" ? "#fff7ed" : "#ffffff",
            border: "1px solid #dededb",
            borderRadius: 16,
            color: "#171717",
            display: "grid",
            gap: 16,
            maxWidth: 520,
            padding: 24,
            ...props.style
        }}>
        <div style={{ alignItems: "baseline", display: "flex", gap: 12, justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 24, margin: 0 }}>{title}</h2>
            <span>{count}</span>
        </div>
        <div>{children}</div>
        <button onClick={() => onAction?.(title)} type="button">Use component</button>
    </article>;
