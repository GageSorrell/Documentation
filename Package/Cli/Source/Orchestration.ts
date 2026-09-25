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

import { Context, Effect, Layer } from "effect";
import { DocsStageError } from "./errors.js";

/** @internal */
export interface Stage<Value>
{
    readonly name: string;
    readonly run: Effect.Effect<Value, unknown>;
}

/** @internal */
export class AutomationOrchestrator extends Context.Service<
    AutomationOrchestrator,
    {
        readonly parallel: <Value>(
            effects: ReadonlyArray<Effect.Effect<Value, unknown>>,
            concurrency?: number
        ) => Effect.Effect<ReadonlyArray<Value>, unknown>;
        readonly sequential: <Value>(
            stages: ReadonlyArray<Stage<Value>>
        ) => Effect.Effect<ReadonlyArray<Value>, DocsStageError>;
    }
>()("sorrell/docs-cli/AutomationOrchestrator")
{
    static readonly layer: Layer.Layer<AutomationOrchestrator, never, never> =
        Layer.succeed(
            AutomationOrchestrator,
            AutomationOrchestrator.of({
                parallel: <Value>(
                    effects: ReadonlyArray<
                        Effect.Effect<Value, unknown, never>
                    >,
                    concurrency: number | undefined = 4
                ) => Effect.all(effects, { concurrency }),
                sequential: <Value>(stages: ReadonlyArray<Stage<Value>>) =>
                    stages.reduce<
                        Effect.Effect<ReadonlyArray<Value>, DocsStageError>
                    >(
                        (
                            program: Effect.Effect<
                                ReadonlyArray<Value>,
                                DocsStageError,
                                never
                            >,
                            stage: Stage<Value>
                        ) =>
                            program.pipe(
                                Effect.flatMap((values: ReadonlyArray<Value>) =>
                                    stage.run.pipe(
                                        Effect.map((value: Value) => [
                                            ...values,
                                            value
                                        ]),
                                        Effect.mapError(
                                            (cause: unknown) =>
                                                new DocsStageError({
                                                    cause,
                                                    stage: stage.name
                                                })
                                        )
                                    )
                                )
                            ),
                        Effect.succeed([])
                    )
            })
        );
}
