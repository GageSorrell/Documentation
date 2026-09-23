/**
 *
 *
 * @module @sorrell/docs-cli/Logging
 *
 * @file      logging.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Effect } from "effect";

export type LogFields = Readonly<Record<string, boolean | number | string>>;

export const logEvent = (event: string, fields: LogFields = {}) =>
    Effect.logInfo(event).pipe(Effect.annotateLogs(fields));
