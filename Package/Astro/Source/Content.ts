/**
 * Content models and deterministic ordering for Astro documentation pages.
 *
 * @module @sorrell/docs-astro/Content
 *
 * @file      Content.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** @internal */
export interface DocumentationFrontmatter
{
    readonly title: string;
    readonly description: string;
    readonly group: string;
    readonly order: number;
    readonly draft: boolean;
}

/** @internal */
export interface DocumentationPageSummary extends DocumentationFrontmatter
{
    readonly id: string;
    readonly slug: string;
}

export/** @internal */
const documentationSlug = (id: string): string =>
    id.replace(/(?:^|\/)index$/, "");

export/** @internal */
const sortDocumentationPages = <
    Page extends DocumentationPageSummary
>(
    pages: ReadonlyArray<Page>
): ReadonlyArray<Page> =>
    [ ...pages ].sort((left: Page, right: Page) =>
    {
        return (
            left.order - right.order ||
            left.title.localeCompare(right.title) ||
            left.id.localeCompare(right.id)
        );
    });

export/** @internal */
const visibleDocumentationPages = <
    Page extends DocumentationPageSummary
>(
    pages: ReadonlyArray<Page>
): ReadonlyArray<Page> =>
    sortDocumentationPages(pages.filter((page: Page) => !page.draft));
