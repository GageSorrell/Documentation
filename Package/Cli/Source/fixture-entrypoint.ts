/**
 *
 *
 * @module @sorrell/docs-cli/FixtureEntrypoint
 *
 * @file      fixture-entrypoint.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/**
 * Minimal NodeRuntime-backed entrypoint used by CLI fixtures and examples.
 *
 * @file      fixture-entrypoint.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Effect } from "effect";
import { runFixtureCommand } from "./fixture-command.js";
import { runMain } from "./runtime.js";

runMain(runFixtureCommand(process.argv.slice(2), (input) =>
    Effect.logInfo("runtime-fixture", { ...input })
));
