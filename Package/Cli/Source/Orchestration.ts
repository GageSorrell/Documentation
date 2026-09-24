/**
 *
 *
 * @module @sorrell/docs-cli/Orchestration
 *
 * @file      Orchestration.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** @module @sorrell/docs-cli/Orchestration */

import { Context, Effect, Layer } from "effect";
import { DocsStageError } from "./errors.js";

export interface Stage<Value> {
    readonly name: string;
    readonly run: Effect.Effect<Value, unknown>;
}

export class AutomationOrchestrator extends Context.Service<AutomationOrchestrator, {
    readonly parallel: <Value>(effects: ReadonlyArray<Effect.Effect<Value, unknown>>, concurrency?: number) => Effect.Effect<ReadonlyArray<Value>, unknown>;
    readonly sequential: <Value>(stages: ReadonlyArray<Stage<Value>>) => Effect.Effect<ReadonlyArray<Value>, DocsStageError>;
}>()("sorrell/docs-cli/AutomationOrchestrator") {
    static readonly layer = Layer.succeed(
        AutomationOrchestrator,
        AutomationOrchestrator.of({
            parallel: (effects, concurrency = 4) => Effect.all(effects, { concurrency }),
            sequential: <Value>(stages: ReadonlyArray<Stage<Value>>) => stages.reduce<Effect.Effect<ReadonlyArray<Value>, DocsStageError>>(
                (program, stage) => program.pipe(
                    Effect.flatMap((values) => stage.run.pipe(
                        Effect.map((value) => [ ...values, value ]),
                        Effect.mapError((cause) => new DocsStageError({ stage: stage.name, cause }))
                    ))
                ),
                Effect.succeed([])
            )
        })
    );
}
