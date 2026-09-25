---
title: Release readiness
description: Validate a generated documentation workspace from source through deployment.
group: Guides
order: 2
---

# Release readiness

A generated site is released as a set of independently buildable packages.
The release process validates the package graph, generated documentation, and
agent surfaces before a public deployment is promoted.

## Generated workspace

`sorrell-docs create` creates these applications:

| Package | Public surface | Responsibility |
| --- | --- | --- |
| `Landing` | `/` | Public landing page and Vercel rewrite owner. |
| `Documentation` | `/docs` | Astro articles, API references, Pagefind, and agent files. |
| `Storybook` | `/storybook` | Optional web Storybook manager and preview. |
| `Mcp` | `https://mcp.example.com` | Optional read-only MCP function. |

`Storybook` and `Mcp` are omitted when their configuration blocks are
disabled. Their child deployment URLs are release metadata, not canonical
navigation URLs.

## Routes and Vercel

The documentation and Storybook prefixes are normalized before generation.
They must start with `/`, must not end with `/` unless the prefix is `/`, and
must not overlap. The default prefixes are `/docs` and `/storybook`.

Landing rewrites both the prefix and its nested paths after child deployments
are available. This preserves API-reference links, Pagefind requests,
Storybook iframes, imported assets, and query strings while keeping the browser
URL on the public domain.

The deployment order is:

1. Build and verify Documentation.
2. Build and verify optional Storybook and MCP applications.
3. Deploy the child applications and record their immutable revisions.
4. Generate and deploy Landing with the child rewrites.
5. Verify the public routes and the MCP health endpoint.

Rollback restores the complete release manifest, including the exact child
deployments, API snapshot, agent corpus checksum, and route configuration.

## API snapshots and documentation

API generation reads configured package entry points through TypeDoc and
produces deterministic records. Snapshot files retain the package, module,
declaration kind, export count, introduction version, source location, GitHub
revision, and canonical URL. Validate a snapshot before publishing it.

Reference pages provide breadcrumbs, grouped module navigation, declaration
metadata, source links, signature blocks, stable anchors, and an `On this
page` table of contents. Articles and API modules expose `Copy for LLM` from
the same formatter that creates their Markdown twins.

## Agent access

The agent build emits:

- a root `llms.txt` from Landing;
- versioned `llms.txt` and `llms-full.txt` files;
- Markdown twins beside article, API-module, and Storybook component pages;
- `agent/manifest.json` and `agent/corpus/{version}.json`;
- optional generated product skills under `agent/skills/`;
- an optional MCP search index and health endpoint.

Agent files are static, noindexed, excluded from Pagefind and the sitemap, and
must not contain JSX, raw HTML, or unresolved MDX components. `sorrell-docs
agent verify` checks checksums and link coverage before release.

## Storybook and native applications

Web Storybook is built with the configured `/storybook/` base path. Verify the
manager, Docs pages, preview iframe, controls, Autodocs prop tables, imported
assets, theme bridge, and nested URLs.

The `sorrell-docs story` group generates Expo applications and native
Storybook authoring files. The Development application is exhaustive; the
Demonstration application is the curated public API. Consumer validation must
use package exports and include Android/iOS-compatible configuration.

## Package validation

Every published `@sorrell/docs-*` package contains compiled JavaScript,
declarations, its `ReadMe.md`, and only the files named by its manifest. The
repository release check packs every package, validates the six canonical
skills and their references, confirms that only `sorrell-docs` is exposed, and
installs the packed artifacts into an isolated consumer before importing them.

Run the checks from a clean checkout with:

```sh
npm ci
npm run check
```

The final check includes lint, TypeScript, unit tests, application builds,
package packing, binary-manifest checks, and the packed consumer test. A
release is ready only when those checks and the final browser scenarios pass
at desktop, tablet, and feasible mobile widths with keyboard navigation.
