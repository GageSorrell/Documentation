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

import { ArticleText, createNativeDecorators, type NativeStoryRenderer } from "../../Source/index.js";

export const story: NativeStoryRenderer = () => <ArticleText>Fixture story</ArticleText>;

export const decorators = createNativeDecorators("Fixture Story");
