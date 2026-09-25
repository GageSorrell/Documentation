# Site configuration

The generated `docs.config.json` is the source of truth for metadata,
navigation, versions, packages, API generation, Storybook, route prefixes, and
Vercel project mapping. Keep route prefixes lowercase, begin them with `/`,
and do not add a trailing slash.

The default public surfaces are:

- `/` for Landing
- `/docs` for Documentation
- `/storybook` for web Storybook when enabled

Use the normalized configuration rather than hard-coding these values in
links, canonical metadata, redirects, or assets.
