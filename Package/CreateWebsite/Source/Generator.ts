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

import {
    AtomicWriter,
    DocsFileSystem,
    DocsPath,
    SafeTargetValidation
} from "@sorrell/docs-cli";
import { type DocsConfig, decodeDocsConfigSync } from "@sorrell/docs-core";

import { Effect, Layer } from "effect";
import type {
    GeneratedWebsite,
    GeneratedWebsiteFile,
    GeneratedWebsitePackage,
    WebsiteGenerationOptions
} from "./Types.js";
import {
    createLandingRewrites,
    createPlaceholderDeployments,
    createSnapshotProjects
} from "./Routing.js";
const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
const html = (value: string): string =>
    value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;");
const packageManifest = (
    name: string,
    scripts: Readonly<Record<string, string>>,
    dependencies: Readonly<Record<string, string>> = {},
    devDependencies: Readonly<Record<string, string>> = {}
): string =>
    json({
        dependencies,
        devDependencies,
        name,
        private: true,
        scripts,
        type: "module",
        version: "0.1.0"
    });
const baseTsconfig = (): string =>
    json({
        compilerOptions: { noEmit: true },
        extends: "@sorrell/tsconfig/base"
    });
const landingFiles = (
    config: DocsConfig
): ReadonlyArray<GeneratedWebsiteFile> =>
{
    const packages = [
        "Landing",
        "Documentation",
        ...(config.storybook.enabled ? [ "Storybook" ] : []),
        ...(config.agent.mcp.enabled ? [ "Mcp" ] : [])
    ];
    const sections = config.landing.sections
        .map(
            (section: {
                readonly id: string;
                readonly title: string;
                readonly body: string;
                readonly href?: string;
            }) =>
                [
                    `<a href="${html(section.href ?? "#")}">`,
                    `<h2>${html(section.title)}</h2>`,
                    `<p>${html(section.body)}</p></a>`
                ].join("")
        )
        .join("\n");
    const storybookLink = config.storybook.enabled
        ? `<a href="${config.routing.storybookPrefix}/">Storybook</a>`
        : "";
    return [
        {
            content: packageManifest(
                "generated-documentation-landing",
                {
                    build: "node Build.mjs",
                    dev: "node Dev.mjs",
                    verify: "node Verify.mjs"
                },
                {},
                { "@sorrell/tsconfig": "2.1.0" }
            ),
            path: "Landing/package.json"
        },
        { content: baseTsconfig(), path: "Landing/tsconfig.json" },
        {
            content: `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width">
        <title>${html(config.landing.title)}</title>
    </head>
    <body>
        <main>
            <p>Documentation</p>
            <h1>${html(config.landing.title)}</h1>
            <p>${html(config.landing.description)}</p>
            <nav><a href="${config.routing.documentationPrefix}/">Docs</a>${storybookLink}</nav>
            <section>${sections}</section>
        </main>
    </body>
</html>`,
            path: "Landing/index.html"
        },
        {
            content:
                "import { cp, mkdir } from \"node:fs/promises\"; await mkdir(\"Distribution\", { " +
                "recursive: true }); await cp(\"index.html\", \"Distribution/index.html\");\n",
            path: "Landing/Build.mjs"
        },
        {
            content: `import { createServer, request } from "node:http"; import { readFile } from "node:fs/promises"; const routes = [["${config.routing.documentationPrefix}", 4321], ${config.storybook.enabled ? `["${config.routing.storybookPrefix}", 6006]` : ""}]; const server = createServer(async (incoming, response) => { const pathname = incoming.url ?? "/"; const route = routes.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/")); if (route !== undefined) { const proxy = request({ hostname: "127.0.0.1", port: route[1], path: pathname, method: incoming.method, headers: incoming.headers }, (child) => { response.writeHead(child.statusCode ?? 502, child.headers); child.pipe(response); }); proxy.on("error", () => { response.writeHead(502); response.end("Child development server unavailable"); }); incoming.pipe(proxy); return; } response.setHeader("content-type", "text/html"); response.end(await readFile("index.html")); }); server.listen(4173, "127.0.0.1");\n`,
            path: "Landing/Dev.mjs"
        },
        {
            content:
                "import { access } from \"node:fs/promises\"; await access(\"index.html\");\n",
            path: "Landing/Verify.mjs"
        },
        {
            content: json(config.vercel.projects.landing),
            path: "Landing/VercelProject.json"
        },
        {
            content: json(
                createLandingRewrites(
                    config.routing,
                    createPlaceholderDeployments(config),
                    config.redirects
                )
            ),
            path: "Landing/vercel.json"
        },
        {
            content: json(createSnapshotProjects(config).landing),
            path: "Landing/VercelProject.snapshot.json"
        },
        {
            content: json(
                createLandingRewrites(
                    config.routing,
                    createPlaceholderDeployments(config, true),
                    config.redirects
                )
            ),
            path: "Landing/vercel.snapshot.json"
        },
        {
            content: json({
                documentationPrefix: config.routing.documentationPrefix,
                packages,
                storybookPrefix: config.storybook.enabled
                    ? config.routing.storybookPrefix
                    : undefined
            }),
            path: "Landing/RouteManifest.json"
        }
    ];
};
const documentationFiles = (
    config: DocsConfig
): ReadonlyArray<GeneratedWebsiteFile> => [
    {
        content: packageManifest(
            "generated-documentation-site",
            {
                build:
                    "astro build && node " +
                    "../node_modules/@sorrell/docs-create-website/Distribution/bin.js " +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "agent " +
                    "build --target ..",
                dev: "astro dev",
                verify:
                    "astro check && node " +
                    "../node_modules/@sorrell/docs-create-website/Distribution/bin.js " +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "" +
                    "agent " +
                    "verify --target .."
            },
            {
                "@astrojs/mdx": "8.0.2",
                "@sorrell/docs-astro": "0.1.0",
                "@sorrell/docs-create-website": "0.1.0",
                astro: "7.3.4"
            },
            { "@astrojs/check": "0.9.4", "@sorrell/tsconfig": "2.1.0" }
        ),
        path: "Documentation/package.json"
    },
    { content: baseTsconfig(), path: "Documentation/tsconfig.json" },
    {
        content: `import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";
import { docsAstroIntegration } from "@sorrell/docs-astro";

export default defineConfig({
    build: { format: "directory" },
    integrations: [
        mdx(),
        docsAstroIntegration({
            prefix: "${config.routing.documentationPrefix}",
            site: "${html(config.metadata.url || "http://localhost:4321")}"
        })
    ],
    output: "static",
    srcDir: "./Source"
});
`,
        path: "Documentation/astro.config.mjs"
    },
    {
        content: `---
const title = ${JSON.stringify(config.metadata.title)};
const description = ${JSON.stringify(config.metadata.description)};
---
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width">
        <title>{title}</title>
    </head>
    <body>
        <main><h1>{title}</h1><p>{description}</p></main>
    </body>
</html>
`,
        path: "Documentation/Source/pages/index.astro"
    },
    {
        content: `---
title: ${config.metadata.title}
description: ${config.metadata.description}
group: Guides
order: 0
draft: false
---

# ${config.metadata.title}

${config.metadata.description}
`,
        path: "Documentation/Source/content/docs/index.md"
    },
    {
        content: json(config.vercel.projects.documentation),
        path: "Documentation/VercelProject.json"
    },
    {
        content: json(createSnapshotProjects(config).documentation),
        path: "Documentation/VercelProject.snapshot.json"
    },
    {
        content: json({
            headers: [
                {
                    headers: [ { key: "X-Robots-Tag", value: "noindex" } ],
                    source: `${config.routing.documentationPrefix}/agent/:path*`
                },
                {
                    headers: [ { key: "X-Robots-Tag", value: "noindex" } ],
                    source: `${config.routing.documentationPrefix}/:path*.md`
                },
                {
                    headers: [ { key: "X-Robots-Tag", value: "noindex" } ],
                    source: `${config.routing.documentationPrefix}/llms*.txt`
                }
            ],
            outputDirectory: "dist",
            version: 2
        }),
        path: "Documentation/vercel.json"
    },
    {
        content: json({
            cleanUrls: true,
            headers: [
                {
                    headers: [ { key: "X-Robots-Tag", value: "noindex" } ],
                    source: `${config.routing.documentationPrefix}/agent/:path*`
                },
                {
                    headers: [ { key: "X-Robots-Tag", value: "noindex" } ],
                    source: `${config.routing.documentationPrefix}/:path*.md`
                },
                {
                    headers: [ { key: "X-Robots-Tag", value: "noindex" } ],
                    source: `${config.routing.documentationPrefix}/llms*.txt`
                }
            ],
            outputDirectory: "dist",
            version: 2
        }),
        path: "Documentation/vercel.snapshot.json"
    }
];
const storybookFiles = (
    config: DocsConfig
): ReadonlyArray<GeneratedWebsiteFile> => [
    {
        content: packageManifest(
            "generated-documentation-storybook",
            {
                build: "storybook build --output-dir Distribution && node GenerateManifest.mjs",
                dev: "storybook dev -p 6006",
                verify: "storybook build --output-dir Distribution && node GenerateManifest.mjs"
            },
            {
                "@storybook/addon-docs": "10.6.0",
                "@storybook/addon-themes": "10.6.0",
                "@storybook/react-vite": "10.6.0",
                react: "19.2.3",
                "react-dom": "19.2.3",
                storybook: "10.6.0"
            },
            {
                "@sorrell/tsconfig": "2.1.0",
                "@types/react": "19.2.3",
                "@types/react-dom": "19.2.3",
                typescript: "6.0.2"
            }
        ),
        path: "Storybook/package.json"
    },
    {
        content:
            "import { mkdir, " +
            "readdir, " +
            "readFile, " +
            "writeFile " +
            "} " +
            "from " +
            "\"node:fs/promises\"; " +
            "import { dirname, " +
            "resolve " +
            "} " +
            "from " +
            "\"node:path\"; " +
            "const " +
            "directory " +
            "= " +
            "resolve(\"Stories\"); " +
            "const " +
            "output " +
            "= " +
            "resolve(\"Distribution/agent/components.json\"); " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "const " +
            "files " +
            "= " +
            "(await " +
            "readdir(directory)).filter((file) " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "=> " +
            "file.endsWith(\".stories.tsx\") " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "|| " +
            "file.endsWith(\".stories.ts\") " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "|| " +
            "file.endsWith(\".stories.jsx\")).sort(); " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "const components = " +
            "[]; " +
            "for " +
            "(const " +
            "file " +
            "of " +
            "files) " +
            "{ " +
            "const " +
            "source " +
            "= " +
            "await " +
            "readFile(resolve(directory, " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "file), " +
            "\"utf8\"); " +
            "const " +
            "title " +
            "= " +
            "source.match(/title:\\s*[\"']([^\"']+)[\"']/)?.[1] " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "?? " +
            "file.replace(/\\.stories\\.[^.]+$/, " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "\"\"); " +
            "const " +
            "stories " +
            "= " +
            "[ " +
            "...source.matchAll(/export " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "const " +
            "([A-Za-z_$][\\w$]*)/g) " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "].map((match) " +
            "=> " +
            "({ " +
            "id: match[1], " +
            "title: " +
            "match[1] " +
            "})); " +
            "const " +
            "props " +
            "= " +
            "[ " +
            "...source.matchAll(/args:\\s*{([\\s\\S]*?)}/g) " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "].flatMap((match) " +
            "=> " +
            "[ " +
            "...((match[1] ?? " +
            "\"\").matchAll(/^\\s*([A-Za-z_$][\\w$]*):/gmu)) " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "].map((prop) " +
            "=> ({ name: prop[1], " +
            "type: " +
            "\"story " +
            "arg\" " +
            "}))); " +
            "components.push({ " +
            "id: " +
            "title.toLowerCase().replace(/[^a-z0-9]+/g, " +
            "" +
            "" +
            "" +
            "\"-\").replace(/^-|-$/g, " +
            "" +
            "" +
            "" +
            "\"\"), " +
            "title, props: [ ...new Map(props.map((prop) " +
            "=> " +
            "[ " +
            "prop.name, " +
            "prop " +
            "])).values() ], stories }); } await " +
            "mkdir(dirname(output), " +
            "{ " +
            "recursive: " +
            "true }); await writeFile(output, `${JSON.stringify({ version: " +
            "1, " +
            "components " +
            "}, null, 2)}\\n`, " +
            "\"utf8\");\n",
        path: "Storybook/GenerateManifest.mjs"
    },
    { content: baseTsconfig(), path: "Storybook/tsconfig.json" },
    {
        content: `import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
    addons: ["@storybook/addon-docs", "@storybook/addon-themes"],
    framework: { name: "@storybook/react-vite", options: {} },
    stories: ["../Stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
    async viteFinal(value) {
        return { ...value, base: "${config.routing.storybookPrefix}/" };
    }
};

export default config;
`,
        path: "Storybook/.storybook/main.ts"
    },
    {
        content:
            "import type { Preview } from \"@storybook/react\"; const preview: Preview = { " +
            "parameters: { layout: \"centered\" } }; export default preview;\n",
        path: "Storybook/.storybook/preview.tsx"
    },
    {
        content: `export default { title: "Welcome" };

export const Documentation = () =>
    <p>Generated Storybook at ${config.routing.storybookPrefix}/.</p>;
`,
        path: "Storybook/Stories/Welcome.stories.tsx"
    },
    {
        content: json(config.vercel.projects.storybook),
        path: "Storybook/VercelProject.json"
    },
    {
        content: json(createSnapshotProjects(config).storybook),
        path: "Storybook/VercelProject.snapshot.json"
    },
    {
        content: json({ outputDirectory: "Distribution", version: 2 }),
        path: "Storybook/vercel.json"
    },
    {
        content: json({
            cleanUrls: true,
            outputDirectory: "Distribution",
            version: 2
        }),
        path: "Storybook/vercel.snapshot.json"
    }
];
const mcpFiles = (config: DocsConfig): ReadonlyArray<GeneratedWebsiteFile> => [
    {
        content: packageManifest(
            "generated-documentation-mcp",
            {
                build: "node Build.mjs",
                dev: "node Dev.mjs",
                verify: "node Verify.mjs"
            },
            {
                "@sorrell/docs-core": "0.1.0",
                "@sorrell/docs-mcp": "0.1.0",
                effect: "4.0.0-rc.117"
            },
            { "@sorrell/tsconfig": "2.1.0" }
        ),
        path: "Mcp/package.json"
    },
    { content: baseTsconfig(), path: "Mcp/tsconfig.json" },
    {
        content:
            "import { cp, mkdir } from \"node:fs/promises\"; await mkdir(\"Data\", { " +
            "recursive: true }); await cp(\"../Documentation/dist/agent\", \"Data\", { recursive: true });\n",
        path: "Mcp/Build.mjs"
    },
    {
        content:
            "import { access } from \"node:fs/promises\"; await " +
            "access(\"Data/manifest.json\"); await access(\"api/index.mjs\");\n",
        path: "Mcp/Verify.mjs"
    },
    {
        content:
            "import { " +
            "createServer " +
            "} " +
            "from " +
            "\"node:http\"; " +
            "import " +
            "{ " +
            "readFile " +
            "} " +
            "from " +
            "\"node:fs/promises\"; " +
            "import " +
            "{ " +
            "createHttpHandler, " +
            "decodeMcpSource " +
            "} " +
            "from " +
            "\"@sorrell/docs-mcp\"; " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "const " +
            "manifest " +
            "= " +
            "JSON.parse(await " +
            "readFile(\"Data/manifest.json\", " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "\"utf8\")); " +
            "const " +
            "corpus " +
            "= " +
            "JSON.parse(await " +
            "readFile(\"Data/corpus/current.json\", " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "\"utf8\")); " +
            "const " +
            "index " +
            "= " +
            "JSON.parse(await " +
            "readFile(\"Data/search-index.json\", " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "\"utf8\")); " +
            "const " +
            "{ " +
            "handler } = " +
            "createHttpHandler(decodeMcpSource({ " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "manifest, " +
            "corpus, " +
            "index " +
            "})); " +
            "createServer((request, " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "response) " +
            "=> " +
            "handler(new " +
            "Request(`http://127.0.0.1:7070${request.url}`, " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "{ " +
            "method: " +
            "request.method, " +
            "headers: " +
            "Object.fromEntries(Object.entries(request.headers).filter(([key, " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "value]) => typeof " +
            "value " +
            "=== " +
            "\"string\") " +
            "as " +
            "[string, " +
            "string][]), " +
            "body: " +
            "request.method === " +
            "\"GET\" " +
            "? " +
            "undefined " +
            ": " +
            "request " +
            "})).then(async " +
            "(value) " +
            "=> " +
            "{ " +
            "response.writeHead(value.status, " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "Object.fromEntries(value.headers)); " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "response.end(Buffer.from(await " +
            "" +
            "" +
            "" +
            "value.arrayBuffer())); " +
            "" +
            "" +
            "" +
            "}).catch(() " +
            "=> " +
            "{ " +
            "response.writeHead(500); " +
            "" +
            "" +
            "" +
            "response.end(); " +
            "}); " +
            "}).listen(7070, " +
            "\"127.0.0.1\");\n",
        path: "Mcp/Dev.mjs"
    },
    {
        content:
            "import { readFile } " +
            "from " +
            "\"node:fs/promises\"; " +
            "import " +
            "{ " +
            "createHttpHandler, " +
            "decodeMcpSource } " +
            "from " +
            "\"@sorrell/docs-mcp\"; " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "const " +
            "read " +
            "= " +
            "(name) " +
            "=> " +
            "readFile(new " +
            "URL(`../Data/${name}`, " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "import.meta.url), " +
            "\"utf8\").then(JSON.parse); " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "const " +
            "source " +
            "= " +
            "decodeMcpSource({ " +
            "manifest: " +
            "await " +
            "read(\"manifest.json\"), " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "corpus: " +
            "await " +
            "read(\"corpus/current.json\"), " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "index: " +
            "await " +
            "read(\"search-index.json\") " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "}); " +
            "export " +
            "const " +
            "{ " +
            "handler " +
            "} " +
            "= " +
            "createHttpHandler(source); " +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "" +
            "export " +
            "default " +
            "handler;\n",
        path: "Mcp/api/index.mjs"
    },
    {
        content: json(config.vercel.projects.mcp),
        path: "Mcp/VercelProject.json"
    },
    {
        content: json(createSnapshotProjects(config).mcp),
        path: "Mcp/VercelProject.snapshot.json"
    },
    {
        content: json({
            functions: { "api/index.mjs": { maxDuration: 30 } },
            version: 2
        }),
        path: "Mcp/vercel.json"
    },
    {
        content: json({
            functions: { "api/index.mjs": { maxDuration: 30 } },
            version: 2
        }),
        path: "Mcp/vercel.snapshot.json"
    }
];
const createWebsiteFromConfig = (
    options: WebsiteGenerationOptions,
    config: DocsConfig
): GeneratedWebsite =>
{
    const generatedAt = options.generatedAt ?? new Date().toISOString();
    const revision = options.revision ?? "working-tree";
    const packages: Array<GeneratedWebsitePackage> = [
        {
            directory: "Landing",
            kind: "landing",
            name: "generated-documentation-landing",
            routePrefix: "/"
        },
        {
            directory: "Documentation",
            kind: "documentation",
            name: "generated-documentation-site",
            routePrefix: config.routing.documentationPrefix
        },
        ...(config.storybook.enabled
            ? [
                {
                    directory: "Storybook",
                    kind: "storybook" as const,
                    name: "generated-documentation-storybook",
                    routePrefix: config.routing.storybookPrefix
                }
            ]
            : []),
        ...(config.agent.mcp.enabled
            ? [
                {
                    directory: "Mcp",
                    kind: "mcp" as const,
                    name: "generated-documentation-mcp",
                    routePrefix: "/"
                }
            ]
            : [])
    ];
    const files = [
        ...landingFiles(config),
        ...documentationFiles(config),
        ...(config.storybook.enabled ? storybookFiles(config) : []),
        ...(config.agent.mcp.enabled ? mcpFiles(config) : []),
        {
            content: json({
                devDependencies: { "@sorrell/tsconfig": "2.1.0" },
                name: "generated-documentation",
                packageManager: "npm@11.0.0",
                private: true,
                type: "module",
                workspaces: packages.map(
                    ({ directory }: GeneratedWebsitePackage) => directory
                )
            }),
            path: "package.json"
        },
        { content: json(config), path: "docs.config.json" },
        { content: json(config.vercel.projects), path: "VercelProjects.json" },
        {
            content: json(createSnapshotProjects(config)),
            path: "VercelProjects.snapshot.json"
        },
        {
            content: json({
                generatedAt,
                packages: packages.map(
                    ({
                        directory,
                        kind,
                        routePrefix
                    }: GeneratedWebsitePackage) => ({
                        directory,
                        kind,
                        routePrefix
                    })
                ),
                revision,
                routes: config.routing
            }),
            path: "DeploymentManifest.json"
        }
    ];
    return {
        config,
        files,
        generatedAt,
        packages,
        revision,
        target: options.target
    };
};
export/** @internal */
const createGeneratedWebsite = (
    options: WebsiteGenerationOptions
): GeneratedWebsite =>
    createWebsiteFromConfig(
        options,
        decodeDocsConfigSync(
            options.config ?? { storybook: { enabled: false } }
        )
    );
export/** @internal */
const createGeneratedWebsiteFromConfig = (
    target: string,
    config: DocsConfig,
    options: Omit<WebsiteGenerationOptions, "config" | "target"> = {}
): GeneratedWebsite => createWebsiteFromConfig({ ...options, target }, config);
export/** @internal */
const writeGeneratedWebsite = (
    website: GeneratedWebsite
): Effect.Effect<void, unknown> =>
    Effect.gen(function* ()
    {
        const fileSystem = yield* DocsFileSystem;
        const path = yield* DocsPath;
        const safeTarget = yield* SafeTargetValidation;
        yield* safeTarget.validateEmpty(website.target);
        yield* fileSystem.makeDirectory(website.target);
        const writer = yield* AtomicWriter;
        yield* Effect.forEach(
            website.files,
            (file: GeneratedWebsiteFile) =>
            {
                const target = path.join(website.target, file.path);
                return fileSystem
                    .makeDirectory(path.dirname(target))
                    .pipe(
                        Effect.flatMap(() =>
                            writer.writeText(target, file.content)
                        )
                    );
            },
            { concurrency: 1 }
        );
    }).pipe(
        Effect.provide(
            Layer.mergeAll(
                DocsFileSystem.layer,
                DocsPath.layer,
                AtomicWriter.layer,
                SafeTargetValidation.layer
            )
        )
    );
