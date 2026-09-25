/**
 *
 *
 * @module @sorrell/docs-ui/Mdx
 *
 * @file      Mdx.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { type ReactNode, useState } from "react";
export/** @internal */
const DocCode = ({
    children,
    language = "text"
}: {
    readonly children: ReactNode;
    readonly language?: string;
}) => (
    <div className="docs-code-block">
        <div className="docs-code-language">{language}</div>
        <pre>
            <code>{children}</code>
        </pre>
    </div>
);
export/** @internal */
const Callout = ({
    children,
    tone = "note",
    title
}: {
    readonly children: ReactNode;
    readonly tone?: "note" | "warning" | "tip";
    readonly title?: string;
}) => (
    <aside className={ `docs-callout docs-callout-${tone}` }>
        {title === undefined ? null : <strong>{title}</strong>}
        <div>{children}</div>
    </aside>
);
export/** @internal */
const Tabs = ({
    tabs
}: {
    readonly tabs: ReadonlyArray<{
        readonly label: string;
        readonly content: ReactNode;
    }>;
}) =>
{
    const [ active, setActive ] = useState(0);
    return (
        <div className="docs-tabs">
            <div aria-label="Examples"
                className="docs-tab-list"
                role="tablist">
                {tabs.map(
                    (
                        tab: {
                            readonly label: string;
                            readonly content: ReactNode;
                        },
                        index: number
                    ) => (
                        <button
                            aria-selected={ index === active }
                            className={
                                index === active ? "is-active" : undefined
                            }
                            key={ tab.label }
                            onClick={ () => setActive(index) }
                            role="tab"
                            type="button"
                        >
                            {tab.label}
                        </button>
                    )
                )}
            </div>
            <div className="docs-tab-panel"
                role="tabpanel">
                {tabs[active]?.content}
            </div>
        </div>
    );
};
export/** @internal */
const Heading = ({
    level = 2,
    id,
    children
}: {
    readonly level?: 2 | 3 | 4;
    readonly id?: string;
    readonly children: ReactNode;
}) =>
{
    const Tag = `h${level}` as "h2" | "h3" | "h4";
    return (
        <Tag className="docs-heading"
            id={ id }>
            {children}
            {id === undefined ? null : (
                <a
                    aria-label={ `Link to ${String(children)}` }
                    className="docs-heading-link"
                    href={ `#${id}` }
                >
                    #
                </a>
            )}
        </Tag>
    );
};
