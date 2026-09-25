/**
 *
 *
 * @module @sorrell/application-development/Stories
 *
 * @file      index.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/* eslint-disable @stylistic/max-len, sort-keys */

import { Article, ArticleCallout, ArticleCode, ArticleExample, ArticleSection, ArticleText } from "@sorrell/docs-react-native-storybook";
import type { ReactElement } from "react";

/** @internal */
export interface NativeStoryEntry { readonly id: string; readonly title: string; readonly render: () => ReactElement; }

export /** @internal */
const stories: ReadonlyArray<NativeStoryEntry> = [
    { id: "workspace-overview", title: "Workspace overview", render: () => <Article title="Workspace overview"><ArticleSection title="Development"><ArticleText>This fixture exercises workspace-source components.</ArticleText></ArticleSection><ArticleExample title="Public API"><ArticleText>Every component is imported from the native Storybook package.</ArticleText></ArticleExample><ArticleCode language="tsx">const story = true;</ArticleCode><ArticleCallout title="Note">Use this app for exhaustive source coverage.</ArticleCallout></Article> }
];
