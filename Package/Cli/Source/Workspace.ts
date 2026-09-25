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

import { Context, Effect, Layer } from "effect";
import { DocsFileSystem, DocsPath } from "./services.js";
import { type DocsFileSystemError, DocsWorkspaceError } from "./errors.js";

/** @internal */
export interface WorkspacePackage
{
    readonly name: string;
    readonly version: string | undefined;
    readonly directory: string;
    readonly private: boolean;
    readonly manifest: Readonly<Record<string, unknown>>;
}

/** @internal */
export interface WorkspaceDescription
{
    readonly root: string;
    readonly packageManager: string | undefined;
    readonly packages: ReadonlyArray<WorkspacePackage>;
}

interface WorkspaceManifest
{
    readonly name?: unknown;
    readonly version?: unknown;
    readonly private?: unknown;
    readonly packageManager?: unknown;
    readonly workspaces?: unknown;
}
const packagePatterns = (workspaces: unknown): ReadonlyArray<string> =>
{
    if (Array.isArray(workspaces))
    {
        return workspaces.filter(
            (value: any): value is string => typeof value === "string"
        );
    }

    if (
        typeof workspaces === "object" &&
        workspaces !== null &&
        "packages" in workspaces
    )
    {
        const packages = (
            workspaces as {
                readonly packages?: unknown;
            }
        ).packages;
        return Array.isArray(packages)
            ? packages.filter(
                (value: any): value is string => typeof value === "string"
            )
            : [ ];
    }

    return [ ];
};

interface WorkspaceFileSystem
{
    readonly readText: (
        path: string
    ) => Effect.Effect<string, DocsFileSystemError>;
}

const readManifest = (
    fileSystem: WorkspaceFileSystem,
    path: string
): Effect.Effect<WorkspaceManifest, DocsWorkspaceError> =>
    fileSystem.readText(path).pipe(
        Effect.flatMap((text: string) =>
            Effect.try({
                catch: (cause: unknown) =>
                    new DocsWorkspaceError({
                        cause,
                        operation: "parseManifest",
                        path
                    }),
                try: () => JSON.parse(text) as WorkspaceManifest
            })
        ),
        Effect.mapError((cause: DocsFileSystemError | DocsWorkspaceError) =>
            cause instanceof DocsWorkspaceError
                ? cause
                : new DocsWorkspaceError({
                    cause,
                    operation: "readManifest",
                    path
                })
        )
    );

const packageFromManifest = (
    directory: string,
    manifest: WorkspaceManifest
): WorkspacePackage | undefined =>
{
    if (typeof manifest.name !== "string")
    {
        return undefined;
    }
    return {
        directory,
        manifest: manifest as Readonly<Record<string, unknown>>,
        name: manifest.name,
        private: manifest.private === true,
        version:
            typeof manifest.version === "string" ? manifest.version : undefined
    };
};

/** @internal */
export class WorkspaceDiscovery extends Context.Service<
    WorkspaceDiscovery,
    {
        readonly discover: (
            root: string
        ) => Effect.Effect<WorkspaceDescription, DocsWorkspaceError>;
    }
>()("sorrell/docs-cli/WorkspaceDiscovery")
{
    static readonly layer: Layer.Layer<WorkspaceDiscovery, never, never> =
        Layer.effect(
            WorkspaceDiscovery,
            Effect.gen(function* ()
            {
                const fileSystem = yield* DocsFileSystem;
                const path = yield* DocsPath;
                const discover = (root: string) =>
                    Effect.gen(function* ()
                    {
                        const resolvedRoot = path.resolve(root);
                        const rootManifestPath = path.join(
                            resolvedRoot,
                            "package.json"
                        );
                        const rootManifest = yield* readManifest(
                            fileSystem,
                            rootManifestPath
                        );
                        const packages: Array<WorkspacePackage> = [ ];
                        for (const pattern of packagePatterns(
                            rootManifest.workspaces
                        ))
                        {
                            if (!pattern.endsWith("/*"))
                            {
                                continue;
                            }
                            const parent = path.join(
                                resolvedRoot,
                                pattern.slice(0, -2)
                            );
                            const entries = yield* fileSystem
                                .readDirectory(parent)
                                .pipe(
                                    Effect.mapError(
                                        (cause: DocsFileSystemError) =>
                                            new DocsWorkspaceError({
                                                cause,
                                                operation: "readWorkspace",
                                                path: parent
                                            })
                                    )
                                );
                            for (const entry of [ ...entries ].sort())
                            {
                                const directory = path.join(parent, entry);
                                const manifestPath = path.join(
                                    directory,
                                    "package.json"
                                );
                                if (!(yield* fileSystem.exists(manifestPath)))
                                {
                                    continue;
                                }
                                const manifest = yield* readManifest(
                                    fileSystem,
                                    manifestPath
                                );
                                const packageValue = packageFromManifest(
                                    directory,
                                    manifest
                                );
                                if (packageValue !== undefined)
                                {
                                    packages.push(packageValue);
                                }
                            }
                        }
                        return {
                            packageManager:
                                typeof rootManifest.packageManager === "string"
                                    ? rootManifest.packageManager
                                    : undefined,
                            packages: packages.sort(
                                (
                                    left: WorkspacePackage,
                                    right: WorkspacePackage
                                ) => left.name.localeCompare(right.name)
                            ),
                            root: resolvedRoot
                        };
                    }).pipe(
                        Effect.mapError(
                            (cause: DocsFileSystemError | DocsWorkspaceError) =>
                                cause instanceof DocsWorkspaceError
                                    ? cause
                                    : new DocsWorkspaceError({
                                        cause,
                                        operation: "discover",
                                        path: root
                                    })
                        )
                    );

                return WorkspaceDiscovery.of({ discover });
            })
        ).pipe(
            Layer.provide(Layer.mergeAll(DocsFileSystem.layer, DocsPath.layer))
        );
}
