/**
 * Generate the small, stable component manifest consumed by agent output.
 *
 * @file      GenerateManifest.mjs
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/* eslint-disable */

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const storiesDirectory = resolve("Stories");
const output = resolve("Distribution/agent/components.json");
const files = (await readdir(storiesDirectory)).filter((file) => file.endsWith(".stories.tsx") || file.endsWith(".stories.ts") || file.endsWith(".stories.jsx")).sort();
const components = [];
for (const file of files) {
    const source = await readFile(resolve(storiesDirectory, file), "utf8");
    const title = source.match(/title:\s*["']([^"']+)["']/)?.[1] ?? file.replace(/\.stories\.[^.]+$/, "");
    const component = source.match(/component:\s*([A-Za-z_$][\w$]*)/)?.[1] ?? title;
    const stories = [ ...source.matchAll(/export const ([A-Za-z_$][\w$]*)/g) ].map((match) => ({ id: match[1], title: match[1] }));
    const props = [ ...source.matchAll(/args:\s*{([\s\S]*?)}/g) ].flatMap((match) => [ ...((match[1] ?? "").matchAll(/^\s*([A-Za-z_$][\w$]*):/gmu)) ].map((prop) => ({ name: prop[1], type: "story arg" })));
    const description = source.match(/component:\s*[^,]+,[\s\S]*?description:\s*["']([^"']+)["']/)?.[1];
    components.push({ id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), title, component, ...(description === undefined ? {} : { description }), props: [ ...new Map(props.map((prop) => [ prop.name, prop ])).values() ], stories });
}
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ version: 1, components }, null, 2)}\n`, "utf8");
