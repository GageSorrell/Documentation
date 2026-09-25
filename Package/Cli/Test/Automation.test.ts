/**
 *
 *
 * @module @sorrell/docs-cli/Test/Automation.test
 *
 * @file      Automation.test.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    AtomicDirectoryPromotion,
    AutomationOrchestrator,
    DocsFileSystem,
    DocsPath,
    DocsTargetError,
    ManifestTracker,
    NetworkRetry,
    SafeTargetValidation,
    TempDirectory,
    WorkspaceDiscovery,
    docsAutomationLayer,
    packageManagerInfo,
    renderTemplate,
    selectPackageManager
} from "../Source/index.js";
import { Effect, Result } from "effect";

/**
 * @module @sorrell/docs-cli/Test/AutomationTest
 */

import { describe, expect, it } from "@effect/vitest";
describe("automation services", () =>
{
    it("selects package managers from explicit values and lockfiles", () =>
    {
        expect(selectPackageManager("pnpm@10.0.0", [])).toBe(
            packageManagerInfo("pnpm")
        );
        expect(selectPackageManager(undefined, [ "yarn.lock" ])).toBe(
            packageManagerInfo("yarn")
        );
        expect(selectPackageManager(undefined, [])).toBe(
            packageManagerInfo("npm")
        );
        expect(renderTemplate("Hello {{ name }}", { name: "Ada" })).toBe(
            "Hello Ada"
        );
    });
    it.effect("discovers workspace packages and tracks manifests", () =>
        Effect.gen(function* ()
        {
            const workspace = yield* WorkspaceDiscovery;
            const path = yield* DocsPath;
            const workingDirectory = process.cwd();
            const root = /[\\/]Package[\\/]Cli$/i.test(workingDirectory)
                ? path.resolve(workingDirectory, "../..")
                : workingDirectory;
            const discovered = yield* workspace.discover(root);
            expect(
                discovered.packages.some(
                    (value: WorkspacePackage) =>
                        value.name === "@sorrell/docs-core"
                )
            ).toBe(true);
            const temporary = yield* (yield* TempDirectory).makeScoped({
                prefix: "sorrell-docs-automation-"
            });
            const manifestPath = `${temporary}/manifest.json`;
            const manifest = {
                entries: [],
                generatedAt: "2026-01-01T00:00:00.000Z",
                version: 1 as const
            };
            const tracker = yield* ManifestTracker;
            yield* tracker.write(manifestPath, manifest);
            expect(yield* tracker.read(manifestPath)).toEqual(manifest);
        }).pipe(Effect.provide(docsAutomationLayer))
    );
    it.effect(
        "validates safe targets and promotes staged directories atomically",
        () =>
            Effect.scoped(
                Effect.gen(function* ()
                {
                    const fileSystem = yield* DocsFileSystem;
                    const temporary = yield* (yield* TempDirectory).makeScoped({
                        prefix: "sorrell-docs-promotion-"
                    });
                    const staging = `${temporary}/staging`;
                    const target = `${temporary}/generated`;
                    yield* fileSystem.makeDirectory(staging);
                    const safeTarget = yield* SafeTargetValidation;
                    const resolvedTarget = (yield* DocsPath).resolve(target);
                    expect(
                        yield* safeTarget.validateEmpty(target, temporary)
                    ).toBe(resolvedTarget);
                    yield* (yield* AtomicDirectoryPromotion).promote(
                        staging,
                        target
                    );
                    expect(yield* fileSystem.exists(target)).toBe(true);
                    yield* fileSystem.writeText(
                        `${target}/generated.txt`,
                        "generated"
                    );
                    const invalid = yield* safeTarget
                        .validateEmpty(target, temporary)
                        .pipe(
                            Effect.map(() => Result.succeed(true)),
                            Effect.catch((error: DocsTargetError) =>
                                Effect.succeed(Result.fail(error))
                            )
                        );
                    expect(Result.isFailure(invalid)).toBe(true);
                    if (Result.isFailure(invalid))
                    {
                        expect(invalid.failure).toBeInstanceOf(DocsTargetError);
                    }
                })
            ).pipe(Effect.provide(docsAutomationLayer))
    );
    it.effect("retries only failures marked retryable", () =>
        Effect.gen(function* ()
        {
            const retry = yield* NetworkRetry;
            let attempts = 0;
            const transient = yield* retry.run(
                Effect.suspend(() =>
                {
                    attempts += 1;
                    if (attempts < 3)
                    {
                        return Effect.fail(new Error("temporary"));
                    }
                    return Effect.succeed("ok");
                }),
                () => true,
                { maxRetries: 3 }
            );
            expect(transient).toBe("ok");
            expect(attempts).toBe(3);
            let nonRetryableAttempts = 0;
            const nonRetryable = yield* retry
                .run(
                    Effect.suspend(() =>
                    {
                        nonRetryableAttempts += 1;
                        return Effect.fail(new Error("permanent"));
                    }),
                    () => false,
                    { maxRetries: 3 }
                )
                .pipe(
                    Effect.map((value: never) => Result.succeed(value)),
                    Effect.catch((error: Error) =>
                        Effect.succeed(Result.fail(error))
                    )
                );
            expect(Result.isFailure(nonRetryable)).toBe(true);
            expect(nonRetryableAttempts).toBe(1);
        }).pipe(Effect.provide(docsAutomationLayer))
    );
    it.effect("runs independent checks with a bound and stages in order", () =>
        Effect.gen(function* ()
        {
            const orchestrator = yield* AutomationOrchestrator;
            expect(
                yield* orchestrator.parallel(
                    [ Effect.succeed("a"), Effect.succeed("b") ],
                    2
                )
            ).toEqual([ "a", "b" ]);
            expect(
                yield* orchestrator.sequential([
                    { name: "first", run: Effect.succeed(1) },
                    { name: "second", run: Effect.succeed(2) }
                ])
            ).toEqual([ 1, 2 ]);
        }).pipe(Effect.provide(docsAutomationLayer))
    );
});
