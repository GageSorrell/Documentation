---
name: sorrell-docs-author-native-stories
description: Author native Storybook stories, examples, and articles with sorrell-docs story.
---

# Author native Storybook documentation

Use the `sorrell-docs story` command group for Expo and React Native content.
Native Storybook is separate from the web Storybook package.

## Workflow

1. Run `sorrell-docs story add story --target <app> --name <Name>` for a typed
   CSF story with shared decorators.
2. Run `sorrell-docs story add example` for a full-screen multi-state showcase.
3. Run `sorrell-docs story add article` for a native article using the shared
   article primitives.
4. Run `sorrell-docs story verify` and inspect the Android/iOS exports.

Keep examples usable with keyboard navigation, safe areas, light/dark themes,
and the persisted Storybook selection.

Read [Native Authoring](references/NativeAuthoring.md) and [Articles](references/Articles.md)
for the content shapes.
