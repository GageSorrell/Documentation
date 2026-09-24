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

Use `sorrell-docs story add article` only for native Storybook articles. Web
documentation belongs in the Documentation application.

Read [Authoring](references/Authoring.md) and [Frontmatter](references/Frontmatter.md)
for the content contract.
