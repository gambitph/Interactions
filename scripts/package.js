/* eslint-disable no-console */
const fs = require( 'fs' )
const path = require( 'path' )
const archiver = require( 'archiver' )

// Allow PR builds to add a version suffix.
let folderSuffix = ''
if ( process.argv.length === 3 ) {
	folderSuffix = process.argv[ process.argv.length - 1 ]
}

// Configuration
const PLUGIN_NAME = 'interactions'
const BUILD_DIR = 'build-plugin'
const DIST_DIR = 'build'
const IS_PREMIUM_BUILD = process.env.BUILD_TYPE === 'premium'

// Get version from plugin header (in interactions.php or index.php once added)
function readPluginVersion() {
	const candidates = [ 'interactions.php', 'index.php' ]
	for ( const file of candidates ) {
		if ( fs.existsSync( file ) ) {
			const content = fs.readFileSync( file, 'utf8' )
			const match = content.match( /^\s*\*\s*Version:\s*([^\r\n]+)/m )
			if ( match ) {
				return match[ 1 ].trim()
			}
		}
	}
	throw new Error( 'Could not find Version in a plugin header file' )
}

const PLUGIN_VERSION = ( () => readPluginVersion() )()

// Files and directories to include in the package
const INCLUDED_FILES = [
	'interactions.php',
	'composer.json',
	'index.php',
	'readme.txt',
	...( IS_PREMIUM_BUILD ? [ 'freemius', 'pro__premium_only' ] : [] ),
]

// Create security index.php content
const INDEX_PHP_CONTENT = `<?php
	// Silence is golden.
	// Hide file structure from users on unprotected servers.
`

// Centralized function to check if a file should be excluded
function shouldExcludeFile( filePath ) {
	const fileName = path.basename( filePath )
	const fileExt = path.extname( filePath )
	const isInSrcDir = filePath.startsWith( 'src' ) || filePath.includes( 'pro__premium_only/src' )
	const isPremiumFolder = filePath.includes( 'pro__premium_only' )
	const isInNodeModules = filePath.split( path.sep ).includes( 'node_modules' )

	// Exclude premium folder when not building premium version
	if ( isPremiumFolder && ! IS_PREMIUM_BUILD ) {
		return true
	}

	// Exclude freemius.php file when not building premium version
	if ( fileName === 'freemius.php' && ! IS_PREMIUM_BUILD ) {
		return true
	}

	// Exclude freemius directory from src when not building premium version
	if ( filePath.startsWith( 'src/freemius' ) && ! IS_PREMIUM_BUILD ) {
		return true
	}

	// Exclude any node_modules directory contents from the package
	if ( isInNodeModules ) {
		return true
	}

	return (
		fileExt === '.js' ||
		fileExt === '.css' ||
		fileExt === '.scss' ||
		fileExt === '.map' ||
		fileExt === '.md' ||
		( fileExt === '.svg' && ! filePath.startsWith( 'src/admin/assets' ) ) || // Exclude SVG files except admin assets
		fileExt === '.json' ||
		fileName === 'package.json' ||
		fileName === 'package-lock.json' ||
		fileName === 'webpack.config.js' ||
		fileName === 'index.js' ||
		fileName === 'index.css' ||
		fileName.startsWith( '.' ) || // Exclude hidden files
		// Exclude .mp4 files from src directory (they're optimized to dist/videos/)
		( isInSrcDir && fileExt === '.mp4' )
	)
}

function ensureDir( dir ) {
	if ( ! fs.existsSync( dir ) ) {
		fs.mkdirSync( dir, { recursive: true } )
	}
}

function copyFile( src, dest ) {
	const destDir = path.dirname( dest )
	ensureDir( destDir )
	fs.copyFileSync( src, dest )
}

function hasMeaningfulContent( dirPath ) {
	const items = fs.readdirSync( dirPath )
	let meaningfulFiles = 0
	// let securityIndexPhpFiles = 0

	for ( const item of items ) {
		const itemPath = path.join( dirPath, item )
		const stat = fs.statSync( itemPath )
		if ( stat.isDirectory() ) {
			// Skip node_modules entirely
			if ( path.basename( itemPath ) === 'node_modules' ) {
				continue
			}
			if ( hasMeaningfulContent( itemPath ) ) {
				return true
			}
		} else if ( item === 'index.php' ) {
			// Check if index.php contains meaningful content (not just security placeholder)
			try {
				const content = fs.readFileSync( itemPath, 'utf8' )
				if ( content.trim() === INDEX_PHP_CONTENT.trim() ) {
					// securityIndexPhpFiles++
				} else {
					meaningfulFiles++
				}
			} catch ( error ) {
				// If we can't read the file, consider it meaningful
				meaningfulFiles++
			}
		} else {
			meaningfulFiles++
		}
	}

	// Only consider meaningful if there are files other than security index.php files
	// Also exclude directories that would only contain security index.php files after addSecurityFiles runs
	return meaningfulFiles > 0
}

function hasMeaningfulContentInSource( dirPath ) {
	const items = fs.readdirSync( dirPath )
	let meaningfulFiles = 0

	for ( const item of items ) {
		const itemPath = path.join( dirPath, item )
		const stat = fs.statSync( itemPath )
		if ( stat.isDirectory() ) {
			// Skip node_modules entirely
			if ( path.basename( itemPath ) === 'node_modules' ) {
				continue
			}
			if ( hasMeaningfulContentInSource( itemPath ) ) {
				return true
			}
		} else if ( item === 'index.php' ) {
			// Check if index.php contains meaningful content (not just security placeholder)
			try {
				const content = fs.readFileSync( itemPath, 'utf8' )
				if ( content.trim() !== INDEX_PHP_CONTENT.trim() ) {
					meaningfulFiles++
				}
			} catch ( error ) {
				// If we can't read the file, consider it meaningful
				meaningfulFiles++
			}
		} else if ( ! shouldExcludeFile( itemPath ) ) {
			// Check if this file would be copied (not excluded)
			meaningfulFiles++
		}
	}

	// Only consider meaningful if there are files other than security index.php files
	return meaningfulFiles > 0
}

// Modified copyDir to exclude .mp4 files in src
function copyDir( src, dest ) {
	if ( ! fs.existsSync( src ) ) {
		return false
	}
	// Check if source has meaningful content before copying
	if ( ! hasMeaningfulContentInSource( src ) ) {
		return false
	}
	ensureDir( dest )
	const items = fs.readdirSync( src )
	let hasCopiedFiles = false
	for ( const item of items ) {
		const srcPath = path.join( src, item )
		const destPath = path.join( dest, item )
		const stat = fs.statSync( srcPath )
		if ( stat.isDirectory() ) {
			// Skip node_modules directories entirely
			if ( path.basename( srcPath ) === 'node_modules' ) {
				continue
			}
			// If we're at the root src, pass true to children as false
			if ( copyDir( srcPath, destPath, false ) ) {
				hasCopiedFiles = true
			}
		} else if ( ! shouldExcludeFile( srcPath ) ) {
			copyFile( srcPath, destPath )
			hasCopiedFiles = true
		}
	}
	if ( ! hasCopiedFiles ) {
		try {
			fs.rmdirSync( dest )
		} catch {}
		return false
	}
	return true
}

function copyBuiltDir( src, dest ) {
	ensureDir( dest )
	const items = fs.readdirSync( src )
	for ( const item of items ) {
		const srcPath = path.join( src, item )
		const destPath = path.join( dest, item )
		const stat = fs.statSync( srcPath )
		if ( stat.isDirectory() ) {
			copyBuiltDir( srcPath, destPath )
		} else {
			copyFile( srcPath, destPath )
		}
	}
}

function copyBuiltFiles( src, dest ) {
	if ( ! fs.existsSync( src ) ) {
		return
	}
	ensureDir( dest )
	const items = fs.readdirSync( src )
	for ( const item of items ) {
		const srcPath = path.join( src, item )
		const destPath = path.join( dest, item )
		const stat = fs.statSync( srcPath )
		if ( stat.isDirectory() ) {
			copyBuiltDir( srcPath, destPath )
		} else {
			copyFile( srcPath, destPath )
		}
	}
}

function addSecurityFiles( dir ) {
	if ( ! fs.existsSync( dir ) ) {
		return
	}
	const items = fs.readdirSync( dir )
	for ( const item of items ) {
		const itemPath = path.join( dir, item )
		const stat = fs.statSync( itemPath )
		if ( stat.isDirectory() ) {
			const indexPath = path.join( itemPath, 'index.php' )
			if ( ! fs.existsSync( indexPath ) ) {
				fs.writeFileSync( indexPath, INDEX_PHP_CONTENT )
			}
			addSecurityFiles( itemPath )
		}
	}
}

function cleanupEmptyDirectories( dir ) {
	if ( ! fs.existsSync( dir ) ) {
		return
	}
	const items = fs.readdirSync( dir )
	for ( const item of items ) {
		const itemPath = path.join( dir, item )
		const stat = fs.statSync( itemPath )
		if ( stat.isDirectory() ) {
			// Recursively clean up subdirectories first
			cleanupEmptyDirectories( itemPath )

			// Check if this directory only contains security index.php files
			if ( ! hasMeaningfulContent( itemPath ) ) {
				console.log( `🗑️  Removing empty directory: ${ itemPath }` )
				fs.rmSync( itemPath, { recursive: true } )
			}
		}
	}
}

async function packagePlugin() {
	console.log( '🚀 Starting plugin packaging...' )
	console.log( `📦 Build type: ${ IS_PREMIUM_BUILD ? 'Premium' : 'Free' }` )
	if ( fs.existsSync( BUILD_DIR ) ) {
		fs.rmSync( BUILD_DIR, { recursive: true } )
	}
	ensureDir( BUILD_DIR )

	console.log( '📁 Copying main plugin files...' )
	for ( const file of INCLUDED_FILES ) {
		if ( fs.existsSync( file ) ) {
			const stat = fs.statSync( file )
			if ( stat.isDirectory() ) {
				copyDir( file, path.join( BUILD_DIR, file ) )
			} else {
				copyFile( file, path.join( BUILD_DIR, file ) )
			}
		}
	}

	console.log( '📁 Copying source directories...' )
	// Pass isSrcRoot = true for the top-level src folder
	copyDir( 'src', path.join( BUILD_DIR, 'src' ), true )

	console.log( '📁 Copying built files...' )
	copyBuiltFiles( 'dist', path.join( BUILD_DIR, 'dist' ) )

	console.log( '🔒 Adding security index.php files...' )
	addSecurityFiles( BUILD_DIR )

	console.log( '🧹 Cleaning up empty directories...' )
	cleanupEmptyDirectories( BUILD_DIR )

	console.log( '📦 Creating zip package...' )
	ensureDir( DIST_DIR )
	const zipPath = path.join( DIST_DIR, `${ PLUGIN_NAME }-${ PLUGIN_VERSION }.zip` )
	const output = fs.createWriteStream( zipPath )
	const archive = archiver( 'zip', { zlib: { level: 9 } } )
	output.on( 'close', () => {
		const size = ( archive.pointer() / 1024 / 1024 ).toFixed( 2 )
		console.log( '✅ Plugin packaged successfully!' )
		console.log( `📦 Package: ${ zipPath }` )
		console.log( `📊 Size: ${ size } MB` )
		fs.rmSync( BUILD_DIR, { recursive: true } )
		console.log( '🧹 Build directory cleaned up' )
	} )
	archive.on( 'error', err => {
		throw err
	} )
	archive.pipe( output )
	archive.directory( BUILD_DIR, PLUGIN_NAME + ( folderSuffix ? `-${ folderSuffix }` : '' ) )
	await archive.finalize()
}

packagePlugin().catch( err => {
	console.error( err )
} )
