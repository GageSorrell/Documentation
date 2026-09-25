/**
 *
 *
 * @module @sorrell/docs-react-native-storybook/Test/Fixtures/Story
 *
 * @file      Story.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    ArticleText,
    type NativeStoryRenderer,
    createNativeDecorators
} from "../../Source/index.js";
export/** @internal */
const story: NativeStoryRenderer = () => (
    <ArticleText>Fixture story</ArticleText>
);
export/** @internal */
const decorators =
    createNativeDecorators("Fixture Story");
