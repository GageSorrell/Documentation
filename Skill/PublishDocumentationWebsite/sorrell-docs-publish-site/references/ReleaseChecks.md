# Release checks

Verify `/`, `/docs`, versioned and API-reference links, Pagefind, OG images,
and `/storybook/` when enabled. Check nested assets, redirects, canonical
metadata, themes, keyboard behavior, and mobile layout through the Landing
deployment.

A failed child deployment or route verification must leave the Landing
deployment unpublished. Roll back to an exact prior release manifest rather
than reconstructing deployment identifiers manually.
