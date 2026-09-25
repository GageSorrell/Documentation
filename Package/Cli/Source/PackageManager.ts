/**
 *
 *
 * @module @sorrell/docs-cli/PackageManager
 *
 * @file      PackageManager.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { dirname, join } from "node:path";
import { Context, Effect, Layer } from "effect";
import { DocsFileSystem, DocsPath } from "./services.js";
import type { DocsFileSystemError } from "./errors.js";

/** @internal */
export type PackageManagerName =
    | "npm"
    | "pnpm"
    | "yarn"
    | "bun";

/** @internal */
export interface PackageManagerInfo
{
    readonly name: PackageManagerName;
    readonly executable: string;
    readonly installArguments: ReadonlyArray<string>;
    readonly runArguments: (
        script: string,
        args?: ReadonlyArray<string>
    ) => ReadonlyArray<string>;
}
const managers: Readonly<Record<PackageManagerName, PackageManagerInfo>> = {
    bun:
    {
        executable: "bun",
        installArguments: [ "install" ],
        name: "bun",
        runArguments: (
            script: string,
            args: ReadonlyArray<string> | undefined = []
        ) => [ "run", script, ...args ]
    },
    npm:
    {
        executable: process.platform === "win32" ? process.execPath : "npm",
        installArguments:
            process.platform === "win32"
                ? [
                    process.env.npm_execpath ??
                        join(
                            dirname(process.execPath),
                            "node_modules",
                            "npm",
                            "bin",
                            "npm-cli.js"
                        ),
                    "install"
                ]
                : [ "install" ],
        name: "npm",
        runArguments: (
            script: string,
            args: ReadonlyArray<string> | undefined = []
        ) =>
            process.platform === "win32"
                ? [
                    process.env.npm_execpath ??
                        join(
                            dirname(process.execPath),
                            "node_modules",
                            "npm",
                            "bin",
                            "npm-cli.js"
                        ),
                    "run",
                    script,
                    ...(args.length > 0 ? [ "--", ...args ] : [])
                ]
                : [
                    "run",
                    script,
                    ...(args.length > 0 ? [ "--", ...args ] : [])
                ]
    },
    pnpm:
    {
        executable: "pnpm",
        installArguments: [ "install" ],
        name: "pnpm",
        runArguments: (
            script: string,
            args: ReadonlyArray<string> | undefined = [ ]
        ) => [ "run", script, ...args ]
    },
    yarn:
    {
        executable: "yarn",
        installArguments: [ "install" ],
        name: "yarn",
        runArguments: (
            script: string,
            args: ReadonlyArray<string> | undefined = [ ]
        ) => [ script, ...args ]
    }
};

export/** @internal */
const packageManagerInfo = (
    name: PackageManagerName
): PackageManagerInfo => managers[name];

export/** @internal */
const selectPackageManager = (
    packageManager: string | undefined,
    lockfiles: ReadonlyArray<string>
): PackageManagerInfo =>
{
    const requested = packageManager?.split("@")[0];
    if (
        requested === "npm" ||
        requested === "pnpm" ||
        requested === "yarn" ||
        requested === "bun"
    )
    {
        return managers[requested];
    }
    if (lockfiles.includes("pnpm-lock.yaml"))
    {
        return managers.pnpm;
    }
    if (lockfiles.includes("yarn.lock"))
    {
        return managers.yarn;
    }
    if (lockfiles.includes("bun.lockb") || lockfiles.includes("bun.lock"))
    {
        return managers.bun;
    }
    return managers.npm;
};

/** @internal */
export class PackageManagerSelection extends Context.Service<
    PackageManagerSelection,
    {
        readonly select: (
            root: string,
            packageManager?: string
        ) => Effect.Effect<PackageManagerInfo, DocsFileSystemError>;
    }
>()("sorrell/docs-cli/PackageManagerSelection")
{
    static readonly layer: Layer.Layer<PackageManagerSelection, never, never> =
        Layer.effect(
            PackageManagerSelection,
            Effect.gen(function* ()
            {
                const fileSystem = yield* DocsFileSystem;
                const path = yield* DocsPath;
                return PackageManagerSelection.of({
                    select: (
                        root: string,
                        packageManager: string | undefined
                    ) =>
                        Effect.gen(function* ()
                        {
                            const files = yield* fileSystem.readDirectory(
                                path.resolve(root)
                            );
                            return selectPackageManager(packageManager, files);
                        })
                });
            })
        ).pipe(
            Layer.provide(Layer.mergeAll(DocsFileSystem.layer, DocsPath.layer))
        );
}
