/**
 *
 *
 * @module @sorrell/docs-react-native-storybook/Test/Persistence.test
 *
 * @file      Persistence.test.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { describe, expect, it } from "vitest";
import { createMemorySelectionStorage, decodeSelection, encodeSelection, readSelection, writeSelection } from "../Source/Persistence.js";

describe("native Storybook persistence", () => {
    it("round-trips a story and theme selection", async () => {
        const storage = createMemorySelectionStorage();
        const selection = { storyId: "article/getting-started", themeMode: "dark" as const };
        await writeSelection(storage, "selection", selection);
        await expect(readSelection(storage, "selection")).resolves.toEqual(selection);
        expect(decodeSelection(encodeSelection(selection))).toEqual(selection);
    });

    it("ignores malformed persisted values", () => {
        expect(decodeSelection("not-json")).toEqual({});
        expect(decodeSelection(JSON.stringify({ storyId: 42, themeMode: "neon" }))).toEqual({});
    });
});
