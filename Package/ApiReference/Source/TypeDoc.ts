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

import type {
    ApiReferenceDataset,
    ApiReferenceGenerationOptions
} from "./Types.js";
import type {
    ApiReferenceDeclaration,
    ApiReferenceRecord,
    ApiReferenceSource
} from "@sorrell/docs-core";
import {
    Application,
    ReflectionKind,
    TSConfigReader,
    TypeDocReader
} from "typedoc";
import { createApiDataset, validateApiRecords } from "./Serialization.js";
import { ApiReferenceError } from "./Errors.js";
interface ReflectionSource {
    readonly fileName?: string;
    readonly line?: number;
    readonly character?: number;
}
interface ReflectionCommentPart {
    readonly text?: string;
}
interface ReflectionComment {
    readonly summary?: ReadonlyArray<ReflectionCommentPart>;
}
interface ReflectionLike {
    readonly id?: number;
    readonly name?: string;
    readonly kind?: number;
    readonly children?: ReadonlyArray<ReflectionLike>;
    readonly signatures?: ReadonlyArray<ReflectionLike>;
    readonly comment?: ReflectionComment;
    readonly sources?: ReadonlyArray<ReflectionSource>;
    readonly type?: {
        readonly toString?: () => string;
    };
    readonly parent?: ReflectionLike;
}
const textOf = (reflection: ReflectionLike | undefined): string =>
    reflection?.comment?.summary
        ?.map((part: { readonly text?: string }) => part.text ?? "")
        .join("")
        .trim() ?? "";
const sourceOf = (
    reflection: ReflectionLike | undefined,
    repositoryUrl: string | undefined,
    revision: string | undefined,
    sourceRoot: string | undefined
): ApiReferenceSource | undefined =>
{
    const source = reflection?.sources?.[0];
    if (
        source?.fileName === undefined ||
        repositoryUrl === undefined ||
        revision === undefined
    )
    {
        return undefined;
    }
    const rawFile = source.fileName.replaceAll("\\", "/");
    const normalizedRoot = sourceRoot?.replaceAll("\\", "/").replace(/\/$/, "");
    const file =
        normalizedRoot !== undefined && rawFile.startsWith(`${normalizedRoot}/`)
            ? rawFile.slice(normalizedRoot.length + 1)
            : rawFile;
    return {
        file,
        repositoryUrl,
        revision,
        ...(source.line === undefined ? {} : { line: source.line })
    };
};
interface Category {
    readonly id: string;
    readonly label: string;
    readonly order: number;
    readonly collapsed: boolean;
}
const categoryFor = (reflection: ReflectionLike): Category =>
{
    const kind = reflection.kind;
    if (kind === ReflectionKind.Function)
    {
        return {
            collapsed: false,
            id: "functions",
            label: "Functions",
            order: 0
        };
    }
    if (kind === ReflectionKind.Class)
    {
        return { collapsed: false, id: "classes", label: "Classes", order: 1 };
    }
    if (kind === ReflectionKind.Interface)
    {
        return {
            collapsed: false,
            id: "interfaces",
            label: "Interfaces",
            order: 2
        };
    }
    if (kind === ReflectionKind.TypeAlias)
    {
        return { collapsed: false, id: "types", label: "Types", order: 3 };
    }
    if (kind === ReflectionKind.Variable || kind === ReflectionKind.Enum)
    {
        return {
            collapsed: false,
            id: "constants",
            label: "Constants",
            order: 4
        };
    }
    if (kind === ReflectionKind.Namespace)
    {
        return {
            collapsed: false,
            id: "namespaces",
            label: "Namespaces",
            order: 5
        };
    }
    return {
        collapsed: false,
        id: "other",
        label: "Other",
        order: 6
    };
};
const declarationKind = (
    reflection: ReflectionLike
): ApiReferenceDeclaration["kind"] =>
{
    if (reflection.kind === ReflectionKind.Function)
    {
        return "function";
    }
    if (reflection.kind === ReflectionKind.Class)
    {
        return "class";
    }
    if (reflection.kind === ReflectionKind.Interface)
    {
        return "interface";
    }
    if (reflection.kind === ReflectionKind.TypeAlias)
    {
        return "type";
    }
    if (reflection.kind === ReflectionKind.Namespace)
    {
        return "namespace";
    }
    return "variable";
};
const signatureFor = (reflection: ReflectionLike): string =>
{
    const signature = reflection.signatures?.[0];
    const signatureText = signature?.type?.toString?.() ?? signature?.name;
    if (signatureText !== undefined && signatureText !== "")
    {
        return signatureText;
    }
    const kind = declarationKind(reflection);
    return `export declare ${kind} ${reflection.name ?? "unknown"}`;
};
const declarationId = (name: string): string =>
{
    const normalized = name
        .replace(/[^A-Za-z0-9_$.-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return normalized === "" ? "declaration" : normalized;
};
const declarationFrom = (
    reflection: ReflectionLike,
    packageInput: ApiReferenceGenerationOptions["packages"][number],
    categoryId: string,
    options: ApiReferenceGenerationOptions
): ApiReferenceDeclaration =>
{
    const name = reflection.name ?? "unknown";
    const source = sourceOf(
        reflection,
        options.repositoryUrl,
        options.revision,
        options.sourceRoot
    );
    return {
        categoryId,
        description:
            textOf(reflection) || `${name} exported by ${packageInput.name}.`,
        id: declarationId(name),
        kind: declarationKind(reflection),
        name,
        signature: signatureFor(reflection),
        ...(source === undefined ? {} : { source })
    };
};
const recordFrom = (
    reflection: ReflectionLike,
    packageInput: ApiReferenceGenerationOptions["packages"][number],
    options: ApiReferenceGenerationOptions
): ApiReferenceRecord =>
{
    const children = [ ...(reflection.children ?? []) ]
        .filter((child: ReflectionLike) => child.name !== undefined)
        .sort((left: ReflectionLike, right: ReflectionLike) =>
            (left.name ?? "").localeCompare(right.name ?? "")
        );
    const categories = [
        ...new Map(
            children.map((child: ReflectionLike) =>
            {
                const category = categoryFor(child);
                return [ category.id, category ];
            })
        ).values()
    ].sort((left: Category, right: Category) => left.order - right.order);
    const declarations = children.map((child: ReflectionLike) =>
        declarationFrom(child, packageInput, categoryFor(child).id, options)
    );
    const moduleName = packageInput.id;
    const displayName = reflection.name ?? packageInput.name;
    const moduleSource = sourceOf(
        reflection,
        options.repositoryUrl,
        options.revision,
        options.sourceRoot
    );
    return {
        breadcrumbs: [
            {
                current: false,
                href: `${options.referencePrefix ?? "/docs/api"}/`,
                label: "API Reference"
            },
            {
                current: false,
                href: `${options.referencePrefix ?? "/docs/api"}/${packageInput.version}`,
                label: packageInput.version
            },
            {
                current: false,
                href: `${options.referencePrefix ?? "/docs/api"}/${packageInput.id}`,
                label: packageInput.name
            },
            {
                current: true,
                label: displayName
            }
        ],
        categories,
        declarations,
        displayName,
        exportCount: declarations.length,
        introductionVersion: packageInput.version,
        module: moduleName,
        packageId: packageInput.id,
        packageName: packageInput.name,
        summary:
            textOf(reflection) || `API reference for ${packageInput.name}.`,
        version: packageInput.version,
        ...(moduleSource === undefined ? {} : { source: moduleSource }),
        link: {
            external: false,
            href: `${options.referencePrefix ?? "/docs/api"}/${moduleName}`,
            label: displayName
        }
    };
};
const moduleReflection = (project: ReflectionLike): ReflectionLike =>
{
    return project;
};
const typedocOptionsFor = (
    options: ApiReferenceGenerationOptions
): Readonly<Record<string, unknown>> =>
{
    const repositoryUrl = options.repositoryUrl
        ?.replace(/\/+$/u, "")
        .replace(/\.git$/u, "");
    return {
        ...(repositoryUrl === undefined
            ? {}
            : {
                sourceLinkTemplate:
                    `${repositoryUrl}/blob/{gitRevision}/{path}#L{line}`
            }),
        ...(options.typedoc ?? {})
    };
};
export/** @internal */
const generateApiDataset = async (
    options: ApiReferenceGenerationOptions
): Promise<ApiReferenceDataset> =>
{
    if (options.packages.length === 0)
    {
        throw new ApiReferenceError("at least one package must be configured");
    }
    const records: Array<ApiReferenceRecord> = [];
    for (const packageInput of options.packages)
    {
        const app = await Application.bootstrapWithPlugins(
            {
                entryPoints: packageInput.entryPoints.map(
                    (entryPoint: string) => entryPoint.replaceAll("\\", "/")
                ),
                skipErrorChecking: true,
                ...(packageInput.tsconfig === undefined
                    ? {}
                    : { tsconfig: packageInput.tsconfig }),
                ...typedocOptionsFor(options)
            },
            [ new TSConfigReader(), new TypeDocReader() ]
        );
        const project = await app.convert();
        if (project === undefined)
        {
            throw new ApiReferenceError(
                `TypeDoc could not convert ${packageInput.name}`
            );
        }
        records.push(
            recordFrom(
                moduleReflection(project as unknown as ReflectionLike),
                packageInput,
                options
            )
        );
    }
    const validation = validateApiRecords(records);
    if (!validation.valid)
    {
        throw new ApiReferenceError(validation.errors.join("; "));
    }
    const datasetOptions = {
        generatedAt: options.generatedAt ?? new Date().toISOString(),
        ...(options.revision === undefined
            ? {}
            : { sourceRevision: options.revision })
    };
    return createApiDataset(
        records.sort(
            (
                left: {
                    readonly packageId: string;
                    readonly packageName: string;
                    readonly module: string;
                    readonly displayName: string;
                    readonly version: string;
                    readonly summary: string;
                    readonly breadcrumbs: ReadonlyArray<{
                        readonly label: string;
                        readonly current: boolean;
                        readonly href?: string;
                    }>;
                    readonly categories: ReadonlyArray<{
                        readonly id: string;
                        readonly label: string;
                        readonly order: number;
                        readonly collapsed: boolean;
                    }>;
                    readonly declarations: ReadonlyArray<{
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
                    }>;
                    readonly exportCount: number;
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
                },
                right: {
                    readonly packageId: string;
                    readonly packageName: string;
                    readonly module: string;
                    readonly displayName: string;
                    readonly version: string;
                    readonly summary: string;
                    readonly breadcrumbs: ReadonlyArray<{
                        readonly label: string;
                        readonly current: boolean;
                        readonly href?: string;
                    }>;
                    readonly categories: ReadonlyArray<{
                        readonly id: string;
                        readonly label: string;
                        readonly order: number;
                        readonly collapsed: boolean;
                    }>;
                    readonly declarations: ReadonlyArray<{
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
                    }>;
                    readonly exportCount: number;
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
                }
            ) =>
                `${left.packageId}:${left.module}`.localeCompare(
                    `${right.packageId}:${right.module}`
                )
        ),
        datasetOptions
    );
};
