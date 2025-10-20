/* eslint-disable no-console */
// Set environment variable for free build
if ( typeof process.env.BUILD_TYPE === 'undefined' ) {
	process.env.BUILD_TYPE = 'free'
}

const defaultConfig = require( '@wordpress/scripts/config/webpack.config' )
const { externals } = require( './.config/externals' )
const rules = require( './.config/rules' )
const path = require( 'path' )
const { exec } = require( 'child_process' )
const fs = require( 'fs' )
const webpack = require( 'webpack' )

// Count premium action types
function getPremiumActionTypesCount() {
	const actionTypesDir = path.resolve( __dirname, './pro__premium_only/src/action-types' )
	if ( fs.existsSync( actionTypesDir ) ) {
		const files = fs.readdirSync( actionTypesDir )
		return files.filter( file => file.startsWith( 'class-action-type-' ) && file.endsWith( '.php' ) ).length
	}
	return 0
}

// Count premium interaction types
function getPremiumInteractionTypesCount() {
	const interactionTypesDir = path.resolve( __dirname, './pro__premium_only/src/interaction-types' )
	if ( fs.existsSync( interactionTypesDir ) ) {
		const files = fs.readdirSync( interactionTypesDir )
		return files.filter( file => file.startsWith( 'class-interaction-type-' ) && file.endsWith( '.php' ) ).length
	}
	return 0
}

// Compile all the frontend scripts to dist/frontend-*.js files.
function getFrontendActionEntries() {
	const entries = {}
	const scriptsDir = path.resolve( __dirname, './src/action-types/frontend/scripts' )
	if ( fs.existsSync( scriptsDir ) ) {
		const files = fs.readdirSync( scriptsDir )
		for ( const file of files ) {
			if ( file.endsWith( '.js' ) ) {
				const name = `frontend-${ file.replace( /.js$/, '' ) }`
				entries[ name ] = path.resolve( scriptsDir, file )
			}
		}
	}
	return entries
}

module.exports = {
	...defaultConfig,
	entry: {
		editor: path.resolve( __dirname, './src/editor/editor.js' ),
		admin: path.resolve( __dirname, './src/admin/admin.js' ),
		frontend: path.resolve( __dirname, './src/frontend/scripts/frontend.js' ),
		'admin-manage-interactions': path.resolve( __dirname, './src/admin/manage-interactions.js' ),
		...getFrontendActionEntries(),
	},
	output: {
		...defaultConfig.output,
		filename: '[name].js',
		path: path.resolve( __dirname, 'dist' ),
		clean: process.env.NODE_ENV === 'production' && ! process.env.PRESERVE_PREMIUM_FILES, // Don't clean if premium files should be preserved
	},
	resolve: {
		...defaultConfig.resolve,
		alias: {
			...defaultConfig.resolve?.alias,
			'~interact': path.resolve( __dirname, 'src' ),
			'~premium': path.resolve( __dirname, 'pro__premium_only/src' ),
		},
	},
	externals,
	module: {
		...defaultConfig.module,
		strictExportPresence: true,
		rules,
	},
	plugins: [
		...defaultConfig.plugins,
		new webpack.DefinePlugin( {
			BUILD_TYPE: JSON.stringify( process.env.BUILD_TYPE || 'free' ),
			PREMIUM_ACTIONS_NUM: getPremiumActionTypesCount(),
			PREMIUM_INTERACTIONS_NUM: getPremiumInteractionTypesCount(),
		} ),
		{
			apply: compiler => {
				compiler.hooks.watchRun.tap( 'FrontendPHPGenerator', () => {
					// Use the appropriate script based on BUILD_TYPE
					const buildType = process.env.BUILD_TYPE || 'free'
					const script = buildType === 'premium' ? 'npm run build:frontend-php:premium' : 'npm run build:frontend-php'

					exec( script, ( error, stdout, stderr ) => {
						if ( error ) {
							console.error( 'Error generating frontend PHP:', error )
							return
						}
						if ( stdout ) {
							console.log( stdout )
						}
						if ( stderr ) {
							console.error( stderr )
						}
					} )
				} )
			},
		},
	],
}

