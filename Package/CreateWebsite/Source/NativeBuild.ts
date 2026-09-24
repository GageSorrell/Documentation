/**
 *
 *
 * @module @sorrell/docs-create-website/NativeBuild
 *
 * @file      NativeBuild.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** @module @sorrell/docs-create-website/NativeBuild */

import { Effect, Layer, Stream } from "effect";
import { CommandRunner, DocsFileSystem, DocsPath, PackageManagerSelection, type PackageManagerInfo } from "@sorrell/docs-cli";
import type { NativePlatform } from "./NativeTypes.js";

const runScript = (target: string, script: string, manager: PackageManagerInfo, args: ReadonlyArray<string> = []) => Effect.gen(function*() {
    const runner = yield* CommandRunner;
    yield* runner.run(manager.executable, manager.runArguments(script, args), { cwd: target });
});

export const generateNativeApp = (target: string, platform: NativePlatform = "all"): Effect.Effect<void, unknown> => Effect.gen(function*() {
    const manager = yield* PackageManagerSelection;
    const packageManager = yield* manager.select(target);
    if (platform !== "web") {
        yield* runScript(target, "prebuild", packageManager, platform === "all" ? [] : [ "--platform", platform ]);
    }
    yield* runScript(target, "export", packageManager, [ "--platform", platform ]);
}).pipe(Effect.provide(Layer.mergeAll(DocsFileSystem.layer, DocsPath.layer, CommandRunner.layer, PackageManagerSelection.layer)));

export const verifyNativeApp = (target: string): Effect.Effect<void, unknown> => Effect.gen(function*() {
    const manager = yield* PackageManagerSelection;
    const packageManager = yield* manager.select(target);
    yield* runScript(target, "typecheck", packageManager);
    yield* runScript(target, "export", packageManager);
}).pipe(Effect.provide(Layer.mergeAll(DocsFileSystem.layer, DocsPath.layer, CommandRunner.layer, PackageManagerSelection.layer)));

export const devNativeApp = (target: string): Effect.Effect<never, unknown> => Effect.scoped(Effect.gen(function*() {
    const manager = yield* PackageManagerSelection;
    const packageManager = yield* manager.select(target);
    const runner = yield* CommandRunner;
    yield* runner.streamLines(packageManager.executable, packageManager.runArguments("dev"), { cwd: target }).pipe(Stream.runDrain, Effect.forkScoped);
    return yield* Effect.never;
})).pipe(Effect.provide(Layer.mergeAll(DocsFileSystem.layer, DocsPath.layer, CommandRunner.layer, PackageManagerSelection.layer)));
