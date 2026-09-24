---
name: sorrell-docs-create-story
description: Create and operate an Expo React Native Storybook application with sorrell-docs.
---

# Create native Storybook

Use `sorrell-docs story init` to create an Expo dev-client application. Select
`--kind development` for exhaustive workspace-source stories or
`--kind demonstration` for the polished public-API showcase.

## Workflow

1. Initialize the target with `sorrell-docs story init --target <directory>`.
2. Author content with `sorrell-docs story add story`, `example`, or `article`.
3. Run `sorrell-docs story dev` with a development client for interactive work.
4. Run `sorrell-docs story generate --platform all` and
   `sorrell-docs story verify` before delivery.

Generated apps use the shared provider, persistence, theme, safe-area,
gesture, keyboard, and Metro integration from `@sorrell/docs-react-native-storybook`.

Read [Native Apps](references/NativeApps.md) and [Commands](references/Commands.md)
for the application boundary and verification sequence.
