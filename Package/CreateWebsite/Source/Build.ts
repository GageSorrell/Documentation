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

import {
    CommandRunner,
    DocsFileSystem,
    DocsPath,
    type PackageManagerInfo,
    PackageManagerSelection
} from "@sorrell/docs-cli";
import { type DocsConfig, decodeDocsConfigSync } from "@sorrell/docs-core";
import { Effect, Layer, Stream } from "effect";

import { buildAgentOutput, verifyAgentOutput } from "./AgentOutput.js";
import type { GeneratedWebsite } from "./Types.js";
import { createGeneratedWebsiteFromConfig } from "./Generator.js";
const readConfig = (
    target: string
): Effect.Effect<DocsConfig, unknown, DocsFileSystem | DocsPath> =>
    Effect.gen(function* ()
    {
        const fileSystem = yield* DocsFileSystem;
        const path = yield* DocsPath;
        const text = yield* fileSystem.readText(
            path.join(target, "docs.config.json")
        );
        return yield* Effect.try({
            catch: (cause: unknown) => cause,
            try: () => decodeDocsConfigSync(JSON.parse(text))
        });
    });
export/** @internal */
const readGeneratedWebsite = (
    target: string
): Effect.Effect<GeneratedWebsite, unknown> =>
    readConfig(target).pipe(
        Effect.map((config: DocsConfig) =>
            createGeneratedWebsiteFromConfig(target, config)
        ),
        Effect.provide(Layer.mergeAll(DocsFileSystem.layer, DocsPath.layer))
    );
const runPackageScript = (
    target: string,
    directory: string,
    script: "build" | "verify",
    manager: PackageManagerInfo
) =>
    Effect.gen(function* ()
    {
        const runner = yield* CommandRunner;
        yield* runner.run(manager.executable, manager.runArguments(script), {
            cwd: `${target}/${directory}`
        });
    });
const startPackageDev = (
    target: string,
    directory: string,
    manager: PackageManagerInfo
) =>
    Effect.gen(function* ()
    {
        const runner = yield* CommandRunner;
        yield* runner
            .streamLines(manager.executable, manager.runArguments("dev"), {
                cwd: `${target}/${directory}`
            })
            .pipe(Stream.runDrain, Effect.forkScoped);
    });
export/** @internal */
const buildWebsite = (
    target: string
): Effect.Effect<void, unknown> =>
    Effect.gen(function* ()
    {
        const config = yield* readConfig(target);
        const manager = yield* PackageManagerSelection;
        const packageManager = yield* manager.select(target);
        yield* runPackageScript(
            target,
            "Documentation",
            "build",
            packageManager
        );
        if (config.storybook.enabled)
        {
            yield* runPackageScript(
                target,
                "Storybook",
                "build",
                packageManager
            );
        }
        if (config.agent.mcp.enabled)
        {
            yield* runPackageScript(target, "Mcp", "build", packageManager);
        }
        yield* runPackageScript(target, "Landing", "build", packageManager);
        yield* buildAgentOutput(target, { revision: "working-tree" });
    }).pipe(
        Effect.provide(
            Layer.mergeAll(
                DocsFileSystem.layer,
                DocsPath.layer,
                CommandRunner.layer,
                PackageManagerSelection.layer
            )
        )
    );
export/** @internal */
const verifyWebsite = (
    target: string
): Effect.Effect<void, unknown> =>
    Effect.gen(function* ()
    {
        const config = yield* readConfig(target);
        const manager = yield* PackageManagerSelection;
        const packageManager = yield* manager.select(target);
        yield* runPackageScript(
            target,
            "Documentation",
            "verify",
            packageManager
        );
        if (config.storybook.enabled)
        {
            yield* runPackageScript(
                target,
                "Storybook",
                "verify",
                packageManager
            );
        }
        if (config.agent.mcp.enabled)
        {
            yield* runPackageScript(target, "Mcp", "verify", packageManager);
        }
        yield* runPackageScript(target, "Landing", "verify", packageManager);
        yield* verifyAgentOutput(target);
    }).pipe(
        Effect.provide(
            Layer.mergeAll(
                DocsFileSystem.layer,
                DocsPath.layer,
                CommandRunner.layer,
                PackageManagerSelection.layer
            )
        )
    );
export/** @internal */
const devWebsite = (
    target: string
): Effect.Effect<never, unknown> =>
    Effect.scoped(
        Effect.gen(function* ()
        {
            const config = yield* readConfig(target);
            const manager = yield* PackageManagerSelection;
            const packageManager = yield* manager.select(target);
            yield* startPackageDev(target, "Documentation", packageManager);
            if (config.storybook.enabled)
            {
                yield* startPackageDev(target, "Storybook", packageManager);
            }
            if (config.agent.mcp.enabled)
            {
                yield* startPackageDev(target, "Mcp", packageManager);
            }
            yield* startPackageDev(target, "Landing", packageManager);
            return yield* Effect.never;
        })
    ).pipe(
        Effect.provide(
            Layer.mergeAll(
                DocsFileSystem.layer,
                DocsPath.layer,
                CommandRunner.layer,
                PackageManagerSelection.layer
            )
        )
    );
