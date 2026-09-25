/**
 *
 *
 * @module @sorrell/docs-cli/Test/RuntimeTest
 *
 * @file      runtime.test.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    AtomicWriter,
    CommandRunner,
    DocsFileSystem,
    DocsPath,
    TempDirectory,
    docsCliLayer,
    makeFixtureCommand
} from "../Source/index.js";
import {
    Effect,
    Fiber,
    FileSystem,
    Layer,
    Path,
    Stdio,
    Stream,
    Terminal
} from "effect";
import { describe, expect, it } from "@effect/vitest";
import { ChildProcessSpawner } from "effect/unstable/process";
import { Command as CliCommand } from "effect/unstable/cli";
const cliTestLayer = Layer.mergeAll(
    FileSystem.layerNoop({}),
    Path.layer,
    Stdio.layerTest({}),
    Layer.succeed(
        Terminal.Terminal,
        Terminal.make({
            columns: Effect.succeed(80),
            display: () => Effect.void,
            readInput: Effect.die("unused"),
            readLine: Effect.die("unused"),
            rows: Effect.succeed(24)
        })
    ),
    Layer.succeed(
        ChildProcessSpawner.ChildProcessSpawner,
        ChildProcessSpawner.make(() => Effect.die("unused"))
    )
);
describe("Effect CLI runtime", () =>
{
    it.effect("parses flags through the v4 CLI command runner", () =>
        Effect.gen(function* ()
        {
            const parsed: Array<{
                readonly count: number;
                readonly name: string;
            }> = [];
            const command = makeFixtureCommand((input: any) =>
                Effect.sync(() => parsed.push(input))
            );
            yield* CliCommand.runWith(command, {
                renderErrors: false,
                version: "1.0.1"
            })([ "--name", "Ada", "--count", "3" ]).pipe(
                Effect.provide(cliTestLayer)
            );
            expect(parsed).toEqual([ { count: 3, name: "Ada" } ]);
        })
    );
});
describe("filesystem services", () =>
{
    it.effect(
        "writes atomically and removes temporary directories on scope close",
        () =>
            Effect.gen(function* ()
            {
                const fileSystem = yield* DocsFileSystem;
                const path = yield* DocsPath;
                const writer = yield* AtomicWriter;
                const temporaryDirectory = yield* Effect.scoped(
                    Effect.gen(function* ()
                    {
                        const directory =
                            yield* (yield* TempDirectory).makeScoped({
                                prefix: "sorrell-docs-cli-"
                            });
                        const target = path.join(directory, "config.json");
                        yield* writer.writeText(target, "{\"ready\":true}");
                        expect(yield* fileSystem.readText(target)).toBe(
                            "{\"ready\":true}"
                        );
                        expect(
                            yield* fileSystem.readDirectory(directory)
                        ).toEqual([ "config.json" ]);
                        return directory;
                    })
                );
                expect(yield* fileSystem.exists(temporaryDirectory)).toBe(
                    false
                );
            }).pipe(Effect.provide(docsCliLayer))
    );
    it.effect("cleans the temporary file when the atomic rename fails", () =>
        Effect.gen(function* ()
        {
            const fileSystem = yield* DocsFileSystem;
            const path = yield* DocsPath;
            const writer = yield* AtomicWriter;
            const temporaryDirectory = yield* Effect.scoped(
                Effect.gen(function* ()
                {
                    const directory = yield* (yield* TempDirectory).makeScoped({
                        prefix: "sorrell-docs-cli-failure-"
                    });
                    const targetDirectory = path.join(
                        directory,
                        "already-a-directory"
                    );
                    yield* fileSystem.makeDirectory(targetDirectory);
                    const outcome = yield* writer
                        .writeText(targetDirectory, "not a directory")
                        .pipe(
                            Effect.map(() => ({ _tag: "Right" as const })),
                            Effect.catch((error: DocsAtomicWriteError) =>
                                Effect.succeed({
                                    _tag: "Left" as const,
                                    left: error
                                })
                            )
                        );
                    expect(outcome._tag).toBe("Left");
                    expect(yield* fileSystem.readDirectory(directory)).toEqual([
                        "already-a-directory"
                    ]);
                    return directory;
                })
            );
            expect(yield* fileSystem.exists(temporaryDirectory)).toBe(false);
        }).pipe(Effect.provide(docsCliLayer))
    );
});
describe("child-process services", () =>
{
    it.effect("streams output and returns successful process results", () =>
        Effect.gen(function* ()
        {
            const runner = yield* CommandRunner;
            const result = yield* runner.run(process.execPath, [
                "-e",
                "console.log('stdout-line'); console.error('stderr-line')"
            ]);
            const lines = yield* Stream.runCollect(
                runner.streamLines(process.execPath, [
                    "-e",
                    "console.log('streamed-line')"
                ])
            );
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain("stdout-line");
            expect(result.stderr).toContain("stderr-line");
            expect(lines).toEqual([ "streamed-line" ]);
        }).pipe(Effect.provide(CommandRunner.layer))
    );
    it.effect("turns a nonzero child exit into a typed process failure", () =>
        Effect.gen(function* ()
        {
            const runner = yield* CommandRunner;
            const outcome = yield* runner
                .run(process.execPath, [
                    "-e",
                    "console.error('expected-failure'); process.exit(7)"
                ])
                .pipe(
                    Effect.map(() => ({ _tag: "Right" as const })),
                    Effect.catch((error: DocsProcessError) =>
                        Effect.succeed({ _tag: "Left" as const, left: error })
                    )
                );
            expect(outcome._tag).toBe("Left");
            if (outcome._tag === "Left")
            {
                expect(outcome.left._tag).toBe("DocsProcessError");
                expect(outcome.left.exitCode).toBe(7);
                expect(outcome.left.stderr).toContain("expected-failure");
            }
        }).pipe(Effect.provide(CommandRunner.layer))
    );
    it.effect("propagates nonzero exits from streamed child output", () =>
        Effect.gen(function* ()
        {
            const runner = yield* CommandRunner;
            const outcome = yield* Stream.runCollect(
                runner.streamLines(process.execPath, [
                    "-e",
                    "console.log('partial-output'); process.exit(9)"
                ])
            ).pipe(
                Effect.map(() => ({ _tag: "Right" as const })),
                Effect.catch((error: DocsProcessError) =>
                    Effect.succeed({ _tag: "Left" as const, left: error })
                )
            );
            expect(outcome._tag).toBe("Left");
            if (outcome._tag === "Left")
            {
                expect(outcome.left._tag).toBe("DocsProcessError");
                expect(outcome.left.exitCode).toBe(9);
            }
        }).pipe(Effect.provide(CommandRunner.layer))
    );
    it.effect("interrupts a scoped child process", () =>
        Effect.gen(function* ()
        {
            const runner = yield* CommandRunner;
            const fiber = yield* runner
                .run(
                    process.execPath,
                    [ "-e", "setInterval(() => undefined, 1000)" ],
                    { forceKillAfter: "100 millis" }
                )
                .pipe(Effect.forkChild);
            yield* Effect.promise(
                () =>
                    new Promise<void>(
                        (
                            resolve: (value: void | PromiseLike<void>) => void
                        ) =>
                        {
                            setTimeout(resolve, 100);
                        }
                    )
            );
            yield* Fiber.interrupt(fiber);
            yield* Fiber.await(fiber);
        }).pipe(Effect.provide(CommandRunner.layer))
    );
});
