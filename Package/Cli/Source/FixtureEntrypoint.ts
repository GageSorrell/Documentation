/**
 * Minimal NodeRuntime-backed entrypoint used by CLI fixtures and examples.
 *
 * @module @sorrell/docs-cli/FixtureEntrypoint
 *
 * @file      FixtureEntrypoint.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { type FixtureInput, runFixtureCommand } from "./FixtureCommand.js";
import { Effect } from "effect";
import { runMain } from "./runtime.ts";
runMain(
    runFixtureCommand(process.argv.slice(2), (input: FixtureInput) =>
        Effect.logInfo("runtime-fixture", { ...input })
    )
);
