/**
 *
 *
 * @module @sorrell/docs-create-website/Test/NativeGenerator.test
 *
 * @file      NativeGenerator.test.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    createNativeAuthoringFile,
    createNativeStorybookApp
} from "../Source/NativeGenerator.js";
import { describe, expect, it } from "vitest";
describe("native Storybook generator", () =>
{
    it("creates a development Expo app with public native Storybook wiring", () =>
    {
        const app = createNativeStorybookApp({
            kind: "development",
            target: "fixture"
        });
        const paths = app.files.map(({ path }: NativeGeneratedFile) => path);
        expect(app.packageName).toBe("@sorrell/application-development");
        expect(paths).toEqual(
            expect.arrayContaining([
                "app.json",
                "metro.config.cjs",
                ".rnstorybook/main.ts",
                "Stories/index.tsx",
                "App.tsx"
            ])
        );
        expect(
            app.files.find(
                ({ path }: NativeGeneratedFile) => path === "metro.config.cjs"
            )?.content
        ).toContain("withStorybook");
    });
    it("creates native authoring templates in stable directories", () =>
    {
        expect(
            createNativeAuthoringFile({
                kind: "story",
                name: "Button",
                target: "fixture"
            }).path
        ).toBe("Stories/Button.stories.tsx");
        expect(
            createNativeAuthoringFile({
                kind: "example",
                name: "States",
                target: "fixture"
            }).path
        ).toBe("Examples/States.tsx");
        expect(
            createNativeAuthoringFile({
                kind: "article",
                name: "GettingStarted",
                target: "fixture"
            }).path
        ).toBe("Articles/GettingStarted.tsx");
    });
});
