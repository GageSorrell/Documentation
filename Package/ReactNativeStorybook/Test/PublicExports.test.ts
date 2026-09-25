/**
 *
 *
 * @module @sorrell/docs-react-native-storybook/Test/PublicExports.test
 *
 * @file      PublicExports.test.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as NativeStorybook from "../Source/index.js";
import { describe, expect, it } from "vitest";
describe("public native Storybook exports", () =>
{
    it("exposes the provider, decorators, articles, and Metro helpers", () =>
    {
        expect(NativeStorybook.NativeStorybookProvider).toBeTypeOf("function");
        expect(NativeStorybook.createNativeDecorators).toBeTypeOf("function");
        expect(NativeStorybook.Article).toBeTypeOf("function");
        expect(NativeStorybook.withStorybookMetro).toBeTypeOf("function");
    });
});
