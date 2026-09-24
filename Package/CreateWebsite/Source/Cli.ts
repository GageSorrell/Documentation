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
import { Effect, Layer, Option } from "effect";
import { Argument, Command, Flag } from "effect/unstable/cli";
import { VercelService, docsAutomationLayer } from "@sorrell/docs-cli";
import { buildWebsite, devWebsite, readGeneratedWebsite, verifyWebsite } from "./Build.js";
import { deployWebsite, writeReleaseManifest } from "./Deployment.js";
import { createGeneratedWebsite, writeGeneratedWebsite } from "./Generator.js";

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

export const docsCommand = Command.make("sorrell-docs").pipe(Command.withSubcommands([ init, dev, build, verify, deploy, api, storybook ]));

export const runDocsCli = (args: ReadonlyArray<string>) => Command.runWith(docsCommand, { version: "0.1.0", renderErrors: false })(args).pipe(Effect.provide(Layer.mergeAll(NodeServices.layer, docsAutomationLayer)));
