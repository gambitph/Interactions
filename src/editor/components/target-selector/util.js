import { __ } from '@wordpress/i18n'

export const maybeInvalidSelector = selector => {
	// Extract the first word from the selector
	const regex = /^([\d\w\-_]+)/
	const match = selector.match( regex )
	const firstWord = match ? match[ 1 ] : null

	if ( ! firstWord ) {
		return false
	}

	// Check if the first word is a valid HTML tag
	const isValidTag = HTML_TAGS.includes( firstWord.toLowerCase() )
	return ! isValidTag
}

const HTML_TAGS = [
	'a',
	'abbr',
	'acronym',
	'address',
	'applet',
	'area',
	'article',
	'aside',
	'audio',
	'b',
	'base',
	'basefont',
	'bdi',
	'bdo',
	'bgsound',
	'big',
	'blink',
	'blockquote',
	'body',
	'br',
	'button',
	'canvas',
	'caption',
	'center',
	'cite',
	'code',
	'col',
	'colgroup',
	'command',
	'content',
	'data',
	'datalist',
	'dd',
	'del',
	'details',
	'dfn',
	'dialog',
	'dir',
	'div',
	'dl',
	'dt',
	'element',
	'em',
	'embed',
	'fieldset',
	'figcaption',
	'figure',
	'font',
	'footer',
	'form',
	'frame',
	'frameset',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'head',
	'header',
	'hgroup',
	'hr',
	'html',
	'i',
	'iframe',
	'image',
	'img',
	'input',
	'ins',
	'isindex',
	'kbd',
	'keygen',
	'label',
	'legend',
	'li',
	'link',
	'listing',
	'main',
	'map',
	'mark',
	'marquee',
	'menu',
	'menuitem',
	'meta',
	'meter',
	'nav',
	'nobr',
	'noembed',
	'noframes',
	'noscript',
	'object',
	'ol',
	'optgroup',
	'option',
	'output',
	'p',
	'param',
	'picture',
	'plaintext',
	'pre',
	'progress',
	'q',
	'rp',
	'rt',
	'ruby',
	's',
	'samp',
	'script',
	'section',
	'select',
	'shadow',
	'slot',
	'small',
	'source',
	'spacer',
	'span',
	'strike',
	'strong',
	'style',
	'sub',
	'summary',
	'sup',
	'table',
	'tbody',
	'td',
	'template',
	'textarea',
	'tfoot',
	'th',
	'thead',
	'time',
	'title',
	'tr',
	'track',
	'tt',
	'u',
	'ul',
	'var',
	'video',
	'wbr',
]

/**
 * Checks if there are any issues with the target selector
 *
 * @param {string} type  The target type
 * @param {string} value The target value
 *
 * @return {mixed} null or an object with type and message properties
 */
export const getTargetSelectorWarning = ( type, value ) => {
	if ( type === 'block' && value ) {
		try {
			if ( document?.querySelectorAll( '#' + value ).length > 1 ) {
				return {
					type: 'duplicate-block-id',
					message: __( 'Multiple blocks with the same ID found. Please ensure that the ID is unique.', 'interactions' ),
				}
			}
		} catch ( error ) {
			// Do nothing.
		}
	}
	return null
}
