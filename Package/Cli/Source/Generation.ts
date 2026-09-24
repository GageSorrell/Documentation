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

/** @module @sorrell/docs-cli/Generation */

import { Context, Effect, Layer } from "effect";
import { DocsManifestError, DocsTargetError, DocsTemplateError } from "./errors.js";
import { AtomicWriter, DocsFileSystem, DocsPath } from "./services.js";

export type TemplateValue = string | number | boolean;

export interface GeneratedManifestEntry {
    readonly path: string;
    readonly checksum: string;
}

export interface GeneratedManifest {
    readonly version: 1;
    readonly generatedAt: string;
    readonly entries: ReadonlyArray<GeneratedManifestEntry>;
}

export const renderTemplate = (
    template: string,
    values: Readonly<Record<string, TemplateValue>>
): string => template.replace(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
});

const unresolvedPlaceholders = (content: string): ReadonlyArray<string> =>
    [ ...content.matchAll(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g) ].map((match) => match[1] ?? "");

export class TemplateRenderer extends Context.Service<TemplateRenderer, {
    readonly render: (template: string, values: Readonly<Record<string, TemplateValue>>) => Effect.Effect<string, DocsTemplateError>;
    readonly renderFile: (source: string, target: string, values: Readonly<Record<string, TemplateValue>>) => Effect.Effect<void, DocsTemplateError>;
}>()("sorrell/docs-cli/TemplateRenderer") {
    static readonly layer = Layer.effect(
        TemplateRenderer,
        Effect.gen(function*() {
            const fileSystem = yield* DocsFileSystem;
            const atomicWriter = yield* AtomicWriter;
            const render = (template: string, values: Readonly<Record<string, TemplateValue>>) => Effect.try({
                try: () => {
                    const result = renderTemplate(template, values);
                    const missing = unresolvedPlaceholders(result);
                    if (missing.length > 0) {throw new Error(`unresolved placeholders: ${missing.join(", ")}`);}
                    return result;
                },
                catch: (cause) => new DocsTemplateError({ path: "<template>", cause })
            });
            return TemplateRenderer.of({
                render,
                renderFile: (source, target, values) => fileSystem.readText(source).pipe(
                    Effect.flatMap((template) => render(template, values)),
                    Effect.flatMap((content) => atomicWriter.writeText(target, content)),
                    Effect.mapError((cause) => cause instanceof DocsTemplateError
                        ? new DocsTemplateError({ path: source, cause })
                        : new DocsTemplateError({ path: target, cause }))
                )
            });
        })
    ).pipe(Layer.provide(Layer.mergeAll(DocsFileSystem.layer, AtomicWriter.layer)));
}

export class SafeTargetValidation extends Context.Service<SafeTargetValidation, {
    readonly validateEmpty: (target: string, parent?: string) => Effect.Effect<string, DocsTargetError>;
}>()("sorrell/docs-cli/SafeTargetValidation") {
    static readonly layer = Layer.effect(
        SafeTargetValidation,
        Effect.gen(function*() {
            const fileSystem = yield* DocsFileSystem;
            const path = yield* DocsPath;
            return SafeTargetValidation.of({
                validateEmpty: (target, parent) => Effect.gen(function*() {
                    const resolvedTarget = path.resolve(target);
                    const root = path.resolve(parent ?? path.dirname(resolvedTarget));
                    if (resolvedTarget === root) {return yield* Effect.fail(new DocsTargetError({ target: resolvedTarget, reason: "target cannot be the containing directory" }));}
                    const relativeTarget = resolvedTarget.slice(root.length);
                    if (parent !== undefined && relativeTarget.length > 0 && !/^[\\/]/.test(relativeTarget)) {
                        return yield* Effect.fail(new DocsTargetError({ target: resolvedTarget, reason: "target must remain inside the requested parent" }));
                    }
                    if (yield* fileSystem.exists(resolvedTarget)) {
                        const entries = yield* fileSystem.readDirectory(resolvedTarget);
                        if (entries.length > 0) {return yield* Effect.fail(new DocsTargetError({ target: resolvedTarget, reason: "target must be empty" }));}
                    }
                    return resolvedTarget;
                }).pipe(Effect.mapError((cause) => cause instanceof DocsTargetError
                    ? cause
                    : new DocsTargetError({ target, reason: String(cause) })))
            });
        })
    ).pipe(Layer.provide(Layer.mergeAll(DocsFileSystem.layer, DocsPath.layer)));
}

export class AtomicDirectoryPromotion extends Context.Service<AtomicDirectoryPromotion, {
    readonly promote: (staging: string, target: string) => Effect.Effect<void, DocsTargetError>;
}>()("sorrell/docs-cli/AtomicDirectoryPromotion") {
    static readonly layer = Layer.effect(
        AtomicDirectoryPromotion,
        Effect.gen(function*() {
            const fileSystem = yield* DocsFileSystem;
            return AtomicDirectoryPromotion.of({
                promote: (staging, target) => Effect.gen(function*() {
                    if (yield* fileSystem.exists(target)) {return yield* Effect.fail(new DocsTargetError({ target, reason: "promotion target already exists" }));}
                    yield* fileSystem.rename(staging, target).pipe(
                        Effect.mapError((cause) => new DocsTargetError({ target, reason: `atomic promotion failed: ${String(cause)}` }))
                    );
                }).pipe(Effect.mapError((cause) => cause instanceof DocsTargetError
                    ? cause
                    : new DocsTargetError({ target, reason: String(cause) })))
            });
        })
    ).pipe(Layer.provide(DocsFileSystem.layer));
}

export class ManifestTracker extends Context.Service<ManifestTracker, {
    readonly read: (path: string) => Effect.Effect<GeneratedManifest, DocsManifestError>;
    readonly write: (path: string, manifest: GeneratedManifest) => Effect.Effect<void, DocsManifestError>;
}>()("sorrell/docs-cli/ManifestTracker") {
    static readonly layer = Layer.effect(
        ManifestTracker,
        Effect.gen(function*() {
            const fileSystem = yield* DocsFileSystem;
            const atomicWriter = yield* AtomicWriter;
            const read = (path: string) => fileSystem.readText(path).pipe(
                Effect.flatMap((text) => Effect.try({
                    try: () => JSON.parse(text) as GeneratedManifest,
                    catch: (cause) => new DocsManifestError({ path, cause })
                })),
                Effect.mapError((cause) => cause instanceof DocsManifestError ? cause : new DocsManifestError({ path, cause }))
            );
            return ManifestTracker.of({
                read,
                write: (path, manifest) => atomicWriter.writeText(path, JSON.stringify(manifest, null, 2)).pipe(
                    Effect.mapError((cause) => new DocsManifestError({ path, cause }))
                )
            });
        })
    ).pipe(Layer.provide(Layer.mergeAll(DocsFileSystem.layer, AtomicWriter.layer)));
}
