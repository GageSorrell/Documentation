/**
 * Remove generated TypeScript output before a package build.
 *
 * @module @sorrell/docs-release/Script/Release/CleanBuild
 *
 * @file      CleanBuild.mjs
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { join } from "node:path";
import { rm } from "node:fs/promises";

await rm(join(process.cwd(), "Distribution"), {
    force: true,
    recursive: true
});
