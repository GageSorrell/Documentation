---
name: sorrell-docs-publish-site
description: Build, verify, and publish a Sorrell documentation website safely.
---

# Publish a documentation site

Run `sorrell-docs build` and `sorrell-docs verify` before deployment. Use
`sorrell-docs deploy preview` for validation and authorize
`sorrell-docs deploy production` explicitly. Documentation and optional
Storybook publish before Landing, which owns public rewrites.

Verify agent output with `sorrell-docs agent verify`; this checks corpus
checksums, Markdown twins, product-skill artifacts, and unresolved MDX
diagnostics before publication. Product skills require an explicit
`agent.description` and can be installed with `sorrell-docs skills install
--from <directory|archive-url>`.

Read [Build and Deploy](references/BuildDeploy.md) and
[Release Checks](references/ReleaseChecks.md). The release check also packs
every published package and tests it from an isolated consumer, so a
workspace-only import is not sufficient evidence of readiness.
