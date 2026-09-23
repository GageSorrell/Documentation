# Repository instructions

This repository is the Sorrell Documentation monorepo. `Documentation` is the
published dogfood site, `Website` is the web-package development sandbox, and
the two `Application` directories are Expo/React Native Storybook applications.

## Tool usage

Use `agent-browser` for browser testing. Documentation and Storybook surfaces
must work at desktop, tablet, and feasible mobile widths, and must remain usable
with keyboard navigation. Run the baseline checks with `npm run check` before
handing off repository changes.

## Directory responsibilities

| Directory | Responsibility |
| --- | --- |
| `Application/Demonstration` | Polished public-API Expo Storybook showcase. |
| `Application/Development` | Exhaustive workspace-source Expo Storybook environment. |
| `Configuration` | Shared ESLint and TypeScript configuration. Keep other configuration beside the tool or at the repository root. |
| `Documentation` | Published dogfood site and its authored documentation content. |
| `Package` | Published npm packages. Directory names are PascalCase and package manifests set `"private": false`. |
| `Resource` | Shared development assets that are not packaged with a consumer. |
| `Script` | Private packages and repository automation. Directory names are PascalCase. |
| `Skill` | Installable AI skill source bundles, one PascalCase directory per skill. |
| `Website` | Web-package development sandbox; it is not the published documentation site. |

## Documentation files

Markdown and MDX content may be nested beneath the owning package or site
content root. This is intentional: authored versioned documentation, Storybook
articles, and static assets need stable nested paths. Repository governance
documents remain at their documented top-level locations, and all authored
Markdown uses GitHub-Flavored Markdown conventions unless an MDX file is
explicitly required by the website or Storybook pipeline.

## Effect conventions

- Pin the aligned Effect v4 RC packages to `4.0.0-rc.117` until an atomic upgrade is approved.
- Use `Argument`, `Command`, `Flag`, and `Prompt` from `effect/unstable/cli`.
- Use `NodeRuntime.runMain` with `NodeServices.layer` from `@effect/platform-node` for executables.
- Use `ChildProcess` and `ChildProcessSpawner` from `effect/unstable/process` with executable and argument arrays. Do not compose shell command strings.
- Use Effect services, layers, schemas, streams, scoped resources, tagged errors, and structured logging for Node-heavy automation.
- Do not introduce Commander, Yargs, oclif, cac, `@effect/cli` v3, or a separate prompt library.
- Keep Astro templates, React components, and React Native presentation idiomatic when Effect does not provide lifecycle, validation, concurrency, or error-model value.

## Workspace and package rules

The root workspace includes `Application/*`, `Documentation`, `Package/*`,
`Script/*`, and `Website`. Only the two reserved public executable names may
be exposed: `sorrell-docs` and `sorrell-storybook`. Published packages use the
`@sorrell/docs-` prefix and publish compiled output plus declarations.
Use PascalCase for module path segments, including `@module` documentation
names, such as `@sorrell/docs-cli/Services` and
`@sorrell/docs-cli/Test/RuntimeTest`.

Keep the normative plan at `Documentation/ImplementationPlan.md` and the
ordered gates at `Documentation/DevelopmentMilestones.md`. `Local` is working
input and review material; it is not the published documentation source.
