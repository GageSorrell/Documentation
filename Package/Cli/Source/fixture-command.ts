/**
 *
 *
 * @module @sorrell/docs-cli/FixtureCommand
 *
 * @file      fixture-command.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { NodeServices } from "@effect/platform-node";
import { Effect } from "effect";
import { Command, Flag } from "effect/unstable/cli";

export interface FixtureInput {
    readonly count: number;
    readonly name: string;
}

export const makeFixtureCommand = (onRun: (input: FixtureInput) => Effect.Effect<void>) =>
    Command.make(
        "runtime-fixture",
        {
            count: Flag.Int("count").pipe(Flag.withDefault(1)),
            name: Flag.String("name")
        },
        onRun
    );

export const runFixtureCommand = (
    args: ReadonlyArray<string>,
    onRun: (input: FixtureInput) => Effect.Effect<void>
) => Command.runWith(makeFixtureCommand(onRun), { version: "0.1.0", renderErrors: false })(args).pipe(
    Effect.provide(NodeServices.layer)
);
