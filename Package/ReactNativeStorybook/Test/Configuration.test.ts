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

import { createNativeTheme, resolveNativeThemeMode } from "../Source/Theme.js";
import { describe, expect, it } from "vitest";
import { createControlsDefaults } from "../Source/Controls.js";
import { createMetroConfig } from "../Source/Metro.js";
describe("native Storybook configuration", () =>
{
    it("provides stable controls defaults and preserves overrides", () =>
    {
        expect(
            createControlsDefaults({ exclude: [ "style" ], sort: "alpha" })
        ).toMatchObject({ exclude: [ "style" ], expanded: true, sort: "alpha" });
    });
    it("normalizes Metro and theme configuration", () =>
    {
        const config = createMetroConfig(
            { resolver: { sourceExts: [ "js", "tsx" ] } },
            { enabled: true }
        );
        expect(config.resolver).toMatchObject({
            sourceExts: [ "js", "tsx", "ts" ]
        });
        expect(config.storybook).toMatchObject({
            configPath: ".storybook",
            enabled: true
        });
        expect(resolveNativeThemeMode("system", "dark")).toBe("dark");
        expect(createNativeTheme("dark", "light").colors.background).toBe(
            "#09090b"
        );
    });
});
