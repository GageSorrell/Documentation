/**
 * Validated CI and deployment environment configuration.
 *
 * @module @sorrell/docs-cli/Environment
 *
 * @file      Environment.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Config, Context, Effect, Layer, Option, type Redacted } from "effect";
import { DocsEnvironmentError } from "./errors.js";

/** @internal */
export interface VercelEnvironment {
    readonly token: Redacted.Redacted;
    readonly orgId: string;
    readonly projectId: string | undefined;
}
/** @internal */
export interface GitHubEnvironment {
    readonly token: Redacted.Redacted;
    readonly repository: string;
}
/** @internal */
export interface DeploymentEnvironmentSnapshot {
    readonly vercelTokenConfigured: boolean;
    readonly vercelOrgConfigured: boolean;
    readonly githubTokenConfigured: boolean;
    readonly githubRepositoryConfigured: boolean;
}
const config = Config.all({
    githubRepository: Config.option(Config.String("GITHUB_REPOSITORY")),
    githubToken: Config.option(Config.Redacted("GITHUB_TOKEN")),
    vercelOrgId: Config.option(Config.String("VERCEL_ORG_ID")),
    vercelProjectId: Config.option(Config.String("VERCEL_PROJECT_ID")),
    vercelToken: Config.option(Config.Redacted("VERCEL_TOKEN"))
});
const missing = (
    provider: "github" | "vercel",
    values: ReadonlyArray<readonly [ string, Option.Option<unknown> ]>
): Effect.Effect<never, DocsEnvironmentError> =>
{
    const names = values
        .filter(([ , value ]: readonly [string, Option.Option<unknown>]) =>
            Option.isNone(value)
        )
        .map(([ name ]: readonly [string, Option.Option<unknown>]) => name);
    return names.length === 0
        ? Effect.die("missing environment validation invariant")
        : Effect.fail(new DocsEnvironmentError({ missing: names, provider }));
};
/** @internal */
export class DeploymentEnvironment extends Context.Service<
    DeploymentEnvironment,
    {
        readonly snapshot: Effect.Effect<DeploymentEnvironmentSnapshot>;
        readonly requireVercel: Effect.Effect<
            VercelEnvironment,
            DocsEnvironmentError
        >;
        readonly requireGitHub: Effect.Effect<
            GitHubEnvironment,
            DocsEnvironmentError
        >;
    }
>()("sorrell/docs-cli/DeploymentEnvironment")
{
    static readonly layer: Layer.Layer<DeploymentEnvironment, never, never> =
        Layer.succeed(
            DeploymentEnvironment,
            DeploymentEnvironment.of({
                requireGitHub: config.pipe(
                    Effect.flatMap(
                        ({
                            githubToken,
                            githubRepository
                        }: {
                            githubRepository: Option.Option<string>;
                            githubToken: Option.Option<
                                Redacted.Redacted<string>
                            >;
                            vercelOrgId: Option.Option<string>;
                            vercelProjectId: Option.Option<string>;
                            vercelToken: Option.Option<
                                Redacted.Redacted<string>
                            >;
                        }) =>
                        {
                            if (
                                !Option.isSome(githubToken) ||
                                !Option.isSome(githubRepository)
                            )
                            {
                                return missing("github", [
                                    [ "GITHUB_TOKEN", githubToken ],
                                    [ "GITHUB_REPOSITORY", githubRepository ]
                                ]);
                            }
                            return Effect.succeed({
                                repository: githubRepository.value,
                                token: githubToken.value
                            });
                        }
                    ),
                    Effect.mapError(
                        () =>
                            new DocsEnvironmentError({
                                missing: [ "environment provider" ],
                                provider: "github"
                            })
                    )
                ),
                requireVercel: config.pipe(
                    Effect.flatMap(
                        ({
                            vercelToken,
                            vercelOrgId,
                            vercelProjectId
                        }: {
                            githubRepository: Option.Option<string>;
                            githubToken: Option.Option<
                                Redacted.Redacted<string>
                            >;
                            vercelOrgId: Option.Option<string>;
                            vercelProjectId: Option.Option<string>;
                            vercelToken: Option.Option<
                                Redacted.Redacted<string>
                            >;
                        }) =>
                        {
                            if (
                                !Option.isSome(vercelToken) ||
                                !Option.isSome(vercelOrgId)
                            )
                            {
                                return missing("vercel", [
                                    [ "VERCEL_TOKEN", vercelToken ],
                                    [ "VERCEL_ORG_ID", vercelOrgId ]
                                ]);
                            }
                            return Effect.succeed({
                                orgId: vercelOrgId.value,
                                projectId: Option.isSome(vercelProjectId)
                                    ? vercelProjectId.value
                                    : undefined,
                                token: vercelToken.value
                            });
                        }
                    ),
                    Effect.mapError(
                        () =>
                            new DocsEnvironmentError({
                                missing: [ "environment provider" ],
                                provider: "vercel"
                            })
                    )
                ),
                snapshot: config.pipe(
                    Effect.map(
                        ({
                            githubRepository,
                            githubToken,
                            vercelOrgId,
                            vercelToken
                        }: any) => ({
                            githubRepositoryConfigured:
                                Option.isSome(githubRepository),
                            githubTokenConfigured: Option.isSome(githubToken),
                            vercelOrgConfigured: Option.isSome(vercelOrgId),
                            vercelTokenConfigured: Option.isSome(vercelToken)
                        })
                    ),
                    Effect.catch(() =>
                        Effect.succeed({
                            githubRepositoryConfigured: false,
                            githubTokenConfigured: false,
                            vercelOrgConfigured: false,
                            vercelTokenConfigured: false
                        })
                    )
                )
            })
        );
}
