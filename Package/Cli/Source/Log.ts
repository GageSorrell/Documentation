/**
 *
 *
 * @module @sorrell/docs-cli/Logging
 *
 * @file      Log.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Effect } from "effect";

/** @internal */
export interface LogFields extends Readonly<Record<string, boolean | number | string>> { }

export/** @internal */
const logEvent = (
    event: string,
    fields: LogFields = { }
) => Effect.logInfo(event).pipe(Effect.annotateLogs(fields));
