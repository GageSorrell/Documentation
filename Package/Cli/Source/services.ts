/**
 *
 *
 * @module @sorrell/docs-cli/Services
 *
 * @file      services.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";
import {
    Context,
    Effect,
    FileSystem,
    Layer,
    Path,
    Stream,
    Terminal
} from "effect";
import {
    DocsAtomicWriteError,
    DocsFileSystemError,
    DocsProcessError,
    DocsTerminalError
} from "./errors.js";
import type { Brand } from "effect/Brand";
import { NodeServices } from "@effect/platform-node";
import type { PlatformError } from "effect/PlatformError";
import type { Scope } from "effect";
const fileSystemFailure = (operation: string, path: string, cause: unknown) =>
    new DocsFileSystemError({ cause, operation, path });
/** @internal */
export class DocsFileSystem extends Context.Service<
    DocsFileSystem,
    {
        readonly exists: (
            path: string
        ) => Effect.Effect<boolean, DocsFileSystemError>;
        readonly isDirectory: (
            path: string
        ) => Effect.Effect<boolean, DocsFileSystemError>;
        readonly makeDirectory: (
            path: string
        ) => Effect.Effect<void, DocsFileSystemError>;
        readonly makeTempDirectoryScoped: (options?: {
            readonly directory?: string;
            readonly prefix?: string;
        }) => Effect.Effect<string, DocsFileSystemError, Scope.Scope>;
        readonly makeTempFileScoped: (options?: {
            readonly directory?: string;
            readonly prefix?: string;
            readonly suffix?: string;
        }) => Effect.Effect<string, DocsFileSystemError, Scope.Scope>;
        readonly readDirectory: (
            path: string
        ) => Effect.Effect<ReadonlyArray<string>, DocsFileSystemError>;
        readonly writeBytes: (
            path: string,
            content: Uint8Array
        ) => Effect.Effect<void, DocsFileSystemError>;
        readonly readText: (
            path: string
        ) => Effect.Effect<string, DocsFileSystemError>;
        readonly remove: (
            path: string,
            options?: {
                readonly recursive?: boolean;
            }
        ) => Effect.Effect<void, DocsFileSystemError>;
        readonly rename: (
            from: string,
            to: string
        ) => Effect.Effect<void, DocsFileSystemError>;
        readonly writeText: (
            path: string,
            content: string
        ) => Effect.Effect<void, DocsFileSystemError>;
    }
>()("sorrell/docs-cli/DocsFileSystem")
{
    static readonly layer: Layer.Layer<DocsFileSystem, never, never> =
        Layer.effect(
            DocsFileSystem,
            Effect.gen(function* ()
            {
                const fileSystem = yield* FileSystem.FileSystem;
                return DocsFileSystem.of({
                    exists: (path: string) =>
                        fileSystem
                            .exists(path)
                            .pipe(
                                Effect.mapError((cause: PlatformError) =>
                                    fileSystemFailure("exists", path, cause)
                                )
                            ),
                    isDirectory: (path: string) =>
                        fileSystem.stat(path).pipe(
                            Effect.map(
                                (info: FileSystem.File.Info) =>
                                    info.type === "Directory"
                            ),
                            Effect.mapError((cause: PlatformError) =>
                                fileSystemFailure("isDirectory", path, cause)
                            )
                        ),
                    makeDirectory: (path: string) =>
                        fileSystem
                            .makeDirectory(path, { recursive: true })
                            .pipe(
                                Effect.mapError((cause: PlatformError) =>
                                    fileSystemFailure(
                                        "makeDirectory",
                                        path,
                                        cause
                                    )
                                )
                            ),
                    makeTempDirectoryScoped: (
                        options:
                            | {
                                readonly directory?: string;
                                readonly prefix?: string;
                            }
                            | undefined
                    ) =>
                        fileSystem
                            .makeTempDirectoryScoped(options)
                            .pipe(
                                Effect.mapError((cause: PlatformError) =>
                                    fileSystemFailure(
                                        "makeTempDirectoryScoped" +
                                            "" +
                                            "" +
                                            "" +
                                            "" +
                                            "" +
                                            "" +
                                            "" +
                                            "" +
                                            "" +
                                            "" +
                                            "" +
                                            "" +
                                            "" +
                                            "" +
                                            "" +
                                            "" +
                                            "" +
                                            "" +
                                            "",
                                        options?.directory ?? "",
                                        cause
                                    )
                                )
                            ),
                    makeTempFileScoped: (
                        options:
                            | {
                                readonly directory?: string;
                                readonly prefix?: string;
                                readonly suffix?: string;
                            }
                            | undefined
                    ) =>
                        fileSystem
                            .makeTempFileScoped(options)
                            .pipe(
                                Effect.mapError((cause: PlatformError) =>
                                    fileSystemFailure(
                                        "makeTempFileScoped",
                                        options?.directory ?? "",
                                        cause
                                    )
                                )
                            ),
                    readDirectory: (path: string) =>
                        fileSystem
                            .readDirectory(path)
                            .pipe(
                                Effect.mapError((cause: PlatformError) =>
                                    fileSystemFailure(
                                        "readDirectory",
                                        path,
                                        cause
                                    )
                                )
                            ),
                    readText: (path: string) =>
                        fileSystem
                            .readFileString(path)
                            .pipe(
                                Effect.mapError((cause: PlatformError) =>
                                    fileSystemFailure("readText", path, cause)
                                )
                            ),
                    remove: (
                        path: string,
                        options:
                            | {
                                readonly recursive?: boolean;
                            }
                            | undefined
                    ) =>
                        fileSystem
                            .remove(path, {
                                force: true,
                                recursive: options?.recursive === true
                            })
                            .pipe(
                                Effect.mapError((cause: PlatformError) =>
                                    fileSystemFailure("remove", path, cause)
                                )
                            ),
                    rename: (from: string, to: string) =>
                        fileSystem
                            .rename(from, to)
                            .pipe(
                                Effect.mapError((cause: PlatformError) =>
                                    fileSystemFailure(
                                        "rename",
                                        `${from} -> ${to}`,
                                        cause
                                    )
                                )
                            ),
                    writeBytes: (
                        path: string,
                        content: Uint8Array<ArrayBufferLike>
                    ) =>
                        fileSystem
                            .writeFile(path, content)
                            .pipe(
                                Effect.mapError((cause: PlatformError) =>
                                    fileSystemFailure(
                                        "writeBytes",
                                        path,
                                        cause
                                    )
                                )
                            ),
                    writeText: (path: string, content: string) =>
                        fileSystem
                            .writeFileString(path, content)
                            .pipe(
                                Effect.mapError((cause: PlatformError) =>
                                    fileSystemFailure("writeText", path, cause)
                                )
                            )
                });
            })
        ).pipe(Layer.provide(NodeServices.layer));
}

/** @internal */
export class DocsPath extends Context.Service<
    DocsPath,
    {
        readonly basename: (path: string) => string;
        readonly dirname: (path: string) => string;
        readonly join: (...paths: ReadonlyArray<string>) => string;
        readonly resolve: (...paths: ReadonlyArray<string>) => string;
    }
>()("sorrell/docs-cli/DocsPath")
{
    static readonly layer: Layer.Layer<DocsPath, never, never> = Layer.effect(
        DocsPath,
        Effect.gen(function* ()
        {
            const path = yield* Path.Path;
            return DocsPath.of({
                basename: path.basename,
                dirname: path.dirname,
                join: path.join,
                resolve: path.resolve
            });
        })
    ).pipe(Layer.provide(NodeServices.layer));
}
/** @internal */
export class DocsTerminal extends Context.Service<
    DocsTerminal,
    {
        readonly columns: Effect.Effect<number>;
        readonly display: (
            text: string
        ) => Effect.Effect<void, DocsTerminalError>;
        readonly readLine: Effect.Effect<string, DocsTerminalError>;
        readonly rows: Effect.Effect<number>;
    }
>()("sorrell/docs-cli/DocsTerminal")
{
    static readonly layer: Layer.Layer<DocsTerminal, never, never> =
        Layer.effect(
            DocsTerminal,
            Effect.gen(function* ()
            {
                const terminal = yield* Terminal.Terminal;
                return DocsTerminal.of({
                    columns: terminal.columns,
                    display: (text: string) =>
                        terminal.display(text).pipe(
                            Effect.mapError(
                                (cause: PlatformError) =>
                                    new DocsTerminalError({
                                        cause,
                                        operation: "display"
                                    })
                            )
                        ),
                    readLine: terminal.readLine.pipe(
                        Effect.mapError(
                            (cause: Terminal.QuitError) =>
                                new DocsTerminalError({
                                    cause,
                                    operation: "readLine"
                                })
                        )
                    ),
                    rows: terminal.rows
                });
            })
        ).pipe(Layer.provide(NodeServices.layer));
}

/** @internal */
export class TempDirectory extends Context.Service<
    TempDirectory,
    {
        readonly makeScoped: (options?: {
            readonly directory?: string;
            readonly prefix?: string;
        }) => Effect.Effect<string, DocsFileSystemError, Scope.Scope>;
    }
>()("sorrell/docs-cli/TempDirectory")
{
    static readonly layer: Layer.Layer<TempDirectory, never, never> =
        Layer.effect(
            TempDirectory,
            Effect.gen(function* ()
            {
                const fileSystem = yield* DocsFileSystem;
                return TempDirectory.of({
                    makeScoped: fileSystem.makeTempDirectoryScoped
                });
            })
        ).pipe(Layer.provide(DocsFileSystem.layer));
}
/** @internal */
export class AtomicWriter extends Context.Service<
    AtomicWriter,
    {
        readonly writeText: (
            path: string,
            content: string
        ) => Effect.Effect<void, DocsAtomicWriteError>;
    }
>()("sorrell/docs-cli/AtomicWriter")
{
    static readonly layer: Layer.Layer<AtomicWriter, never, never> =
        Layer.effect(
            AtomicWriter,
            Effect.gen(function* ()
            {
                const fileSystem = yield* DocsFileSystem;
                const path = yield* DocsPath;
                return AtomicWriter.of({
                    writeText: (target: string, content: string) =>
                        Effect.scoped(
                            Effect.gen(function* ()
                            {
                                const temporary =
                                    yield* fileSystem.makeTempFileScoped({
                                        directory: path.dirname(target),
                                        prefix: `.${path.basename(target)}.`,
                                        suffix: ".tmp"
                                    });
                                yield* fileSystem.writeText(temporary, content);
                                yield* fileSystem.rename(temporary, target);
                            })
                        ).pipe(
                            Effect.mapError(
                                (cause: DocsFileSystemError) =>
                                    new DocsAtomicWriteError({
                                        cause,
                                        path: target
                                    })
                            )
                        )
                });
            })
        ).pipe(
            Layer.provide(Layer.mergeAll(DocsFileSystem.layer, DocsPath.layer))
        );
}
/** @internal */
export type CommandOptions = Omit<
    ChildProcess.CommandOptions,
    "additionalFds" | "shell" | "stderr" | "stdin" | "stdout"
>;
/** @internal */
export interface CommandResult {
    readonly args: ReadonlyArray<string>;
    readonly command: string;
    readonly exitCode: number;
    readonly stderr: string;
    readonly stdout: string;
}
const processFailure = (
    command: string,
    args: ReadonlyArray<string>,
    cause: unknown,
    exitCode: number | undefined = undefined,
    stdout: string = "",
    stderr: string = ""
) => new DocsProcessError({ args, cause, command, exitCode, stderr, stdout });
/** @internal */
export class CommandRunner extends Context.Service<
    CommandRunner,
    {
        readonly run: (
            command: string,
            args?: ReadonlyArray<string>,
            options?: CommandOptions
        ) => Effect.Effect<CommandResult, DocsProcessError>;
        readonly streamLines: (
            command: string,
            args?: ReadonlyArray<string>,
            options?: CommandOptions
        ) => Stream.Stream<string, DocsProcessError, Scope.Scope>;
    }
>()("sorrell/docs-cli/CommandRunner")
{
    static readonly layer: Layer.Layer<CommandRunner, never, never> =
        Layer.effect(
            CommandRunner,
            Effect.gen(function* ()
            {
                const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
                const makeCommand = (
                    command: string,
                    args: ReadonlyArray<string>,
                    options?: CommandOptions
                ) =>
                    ChildProcess.make(command, args, {
                        ...options,
                        shell: false
                    });
                const run = (
                    command: string,
                    args: ReadonlyArray<string> = [],
                    options?: CommandOptions
                ) =>
                    Effect.scoped(
                        Effect.gen(function* ()
                        {
                            const handle = yield* spawner
                                .spawn(makeCommand(command, args, options))
                                .pipe(
                                    Effect.mapError((cause: PlatformError) =>
                                        processFailure(command, args, cause)
                                    )
                                );
                            const result = yield* Effect.all(
                                {
                                    exitCode: handle.exitCode,
                                    stderr: Stream.mkString(
                                        Stream.decodeText(handle.stderr)
                                    ),
                                    stdout: Stream.mkString(
                                        Stream.decodeText(handle.stdout)
                                    )
                                },
                                { concurrency: "unbounded" }
                            ).pipe(
                                Effect.mapError((cause: PlatformError) =>
                                    processFailure(command, args, cause)
                                ),
                                Effect.ensuring(
                                    handle
                                        .kill({ forceKillAfter: "100 millis" })
                                        .pipe(Effect.ignore)
                                )
                            );
                            const exitCode = Number(result.exitCode);
                            if (exitCode !== 0)
                            {
                                return yield* Effect.fail(
                                    processFailure(
                                        command,
                                        args,
                                        new Error(
                                            "Child process " +
                                                "exited " +
                                                "unsuccessfully"
                                        ),
                                        exitCode,
                                        result.stdout,
                                        result.stderr
                                    )
                                );
                            }
                            return {
                                args,
                                command,
                                exitCode,
                                stderr: result.stderr,
                                stdout: result.stdout
                            };
                        })
                    );
                const streamLines = (
                    command: string,
                    args: ReadonlyArray<string> = [],
                    options?: CommandOptions
                ) =>
                    Stream.scoped(
                        Stream.unwrap(
                            spawner
                                .spawn(makeCommand(command, args, options))
                                .pipe(
                                    Effect.map(
                                        (
                                            handle: ChildProcessSpawner.ChildProcessHandle
                                        ) =>
                                        {
                                            const output = handle.all.pipe(
                                                Stream.decodeText,
                                                Stream.splitLines,
                                                Stream.mapError(
                                                    (cause: PlatformError) =>
                                                        processFailure(
                                                            command,
                                                            args,
                                                            cause
                                                        )
                                                )
                                            );
                                            const completion =
                                                Stream.fromEffect(
                                                    handle.exitCode
                                                ).pipe(
                                                    Stream.mapError(
                                                        (
                                                            cause: PlatformError
                                                        ) =>
                                                            processFailure(
                                                                command,
                                                                args,
                                                                cause
                                                            )
                                                    ),
                                                    Stream.flatMap(
                                                        (
                                                            exitCode: number &
                                                                Brand<"ExitCode">
                                                        ) =>
                                                            Number(exitCode) ===
                                                            0
                                                                ? Stream.empty
                                                                : Stream.fail(
                                                                    processFailure(
                                                                        command,
                                                                        args,
                                                                        new Error(
                                                                            "Child process " +
                                                                                  "exited " +
                                                                                  "unsuccessfully"
                                                                        ),
                                                                        Number(
                                                                            exitCode
                                                                        )
                                                                    )
                                                                )
                                                    )
                                                );
                                            return output.pipe(
                                                Stream.concat(completion)
                                            );
                                        }
                                    ),
                                    Effect.mapError((cause: PlatformError) =>
                                        processFailure(command, args, cause)
                                    )
                                )
                        )
                    );
                return CommandRunner.of({ run, streamLines });
            })
        ).pipe(Layer.provide(NodeServices.layer));
}
export/** @internal */
const docsCliLayer = Layer.mergeAll(
    DocsFileSystem.layer,
    DocsPath.layer,
    DocsTerminal.layer,
    TempDirectory.layer,
    AtomicWriter.layer,
    CommandRunner.layer
);
