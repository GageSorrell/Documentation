/**
 *
 *
 * @module @sorrell/docs-core/Schemas
 *
 * @file      Schemas.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/**
 * @module @sorrell/docs-core/Schemas
 */

import { Schema } from "effect";

const optionalString = Schema.optionalKey(Schema.String);
const optionalNumber = Schema.optionalKey(Schema.Number);
const optionalBoolean = Schema.optionalKey(Schema.Boolean);

export const RepositorySchema = Schema.Struct({
    url: Schema.String,
    branch: Schema.optionalKey(Schema.String),
    directory: optionalString
});

export const SiteMetadataSchema = Schema.Struct({
    name: Schema.String,
    title: Schema.String,
    description: Schema.String,
    url: Schema.String,
    logo: optionalString,
    repository: Schema.optionalKey(RepositorySchema)
});

export const ColorTokensSchema = Schema.Struct({
    background: Schema.String,
    foreground: Schema.String,
    muted: Schema.String,
    border: Schema.String,
    accent: Schema.String,
    codeBackground: Schema.String
});

export const DesignTokensSchema = Schema.Struct({
    light: ColorTokensSchema,
    dark: ColorTokensSchema
});

export interface NavigationItem {
    readonly id: string;
    readonly label: string;
    readonly href: string;
    readonly kind: "page" | "section" | "external";
    readonly children?: ReadonlyArray<NavigationItem>;
}

export interface NavigationGroup {
    readonly id: string;
    readonly label: string;
    readonly items: ReadonlyArray<NavigationItem>;
}

export interface Navigation {
    readonly groups: ReadonlyArray<NavigationGroup>;
}

interface NavigationItemInput {
    readonly id: string;
    readonly label: string;
    readonly href: string;
    readonly kind?: "page" | "section" | "external";
    readonly children?: ReadonlyArray<NavigationItemInput>;
}

export const NavigationItemSchema = Schema.Struct({
    id: Schema.String,
    label: Schema.String,
    href: Schema.String,
    kind: Schema.Literals([ "page", "section", "external" ]),
    children: Schema.optionalKey(Schema.Array(Schema.suspend(() => NavigationItemSchema)))
}) as Schema.Schema<NavigationItem>;

export const NavigationGroupSchema = Schema.Struct({
    id: Schema.String,
    label: Schema.String,
    items: Schema.Array(NavigationItemSchema)
});

export const NavigationSchema = Schema.Struct({
    groups: Schema.Array(NavigationGroupSchema)
}) as Schema.Schema<Navigation>;

export const DocumentationVersionSchema = Schema.Struct({
    id: Schema.String,
    label: Schema.String,
    version: optionalString,
    href: optionalString,
    directory: Schema.String,
    current: Schema.Boolean,
    order: Schema.Number
});

export const PackageReferenceSchema = Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    version: optionalString,
    description: optionalString,
    directory: optionalString,
    source: Schema.optionalKey(RepositorySchema)
});

export const LandingSectionSchema = Schema.Struct({
    id: Schema.String,
    title: Schema.String,
    body: Schema.String,
    href: optionalString
});

export const LandingContentSchema = Schema.Struct({
    title: Schema.String,
    description: Schema.String,
    sections: Schema.Array(LandingSectionSchema),
    primaryAction: Schema.optionalKey(Schema.Struct({
        label: Schema.String,
        href: Schema.String
    }))
});

export const RedirectSchema = Schema.Struct({
    from: Schema.String,
    to: Schema.String,
    status: Schema.Literals([ 301, 302 ])
});

export const StorybookConfigSchema = Schema.Struct({
    enabled: Schema.Boolean,
    directory: optionalString,
    command: optionalString,
    url: optionalString,
    stories: Schema.Array(Schema.String)
});

export const ApiGenerationConfigSchema = Schema.Struct({
    enabled: Schema.Boolean,
    entryPoints: Schema.Array(Schema.String),
    packages: Schema.Array(Schema.String),
    outputDirectory: Schema.String,
    typedoc: Schema.Record(Schema.String, Schema.Unknown),
    sourceRepository: Schema.optionalKey(RepositorySchema)
});

export const SiteRoutingSchema = Schema.Struct({
    documentationPrefix: Schema.String,
    storybookPrefix: Schema.String
});

export const VercelProjectSchema = Schema.Struct({
    id: optionalString,
    project: optionalString,
    directory: Schema.String,
    routePrefix: Schema.String,
    origin: optionalString,
    productionBranch: optionalString,
    team: optionalString
});

export const VercelProjectsSchema = Schema.Struct({
    landing: VercelProjectSchema,
    documentation: VercelProjectSchema,
    storybook: Schema.optionalKey(VercelProjectSchema)
});

export const VercelDeploymentSchema = Schema.Struct({
    project: Schema.String,
    deploymentId: Schema.String,
    url: Schema.String,
    revision: optionalString
});

export const VercelReleaseManifestSchema = Schema.Struct({
    revision: Schema.String,
    generatedAt: Schema.String,
    routes: SiteRoutingSchema,
    landing: VercelDeploymentSchema,
    documentation: VercelDeploymentSchema,
    storybook: Schema.optionalKey(VercelDeploymentSchema),
    apiSnapshot: optionalString
});

export const VercelConfigSchema = Schema.Struct({
    enabled: Schema.Boolean,
    project: optionalString,
    team: optionalString,
    outputDirectory: Schema.String,
    productionBranch: Schema.String,
    domains: Schema.Array(Schema.String),
    projects: VercelProjectsSchema
});

export const GeneratedManifestSchema = Schema.Struct({
    kind: Schema.Literals([ "site", "api-reference", "storybook", "project" ]),
    path: Schema.String,
    generatedAt: Schema.optionalKey(Schema.String),
    revision: optionalString,
    checksum: optionalString
});

export const ApiReferenceBreadcrumbSchema = Schema.Struct({
    label: Schema.String,
    href: optionalString,
    current: Schema.Boolean
});

export const ApiReferenceCategorySchema = Schema.Struct({
    id: Schema.String,
    label: Schema.String,
    order: Schema.Number,
    collapsed: Schema.Boolean
});

export const ApiReferenceSourceSchema = Schema.Struct({
    repositoryUrl: Schema.String,
    revision: Schema.String,
    file: Schema.String,
    line: optionalNumber,
    endLine: optionalNumber
});

export const StableLinkSchema = Schema.Struct({
    href: Schema.String,
    label: optionalString,
    external: Schema.Boolean
});

export const ApiReferenceDeclarationSchema = Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    kind: Schema.Literals([ "function", "const", "class", "interface", "type", "variable", "namespace" ]),
    categoryId: Schema.String,
    description: Schema.String,
    signature: Schema.String,
    introductionVersion: optionalString,
    source: Schema.optionalKey(ApiReferenceSourceSchema),
    link: Schema.optionalKey(StableLinkSchema)
});

export const ApiReferenceRecordSchema = Schema.Struct({
    packageId: Schema.String,
    packageName: Schema.String,
    module: Schema.String,
    displayName: Schema.String,
    version: Schema.String,
    summary: Schema.String,
    breadcrumbs: Schema.Array(ApiReferenceBreadcrumbSchema),
    categories: Schema.Array(ApiReferenceCategorySchema),
    declarations: Schema.Array(ApiReferenceDeclarationSchema),
    exportCount: Schema.Number,
    introductionVersion: optionalString,
    source: Schema.optionalKey(ApiReferenceSourceSchema),
    link: Schema.optionalKey(StableLinkSchema)
});

const OptionalSiteMetadataSchema = Schema.Struct({
    name: Schema.optionalKey(Schema.String),
    title: optionalString,
    description: optionalString,
    url: optionalString,
    logo: optionalString,
    repository: Schema.optionalKey(RepositorySchema)
});

const OptionalColorTokensSchema = Schema.Struct({
    background: optionalString,
    foreground: optionalString,
    muted: optionalString,
    border: optionalString,
    accent: optionalString,
    codeBackground: optionalString
});

const OptionalDesignTokensSchema = Schema.Struct({
    light: Schema.optionalKey(OptionalColorTokensSchema),
    dark: Schema.optionalKey(OptionalColorTokensSchema)
});

const OptionalNavigationItemSchema = Schema.Struct({
    id: Schema.String,
    label: Schema.String,
    href: Schema.String,
    kind: Schema.optionalKey(Schema.Literals([ "page", "section", "external" ])),
    children: Schema.optionalKey(Schema.Array(Schema.suspend(() => OptionalNavigationItemSchema)))
}) as Schema.Schema<NavigationItemInput>;

const OptionalNavigationSchema = Schema.Struct({
    groups: Schema.optionalKey(Schema.Array(Schema.Struct({
        id: Schema.String,
        label: Schema.String,
        items: Schema.Array(OptionalNavigationItemSchema)
    })))
});

const OptionalVersionSchema = Schema.Struct({
    id: Schema.String,
    label: optionalString,
    version: optionalString,
    href: optionalString,
    directory: optionalString,
    current: optionalBoolean,
    order: optionalNumber
});

const OptionalPackageSchema = Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    version: optionalString,
    description: optionalString,
    directory: optionalString,
    source: Schema.optionalKey(RepositorySchema)
});

const OptionalLandingSchema = Schema.Struct({
    title: optionalString,
    description: optionalString,
    sections: Schema.optionalKey(Schema.Array(Schema.Struct({
        id: Schema.String,
        title: Schema.String,
        body: optionalString,
        href: optionalString
    }))),
    primaryAction: Schema.optionalKey(Schema.Struct({
        label: Schema.String,
        href: Schema.String
    }))
});

const OptionalRedirectSchema = Schema.Struct({
    from: Schema.String,
    to: Schema.String,
    status: Schema.optionalKey(Schema.Literals([ 301, 302 ]))
});

const OptionalStorybookSchema = Schema.Struct({
    enabled: optionalBoolean,
    directory: optionalString,
    command: optionalString,
    url: optionalString,
    stories: Schema.optionalKey(Schema.Array(Schema.String))
});

const OptionalApiSchema = Schema.Struct({
    enabled: optionalBoolean,
    entryPoints: Schema.optionalKey(Schema.Array(Schema.String)),
    packages: Schema.optionalKey(Schema.Array(Schema.String)),
    outputDirectory: optionalString,
    typedoc: Schema.optionalKey(Schema.Record(Schema.String, Schema.Unknown)),
    sourceRepository: Schema.optionalKey(RepositorySchema)
});

const OptionalRoutingSchema = Schema.Struct({
    documentationPrefix: optionalString,
    storybookPrefix: optionalString
});

const OptionalVercelProjectSchema = Schema.Struct({
    id: optionalString,
    project: optionalString,
    directory: optionalString,
    routePrefix: optionalString,
    origin: optionalString,
    productionBranch: optionalString,
    team: optionalString
});

const OptionalVercelProjectsSchema = Schema.Struct({
    landing: Schema.optionalKey(OptionalVercelProjectSchema),
    documentation: Schema.optionalKey(OptionalVercelProjectSchema),
    storybook: Schema.optionalKey(OptionalVercelProjectSchema)
});

const OptionalVercelSchema = Schema.Struct({
    enabled: optionalBoolean,
    project: optionalString,
    team: optionalString,
    outputDirectory: optionalString,
    productionBranch: optionalString,
    domains: Schema.optionalKey(Schema.Array(Schema.String)),
    projects: Schema.optionalKey(OptionalVercelProjectsSchema)
});

const OptionalManifestSchema = Schema.Struct({
    kind: Schema.Literals([ "site", "api-reference", "storybook", "project" ]),
    path: Schema.String,
    generatedAt: optionalString,
    revision: optionalString,
    checksum: optionalString
});

export const DocsConfigInputSchema = Schema.Struct({
    metadata: Schema.optionalKey(OptionalSiteMetadataSchema),
    tokens: Schema.optionalKey(OptionalDesignTokensSchema),
    navigation: Schema.optionalKey(OptionalNavigationSchema),
    versions: Schema.optionalKey(Schema.Array(OptionalVersionSchema)),
    packages: Schema.optionalKey(Schema.Array(OptionalPackageSchema)),
    landing: Schema.optionalKey(OptionalLandingSchema),
    redirects: Schema.optionalKey(Schema.Array(OptionalRedirectSchema)),
    storybook: Schema.optionalKey(OptionalStorybookSchema),
    api: Schema.optionalKey(OptionalApiSchema),
    routing: Schema.optionalKey(OptionalRoutingSchema),
    vercel: Schema.optionalKey(OptionalVercelSchema),
    manifests: Schema.optionalKey(Schema.Array(OptionalManifestSchema))
});

export type SiteMetadata = Schema.Schema.Type<typeof SiteMetadataSchema>;
export type DesignTokens = Schema.Schema.Type<typeof DesignTokensSchema>;
export type DocumentationVersion = Schema.Schema.Type<typeof DocumentationVersionSchema>;
export type PackageReference = Schema.Schema.Type<typeof PackageReferenceSchema>;
export type LandingContent = Schema.Schema.Type<typeof LandingContentSchema>;
export type Redirect = Schema.Schema.Type<typeof RedirectSchema>;
export type StorybookConfig = Schema.Schema.Type<typeof StorybookConfigSchema>;
export type ApiGenerationConfig = Schema.Schema.Type<typeof ApiGenerationConfigSchema>;
export type SiteRouting = Schema.Schema.Type<typeof SiteRoutingSchema>;
export type VercelProject = Schema.Schema.Type<typeof VercelProjectSchema>;
export type VercelProjects = Schema.Schema.Type<typeof VercelProjectsSchema>;
export type VercelDeployment = Schema.Schema.Type<typeof VercelDeploymentSchema>;
export type VercelReleaseManifest = Schema.Schema.Type<typeof VercelReleaseManifestSchema>;
export type VercelConfig = Schema.Schema.Type<typeof VercelConfigSchema>;
export type GeneratedManifest = Schema.Schema.Type<typeof GeneratedManifestSchema>;
export type ApiReferenceBreadcrumb = Schema.Schema.Type<typeof ApiReferenceBreadcrumbSchema>;
export type ApiReferenceCategory = Schema.Schema.Type<typeof ApiReferenceCategorySchema>;
export type ApiReferenceSource = Schema.Schema.Type<typeof ApiReferenceSourceSchema>;
export type StableLink = Schema.Schema.Type<typeof StableLinkSchema>;
export type ApiReferenceDeclaration = Schema.Schema.Type<typeof ApiReferenceDeclarationSchema>;
export type ApiReferenceRecord = Schema.Schema.Type<typeof ApiReferenceRecordSchema>;
export type DocsConfigInput = Schema.Schema.Type<typeof DocsConfigInputSchema>;
