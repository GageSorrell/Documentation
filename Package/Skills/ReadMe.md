# @sorrell/docs-skills

Canonical workflow skills and the Effect-based managed installer used by
`sorrell-docs skills`.

The package includes the six repository skills and refuses to overwrite an
unmanaged skill directory. Project installs target `.codex/skills` by default;
use `--agent claude` for `.claude/skills` or `--scope user` for user-level
installation.
