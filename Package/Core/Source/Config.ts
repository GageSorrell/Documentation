/**
 *
 *
 * @module @sorrell/docs-core/Config
 *
 * @file      Config.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** @module @sorrell/docs-core/Config */

import { Effect, Result, Schema, SchemaIssue } from "effect";
import { DocsConfigError, type ConfigPathSegment, type DocsConfigDiagnostic } from "./Errors.js";
import {
    ApiGenerationConfigSchema,
    DocumentationVersionSchema,
    DocsConfigInputSchema,
    GeneratedManifestSchema,
    LandingContentSchema,
    NavigationSchema,
    PackageReferenceSchema,
    RedirectSchema,
    SiteMetadataSchema,
    StorybookConfigSchema,
    SiteRoutingSchema,
    VercelConfigSchema,
    DesignTokensSchema,
    type ApiGenerationConfig,
    type DesignTokens,
    type DocumentationVersion,
    type DocsConfigInput,
    type GeneratedManifest,
    type LandingContent,
    type Navigation,
    type PackageReference,
    type Redirect,
    type SiteMetadata,
    type StorybookConfig,
    type SiteRouting,
    type VercelConfig
} from "./Schemas.js";

const decodeAs = <Value>(schema: unknown, value: unknown): Value =>
    Schema.decodeUnknownSync(schema as Schema.ConstraintDecoder<unknown, never>)(value) as Value;

const omitUndefined = (value: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(Object.entries(value).filter(([ , entry ]) => entry !== undefined));

export interface DocsConfig {
    readonly metadata: SiteMetadata;
    readonly tokens: DesignTokens;
    readonly navigation: Navigation;
    readonly versions: ReadonlyArray<DocumentationVersion>;
    readonly packages: ReadonlyArray<PackageReference>;
    readonly landing: LandingContent;
    readonly redirects: ReadonlyArray<Redirect>;
    readonly storybook: StorybookConfig;
    readonly api: ApiGenerationConfig;
    readonly routing: SiteRouting;
    readonly vercel: VercelConfig;
    readonly manifests: ReadonlyArray<GeneratedManifest>;
}

const defaultColors = {
    background: "#ffffff",
    foreground: "#111111",
    muted: "#6b7280",
    border: "#e5e7eb",
    accent: "#2563eb",
    codeBackground: "#f3f4f6"
} as const;

const defaultDarkColors = {
    background: "#09090b",
    foreground: "#f4f4f5",
    muted: "#a1a1aa",
    border: "#27272a",
    accent: "#93c5fd",
    codeBackground: "#18181b"
} as const;

export const DefaultDesignTokens: DesignTokens = {
    light: defaultColors,
    dark: defaultDarkColors
};

const mergeColors = (base: DesignTokens["light"], value: Partial<DesignTokens["light"]> | undefined) => ({
    ...base,
    ...value
});

const sortedByOrder = <Value extends { readonly order: number; readonly id: string }>(values: ReadonlyArray<Value>): ReadonlyArray<Value> =>
    [ ...values ].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));

const uniqueDiagnostics = (diagnostics: ReadonlyArray<DocsConfigDiagnostic>): ReadonlyArray<DocsConfigDiagnostic> => {
    const seen = new Set<string>();
    return diagnostics.filter((diagnostic) => {
        const key = `${diagnostic.path.join(".")}:${diagnostic.message}`;
        if (seen.has(key)) {return false;}
        seen.add(key);
        return true;
    });
};

const routePrefixesOverlap = (left: string, right: string): boolean =>
    left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`);

const issuePath = (issue: SchemaIssue.Issue, prefix: ReadonlyArray<ConfigPathSegment> = []): ReadonlyArray<DocsConfigDiagnostic> => {
    switch (issue._tag) {
        case "Pointer":
            return issuePath(issue.issue, [ ...prefix, ...issue.path.filter((segment): segment is ConfigPathSegment => typeof segment === "string" || typeof segment === "number") ]);
        case "Composite":
        case "AnyOf":
            return issue.issues.flatMap((child) => issuePath(child, prefix));
        case "Filter":
        case "Encoding":
            return issuePath(issue.issue, prefix);
        default:
            return [ {
                path: prefix,
                message: SchemaIssue.makeFormatterDefault()(issue),
                expected: "valid configuration value"
            } ];
    }
};

const decodeInput = (input: unknown): Result.Result<DocsConfigInput, DocsConfigError> => {
    const decoded = Schema.decodeUnknownResult(
        DocsConfigInputSchema as unknown as Schema.ConstraintDecoder<DocsConfigInput, never>
    )(input);
    if (Result.isFailure(decoded)) {
        return Result.fail(new DocsConfigError({ diagnostics: uniqueDiagnostics(issuePath(decoded.failure.issue)) }));
    }
    return Result.succeed(decoded.success);
};

const duplicateDiagnostics = (name: string, values: ReadonlyArray<{ readonly id: string }>): ReadonlyArray<DocsConfigDiagnostic> => {
    const counts = new Map<string, number>();
    for (const value of values) {counts.set(value.id, (counts.get(value.id) ?? 0) + 1);}
    return [ ...counts.entries() ]
        .filter(([ , count ]) => count > 1)
        .map(([ id ]) => ({ path: [ name, id ], message: `duplicate id "${id}"`, expected: "unique identifiers" }));
};

const validate = (config: DocsConfig): ReadonlyArray<DocsConfigDiagnostic> => {
    const diagnostics: Array<DocsConfigDiagnostic> = [];
    if (config.metadata.name.trim() === "") {diagnostics.push({ path: [ "metadata", "name" ], message: "must not be empty" });}
    if (config.metadata.title.trim() === "") {diagnostics.push({ path: [ "metadata", "title" ], message: "must not be empty" });}
    if (config.metadata.url !== "" && !/^https?:\/\//.test(config.metadata.url)) {
        diagnostics.push({ path: [ "metadata", "url" ], message: "must be an http(s) URL" });
    }
    diagnostics.push(...duplicateDiagnostics("versions", config.versions));
    diagnostics.push(...duplicateDiagnostics("packages", config.packages));
    for (const [ index, redirect ] of config.redirects.entries()) {
        if (!redirect.from.startsWith("/")) {diagnostics.push({ path: [ "redirects", index, "from" ], message: "must begin with /" });}
        if (!redirect.to.startsWith("/")) {diagnostics.push({ path: [ "redirects", index, "to" ], message: "must begin with /" });}
    }
    for (const [ index, version ] of config.versions.entries()) {
        if (!/^[a-z0-9][a-z0-9-]*$/.test(version.id)) {diagnostics.push({ path: [ "versions", index, "id" ], message: "must be a lowercase URL-safe identifier" });}
    }
    for (const [ name, prefix ] of Object.entries(config.routing)) {
        if (!prefix.startsWith("/")) {diagnostics.push({ path: [ "routing", name ], message: "must begin with /" });}
        if (prefix !== "/" && prefix.endsWith("/")) {diagnostics.push({ path: [ "routing", name ], message: "must not end with /" });}
        if (prefix === "/") {diagnostics.push({ path: [ "routing", name ], message: "must not be / because / belongs to the landing package" });}
    }
    if (routePrefixesOverlap(config.routing.documentationPrefix, config.routing.storybookPrefix)) {
        diagnostics.push({ path: [ "routing" ], message: "documentationPrefix and storybookPrefix must not overlap" });
    }
    if (config.vercel.projects.landing.routePrefix !== "/") {
        diagnostics.push({ path: [ "vercel", "projects", "landing", "routePrefix" ], message: "must be / because Landing owns the public root" });
    }
    if (config.vercel.projects.documentation.routePrefix !== config.routing.documentationPrefix) {
        diagnostics.push({ path: [ "vercel", "projects", "documentation", "routePrefix" ], message: "must match routing.documentationPrefix" });
    }
    if (config.vercel.projects.storybook !== undefined && config.vercel.projects.storybook.routePrefix !== config.routing.storybookPrefix) {
        diagnostics.push({ path: [ "vercel", "projects", "storybook", "routePrefix" ], message: "must match routing.storybookPrefix" });
    }
    return uniqueDiagnostics(diagnostics);
};

export const normalizeDocsConfig = (input: DocsConfigInput): DocsConfig => {
    const metadataInput = input.metadata ?? {};
    const metadata = decodeAs<SiteMetadata>(SiteMetadataSchema, omitUndefined({
        name: metadataInput.name ?? "Sorrell Documentation",
        title: metadataInput.title ?? metadataInput.name ?? "Sorrell Documentation",
        description: metadataInput.description ?? "Documentation generated with Sorrell documentation tooling.",
        url: metadataInput.url ?? "",
        logo: metadataInput.logo,
        repository: metadataInput.repository
    }));
    const tokenInput = input.tokens ?? {};
    const tokens = decodeAs<DesignTokens>(DesignTokensSchema, {
        light: mergeColors(defaultColors, tokenInput.light),
        dark: mergeColors(defaultDarkColors, tokenInput.dark)
    });
    const navigation = decodeAs<Navigation>(NavigationSchema as Schema.Schema<Navigation>, {
        groups: (input.navigation?.groups ?? []).map((group) => ({
            id: group.id,
            label: group.label,
            items: group.items.map((item) => ({ ...item, kind: item.kind ?? "page" }))
        }))
    });
    const versions = sortedByOrder((input.versions ?? [ { id: "current", label: "Current", directory: ".", current: true, order: 0 } ]).map((version, index) => decodeAs<DocumentationVersion>(DocumentationVersionSchema, omitUndefined({
        id: version.id,
        label: version.label ?? version.version ?? version.id,
        version: version.version,
        href: version.href,
        directory: version.directory ?? version.id,
        current: version.current ?? index === 0,
        order: version.order ?? index
    }))));
    const packages = [ ...(input.packages ?? []) ].map((value) => ({ ...value })).sort((left, right) => left.id.localeCompare(right.id)).map((value) => decodeAs<PackageReference>(PackageReferenceSchema, omitUndefined({
        id: value.id,
        name: value.name,
        version: value.version,
        description: value.description,
        directory: value.directory,
        source: value.source
    })));
    const landing = decodeAs<LandingContent>(LandingContentSchema, omitUndefined({
        title: input.landing?.title ?? metadata.title,
        description: input.landing?.description ?? metadata.description,
        sections: (input.landing?.sections ?? []).map((section) => ({ ...section, body: section.body ?? "" })),
        primaryAction: input.landing?.primaryAction
    }));
    const redirects = [ ...(input.redirects ?? []) ].map((redirect) => decodeAs<Redirect>(RedirectSchema, { from: redirect.from, to: redirect.to, status: redirect.status ?? 301 })).sort((left, right) => left.from.localeCompare(right.from));
    const storybook = decodeAs<StorybookConfig>(StorybookConfigSchema, omitUndefined({ enabled: input.storybook?.enabled ?? false, directory: input.storybook?.directory, command: input.storybook?.command, url: input.storybook?.url, stories: input.storybook?.stories ?? [] }));
    const api = decodeAs<ApiGenerationConfig>(ApiGenerationConfigSchema, omitUndefined({ enabled: input.api?.enabled ?? false, entryPoints: input.api?.entryPoints ?? [], packages: input.api?.packages ?? [], outputDirectory: input.api?.outputDirectory ?? "Documentation/Api", typedoc: input.api?.typedoc ?? {}, sourceRepository: input.api?.sourceRepository }));
    const routing = decodeAs<SiteRouting>(SiteRoutingSchema, {
        documentationPrefix: input.routing?.documentationPrefix ?? "/docs",
        storybookPrefix: input.routing?.storybookPrefix ?? "/storybook"
    });
    const vercelInput = input.vercel;
    const projectInput = vercelInput?.projects;
    const landingProject = projectInput?.landing;
    const documentationProject = projectInput?.documentation;
    const storybookProject = projectInput?.storybook;
    const projectConfig = (value: typeof landingProject, directory: string, routePrefix: string, fallbackProject?: string) => omitUndefined({
        id: value?.id,
        project: value?.project ?? fallbackProject,
        directory: value?.directory ?? directory,
        routePrefix: value?.routePrefix ?? routePrefix,
        origin: value?.origin,
        productionBranch: value?.productionBranch ?? vercelInput?.productionBranch,
        team: value?.team ?? vercelInput?.team
    });
    const projects = omitUndefined({
        landing: projectConfig(landingProject, "Landing", "/", vercelInput?.project),
        documentation: projectConfig(documentationProject, "Documentation", routing.documentationPrefix),
        storybook: storybook.enabled ? projectConfig(storybookProject, "Storybook", routing.storybookPrefix) : undefined
    });
    const vercel = decodeAs<VercelConfig>(VercelConfigSchema, omitUndefined({ enabled: vercelInput?.enabled ?? false, project: vercelInput?.project, team: vercelInput?.team, outputDirectory: vercelInput?.outputDirectory ?? ".", productionBranch: vercelInput?.productionBranch ?? "Master", domains: vercelInput?.domains ?? [], projects }));
    const manifests = (input.manifests ?? []).map((manifest) => decodeAs<GeneratedManifest>(GeneratedManifestSchema, manifest));
    return { metadata, tokens, navigation, versions, packages, landing, redirects, storybook, api, routing, vercel, manifests };
};

export const decodeDocsConfig = (input: unknown): Result.Result<DocsConfig, DocsConfigError> => {
    const decoded = decodeInput(input);
    if (Result.isFailure(decoded)) {return Result.fail(decoded.failure);}
    const normalized = normalizeDocsConfig(decoded.success);
    const diagnostics = validate(normalized);
    return diagnostics.length > 0 ? Result.fail(new DocsConfigError({ diagnostics })) : Result.succeed(normalized);
};

export const decodeDocsConfigSync = (input: unknown): DocsConfig => {
    const decoded = decodeDocsConfig(input);
    if (Result.isFailure(decoded)) {throw decoded.failure;}
    return decoded.success;
};

export const decodeDocsConfigEffect = (input: unknown): Effect.Effect<DocsConfig, DocsConfigError> =>
    Effect.suspend(() => {
        const decoded = decodeDocsConfig(input);
        return Result.isFailure(decoded) ? Effect.fail(decoded.failure) : Effect.succeed(decoded.success);
    });
