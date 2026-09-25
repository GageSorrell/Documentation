# Release checks

Run `npm run check` from a clean checkout. It validates lint, TypeScript,
tests, static builds, API snapshots, Pagefind, packed artifacts, package
exports, the single `sorrell-docs` binary, and an isolated packed consumer.

Verify `/`, `/docs`, versioned/API-reference links, Pagefind, OG images,
`/storybook/`, assets, redirects, themes, keyboard behavior, and mobile layout.
Verify `/llms.txt`, versioned agent files, Markdown twins, generated product
skills, and the MCP preview health endpoint when those features are enabled.
Failed verification must not promote Landing.
