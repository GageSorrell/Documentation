/**
 *
 *
 * @module @sorrell/docs-cli/Generation
 *
 * @file      Generation.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { AtomicWriter, DocsFileSystem, DocsPath } from "./services.js";
import { Context, Effect, Layer } from "effect";
import type {
    DocsAtomicWriteError,
    DocsFileSystemError} from "./errors.js";
import {
    DocsManifestError,
    DocsTargetError,
    DocsTemplateError
} from "./errors.js";

/** @internal */
export type TemplateValue =
    | string
    | number
    | boolean;

/** @internal */
export interface GeneratedManifestEntry
{
    readonly path: string;
    readonly checksum: string;
}

/** @internal */
export interface GeneratedManifest
{
    readonly version: 1;
    readonly generatedAt: string;
    readonly entries: ReadonlyArray<GeneratedManifestEntry>;
}

export/** @internal */
const renderTemplate = (
    template: string,
    values: Readonly<Record<string, TemplateValue>>
): string =>
    template.replace(
        /\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g,
        (match: string, key: string) =>
        {
            const value = values[key];
            return value === undefined ? match : String(value);
        }
    );

const unresolvedPlaceholders = (content: string): ReadonlyArray<string> =>
    [ ...content.matchAll(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g) ].map(
        (match: RegExpExecArray) => match[1] ?? ""
    );

/** @internal */
export class TemplateRenderer extends Context.Service<
    TemplateRenderer,
    {
        readonly render: (
            template: string,
            values: Readonly<Record<string, TemplateValue>>
        ) => Effect.Effect<string, DocsTemplateError>;
        readonly renderFile: (
            source: string,
            target: string,
            values: Readonly<Record<string, TemplateValue>>
        ) => Effect.Effect<void, DocsTemplateError>;
    }
>()("sorrell/docs-cli/TemplateRenderer")
{
    static readonly layer: Layer.Layer<TemplateRenderer, never, never> =
        Layer.effect(
            TemplateRenderer,
            Effect.gen(function* ()
            {
                const fileSystem = yield* DocsFileSystem;
                const atomicWriter = yield* AtomicWriter;
                const render = (
                    template: string,
                    values: Readonly<Record<string, TemplateValue>>
                ) =>
                    Effect.try({
                        catch: (cause: unknown) =>
                            new DocsTemplateError({
                                cause,
                                path: "<template>"
                            }),
                        try: () =>
                        {
                            const result = renderTemplate(template, values);
                            const missing = unresolvedPlaceholders(result);
                            if (missing.length > 0)
                            {
                                throw new Error(
                                    `unresolved placeholders: ${missing.join(", ")}`
                                );
                            }
                            return result;
                        }
                    });
                return TemplateRenderer.of({
                    render,
                    renderFile: (
                        source: string,
                        target: string,
                        values: Readonly<Record<string, TemplateValue>>
                    ) =>
                        fileSystem.readText(source).pipe(
                            Effect.flatMap((template: string) =>
                                render(template, values)
                            ),
                            Effect.flatMap((content: string) =>
                                atomicWriter.writeText(target, content)
                            ),
                            Effect.mapError(
                                (
                                    cause:
                                        | DocsTemplateError
                                        | DocsFileSystemError
                                        | DocsAtomicWriteError
                                ) =>
                                    cause instanceof DocsTemplateError
                                        ? new DocsTemplateError({
                                            cause,
                                            path: source
                                        })
                                        : new DocsTemplateError({
                                            cause,
                                            path: target
                                        })
                            )
                        )
                });
            })
        ).pipe(
            Layer.provide(
                Layer.mergeAll(DocsFileSystem.layer, AtomicWriter.layer)
            )
        );
}

/** @internal */
export class SafeTargetValidation extends Context.Service<
    SafeTargetValidation,
    {
        readonly validateEmpty: (
            target: string,
            parent?: string
        ) => Effect.Effect<string, DocsTargetError>;
    }
>()("sorrell/docs-cli/SafeTargetValidation")
{
    static readonly layer: Layer.Layer<SafeTargetValidation, never, never> =
        Layer.effect(
            SafeTargetValidation,
            Effect.gen(function* ()
            {
                const fileSystem = yield* DocsFileSystem;
                const path = yield* DocsPath;
                return SafeTargetValidation.of({
                    validateEmpty: (
                        target: string,
                        parent: string | undefined
                    ) =>
                        Effect.gen(function* ()
                        {
                            const resolvedTarget = path.resolve(target);
                            const root = path.resolve(
                                parent ?? path.dirname(resolvedTarget)
                            );
                            if (resolvedTarget === root)
                            {
                                return yield* Effect.fail(
                                    new DocsTargetError({
                                        reason: "target cannot be the containing directory",
                                        target: resolvedTarget
                                    })
                                );
                            }
                            const relativeTarget = resolvedTarget.slice(
                                root.length
                            );
                            if (
                                parent !== undefined &&
                                relativeTarget.length > 0 &&
                                !/^[\\/]/.test(relativeTarget)
                            )
                            {
                                return yield* Effect.fail(
                                    new DocsTargetError({
                                        reason: "target must remain inside the requested parent",
                                        target: resolvedTarget
                                    })
                                );
                            }
                            if (yield* fileSystem.exists(resolvedTarget))
                            {
                                const entries =
                                    yield* fileSystem.readDirectory(
                                        resolvedTarget
                                    );
                                if (entries.length > 0)
                                {
                                    return yield* Effect.fail(
                                        new DocsTargetError({
                                            reason: "target must be empty",
                                            target: resolvedTarget
                                        })
                                    );
                                }
                            }
                            return resolvedTarget;
                        }).pipe(
                            Effect.mapError(
                                (
                                    cause:
                                        | DocsFileSystemError
                                        | DocsTargetError
                                ) =>
                                    cause instanceof DocsTargetError
                                        ? cause
                                        : new DocsTargetError({
                                            reason: String(cause),
                                            target
                                        })
                            )
                        )
                });
            })
        ).pipe(
            Layer.provide(Layer.mergeAll(DocsFileSystem.layer, DocsPath.layer))
        );
}

/** @internal */
export class AtomicDirectoryPromotion extends Context.Service<
    AtomicDirectoryPromotion,
    {
        readonly promote: (
            staging: string,
            target: string
        ) => Effect.Effect<void, DocsTargetError>;
    }
>()("sorrell/docs-cli/AtomicDirectoryPromotion")
{
    static readonly layer: Layer.Layer<AtomicDirectoryPromotion, never, never> =
        Layer.effect(
            AtomicDirectoryPromotion,
            Effect.gen(function* ()
            {
                const fileSystem = yield* DocsFileSystem;
                return AtomicDirectoryPromotion.of({
                    promote: (staging: string, target: string) =>
                        Effect.gen(function* ()
                        {
                            if (yield* fileSystem.exists(target))
                            {
                                return yield* Effect.fail(
                                    new DocsTargetError({
                                        reason: "promotion target already exists",
                                        target
                                    })
                                );
                            }
                            yield* fileSystem.rename(staging, target).pipe(
                                Effect.mapError(
                                    (cause: DocsFileSystemError) =>
                                        new DocsTargetError({
                                            reason: `atomic promotion failed: ${String(cause)}`,
                                            target
                                        })
                                )
                            );
                        }).pipe(
                            Effect.mapError(
                                (
                                    cause:
                                        | DocsFileSystemError
                                        | DocsTargetError
                                ) =>
                                    cause instanceof DocsTargetError
                                        ? cause
                                        : new DocsTargetError({
                                            reason: String(cause),
                                            target
                                        })
                            )
                        )
                });
            })
        ).pipe(Layer.provide(DocsFileSystem.layer));
}

/** @internal */
export class ManifestTracker extends Context.Service<
    ManifestTracker,
    {
        readonly read: (
            path: string
        ) => Effect.Effect<GeneratedManifest, DocsManifestError>;
        readonly write: (
            path: string,
            manifest: GeneratedManifest
        ) => Effect.Effect<void, DocsManifestError>;
    }
>()("sorrell/docs-cli/ManifestTracker")
{
    static readonly layer: Layer.Layer<ManifestTracker, never, never> =
        Layer.effect(
            ManifestTracker,
            Effect.gen(function* ()
            {
                const fileSystem = yield* DocsFileSystem;
                const atomicWriter = yield* AtomicWriter;
                const read = (path: string) =>
                    fileSystem.readText(path).pipe(
                        Effect.flatMap((text: string) =>
                            Effect.try({
                                catch: (cause: unknown) =>
                                    new DocsManifestError({ cause, path }),
                                try: () =>
                                    JSON.parse(text) as GeneratedManifest
                            })
                        ),
                        Effect.mapError(
                            (cause: DocsFileSystemError | DocsManifestError) =>
                                cause instanceof DocsManifestError
                                    ? cause
                                    : new DocsManifestError({ cause, path })
                        )
                    );

                return ManifestTracker.of({
                    read,
                    write: (path: string, manifest: GeneratedManifest) =>
                        atomicWriter
                            .writeText(path, JSON.stringify(manifest, null, 2))
                            .pipe(
                                Effect.mapError(
                                    (cause: DocsAtomicWriteError) =>
                                        new DocsManifestError({ cause, path })
                                )
                            )
                });
            })
        ).pipe(
            Layer.provide(
                Layer.mergeAll(DocsFileSystem.layer, AtomicWriter.layer)
            )
        );
}
