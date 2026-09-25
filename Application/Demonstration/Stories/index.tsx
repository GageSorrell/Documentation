/**
 *
 *
 * @module @sorrell/application-demonstration/Stories
 *
 * @file      index.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/* eslint-disable @stylistic/max-len, sort-keys */

import { Article, ArticleExample, ArticleSection, ArticleText } from "@sorrell/docs-react-native-storybook";
import type { ReactElement } from "react";

/** @internal */
export interface NativeStoryEntry { readonly id: string; readonly title: string; readonly render: () => ReactElement; }

export /** @internal */
const stories: ReadonlyArray<NativeStoryEntry> = [
    { id: "public-api", title: "Public API", render: () => <Article title="Public API"><ArticleSection title="Demonstration"><ArticleText>This fixture showcases the polished public package surface.</ArticleText></ArticleSection><ArticleExample title="Compose"><ArticleText>Providers and article primitives compose together.</ArticleText></ArticleExample></Article> }
];
