# Interactions - WordPress Plugin

[![WordPress Plugin](https://img.shields.io/badge/WordPress-Plugin-blue.svg)](https://wordpress.org/plugins/interactions/)
[![Version](https://img.shields.io/badge/version-1.3.0-green.svg)](https://wordpress.org/plugins/interactions/)
[![License](https://img.shields.io/badge/license-GPL%20v2%2B-red.svg)](https://www.gnu.org/licenses/gpl-2.0.html)
[![PHP](https://img.shields.io/badge/PHP-8.0%2B-purple.svg)](https://php.net/)
[![WordPress](https://img.shields.io/badge/WordPress-6.6.4%2B-blue.svg)](https://wordpress.org/)

A WordPress plugin that adds animations, effects, and interactivity to Gutenberg blocks.

## 🔧 Requirements

- **WordPress**: 6.6.4 or higher
- **PHP**: 8.0 or higher
- **Node.js**: 18 or higher
- **Block Editor**: Gutenberg (built-in WordPress editor)

## 🛠️ Development

### Building the Plugin
```bash
# Install dependencies
npm install

# Development build (with watch mode)
npm run start

# Production build (free version)
npm run build

# Premium build
npm run build:premium

# Linting
npm run lint
npm run lint:fix

# CSS linting
npm run lint:css
npm run lint:css:fix
```

### Available Scripts
- `npm run start` - Development build with watch mode
- `npm run build` - Production build for free version
- `npm run build:premium` - Production build for premium version
- `npm run lint` - Run JavaScript and CSS linting
- `npm run lint:js` - JavaScript linting only
- `npm run lint:css` - CSS linting only
- `npm run package` - Create plugin package
- `npm run optimize-videos` - Optimize video assets

### Project Structure
```
src/
├── action-types/          # Available action types (PHP + JS)
├── interaction-types/     # Available trigger types (PHP + JS)
├── admin/                 # Admin interface
├── editor/                # Block editor integration
├── frontend/              # Frontend functionality
├── locations/             # Location rules
└── rest-api/              # REST API endpoints

dist/                      # Built assets
pro__premium_only/         # Premium-only features
scripts/                   # Build and utility scripts
```

### Development Workflow
1. Make changes to source files in `src/`
2. Run `npm run start` for development with watch mode
3. Test changes in WordPress admin
4. Run `npm run lint` to check code quality
5. Run `npm run build` for production build
6. Test the built plugin

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run linting (`npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards
- Follow WordPress coding standards
- Use ESLint and Stylelint for code quality
- Write clear commit messages
- Test your changes thoroughly

## 📄 License

This project is licensed under the GPL v2 or later - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **GitHub**: [github.com/gambitph/Interactions](https://github.com/gambitph/Interactions)
- **Plugin Page**: [WordPress.org](https://wordpress.org/plugins/interactions/)
- **Website**: [wpinteractions.com](https://wpinteractions.com/)

---

**Made with ❤️ by [Gambit Technologies](http://gambit.ph)**
