---
name: sorrell-docs-author-web-stories
description: Author React stories and examples for the independent Sorrell web Storybook.
---

# Author web Storybook documentation

Use the web Storybook package for React component work. Initialize it with
`sorrell-docs storybook init`, run it with `sorrell-docs storybook dev`, and
build it with `sorrell-docs storybook build`.

## Workflow

1. Define the component and typed CSF metadata.
2. Add stories with controls and autodocs-friendly args.
3. Add an example or article when a component needs a multi-state showcase or
   narrative explanation.
4. Confirm the `/storybook` base path, theme synchronization, controls, and
   nested assets with `sorrell-docs storybook verify`.

Do not put native Expo stories in this package. Use `sorrell-docs story` for
native Storybook authoring.

Read [Stories](references/Stories.md) and [Verification](references/Verification.md)
for the supported web conventions.
