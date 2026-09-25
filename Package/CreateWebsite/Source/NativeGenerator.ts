/**
 * Expo and React Native Storybook project templates.
 *
 * @module @sorrell/docs-create-website/NativeGenerator
 *
 * @file      NativeGenerator.ts
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
import { Effect, Layer } from "effect";
import type {
    NativeAppGenerationOptions,
    NativeAppKind,
    NativeAuthoringOptions,
    NativeGeneratedApp,
    NativeGeneratedFile
} from "./NativeTypes.js";

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

const packageNameFor = (
    options: NativeAppGenerationOptions,
    kind: NativeAppKind
): string => options.packageName ?? `@sorrell/application-${ kind }`;

const displayNameFor = (
    options: NativeAppGenerationOptions,
    kind: NativeAppKind
): string =>
    options.name ??
    (kind === "development"
        ? "Sorrell Storybook Development"
        : "Sorrell Storybook Demonstration");
const packageManifest = (name: string): string =>
    json({
        dependencies: {
            "@gorhom/bottom-sheet": "5.2.14",
            "@react-native-async-storage/async-storage": "3.1.1",
            "@sorrell/docs-react-native-storybook": "0.1.0",
            "@storybook/addon-ondevice-actions": "10.6.0",
            "@storybook/addon-ondevice-controls": "10.6.0",
            "@storybook/react-native": "10.6.0",
            expo: "57.0.25",
            "expo-dev-client": "57.0.19",
            "expo-status-bar": "57.0.1",
            react: "19.2.3",
            "react-native": "0.86.3",
            "react-native-gesture-handler": "3.3.0",
            "react-native-reanimated": "4.5.1",
            "react-native-safe-area-context": "5.8.0",
            storybook: "10.6.0"
        },
        devDependencies: {
            "@expo/metro-config": "57.0.12",
            "@types/react": "19.3.0",
            typescript: "6.0.2"
        },
        main: "index.ts",
        name,
        private: true,
        scripts: {
            dev: "expo start --dev-client",
            export: "expo export --platform all",
            prebuild: "expo prebuild --no-install",
            start: "expo start",
            typecheck: "tsc --project tsconfig.json --noEmit"
        },
        version: "0.1.0"
    });
const appJson = (name: string, kind: NativeAppKind): string =>
    json({
        expo: {
            android: { adaptiveIcon: { backgroundColor: "#09090b" } },
            ios: { supportsTablet: true },
            name,
            orientation: "portrait",
            platforms: [ "ios", "android" ],
            plugins: [ "expo-dev-client" ],
            scheme: `sorrell-${kind}-storybook`,
            slug: `sorrell-${kind}-storybook`,
            userInterfaceStyle: "automatic",
            version: "0.1.0"
        }
    });
const appSource = (
    _name: string
): string => `import { NativeStorybookProvider } from "@sorrell/docs-react-native-storybook";
import StorybookUI from "./.rnstorybook/index.js";

export default function App() {
    return <NativeStorybookProvider><StorybookUI /></NativeStorybookProvider>;
}
`;
const storyIndex = (): string => `import {
    Article,
    ArticleCallout,
    ArticleCode,
    ArticleExample,
    ArticleSection,
    ArticleText
} from "@sorrell/docs-react-native-storybook";
import type { ReactElement } from "react";

export interface NativeStoryEntry {
    readonly id: string;
    readonly title: string;
    readonly render: () => ReactElement;
}

export const stories: ReadonlyArray<NativeStoryEntry> = [
    {
        id: "welcome",
        title: "Welcome",
        render: () => (
            <Article title="Welcome">
                <ArticleSection title="Getting started">
                    <ArticleText>
                        Explore the public native Storybook primitives.
                    </ArticleText>
                </ArticleSection>
                <ArticleExample title="Example">
                    <ArticleText>Example content</ArticleText>
                </ArticleExample>
                <ArticleCode language="tsx">const story = true;</ArticleCode>
                <ArticleCallout title="Note">
                    Stories are discoverable from this index.
                </ArticleCallout>
            </Article>
        )
    }
];
`;
const metroConfig =
    (): string => `const { getDefaultConfig } = require("expo/metro-config");
const { withStorybook } = require("@storybook/react-native/metro/withStorybook");

module.exports = withStorybook(getDefaultConfig(__dirname), { enabled: true, configPath: "./.rnstorybook" });
`;
const tsconfig = (): string =>
    json({
        compilerOptions: {
            jsx: "react-jsx",
            module: "ESNext",
            moduleResolution: "bundler",
            noEmit: true
        },
        exclude: [ "node_modules", "Distribution" ],
        extends: "@sorrell/tsconfig/base",
        include: [ "**/*.ts", "**/*.tsx" ]
    });
const storybookConfig = (): ReadonlyArray<NativeGeneratedFile> => [
    {
        content:
            "import type { " +
            "StorybookConfig " +
            "} " +
            "from " +
            "\"@storybook/react-native\";\n" +
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
            "\n" +
            "const " +
            "config: " +
            "StorybookConfig " +
            "= " +
            "{\n" +
            " " +
            " " +
            " " +
            " " +
            "deviceAddons: " +
            "[ " +
            "\"@storybook/addon-ondevice-actions\", " +
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
            "\"@storybook/addon-ondevice-controls\" " +
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
            "],\n    stories: [ " +
            "\"../Stories/**/*.stories.@(js|jsx|ts|tsx)\" " +
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
            "]\n" +
            "};\n" +
            "\n" +
            "export " +
            "default config;\n",
        path: ".rnstorybook/main.ts"
    },
    {
        content:
            "import type { " +
            "Preview " +
            "} " +
            "from " +
            "\"@storybook/react\";\n" +
            "import " +
            "{ " +
            "NativeStorybookProvider " +
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
            "} " +
            "from " +
            "\"@sorrell/docs-react-native-storybook\";\n" +
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
            "\n" +
            "const preview: " +
            "Preview " +
            "= " +
            "{ " +
            "decorators: " +
            "[ " +
            "(Story) " +
            "=> " +
            "<NativeStorybookProvider><Story " +
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
            "/></NativeStorybookProvider> " +
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
            "] " +
            "};\n" +
            "export " +
            "default preview;\n",
        path: ".rnstorybook/preview.tsx"
    },
    {
        content:
            "import AsyncStorage " +
            "from " +
            "\"@react-native-async-storage/async-storage\";\n" +
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
            "import { view } " +
            "from " +
            "\"./storybook.requires\";\n" +
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
            "\n" +
            "const " +
            "StorybookUIRoot " +
            "= " +
            "view.getStorybookUI({ " +
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
            "storage: " +
            "{ " +
            "getItem: " +
            "AsyncStorage.getItem, " +
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
            "setItem: " +
            "AsyncStorage.setItem " +
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
            "} " +
            "});\n" +
            "export " +
            "default " +
            "StorybookUIRoot;\n",
        path: ".rnstorybook/index.tsx"
    },
    {
        content:
            "import type { ReactElement } from \"react\";\n\nexport const view = { " +
            "getStorybookUI: (_options?: unknown): (() => ReactElement | null) => () => null };\n",
        path: ".rnstorybook/storybook.requires.ts"
    }
];
const appFiles = (options: NativeAppGenerationOptions): NativeGeneratedApp =>
{
    const kind = options.kind ?? "development";
    const name = displayNameFor(options, kind);
    const packageName = packageNameFor(options, kind);
    return {
        files: [
            { content: packageManifest(packageName), path: "package.json" },
            { content: appJson(name, kind), path: "app.json" },
            { content: tsconfig(), path: "tsconfig.json" },
            { content: metroConfig(), path: "metro.config.cjs" },
            {
                content:
                    "import { registerRootComponent } from \"expo\";\nimport App from \"./App\";\n\n" +
                    "registerRootComponent(App);\n",
                path: "index.ts"
            },
            { content: appSource(name), path: "App.tsx" },
            { content: storyIndex(), path: "Stories/index.tsx" },
            {
                content: `import { stories } from "./index";\n\nexport default { title: "${name}" };\nexport const Welcome = stories[0]?.render;\n`,
                path: "Stories/Welcome.stories.tsx"
            },
            ...storybookConfig()
        ],
        kind,
        name,
        packageName,
        target: options.target
    };
};
export/** @internal */
const createNativeStorybookApp = (
    options: NativeAppGenerationOptions
): NativeGeneratedApp => appFiles(options);
export/** @internal */
const createNativeAuthoringFile = ({
    kind,
    name
}: NativeAuthoringOptions): NativeGeneratedFile =>
{
    const safeName = name.replace(/[^A-Za-z0-9_-]/g, "");
    if (kind === "story")
    {
        return {
            content: `import { Article, ArticleText } from "@sorrell/docs-react-native-storybook";

export default { title: "${safeName}" };
export const Default = () => (
    <Article title="${safeName}">
        <ArticleText>Story content</ArticleText>
    </Article>
);
`,
            path: `Stories/${safeName}.stories.tsx`
        };
    }
    if (kind === "example")
    {
        return {
            content: `import { ArticleExample, ArticleText } from "@sorrell/docs-react-native-storybook";

export const ${safeName} = (
    <ArticleExample title="${safeName}">
        <ArticleText>Example content</ArticleText>
    </ArticleExample>
);
`,
            path: `Examples/${safeName}.tsx`
        };
    }
    return {
        content: `import { Article, ArticleSection, ArticleText } from "@sorrell/docs-react-native-storybook";

export const ${safeName} = (
    <Article title="${safeName}">
        <ArticleSection title="Introduction">
            <ArticleText>Article content</ArticleText>
        </ArticleSection>
    </Article>
);
`,
        path: `Articles/${safeName}.tsx`
    };
};
export/** @internal */
const writeNativeStorybookApp = (
    app: NativeGeneratedApp
): Effect.Effect<void, unknown> =>
    Effect.gen(function* ()
    {
        const fileSystem = yield* DocsFileSystem;
        const path = yield* DocsPath;
        yield* (yield* SafeTargetValidation).validateEmpty(app.target);
        const writer = yield* AtomicWriter;
        yield* Effect.forEach(
            app.files,
            (file: NativeGeneratedFile) =>
            {
                const target = path.join(app.target, file.path);
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
export/** @internal */
const writeNativeAuthoringFile = (
    options: NativeAuthoringOptions
): Effect.Effect<void, unknown> =>
    Effect.gen(function* ()
    {
        const fileSystem = yield* DocsFileSystem;
        const path = yield* DocsPath;
        const writer = yield* AtomicWriter;
        const file = createNativeAuthoringFile(options);
        const target = path.join(options.target, file.path);
        yield* fileSystem.makeDirectory(path.dirname(target));
        yield* writer.writeText(target, file.content);
    }).pipe(
        Effect.provide(
            Layer.mergeAll(
                DocsFileSystem.layer,
                DocsPath.layer,
                AtomicWriter.layer
            )
        )
    );
