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

/** @module @sorrell/docs-cli/Framework */

import { Effect, ManagedRuntime, Layer } from "effect";

export interface PromiseHook<Value, Error, Requirements = never> {
    readonly run: (effect: Effect.Effect<Value, Error, Requirements>) => Promise<Value>;
    readonly dispose: () => Promise<void>;
}

export const makePromiseHook = <Requirements, LayerError, Value, Error>(
    layer: Layer.Layer<Requirements, LayerError, never>
): PromiseHook<Value, Error, Requirements> => {
    const runtime = ManagedRuntime.make(layer);
    return {
        run: (effect) => runtime.runPromise(effect),
        dispose: () => runtime.dispose()
    };
};
