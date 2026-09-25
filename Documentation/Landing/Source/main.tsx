/**
 *
 *
 * @module generated-documentation-landing/main
 *
 * @file      main.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { createRoot } from "react-dom/client";
import {
    Cta,
    createThemeCss,
    DocsFooter,
    DocsHeader,
    Faq,
    LandingPage,
    LandingSection,
    QuoteRail,
    ThemeProvider,
    docsUiCss
} from "@sorrell/docs-ui";
import { content, tokens } from "./Content.js";
import "./Tokens.css";

const links = [ {href:"/docs/", label:"Docs"}, {href:"/storybook/", label:"Storybook"} ];
const faqItems = [
    {
        answer: "Read the documentation, then explore the component stories.",
        question: "Where do I start?"
    },
    {
        answer: "Every article and reference page exposes a Copy for LLM action.",
        question: "Can I copy pages for an LLM?"
    }
];

const Landing = () => (
    <ThemeProvider initialMode="system">
        <style>{docsUiCss}</style>
        <style>{createThemeCss(tokens)}</style>
        <div className="docs-site">
            <DocsHeader
                links={ links }
                repositoryHref={ "https://github.com/GageSorrell/Documentation/tree/Master#ReadMe" }
                title={ "Sorrell Documentation" } />
            <main>
                <LandingPage
                    content={ content }
                    installCommand="npm install sorrell-documentation"
                >
                    {content.sections.map((section) => (
                        <LandingSection key={ section.id }
                            title={ section.title }>
                            <p>{ section.body }</p>
                        </LandingSection>
                    ))}
                    <LandingSection eyebrow="From the community"
                        title="Built to be read">
                        <QuoteRail
                            author="Sorrell Documentation"
                            quote="A single source of truth for people and the tools that help them build."
                        />
                    </LandingSection>
                    <LandingSection title="Frequently asked questions">
                        <Faq items={ faqItems } />
                    </LandingSection>
                    <Cta href={ content.primaryAction?.href ?? "/docs/" }
                        label={ content.primaryAction?.label ?? "Read the docs" }
                        title="Build something worth documenting." />
                    <DocsFooter>
                        {
                            "Build readable documentation sites with a shared content, theme, " +
                            "and publishing system."
                        }
                    </DocsFooter>
                </LandingPage>
            </main>
        </div>
    </ThemeProvider>
);

createRoot(document.getElementById("root")!).render(<Landing />);
