---
name: sorrell-docs-create-site
description: Create and configure a Sorrell documentation website with the sorrell-docs CLI.
---

# Create a Sorrell documentation site

Use `sorrell-docs create` to create a generated website workspace in a new
directory. Ask whether the site needs web Storybook, then pass
`--storybook` or `--no-storybook` in non-interactive environments.

## Workflow

1. Confirm the target directory is empty and collect the site's name, URL,
   navigation, documentation versions, and package list.
2. Set `storybook.enabled` in `docs.config.json` and run `sorrell-docs create --config docs.config.json --target <directory>` when web Storybook
   is required.
3. Add authored content with `sorrell-docs add article`, packages with
   `sorrell-docs add package`, and versions with `sorrell-docs add version`.
4. Use `sorrell-docs dev` while authoring and `sorrell-docs verify` before
   handing the workspace to the publishing workflow.

Generated sites contain `Landing`, `Documentation`, and an optional
`Storybook` application. Preserve the configured `/docs` and `/storybook`
prefixes when linking between applications.

Read [Configuration](references/Configuration.md) for the initialization
contract and [Generated Structure](references/GeneratedStructure.md) before
customizing generated files.
