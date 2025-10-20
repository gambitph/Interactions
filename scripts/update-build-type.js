#!/usr/bin/env node

/* eslint-disable no-console */
const fs = require( 'fs' )
const path = require( 'path' )

/**
 * Updates the INTERACT_BUILD constant in interactions.php
 *
 * @param {string} buildType - 'free' or 'premium'
 */
function updateBuildType( buildType ) {
	// If we're in the premium directory, go up one level to find interactions.php
	const actualPluginPath = path.resolve( __dirname, '../interactions.php' )

	if ( ! fs.existsSync( actualPluginPath ) ) {
		console.warn( `⚠️  ${ actualPluginPath } not found, skipping build type update` )
		return false
	}

	let content = fs.readFileSync( actualPluginPath, 'utf8' )
	// Replace the INTERACT_BUILD constant definition
	const originalContent = content
	content = content.replace(
		/defined\(\s*'INTERACT_BUILD'\s*\)\s*\|\|\s*define\(\s*'INTERACT_BUILD'\s*,\s*'[^']*'\s*\);/,
		`defined( 'INTERACT_BUILD' ) || define( 'INTERACT_BUILD', '${ buildType }' );`
	)

	if ( content !== originalContent ) {
		fs.writeFileSync( actualPluginPath, content )
		console.log( `✅ Updated INTERACT_BUILD to '${ buildType }' in ${ actualPluginPath }` )
		return true
	}
	console.log( `ℹ️  INTERACT_BUILD already set to '${ buildType }' in ${ actualPluginPath }` )
	return false
}

// If this script is run directly (not imported), use command line arguments
if ( require.main === module ) {
	const buildType = process.argv[ 2 ]

	if ( ! buildType || ! [ 'free', 'premium' ].includes( buildType ) ) {
		console.error( 'Usage: node update-build-type.js <free|premium> [plugin-path]' )
		process.exit( 1 )
	}

	updateBuildType( buildType )
}

module.exports = { updateBuildType }
