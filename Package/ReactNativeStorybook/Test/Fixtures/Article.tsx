/**
 *
 *
 * @module @sorrell/docs-react-native-storybook/Test/Fixtures/Article
 *
 * @file      Article.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Article, ArticleCallout, ArticleCode, ArticleSection, ArticleText } from "../../Source/index.js";

export const article = <Article title="Fixture article">
    <ArticleSection title="Introduction"><ArticleText>Native article content.</ArticleText></ArticleSection>
    <ArticleCode language="tsx">export const value = true;</ArticleCode>
    <ArticleCallout title="Note">Fixture callout</ArticleCallout>
</Article>;
