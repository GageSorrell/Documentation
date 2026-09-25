/**
 *
 *
 * @module @sorrell/docs-ui/Sections
 *
 * @file      Sections.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { InstallCommandProps, LlmDocument } from "./Types.js";
import { type ReactNode, useCallback, useState } from "react";
import { CopyForLlmButton } from "./CopyForLlm.js";

export/** @internal */
const InstallCommand = ({ command }: InstallCommandProps) =>
{
    const [ copied, setCopied ] = useState(false);

    const copy = useCallback(async () =>
    {
        if (navigator.clipboard !== undefined)
        {
            await navigator.clipboard.writeText(command);
        }

        setCopied(true);

        window.setTimeout(() => setCopied(false), 1400);
    }, [ command ]);

    return (
        <button
            aria-label="Copy install command"
            className="docs-install-command"
            onClick={ copy }
            type="button">
            <code>{ command }</code>
            <span>{ copied ? "Copied" : "Copy" }</span>
        </button>
    );
};

export/** @internal */
const ArticlePage = ({
    title,
    description,
    breadcrumbs,
    document,
    children
}: {
    readonly title: string;
    readonly description?: string;
    readonly breadcrumbs?: ReactNode;
    readonly document: LlmDocument;
    readonly children: ReactNode;
}) => (
    <article className="docs-article">
        { breadcrumbs }
        <div className="docs-article-topline">
            <div>
                <h1>{ title }</h1>
                {
                    description === undefined
                        ? null
                        : (
                            <p className="docs-article-description">
                                { description }
                            </p>
                        )
                }
            </div>
            <CopyForLlmButton document={ document } />
        </div>
        <div className="docs-prose">
            { children }
        </div>
    </article>
);

export/** @internal */
const QuoteRail = ({
    author,
    quote
}: {
    readonly quote: string;
    readonly author: string;
}) => (
    <figure className="docs-quote-rail">
        <blockquote>“{ quote }”</blockquote>
        <figcaption>— { author }</figcaption>
    </figure>
);

export/** @internal */
const Faq = ({
    items
}: {
    readonly items: ReadonlyArray<{
        readonly question: string;
        readonly answer: ReactNode;
    }>;
}) => (
    <section className="docs-faq">
        {
            items.map(
                (item: {
                    readonly question: string;
                    readonly answer: ReactNode;
                }) => (
                    <details key={ item.question }>
                        <summary>
                            {item.question}
                            <span aria-hidden="true">+</span>
                        </summary>
                        <div>{item.answer}</div>
                    </details>
                )
            )
        }
    </section>
);

export/** @internal */
const Cta = ({
    title,
    children,
    href,
    label
}: {
    readonly title: string;
    readonly children?: ReactNode;
    readonly href: string;
    readonly label: string;
}) => (
    <section className="docs-cta">
        <div>
            <h2>{ title }</h2>
            { children }
        </div>
        <a href={ href }>
            { label } <span aria-hidden="true">↗</span>
        </a>
    </section>
);

export/** @internal */
const DocsFooter = ({
    children = "Built for readable, durable documentation."
}: {
    readonly children?: ReactNode;
}) => (
    <footer className="docs-footer">
        <span>{ children }</span>
        <span>© { new Date().getFullYear() } Sorrell</span>
    </footer>
);
