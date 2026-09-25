# Build and deploy

Build API/reference data, Documentation, Pagefind, optional Storybook, agent
output, and Landing in order. Verify `agent/manifest.json`, per-version
corpora, `llms.txt`, `llms-full.txt`, and Markdown twins before deployment.
When product skills are enabled, also verify `SKILL.md`, `references/`, the
archive, and its manifest checksum.
Publish child deployments first and Landing last; preserve exact revisions in
the release manifest.
