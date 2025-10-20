const path = require( 'path' )
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' )
const glob = require( 'glob' )

// Find all editor.scss files in src/editor subdirectories (excluding premium folder)
const editorScssFiles = glob.sync( path.resolve( __dirname, './src/editor/**/editor.scss' ), {
	ignore: [ '**/pro__premium_only/**' ],
} )

module.exports = {
	mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
	entry: {
		'editor.css': editorScssFiles,
		'frontend.css': path.resolve( __dirname, './src/frontend/frontend.scss' ),
		'utility-classes.css': path.resolve( __dirname, './src/frontend/utility-classes.scss' ),
		'editor-utility-classes.css': path.resolve( __dirname, './src/editor/utility-classes.scss' ),
		'admin.css': path.resolve( __dirname, './src/admin/admin.scss' ),
	},
	output: {
		path: path.resolve( __dirname, 'dist' ),
		filename: '[name].js', // This will be ignored by MiniCssExtractPlugin
		clean: false, // Don't clean the dist directory when watching
	},
	module: {
		rules: [
			{
				test: /\.scss$/,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader',
					'sass-loader',
				],
			},
		],
	},
	plugins: [
		new MiniCssExtractPlugin( {
			filename: '[name]',
		} ),
	],
}
