/**
 *
 *
 * @module @sorrell/docs-cli/Workspace
 *
 * @file      Workspace.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** @module @sorrell/docs-cli/Workspace */

import { Context, Effect, Layer } from "effect";
import { DocsPath, DocsFileSystem } from "./services.js";
import { DocsWorkspaceError, type DocsFileSystemError } from "./errors.js";

export interface WorkspacePackage {
    readonly name: string;
    readonly version: string | undefined;
    readonly directory: string;
    readonly private: boolean;
    readonly manifest: Readonly<Record<string, unknown>>;
}

export interface WorkspaceDescription {
    readonly root: string;
    readonly packageManager: string | undefined;
    readonly packages: ReadonlyArray<WorkspacePackage>;
}

interface WorkspaceManifest {
    readonly name?: unknown;
    readonly version?: unknown;
    readonly private?: unknown;
    readonly packageManager?: unknown;
    readonly workspaces?: unknown;
}

const packagePatterns = (workspaces: unknown): ReadonlyArray<string> => {
    if (Array.isArray(workspaces)) {return workspaces.filter((value): value is string => typeof value === "string");}
    if (typeof workspaces === "object" && workspaces !== null && "packages" in workspaces) {
        const packages = (workspaces as { readonly packages?: unknown }).packages;
        return Array.isArray(packages) ? packages.filter((value): value is string => typeof value === "string") : [];
    }
    return [];
};

interface WorkspaceFileSystem {
    readonly readText: (path: string) => Effect.Effect<string, DocsFileSystemError>;
}

const readManifest = (fileSystem: WorkspaceFileSystem, path: string): Effect.Effect<WorkspaceManifest, DocsWorkspaceError> =>
    fileSystem.readText(path).pipe(
        Effect.flatMap((text) => Effect.try({
            try: () => JSON.parse(text) as WorkspaceManifest,
            catch: (cause) => new DocsWorkspaceError({ operation: "parseManifest", path, cause })
        })),
        Effect.mapError((cause) => cause instanceof DocsWorkspaceError
            ? cause
            : new DocsWorkspaceError({ operation: "readManifest", path, cause }))
    );

const packageFromManifest = (directory: string, manifest: WorkspaceManifest): WorkspacePackage | undefined => {
    if (typeof manifest.name !== "string") {return undefined;}
    return {
        name: manifest.name,
        version: typeof manifest.version === "string" ? manifest.version : undefined,
        directory,
        private: manifest.private === true,
        manifest: manifest as Readonly<Record<string, unknown>>
    };
};

export class WorkspaceDiscovery extends Context.Service<WorkspaceDiscovery, {
    readonly discover: (root: string) => Effect.Effect<WorkspaceDescription, DocsWorkspaceError>;
}>()("sorrell/docs-cli/WorkspaceDiscovery") {
    static readonly layer = Layer.effect(
        WorkspaceDiscovery,
        Effect.gen(function*() {
            const fileSystem = yield* DocsFileSystem;
            const path = yield* DocsPath;
            const discover = (root: string) => Effect.gen(function*() {
                const resolvedRoot = path.resolve(root);
                const rootManifestPath = path.join(resolvedRoot, "package.json");
                const rootManifest = yield* readManifest(fileSystem, rootManifestPath);
                const packages: Array<WorkspacePackage> = [];
                for (const pattern of packagePatterns(rootManifest.workspaces)) {
                    if (!pattern.endsWith("/*")) {continue;}
                    const parent = path.join(resolvedRoot, pattern.slice(0, -2));
                    const entries = yield* fileSystem.readDirectory(parent).pipe(
                        Effect.mapError((cause) => new DocsWorkspaceError({ operation: "readWorkspace", path: parent, cause }))
                    );
                    for (const entry of [ ...entries ].sort()) {
                        const directory = path.join(parent, entry);
                        const manifestPath = path.join(directory, "package.json");
                        if (!(yield* fileSystem.exists(manifestPath))) {continue;}
                        const manifest = yield* readManifest(fileSystem, manifestPath);
                        const packageValue = packageFromManifest(directory, manifest);
                        if (packageValue !== undefined) {packages.push(packageValue);}
                    }
                }
                return {
                    root: resolvedRoot,
                    packageManager: typeof rootManifest.packageManager === "string" ? rootManifest.packageManager : undefined,
                    packages: packages.sort((left, right) => left.name.localeCompare(right.name))
                };
            }).pipe(Effect.mapError((cause) => cause instanceof DocsWorkspaceError
                ? cause
                : new DocsWorkspaceError({ operation: "discover", path: root, cause })));
            return WorkspaceDiscovery.of({ discover });
        })
    ).pipe(Layer.provide(Layer.mergeAll(DocsFileSystem.layer, DocsPath.layer)));
}
