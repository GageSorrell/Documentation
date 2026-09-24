/**
 * Content collection definitions for the dogfood documentation site.
 *
 * @file      content.config.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

const documentation = defineCollection({
    loader: glob({ base: "./Source/content/docs", pattern: "**/*.{md,mdx}" }),
    schema: z.object({
        description: z.string(),
        draft: z.boolean().default(false),
        group: z.string().default("Guides"),
        order: z.number().default(0),
        title: z.string()
    })
});

export const collections = { documentation };
