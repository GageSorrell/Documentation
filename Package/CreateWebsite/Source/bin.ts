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

import { runDocsCli } from "./Cli.js";
import { runMain } from "@sorrell/docs-cli";
runMain(runDocsCli(process.argv.slice(2)));
