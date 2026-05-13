import fs from 'fs'
import path from 'path'
import postcss from 'postcss'

const ROOT = process.cwd()
const INPUT_CSS = path.join(
	ROOT,
	'node_modules',
	'@wordpress',
	'components',
	'build-style',
	'style.css'
)
const OUTPUT_CSS = path.join( ROOT, 'dist', 'wp-components-scoped.css' )

const COMPONENT_SCOPES = [
	'#interact-elementor-root',
	'.interact-popover',
]
const BODY_SCOPE = 'body.interact-elementor-editor'
const PORTAL_PATTERNS = [
	'.components-modal',
	'.components-snackbar',
	'.components-tooltip',
	'.components-guide',
]

// Wrap scope selectors in :where() so scoping does not increase specificity.
const wrapScope = scope => `:where(${ scope })`

// Some WordPress component UI is rendered in portals outside our sidebar root.
const isPortalSelector = selector => {
	return PORTAL_PATTERNS.some( pattern => selector.includes( pattern ) )
}

// Check if a rule is inside a keyframes block, which should not be scoped.
const isInsideKeyframes = rule => {
	let current = rule.parent
	while ( current ) {
		if ( current.type === 'atrule' && current.name.includes( 'keyframes' ) ) {
			return true
		}
		current = current.parent
	}
	return false
}

// Scope each selector to the Interactions Elementor UI while keeping popovers
// and other portal-based components reachable outside the sidebar root.
const scopeRootSelector = selector => {
	if ( selector.startsWith( ':root' ) ) {
		return [ ...COMPONENT_SCOPES.map( wrapScope ), wrapScope( BODY_SCOPE ) ]
	}

	if ( selector.startsWith( 'body' ) ) {
		return [ selector.replace( /^body\b/, wrapScope( BODY_SCOPE ) ) ]
	}

	if ( selector.startsWith( 'html' ) ) {
		return [ `${ wrapScope( BODY_SCOPE ) } ${ selector }` ]
	}

	if ( isPortalSelector( selector ) ) {
		return [ `${ wrapScope( BODY_SCOPE ) } ${ selector }` ]
	}

	if ( /(^|[\s>+~])\.components-popover(?![a-zA-Z0-9_-])/.test( selector ) ) {
		return [ selector.replace( /(^|[\s>+~])\.components-popover(?![a-zA-Z0-9_-])/g, `$1${ wrapScope( '.interact-popover.components-popover' ) }` ) ]
	}

	return COMPONENT_SCOPES.map( scope => `${ wrapScope( scope ) } ${ selector }` )
}

const css = fs.readFileSync( INPUT_CSS, 'utf8' )
const root = postcss.parse( css )

root.walkRules( rule => {
	if ( ! Array.isArray( rule.selectors ) ) {
		return
	}

	if ( isInsideKeyframes( rule ) ) {
		return
	}

	rule.selectors = rule.selectors.flatMap( selector => scopeRootSelector( selector ) )
} )

fs.mkdirSync( path.dirname( OUTPUT_CSS ), { recursive: true } )
fs.writeFileSync( OUTPUT_CSS, root.toString() )

process.stdout.write(
	JSON.stringify(
		{
			input: path.relative( ROOT, INPUT_CSS ),
			output: path.relative( ROOT, OUTPUT_CSS ),
		},
		null,
		2
	) + '\n'
)
