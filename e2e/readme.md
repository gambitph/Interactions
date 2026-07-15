# E2E Testing

Interactions' end-to-end testing aims to test the high-level functions of the
plugin in order to quickly assess whether everything is in working condition.

## Usage

Create an `.env` file in the root directory of the plugin with the contents:

```
WP_BASE_URL=http://localhost:8889
WP_AUTH_STORAGE=wp-auth.json
WP_USERNAME=admin
WP_PASSWORD=password
INTERACTIONS_SLUG=Interactions/interactions
```

Start a local WordPress environment:

```bash
npx @wordpress/env start
```

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
