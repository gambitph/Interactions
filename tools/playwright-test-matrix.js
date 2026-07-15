/* eslint-disable camelcase */
/**
 * Builds the Playwright CI matrix from Interactions' supported WordPress versions
 * (Tested up to + two minors below) and matching PHP versions.
 *
 * WP versions and min PHP are resolved from api.wordpress.org.
 * Max PHP for latest WP is hardcoded until WordPress exposes it via API.
 *
 * The matrix is written directly into GitHub workflow files between marker comments.
 */

const fs = require( 'fs' )
const https = require( 'https' )
const compareVersions = require( 'compare-versions' )

const WP_VERSION_CHECK_URL = 'https://api.wordpress.org/core/version-check/1.7/'
const PLAYWRIGHT_MATRIX_START = '# interactions-playwright-matrix-start'
const PLAYWRIGHT_MATRIX_END = '# interactions-playwright-matrix-end'

const PLAYWRIGHT_WORKFLOW_PATHS = [
	'.github/workflows/playwright.yml',
	'pro__premium_only/.github/workflows/playwright.yml',
]

/**
 * Highest fully supported PHP for the latest WordPress release.
 * Update when WordPress documents new max PHP support (make.wordpress.org/core).
 */
const LATEST_WP_MAX_PHP = '8.5'

const normalizePhpVersion = phpVersion => {
	const parts = phpVersion.split( '.' )
	if ( parts.length >= 2 ) {
		return `${ parts[ 0 ] }.${ parts[ 1 ] }`
	}
	return phpVersion
}

const fetchWordPressReleases = () => {
	return new Promise( ( resolve, reject ) => {
		const req = https.get( WP_VERSION_CHECK_URL, res => {
			let body = ''
			res.on( 'data', chunk => {
				body += chunk
			} )
			res.on( 'end', () => {
				try {
					const json = JSON.parse( body )
					const releases = json.offers
						?.filter( offer => offer.version )
						.map( offer => ( {
							version: offer.version,
							phpVersion: normalizePhpVersion( offer.php_version || '7.2' ),
						} ) )
					if ( ! releases?.length ) {
						reject( new Error( 'No versions in WordPress API response' ) )
						return
					}
					resolve( releases )
				} catch ( err ) {
					reject( err )
				}
			} )
		} )
		req.setTimeout( 15000, () => {
			req.destroy()
			reject( new Error( 'WordPress version check request timed out' ) )
		} )
		req.on( 'error', reject )
	} )
}

const fetchLatestWordPressRelease = async () => {
	const releases = await fetchWordPressReleases()
	return releases[ 0 ]
}

const subtractMinorVersions = ( versionString, count ) => {
	const parts = versionString.split( '.' ).map( Number )
	let major = parts[ 0 ] || 0
	let minor = parts[ 1 ] || 0
	const patch = parts[ 2 ] || 0
	minor -= count
	while ( minor < 0 ) {
		major -= 1
		minor += 10
	}
	if ( patch > 0 ) {
		return `${ major }.${ minor }.${ patch }`
	}
	return `${ major }.${ minor }`
}

const getMinorKey = versionString => {
	const parts = versionString.split( '.' )
	return `${ parts[ 0 ] }.${ parts[ 1 ] || 0 }`
}

const resolveLatestWordPressPatch = ( versionString, releases ) => {
	const minorKey = getMinorKey( versionString )
	const matches = releases.filter( release => getMinorKey( release.version ) === minorKey )
	if ( ! matches.length ) {
		return versionString
	}
	return matches.sort( ( a, b ) => compareVersions( b.version, a.version ) )[ 0 ].version
}

const buildPlaywrightMatrix = ( {
	testedUpTo, minPhp, releases,
} ) => {
	const supportedVersions = [
		subtractMinorVersions( testedUpTo, 2 ),
		subtractMinorVersions( testedUpTo, 1 ),
		testedUpTo,
	].map( version => resolveLatestWordPressPatch( version, releases ) )

	const latestWp = supportedVersions[ 2 ]

	const include = [
		{
			php_version: LATEST_WP_MAX_PHP,
			wp_version: latestWp,
		},
		{
			php_version: minPhp,
			wp_version: latestWp,
		},
	]

	for ( let i = 0; i < 2; i++ ) {
		include.push( {
			php_version: minPhp,
			wp_version: supportedVersions[ i ],
		} )
	}

	return { include }
}

const formatMatrixIncludeYaml = include => {
	return include.map( entry =>
		`          - php_version: '${ entry.php_version }'\n            wp_version: '${ entry.wp_version }'`
	).join( '\n' )
}

const replaceMatrixInWorkflow = ( content, matrix ) => {
	const block = formatMatrixIncludeYaml( matrix.include )
	return content.replace(
		/(# interactions-playwright-matrix-start\n)[\s\S]*?(\n\s*# interactions-playwright-matrix-end)/,
		`$1${ block }$2`
	)
}

const syncPlaywrightWorkflowFile = ( workflowPath, matrix ) => {
	if ( ! fs.existsSync( workflowPath ) ) {
		return false
	}

	const existing = fs.readFileSync( workflowPath, 'utf8' )
	const next = replaceMatrixInWorkflow( existing, matrix )

	if ( existing === next ) {
		return false
	}

	fs.writeFileSync( workflowPath, next )
	return true
}

const syncPlaywrightTestMatrix = async ( {
	testedUpTo, minPhp, releases,
} ) => {
	const resolvedReleases = releases || await fetchWordPressReleases()
	const matrix = buildPlaywrightMatrix( {
		testedUpTo,
		minPhp,
		releases: resolvedReleases,
	} )

	const updatedPaths = PLAYWRIGHT_WORKFLOW_PATHS.filter( workflowPath =>
		syncPlaywrightWorkflowFile( workflowPath, matrix )
	)

	if ( updatedPaths.length ) {
		console.log( `Updated Playwright test matrix (${ matrix.include.length } jobs)...` ) // eslint-disable-line
		matrix.include.forEach( entry => {
			console.log( `  PHP ${ entry.php_version } / WP ${ entry.wp_version }` ) // eslint-disable-line
		} )
		updatedPaths.forEach( workflowPath => {
			console.log( `  ${ workflowPath }` ) // eslint-disable-line
		} )
	}

	return matrix
}

const getTestedUpToFromReadme = () => {
	const readme = fs.readFileSync( 'readme.txt', 'utf8' )
	const match = readme.match( /^Tested up to:\s*(.+)$/m )
	return match ? match[ 1 ].trim() : null
}

const main = async () => {
	const testedUpTo = getTestedUpToFromReadme()
	if ( ! testedUpTo ) {
		throw new Error( 'Could not read "Tested up to" from readme.txt' )
	}

	const latestRelease = await fetchLatestWordPressRelease()
	await syncPlaywrightTestMatrix( {
		testedUpTo,
		minPhp: latestRelease.phpVersion,
	} )
}

if ( require.main === module ) {
	main().catch( error => {
		console.error( error ) // eslint-disable-line
		process.exit( 1 )
	} )
}

module.exports = {
	LATEST_WP_MAX_PHP,
	PLAYWRIGHT_MATRIX_END,
	PLAYWRIGHT_MATRIX_START,
	PLAYWRIGHT_WORKFLOW_PATHS,
	buildPlaywrightMatrix,
	fetchLatestWordPressRelease,
	fetchWordPressReleases,
	formatMatrixIncludeYaml,
	getMinorKey,
	normalizePhpVersion,
	replaceMatrixInWorkflow,
	resolveLatestWordPressPatch,
	subtractMinorVersions,
	syncPlaywrightTestMatrix,
	syncPlaywrightWorkflowFile,
}
