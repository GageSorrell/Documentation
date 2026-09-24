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

import { Context, Effect, Layer } from "effect";
import {
    AtomicWriter,
    ChecksumService,
    DocsFileSystem,
    DocsPath,
    type DocsFileSystemError
} from "@sorrell/docs-cli";
import { SkillCatalog } from "./Catalog.js";
import { SkillCollisionError, SkillError, SkillNotFoundError, SkillNotManagedError, SkillValidationError } from "./Errors.js";
import type { InstalledSkill, SkillDefinition, SkillInstallOptions, SkillRegistryEntry } from "./Types.js";

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

const error = (operation: string, path: string, cause?: unknown): SkillError => new SkillError({ operation, path, cause });

interface FileSystemApi {
    readonly exists: (path: string) => Effect.Effect<boolean, DocsFileSystemError>;
    readonly isDirectory: (path: string) => Effect.Effect<boolean, DocsFileSystemError>;
    readonly makeDirectory: (path: string) => Effect.Effect<void, DocsFileSystemError>;
    readonly readDirectory: (path: string) => Effect.Effect<ReadonlyArray<string>, DocsFileSystemError>;
    readonly readText: (path: string) => Effect.Effect<string, DocsFileSystemError>;
    readonly remove: (path: string, options?: { readonly recursive?: boolean }) => Effect.Effect<void, DocsFileSystemError>;
    readonly writeText: (path: string, content: string) => Effect.Effect<void, DocsFileSystemError>;
}

interface PathApi {
    readonly dirname: (path: string) => string;
    readonly join: (...paths: ReadonlyArray<string>) => string;
    readonly resolve: (...paths: ReadonlyArray<string>) => string;
}

interface ChecksumApi {
    readonly text: (value: string) => Effect.Effect<string>;
}

const parse = <Value>(text: string, path: string, operation: string): Effect.Effect<Value, SkillError> => Effect.try({
    try: () => JSON.parse(text) as Value,
    catch: (cause) => error(operation, path, cause)
});

const readText = (fileSystem: FileSystemApi, path: string, operation: string): Effect.Effect<string, SkillError> =>
    fileSystem.readText(path).pipe(Effect.mapError((cause: DocsFileSystemError) => error(operation, path, cause)));

const ensureDirectory = (fileSystem: FileSystemApi, path: string) => fileSystem.makeDirectory(path).pipe(
    Effect.mapError((cause: DocsFileSystemError) => error("makeDirectory", path, cause))
);

const relativeFiles = (
    fileSystem: FileSystemApi,
    path: PathApi,
    directory: string,
    prefix = ""
): Effect.Effect<ReadonlyArray<string>, SkillError> => Effect.gen(function*() {
    const entries = yield* fileSystem.readDirectory(directory).pipe(Effect.mapError((cause: DocsFileSystemError) => error("readDirectory", directory, cause)));
    const files: Array<string> = [];
    for (const entry of [ ...entries ].sort()) {
        const fullPath = path.join(directory, entry);
        const relative = prefix === "" ? entry : path.join(prefix, entry);
        const directoryEntry = yield* fileSystem.isDirectory(fullPath).pipe(Effect.mapError((cause: DocsFileSystemError) => error("isDirectory", fullPath, cause)));
        if (directoryEntry) {
            files.push(...yield* relativeFiles(fileSystem, path, fullPath, relative));
        } else {
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
): Effect.Effect<string, SkillError> => Effect.gen(function*() {
    const files = yield* relativeFiles(fileSystem, path, directory);
    const parts: Array<string> = [];
    for (const file of files) {
        const content = yield* readText(fileSystem, path.join(directory, file), "readSkillFile");
        parts.push(`${file}\0${content}`);
    }
    return yield* checksum.text(parts.join("\0"));
});

const validateDirectory = (
    fileSystem: FileSystemApi,
    path: PathApi,
    definition: SkillDefinition,
    directory: string
): Effect.Effect<void, SkillValidationError | SkillError> => Effect.gen(function*() {
    const skillReadMe = path.join(directory, "SKILL.md");
    const metadata = path.join(directory, "agents", "openai.yaml");
    const readMeExists = yield* fileSystem.exists(skillReadMe).pipe(Effect.mapError((cause: DocsFileSystemError) => error("exists", skillReadMe, cause)));
    if (!readMeExists) {
        return yield* Effect.fail(new SkillValidationError({ directory, diagnostics: [ "SKILL.md is missing" ] }));
    }
    const metadataExists = yield* fileSystem.exists(metadata).pipe(Effect.mapError((cause: DocsFileSystemError) => error("exists", metadata, cause)));
    if (!metadataExists) {
        return yield* Effect.fail(new SkillValidationError({ directory, diagnostics: [ "agents/openai.yaml is missing" ] }));
    }
    const content = yield* readText(fileSystem, skillReadMe, "validateSkill");
    const diagnostics: Array<string> = [];
    if (!content.startsWith("---\n") || !content.includes(`name: ${definition.name}`)) {
        diagnostics.push(`SKILL.md frontmatter name must be ${definition.name}`);
    }
    if (/\b(?:TODO|TBD|FIXME)\b|\{\{[^}]+\}\}|<PLACEHOLDER>/i.test(content)) {
        diagnostics.push("SKILL.md contains an unfinished placeholder");
    }
    if (diagnostics.length > 0) {
        return yield* Effect.fail(new SkillValidationError({ directory, diagnostics }));
    }
});

export class SkillInstaller extends Context.Service<SkillInstaller, {
    readonly listAvailable: () => ReadonlyArray<SkillDefinition>;
    readonly listInstalled: (options?: SkillInstallOptions) => Effect.Effect<ReadonlyArray<InstalledSkill>, SkillError>;
    readonly install: (name: string, options?: SkillInstallOptions) => Effect.Effect<InstalledSkill, SkillError | SkillNotFoundError | SkillCollisionError | SkillValidationError>;
    readonly update: (name: string, options?: SkillInstallOptions) => Effect.Effect<InstalledSkill, SkillError | SkillNotFoundError | SkillNotManagedError | SkillCollisionError | SkillValidationError>;
    readonly uninstall: (name: string, options?: SkillInstallOptions) => Effect.Effect<void, SkillError | SkillNotManagedError>;
}>()("sorrell/docs-skills/SkillInstaller") {
    static readonly layer = Layer.effect(
        SkillInstaller,
        Effect.gen(function*() {
            const catalog = yield* SkillCatalog;
            const fileSystem: FileSystemApi = yield* DocsFileSystem;
            const path: PathApi = yield* DocsPath;
            const atomicWriter = yield* AtomicWriter;
            const checksum: ChecksumApi = yield* ChecksumService;

            const defaultHome = process.env.USERPROFILE ?? process.env.HOME ?? process.cwd();
            const resolveRoot = (options?: SkillInstallOptions): string => {
                const agent = options?.agent ?? "codex";
                const scope = options?.scope ?? "project";
                if (scope === "project") {
                    return path.join(path.resolve(options?.projectDirectory ?? "."), agent === "codex" ? ".codex" : ".claude", "skills");
                }
                const home = options?.homeDirectory ?? defaultHome;
                const base = agent === "codex" ? options?.codexHome ?? process.env.CODEX_HOME ?? home : path.join(home, ".claude");
                return path.join(base, "skills");
            };
            const normalized = (options?: SkillInstallOptions): Required<Pick<SkillInstallOptions, "agent" | "scope">> => ({
                agent: options?.agent ?? "codex",
                scope: options?.scope ?? "project"
            });
            const readRegistry = (root: string): Effect.Effect<SkillRegistry, SkillError> => Effect.gen(function*() {
                const file = path.join(root, registryFileName);
                const exists = yield* fileSystem.exists(file).pipe(Effect.mapError((cause: DocsFileSystemError) => error("exists", file, cause)));
                if (!exists) {return { version: 1, installations: [] };}
                return yield* readText(fileSystem, file, "readRegistry").pipe(Effect.flatMap((text) => parse<SkillRegistry>(text, file, "parseRegistry")));
            });
            const writeRegistry = (root: string, registry: SkillRegistry) => ensureDirectory(fileSystem, root).pipe(
                Effect.flatMap(() => atomicWriter.writeText(path.join(root, registryFileName), `${JSON.stringify(registry, null, 2)}\n`).pipe(
                    Effect.mapError((cause) => error("writeRegistry", path.join(root, registryFileName), cause))
                ))
            );
            const marker = (directory: string): Effect.Effect<SkillMarker | undefined, SkillError> => {
                const file = path.join(directory, markerFileName);
                return fileSystem.exists(file).pipe(
                    Effect.mapError((cause: DocsFileSystemError) => error("exists", file, cause)),
                    Effect.flatMap((exists) => exists
                        ? readText(fileSystem, file, "readMarker").pipe(Effect.flatMap((text) => parse<SkillMarker>(text, file, "parseMarker")))
                        : Effect.succeed(undefined))
                );
            };
            const managed = (directory: string, name: string) => marker(directory).pipe(
                Effect.flatMap((value) => value?.managedBy === managedBy && value.name === name
                    ? Effect.succeed(value)
                    : Effect.fail(new SkillNotManagedError({ name, directory })))
            );
            const writeFiles = (source: string, target: string): Effect.Effect<void, SkillError> => Effect.gen(function*() {
                const files = yield* relativeFiles(fileSystem, path, source);
                for (const file of files) {
                    const sourceFile = path.join(source, file);
                    const targetFile = path.join(target, file);
                    yield* ensureDirectory(fileSystem, path.dirname(targetFile));
                    const content = yield* readText(fileSystem, sourceFile, "readSkillFile");
                    yield* fileSystem.writeText(targetFile, content).pipe(Effect.mapError((cause: DocsFileSystemError) => error("writeSkillFile", targetFile, cause)));
                }
            });
            const install = (name: string, options?: SkillInstallOptions) => Effect.gen(function*() {
                const definition = catalog.find(name);
                if (definition === undefined) {return yield* Effect.fail(new SkillNotFoundError({ name }));}
                const source = path.join(catalog.root, definition.directory);
                yield* validateDirectory(fileSystem, path, definition, source);
                const root = resolveRoot(options);
                const target = path.join(root, definition.name);
                const targetExists = yield* fileSystem.exists(target).pipe(Effect.mapError((cause: DocsFileSystemError) => error("exists", target, cause)));
                if (targetExists) {
                    yield* managed(target, name).pipe(Effect.mapError((cause) => cause instanceof SkillNotManagedError ? new SkillCollisionError({ name, directory: target }) : cause));
                    yield* fileSystem.remove(target, { recursive: true }).pipe(Effect.mapError((cause: DocsFileSystemError) => error("removeManagedSkill", target, cause)));
                }
                yield* ensureDirectory(fileSystem, root);
                yield* writeFiles(source, target);
                const installedAt = new Date().toISOString();
                const value = yield* contentChecksum(fileSystem, path, checksum, source);
                const installMarker: SkillMarker = { version: 1, managedBy, name, checksum: value, installedAt };
                yield* atomicWriter.writeText(path.join(target, markerFileName), `${JSON.stringify(installMarker, null, 2)}\n`).pipe(Effect.mapError((cause) => error("writeMarker", target, cause)));
                const registry = yield* readRegistry(root);
                const installations = [ ...registry.installations.filter((entry) => entry.name !== name), { name, checksum: value, installedAt } ];
                yield* writeRegistry(root, { version: 1, installations: installations.sort((left, right) => left.name.localeCompare(right.name)) });
                const selection = normalized(options);
                return { ...definition, agent: selection.agent, scope: selection.scope, directory: target, checksum: value, installedAt } satisfies InstalledSkill;
            });
            const listInstalled = (options?: SkillInstallOptions) => Effect.gen(function*() {
                const root = resolveRoot(options);
                const rootExists = yield* fileSystem.exists(root).pipe(Effect.mapError((cause: DocsFileSystemError) => error("exists", root, cause)));
                if (!rootExists) {return [] as ReadonlyArray<InstalledSkill>;}
                const entries = yield* fileSystem.readDirectory(root).pipe(Effect.mapError((cause: DocsFileSystemError) => error("readInstalled", root, cause)));
                const selection = normalized(options);
                const result: Array<InstalledSkill> = [];
                for (const entry of [ ...entries ].sort()) {
                    const definition = catalog.find(entry);
                    if (definition === undefined) {continue;}
                    const directory = path.join(root, entry);
                    const value = yield* marker(directory);
                    if (value?.managedBy === managedBy && value.name === entry) {
                        result.push({ ...definition, agent: selection.agent, scope: selection.scope, directory, checksum: value.checksum, installedAt: value.installedAt });
                    }
                }
                return result;
            });
            const update = (name: string, options?: SkillInstallOptions) => Effect.gen(function*() {
                const root = resolveRoot(options);
                yield* managed(path.join(root, name), name);
                return yield* install(name, options);
            });
            const uninstall = (name: string, options?: SkillInstallOptions) => Effect.gen(function*() {
                const root = resolveRoot(options);
                const target = path.join(root, name);
                yield* managed(target, name);
                yield* fileSystem.remove(target, { recursive: true }).pipe(Effect.mapError((cause: DocsFileSystemError) => error("uninstall", target, cause)));
                const registry = yield* readRegistry(root);
                yield* writeRegistry(root, { version: 1, installations: registry.installations.filter((entry) => entry.name !== name) });
            });

            return SkillInstaller.of({
                listAvailable: catalog.list,
                listInstalled,
                install,
                update,
                uninstall
            });
        })
    ).pipe(Layer.provide(Layer.mergeAll(
        SkillCatalog.layer,
        DocsFileSystem.layer,
        DocsPath.layer,
        AtomicWriter.layer,
        ChecksumService.layer
    )));
}

export const skillsLayer = SkillInstaller.layer;
