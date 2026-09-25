# Build and deploy

The ordered build graph is API/reference generation, Documentation, Pagefind,
optional web Storybook, agent output, and Landing. Deployment publishes child
projects first, generates Landing rewrites from their exact deployments, and
publishes Landing last.

When `agent.skill.enabled` is true, verify the generated `SKILL.md`,
`references/`, archive, and manifest checksums before deployment.

Keep child deployment URLs out of canonical links and generated navigation.
Use the release manifest to pair revisions and support rollback.
