# Generated structure

Generated sites are independent workspace applications. `Landing` owns the
public domain and routes child applications. `Documentation` is an Astro
static site, and `Storybook` is an optional React/Vite application.

The child applications are built before Landing. Deployment and release
manifests pair exact child revisions with the Landing router, so do not remove
those manifests or manually publish a child without running verification.
