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

/** @module @sorrell/docs-cli/Integrations */

import { Context, Effect, Layer, Schedule } from "effect";
import { DocsArchiveError, DocsIntegrationError } from "./errors.js";
import { CommandRunner } from "./services.js";

export interface GitStatus {
    readonly clean: boolean;
    readonly output: string;
}

export class GitService extends Context.Service<GitService, {
    readonly revision: (directory: string) => Effect.Effect<string, DocsIntegrationError>;
    readonly remote: (directory: string, remote?: string) => Effect.Effect<string, DocsIntegrationError>;
    readonly status: (directory: string) => Effect.Effect<GitStatus, DocsIntegrationError>;
}>()("sorrell/docs-cli/GitService") {
    static readonly layer = Layer.effect(
        GitService,
        Effect.gen(function*() {
            const runner = yield* CommandRunner;
            const run = (directory: string, args: ReadonlyArray<string>, operation: string) => runner.run("git", args, { cwd: directory }).pipe(
                Effect.mapError((cause) => new DocsIntegrationError({ provider: "git", operation, cause }))
            );
            return GitService.of({
                revision: (directory) => run(directory, [ "rev-parse", "HEAD" ], "revision").pipe(Effect.map((result) => result.stdout.trim())),
                remote: (directory, remote = "origin") => run(directory, [ "remote", "get-url", remote ], "remote").pipe(Effect.map((result) => result.stdout.trim())),
                status: (directory) => run(directory, [ "status", "--porcelain" ], "status").pipe(Effect.map((result) => ({ clean: result.stdout.trim() === "", output: result.stdout })))
            });
        })
    ).pipe(Layer.provide(CommandRunner.layer));
}

export class GitHubService extends Context.Service<GitHubService, {
    readonly createRepository: (name: string, directory: string, options?: { readonly visibility?: "public" | "private"; readonly description?: string }) => Effect.Effect<string, DocsIntegrationError>;
    readonly viewRepository: (repository: string) => Effect.Effect<string, DocsIntegrationError>;
}>()("sorrell/docs-cli/GitHubService") {
    static readonly layer = Layer.effect(
        GitHubService,
        Effect.gen(function*() {
            const runner = yield* CommandRunner;
            const run = (args: ReadonlyArray<string>, operation: string, cwd?: string) => runner.run("gh", args, cwd === undefined ? undefined : { cwd }).pipe(
                Effect.mapError((cause) => new DocsIntegrationError({ provider: "github", operation, cause }))
            );
            return GitHubService.of({
                createRepository: (name, directory, options) => run([
                    "repo",
                    "create",
                    name,
                    options?.visibility === "private" ? "--private" : "--public",
                    ...(options?.description === undefined ? [] : [ "--description", options.description ]),
                    "--source",
                    directory,
                    "--push"
                ], "createRepository", directory).pipe(Effect.map((result) => result.stdout.trim())),
                viewRepository: (repository) => run([ "repo", "view", repository, "--json", "url", "--jq", ".url" ], "viewRepository").pipe(Effect.map((result) => result.stdout.trim()))
            });
        })
    ).pipe(Layer.provide(CommandRunner.layer));
}

export class VercelService extends Context.Service<VercelService, {
    readonly deploy: (directory: string, options?: { readonly production?: boolean }) => Effect.Effect<string, DocsIntegrationError>;
    readonly inspect: (deployment: string) => Effect.Effect<string, DocsIntegrationError>;
    readonly promote: (deployment: string) => Effect.Effect<void, DocsIntegrationError>;
    readonly rollback: (deployment?: string) => Effect.Effect<void, DocsIntegrationError>;
    readonly remove: (deployment: string) => Effect.Effect<void, DocsIntegrationError>;
}>()("sorrell/docs-cli/VercelService") {
    static readonly layer = Layer.effect(
        VercelService,
        Effect.gen(function*() {
            const runner = yield* CommandRunner;
            const run = (args: ReadonlyArray<string>, operation: string, cwd?: string) => runner.run("vercel", args, cwd === undefined ? undefined : { cwd }).pipe(
                Effect.mapError((cause) => new DocsIntegrationError({ provider: "vercel", operation, cause }))
            );
            return VercelService.of({
                deploy: (directory, options) => run([ "deploy", ...(options?.production === true ? [ "--prod" ] : []), "--yes" ], "deploy", directory).pipe(Effect.map((result) => result.stdout.trim())),
                inspect: (deployment) => run([ "inspect", deployment ], "inspect").pipe(Effect.map((result) => result.stdout.trim())),
                promote: (deployment) => run([ "promote", deployment, "--yes" ], "promote").pipe(Effect.asVoid),
                rollback: (deployment) => run([ "rollback", ...(deployment === undefined ? [] : [ deployment ]), "--yes" ], "rollback").pipe(Effect.asVoid),
                remove: (deployment) => run([ "remove", deployment, "--yes" ], "remove").pipe(Effect.asVoid)
            });
        })
    ).pipe(Layer.provide(CommandRunner.layer));
}

export class ArchiveService extends Context.Service<ArchiveService, {
    readonly createTar: (sourceDirectory: string, destination: string) => Effect.Effect<void, DocsArchiveError>;
}>()("sorrell/docs-cli/ArchiveService") {
    static readonly layer = Layer.effect(
        ArchiveService,
        Effect.gen(function*() {
            const runner = yield* CommandRunner;
            return ArchiveService.of({
                createTar: (sourceDirectory, destination) => runner.run("tar", [ "-cf", destination, "-C", sourceDirectory, "." ]).pipe(
                    Effect.mapError((cause) => new DocsArchiveError({ operation: "createTar", path: destination, cause })),
                    Effect.asVoid
                )
            });
        })
    ).pipe(Layer.provide(CommandRunner.layer));
}

export interface RetryOptions {
    readonly maxRetries?: number;
    readonly delay?: `${number} ${"millis" | "seconds"}`;
}

export class NetworkRetry extends Context.Service<NetworkRetry, {
    readonly run: <Value, Error, Requirements>(
        effect: Effect.Effect<Value, Error, Requirements>,
        isRetryable: (error: Error) => boolean,
        options?: RetryOptions
    ) => Effect.Effect<Value, Error, Requirements>;
}>()("sorrell/docs-cli/NetworkRetry") {
    static readonly layer = Layer.succeed(
        NetworkRetry,
        NetworkRetry.of({
            run: (effect, isRetryable, options) => options?.delay === undefined
                ? Effect.retry(effect, { times: options?.maxRetries ?? 3, while: isRetryable })
                : Effect.retry(effect, {
                    schedule: Schedule.exponential(options.delay).pipe(
                        Schedule.upTo({ times: options.maxRetries ?? 3 })
                    ),
                    while: isRetryable
                })
        })
    );
}
