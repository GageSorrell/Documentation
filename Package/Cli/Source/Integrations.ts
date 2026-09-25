/**
 *
 *
 * @module @sorrell/docs-cli/Integrations
 *
 * @file      Integrations.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { type CommandResult, CommandRunner } from "./services.js";
import { Context, Effect, Layer, Redacted, Schedule } from "effect";
import { DeploymentEnvironment } from "./Environment.js";
import {
    DocsArchiveError,
    DocsIntegrationError,
    type DocsProcessError
} from "./errors.js";

/** @internal */
export interface GitStatus {
    readonly clean: boolean;
    readonly output: string;
}
/** @internal */
export interface VercelDeploymentResult {
    readonly deploymentId: string;
    readonly url: string;
    readonly raw: string;
}
/** @internal */
export interface VercelDeploymentInspection {
    readonly deploymentId: string;
    readonly url: string;
    readonly state:
        | "BUILDING"
        | "ERROR"
        | "INITIALIZING"
        | "QUEUED"
        | "READY"
        | "UNKNOWN";
    readonly raw: string;
}
const ansiEscape = String.fromCharCode(27);
const ansiPattern = new RegExp(`${ansiEscape}\\[[0-?]*[ -/]*[@-~]`, "g");
const stripAnsi = (value: string): string => value.replace(ansiPattern, "");
const vercelExecutable = process.platform === "win32" ? "npx.cmd" : "npx";
const vercelCommand = (args: ReadonlyArray<string>): ReadonlyArray<string> => [
    "--no-install",
    "vercel",
    ...args
];
const parseDeployment = (raw: string): VercelDeploymentResult =>
{
    const cleaned = stripAnsi(raw).trim();
    try
    {
        const value = JSON.parse(cleaned) as {
            readonly id?: unknown;
            readonly deploymentId?: unknown;
            readonly url?: unknown;
        };
        if (typeof value.url === "string")
        {
            return {
                deploymentId:
                    typeof value.id === "string"
                        ? value.id
                        : typeof value.deploymentId === "string"
                            ? value.deploymentId
                            : value.url,
                raw: cleaned,
                url: value.url.startsWith("http")
                    ? value.url
                    : `https://${value.url}`
            };
        }
    }
    catch
    {
        // The CLI may emit human-readable output when an older version is used.
    }
    const urls = [ ...cleaned.matchAll(/https?:\/\/[^\s)]+/g) ]
        .map((match: RegExpExecArray) => match[0]?.replace(/[.,]$/, ""))
        .filter((value: string): value is string => value !== undefined);
    const url = urls.at(-1) ?? cleaned.split(/\s+/).at(-1) ?? cleaned;
    return { deploymentId: url, raw: cleaned, url };
};
const parseInspection = (
    raw: string,
    deployment: string
): VercelDeploymentInspection =>
{
    const cleaned = stripAnsi(raw).trim();
    try
    {
        const value = JSON.parse(cleaned) as {
            readonly id?: unknown;
            readonly url?: unknown;
            readonly readyState?: unknown;
            readonly state?: unknown;
        };
        const state = value.readyState ?? value.state;
        return {
            deploymentId: typeof value.id === "string" ? value.id : deployment,
            raw: cleaned,
            state:
                state === "BUILDING" ||
                state === "ERROR" ||
                state === "INITIALIZING" ||
                state === "QUEUED" ||
                state === "READY"
                    ? state
                    : "UNKNOWN",
            url: typeof value.url === "string" ? value.url : deployment
        };
    }
    catch
    {
        return {
            deploymentId: deployment,
            raw: cleaned,
            state: "UNKNOWN",
            url: deployment
        };
    }
};
/** @internal */
export class GitService extends Context.Service<
    GitService,
    {
        readonly revision: (
            directory: string
        ) => Effect.Effect<string, DocsIntegrationError>;
        readonly remote: (
            directory: string,
            remote?: string
        ) => Effect.Effect<string, DocsIntegrationError>;
        readonly status: (
            directory: string
        ) => Effect.Effect<GitStatus, DocsIntegrationError>;
    }
>()("sorrell/docs-cli/GitService")
{
    static readonly layer: Layer.Layer<GitService, never, never> = Layer.effect(
        GitService,
        Effect.gen(function* ()
        {
            const runner = yield* CommandRunner;
            const run = (
                directory: string,
                args: ReadonlyArray<string>,
                operation: string
            ) =>
                runner.run("git", args, { cwd: directory }).pipe(
                    Effect.mapError(
                        (cause: DocsProcessError) =>
                            new DocsIntegrationError({
                                cause,
                                operation,
                                provider: "git"
                            })
                    )
                );
            return GitService.of({
                remote: (
                    directory: string,
                    remote: string | undefined = "origin"
                ) =>
                    run(
                        directory,
                        [ "remote", "get-url", remote ],
                        "remote"
                    ).pipe(
                        Effect.map((result: CommandResult) =>
                            result.stdout.trim()
                        )
                    ),
                revision: (directory: string) =>
                    run(directory, [ "rev-parse", "HEAD" ], "revision").pipe(
                        Effect.map((result: CommandResult) =>
                            result.stdout.trim()
                        )
                    ),
                status: (directory: string) =>
                    run(directory, [ "status", "--porcelain" ], "status").pipe(
                        Effect.map((result: CommandResult) => ({
                            clean: result.stdout.trim() === "",
                            output: result.stdout
                        }))
                    )
            });
        })
    ).pipe(Layer.provide(CommandRunner.layer));
}
/** @internal */
export class GitHubService extends Context.Service<
    GitHubService,
    {
        readonly createRepository: (
            name: string,
            directory: string,
            options?: {
                readonly visibility?: "public" | "private";
                readonly description?: string;
            }
        ) => Effect.Effect<string, DocsIntegrationError>;
        readonly viewRepository: (
            repository: string
        ) => Effect.Effect<string, DocsIntegrationError>;
    }
>()("sorrell/docs-cli/GitHubService")
{
    static readonly layer: Layer.Layer<GitHubService, never, never> =
        Layer.effect(
            GitHubService,
            Effect.gen(function* ()
            {
                const runner = yield* CommandRunner;
                const run = (
                    args: ReadonlyArray<string>,
                    operation: string,
                    cwd?: string
                ) =>
                    runner
                        .run(
                            "gh",
                            args,
                            cwd === undefined ? undefined : { cwd }
                        )
                        .pipe(
                            Effect.mapError(
                                (cause: DocsProcessError) =>
                                    new DocsIntegrationError({
                                        cause,
                                        operation,
                                        provider: "github"
                                    })
                            )
                        );
                return GitHubService.of({
                    createRepository: (
                        name: string,
                        directory: string,
                        options:
                            | {
                                readonly visibility?: "public" | "private";
                                readonly description?: string;
                            }
                            | undefined
                    ) =>
                        run(
                            [
                                "repo",
                                "create",
                                name,
                                options?.visibility === "private"
                                    ? "--private"
                                    : "--public",
                                ...(options?.description === undefined
                                    ? []
                                    : [ "--description", options.description ]),
                                "--source",
                                directory,
                                "--push"
                            ],
                            "createRepository",
                            directory
                        ).pipe(
                            Effect.map((result: CommandResult) =>
                                result.stdout.trim()
                            )
                        ),
                    viewRepository: (repository: string) =>
                        run(
                            [
                                "repo",
                                "view",
                                repository,
                                "--json",
                                "url",
                                "--jq",
                                ".url"
                            ],
                            "viewRepository"
                        ).pipe(
                            Effect.map((result: CommandResult) =>
                                result.stdout.trim()
                            )
                        )
                });
            })
        ).pipe(Layer.provide(CommandRunner.layer));
}
/** @internal */
export class VercelService extends Context.Service<
    VercelService,
    {
        readonly deploy: (
            directory: string,
            options?: {
                readonly production?: boolean;
                readonly name?: string;
                readonly team?: string;
            }
        ) => Effect.Effect<VercelDeploymentResult, DocsIntegrationError>;
        readonly inspect: (
            deployment: string
        ) => Effect.Effect<VercelDeploymentInspection, DocsIntegrationError>;
        readonly promote: (
            deployment: string
        ) => Effect.Effect<void, DocsIntegrationError>;
        readonly alias: (
            deployment: string,
            alias: string
        ) => Effect.Effect<void, DocsIntegrationError>;
        readonly rollback: (
            deployment?: string
        ) => Effect.Effect<void, DocsIntegrationError>;
        readonly remove: (
            deployment: string
        ) => Effect.Effect<void, DocsIntegrationError>;
    }
>()("sorrell/docs-cli/VercelService")
{
    static readonly layer: Layer.Layer<VercelService, never, never> =
        Layer.effect(
            VercelService,
            Effect.gen(function* ()
            {
                const runner = yield* CommandRunner;
                const environment = yield* DeploymentEnvironment;
                const withAuth = (args: ReadonlyArray<string>) =>
                    environment.requireVercel.pipe(
                        Effect.map((credentials) => [
                            ...args,
                            "--token",
                            Redacted.value(credentials.token),
                            "--team",
                            credentials.orgId
                        ]),
                        Effect.mapError(
                            (cause) =>
                                new DocsIntegrationError({
                                    cause,
                                    operation: "authentication",
                                    provider: "vercel"
                                })
                        )
                    );
                const run = (
                    args: ReadonlyArray<string>,
                    operation: string,
                    cwd?: string
                ) =>
                    runner
                        .run(
                            vercelExecutable,
                            vercelCommand(args),
                            cwd === undefined ? undefined : { cwd }
                        )
                        .pipe(
                            Effect.mapError(
                                (cause: DocsProcessError) =>
                                    new DocsIntegrationError({
                                        cause,
                                        operation,
                                        provider: "vercel"
                                    })
                            )
                        );
                return VercelService.of({
                    alias: (deployment: string, alias: string) =>
                        withAuth([ "alias", "set", deployment, alias ]).pipe(
                            Effect.flatMap((args) => run([ ...args, "--yes" ], "alias")),
                            Effect.asVoid
                        ),
                    deploy: (
                        directory: string,
                        options:
                            | {
                                readonly production?: boolean;
                                readonly name?: string;
                                readonly team?: string;
                            }
                            | undefined
                    ) =>
                        withAuth([
                            "deploy",
                            ...(options?.production === true
                                ? [ "--prod" ]
                                : []),
                            ...(options?.name === undefined
                                ? []
                                : [ "--project", options.name ]),
                            ...(options?.team === undefined
                                ? []
                                : [ "--scope", options.team ]),
                            "--yes",
                            "--json"
                        ]).pipe(
                            Effect.flatMap((args) => run(args, "deploy", directory)),
                            Effect.map((result: CommandResult) =>
                                parseDeployment(result.stdout)
                            )
                        ),
                    inspect: (deployment: string) =>
                        withAuth([ "inspect", deployment, "--json" ]).pipe(
                            Effect.flatMap((args) => run(args, "inspect")),
                            Effect.map((result: CommandResult) =>
                                parseInspection(result.stdout, deployment)
                            )
                        ),
                    promote: (deployment: string) =>
                        withAuth([ "promote", deployment ]).pipe(
                            Effect.flatMap((args) => run([ ...args, "--yes" ], "promote")),
                            Effect.asVoid
                        ),
                    remove: (deployment: string) =>
                        withAuth([ "remove", deployment ]).pipe(
                            Effect.flatMap((args) => run([ ...args, "--yes" ], "remove")),
                            Effect.asVoid
                        ),
                    rollback: (deployment: string | undefined) =>
                        withAuth([
                            "rollback",
                            ...(deployment === undefined
                                ? []
                                : [ deployment ])
                        ]).pipe(
                            Effect.flatMap((args) => run([ ...args, "--yes" ], "rollback")),
                            Effect.asVoid
                        )
                });
            })
        ).pipe(
            Layer.provide(CommandRunner.layer),
            Layer.provide(DeploymentEnvironment.layer)
        );
}
/** @internal */
export class ArchiveService extends Context.Service<
    ArchiveService,
    {
        readonly createTar: (
            sourceDirectory: string,
            destination: string
        ) => Effect.Effect<void, DocsArchiveError>;
        readonly createZip: (
            sourceDirectory: string,
            destination: string
        ) => Effect.Effect<void, DocsArchiveError>;
        readonly extractZip: (
            archive: string,
            destination: string
        ) => Effect.Effect<void, DocsArchiveError>;
    }
>()("sorrell/docs-cli/ArchiveService")
{
    static readonly layer: Layer.Layer<ArchiveService, never, never> =
        Layer.effect(
            ArchiveService,
            Effect.gen(function* ()
            {
                const runner = yield* CommandRunner;
                return ArchiveService.of({
                    createTar: (sourceDirectory: string, destination: string) =>
                        runner
                            .run("tar", [
                                "-cf",
                                destination,
                                "-C",
                                sourceDirectory,
                                "."
                            ])
                            .pipe(
                                Effect.mapError(
                                    (cause: DocsProcessError) =>
                                        new DocsArchiveError({
                                            cause,
                                            operation: "createTar",
                                            path: destination
                                        })
                                ),
                                Effect.asVoid
                            ),
                    createZip: (sourceDirectory: string, destination: string) =>
                        runner
                            .run("tar", [
                                "-a",
                                "-cf",
                                destination,
                                "-C",
                                sourceDirectory,
                                "."
                            ])
                            .pipe(
                                Effect.mapError(
                                    (cause: DocsProcessError) =>
                                        new DocsArchiveError({
                                            cause,
                                            operation: "createZip",
                                            path: destination
                                        })
                                ),
                                Effect.asVoid
                            ),
                    extractZip: (archive: string, destination: string) =>
                        runner
                            .run("tar", [ "-xf", archive, "-C", destination ])
                            .pipe(
                                Effect.mapError(
                                    (cause: DocsProcessError) =>
                                        new DocsArchiveError({
                                            cause,
                                            operation: "extractZip",
                                            path: archive
                                        })
                                ),
                                Effect.asVoid
                            )
                });
            })
        ).pipe(Layer.provide(CommandRunner.layer));
}
/** @internal */
export interface RetryOptions {
    readonly maxRetries?: number;
    readonly delay?: `${number} ${"millis" | "seconds"}`;
}
/** @internal */
export class NetworkRetry extends Context.Service<
    NetworkRetry,
    {
        readonly run: <Value, Error, Requirements>(
            effect: Effect.Effect<Value, Error, Requirements>,
            isRetryable: (error: Error) => boolean,
            options?: RetryOptions
        ) => Effect.Effect<Value, Error, Requirements>;
    }
>()("sorrell/docs-cli/NetworkRetry")
{
    static readonly layer: Layer.Layer<NetworkRetry, never, never> =
        Layer.succeed(
            NetworkRetry,
            NetworkRetry.of({
                run: <Value, Error, Requirements>(
                    effect: Effect.Effect<Value, Error, Requirements>,
                    isRetryable: (error: Error) => boolean,
                    options: RetryOptions | undefined
                ) =>
                    options?.delay === undefined
                        ? Effect.retry(effect, {
                            times: options?.maxRetries ?? 3,
                            while: isRetryable
                        })
                        : Effect.retry(effect, {
                            schedule: Schedule.exponential(
                                options.delay
                            ).pipe(
                                Schedule.upTo({
                                    times: options.maxRetries ?? 3
                                })
                            ),
                            while: isRetryable
                        })
            })
        );
}
