// Determine if we're building premium version
const isPremiumBuild = process.env.BUILD_TYPE === 'premium'

module.exports = [
	{
		test: /\.js$/,
		exclude: isPremiumBuild 
			? /(node_modules|bower_components)/ 
			: /(node_modules|bower_components|pro__premium_only)/,
		use: {
			loader: 'babel-loader',
			options: {
				presets: [ '@wordpress/babel-preset-default' ],
				cacheDirectory: true,
			}
		},
		resolve: { fullySpecified: false },
	},
	{
		// Fixes Module not found error when origin is *.mjs or ESM js
		test: /\.m?jsx?$/,
		resolve: { fullySpecified: false },
		exclude: isPremiumBuild 
			? /(node_modules|bower_components)/ 
			: /(node_modules|bower_components|pro__premium_only)/,
	},
	{
		test: /\.svg$/,
		exclude: isPremiumBuild 
			? /(node_modules|bower_components)/ 
			: /(node_modules|bower_components|pro__premium_only)/,
		use: [
			{
				loader: 'babel-loader',
				options: { presets: [ '@wordpress/babel-preset-default' ], cacheDirectory: true },
			},
			{ loader: '@svgr/webpack', options: { babel: false } },
		],
	},
	{
		test: /\.(png|jpg|gif)$/,
		exclude: isPremiumBuild 
			? /(node_modules|bower_components)/ 
			: /(node_modules|bower_components|pro__premium_only)/,
		use: [
			{
				loader: 'file-loader',
				options: {
					outputPath: 'images',
					publicPath: 'dist/images',
					regExp: /\/([^\/]+)\/([^\/]+)\/images\/(.+)\.(.*)?$/,
					name: '[1]-[2]-[3].[hash:hex:7].[ext]',
				},
			},
		],
	},
	{
		test: /\.(mp4)$/,
		exclude: isPremiumBuild 
			? /(node_modules|bower_components)/ 
			: /(node_modules|bower_components|pro__premium_only)/,
		use: [
			{
				loader: 'file-loader',
				options: {
					outputPath: 'videos',
					publicPath: 'dist/videos',
					regExp: /\/([^\/]+)\/([^\/]+)\/videos\/(.+)\.(.*)?$/,
					name: '[name].[hash:hex:7].[ext]',
				},
			},
		],
	},
	{
		test: /\.scss$/,
		use: [
			'style-loader',
			'css-loader',
			'sass-loader',
		],
		exclude: isPremiumBuild 
			? /(\.css\.scss$)/ 
			: /(\.css\.scss$|pro__premium_only)/, // Exclude CSS entry files and premium folder (unless premium build)
	},
	{
		test: /\.css\.scss$/,
		exclude: isPremiumBuild 
			? /(node_modules|bower_components)/ 
			: /(node_modules|bower_components|pro__premium_only)/,
		use: [
			require( 'mini-css-extract-plugin' ).loader,
			'css-loader',
			'sass-loader',
		],
	},
]


