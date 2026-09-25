# Release checks

Run `npm run check` from a clean checkout. It validates lint, TypeScript,
tests, static builds, API snapshots, Pagefind, packed artifacts, package
exports, the single `sorrell-docs` binary, and an isolated packed consumer.

Verify `/`, `/docs`, versioned and API-reference links, Pagefind, OG images,
and `/storybook/` when enabled. Check nested assets, redirects, canonical
metadata, themes, keyboard behavior, and mobile layout through the Landing
deployment. Verify `/llms.txt`, versioned agent files, Markdown twins,
generated product skills, and the MCP preview health endpoint when enabled.

A failed child deployment or route verification must leave the Landing
deployment unpublished. Roll back to an exact prior release manifest rather
than reconstructing deployment identifiers manually.
