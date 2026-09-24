/**
 *
 *
 * @module @sorrell/docs-ui/ApiReference
 *
 * @file      ApiReference.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** @module @sorrell/docs-ui/ApiReference */

import { CopyForLlmButton } from "./CopyForLlm.js";
import { Breadcrumbs, DocsSidebar, OnThisPage } from "./Navigation.js";
import { DocCode } from "./Mdx.js";
import type { ApiReferencePageProps, DocumentationNavGroup, DocumentationNavItem } from "./Types.js";

const declarationHref = (id: string): string => `#${id}`;

const apiNavigation = (record: ApiReferencePageProps["record"]): ReadonlyArray<DocumentationNavGroup> => record.categories.map((category) => ({
    label: category.label,
    items: record.declarations.filter((declaration) => declaration.categoryId === category.id).map((declaration) => ({
        label: declaration.name,
        href: declarationHref(declaration.id),
        active: false
    }))
}));

const tocItems = (record: ApiReferencePageProps["record"]): ReadonlyArray<DocumentationNavItem> => record.categories.map((category) => ({
    label: category.label,
    href: `#category-${category.id}`,
    children: record.declarations.filter((declaration) => declaration.categoryId === category.id).map((declaration) => ({ label: declaration.name, href: declarationHref(declaration.id) }))
}));

const declarationDocument = (record: ApiReferencePageProps["record"], name: string, description: string, signature: string) => ({
    title: name,
    context: `${record.packageName} ${record.version}`,
    content: `${description}\n\n${signature}`,
    url: `${record.link?.href ?? ""}#${name}`
});

export const ApiReferencePage = ({ record, navigation = [] }: ApiReferencePageProps) => {
    const groups = navigation.length === 0 ? apiNavigation(record) : navigation;
    const document = {
        title: record.displayName,
        context: `${record.packageName} ${record.version}`,
        content: [ record.summary, ...record.declarations.map((declaration) => `${declaration.name}\n${declaration.description}\n${declaration.signature}`) ].join("\n\n"),
        ...(record.link?.href === undefined ? {} : { url: record.link.href })
    };
    return <div className="docs-api-page">
        <DocsSidebar groups={ groups }
            label="API Reference" />
        <main className="docs-api-main">
            <Breadcrumbs items={ record.breadcrumbs } />
            <div className="docs-api-heading-row"><div><h1>{record.displayName}</h1><p>{record.summary}</p></div><CopyForLlmButton document={ document } /></div>
            <div className="docs-api-meta"><span>{record.exportCount} exports</span>{record.introductionVersion === undefined ? null : <span>Added in {record.introductionVersion}</span>}{record.source === undefined ? null : <a href={ `${record.source.repositoryUrl}/blob/${record.source.revision}/${record.source.file}${record.source.line === undefined ? "" : `#L${record.source.line}`}` }>◉ Source ↗</a>}</div>
            {record.categories.map((category) => <section className="docs-api-category"
                id={ `category-${category.id}` }
                key={ category.id }>
                <h2>{category.label}</h2>
                {record.declarations.filter((declaration) => declaration.categoryId === category.id).map((declaration) => <article className="docs-api-declaration"
                    id={ declaration.id }
                    key={ declaration.id }>
                    <div className="docs-declaration-heading"><h3><a aria-label={ `Link to ${declaration.name}` }
                        className="docs-declaration-anchor"
                        href={ declarationHref(declaration.id) }>#</a>{declaration.name}{declaration.kind === "interface" ? <span className="docs-kind-badge">INTERFACE</span> : null}</h3><div className="docs-declaration-links">{declaration.introductionVersion === undefined ? null : <span>Added in {declaration.introductionVersion}</span>}{declaration.source === undefined ? null : <a href={ `${declaration.source.repositoryUrl}/blob/${declaration.source.revision}/${declaration.source.file}${declaration.source.line === undefined ? "" : `#L${declaration.source.line}`}` }>Source ↗</a>}<CopyForLlmButton document={ declarationDocument(record, declaration.name, declaration.description, declaration.signature) } /></div></div>
                    <p>{declaration.description}</p>
                    <h4>Signature</h4>
                    <DocCode language="typescript">{declaration.signature}</DocCode>
                </article>)}
            </section>)}
        </main>
        <OnThisPage items={ tocItems(record) } />
    </div>;
};
