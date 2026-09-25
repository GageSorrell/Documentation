/**
 * Effect-based managed installer for bundled Sorrell workflow skills.
 *
 * @module @sorrell/docs-skills/Installer
 *
 * @file      Installer.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    ArchiveService,
    AtomicWriter,
    ChecksumService,
    type DocsArchiveError,
    type DocsAtomicWriteError,
    DocsFileSystem,
    type DocsFileSystemError,
    DocsPath,
    checksumText
} from "@sorrell/docs-cli";
import { Context, Effect, Layer } from "effect";
import type {
    InstalledSkill,
    SkillDefinition,
    SkillInstallOptions,
    SkillRegistryEntry
} from "./Types.js";
import {
    SkillCollisionError,
    SkillError,
    SkillNotFoundError,
    SkillNotManagedError,
    SkillValidationError
} from "./Errors.js";
import type { Scope } from "effect";
import { SkillCatalog } from "./Catalog.js";
const registryFileName = ".sorrell-skill-registry.json";
const markerFileName = ".sorrell-skill.json";
const managedBy = "@sorrell/docs-skills";
interface SkillMarker extends SkillRegistryEntry {
    readonly version: 1;
    readonly managedBy: typeof managedBy;
}
interface SkillRegistry {
    readonly version: 1;
    readonly installations: ReadonlyArray<SkillRegistryEntry>;
}
const error = (operation: string, path: string, cause?: unknown): SkillError =>
    new SkillError({ cause, operation, path });
interface FileSystemApi {
    readonly exists: (
        path: string
    ) => Effect.Effect<boolean, DocsFileSystemError>;
    readonly isDirectory: (
        path: string
    ) => Effect.Effect<boolean, DocsFileSystemError>;
    readonly makeTempDirectoryScoped: (options?: {
        readonly prefix?: string;
    }) => Effect.Effect<string, DocsFileSystemError, Scope.Scope>;
    readonly makeTempFileScoped: (options?: {
        readonly prefix?: string;
        readonly suffix?: string;
    }) => Effect.Effect<string, DocsFileSystemError, Scope.Scope>;
    readonly makeDirectory: (
        path: string
    ) => Effect.Effect<void, DocsFileSystemError>;
    readonly readDirectory: (
        path: string
    ) => Effect.Effect<ReadonlyArray<string>, DocsFileSystemError>;
    readonly readText: (
        path: string
    ) => Effect.Effect<string, DocsFileSystemError>;
    readonly writeBytes: (
        path: string,
        content: Uint8Array
    ) => Effect.Effect<void, DocsFileSystemError>;
    readonly remove: (
        path: string,
        options?: {
            readonly recursive?: boolean;
        }
    ) => Effect.Effect<void, DocsFileSystemError>;
    readonly writeText: (
        path: string,
        content: string
    ) => Effect.Effect<void, DocsFileSystemError>;
}
interface PathApi {
    readonly dirname: (path: string) => string;
    readonly join: (...paths: ReadonlyArray<string>) => string;
    readonly resolve: (...paths: ReadonlyArray<string>) => string;
}
interface ChecksumApi {
    readonly text: (value: string) => Effect.Effect<string>;
}
const parse = <Value>(
    text: string,
    path: string,
    operation: string
): Effect.Effect<Value, SkillError> =>
    Effect.try({
        catch: (cause: unknown) => error(operation, path, cause),
        try: () => JSON.parse(text) as Value
    });
const readText = (
    fileSystem: FileSystemApi,
    path: string,
    operation: string
): Effect.Effect<string, SkillError> =>
    fileSystem
        .readText(path)
        .pipe(
            Effect.mapError((cause: DocsFileSystemError) =>
                error(operation, path, cause)
            )
        );
const ensureDirectory = (fileSystem: FileSystemApi, path: string) =>
    fileSystem
        .makeDirectory(path)
        .pipe(
            Effect.mapError((cause: DocsFileSystemError) =>
                error("makeDirectory", path, cause)
            )
        );
const relativeFiles = (
    fileSystem: FileSystemApi,
    path: PathApi,
    directory: string,
    prefix: string = ""
): Effect.Effect<ReadonlyArray<string>, SkillError> =>
    Effect.gen(function* ()
    {
        const entries = yield* fileSystem
            .readDirectory(directory)
            .pipe(
                Effect.mapError((cause: DocsFileSystemError) =>
                    error("readDirectory", directory, cause)
                )
            );
        const files: Array<string> = [];
        for (const entry of [ ...entries ].sort())
        {
            const fullPath = path.join(directory, entry);
            const relative = prefix === "" ? entry : path.join(prefix, entry);
            const directoryEntry = yield* fileSystem
                .isDirectory(fullPath)
                .pipe(
                    Effect.mapError((cause: DocsFileSystemError) =>
                        error("isDirectory", fullPath, cause)
                    )
                );
            if (directoryEntry)
            {
                files.push(
                    ...(yield* relativeFiles(
                        fileSystem,
                        path,
                        fullPath,
                        relative
                    ))
                );
            }
            else
            {
                files.push(relative);
            }
        }
        return files;
    });
const contentChecksum = (
    fileSystem: FileSystemApi,
    path: PathApi,
    checksum: ChecksumApi,
    directory: string
): Effect.Effect<string, SkillError> =>
    Effect.gen(function* ()
    {
        const files = (yield* relativeFiles(
            fileSystem,
            path,
            directory
        )).filter((file: string) => file !== ".sorrell-product-skill.json");
        const parts: Array<string> = [];
        for (const file of files)
        {
            const content = yield* readText(
                fileSystem,
                path.join(directory, file),
                "readSkillFile"
            );
            parts.push(`${file}\0${content}`);
        }
        return yield* checksum.text(parts.join("\0"));
    });
const validateDirectory = (
    fileSystem: FileSystemApi,
    path: PathApi,
    definition: SkillDefinition,
    directory: string
): Effect.Effect<void, SkillValidationError | SkillError> =>
    Effect.gen(function* ()
    {
        const skillReadMe = path.join(directory, "SKILL.md");
        const metadata = path.join(directory, "agents", "openai.yaml");
        const readMeExists = yield* fileSystem
            .exists(skillReadMe)
            .pipe(
                Effect.mapError((cause: DocsFileSystemError) =>
                    error("exists", skillReadMe, cause)
                )
            );
        if (!readMeExists)
        {
            return yield* Effect.fail(
                new SkillValidationError({
                    diagnostics: [ "SKILL.md is missing" ],
                    directory
                })
            );
        }
        const metadataExists = yield* fileSystem
            .exists(metadata)
            .pipe(
                Effect.mapError((cause: DocsFileSystemError) =>
                    error("exists", metadata, cause)
                )
            );
        if (!metadataExists)
        {
            return yield* Effect.fail(
                new SkillValidationError({
                    diagnostics: [ "agents/openai.yaml is missing" ],
                    directory
                })
            );
        }
        const content = yield* readText(
            fileSystem,
            skillReadMe,
            "validateSkill"
        );
        const diagnostics: Array<string> = [];
        if (
            !content.startsWith("---\n") ||
            !content.includes(`name: ${definition.name}`)
        )
        {
            diagnostics.push(
                `SKILL.md frontmatter name must be ${definition.name}`
            );
        }
        if (
            /\b(?:TODO|TBD|FIXME)\b|\{\{[^}]+\}\}|<PLACEHOLDER>/i.test(content)
        )
        {
            diagnostics.push("SKILL.md contains an unfinished placeholder");
        }
        if (diagnostics.length > 0)
        {
            return yield* Effect.fail(
                new SkillValidationError({ diagnostics, directory })
            );
        }
        const productMetadata = path.join(
            directory,
            ".sorrell-product-skill.json"
        );
        if (
            yield* fileSystem
                .exists(productMetadata)
                .pipe(
                    Effect.mapError((cause: DocsFileSystemError) =>
                        error("exists", productMetadata, cause)
                    )
                )
        )
        {
            const metadataValue = yield* readText(
                fileSystem,
                productMetadata,
                "readProductSkillMetadata"
            ).pipe(
                Effect.flatMap((text: string) =>
                    parse<{
                        readonly name?: string;
                        readonly checksum?: string;
                    }>(text, productMetadata, "parseProductSkillMetadata")
                )
            );
            if (metadataValue.name !== definition.name)
            {
                return yield* Effect.fail(
                    new SkillValidationError({
                        diagnostics: [
                            `product skill name must be ${definition.name}`
                        ],
                        directory
                    })
                );
            }
            const actual = yield* contentChecksum(
                fileSystem,
                path,
                {
                    text: (value: string) =>
                        Effect.succeed(checksumText(value))
                },
                directory
            );
            if (
                metadataValue.checksum !== undefined &&
                metadataValue.checksum !== actual
            )
            {
                return yield* Effect.fail(
                    new SkillValidationError({
                        diagnostics: [
                            "product skill checksum does not match its manifest"
                        ],
                        directory
                    })
                );
            }
        }
    });
/** @internal */
export class SkillInstaller extends Context.Service<
    SkillInstaller,
    {
        readonly listAvailable: () => ReadonlyArray<SkillDefinition>;
        readonly listInstalled: (
            options?: SkillInstallOptions
        ) => Effect.Effect<ReadonlyArray<InstalledSkill>, SkillError>;
        readonly install: (
            name: string,
            options?: SkillInstallOptions
        ) => Effect.Effect<
            InstalledSkill,
            | SkillError
            | SkillNotFoundError
            | SkillCollisionError
            | SkillValidationError
        >;
        readonly installFrom: (
            source: string,
            options?: SkillInstallOptions
        ) => Effect.Effect<
            InstalledSkill,
            SkillError | SkillCollisionError | SkillValidationError
        >;
        readonly update: (
            name: string,
            options?: SkillInstallOptions
        ) => Effect.Effect<
            InstalledSkill,
            | SkillError
            | SkillNotFoundError
            | SkillNotManagedError
            | SkillCollisionError
            | SkillValidationError
        >;
        readonly uninstall: (
            name: string,
            options?: SkillInstallOptions
        ) => Effect.Effect<void, SkillError | SkillNotManagedError>;
    }
>()("sorrell/docs-skills/SkillInstaller")
{
    static readonly layer: Layer.Layer<SkillInstaller, never, never> =
        Layer.effect(
            SkillInstaller,
            Effect.gen(function* ()
            {
                const catalog = yield* SkillCatalog;
                const fileSystem: FileSystemApi = yield* DocsFileSystem;
                const path: PathApi = yield* DocsPath;
                const atomicWriter = yield* AtomicWriter;
                const checksum: ChecksumApi = yield* ChecksumService;
                const archive = yield* ArchiveService;
                const defaultHome =
                    process.env.USERPROFILE ??
                    process.env.HOME ??
                    process.cwd();
                const resolveRoot = (options?: SkillInstallOptions): string =>
                {
                    const agent = options?.agent ?? "codex";
                    const scope = options?.scope ?? "project";
                    if (scope === "project")
                    {
                        return path.join(
                            path.resolve(options?.projectDirectory ?? "."),
                            agent === "codex" ? ".codex" : ".claude",
                            "skills"
                        );
                    }
                    const home = options?.homeDirectory ?? defaultHome;
                    const base =
                        agent === "codex"
                            ? (options?.codexHome ??
                              process.env.CODEX_HOME ??
                              home)
                            : path.join(home, ".claude");
                    return path.join(base, "skills");
                };
                const normalized = (
                    options?: SkillInstallOptions
                ): Required<Pick<SkillInstallOptions, "agent" | "scope">> => ({
                    agent: options?.agent ?? "codex",
                    scope: options?.scope ?? "project"
                });
                const readRegistry = (
                    root: string
                ): Effect.Effect<SkillRegistry, SkillError> =>
                    Effect.gen(function* ()
                    {
                        const file = path.join(root, registryFileName);
                        const exists = yield* fileSystem
                            .exists(file)
                            .pipe(
                                Effect.mapError((cause: DocsFileSystemError) =>
                                    error("exists", file, cause)
                                )
                            );
                        if (!exists)
                        {
                            return { installations: [], version: 1 };
                        }
                        return yield* readText(
                            fileSystem,
                            file,
                            "readRegistry"
                        ).pipe(
                            Effect.flatMap((text: string) =>
                                parse<SkillRegistry>(
                                    text,
                                    file,
                                    "parseRegistry"
                                )
                            )
                        );
                    });
                const writeRegistry = (root: string, registry: SkillRegistry) =>
                    ensureDirectory(fileSystem, root).pipe(
                        Effect.flatMap(() =>
                            atomicWriter
                                .writeText(
                                    path.join(root, registryFileName),
                                    `${JSON.stringify(registry, null, 2)}\n`
                                )
                                .pipe(
                                    Effect.mapError(
                                        (cause: DocsAtomicWriteError) =>
                                            error(
                                                "writeRegistry",
                                                path.join(
                                                    root,
                                                    registryFileName
                                                ),
                                                cause
                                            )
                                    )
                                )
                        )
                    );
                const marker = (
                    directory: string
                ): Effect.Effect<SkillMarker | undefined, SkillError> =>
                {
                    const file = path.join(directory, markerFileName);
                    return fileSystem.exists(file).pipe(
                        Effect.mapError((cause: DocsFileSystemError) =>
                            error("exists", file, cause)
                        ),
                        Effect.flatMap((exists: boolean) =>
                            exists
                                ? readText(fileSystem, file, "readMarker").pipe(
                                    Effect.flatMap((text: string) =>
                                        parse<SkillMarker>(
                                            text,
                                            file,
                                            "parseMarker"
                                        )
                                    )
                                )
                                : Effect.succeed(undefined)
                        )
                    );
                };
                const managed = (directory: string, name: string) =>
                    marker(directory).pipe(
                        Effect.flatMap((value: SkillMarker | undefined) =>
                            value?.managedBy === managedBy &&
                            value.name === name
                                ? Effect.succeed(value)
                                : Effect.fail(
                                    new SkillNotManagedError({
                                        directory,
                                        name
                                    })
                                )
                        )
                    );
                const writeFiles = (
                    source: string,
                    target: string
                ): Effect.Effect<void, SkillError> =>
                    Effect.gen(function* ()
                    {
                        const files = yield* relativeFiles(
                            fileSystem,
                            path,
                            source
                        );
                        for (const file of files)
                        {
                            const sourceFile = path.join(source, file);
                            const targetFile = path.join(target, file);
                            yield* ensureDirectory(
                                fileSystem,
                                path.dirname(targetFile)
                            );
                            const content = yield* readText(
                                fileSystem,
                                sourceFile,
                                "readSkillFile"
                            );
                            yield* fileSystem
                                .writeText(targetFile, content)
                                .pipe(
                                    Effect.mapError(
                                        (cause: DocsFileSystemError) =>
                                            error(
                                                "writeSkillFile",
                                                targetFile,
                                                cause
                                            )
                                    )
                                );
                        }
                    });
                const installDirectory = (
                    definition: SkillDefinition,
                    source: string,
                    options?: SkillInstallOptions
                ): Effect.Effect<
                    InstalledSkill,
                    SkillError | SkillCollisionError | SkillValidationError
                > =>
                    Effect.gen(function* ()
                    {
                        yield* validateDirectory(
                            fileSystem,
                            path,
                            definition,
                            source
                        );
                        const root = resolveRoot(options);
                        const target = path.join(root, definition.name);
                        const targetExists = yield* fileSystem
                            .exists(target)
                            .pipe(
                                Effect.mapError((cause: DocsFileSystemError) =>
                                    error("exists", target, cause)
                                )
                            );
                        if (targetExists)
                        {
                            yield* managed(target, definition.name).pipe(
                                Effect.mapError(
                                    (
                                        cause:
                                            | SkillError
                                            | SkillNotManagedError
                                    ) =>
                                        cause instanceof SkillNotManagedError
                                            ? new SkillCollisionError({
                                                directory: target,
                                                name: definition.name
                                            })
                                            : cause
                                )
                            );
                            yield* fileSystem
                                .remove(target, { recursive: true })
                                .pipe(
                                    Effect.mapError(
                                        (cause: DocsFileSystemError) =>
                                            error(
                                                "removeManagedSkill",
                                                target,
                                                cause
                                            )
                                    )
                                );
                        }
                        yield* ensureDirectory(fileSystem, root);
                        yield* writeFiles(source, target);
                        const installedAt = new Date().toISOString();
                        const value = yield* contentChecksum(
                            fileSystem,
                            path,
                            checksum,
                            source
                        );
                        const installMarker: SkillMarker = {
                            checksum: value,
                            installedAt,
                            managedBy,
                            name: definition.name,
                            version: 1
                        };
                        yield* atomicWriter
                            .writeText(
                                path.join(target, markerFileName),
                                `${JSON.stringify(installMarker, null, 2)}\n`
                            )
                            .pipe(
                                Effect.mapError((cause: DocsAtomicWriteError) =>
                                    error("writeMarker", target, cause)
                                )
                            );
                        const registry = yield* readRegistry(root);
                        const installations = [
                            ...registry.installations.filter(
                                (entry: SkillRegistryEntry) =>
                                    entry.name !== definition.name
                            ),
                            {
                                checksum: value,
                                installedAt,
                                name: definition.name
                            }
                        ];
                        yield* writeRegistry(root, {
                            installations: installations.sort(
                                (
                                    left: SkillRegistryEntry,
                                    right: SkillRegistryEntry
                                ) => left.name.localeCompare(right.name)
                            ),
                            version: 1
                        });
                        const selection = normalized(options);
                        return {
                            ...definition,
                            agent: selection.agent,
                            checksum: value,
                            directory: target,
                            installedAt,
                            scope: selection.scope
                        } satisfies InstalledSkill;
                    });
                const install = (name: string, options?: SkillInstallOptions) =>
                    Effect.gen(function* ()
                    {
                        const definition = catalog.find(name);
                        if (definition === undefined)
                        {
                            return yield* Effect.fail(
                                new SkillNotFoundError({ name })
                            );
                        }
                        return yield* installDirectory(
                            definition,
                            path.join(catalog.root, definition.directory),
                            options
                        );
                    });
                const installFrom = (
                    source: string,
                    options?: SkillInstallOptions
                ): Effect.Effect<
                    InstalledSkill,
                    SkillError | SkillCollisionError | SkillValidationError
                > =>
                    Effect.scoped(
                        Effect.gen(function* ()
                        {
                            const external = /^https?:\/\//u.test(source);
                            const temporaryDirectory = external
                                ? yield* fileSystem
                                    .makeTempDirectoryScoped({
                                        prefix: "sorrell-product-skill-"
                                    })
                                    .pipe(
                                        Effect.mapError(
                                            (cause: DocsFileSystemError) =>
                                                error(
                                                    "makeTempDirectory",
                                                    source,
                                                    cause
                                                )
                                        )
                                    )
                                : source;
                            let directory = source;
                            if (external)
                            {
                                const response = yield* Effect.tryPromise({
                                    catch: (cause: unknown) =>
                                        error("downloadSkill", source, cause),
                                    try: async () =>
                                    {
                                        const value = await fetch(source);
                                        if (!value.ok)
                                        {
                                            throw new Error(
                                                `skill archive request failed with ${value.status}`
                                            );
                                        }
                                        return new Uint8Array(
                                            await value.arrayBuffer()
                                        );
                                    }
                                });
                                const archivePath = yield* fileSystem
                                    .makeTempFileScoped({
                                        prefix: "sorrell-product-skill-",
                                        suffix: ".zip"
                                    })
                                    .pipe(
                                        Effect.mapError(
                                            (cause: DocsFileSystemError) =>
                                                error(
                                                    "makeTempFile",
                                                    source,
                                                    cause
                                                )
                                        )
                                    );
                                yield* fileSystem
                                    .writeBytes(archivePath, response)
                                    .pipe(
                                        Effect.mapError(
                                            (cause: DocsFileSystemError) =>
                                                error(
                                                    "writeSkillArchive",
                                                    archivePath,
                                                    cause
                                                )
                                        )
                                    );
                                yield* archive
                                    .extractZip(archivePath, temporaryDirectory)
                                    .pipe(
                                        Effect.mapError(
                                            (cause: DocsArchiveError) =>
                                                error(
                                                    "extractSkillArchive",
                                                    archivePath,
                                                    cause
                                                )
                                        )
                                    );
                                directory = temporaryDirectory;
                            }
                            const content = yield* readText(
                                fileSystem,
                                path.join(directory, "SKILL.md"),
                                "readProductSkill"
                            );
                            const name = content
                                .match(/^name:\s*([^\r\n]+)$/mu)?.[1]
                                ?.trim();
                            const description =
                                content
                                    .match(/^description:\s*([^\r\n]+)$/mu)?.[1]
                                    ?.trim() ??
                                "Generated product documentation skill.";
                            if (
                                name === undefined ||
                                !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(name)
                            )
                            {
                                return yield* Effect.fail(
                                    new SkillValidationError({
                                        diagnostics: [
                                            "product skill name must be kebab-case"
                                        ],
                                        directory
                                    })
                                );
                            }
                            const definition: SkillDefinition = {
                                description,
                                directory,
                                name
                            };
                            return yield* installDirectory(
                                definition,
                                directory,
                                options
                            );
                        })
                    );
                const listInstalled = (options?: SkillInstallOptions) =>
                    Effect.gen(function* ()
                    {
                        const root = resolveRoot(options);
                        const rootExists = yield* fileSystem
                            .exists(root)
                            .pipe(
                                Effect.mapError((cause: DocsFileSystemError) =>
                                    error("exists", root, cause)
                                )
                            );
                        if (!rootExists)
                        {
                            return [] as ReadonlyArray<InstalledSkill>;
                        }
                        const entries = yield* fileSystem
                            .readDirectory(root)
                            .pipe(
                                Effect.mapError((cause: DocsFileSystemError) =>
                                    error("readInstalled", root, cause)
                                )
                            );
                        const selection = normalized(options);
                        const result: Array<InstalledSkill> = [];
                        for (const entry of [ ...entries ].sort())
                        {
                            const definition = catalog.find(entry);
                            if (definition === undefined)
                            {
                                continue;
                            }
                            const directory = path.join(root, entry);
                            const value = yield* marker(directory);
                            if (
                                value?.managedBy === managedBy &&
                                value.name === entry
                            )
                            {
                                result.push({
                                    ...definition,
                                    agent: selection.agent,
                                    checksum: value.checksum,
                                    directory,
                                    installedAt: value.installedAt,
                                    scope: selection.scope
                                });
                            }
                        }
                        return result;
                    });
                const update = (name: string, options?: SkillInstallOptions) =>
                    Effect.gen(function* ()
                    {
                        const root = resolveRoot(options);
                        yield* managed(path.join(root, name), name);
                        return yield* install(name, options);
                    });
                const uninstall = (
                    name: string,
                    options?: SkillInstallOptions
                ) =>
                    Effect.gen(function* ()
                    {
                        const root = resolveRoot(options);
                        const target = path.join(root, name);
                        yield* managed(target, name);
                        yield* fileSystem
                            .remove(target, { recursive: true })
                            .pipe(
                                Effect.mapError((cause: DocsFileSystemError) =>
                                    error("uninstall", target, cause)
                                )
                            );
                        const registry = yield* readRegistry(root);
                        yield* writeRegistry(root, {
                            installations: registry.installations.filter(
                                (entry: SkillRegistryEntry) =>
                                    entry.name !== name
                            ),
                            version: 1
                        });
                    });
                return SkillInstaller.of({
                    install,
                    installFrom,
                    listAvailable: catalog.list,
                    listInstalled,
                    uninstall,
                    update
                });
            })
        ).pipe(
            Layer.provide(
                Layer.mergeAll(
                    SkillCatalog.layer,
                    DocsFileSystem.layer,
                    DocsPath.layer,
                    AtomicWriter.layer,
                    ChecksumService.layer,
                    ArchiveService.layer
                )
            )
        );
}
export/** @internal */
const skillsLayer = SkillInstaller.layer;
