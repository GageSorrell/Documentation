/**
 * The public `sorrell-docs` command tree for generated websites.
 *
 * @module @sorrell/docs-create-website/Cli
 *
 * @file      Cli.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Argument, Command, Flag } from "effect/unstable/cli";
import { Console, Effect, Layer, Option } from "effect";
import { DeploymentEnvironment, docsAutomationLayer } from "@sorrell/docs-cli";
import {
    type InstalledSkill,
    type SkillAgent,
    type SkillDefinition,
    SkillInstaller,
    type SkillScope,
    skillsLayer
} from "@sorrell/docs-skills";
import { buildAgentOutput, verifyAgentOutput } from "./AgentOutput.js";
import {
    buildWebsite,
    devWebsite,
    readGeneratedWebsite,
    verifyWebsite
} from "./Build.js";
import {
    cleanupWebsiteDeployments,
    deployWebsite,
    promoteWebsite,
    rollbackWebsite,
    verifyWebsiteDeployment,
    writeReleaseManifest
} from "./Deployment.js";
import { createGeneratedWebsite, writeGeneratedWebsite } from "./Generator.js";
import {
    createNativeStorybookApp,
    writeNativeAuthoringFile,
    writeNativeStorybookApp
} from "./NativeGenerator.js";
import {
    devNativeApp,
    generateNativeApp,
    verifyNativeApp
} from "./NativeBuild.js";
import type { NativeAuthoringKind } from "./NativeTypes.js";
import { NodeServices } from "@effect/platform-node";
import type { ProductSkillResult } from "./ProductSkill.js";
import { buildPackageProductSkill } from "./ProductSkill.js";
import { runMcpSource } from "./McpSource.js";
import { readFile } from "node:fs/promises";
const targetFlag = Flag.String("target").pipe(Flag.withDefault("."));
const storybookFlag = Flag.Boolean("storybook").pipe(Flag.withDefault(false));
const configFlag = Flag.String("config").pipe(Flag.withDefault("docs.config.json"));
const packageIdFlag = Flag.String("package");
const outputDirectoryFlag = Flag.String("out");
const mcpSourceFlag = Flag.String("source").pipe(Flag.withDefault("."));
const createWebsite = ({
    target,
    storybook
}: {
    readonly storybook: boolean;
    readonly target: string;
}) =>
    writeGeneratedWebsite(
        createGeneratedWebsite({
            config: { storybook: { enabled: storybook } },
            target
        })
    );
const create = Command.make(
    "create",
    { config: configFlag, target: targetFlag },
    ({ config, target }: { readonly config: string; readonly target: string }) =>
        Effect.gen(function* ()
        {
            const input = yield* Effect.tryPromise({
                catch: (cause: unknown) => cause,
                try: () => readFile(config, "utf8")
            }).pipe(
                Effect.flatMap((text) =>
                    Effect.try({
                        catch: (cause: unknown) => cause,
                        try: () => JSON.parse(text)
                    })
                )
            );
            yield* writeGeneratedWebsite(
                createGeneratedWebsite({ config: input, target })
            );
        })
);
const init = Command.make(
    "init",
    { storybook: storybookFlag, target: targetFlag },
    createWebsite
);
const build = Command.make(
    "build",
    { target: targetFlag },
    ({ target }: { readonly target: string }) => buildWebsite(target)
);
const dev = Command.make(
    "dev",
    { target: targetFlag },
    ({ target }: { readonly target: string }) => devWebsite(target)
);
const verify = Command.make(
    "verify",
    { target: targetFlag },
    ({ target }: { readonly target: string }) => verifyWebsite(target)
);
const agent = Command.make("agent").pipe(
    Command.withSubcommands([
        Command.make(
            "build",
            { target: targetFlag },
            ({ target }: { readonly target: string }) =>
                buildAgentOutput(target).pipe(Effect.asVoid)
        ),
        Command.make(
            "verify",
            { target: targetFlag },
            ({ target }: { readonly target: string }) =>
                verifyAgentOutput(target)
        ),
        Command.make(
            "skill",
            {
                out: outputDirectoryFlag,
                package: packageIdFlag,
                target: targetFlag
            },
            ({
                target,
                package: packageId,
                out
            }: {
                readonly out: string;
                readonly package: string;
                readonly target: string;
            }) =>
                buildPackageProductSkill(target, packageId, out).pipe(
                    Effect.tap((result: ProductSkillResult) =>
                        Console.log(
                            `Generated ${result.artifact.name} at ${out}`
                        )
                    ),
                    Effect.asVoid
                )
        ),
        Command.make(
            "mcp",
            { source: mcpSourceFlag },
            ({ source }: { readonly source: string }) => runMcpSource(source)
        )
    ])
);
const deployWebsiteCommand = (
    name: "preview" | "production",
    production: boolean
) =>
    Command.make(
        name,
        { target: targetFlag },
        ({ target }: { readonly target: string }) =>
            Effect.gen(function* ()
            {
                const environment = yield* DeploymentEnvironment;
                yield* environment.requireVercel;
                yield* buildWebsite(target);
                yield* verifyWebsite(target);
                const website = yield* readGeneratedWebsite(target);
                const manifest = yield* deployWebsite(website, { production });
                const verification = yield* verifyWebsiteDeployment(
                    manifest
                ).pipe(Effect.result);
                if (verification._tag === "Failure")
                {
                    yield* cleanupWebsiteDeployments(manifest);
                    return yield* Effect.fail(verification.failure);
                }
                if (production)
                {
                    yield* promoteWebsite(manifest);
                }
                yield* writeReleaseManifest(target, manifest);
                if (manifest.mcpEndpoint !== undefined)
                {
                    yield* Console.log(
                        `MCP endpoint: ${manifest.mcpEndpoint} ` +
                            "(ensure DNS points to the MCP Vercel project alias)"
                    );
                }
                const publishedDeployments = [
                    {
                        label: "Documentation",
                        target: manifest.deployments.documentation
                    },
                    ...(manifest.deployments.storybook === undefined
                        ? []
                        : [
                            {
                                label: "Storybook",
                                target: manifest.deployments.storybook
                            }
                        ]),
                    ...(manifest.deployments.mcp === undefined
                        ? []
                        : [
                            {
                                label: "MCP",
                                target: manifest.deployments.mcp
                            }
                        ]),
                    {
                        label: "Landing",
                        target: manifest.deployments.landing
                    }
                ];
                yield* Console.log(
                    [
                        `${production ? "Published" : "Deployed preview"} ${manifest.releaseId}`,
                        ...publishedDeployments.map(
                            ({ label, target: deployment }) =>
                                `  ${label}${deployment.project === undefined ? "" : ` (${deployment.project})`}: ${deployment.url}`
                        )
                    ].join("\n")
                );
            }).pipe(Effect.provide(docsAutomationLayer), Effect.asVoid)
    );
const rollback = Command.make(
    "rollback",
    {
        deployment: Argument.String("deployment").pipe(Argument.optional),
        target: targetFlag
    },
    ({
        target,
        deployment
    }: {
        readonly deployment: Option.Option<string>;
        readonly target: string;
    }) =>
        Effect.gen(function* ()
        {
            const environment = yield* DeploymentEnvironment;
            yield* environment.requireVercel;
            const manifest = yield* rollbackWebsite(
                target,
                Option.isSome(deployment) ? deployment.value : undefined
            );
            yield* Console.log(`Rolled back to ${manifest.releaseId}`);
        }).pipe(Effect.provide(docsAutomationLayer))
);
const deploy = Command.make("deploy").pipe(
    Command.withSubcommands([
        deployWebsiteCommand("preview", false),
        deployWebsiteCommand("production", true),
        rollback
    ])
);
const api = Command.make("api").pipe(
    Command.withSubcommands([
        Command.make(
            "generate",
            { target: targetFlag },
            ({ target }: { readonly target: string }) => buildWebsite(target)
        ),
        Command.make(
            "validate",
            { target: targetFlag },
            ({ target }: { readonly target: string }) =>
                readGeneratedWebsite(target).pipe(Effect.asVoid)
        ),
        Command.make(
            "snapshot",
            { target: targetFlag },
            ({ target }: { readonly target: string }) => buildWebsite(target)
        ),
        Command.make(
            "restore",
            { target: targetFlag },
            ({ target }: { readonly target: string }) =>
                readGeneratedWebsite(target).pipe(Effect.asVoid)
        )
    ])
);
const storybook = Command.make("storybook").pipe(
    Command.withSubcommands([
        Command.make(
            "init",
            { target: targetFlag },
            ({ target }: { readonly target: string }) =>
                writeGeneratedWebsite(
                    createGeneratedWebsite({
                        config: { storybook: { enabled: true } },
                        target
                    })
                )
        ),
        Command.make(
            "build",
            { target: targetFlag },
            ({ target }: { readonly target: string }) => buildWebsite(target)
        ),
        Command.make(
            "verify",
            { target: targetFlag },
            ({ target }: { readonly target: string }) => verifyWebsite(target)
        )
    ])
);
const skillAgentFlag = Flag.Literals("agent", [
    "codex",
    "claude"
] as const).pipe(Flag.withDefault("codex"));
const skillScopeFlag = Flag.Literals("scope", [
    "project",
    "user"
] as const).pipe(Flag.withDefault("project"));
const skillNameArgument = Argument.String("skill");
const installSkillArgument = Argument.String("skill").pipe(Argument.optional);
const skillSourceFlag = Flag.String("from").pipe(Flag.optional);
const skillOptions = (
    target: string,
    agent: SkillAgent,
    scope: SkillScope
) => ({
    agent,
    projectDirectory: target,
    scope
});
const skillsList = Command.make(
    "list",
    { agent: skillAgentFlag, scope: skillScopeFlag, target: targetFlag },
    ({
        target,
        agent,
        scope
    }: {
        readonly agent: "codex" | "claude";
        readonly scope: "project" | "user";
        readonly target: string;
    }) =>
        Effect.gen(function* ()
        {
            const installer = yield* SkillInstaller;
            const installed = yield* installer.listInstalled(
                skillOptions(target, agent, scope)
            );
            const installedNames = new Set(
                installed.map((skill: InstalledSkill) => skill.name)
            );
            yield* Console.log(
                installer
                    .listAvailable()
                    .map(
                        (skill: SkillDefinition) =>
                            `${installedNames.has(skill.name) ? "installed" : "available"}  ` +
                            `${skill.name}  ${skill.description}`
                    )
                    .join("\n")
            );
        })
);
const skillsInstall = Command.make(
    "install",
    {
        agent: skillAgentFlag,
        from: skillSourceFlag,
        scope: skillScopeFlag,
        skill: installSkillArgument,
        target: targetFlag
    },
    ({
        skill,
        from,
        target,
        agent,
        scope
    }: {
        readonly agent: "codex" | "claude";
        readonly from: Option.Option<string>;
        readonly scope: "project" | "user";
        readonly skill: Option.Option<string>;
        readonly target: string;
    }) =>
        Effect.gen(function* ()
        {
            const installer = yield* SkillInstaller;
            const installed = Option.isSome(from)
                ? yield* installer.installFrom(
                    from.value,
                    skillOptions(target, agent, scope)
                )
                : Option.isSome(skill)
                    ? yield* installer.install(
                        skill.value,
                        skillOptions(target, agent, scope)
                    )
                    : yield* Effect.fail(
                        new Error(
                            "skills install requires a skill name or --from <directory|archive-url>"
                        )
                    );
            yield* Console.log(
                `Installed ${installed.name} at ${installed.directory}`
            );
        })
);
const skillsUpdate = Command.make(
    "update",
    {
        agent: skillAgentFlag,
        scope: skillScopeFlag,
        skill: skillNameArgument,
        target: targetFlag
    },
    ({
        skill,
        target,
        agent,
        scope
    }: {
        readonly agent: "codex" | "claude";
        readonly scope: "project" | "user";
        readonly skill: string;
        readonly target: string;
    }) =>
        Effect.gen(function* ()
        {
            const installer = yield* SkillInstaller;
            const installed = yield* installer.update(
                skill,
                skillOptions(target, agent, scope)
            );
            yield* Console.log(
                `Updated ${installed.name} at ${installed.directory}`
            );
        })
);
const skillsUninstall = Command.make(
    "uninstall",
    {
        agent: skillAgentFlag,
        scope: skillScopeFlag,
        skill: skillNameArgument,
        target: targetFlag
    },
    ({
        skill,
        target,
        agent,
        scope
    }: {
        readonly agent: "codex" | "claude";
        readonly scope: "project" | "user";
        readonly skill: string;
        readonly target: string;
    }) =>
        Effect.gen(function* ()
        {
            const installer = yield* SkillInstaller;
            yield* installer.uninstall(
                skill,
                skillOptions(target, agent, scope)
            );
            yield* Console.log(`Uninstalled ${skill}`);
        })
);
const skills = Command.make("skills").pipe(
    Command.withSubcommands([
        skillsList,
        skillsInstall,
        skillsUpdate,
        skillsUninstall
    ])
);
const nativeKindFlag = Flag.String("kind").pipe(
    Flag.withDefault("development")
);
const nativeNameFlag = Flag.String("name").pipe(Flag.withDefault("Welcome"));
const nativePlatformFlag = Flag.String("platform").pipe(
    Flag.withDefault("all")
);
const storyInit = Command.make(
    "init",
    { kind: nativeKindFlag, name: nativeNameFlag, target: targetFlag },
    ({
        target,
        kind,
        name
    }: {
        readonly kind: string;
        readonly name: string;
        readonly target: string;
    }) =>
        writeNativeStorybookApp(
            createNativeStorybookApp({
                kind:
                    kind === "demonstration" ? "demonstration" : "development",
                name,
                target
            })
        )
);
const storyDev = Command.make(
    "dev",
    { target: targetFlag },
    ({ target }: { readonly target: string }) => devNativeApp(target)
);
const storyGenerate = Command.make(
    "generate",
    { platform: nativePlatformFlag, target: targetFlag },
    ({
        target,
        platform
    }: {
        readonly platform: string;
        readonly target: string;
    }) =>
        generateNativeApp(
            target,
            platform === "android" || platform === "ios" || platform === "web"
                ? platform
                : "all"
        )
);
const storyVerify = Command.make(
    "verify",
    { target: targetFlag },
    ({ target }: { readonly target: string }) => verifyNativeApp(target)
);
const storyAdd = (kind: NativeAuthoringKind) =>
    Command.make(
        kind,
        { name: nativeNameFlag, target: targetFlag },
        ({
            target,
            name
        }: {
            readonly name: string;
            readonly target: string;
        }) => writeNativeAuthoringFile({ kind, name, target })
    );
const story = Command.make("story").pipe(
    Command.withSubcommands([
        storyInit,
        storyDev,
        storyGenerate,
        storyVerify,
        Command.make("add").pipe(
            Command.withSubcommands([
                storyAdd("story"),
                storyAdd("example"),
                storyAdd("article")
            ])
        )
    ])
);
export/** @internal */
const docsCommand = Command.make("sorrell-docs").pipe(
    Command.withSubcommands([
        create,
        init,
        dev,
        build,
        verify,
        deploy,
        api,
        agent,
        storybook,
        story,
        skills
    ])
);
export/** @internal */
const runDocsCli = (args: ReadonlyArray<string>) =>
    Command.runWith(docsCommand, { renderErrors: false, version: "1.0.1" })(
        args
    ).pipe(
        Effect.provide(
            Layer.mergeAll(
                NodeServices.layer,
                docsAutomationLayer,
                skillsLayer
            )
        )
    );
