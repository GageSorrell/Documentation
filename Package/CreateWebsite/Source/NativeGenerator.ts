/**
 *
 *
 * @module @sorrell/docs-create-website/NativeGenerator
 *
 * @file      NativeGenerator.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/**
 * Expo and React Native Storybook project templates.
 *
 * @module @sorrell/docs-create-website/NativeGenerator
 */

import { Effect, Layer } from "effect";
import { AtomicWriter, DocsFileSystem, DocsPath, SafeTargetValidation } from "@sorrell/docs-cli";
import type { NativeAppGenerationOptions, NativeAppKind, NativeAuthoringOptions, NativeGeneratedApp, NativeGeneratedFile } from "./NativeTypes.js";

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

const packageNameFor = (options: NativeAppGenerationOptions, kind: NativeAppKind): string => options.packageName ?? `@sorrell/application-${kind}`;
const displayNameFor = (options: NativeAppGenerationOptions, kind: NativeAppKind): string => options.name ?? (kind === "development" ? "Sorrell Storybook Development" : "Sorrell Storybook Demonstration");

const packageManifest = (name: string): string => json({
    name,
    version: "0.1.0",
    private: true,
    main: "index.ts",
    scripts: {
        dev: "expo start --dev-client",
        start: "expo start",
        typecheck: "tsc --project tsconfig.json --noEmit",
        export: "expo export --platform all",
        prebuild: "expo prebuild --no-install"
    },
    dependencies: {
        "@sorrell/docs-react-native-storybook": "0.1.0",
        "@react-native-async-storage/async-storage": "3.1.1",
        "@storybook/addon-ondevice-actions": "10.6.0",
        "@storybook/addon-ondevice-controls": "10.6.0",
        "@storybook/react-native": "10.6.0",
        storybook: "10.6.0",
        "@gorhom/bottom-sheet": "5.2.14",
        expo: "57.0.25",
        "expo-dev-client": "57.0.19",
        "expo-status-bar": "57.0.1",
        react: "19.2.3",
        "react-native": "0.86.3",
        "react-native-gesture-handler": "3.3.0",
        "react-native-reanimated": "4.5.1",
        "react-native-safe-area-context": "5.8.0"
    },
    devDependencies: {
        "@expo/metro-config": "57.0.12",
        "@types/react": "19.3.0",
        typescript: "6.0.2"
    }
});

const appJson = (name: string, kind: NativeAppKind): string => json({
    expo: {
        name,
        slug: `sorrell-${kind}-storybook`,
        version: "0.1.0",
        orientation: "portrait",
        userInterfaceStyle: "automatic",
        scheme: `sorrell-${kind}-storybook`,
        platforms: [ "ios", "android" ],
        ios: { supportsTablet: true },
        android: { adaptiveIcon: { backgroundColor: "#09090b" } },
        plugins: [ "expo-dev-client" ]
    }
});

const appSource = (_name: string): string => `import { NativeStorybookProvider } from "@sorrell/docs-react-native-storybook";
import StorybookUI from "./.rnstorybook/index.js";

export default function App() {
    return <NativeStorybookProvider><StorybookUI /></NativeStorybookProvider>;
}
`;

const storyIndex = (): string => `import { Article, ArticleCallout, ArticleCode, ArticleExample, ArticleSection, ArticleText } from "@sorrell/docs-react-native-storybook";
import type { ReactElement } from "react";

export interface NativeStoryEntry { readonly id: string; readonly title: string; readonly render: () => ReactElement; }

export const stories: ReadonlyArray<NativeStoryEntry> = [
    { id: "welcome", title: "Welcome", render: () => <Article title="Welcome"><ArticleSection title="Getting started"><ArticleText>Explore the public native Storybook primitives.</ArticleText></ArticleSection><ArticleExample title="Example"><ArticleText>Example content</ArticleText></ArticleExample><ArticleCode language="tsx">const story = true;</ArticleCode><ArticleCallout title="Note">Stories are discoverable from this index.</ArticleCallout></Article> }
];
`;

const metroConfig = (): string => `const { getDefaultConfig } = require("expo/metro-config");
const { withStorybook } = require("@storybook/react-native/metro/withStorybook");

module.exports = withStorybook(getDefaultConfig(__dirname), { enabled: true, configPath: "./.rnstorybook" });
`;

const tsconfig = (): string => json({
    extends: "@sorrell/tsconfig/base",
    compilerOptions: { jsx: "react-jsx", module: "ESNext", moduleResolution: "bundler", noEmit: true },
    include: [ "**/*.ts", "**/*.tsx" ],
    exclude: [ "node_modules", "Distribution" ]
});

const storybookConfig = (): ReadonlyArray<NativeGeneratedFile> => [
    { path: ".rnstorybook/main.ts", content: "import type { StorybookConfig } from \"@storybook/react-native\";\n\nconst config: StorybookConfig = {\n    deviceAddons: [ \"@storybook/addon-ondevice-actions\", \"@storybook/addon-ondevice-controls\" ],\n    stories: [ \"../Stories/**/*.stories.@(js|jsx|ts|tsx)\" ]\n};\n\nexport default config;\n" },
    { path: ".rnstorybook/preview.tsx", content: "import type { Preview } from \"@storybook/react\";\nimport { NativeStorybookProvider } from \"@sorrell/docs-react-native-storybook\";\n\nconst preview: Preview = { decorators: [ (Story) => <NativeStorybookProvider><Story /></NativeStorybookProvider> ] };\nexport default preview;\n" },
    { path: ".rnstorybook/index.tsx", content: "import AsyncStorage from \"@react-native-async-storage/async-storage\";\nimport { view } from \"./storybook.requires\";\n\nconst StorybookUIRoot = view.getStorybookUI({ storage: { getItem: AsyncStorage.getItem, setItem: AsyncStorage.setItem } });\nexport default StorybookUIRoot;\n" },
    { path: ".rnstorybook/storybook.requires.ts", content: "import type { ReactElement } from \"react\";\n\nexport const view = { getStorybookUI: (_options?: unknown): (() => ReactElement | null) => () => null };\n" }
];

const appFiles = (options: NativeAppGenerationOptions): NativeGeneratedApp => {
    const kind = options.kind ?? "development";
    const name = displayNameFor(options, kind);
    const packageName = packageNameFor(options, kind);
    return {
        target: options.target,
        kind,
        name,
        packageName,
        files: [
            { path: "package.json", content: packageManifest(packageName) },
            { path: "app.json", content: appJson(name, kind) },
            { path: "tsconfig.json", content: tsconfig() },
            { path: "metro.config.cjs", content: metroConfig() },
            { path: "index.ts", content: "import { registerRootComponent } from \"expo\";\nimport App from \"./App\";\n\nregisterRootComponent(App);\n" },
            { path: "App.tsx", content: appSource(name) },
            { path: "Stories/index.tsx", content: storyIndex() },
            { path: "Stories/Welcome.stories.tsx", content: `import { stories } from "./index";\n\nexport default { title: "${name}" };\nexport const Welcome = stories[0]?.render;\n` },
            ...storybookConfig()
        ]
    };
};

export const createNativeStorybookApp = (options: NativeAppGenerationOptions): NativeGeneratedApp => appFiles(options);

export const createNativeAuthoringFile = ({ kind, name }: NativeAuthoringOptions): NativeGeneratedFile => {
    const safeName = name.replace(/[^A-Za-z0-9_-]/g, "");
    if (kind === "story") {
        return { path: `Stories/${safeName}.stories.tsx`, content: `import { Article, ArticleText } from "@sorrell/docs-react-native-storybook";\n\nexport default { title: "${safeName}" };\nexport const Default = () => <Article title="${safeName}"><ArticleText>Story content</ArticleText></Article>;\n` };
    }
    if (kind === "example") {
        return { path: `Examples/${safeName}.tsx`, content: `import { ArticleExample, ArticleText } from "@sorrell/docs-react-native-storybook";\n\nexport const ${safeName} = <ArticleExample title="${safeName}"><ArticleText>Example content</ArticleText></ArticleExample>;\n` };
    }
    return { path: `Articles/${safeName}.tsx`, content: `import { Article, ArticleSection, ArticleText } from "@sorrell/docs-react-native-storybook";\n\nexport const ${safeName} = <Article title="${safeName}"><ArticleSection title="Introduction"><ArticleText>Article content</ArticleText></ArticleSection></Article>;\n` };
};

export const writeNativeStorybookApp = (app: NativeGeneratedApp): Effect.Effect<void, unknown> => Effect.gen(function*() {
    const fileSystem = yield* DocsFileSystem;
    const path = yield* DocsPath;
    yield* (yield* SafeTargetValidation).validateEmpty(app.target);
    const writer = yield* AtomicWriter;
    yield* Effect.forEach(app.files, (file) => {
        const target = path.join(app.target, file.path);
        return fileSystem.makeDirectory(path.dirname(target)).pipe(Effect.flatMap(() => writer.writeText(target, file.content)));
    }, { concurrency: 1 });
}).pipe(Effect.provide(Layer.mergeAll(DocsFileSystem.layer, DocsPath.layer, AtomicWriter.layer, SafeTargetValidation.layer)));

export const writeNativeAuthoringFile = (options: NativeAuthoringOptions): Effect.Effect<void, unknown> => Effect.gen(function*() {
    const fileSystem = yield* DocsFileSystem;
    const path = yield* DocsPath;
    const writer = yield* AtomicWriter;
    const file = createNativeAuthoringFile(options);
    const target = path.join(options.target, file.path);
    yield* fileSystem.makeDirectory(path.dirname(target));
    yield* writer.writeText(target, file.content);
}).pipe(Effect.provide(Layer.mergeAll(DocsFileSystem.layer, DocsPath.layer, AtomicWriter.layer)));
