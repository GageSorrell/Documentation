/**
 * Validate published package manifests and packed consumers.
 *
 * @module @sorrell/docs-release/ValidatePackages
 *
 * @file      ValidatePackages.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { type CommandResult, CommandRunner } from "@sorrell/docs-cli";
import { Effect, ManagedRuntime } from "effect";
import { dirname, join, resolve } from "node:path";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

interface PackageManifest {
    readonly bin?: Readonly<Record<string, string>>;
    readonly name: string;
    readonly private?: boolean;
}
interface PackFile {
    readonly path: string;
}
interface PackResult {
    readonly filename: string;
    readonly files: ReadonlyArray<PackFile>;
}
interface PackedPackage {
    readonly files: ReadonlySet<string>;
    readonly tarball: string;
}

const scriptDirectory: string = fileURLToPath(new URL(".", import.meta.url));
const repositoryRoot: string = resolve(scriptDirectory, "../../..");
const packageRoot: string = join(repositoryRoot, "Package");
const packageDirectories: ReadonlyArray<string> = [
    "ApiReference",
    "Astro",
    "Cli",
    "Core",
    "CreateWebsite",
    "Mcp",
    "ReactNativeStorybook",
    "Skills",
    "Ui"
];
const commandRuntime = ManagedRuntime.make(CommandRunner.layer);
const npmCli: string = process.env.npm_execpath ?? join(
    dirname(process.execPath),
    "node_modules",
    "npm",
    "bin",
    "npm-cli.js"
);
const runCommand = (
    commandArguments: ReadonlyArray<string>,
    cwd: string
): Promise<CommandResult> => commandRuntime.runPromise(
    Effect.gen(function* ()
    {
        const runner = yield* CommandRunner;
        return yield* runner.run(process.execPath, [ npmCli, ...commandArguments ], { cwd });
    })
);
const runNode = (
    commandArguments: ReadonlyArray<string>,
    cwd: string
): Promise<CommandResult> => commandRuntime.runPromise(
    Effect.gen(function* ()
    {
        const runner = yield* CommandRunner;
        return yield* runner.run(process.execPath, commandArguments, { cwd });
    })
);
const assert = (condition: boolean, message: string): void =>
{
    if (!condition)
    {
        throw new Error(message);
    }
};
const readJson = async <Value>(path: string): Promise<Value> => JSON.parse(
    await readFile(path, "utf8")
) as Value;
const packageManifest = (directory: string): Promise<PackageManifest> => readJson(
    join(packageRoot, directory, "package.json")
);
const parsePackResult = (output: string): PackResult =>
{
    const value: unknown = JSON.parse(output.trim());
    if (Array.isArray(value))
    {
        const result: unknown = value[0];
        if (result === undefined)
        {
            throw new Error("npm pack returned no package metadata");
        }
        return result as PackResult;
    }
    const result: PackResult | undefined = Object.values(
        value as Record<string, PackResult>
    )[0];
    if (result === undefined)
    {
        throw new Error("npm pack returned no package metadata");
    }
    return result;
};
const normalizedFiles = (result: PackResult): ReadonlySet<string> => new Set(
    result.files.map(({ path }: PackFile) => path.replaceAll("\\", "/"))
);
const packageFiles = async (
    directory: string,
    temporaryDirectory: string
): Promise<PackedPackage> =>
{
    const root: string = join(packageRoot, directory);
    const preview: PackResult = parsePackResult(
        (await runCommand([ "pack", "--json", "--dry-run" ], root)).stdout
    );
    const files: ReadonlySet<string> = normalizedFiles(preview);
    assert(files.has("Distribution/index.js"), `${directory} has no runtime entry`);
    assert(files.has("Distribution/index.d.ts"), `${directory} has no declaration entry`);
    assert(files.has("ReadMe.md"), `${directory} has no ReadMe.md`);
    assert(
        ![ ...files ].some((file: string) => /(?:^|\/)(?:Source|Test|dist|src)\//u.test(file)),
        `${directory} leaks source or test files`
    );
    const packed: PackResult = parsePackResult(
        (await runCommand([ "pack", "--json", "--pack-destination", temporaryDirectory ], root)).stdout
    );
    return {
        files,
        tarball: join(temporaryDirectory, packed.filename)
    };
};
const validateBinary = (
    manifest: PackageManifest,
    files: ReadonlySet<string>
): void =>
{
    const entries: ReadonlyArray<readonly [string, string]> = Object.entries(
        manifest.bin ?? {}
    );
    if (manifest.name === "@sorrell/docs-create-website")
    {
        const binary: readonly [string, string] | undefined = entries[0];
        assert(
            binary !== undefined &&
                entries.length === 1 &&
                binary[0] === "sorrell-docs",
            "the public binary must be sorrell-docs only"
        );
        assert(
            binary !== undefined &&
                files.has(binary[1].replace(/^\.\//u, "")),
            "sorrell-docs binary is not packed"
        );
    }
    else
    {
        assert(entries.length === 0, `${manifest.name} exposes an unexpected binary`);
    }
};
const validateSkills = async (files: ReadonlySet<string>): Promise<void> =>
{
    const skillFiles: ReadonlyArray<string> = [ ...files ].filter(
        (file: string) => /^Skills\/[^/]+\/SKILL\.md$/u.test(file)
    );
    assert(skillFiles.length === 6, `expected six packed skills, found ${skillFiles.length}`);
    for (const skillFile of skillFiles)
    {
        const name: string | undefined = skillFile.split("/")[1];
        if (name === undefined)
        {
            throw new Error(`${skillFile} has no skill name`);
        }
        const text: string = await readFile(
            join(packageRoot, "Skills", "Skills", name, "SKILL.md"),
            "utf8"
        );
        assert(text.startsWith("---\n"), `${skillFile} has no frontmatter`);
        assert(/^name:\s*\S+/mu.test(text), `${skillFile} has no name`);
        assert(/^description:\s*\S+/mu.test(text), `${skillFile} has no description`);
        assert(
            !/\b(?:TODO|TBD|placeholder)\b/iu.test(text),
            `${skillFile} contains a placeholder`
        );
    }
};
const validateConsumer = async (
    tarballs: ReadonlyArray<string>,
    temporaryDirectory: string
): Promise<void> =>
{
    const consumerDirectory: string = join(temporaryDirectory, "consumer");
    await mkdir(consumerDirectory, { recursive: true });
    await runCommand([ "init", "--yes" ], consumerDirectory);
    await runCommand(
        [
            "install",
            "--ignore-scripts",
            "--legacy-peer-deps",
            "--no-audit",
            "--no-fund",
            "--package-lock=false",
            "astro@7.3.4",
            "react@19.2.3",
            ...tarballs
        ],
        consumerDirectory
    );
    const consumerFile: string = join(consumerDirectory, "consumer.mjs");
    await writeFile(
        consumerFile,
        `import * as apiReference from "@sorrell/docs-api-reference";
import * as astro from "@sorrell/docs-astro";
import * as cli from "@sorrell/docs-cli";
import * as core from "@sorrell/docs-core";
import * as createWebsite from "@sorrell/docs-create-website";
import * as mcp from "@sorrell/docs-mcp";
import * as skills from "@sorrell/docs-skills";
import * as ui from "@sorrell/docs-ui";
const native = { entry: await import.meta.resolve("@sorrell/docs-react-native-storybook") };
for (const [name, value] of Object.entries({
    apiReference, astro, cli, core, createWebsite, mcp, native, skills, ui
})) {
    if (Object.keys(value).length === 0) throw new Error(name + " has no consumer-visible exports");
}
if (createWebsite.default !== undefined) throw new Error("create website unexpectedly has a default export");
`,
        "utf8"
    );
    await runNode([ consumerFile ], consumerDirectory);
};
const main = async (): Promise<void> =>
{
    const temporaryDirectory: string = await mkdtemp(join(repositoryRoot, ".release-"));
    try
    {
        const tarballs: Array<string> = [];
        for (const directory of packageDirectories)
        {
            const manifest: PackageManifest = await packageManifest(directory);
            assert(manifest.private === false, `${manifest.name} must be publishable`);
            assert(/^@sorrell\/docs-/u.test(manifest.name), `${manifest.name} has an invalid package name`);
            const packed: PackedPackage = await packageFiles(directory, temporaryDirectory);
            validateBinary(manifest, packed.files);
            if (manifest.name === "@sorrell/docs-skills")
            {
                await validateSkills(packed.files);
            }
            tarballs.push(packed.tarball);
        }
        await validateConsumer(tarballs, temporaryDirectory);
        process.stdout.write(`Validated ${packageDirectories.length} packed packages and their consumer.\n`);
    }
    finally
    {
        await rm(temporaryDirectory, { force: true, recursive: true });
        await commandRuntime.dispose();
    }
};

await main();
