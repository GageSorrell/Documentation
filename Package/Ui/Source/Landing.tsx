/**
 *
 *
 * @module @sorrell/docs-ui/Landing
 *
 * @file      Landing.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { InstallCommand } from "./Sections.js";
import type { LandingPageProps } from "./Types.js";
import type { ReactNode } from "react";

export/** @internal */
const LandingPage = ({
    content,
    installCommand,
    children
}: LandingPageProps) => (
    <div className="docs-landing">
        <section className="docs-landing-hero">
            <div className="docs-eyebrow">
                Documentation toolkit
            </div>
            <h1>{ content.title }</h1>
            <p>{ content.description }</p>
            {installCommand === undefined ? null : (
                <InstallCommand command={ installCommand } />
            )}
        </section>
        <section
            aria-label="Documentation sections"
            className="docs-landing-grid">
            {content.sections.map(
                (section: {
                    readonly id: string;
                    readonly title: string;
                    readonly body: string;
                    readonly href?: string;
                }) => (
                    <a
                        className="docs-landing-card"
                        href={ section.href ?? `#${ section.id }` }
                        key={ section.id }>
                        <span className="docs-card-index">{ section.id }</span>
                        <h2>{ section.title }</h2>
                        <p>{ section.body }</p>
                        <span aria-hidden="true"
                            className="docs-card-arrow">
                            ↗
                        </span>
                    </a>
                )
            )}
        </section>
        {children}
    </div>
);
export/** @internal */
const LandingSection = ({
    children,
    title,
    eyebrow
}: {
    readonly children: ReactNode;
    readonly title: string;
    readonly eyebrow?: string;
}) => (
    <section className="docs-landing-section">
        {eyebrow === undefined ? null : (
            <div className="docs-eyebrow">{eyebrow}</div>
        )}
        <h2>{title}</h2>
        {children}
    </section>
);
