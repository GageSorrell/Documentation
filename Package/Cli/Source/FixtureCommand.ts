/**
 *
 *
 * @module @sorrell/docs-cli/FixtureCommand
 *
 * @file      FixtureCommand.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Command, Flag } from "effect/unstable/cli";
import { Effect } from "effect";
import { NodeServices } from "@effect/platform-node";
import Package from "../package.json" with { type: "json" };
/** @internal */
export interface FixtureInput {
    readonly count: number;
    readonly name: string;
}
export/** @internal */
const makeFixtureCommand = (
    onRun: (input: FixtureInput) => Effect.Effect<void>
) =>
    Command.make(
        "runtime-fixture",
        {
            count: Flag.Int("count").pipe(Flag.withDefault(1)),
            name: Flag.String("name")
        },
        onRun
    );
export/** @internal */
const runFixtureCommand = (
    args: ReadonlyArray<string>,
    onRun: (input: FixtureInput) => Effect.Effect<void>
) =>
    Command.runWith(makeFixtureCommand(onRun), {
        renderErrors: false,
        version: Package.version
    })(args).pipe(Effect.provide(NodeServices.layer));
