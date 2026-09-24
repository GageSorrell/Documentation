/**
 * Executable entrypoint for `sorrell-docs`.
 *
 * @module @sorrell/docs-create-website/bin
 *
 * @file      bin.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { runMain } from "@sorrell/docs-cli";
import { runDocsCli } from "./Cli.js";

runMain(runDocsCli(process.argv.slice(2)));
