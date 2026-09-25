/**
 * Generates the Storybook component manifest consumed by the agent output.
 *
 * @file GenerateManifest.mjs
 */

import { dirname, resolve } from "node:path";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";

const directory = resolve("Stories");
const output = resolve("Distribution/agent/components.json");
const storyPattern = /\.stories\.(?:tsx|ts|jsx)$/;
const files = (await readdir(directory))
    .filter(storyPattern.test.bind(storyPattern))
    .sort();

/**
 * @typedef {object} ComponentRecord
 * @property {string} id Component identifier.
 * @property {Array<{ name: string, type: string }>} props Component props.
 * @property {Array<{ id: string, title: string }>} stories Story records.
 * @property {string} title Component title.
 */
/**
 * Component records emitted for the agent output.
 *
 * @type {Array<ComponentRecord>}
 */
const components = [];

for (const file of files)
{
    const source = await readFile(resolve(directory, file), "utf8");
    const title =
        source.match(/title:\s*["']([^"']+)["']/)?.[1] ??
        file.replace(/\.stories\.[^.]+$/, "");
    /**
     * Story records.
     *
     * @type {Array<{ id: string, title: string }>}
     */
    const stories = [];
    const storyMatches = [ ...source.matchAll(/export const ([A-Za-z_$][\w$]*)/g) ];
    for (let index = 0; index < storyMatches.length; index += 1)
    {
        /** @type {RegExpMatchArray} */
        const match = storyMatches[index];
        stories.push({ id: match[1], title: match[1] });
    }
    /**
     * Prop records.
     *
     * @type {Array<{ name: string, type: string }>}
     */
    const props = [];
    const propMatches = [ ...source.matchAll(/args:\s*{([\s\S]*?)}/g) ];
    for (let index = 0; index < propMatches.length; index += 1)
    {
        /** @type {RegExpMatchArray} */
        const match = propMatches[index];
        const nestedProps = [
            ...(match[1] ?? "").matchAll(/^\s*([A-Za-z_$][\w$]*):/gmu)
        ];
        for (let propIndex = 0; propIndex < nestedProps.length; propIndex += 1)
        {
            /** @type {RegExpMatchArray} */
            const prop = nestedProps[propIndex];
            props.push({ name: prop[1], type: "story arg" });
        }
    }
    const uniqueProps = new Map();
    for (let propIndex = 0; propIndex < props.length; propIndex += 1)
    {
        /** @type {{ name: string, type: string }} */
        const prop = props[propIndex];
        uniqueProps.set(prop.name, prop);
    }
    components.push({
        id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        props: [ ...uniqueProps.values() ],
        stories,
        title
    });
}

await mkdir(dirname(output), { recursive: true });
await writeFile(
    output,
    `${JSON.stringify({ components, version: 1 }, null, 2)}\n`,
    "utf8"
);
