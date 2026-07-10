# AGENTS.md

## Cursor Cloud specific instructions

Interactions is a WordPress plugin (Trigger → Action animation/interactivity builder for the block editor, Elementor and Bricks). It only runs inside a WordPress install, so end-to-end testing needs a running WordPress with the built plugin activated.

### Environment (already provisioned in the VM snapshot)
- Node 22, PHP 8.3, Composer, Docker and `ffmpeg` are installed. `node_modules` is refreshed by the startup update script. This repo has no `composer.json`.
- Docker is required for the WordPress test environment (`@wordpress/env`). The Docker daemon is not managed by systemd here; if `docker ps` fails, start it with `sudo dockerd` (a background/tmux process) — configured for the `fuse-overlayfs` storage driver and `iptables-legacy`.

### Build / run / lint (see `package.json`, `BUILD.md`)
- Dev (watch): `npm run start` — runs `wp-scripts start` plus a CSS webpack watch concurrently. Intended dev workflow.
- One-shot build + zip: `npm run build` (its `prebuild` runs `npm run lint:js`; the build also compiles CSS, generates frontend PHP, and runs `optimize-videos` which needs `ffmpeg`).
- Lint only: `npm run lint` (`lint:js` + `lint:css`).
- Built assets land in `dist/` (and the packaged zip in `build/`); they must exist for the plugin to work in WordPress.

### Shared WordPress dev environment (all three sibling plugins)
- A `wp-env` project lives at `/home/ubuntu/wp-dev` with a `.wp-env.json` that mounts Cimo, Interactions and Stackable (by absolute path) into one WordPress site. It is kept out of the repos on purpose.
- Start/stop: `cd /home/ubuntu/wp-dev && npx wp-env start` / `npx wp-env stop`. Run WP-CLI: `npx wp-env run cli wp <cmd>`.
- Site: http://localhost:8888/wp-admin (user `admin`, password `password`). wp-env auto-activates the mounted plugins on start.
- Hello-world check: in a post, select a block (e.g. a Button); open the block's Interactions toolbar icon / sidebar panel and add a Trigger (e.g. Mouse hover) + Action (e.g. Scale).
- After changing plugin source, rebuild assets (`npm run build` or keep `npm run start` watching); wp-env serves the repo directory live, so no reinstall is needed.
