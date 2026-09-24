/**
 * Version navigation for the initial dogfood documentation site.
 *
 * @module @sorrell/documentation/Versions
 *
 * @file      Versions.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export const documentationVersions = [
    { id: "current", label: "Current" },
    { id: "v1", label: "v1" }
] as const;

export type DocumentationVersion = typeof documentationVersions[number]["id"];
