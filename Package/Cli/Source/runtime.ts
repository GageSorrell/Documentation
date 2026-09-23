/**
 *
 *
 * @module @sorrell/docs-cli/Runtime
 *
 * @file      runtime.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Effect } from "effect";

export const nodeServicesLayer = NodeServices.layer;

export const provideNodeServices = <A, E, R>(program: Effect.Effect<A, E, R>) =>
    program.pipe(Effect.provide(NodeServices.layer));

export const runMain = NodeRuntime.runMain;
