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

import { NodeServices } from "@effect/platform-node";
import { Context, Effect, FileSystem, Layer, Path, Scope, Stream, Terminal } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";
import {
    DocsAtomicWriteError,
    DocsFileSystemError,
    DocsProcessError,
    DocsTerminalError
} from "./errors.js";

const fileSystemFailure = (operation: string, path: string, cause: unknown) =>
    new DocsFileSystemError({ operation, path, cause });

export class DocsFileSystem extends Context.Service<DocsFileSystem, {
    readonly exists: (path: string) => Effect.Effect<boolean, DocsFileSystemError>;
    readonly isDirectory: (path: string) => Effect.Effect<boolean, DocsFileSystemError>;
    readonly makeDirectory: (path: string) => Effect.Effect<void, DocsFileSystemError>;
    readonly makeTempDirectoryScoped: (options?: {
        readonly directory?: string;
        readonly prefix?: string;
    }) => Effect.Effect<string, DocsFileSystemError, Scope.Scope>;
    readonly makeTempFileScoped: (options?: {
        readonly directory?: string;
        readonly prefix?: string;
        readonly suffix?: string;
    }) => Effect.Effect<string, DocsFileSystemError, Scope.Scope>;
    readonly readDirectory: (path: string) => Effect.Effect<ReadonlyArray<string>, DocsFileSystemError>;
    readonly readText: (path: string) => Effect.Effect<string, DocsFileSystemError>;
    readonly remove: (path: string, options?: { readonly recursive?: boolean }) => Effect.Effect<void, DocsFileSystemError>;
    readonly rename: (from: string, to: string) => Effect.Effect<void, DocsFileSystemError>;
    readonly writeText: (path: string, content: string) => Effect.Effect<void, DocsFileSystemError>;
}>()("sorrell/docs-cli/DocsFileSystem") {
    static readonly layer = Layer.effect(
        DocsFileSystem,
        Effect.gen(function*() {
            const fileSystem = yield* FileSystem.FileSystem;

            return DocsFileSystem.of({
                exists: (path) => fileSystem.exists(path).pipe(
                    Effect.mapError((cause) => fileSystemFailure("exists", path, cause))
                ),
                isDirectory: (path) => fileSystem.stat(path).pipe(
                    Effect.map((info) => info.type === "Directory"),
                    Effect.mapError((cause) => fileSystemFailure("isDirectory", path, cause))
                ),
                makeDirectory: (path) => fileSystem.makeDirectory(path, { recursive: true }).pipe(
                    Effect.mapError((cause) => fileSystemFailure("makeDirectory", path, cause))
                ),
                makeTempDirectoryScoped: (options) => fileSystem.makeTempDirectoryScoped(options).pipe(
                    Effect.mapError((cause) => fileSystemFailure("makeTempDirectoryScoped", options?.directory ?? "", cause))
                ),
                makeTempFileScoped: (options) => fileSystem.makeTempFileScoped(options).pipe(
                    Effect.mapError((cause) => fileSystemFailure("makeTempFileScoped", options?.directory ?? "", cause))
                ),
                readDirectory: (path) => fileSystem.readDirectory(path).pipe(
                    Effect.mapError((cause) => fileSystemFailure("readDirectory", path, cause))
                ),
                readText: (path) => fileSystem.readFileString(path).pipe(
                    Effect.mapError((cause) => fileSystemFailure("readText", path, cause))
                ),
                remove: (path, options) => fileSystem.remove(path, { force: true, recursive: options?.recursive === true }).pipe(
                    Effect.mapError((cause) => fileSystemFailure("remove", path, cause))
                ),
                rename: (from, to) => fileSystem.rename(from, to).pipe(
                    Effect.mapError((cause) => fileSystemFailure("rename", `${from} -> ${to}`, cause))
                ),
                writeText: (path, content) => fileSystem.writeFileString(path, content).pipe(
                    Effect.mapError((cause) => fileSystemFailure("writeText", path, cause))
                )
            });
        })
    ).pipe(Layer.provide(NodeServices.layer));
}

export class DocsPath extends Context.Service<DocsPath, {
    readonly basename: (path: string) => string;
    readonly dirname: (path: string) => string;
    readonly join: (...paths: ReadonlyArray<string>) => string;
    readonly resolve: (...paths: ReadonlyArray<string>) => string;
}>()("sorrell/docs-cli/DocsPath") {
    static readonly layer = Layer.effect(
        DocsPath,
        Effect.gen(function*() {
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

export class DocsTerminal extends Context.Service<DocsTerminal, {
    readonly columns: Effect.Effect<number>;
    readonly display: (text: string) => Effect.Effect<void, DocsTerminalError>;
    readonly readLine: Effect.Effect<string, DocsTerminalError>;
    readonly rows: Effect.Effect<number>;
}>()("sorrell/docs-cli/DocsTerminal") {
    static readonly layer = Layer.effect(
        DocsTerminal,
        Effect.gen(function*() {
            const terminal = yield* Terminal.Terminal;
            return DocsTerminal.of({
                columns: terminal.columns,
                display: (text) => terminal.display(text).pipe(
                    Effect.mapError((cause) => new DocsTerminalError({ operation: "display", cause }))
                ),
                readLine: terminal.readLine.pipe(
                    Effect.mapError((cause) => new DocsTerminalError({ operation: "readLine", cause }))
                ),
                rows: terminal.rows
            });
        })
    ).pipe(Layer.provide(NodeServices.layer));
}

export class TempDirectory extends Context.Service<TempDirectory, {
    readonly makeScoped: (options?: {
        readonly directory?: string;
        readonly prefix?: string;
    }) => Effect.Effect<string, DocsFileSystemError, Scope.Scope>;
}>()("sorrell/docs-cli/TempDirectory") {
    static readonly layer = Layer.effect(
        TempDirectory,
        Effect.gen(function*() {
            const fileSystem = yield* DocsFileSystem;
            return TempDirectory.of({
                makeScoped: fileSystem.makeTempDirectoryScoped
            });
        })
    ).pipe(Layer.provide(DocsFileSystem.layer));
}

export class AtomicWriter extends Context.Service<AtomicWriter, {
    readonly writeText: (path: string, content: string) => Effect.Effect<void, DocsAtomicWriteError>;
}>()("sorrell/docs-cli/AtomicWriter") {
    static readonly layer = Layer.effect(
        AtomicWriter,
        Effect.gen(function*() {
            const fileSystem = yield* DocsFileSystem;
            const path = yield* DocsPath;

            return AtomicWriter.of({
                writeText: (target, content) => Effect.scoped(
                    Effect.gen(function*() {
                        const temporary = yield* fileSystem.makeTempFileScoped({
                            directory: path.dirname(target),
                            prefix: `.${path.basename(target)}.`,
                            suffix: ".tmp"
                        });
                        yield* fileSystem.writeText(temporary, content);
                        yield* fileSystem.rename(temporary, target);
                    })
                ).pipe(
                    Effect.mapError((cause) => new DocsAtomicWriteError({ path: target, cause }))
                )
            });
        })
    ).pipe(Layer.provide(Layer.mergeAll(DocsFileSystem.layer, DocsPath.layer)));
}

export type CommandOptions = Omit<ChildProcess.CommandOptions, "additionalFds" | "shell" | "stderr" | "stdin" | "stdout">;

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
    stdout = "",
    stderr = ""
) => new DocsProcessError({ command, args, cause, exitCode, stdout, stderr });

export class CommandRunner extends Context.Service<CommandRunner, {
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
}>()("sorrell/docs-cli/CommandRunner") {
    static readonly layer = Layer.effect(
        CommandRunner,
        Effect.gen(function*() {
            const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
            const makeCommand = (command: string, args: ReadonlyArray<string>, options?: CommandOptions) =>
                ChildProcess.make(command, args, { ...options, shell: false });

            const run = (command: string, args: ReadonlyArray<string> = [], options?: CommandOptions) =>
                Effect.scoped(
                    Effect.gen(function*() {
                        const handle = yield* spawner.spawn(makeCommand(command, args, options)).pipe(
                            Effect.mapError((cause) => processFailure(command, args, cause))
                        );
                        const result = yield* Effect.all({
                            exitCode: handle.exitCode,
                            stderr: Stream.mkString(Stream.decodeText(handle.stderr)),
                            stdout: Stream.mkString(Stream.decodeText(handle.stdout))
                        }, { concurrency: "unbounded" }).pipe(
                            Effect.mapError((cause) => processFailure(command, args, cause)),
                            Effect.ensuring(handle.kill({ forceKillAfter: "100 millis" }).pipe(Effect.ignore))
                        );
                        const exitCode = Number(result.exitCode);
                        if (exitCode !== 0) {
                            return yield* Effect.fail(processFailure(command, args, new Error("Child process exited unsuccessfully"), exitCode, result.stdout, result.stderr));
                        }
                        return { args, command, exitCode, stderr: result.stderr, stdout: result.stdout };
                    })
                );

            const streamLines = (command: string, args: ReadonlyArray<string> = [], options?: CommandOptions) =>
                Stream.scoped(
                    Stream.unwrap(
                        spawner.spawn(makeCommand(command, args, options)).pipe(
                            Effect.map((handle) => {
                                const output = handle.all.pipe(
                                    Stream.decodeText,
                                    Stream.splitLines,
                                    Stream.mapError((cause) => processFailure(command, args, cause))
                                );
                                const completion = Stream.fromEffect(handle.exitCode).pipe(
                                    Stream.mapError((cause) => processFailure(command, args, cause)),
                                    Stream.flatMap((exitCode) => Number(exitCode) === 0
                                        ? Stream.empty
                                        : Stream.fail(processFailure(
                                            command,
                                            args,
                                            new Error("Child process exited unsuccessfully"),
                                            Number(exitCode)
                                        )))
                                );
                                return output.pipe(Stream.concat(completion));
                            }),
                            Effect.mapError((cause) => processFailure(command, args, cause))
                        )
                    )
                );

            return CommandRunner.of({ run, streamLines });
        })
    ).pipe(Layer.provide(NodeServices.layer));
}

export const docsCliLayer = Layer.mergeAll(
    DocsFileSystem.layer,
    DocsPath.layer,
    DocsTerminal.layer,
    TempDirectory.layer,
    AtomicWriter.layer,
    CommandRunner.layer
);
