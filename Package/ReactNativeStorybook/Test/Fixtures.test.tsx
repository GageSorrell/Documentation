/**
 *
 *
 * @module @sorrell/docs-react-native-storybook/Test/Fixtures.test
 *
 * @file      Fixtures.test.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { decorators, story } from "./Fixtures/Story.js";
import { describe, expect, it } from "vitest";
import { article } from "./Fixtures/Article.js";
import { example } from "./Fixtures/Example.js";
import { isValidElement } from "react";
describe("public native Storybook fixtures", () =>
{
    it("discovers stories, examples, and articles through public exports", () =>
    {
        expect(isValidElement(story())).toBe(true);
        expect(isValidElement(example)).toBe(true);
        expect(isValidElement(article)).toBe(true);
        expect(decorators).toHaveLength(3);
    });
});
