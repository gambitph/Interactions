# E2E Testing

Interactions' end-to-end testing aims to test the high-level functions of the
plugin in order to quickly assess whether everything is in working condition.

## Usage

Node.js **22 LTS** is required. The version is pinned in [`.nvmrc`](../.nvmrc) (used by CI and `nvm`/`fnm` locally).

Create an `.env` file in the root directory of the plugin with the contents:

```
WP_BASE_URL=http://localhost:8889
WP_AUTH_STORAGE=wp-auth.json
WP_USERNAME=admin
WP_PASSWORD=password
INTERACTIONS_SLUG=Interactions/interactions
ELEMENTOR_SLUG=elementor/elementor
```

Start a local WordPress environment (requires Docker):

```bash
npx @wordpress/env start
```

For local sites (e.g. `https://local.local`), ensure the free **Elementor** plugin is
installed. Global setup activates only Interactions and Elementor — other plugins are
deactivated before each run.

Build the plugin for testing:

```bash
npm run build:e2e
```

Run e2e tests:

```bash
npm run test:debug
```

or without the UI:

```bash
npm run test
```

## Dev Notes

- Our main basis: https://github.com/meszarosrob/wordpress-e2e-playwright-intro-2023
- Gutenberg e2e Github workflow: https://github.com/WordPress/gutenberg/blob/trunk/.github/workflows/end2end-test.yml
