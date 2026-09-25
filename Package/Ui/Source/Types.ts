/**
 *
 *
 * @module @sorrell/docs-ui/Types
 *
 * @file      Types.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type {
    AgentDocument,
    ApiReferenceRecord,
    DesignTokens,
    LandingContent
} from "@sorrell/docs-core";
import type { ReactNode } from "react";

/** @internal */
export type ThemeMode =
    | "light"
    | "dark"
    | "system";

/** @internal */
export interface DocumentationNavItem
{
    readonly label: string;
    readonly href: string;
    readonly active?: boolean;
    readonly children?: ReadonlyArray<DocumentationNavItem>;
}

/** @internal */
export interface DocumentationNavGroup
{
    readonly label: string;
    readonly items: ReadonlyArray<DocumentationNavItem>;
}

/** @internal */
export interface DocumentationShellProps
{
    readonly children: ReactNode;
    readonly title?: string;
    readonly headerLinks?: ReadonlyArray<DocumentationNavItem>;
    readonly navigation?: ReadonlyArray<DocumentationNavGroup>;
    readonly toc?: ReadonlyArray<DocumentationNavItem>;
    readonly activeHref?: string;
    readonly repositoryHref?: string;
}

/** @internal */
export interface BreadcrumbItem
{
    readonly label: string;
    readonly href?: string;
    readonly current?: boolean;
}

/** @internal */
export type LlmDocument = AgentDocument;

/** @internal */
export interface ArticlePageProps
{
    readonly title: string;
    readonly description?: string;
    readonly breadcrumbs?: ReadonlyArray<BreadcrumbItem>;
    readonly document: AgentDocument;
    readonly children: ReactNode;
}

/** @internal */
export interface InstallCommandProps
{
    readonly command: string;
    readonly packageName?: string;
}

/** @internal */
export interface ApiReferencePageProps
{
    readonly record: ApiReferenceRecord;
    readonly navigation?: ReadonlyArray<DocumentationNavGroup>;
}

/** @internal */
export interface LandingPageProps
{
    readonly content: LandingContent;
    readonly tokens?: DesignTokens;
    readonly installCommand?: string;
    readonly children?: ReactNode;
}
