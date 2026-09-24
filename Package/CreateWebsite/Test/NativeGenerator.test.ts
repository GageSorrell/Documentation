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

import { describe, expect, it } from "vitest";
import { createNativeAuthoringFile, createNativeStorybookApp } from "../Source/NativeGenerator.js";

describe("native Storybook generator", () => {
    it("creates a development Expo app with public native Storybook wiring", () => {
        const app = createNativeStorybookApp({ target: "fixture", kind: "development" });
        const paths = app.files.map(({ path }) => path);
        expect(app.packageName).toBe("@sorrell/application-development");
        expect(paths).toEqual(expect.arrayContaining([ "app.json", "metro.config.cjs", ".rnstorybook/main.ts", "Stories/index.tsx", "App.tsx" ]));
        expect(app.files.find(({ path }) => path === "metro.config.cjs")?.content).toContain("withStorybook");
    });

    it("creates native authoring templates in stable directories", () => {
        expect(createNativeAuthoringFile({ target: "fixture", kind: "story", name: "Button" }).path).toBe("Stories/Button.stories.tsx");
        expect(createNativeAuthoringFile({ target: "fixture", kind: "example", name: "States" }).path).toBe("Examples/States.tsx");
        expect(createNativeAuthoringFile({ target: "fixture", kind: "article", name: "GettingStarted" }).path).toBe("Articles/GettingStarted.tsx");
    });
});
