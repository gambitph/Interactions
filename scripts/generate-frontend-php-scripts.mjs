/* eslint-disable no-console */
/**
 * This script gets the src/action-types/frontend/*.js and
 * src/interaction-types/frontend/*.js and converts them into individual PHP
 * scripts. Each PHP file would contain the actual JavaScript code that is
 * needed to configure the interactions and actions in the frontend.
 */
import fs from 'fs'
import path from 'path'
import minify from '@node-minify/core'
import uglifyJS from '@node-minify/uglify-js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath( import.meta.url )
const __dirname = path.dirname( __filename )

/*
const convertObjectToString = obj => {
	let ret = '{'

	for ( const k in obj ) {
	  let v = obj[ k ]

	  if ( typeof v === 'function' ) {
			v = v.toString()
	  } else if ( v instanceof Array ) {
			v = JSON.stringify( v )
	  } else if ( typeof v === 'object' ) {
			v = convertObjectToString( v )
	  } else {
			v = `"${ v }"`
	  }

	  ret += `${ k }:${ v },`
	}

	ret += '}'

	return ret
}
*/

const writeFile = ( script, file, srcPath ) => {
	// Ensure that the folder of file exists
	const dir = path.dirname( file )
	if ( ! fs.existsSync( dir ) ) {
		fs.mkdirSync( dir, { recursive: true } )
	}

	const content = `<?php
/**
 * This is an auto-generated script from ${ srcPath }.
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

ob_start();
?>
${ script }
<?php
return ob_get_clean();
	`
	try {
		fs.writeFileSync( file, content )
		console.log( `✔️  Sucessfully writen frontend PHP script ${ file }` ) // eslint-disable-line
	} catch ( err ) {
		console.log( err ) // eslint-disable-line
	}
}

const buildType = process.argv[ 2 ] || 'development'
const explicitBuildMode = process.argv[ 3 ] // 'free' or 'premium'

// Check if we're in a premium build context
const isPremiumBuild = explicitBuildMode === 'premium'

// Define source directories to process
const sourceDirs = [ '../src' ] // Always include free sources
if ( isPremiumBuild ) {
	sourceDirs.push( '../pro__premium_only/src' ) // Add premium sources for premium builds
}

// Function to process files from a source directory
const processSourceDir = sourceDir => {
	console.log( `📁 Processing frontend scripts from ${ sourceDir }` )

	// Process interaction types
	const interactionTypesDir = path.resolve( __dirname, sourceDir, 'interaction-types/frontend' )
	if ( fs.existsSync( interactionTypesDir ) ) {
		fs.readdirSync( interactionTypesDir )
			.filter( file => file.endsWith( '.js' ) )
			.forEach( async file => {
				const type = file.replace( '.js', '' )
				const scriptPath = path.resolve( interactionTypesDir, file )
				const scriptPathRelative = path.relative( path.resolve( __dirname, '../' ), scriptPath )
				const outputFile = path.resolve( __dirname, `../dist/frontend/interactions/${ type }.php` )
				const content = fs.readFileSync( scriptPath, 'utf8' )

				if ( buildType === 'development' ) {
					writeFile( content, outputFile, scriptPathRelative )
				} else {
					await minify( {
						compressor: uglifyJS,
						content,
						output: outputFile,
					} ).then( min => {
						writeFile( min, outputFile, scriptPathRelative )
					} )
				}
			} )
	}

	// Process action types
	const actionTypesDir = path.resolve( __dirname, sourceDir, 'action-types/frontend' )
	if ( fs.existsSync( actionTypesDir ) ) {
		fs.readdirSync( actionTypesDir )
			.filter( file => file.endsWith( '.js' ) )
			.forEach( async file => {
				const type = file.replace( '.js', '' )
				const scriptPath = path.resolve( actionTypesDir, file )
				const scriptPathRelative = path.relative( path.resolve( __dirname, '../' ), scriptPath )
				const outputFile = path.resolve( __dirname, `../dist/frontend/actions/${ type }.php` )
				const content = fs.readFileSync( scriptPath, 'utf8' )

				if ( buildType === 'development' ) {
					writeFile( content, outputFile, scriptPathRelative )
				} else {
					await minify( {
						compressor: uglifyJS,
						content,
						output: outputFile,
					} ).then( min => {
						writeFile( min, outputFile, scriptPathRelative )
					} )
				}
			} )
	}
}

// Process all source directories
sourceDirs.forEach( processSourceDir )
