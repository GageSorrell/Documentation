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

import { NodeServices } from "@effect/platform-node";
import { Console, Effect, Layer, Option } from "effect";
import { Argument, Command, Flag } from "effect/unstable/cli";
import { VercelService, docsAutomationLayer } from "@sorrell/docs-cli";
import { SkillInstaller, skillsLayer, type SkillAgent, type SkillScope } from "@sorrell/docs-skills";
import { buildWebsite, devWebsite, readGeneratedWebsite, verifyWebsite } from "./Build.js";
import { deployWebsite, writeReleaseManifest } from "./Deployment.js";
import { createGeneratedWebsite, writeGeneratedWebsite } from "./Generator.js";
import { devNativeApp, generateNativeApp, verifyNativeApp } from "./NativeBuild.js";
import { createNativeStorybookApp, writeNativeAuthoringFile, writeNativeStorybookApp } from "./NativeGenerator.js";
import type { NativeAuthoringKind } from "./NativeTypes.js";

const targetFlag = Flag.String("target").pipe(Flag.withDefault("."));
const storybookFlag = Flag.Boolean("storybook").pipe(Flag.withDefault(false));

const init = Command.make("init", { target: targetFlag, storybook: storybookFlag }, ({ target, storybook }) => writeGeneratedWebsite(createGeneratedWebsite({ target, config: { storybook: { enabled: storybook } } })));
const build = Command.make("build", { target: targetFlag }, ({ target }) => buildWebsite(target));
const dev = Command.make("dev", { target: targetFlag }, ({ target }) => devWebsite(target));
const verify = Command.make("verify", { target: targetFlag }, ({ target }) => verifyWebsite(target));
const deployWebsiteCommand = (name: "preview" | "production", production: boolean) => Command.make(name, { target: targetFlag }, ({ target }) => buildWebsite(target).pipe(Effect.flatMap(() => verifyWebsite(target)), Effect.flatMap(() => readGeneratedWebsite(target)), Effect.flatMap((website) => deployWebsite(website, { production })), Effect.flatMap((manifest) => writeReleaseManifest(target, manifest)), Effect.provide(docsAutomationLayer), Effect.asVoid));
const rollback = Command.make("rollback", { deployment: Argument.String("deployment").pipe(Argument.optional) }, ({ deployment }) => Effect.gen(function*() {
    const vercel = yield* VercelService;
    yield* vercel.rollback(Option.isSome(deployment) ? deployment.value : undefined);
}).pipe(Effect.provide(docsAutomationLayer)));
const deploy = Command.make("deploy").pipe(Command.withSubcommands([ deployWebsiteCommand("preview", false), deployWebsiteCommand("production", true), rollback ]));
const api = Command.make("api").pipe(Command.withSubcommands([
    Command.make("generate", { target: targetFlag }, ({ target }) => buildWebsite(target)),
    Command.make("validate", { target: targetFlag }, ({ target }) => readGeneratedWebsite(target).pipe(Effect.asVoid))
]));
const storybook = Command.make("storybook").pipe(Command.withSubcommands([
    Command.make("init", { target: targetFlag }, ({ target }) => writeGeneratedWebsite(createGeneratedWebsite({ target, config: { storybook: { enabled: true } } }))),
    Command.make("build", { target: targetFlag }, ({ target }) => buildWebsite(target)),
    Command.make("verify", { target: targetFlag }, ({ target }) => verifyWebsite(target))
]));

const skillAgentFlag = Flag.Literals("agent", [ "codex", "claude" ] as const).pipe(Flag.withDefault("codex"));
const skillScopeFlag = Flag.Literals("scope", [ "project", "user" ] as const).pipe(Flag.withDefault("project"));
const skillNameArgument = Argument.String("skill");
const skillOptions = (target: string, agent: SkillAgent, scope: SkillScope) => ({
    agent,
    scope,
    projectDirectory: target
});
const skillsList = Command.make("list", { target: targetFlag, agent: skillAgentFlag, scope: skillScopeFlag }, ({ target, agent, scope }) => Effect.gen(function*() {
    const installer = yield* SkillInstaller;
    const installed = yield* installer.listInstalled(skillOptions(target, agent, scope));
    const installedNames = new Set(installed.map((skill) => skill.name));
    yield* Console.log(installer.listAvailable().map((skill) => `${installedNames.has(skill.name) ? "installed" : "available"}  ${skill.name}  ${skill.description}`).join("\n"));
}));
const skillsInstall = Command.make("install", { skill: skillNameArgument, target: targetFlag, agent: skillAgentFlag, scope: skillScopeFlag }, ({ skill, target, agent, scope }) => Effect.gen(function*() {
    const installer = yield* SkillInstaller;
    const installed = yield* installer.install(skill, skillOptions(target, agent, scope));
    yield* Console.log(`Installed ${installed.name} at ${installed.directory}`);
}));
const skillsUpdate = Command.make("update", { skill: skillNameArgument, target: targetFlag, agent: skillAgentFlag, scope: skillScopeFlag }, ({ skill, target, agent, scope }) => Effect.gen(function*() {
    const installer = yield* SkillInstaller;
    const installed = yield* installer.update(skill, skillOptions(target, agent, scope));
    yield* Console.log(`Updated ${installed.name} at ${installed.directory}`);
}));
const skillsUninstall = Command.make("uninstall", { skill: skillNameArgument, target: targetFlag, agent: skillAgentFlag, scope: skillScopeFlag }, ({ skill, target, agent, scope }) => Effect.gen(function*() {
    const installer = yield* SkillInstaller;
    yield* installer.uninstall(skill, skillOptions(target, agent, scope));
    yield* Console.log(`Uninstalled ${skill}`);
}));
const skills = Command.make("skills").pipe(Command.withSubcommands([ skillsList, skillsInstall, skillsUpdate, skillsUninstall ]));

const nativeKindFlag = Flag.String("kind").pipe(Flag.withDefault("development"));
const nativeNameFlag = Flag.String("name").pipe(Flag.withDefault("Welcome"));
const nativePlatformFlag = Flag.String("platform").pipe(Flag.withDefault("all"));
const storyInit = Command.make("init", { target: targetFlag, kind: nativeKindFlag, name: nativeNameFlag }, ({ target, kind, name }) => writeNativeStorybookApp(createNativeStorybookApp({ target, kind: kind === "demonstration" ? "demonstration" : "development", name })));
const storyDev = Command.make("dev", { target: targetFlag }, ({ target }) => devNativeApp(target));
const storyGenerate = Command.make("generate", { target: targetFlag, platform: nativePlatformFlag }, ({ target, platform }) => generateNativeApp(target, platform === "android" || platform === "ios" || platform === "web" ? platform : "all"));
const storyVerify = Command.make("verify", { target: targetFlag }, ({ target }) => verifyNativeApp(target));
const storyAdd = (kind: NativeAuthoringKind) => Command.make(kind, { target: targetFlag, name: nativeNameFlag }, ({ target, name }) => writeNativeAuthoringFile({ target, name, kind }));
const story = Command.make("story").pipe(Command.withSubcommands([
    storyInit,
    storyDev,
    storyGenerate,
    storyVerify,
    Command.make("add").pipe(Command.withSubcommands([ storyAdd("story"), storyAdd("example"), storyAdd("article") ]))
]));

export const docsCommand = Command.make("sorrell-docs").pipe(Command.withSubcommands([ init, dev, build, verify, deploy, api, storybook, story, skills ]));

export const runDocsCli = (args: ReadonlyArray<string>) => Command.runWith(docsCommand, { version: "0.1.0", renderErrors: false })(args).pipe(Effect.provide(Layer.mergeAll(NodeServices.layer, docsAutomationLayer, skillsLayer)));
