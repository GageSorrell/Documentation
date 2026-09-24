/**
 * Three-package website workspace generation.
 *
 * @module @sorrell/docs-create-website/Generator
 *
 * @file      Generator.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/* eslint-disable no-useless-escape */

import { Effect, Layer } from "effect";
import { decodeDocsConfigSync, type DocsConfig } from "@sorrell/docs-core";
import { AtomicWriter, DocsFileSystem, DocsPath, SafeTargetValidation } from "@sorrell/docs-cli";
import { createLandingRewrites, createPlaceholderDeployments } from "./Routing.js";
import type { GeneratedWebsite, GeneratedWebsiteFile, GeneratedWebsitePackage, WebsiteGenerationOptions } from "./Types.js";

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
const html = (value: string): string => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;");

const packageManifest = (name: string, scripts: Readonly<Record<string, string>>, dependencies: Readonly<Record<string, string>> = {}, devDependencies: Readonly<Record<string, string>> = {}): string => json({
    name,
    version: "0.1.0",
    private: true,
    type: "module",
    scripts,
    dependencies,
    devDependencies
});

const baseTsconfig = (): string => json({
    extends: "@sorrell/tsconfig/base",
    compilerOptions: { noEmit: true }
});

const landingFiles = (config: DocsConfig): ReadonlyArray<GeneratedWebsiteFile> => {
    const packages = [ "Landing", "Documentation", ...(config.storybook.enabled ? [ "Storybook" ] : []) ];
    const sections = config.landing.sections.map((section) => `<a href="${html(section.href ?? "#")}"><h2>${html(section.title)}</h2><p>${html(section.body)}</p></a>`).join("\n");
    const storybookLink = config.storybook.enabled ? `<a href="${config.routing.storybookPrefix}/">Storybook</a>` : "";
    return [
        { path: "Landing/package.json", content: packageManifest("generated-documentation-landing", { build: "node Build.mjs", dev: "node Dev.mjs", verify: "node Verify.mjs" }, {}, { "@sorrell/tsconfig": "2.1.0" }) },
        { path: "Landing/tsconfig.json", content: baseTsconfig() },
        { path: "Landing/index.html", content: `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>${html(config.landing.title)}</title></head><body><main><p>Documentation</p><h1>${html(config.landing.title)}</h1><p>${html(config.landing.description)}</p><nav><a href="${config.routing.documentationPrefix}/">Docs</a>${storybookLink}</nav><section>${sections}</section></main></body></html>` },
        { path: "Landing/Build.mjs", content: "import { cp, mkdir } from \"node:fs/promises\"; await mkdir(\"Distribution\", { recursive: true }); await cp(\"index.html\", \"Distribution/index.html\");\n" },
        { path: "Landing/Dev.mjs", content: `import { createServer, request } from "node:http"; import { readFile } from "node:fs/promises"; const routes = [["${config.routing.documentationPrefix}", 4321], ${config.storybook.enabled ? `["${config.routing.storybookPrefix}", 6006]` : ""}]; const server = createServer(async (incoming, response) => { const pathname = incoming.url ?? "/"; const route = routes.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/")); if (route !== undefined) { const proxy = request({ hostname: "127.0.0.1", port: route[1], path: pathname, method: incoming.method, headers: incoming.headers }, (child) => { response.writeHead(child.statusCode ?? 502, child.headers); child.pipe(response); }); proxy.on("error", () => { response.writeHead(502); response.end("Child development server unavailable"); }); incoming.pipe(proxy); return; } response.setHeader("content-type", "text/html"); response.end(await readFile("index.html")); }); server.listen(4173, "127.0.0.1");\n` },
        { path: "Landing/Verify.mjs", content: "import { access } from \"node:fs/promises\"; await access(\"index.html\");\n" },
        { path: "Landing/VercelProject.json", content: json(config.vercel.projects.landing) },
        { path: "Landing/vercel.json", content: json(createLandingRewrites(config.routing, createPlaceholderDeployments(config))) },
        { path: "Landing/RouteManifest.json", content: json({ documentationPrefix: config.routing.documentationPrefix, storybookPrefix: config.storybook.enabled ? config.routing.storybookPrefix : undefined, packages }) }
    ];
};

const documentationFiles = (config: DocsConfig): ReadonlyArray<GeneratedWebsiteFile> => [
    { path: "Documentation/package.json", content: packageManifest("generated-documentation-site", { build: "astro build", dev: "astro dev", verify: "astro check" }, { "@astrojs/mdx": "8.0.2", "@sorrell/docs-astro": "0.1.0", astro: "7.3.4" }, { "@astrojs/check": "0.9.4", "@sorrell/tsconfig": "2.1.0" }) },
    { path: "Documentation/tsconfig.json", content: baseTsconfig() },
    { path: "Documentation/astro.config.mjs", content: `import mdx from \"@astrojs/mdx\"; import { defineConfig } from \"astro/config\"; import { docsAstroIntegration } from \"@sorrell/docs-astro\"; export default defineConfig({ build: { format: \"directory\" }, integrations: [mdx(), docsAstroIntegration({ prefix: \"${config.routing.documentationPrefix}\", site: \"${html(config.metadata.url || "http://localhost:4321")}\" })], output: \"static\", srcDir: \"./Source\" });\n` },
    { path: "Documentation/Source/pages/index.astro", content: `---\nconst title = ${JSON.stringify(config.metadata.title)};\nconst description = ${JSON.stringify(config.metadata.description)};\n---\n<html lang=\"en\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width\"><title>{title}</title></head><body><main><h1>{title}</h1><p>{description}</p></main></body></html>\n` },
    { path: "Documentation/Source/content/docs/index.md", content: `---\ntitle: ${config.metadata.title}\ndescription: ${config.metadata.description}\ngroup: Guides\norder: 0\ndraft: false\n---\n\n# ${config.metadata.title}\n\n${config.metadata.description}\n` },
    { path: "Documentation/VercelProject.json", content: json(config.vercel.projects.documentation) },
    { path: "Documentation/vercel.json", content: json({ version: 2, outputDirectory: "dist" }) }
];

const storybookFiles = (config: DocsConfig): ReadonlyArray<GeneratedWebsiteFile> => [
    { path: "Storybook/package.json", content: packageManifest("generated-documentation-storybook", { build: "storybook build --output-dir Distribution", dev: "storybook dev -p 6006", verify: "storybook build --output-dir Distribution" }, { "@storybook/addon-docs": "10.6.0", "@storybook/addon-themes": "10.6.0", "@storybook/react-vite": "10.6.0", react: "19.2.3", "react-dom": "19.2.3", storybook: "10.6.0" }, { "@sorrell/tsconfig": "2.1.0", "@types/react": "19.2.3", "@types/react-dom": "19.2.3", typescript: "6.0.2" }) },
    { path: "Storybook/tsconfig.json", content: baseTsconfig() },
    { path: "Storybook/.storybook/main.ts", content: `import type { StorybookConfig } from \"@storybook/react-vite\"; const config: StorybookConfig = { addons: [\"@storybook/addon-docs\", \"@storybook/addon-themes\"], framework: { name: \"@storybook/react-vite\", options: {} }, stories: [\"../Stories/**/*.stories.@(js|jsx|mjs|ts|tsx)\"], async viteFinal(value) { return { ...value, base: \"${config.routing.storybookPrefix}/\" }; } }; export default config;\n` },
    { path: "Storybook/.storybook/preview.tsx", content: "import type { Preview } from \"@storybook/react\"; const preview: Preview = { parameters: { layout: \"centered\" } }; export default preview;\n" },
    { path: "Storybook/Stories/Welcome.stories.tsx", content: `export default { title: \"Welcome\" }; export const Documentation = () => <p>Generated Storybook at ${config.routing.storybookPrefix}/.</p>;\n` },
    { path: "Storybook/VercelProject.json", content: json(config.vercel.projects.storybook) },
    { path: "Storybook/vercel.json", content: json({ version: 2, outputDirectory: "Distribution" }) }
];

const createWebsiteFromConfig = (options: WebsiteGenerationOptions, config: DocsConfig): GeneratedWebsite => {
    const generatedAt = options.generatedAt ?? new Date().toISOString();
    const revision = options.revision ?? "working-tree";
    const packages: Array<GeneratedWebsitePackage> = [
        { kind: "landing", directory: "Landing", name: "generated-documentation-landing", routePrefix: "/" },
        { kind: "documentation", directory: "Documentation", name: "generated-documentation-site", routePrefix: config.routing.documentationPrefix },
        ...(config.storybook.enabled ? [ { kind: "storybook" as const, directory: "Storybook", name: "generated-documentation-storybook", routePrefix: config.routing.storybookPrefix } ] : [])
    ];
    const files = [
        ...landingFiles(config),
        ...documentationFiles(config),
        ...(config.storybook.enabled ? storybookFiles(config) : []),
        { path: "package.json", content: json({ devDependencies: { "@sorrell/tsconfig": "2.1.0" }, name: "generated-documentation", packageManager: "npm@11.0.0", private: true, type: "module", workspaces: packages.map(({ directory }) => directory) }) },
        { path: "docs.config.json", content: json(config) },
        { path: "VercelProjects.json", content: json(config.vercel.projects) },
        { path: "DeploymentManifest.json", content: json({ generatedAt, revision, routes: config.routing, packages: packages.map(({ directory, kind, routePrefix }) => ({ directory, kind, routePrefix })) }) }
    ];
    return { target: options.target, config, packages, files, revision, generatedAt };
};

export const createGeneratedWebsite = (options: WebsiteGenerationOptions): GeneratedWebsite => createWebsiteFromConfig(
    options,
    decodeDocsConfigSync(options.config ?? { storybook: { enabled: false } })
);

export const createGeneratedWebsiteFromConfig = (target: string, config: DocsConfig, options: Omit<WebsiteGenerationOptions, "config" | "target"> = {}): GeneratedWebsite => createWebsiteFromConfig({ ...options, target }, config);

export const writeGeneratedWebsite = (website: GeneratedWebsite): Effect.Effect<void, unknown> => Effect.gen(function*() {
    const fileSystem = yield* DocsFileSystem;
    const path = yield* DocsPath;
    const safeTarget = yield* SafeTargetValidation;
    yield* safeTarget.validateEmpty(website.target);
    yield* fileSystem.makeDirectory(website.target);
    const writer = yield* AtomicWriter;
    yield* Effect.forEach(website.files, (file) => {
        const target = path.join(website.target, file.path);
        return fileSystem.makeDirectory(path.dirname(target)).pipe(Effect.flatMap(() => writer.writeText(target, file.content)));
    }, { concurrency: 1 });
}).pipe(Effect.provide(Layer.mergeAll(DocsFileSystem.layer, DocsPath.layer, AtomicWriter.layer, SafeTargetValidation.layer)));
