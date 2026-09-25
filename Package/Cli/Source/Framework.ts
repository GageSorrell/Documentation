/**
 *
 *
 * @module @sorrell/docs-cli/Framework
 *
 * @file      Framework.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { Effect, Layer } from "effect";
import { ManagedRuntime } from "effect";

/** @internal */
export interface PromiseHook<Value, Error, Requirements = never> {
    readonly run: (
        effect: Effect.Effect<Value, Error, Requirements>
    ) => Promise<Value>;
    readonly dispose: () => Promise<void>;
}

export/** @internal */
const makePromiseHook = <
    Requirements,
    LayerError,
    Value,
    Error
>(
    layer: Layer.Layer<Requirements, LayerError, never>
): PromiseHook<Value, Error, Requirements> =>
{
    const runtime = ManagedRuntime.make(layer);
    return {
        dispose: runtime.dispose,
        run: runtime.runPromise
    };
};
