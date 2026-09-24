# Sorrell Documentation, Storybook, Effect CLI, and AI Skills Monorepo

## Summary

Build a publishable toolkit that reproduces the reference Astro documentation
experience while making its branding, content, packages, navigation, and
component workbench configurable. Generated sites consist of independent
`Landing`, `Documentation`, and optional `Storybook` application packages,
routed by Vercel at `/`, `/docs`, and `/storybook`. The toolkit also provides
reusable React Native Storybook infrastructure, Effect v4 RC-powered
automation, and six installable AI skills.

Expose exactly one public binary:

- `sorrell-docs` — websites, web Storybook, native Storybook, content, skills, builds, API references, and publishing.

Generated websites use `Landing` for `/`, `Documentation` for `/docs`, and an
optional `Storybook` package for `/storybook`. `Documentation` is the published
dogfood site, `Website` is the web-package development sandbox, and both
`Application` subdirectories are Android/iOS Expo Storybook apps.

## Effect v4 RC Foundation

Pin the initial aligned RC release to `4.0.0-rc.117` for `effect`,
`@effect/platform-node`, and `@effect/vitest`. Commit exact versions and the
lockfile. Upgrade aligned Effect RC packages atomically after compatibility
checks; never use floating RC ranges in published manifests.

Use Effect CLI `Argument`, `Command`, `Flag`, and `Prompt`; run entrypoints with
`NodeRuntime.runMain` and `NodeServices.layer`; use `ChildProcess` and
`ChildProcessSpawner` from `effect/unstable/process` with executable and
argument arrays; and use Effect `FileSystem`, `Path`, `Terminal`, `Config`,
`Schema`, `Stream`, `Layer`, and structured logging for Node automation.
Expected failures are tagged errors with actionable messages and exit codes.
Use `@effect/vitest` and test layers for services, command handlers,
interruption, retries, and error rendering.

## Packages and public interfaces

Every published package uses the `@sorrell/docs-` prefix, lives in a PascalCase
directory beneath `Package`, sets `"private": false`, and publishes compiled
output and declarations.

| Package | Responsibility |
| --- | --- |
| `@sorrell/docs-core` | Schema-backed configuration and shared domain models. |
| `@sorrell/docs-ui` | Astro layouts, React islands, tokens, landing sections, documentation chrome, MDX primitives, Copy for LLM controls, and assets. |
| `@sorrell/docs-astro` | Astro integration, `/docs` base-path content, Markdown/MDX, routes, article/reference-page integration, Pagefind, redirects, SEO, OG images, and verification. |
| `@sorrell/docs-cli` | Shared Effect services, layers, errors, process execution, atomic filesystem operations, logging, and CLI utilities. |
| `@sorrell/docs-storybook-web` | Independent React/Vite Storybook application, `/storybook` base-path configuration, themes, Autodocs, decorators, and build helpers. |
| `@sorrell/docs-api-reference` | Effect-based TypeDoc discovery, datasets, validation, checksums, snapshots, restore, and rollback inputs. |
| `@sorrell/docs-react-native-storybook` | Expo/Storybook providers, persistence, Metro integration, decorators, controls, and native article primitives. |
| `@sorrell/docs-create-website` | The `sorrell-docs` binary and website/content/build/publication, web Storybook, and Expo/native Storybook commands. |
| `@sorrell/docs-skills` | Canonical AI skills and Effect-based installation services; no competing binary. |

`defineDocsConfig()` is backed by Effect Schema and covers metadata, tokens,
navigation, versions, landing content, packages, API sources, redirects,
Storybook, repository links, normalized route prefixes, Vercel project maps,
and release manifests. Runtime decoding diagnostics include the failing path
and expected value. The binary supports prompts and
equivalent non-interactive flags, supported package managers, and refuse
non-empty destinations.

Every article and API/reference page includes an accessible `Copy for LLM`
button at the top of the document content. It copies a normalized,
model-friendly representation of that page, including its title, version or
package context, canonical URL, and documentation content. The control is not
rendered on unrelated landing, navigation, Storybook, or utility pages.

### API reference presentation contract

Generated TypeDoc reference pages must reproduce the API-reference experience
of the Effect v4 reference page at
`https://effect.website/docs/v4/api/platform-deno/DenoChildProcessSpawner`.
The generated reference shell includes:

- The documentation header with Docs, Onboarding, Guides, Reference, version
  selection, search, repository/community links, and theme controls where those
  features are enabled by the site configuration.
- A reference sidebar showing the API-reference label, package name, package
  version, grouped modules, collapsible categories, and the active module.
- Breadcrumbs in the form `API REFERENCE / {version} / {package} / {module}`.
- A module header containing the module name, summary, rendered JSDoc prose,
  export count, `Added in {version}` metadata, and a GitHub source link.
- Category sections such as Layers, Models, and Transforming, with stable
  anchors and an `On this page` table of contents that follows those sections
  and declarations.
- Declaration entries with their name, kind badge such as `INTERFACE`,
  description, `Added in {version}` metadata, GitHub source link, and a
  syntax-highlighted signature block with a copy control.

The API data model must therefore retain package/module identity, category and
declaration ordering, declaration kind, export counts, introduction versions,
JSDoc content, signature text, source file and line information, repository
revision, and canonical links. Source links must resolve to stable GitHub URLs
for the exact generated revision. The layout must preserve the three-column
desktop experience and provide usable sidebar and table-of-contents behavior at
smaller widths.

## CLI contracts

### Generated website packages and Vercel routing

Generated websites are workspaces containing three independently buildable
application packages:

- `Landing` owns `/` and the public custom domain.
- `Documentation` is an Astro application built with the configured
  documentation prefix, defaulting to `/docs`.
- `Storybook` is an optional React/Vite application built with the configured
  Storybook prefix, defaulting to `/storybook`.

When Storybook is disabled, its package, dependencies, route, Vercel project,
and deployment are omitted.

The landing package receives generated Vercel rewrites after child deployments
are available. It rewrites the documentation and Storybook prefixes, including
nested paths and assets, to immutable child deployment URLs or stable aliases.
Child deployment URLs never appear in canonical URLs or generated navigation.

The normalized configuration exposes `documentationPrefix` and
`storybookPrefix`, validates leading slashes, disallows trailing slashes and
overlapping prefixes, and exposes a Vercel project map for `landing`,
`documentation`, and optional `storybook` packages.

`sorrell-docs` provides `init`, `add article|package|version`, `dev`, `build`,
`verify`, `storybook init|dev|build|verify`, `storybook add story|example|article`,
`story init|dev|generate|verify`, `story add story|example|article`,
`api generate|validate|snapshot|restore`, `deploy preview|production|rollback`,
and `skills list|install|update|uninstall`. The `story` group owns Expo and
React Native Storybook creation and authoring; the `storybook` group owns web
Storybook. `dev` runs the three web packages behind temporary local routing;
`build` builds Documentation and optional Storybook before Landing and emits a
release manifest; deployment publishes child Vercel projects first, generates
Landing rewrites, publishes Landing last, verifies the shared routes, and
records the complete release; rollback restores a previous release manifest.
All commands use Effect-managed subprocesses with structured concurrency and
interruption cleanup.

## Web and native Storybook

The independent web Storybook package uses `@storybook/react-vite`, `@storybook/addon-docs`,
Autodocs, controls, Doc Blocks, official themes, inferred props, and a theme
message bridge at `/storybook/`. Its production build uses the normalized
`/storybook/` base path, is deployed as its own Vercel project, is excluded
from Pagefind and the documentation sitemap, and is `noindex`. The Landing
project owns the public rewrite to it.

The React Native package provides provider composition, persistent selection,
Metro integration, controls, gesture/safe-area/keyboard providers, theme
overrides, decorators, and `Article` primitives. Both Expo applications must
remain compatible with Android and iOS development clients.

## Automation, skills, and repository implementation

Use reusable Effect services for workspace discovery, package-manager
selection, templates, safe targets, manifests, Git, Vercel, archives,
checksums, retries, and atomic promotion. Keep npm and GitHub Actions thin.
Store six skill bundles under PascalCase `Skill` directories with canonical
kebab-case install names, use `sorrell-docs` in examples, and refuse unmanaged
installation collisions.

Establish npm workspaces for both Expo apps, generated `Landing`/`Documentation`/
optional `Storybook` applications, `Documentation`, packages, scripts, and
`Website`; centralize the Node 24 and strict TypeScript 6 compiler baseline
under `Configuration`, keep tool-specific policy beside its tool, allow nested
documentation content; and use
`agent-browser` at desktop, tablet, and feasible mobile widths.

The full plan also requires API snapshots, Pagefind, Vercel project rewrites,
release manifests, child-first deployment, package-consumer tests, Expo
exports/prebuilds, and final browser verification of `/`, `/docs`, versioned
and API-reference paths, and optional `/storybook`. These are ordered by
`Documentation/DevelopmentMilestones.md` and are intentionally implemented
only after their preceding gates pass.
