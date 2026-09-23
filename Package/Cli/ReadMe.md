# `@sorrell/docs-cli`

Shared Effect v4 runtime services for the Sorrell documentation tools.

The package pins `effect`, `@effect/platform-node`, and `@effect/vitest` to the
same `4.0.0-rc.117` release. Upgrade these RC packages atomically: update all
three exact versions together, run the package and repository checks, inspect
the Effect v4 migration notes, and commit the lockfile with the compatibility
change. Published manifests must not use floating `@rc` ranges.
