/* eslint-disable no-console */
const fs = require( 'fs' )
const https = require( 'https' )

// Allow PR builds to add a version suffix.
let versionSuffix = ''
if ( process.argv.length === 3 ) {
	versionSuffix = process.argv[ process.argv.length - 1 ]
}

function readPluginFile() {
	const candidates = [ 'interactions.php', 'index.php' ]
	for ( const file of candidates ) {
		if ( fs.existsSync( file ) ) {
			return file
		}
	}
	throw new Error( 'No plugin header file found to sync version from.' )
}

async function getAvailableWordPressVersions() {
	return new Promise( resolve => {
		https.get( 'https://api.wordpress.org/core/version-check/1.7/', res => {
			let data = ''
			res.on( 'data', chunk => {
				data += chunk
			} )
			res.on( 'end', () => {
				try {
					const response = JSON.parse( data )
					if ( response.offers && response.offers.length > 0 ) {
						resolve( response.offers.map( offer => offer.version ) )
					} else {
						resolve( [ '6.8.2', '6.8.1', '6.8.0', '6.7.2', '6.7.1', '6.7.0', '6.6.2', '6.6.1', '6.6.0' ] )
					}
				} catch ( e ) {
					resolve( [ '6.8.2', '6.8.1', '6.8.0', '6.7.2', '6.7.1', '6.7.0', '6.6.2', '6.6.1', '6.6.0' ] )
				}
			} )
		} ).on( 'error', () => {
			resolve( [ '6.8.2', '6.8.1', '6.8.0', '6.7.2', '6.7.1', '6.7.0', '6.6.2', '6.6.1', '6.6.0' ] )
		} )
	} )
}

function calculateMinVersion( latestVersion, availableVersions ) {
	const parts = latestVersion.split( '.' )
	if ( parts.length >= 2 ) {
		const major = parseInt( parts[ 0 ] )
		const minor = parseInt( parts[ 1 ] )
		const targetMinor = Math.max( 0, minor - 2 )
		const targetVersion = `${ major }.${ targetMinor }`
		const exactMatch = availableVersions.find( v => v.startsWith( targetVersion ) )
		if ( exactMatch ) {
			return exactMatch
		}
		const availableInMajor = availableVersions
			.filter( v => v.startsWith( `${ major }.` ) )
			.sort( ( a, b ) => parseInt( b.split( '.' )[ 1 ] ) - parseInt( a.split( '.' )[ 1 ] ) )
		for ( const v of availableInMajor ) {
			if ( parseInt( v.split( '.' )[ 1 ] ) <= targetMinor ) {
				return v
			}
		}
		return availableVersions[ availableVersions.length - 1 ]
	}
	return latestVersion
}

async function syncVersions() {
	try {
		const pluginFile = readPluginFile()
		const content = fs.readFileSync( pluginFile, 'utf8' )
		const versionMatch = content.match( /^\s*\*\s*Version:\s*([^\r\n]+)/m )
		if ( ! versionMatch ) {
			throw new Error( 'Could not find Version in plugin header' )
		}
		const basePluginVersion = versionMatch[ 1 ].trim()
		const pluginVersion = versionSuffix ? `${ basePluginVersion }-${ versionSuffix }` : basePluginVersion

		const packageJson = JSON.parse( fs.readFileSync( 'package.json', 'utf8' ) )
		if ( packageJson.version !== pluginVersion ) {
			console.log( `🔄 Updating package.json version from ${ packageJson.version } to ${ pluginVersion }` )
			packageJson.version = pluginVersion
			fs.writeFileSync( 'package.json', JSON.stringify( packageJson, null, '\t' ) + '\n' )
			console.log( '✅ package.json version updated successfully' )
		} else {
			console.log( `✅ package.json version already matches plugin version: ${ pluginVersion }` )
		}

		// Update interactions.php with version suffix if provided
		if ( versionSuffix ) {
			const updatedPluginContent = content.replace(
				/^(\s*\*\s*Version:\s*)([^\r\n]+)/m,
				`$1${ pluginVersion }`
			)
			fs.writeFileSync( pluginFile, updatedPluginContent )
			console.log( `✅ ${ pluginFile } version updated to ${ pluginVersion }` )
		}

		// Update INTERACT_VERSION constant in interactions.php
		const updatedPluginContent = content.replace(
			/^(\s*defined\(\s*['"]INTERACT_VERSION['"]\s*\)\s*\|\|\s*define\(\s*['"]INTERACT_VERSION['"]\s*,\s*['"])([^'"]+)(['"]\s*\);)/m,
			`$1${ pluginVersion }$3`
		)
		if ( updatedPluginContent !== content ) {
			fs.writeFileSync( pluginFile, updatedPluginContent )
			console.log( `✅ ${ pluginFile } INTERACT_VERSION constant updated to ${ pluginVersion }` )
		} else {
			console.log( `✅ ${ pluginFile } INTERACT_VERSION constant already matches plugin version: ${ pluginVersion }` )
		}

		console.log( '🌐 Fetching available WordPress versions...' )
		const availableVersions = await getAvailableWordPressVersions()
		const latestWordPressVersion = availableVersions[ 0 ]
		const minWordPressVersion = calculateMinVersion( latestWordPressVersion, availableVersions )
		console.log( `📊 Latest WordPress version: ${ latestWordPressVersion }` )
		console.log( `📊 Minimum required version: ${ minWordPressVersion }` )

		if ( fs.existsSync( 'readme.txt' ) ) {
			const readmeTxt = fs.readFileSync( 'readme.txt', 'utf8' )
			const stableTagMatch = readmeTxt.match( /^Stable tag:\s*([^\r\n]+)/m )
			if ( stableTagMatch && stableTagMatch[ 1 ].trim() !== pluginVersion ) {
				const updated = readmeTxt.replace( /^Stable tag:\s*[^\r\n]+/m, `Stable tag: ${ pluginVersion }` )
				fs.writeFileSync( 'readme.txt', updated )
				console.log( '✅ readme.txt stable tag updated successfully' )
			}
			const testedUpToMatch = readmeTxt.match( /^Tested up to:\s*([^\r\n]+)/m )
			if ( testedUpToMatch && testedUpToMatch[ 1 ].trim() !== latestWordPressVersion ) {
				const updated = ( fs.readFileSync( 'readme.txt', 'utf8' ) ).replace( /^Tested up to:\s*[^\r\n]+/m, `Tested up to: ${ latestWordPressVersion }` )
				fs.writeFileSync( 'readme.txt', updated )
				console.log( '✅ readme.txt tested up to updated successfully' )
			}
			const requiresAtLeastMatch = readmeTxt.match( /^Requires at least:\s*([^\r\n]+)/m )
			if ( requiresAtLeastMatch && requiresAtLeastMatch[ 1 ].trim() !== minWordPressVersion ) {
				const updated = ( fs.readFileSync( 'readme.txt', 'utf8' ) ).replace( /^Requires at least:\s*[^\r\n]+/m, `Requires at least: ${ minWordPressVersion }` )
				fs.writeFileSync( 'readme.txt', updated )
				console.log( '✅ readme.txt requires at least updated successfully' )
			}
		} else {
			console.log( 'ℹ️ readme.txt not found; skipping readme sync.' )
		}
	} catch ( error ) {
		console.error( '❌ Error syncing versions:', error.message )
		process.exit( 1 )
	}
}

syncVersions()

