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

/** @module @sorrell/docs-ui/Types */

import type { ReactNode } from "react";
import type { ApiReferenceRecord, DesignTokens, LandingContent } from "@sorrell/docs-core";

export type ThemeMode = "light" | "dark" | "system";

export interface DocumentationNavItem {
    readonly label: string;
    readonly href: string;
    readonly active?: boolean;
    readonly children?: ReadonlyArray<DocumentationNavItem>;
}

export interface DocumentationNavGroup {
    readonly label: string;
    readonly items: ReadonlyArray<DocumentationNavItem>;
}

export interface DocumentationShellProps {
    readonly children: ReactNode;
    readonly title?: string;
    readonly headerLinks?: ReadonlyArray<DocumentationNavItem>;
    readonly navigation?: ReadonlyArray<DocumentationNavGroup>;
    readonly toc?: ReadonlyArray<DocumentationNavItem>;
    readonly activeHref?: string;
    readonly repositoryHref?: string;
}

export interface BreadcrumbItem {
    readonly label: string;
    readonly href?: string;
    readonly current?: boolean;
}

export interface LlmDocument {
    readonly title: string;
    readonly context?: string;
    readonly url?: string;
    readonly content: string;
}

export interface ArticlePageProps {
    readonly title: string;
    readonly description?: string;
    readonly breadcrumbs?: ReadonlyArray<BreadcrumbItem>;
    readonly document: LlmDocument;
    readonly children: ReactNode;
}

export interface InstallCommandProps {
    readonly command: string;
    readonly packageName?: string;
}

export interface ApiReferencePageProps {
    readonly record: ApiReferenceRecord;
    readonly navigation?: ReadonlyArray<DocumentationNavGroup>;
}

export interface LandingPageProps {
    readonly content: LandingContent;
    readonly tokens?: DesignTokens;
    readonly installCommand?: string;
    readonly children?: ReactNode;
}
