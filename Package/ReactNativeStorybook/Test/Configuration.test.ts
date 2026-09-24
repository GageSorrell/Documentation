/**
 *
 *
 * @module @sorrell/docs-react-native-storybook/Test/Configuration.test
 *
 * @file      Configuration.test.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { describe, expect, it } from "vitest";
import { createControlsDefaults } from "../Source/Controls.js";
import { createMetroConfig } from "../Source/Metro.js";
import { createNativeTheme, resolveNativeThemeMode } from "../Source/Theme.js";

describe("native Storybook configuration", () => {
    it("provides stable controls defaults and preserves overrides", () => {
        expect(createControlsDefaults({ sort: "alpha", exclude: [ "style" ] })).toMatchObject({ expanded: true, sort: "alpha", exclude: [ "style" ] });
    });

    it("normalizes Metro and theme configuration", () => {
        const config = createMetroConfig({ resolver: { sourceExts: [ "js", "tsx" ] } }, { enabled: true });
        expect(config.resolver).toMatchObject({ sourceExts: [ "js", "tsx", "ts" ] });
        expect(config.storybook).toMatchObject({ enabled: true, configPath: ".storybook" });
        expect(resolveNativeThemeMode("system", "dark")).toBe("dark");
        expect(createNativeTheme("dark", "light").colors.background).toBe("#09090b");
    });
});
