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

import type {
    ApiReferencePageProps,
    DocumentationNavGroup,
    DocumentationNavItem
} from "./Types.js";
import { Breadcrumbs, DocsSidebar, OnThisPage } from "./Navigation.js";
import { CopyForLlmButton } from "./CopyForLlm.js";
import { DocCode } from "./Mdx.js";
import { apiReferenceRecordToAgentDocument, type ApiReferenceCategory, type ApiReferenceDeclaration } from "@sorrell/docs-core";
const declarationHref = (id: string): string => `#${id}`;
type SourceLink = {
    readonly repositoryUrl: string;
    readonly revision: string;
    readonly file: string;
    readonly line?: number;
};
const sourceHref = (source: SourceLink): string =>
    [
        `${source.repositoryUrl}/blob/`,
        `${source.revision}/`,
        source.file,
        source.line === undefined ? "" : `#L${source.line}`
    ].join("");
const apiNavigation = (
    record: ApiReferencePageProps["record"]
): ReadonlyArray<DocumentationNavGroup> =>
    record.categories.map(
        (category: ApiReferenceCategory) => ({
            items: record.declarations
                .filter(
                    (declaration: ApiReferenceDeclaration) =>
                        declaration.categoryId === category.id
                )
                .map(
                    (declaration: {
                        readonly id: string;
                        readonly name: string;
                        readonly kind:
                            | "function"
                            | "const"
                            | "class"
                            | "interface"
                            | "type"
                            | "variable"
                            | "namespace";
                        readonly categoryId: string;
                        readonly description: string;
                        readonly signature: string;
                        readonly introductionVersion?: string;
                        readonly source?: {
                            readonly repositoryUrl: string;
                            readonly revision: string;
                            readonly file: string;
                            readonly line?: number;
                            readonly endLine?: number;
                        };
                        readonly link?: {
                            readonly href: string;
                            readonly external: boolean;
                            readonly label?: string;
                        };
                    }) => ({
                        active: false,
                        href: declarationHref(declaration.id),
                        label: declaration.name
                    })
                ),
            label: category.label
        })
    );
const tocItems = (
    record: ApiReferencePageProps["record"]
): ReadonlyArray<DocumentationNavItem> =>
    record.categories.map(
        (category: {
            readonly id: string;
            readonly label: string;
            readonly order: number;
            readonly collapsed: boolean;
        }) => ({
            children: record.declarations
                .filter(
                    (declaration: ApiReferenceDeclaration) => declaration.categoryId === category.id
                )
                .map(
                    (declaration: ApiReferenceDeclaration) => ({
                        href: declarationHref(declaration.id),
                        label: declaration.name
                    })
                ),
            href: `#category-${category.id}`,
            label: category.label
        })
    );
const declarationDocument = (
    record: ApiReferencePageProps["record"],
    name: string,
    description: string,
    signature: string
) => ({
    content: `${description}\n\n${signature}`,
    context: `${record.packageName} ${record.version}`,
    description,
    id: `${record.packageId}:${record.module}:${name}`,
    kind: "api-module" as const,
    metadata: {
        declarationKind:
            record.declarations.find(
                (declaration: {
                    readonly id: string;
                    readonly name: string;
                    readonly kind:
                        | "function"
                        | "const"
                        | "class"
                        | "interface"
                        | "type"
                        | "variable"
                        | "namespace";
                    readonly categoryId: string;
                    readonly description: string;
                    readonly signature: string;
                    readonly introductionVersion?: string;
                    readonly source?: {
                        readonly repositoryUrl: string;
                        readonly revision: string;
                        readonly file: string;
                        readonly line?: number;
                        readonly endLine?: number;
                    };
                    readonly link?: {
                        readonly href: string;
                        readonly external: boolean;
                        readonly label?: string;
                    };
                }) => declaration.name === name
            )?.kind ?? "unknown"
    },
    title: name,
    url: `${record.link?.href ?? ""}#${name}`,
    version: record.version
});
export/** @internal */
const ApiReferencePage = ({
    record,
    navigation = []
}: ApiReferencePageProps) =>
{
    const groups = navigation.length === 0 ? apiNavigation(record) : navigation;
    const document = apiReferenceRecordToAgentDocument(record);
    return (
        <div className="docs-api-page">
            <DocsSidebar groups={ groups }
                label="API Reference" />
            <main className="docs-api-main">
                <Breadcrumbs items={ record.breadcrumbs } />
                <div className="docs-api-heading-row">
                    <div>
                        <h1>{record.displayName}</h1>
                        <p>{record.summary}</p>
                    </div>
                    <CopyForLlmButton document={ document } />
                </div>
                <div className="docs-api-meta">
                    <span>{record.exportCount} exports</span>
                    {record.introductionVersion === undefined ? null : (
                        <span>Added in {record.introductionVersion}</span>
                    )}
                    {record.source === undefined ? null : (
                        <a
                            href={ sourceHref(record.source) }
                        >
                            ◉ Source ↗
                        </a>
                    )}
                </div>
                {record.categories.map(
                    (category: {
                        readonly id: string;
                        readonly label: string;
                        readonly order: number;
                        readonly collapsed: boolean;
                    }) => (
                        <section
                            className="docs-api-category"
                            id={ `category-${category.id}` }
                            key={ category.id }
                        >
                            <h2>{category.label}</h2>
                            {record.declarations
                                .filter(
                                    (declaration: {
                                        readonly id: string;
                                        readonly name: string;
                                        readonly kind:
                                            | "function"
                                            | "const"
                                            | "class"
                                            | "interface"
                                            | "type"
                                            | "variable"
                                            | "namespace";
                                        readonly categoryId: string;
                                        readonly description: string;
                                        readonly signature: string;
                                        readonly introductionVersion?: string;
                                        readonly source?: {
                                            readonly repositoryUrl: string;
                                            readonly revision: string;
                                            readonly file: string;
                                            readonly line?: number;
                                            readonly endLine?: number;
                                        };
                                        readonly link?: {
                                            readonly href: string;
                                            readonly external: boolean;
                                            readonly label?: string;
                                        };
                                    }) =>
                                        declaration.categoryId === category.id
                                )
                                .map(
                                    (declaration: {
                                        readonly id: string;
                                        readonly name: string;
                                        readonly kind:
                                            | "function"
                                            | "const"
                                            | "class"
                                            | "interface"
                                            | "type"
                                            | "variable"
                                            | "namespace";
                                        readonly categoryId: string;
                                        readonly description: string;
                                        readonly signature: string;
                                        readonly introductionVersion?: string;
                                        readonly source?: {
                                            readonly repositoryUrl: string;
                                            readonly revision: string;
                                            readonly file: string;
                                            readonly line?: number;
                                            readonly endLine?: number;
                                        };
                                        readonly link?: {
                                            readonly href: string;
                                            readonly external: boolean;
                                            readonly label?: string;
                                        };
                                    }) => (
                                        <article
                                            className="docs-api-declaration"
                                            id={ declaration.id }
                                            key={ declaration.id }
                                        >
                                            <div className="docs-declaration-heading">
                                                <h3>
                                                    <a
                                                        aria-label={ `Link to ${declaration.name}` }
                                                        className="docs-declaration-anchor"
                                                        href={ declarationHref(
                                                            declaration.id
                                                        ) }
                                                    >
                                                        #
                                                    </a>
                                                    {declaration.name}
                                                    {declaration.kind ===
                                                    "interface" ? (
                                                            <span className="docs-kind-badge">
                                                                INTERFACE
                                                            </span>
                                                        ) : null}
                                                </h3>
                                                <div className="docs-declaration-links">
                                                    {declaration.introductionVersion ===
                                                    undefined ? null : (
                                                            <span>
                                                                Added in{" "}
                                                                {
                                                                    declaration.introductionVersion
                                                                }
                                                            </span>
                                                        )}
                                                    {declaration.source ===
                                                    undefined ? null : (
                                                            <a
                                                                href={ sourceHref(
                                                                    declaration.source
                                                                ) }
                                                            >
                                                                Source ↗
                                                            </a>
                                                        )}
                                                    <CopyForLlmButton
                                                        document={ declarationDocument(
                                                            record,
                                                            declaration.name,
                                                            declaration.description,
                                                            declaration.signature
                                                        ) }
                                                    />
                                                </div>
                                            </div>
                                            <p>{declaration.description}</p>
                                            <h4>Signature</h4>
                                            <DocCode language="typescript">
                                                {declaration.signature}
                                            </DocCode>
                                        </article>
                                    )
                                )}
                        </section>
                    )
                )}
            </main>
            <OnThisPage items={ tocItems(record) } />
        </div>
    );
};
