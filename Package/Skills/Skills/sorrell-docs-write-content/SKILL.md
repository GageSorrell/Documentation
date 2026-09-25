---
name: sorrell-docs-write-content
description: Author clear, versioned Markdown and MDX documentation for a Sorrell site.
---

# Write documentation

Author content beneath the configured Documentation root. Include complete
frontmatter, task-oriented examples, and links to related pages. Use
`sorrell-docs dev` to review and `sorrell-docs verify` after editing. Use
`sorrell-docs story add article` only for native Storybook articles.

Use the `agent` configuration block for curated essentials. Supported MDX
primitives are converted to Markdown twins during `sorrell-docs agent build`;
unresolved components fail agent-output verification. Copy for LLM and the
Markdown twin use the same normalized document.

Product skills require `agent.skill.enabled`, a kebab-case
`agent.skill.name`, and an author-written `agent.description`; the build
rejects an enabled skill without that description.

Read [Authoring](references/Authoring.md) and
[Frontmatter](references/Frontmatter.md).
