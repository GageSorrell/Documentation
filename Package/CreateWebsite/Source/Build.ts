/**
 * Build and verify the generated application graph.
 *
 * @module @sorrell/docs-create-website/Build
 *
 * @file      Build.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Effect, Layer, Stream } from "effect";
import { decodeDocsConfigSync, type DocsConfig } from "@sorrell/docs-core";
import { CommandRunner, DocsFileSystem, DocsPath, PackageManagerSelection, type PackageManagerInfo } from "@sorrell/docs-cli";
import { createGeneratedWebsiteFromConfig } from "./Generator.js";
import type { GeneratedWebsite } from "./Types.js";

const readConfig = (target: string): Effect.Effect<DocsConfig, unknown, DocsFileSystem | DocsPath> => Effect.gen(function*() {
    const fileSystem = yield* DocsFileSystem;
    const path = yield* DocsPath;
    const text = yield* fileSystem.readText(path.join(target, "docs.config.json"));
    return yield* Effect.try({ try: () => decodeDocsConfigSync(JSON.parse(text)), catch: (cause) => cause });
});

export const readGeneratedWebsite = (target: string): Effect.Effect<GeneratedWebsite, unknown> => readConfig(target).pipe(
    Effect.map((config) => createGeneratedWebsiteFromConfig(target, config)),
    Effect.provide(Layer.mergeAll(DocsFileSystem.layer, DocsPath.layer))
);

const runPackageScript = (target: string, directory: string, script: "build" | "verify", manager: PackageManagerInfo) => Effect.gen(function*() {
    const runner = yield* CommandRunner;
    yield* runner.run(manager.executable, manager.runArguments(script), { cwd: `${target}/${directory}` });
});

const startPackageDev = (target: string, directory: string, manager: PackageManagerInfo) => Effect.gen(function*() {
    const runner = yield* CommandRunner;
    yield* runner.streamLines(manager.executable, manager.runArguments("dev"), { cwd: `${target}/${directory}` }).pipe(Stream.runDrain, Effect.forkScoped);
});

export const buildWebsite = (target: string): Effect.Effect<void, unknown> => Effect.gen(function*() {
    const config = yield* readConfig(target);
    const manager = yield* PackageManagerSelection;
    const packageManager = yield* manager.select(target);
    yield* runPackageScript(target, "Documentation", "build", packageManager);
    if (config.storybook.enabled) {yield* runPackageScript(target, "Storybook", "build", packageManager);}
    yield* runPackageScript(target, "Landing", "build", packageManager);
}).pipe(Effect.provide(Layer.mergeAll(DocsFileSystem.layer, DocsPath.layer, CommandRunner.layer, PackageManagerSelection.layer)));

export const verifyWebsite = (target: string): Effect.Effect<void, unknown> => Effect.gen(function*() {
    const config = yield* readConfig(target);
    const manager = yield* PackageManagerSelection;
    const packageManager = yield* manager.select(target);
    yield* runPackageScript(target, "Documentation", "verify", packageManager);
    if (config.storybook.enabled) {yield* runPackageScript(target, "Storybook", "verify", packageManager);}
    yield* runPackageScript(target, "Landing", "verify", packageManager);
}).pipe(Effect.provide(Layer.mergeAll(DocsFileSystem.layer, DocsPath.layer, CommandRunner.layer, PackageManagerSelection.layer)));

export const devWebsite = (target: string): Effect.Effect<never, unknown> => Effect.scoped(Effect.gen(function*() {
    const config = yield* readConfig(target);
    const manager = yield* PackageManagerSelection;
    const packageManager = yield* manager.select(target);
    yield* startPackageDev(target, "Documentation", packageManager);
    if (config.storybook.enabled) {yield* startPackageDev(target, "Storybook", packageManager);}
    yield* startPackageDev(target, "Landing", packageManager);
    return yield* Effect.never;
})).pipe(Effect.provide(Layer.mergeAll(DocsFileSystem.layer, DocsPath.layer, CommandRunner.layer, PackageManagerSelection.layer)));
