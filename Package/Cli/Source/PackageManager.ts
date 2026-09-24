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

/** @module @sorrell/docs-cli/PackageManager */

import { Context, Effect, Layer } from "effect";
import { DocsPath, DocsFileSystem } from "./services.js";
import type { DocsFileSystemError } from "./errors.js";

export type PackageManagerName = "npm" | "pnpm" | "yarn" | "bun";

export interface PackageManagerInfo {
    readonly name: PackageManagerName;
    readonly executable: string;
    readonly installArguments: ReadonlyArray<string>;
    readonly runArguments: (script: string, args?: ReadonlyArray<string>) => ReadonlyArray<string>;
}

const managers: Readonly<Record<PackageManagerName, PackageManagerInfo>> = {
    npm: { name: "npm", executable: "npm", installArguments: [ "install" ], runArguments: (script, args = []) => [ "run", script, ...(args.length > 0 ? [ "--", ...args ] : []) ] },
    pnpm: { name: "pnpm", executable: "pnpm", installArguments: [ "install" ], runArguments: (script, args = []) => [ "run", script, ...args ] },
    yarn: { name: "yarn", executable: "yarn", installArguments: [ "install" ], runArguments: (script, args = []) => [ script, ...args ] },
    bun: { name: "bun", executable: "bun", installArguments: [ "install" ], runArguments: (script, args = []) => [ "run", script, ...args ] }
};

export const packageManagerInfo = (name: PackageManagerName): PackageManagerInfo => managers[name];

export const selectPackageManager = (
    packageManager: string | undefined,
    lockfiles: ReadonlyArray<string>
): PackageManagerInfo => {
    const requested = packageManager?.split("@")[0];
    if (requested === "npm" || requested === "pnpm" || requested === "yarn" || requested === "bun") {return managers[requested];}
    if (lockfiles.includes("pnpm-lock.yaml")) {return managers.pnpm;}
    if (lockfiles.includes("yarn.lock")) {return managers.yarn;}
    if (lockfiles.includes("bun.lockb") || lockfiles.includes("bun.lock")) {return managers.bun;}
    return managers.npm;
};

export class PackageManagerSelection extends Context.Service<PackageManagerSelection, {
    readonly select: (root: string, packageManager?: string) => Effect.Effect<PackageManagerInfo, DocsFileSystemError>;
}>()("sorrell/docs-cli/PackageManagerSelection") {
    static readonly layer = Layer.effect(
        PackageManagerSelection,
        Effect.gen(function*() {
            const fileSystem = yield* DocsFileSystem;
            const path = yield* DocsPath;
            return PackageManagerSelection.of({
                select: (root, packageManager) => Effect.gen(function*() {
                    const files = yield* fileSystem.readDirectory(path.resolve(root));
                    return selectPackageManager(packageManager, files);
                })
            });
        })
    ).pipe(Layer.provide(Layer.mergeAll(DocsFileSystem.layer, DocsPath.layer)));
}
