---
name: sorrell-docs-write-content
description: Author clear, versioned Markdown and MDX documentation for a Sorrell site.
---

# Write documentation

Use the existing site's content root and its configured documentation version.
Do not invent a parallel content convention. Run `sorrell-docs dev` to review
the page in context and use `sorrell-docs verify` after editing.

## Workflow

1. Choose an article id and place the file beneath the owning documentation
   content root.
2. Add complete frontmatter: title, description, group, order, and draft.
3. Write a task-oriented introduction, examples, and links to related pages.
4. Use MDX only when the site's supported primitives add reader value.
5. Put a Copy for LLM control at the top through the site's standard layout;
   do not add a second page-specific implementation.
6. Keep the article's Markdown twin agent-readable: supported inline MDX is
   converted to Markdown during the agent build, while unresolved components
   are reported as build diagnostics and must be resolved before publishing.

When the `agent` block is enabled, add curated article ids to `agent.essentials`
only when they belong in the site's short agent index. The generated Markdown
twin and Copy for LLM output are produced from the same normalized document.

To publish a product skill, set `agent.skill.enabled: true`, provide a
kebab-case `agent.skill.name`, and write an explicit `agent.description`.
Descriptions are author-owned: builds reject enabled product skills without
one.

Use `sorrell-docs story add article` only for native Storybook articles. Web
documentation belongs in the Documentation application.

Read [Authoring](references/Authoring.md) and [Frontmatter](references/Frontmatter.md)
for the content contract.
