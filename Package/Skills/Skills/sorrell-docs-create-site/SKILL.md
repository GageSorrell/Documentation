---
name: sorrell-docs-create-site
description: Create and configure a Sorrell documentation website with the sorrell-docs CLI.
---

# Create a Sorrell documentation site

Use `sorrell-docs create --config docs.config.json --target <directory>` to create a generated site. Add
`--storybook` when the site needs web Storybook. Use `sorrell-docs dev` while
authoring and `sorrell-docs verify` before publishing.

Generated sites contain `Landing`, `Documentation`, and optional `Storybook`
applications. Preserve normalized `/docs` and `/storybook` prefixes.

Read [Configuration](references/Configuration.md) and
[Generated Structure](references/GeneratedStructure.md).
