/**
 *
 *
 * @module @sorrell/docs-create-website/McpSource
 *
 * @file      McpSource.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    AgentCorpusSchema,
    AgentManifestSchema,
    AgentSearchIndexSchema
} from "@sorrell/docs-core";
import { DocsFileSystem, DocsPath } from "@sorrell/docs-cli";
import { Effect, Layer, Schema } from "effect";
import { type McpSource, decodeMcpSource, runStdio } from "@sorrell/docs-mcp";
import type { Option } from "effect";

/** Load and validate an MCP corpus from a generated build or deployed site. */
const readJson = <Value>(
    fileSystem: typeof DocsFileSystem.Service,
    file: string,
    schema: Schema.Schema<Value>
): Effect.Effect<Value, unknown> =>
    fileSystem.readText(file).pipe(
        Effect.flatMap((text: string) =>
            Effect.try({
                catch: (cause: unknown) => cause,
                try: () =>
                    (
                        Schema.decodeUnknownSync(
                            schema as unknown as Schema.ConstraintDecoder<
                                unknown,
                                never
                            >
                        ) as (value: unknown) => Value
                    )(JSON.parse(text))
            })
        )
    );
const loadLocal = (
    source: string
): Effect.Effect<McpSource, unknown, DocsFileSystem | DocsPath> =>
    Effect.gen(function* ()
    {
        const fileSystem = yield* DocsFileSystem;
        const path = yield* DocsPath;
        const candidates = [
            path.join(source, "agent"),
            path.join(source, "Documentation", "dist", "agent")
        ];
        const directory = yield* Effect.findFirst(candidates, (value: string) =>
            fileSystem.exists(path.join(value, "manifest.json"))
        ).pipe(
            Effect.flatMap((value: Option.Option<string>) =>
                value._tag === "Some"
                    ? Effect.succeed(value.value)
                    : Effect.fail(
                        new Error(
                            `No agent manifest found beneath ${source}`
                        )
                    )
            )
        );
        const manifest = yield* readJson(
            fileSystem,
            path.join(directory, "manifest.json"),
            AgentManifestSchema
        );
        const currentVersion = manifest.versions.includes("current")
            ? "current"
            : manifest.versions[0];
        if (currentVersion === undefined)
        {
            return yield* Effect.fail(
                new Error("Agent manifest contains no versions")
            );
        }
        const corpus = yield* readJson(
            fileSystem,
            path.join(directory, "corpus", `${currentVersion}.json`),
            AgentCorpusSchema
        );
        const index = yield* readJson(
            fileSystem,
            path.join(directory, "search-index.json"),
            AgentSearchIndexSchema
        );
        return decodeMcpSource({ corpus, index, manifest });
    });
const loadRemote = (source: string): Effect.Effect<McpSource, unknown> =>
    Effect.tryPromise({
        catch: (cause: unknown) => cause,
        try: async () =>
        {
            const root = source.replace(/\/+$/u, "");
            const indexResponse = await fetch(`${root}/llms.txt`);
            const index = indexResponse.ok ? await indexResponse.text() : "";
            const discovered = index.match(
                /\((https?:\/\/[^)]+\/agent\/manifest\.json)\)/u
            )?.[1];
            const agentRoot =
                discovered === undefined
                    ? `${root}/docs/agent`
                    : discovered.slice(0, discovered.lastIndexOf("/"));
            const read = async (file: string) =>
            {
                const response = await fetch(`${agentRoot}/${file}`);
                if (!response.ok)
                {
                    throw new Error(
                        `Unable to load ${file}: HTTP ${response.status}`
                    );
                }
                return response.json();
            };
            const manifest = (await read(
                "manifest.json"
            )) as unknown as McpSource["manifest"];
            const currentVersion = manifest.versions.includes("current")
                ? "current"
                : manifest.versions[0];
            if (currentVersion === undefined)
            {
                throw new Error("Agent manifest contains no versions");
            }
            return decodeMcpSource({
                corpus: await read(`corpus/${currentVersion}.json`),
                index: await read("search-index.json"),
                manifest
            });
        }
    });
export/** @internal */
const runMcpSource = (
    source: string
): Effect.Effect<void, unknown> =>
    (source.startsWith("http://") || source.startsWith("https://")
        ? loadRemote(source)
        : loadLocal(source)
    ).pipe(
        Effect.flatMap(runStdio),
        Effect.provide(Layer.mergeAll(DocsFileSystem.layer, DocsPath.layer))
    );
