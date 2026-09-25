---
name: sorrell-docs-publish-site
description: Build, verify, and publish a Sorrell documentation website safely.
---

# Publish a documentation site

Treat publication as a staged release. Run `sorrell-docs build` and
`sorrell-docs verify` before any deployment command. Do not promote a release
that has failed route, API, Storybook, accessibility, or content checks.

## Workflow

1. Confirm the working tree, configuration, API snapshot, and package versions.
2. Run `sorrell-docs build --target <directory>`.
3. Run `sorrell-docs agent verify --target <directory>` and review corpus,
   Markdown-twin, and MDX diagnostics.
4. If product skills are enabled, confirm the generated `SKILL.md`,
   `references/`, and `.zip` archive, then run `sorrell-docs verify --target
   <directory>` and review diagnostics.
5. Use `sorrell-docs deploy preview` for preview validation, then
   `sorrell-docs deploy production` only with explicit release authorization.
6. Record the release manifest and use `sorrell-docs deploy rollback` if the
   verified public routes do not match the release.

Documentation and optional web Storybook deploy before Landing; Landing owns
the public rewrites. Native Storybook exports are verified separately with
`sorrell-docs story verify`.

Read [Build and Deploy](references/BuildDeploy.md) and [Release Checks](references/ReleaseChecks.md)
for the ordered gates. The release check also packs every published package
and tests it from an isolated consumer, so a workspace-only import is not
sufficient evidence of readiness.
