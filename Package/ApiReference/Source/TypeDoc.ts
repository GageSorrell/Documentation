/**
 * Programmatic TypeDoc discovery and normalization.
 *
 * @module @sorrell/docs-api-reference/TypeDoc
 *
 * @file      TypeDoc.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Application, ReflectionKind, TSConfigReader, TypeDocReader } from "typedoc";
import type { ApiReferenceDeclaration, ApiReferenceRecord, ApiReferenceSource } from "@sorrell/docs-core";
import { createApiDataset, validateApiRecords } from "./Serialization.js";
import { ApiReferenceError } from "./Errors.js";
import type { ApiReferenceDataset, ApiReferenceGenerationOptions } from "./Types.js";

interface ReflectionLike {
    readonly id?: number;
    readonly name?: string;
    readonly kind?: number;
    readonly children?: ReadonlyArray<ReflectionLike>;
    readonly signatures?: ReadonlyArray<ReflectionLike>;
    readonly comment?: { readonly summary?: ReadonlyArray<{ readonly text?: string }> };
    readonly sources?: ReadonlyArray<{ readonly fileName?: string; readonly line?: number; readonly character?: number }>;
    readonly type?: { readonly toString?: () => string };
    readonly parent?: ReflectionLike;
}

const textOf = (reflection: ReflectionLike | undefined): string => reflection?.comment?.summary?.map((part) => part.text ?? "").join("").trim() ?? "";

const sourceOf = (reflection: ReflectionLike | undefined, repositoryUrl: string | undefined, revision: string | undefined, sourceRoot: string | undefined): ApiReferenceSource | undefined => {
    const source = reflection?.sources?.[0];
    if (source?.fileName === undefined || repositoryUrl === undefined || revision === undefined) {return undefined;}
    const rawFile = source.fileName.replaceAll("\\", "/");
    const normalizedRoot = sourceRoot?.replaceAll("\\", "/").replace(/\/$/, "");
    const file = normalizedRoot !== undefined && rawFile.startsWith(`${normalizedRoot}/`) ? rawFile.slice(normalizedRoot.length + 1) : rawFile;
    return {
        repositoryUrl,
        revision,
        file,
        ...(source.line === undefined ? {} : { line: source.line })
    };
};

const categoryFor = (reflection: ReflectionLike): { readonly id: string; readonly label: string; readonly order: number; readonly collapsed: boolean } => {
    const kind = reflection.kind;
    if (kind === ReflectionKind.Function) {return { id: "functions", label: "Functions", order: 0, collapsed: false };}
    if (kind === ReflectionKind.Class) {return { id: "classes", label: "Classes", order: 1, collapsed: false };}
    if (kind === ReflectionKind.Interface) {return { id: "interfaces", label: "Interfaces", order: 2, collapsed: false };}
    if (kind === ReflectionKind.TypeAlias) {return { id: "types", label: "Types", order: 3, collapsed: false };}
    if (kind === ReflectionKind.Variable || kind === ReflectionKind.Enum) {return { id: "constants", label: "Constants", order: 4, collapsed: false };}
    if (kind === ReflectionKind.Namespace) {return { id: "namespaces", label: "Namespaces", order: 5, collapsed: false };}
    return { id: "other", label: "Other", order: 6, collapsed: false };
};

const declarationKind = (reflection: ReflectionLike): ApiReferenceDeclaration["kind"] => {
    if (reflection.kind === ReflectionKind.Function) {return "function";}
    if (reflection.kind === ReflectionKind.Class) {return "class";}
    if (reflection.kind === ReflectionKind.Interface) {return "interface";}
    if (reflection.kind === ReflectionKind.TypeAlias) {return "type";}
    if (reflection.kind === ReflectionKind.Namespace) {return "namespace";}
    return "variable";
};

const signatureFor = (reflection: ReflectionLike): string => {
    const signature = reflection.signatures?.[0];
    const signatureText = signature?.type?.toString?.() ?? signature?.name;
    if (signatureText !== undefined && signatureText !== "") {return signatureText;}
    const kind = declarationKind(reflection);
    return `export declare ${kind} ${reflection.name ?? "unknown"}`;
};

const declarationId = (name: string): string => {
    const normalized = name.replace(/[^A-Za-z0-9_$.-]+/g, "-").replace(/^-+|-+$/g, "");
    return normalized === "" ? "declaration" : normalized;
};

const declarationFrom = (reflection: ReflectionLike, packageInput: ApiReferenceGenerationOptions["packages"][number], categoryId: string, options: ApiReferenceGenerationOptions): ApiReferenceDeclaration => {
    const name = reflection.name ?? "unknown";
    const source = sourceOf(reflection, options.repositoryUrl, options.revision, options.sourceRoot);
    return {
        id: declarationId(name),
        name,
        kind: declarationKind(reflection),
        categoryId,
        description: textOf(reflection) || `${name} exported by ${packageInput.name}.`,
        signature: signatureFor(reflection),
        ...(source === undefined ? {} : { source })
    };
};

const recordFrom = (reflection: ReflectionLike, packageInput: ApiReferenceGenerationOptions["packages"][number], options: ApiReferenceGenerationOptions): ApiReferenceRecord => {
    const children = [ ...(reflection.children ?? []) ].filter((child) => child.name !== undefined).sort((left, right) => (left.name ?? "").localeCompare(right.name ?? ""));
    const categories = [ ...new Map(children.map((child) => {
        const category = categoryFor(child);
        return [ category.id, category ];
    })).values() ].sort((left, right) => left.order - right.order);
    const declarations = children.map((child) => declarationFrom(child, packageInput, categoryFor(child).id, options));
    const moduleName = packageInput.id;
    const displayName = reflection.name ?? packageInput.name;
    const moduleSource = sourceOf(reflection, options.repositoryUrl, options.revision, options.sourceRoot);
    return {
        packageId: packageInput.id,
        packageName: packageInput.name,
        module: moduleName,
        displayName,
        version: packageInput.version,
        summary: textOf(reflection) || `API reference for ${packageInput.name}.`,
        breadcrumbs: [
            { label: "API Reference", href: `${options.referencePrefix ?? "/docs/api"}/`, current: false },
            { label: packageInput.version, href: `${options.referencePrefix ?? "/docs/api"}/${packageInput.version}`, current: false },
            { label: packageInput.name, href: `${options.referencePrefix ?? "/docs/api"}/${packageInput.id}`, current: false },
            { label: displayName, current: true }
        ],
        categories,
        declarations,
        exportCount: declarations.length,
        introductionVersion: packageInput.version,
        ...(moduleSource === undefined ? {} : { source: moduleSource }),
        link: { href: `${options.referencePrefix ?? "/docs/api"}/${moduleName}`, label: displayName, external: false }
    };
};

const moduleReflection = (project: ReflectionLike): ReflectionLike => {
    return project;
};

export const generateApiDataset = async (options: ApiReferenceGenerationOptions): Promise<ApiReferenceDataset> => {
    if (options.packages.length === 0) {throw new ApiReferenceError("at least one package must be configured");}
    const records: Array<ApiReferenceRecord> = [];
    for (const packageInput of options.packages) {
        const app = await Application.bootstrapWithPlugins({
            entryPoints: packageInput.entryPoints.map((entryPoint) => entryPoint.replaceAll("\\", "/")),
            skipErrorChecking: true,
            ...(packageInput.tsconfig === undefined ? {} : { tsconfig: packageInput.tsconfig }),
            ...(options.typedoc ?? {})
        }, [ new TSConfigReader(), new TypeDocReader() ]);
        const project = await app.convert();
        if (project === undefined) {throw new ApiReferenceError(`TypeDoc could not convert ${packageInput.name}`);}
        records.push(recordFrom(moduleReflection(project as unknown as ReflectionLike), packageInput, options));
    }
    const validation = validateApiRecords(records);
    if (!validation.valid) {throw new ApiReferenceError(validation.errors.join("; "));}
    const datasetOptions = {
        generatedAt: options.generatedAt ?? new Date().toISOString(),
        ...(options.revision === undefined ? {} : { sourceRevision: options.revision })
    };
    return createApiDataset(records.sort((left, right) => `${left.packageId}:${left.module}`.localeCompare(`${right.packageId}:${right.module}`)), datasetOptions);
};
