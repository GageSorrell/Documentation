/**
 * Catalog of the six workflow skills shipped by Sorrell Documentation.
 *
 * @module @sorrell/docs-skills/Catalog
 *
 * @file      Catalog.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Context, Effect, Layer } from "effect";
import { dirname, resolve } from "node:path";
import type { SkillDefinition } from "./Types.js";
import { fileURLToPath } from "node:url";
export/** @internal */
const skillDefinitions: ReadonlyArray<SkillDefinition> =
    [
        {
            description:
                "Create and configure a Sorrell documentation website.",
            directory: "sorrell-docs-create-site",
            name: "sorrell-docs-create-site"
        },
        {
            description:
                "Author structured Markdown and MDX documentation for a Sorrell site.",
            directory: "sorrell-docs-write-content",
            name: "sorrell-docs-write-content"
        },
        {
            description:
                "Author React stories and examples for the web Storybook site.",
            directory: "sorrell-docs-author-web-stories",
            name: "sorrell-docs-author-web-stories"
        },
        {
            description:
                "Create and operate an Expo React Native Storybook application.",
            directory: "sorrell-docs-create-story",
            name: "sorrell-docs-create-story"
        },
        {
            description:
                "Author native Storybook stories, examples, and articles.",
            directory: "sorrell-docs-author-native-stories",
            name: "sorrell-docs-author-native-stories"
        },
        {
            description:
                "Build, verify, and publish a Sorrell documentation website.",
            directory: "sorrell-docs-publish-site",
            name: "sorrell-docs-publish-site"
        }
    ];
const packagedSkillRoot = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../Skills"
);
/** @internal */
export class SkillCatalog extends Context.Service<
    SkillCatalog,
    {
        readonly root: string;
        readonly list: () => ReadonlyArray<SkillDefinition>;
        readonly find: (name: string) => SkillDefinition | undefined;
    }
>()("sorrell/docs-skills/SkillCatalog")
{
    static readonly layer: Layer.Layer<SkillCatalog, never, never> =
        Layer.succeed(
            SkillCatalog,
            SkillCatalog.of({
                find: (name: string) =>
                    skillDefinitions.find(
                        (skill: SkillDefinition) => skill.name === name
                    ),
                list: () => skillDefinitions,
                root: packagedSkillRoot
            })
        );
}
export/** @internal */
const availableSkills =
    Effect.succeed(skillDefinitions);
