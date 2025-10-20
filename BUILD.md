# Build and Packaging

This project mirrors the Cimo build setup using `@wordpress/scripts` and custom packaging.

## Prerequisites

- Node.js 18 or higher
- npm

## Available Scripts

```bash
# Start development mode with hot reloading
npm run start

# Build for development AND create production package
npm run build

# Lint JavaScript and CSS
npm run lint
npm run lint:js
npm run lint:css

# Format code
npm run format
```

### Production Packaging

```bash
# Create production-ready plugin package (automatically runs after build)
npm run build

# Or run packaging separately
npm run package
```

The `build` script automatically:

1. Compiles JavaScript and CSS
2. Creates a production package with only necessary files
3. Excludes source JavaScript, CSS, and development files
4. Includes compiled/built JavaScript and CSS files
5. Adds security `index.php` files to all directories
6. Creates a zip file in the `dist/` directory
7. Cleans up temporary build files

## Package Contents

The final package includes your main plugin files, built assets, PHP source (that you keep), and security `index.php` files.

## Excluded Files

- Source JavaScript files (`src/**/*.js`)
- Source CSS files (`src/**/*.css`)
- Source maps (`.map`)
- Markdown files (`.md`)
- Development configuration files
- Node.js dependencies
- Source build artifacts

## Build Process

1. Build assets via `wp-scripts`
2. Copy main plugin files and PHP source
3. Copy compiled assets from `build/`
4. Add `index.php` in directories
5. Zip under `dist/interactions-{version}.zip`
6. Cleanup temp directories

