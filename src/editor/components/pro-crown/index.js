import { forwardRef } from '@wordpress/element'
import { Button } from '@wordpress/components'
import { __ } from '@wordpress/i18n'
import { FlexLayout } from '..'

const crownPathId = 'interact-pro-crown-path'

// Only inject the <path> definition once per page, even if the icon is used many times.
function ensureCrownPathDef() {
	if ( typeof document === 'undefined' ) {
		return
	}
	if ( document.getElementById( crownPathId ) ) {
		return
	}

	const svgDefs = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' )
	svgDefs.setAttribute( 'style', 'position:absolute;width:0;height:0;pointer-events:none;' )
	svgDefs.setAttribute( 'aria-hidden', 'true' )
	const defs = document.createElementNS( 'http://www.w3.org/2000/svg', 'defs' )
	const path = document.createElementNS( 'http://www.w3.org/2000/svg', 'path' )
	path.setAttribute( 'id', crownPathId )
	path.setAttribute(
		'd',
		'M346.9 96.4C338.6 86.9 313.1 84.8 305 95.7C301.4 99.6 305.3 93.8 301.3 98C272.5 123.5 240.6 156.6 212.7 181.8C179.7 166.4 150.4 135.1 121.9 112.3C105.9 86 61.8 94.1 60.9 127.1C79.7 252.4 117.1 376.9 133.9 502C134.4 505.6 134.1 503.3 134.2 504C130.4 504.5 140.9 503.1 139.3 503.3C139.2 502.6 133.5 504.6 135.8 509.8C140 522.9 153 531.4 166.5 531.4C212.6 518.7 267.2 511.4 320.8 510.4C373.4 508.5 426.4 516.4 476.4 528.1C490.3 528.6 503.6 519.1 507.7 505.8C530.7 395.9 551.2 282 569.2 169.9C570 159.5 576.4 149.5 575.3 139.7C574 118.1 546.2 101.9 528.2 114C502.8 125.6 465.5 165.3 438.6 182.6C433.8 183.3 427.8 172.8 429.5 175.8C404.5 148.6 376.3 121 349 98.5L346.9 96.5L346.9 96.5zM451.3 456.9L451.3 456.9C366.9 439.6 281.4 444.6 192.7 458.5C188.6 428.7 181.9 399.1 175.5 371C164.2 321.6 154.8 262.8 142.4 213.4C165.5 225.9 191 256.7 217.1 255.8C245.7 259 258.2 224.8 277.1 209.5C295.1 190.7 306.2 181.6 325.9 163.2C354.1 187.9 380 218.1 407.6 245.8C422.1 260.4 445.2 261.6 461.1 248.7C468.2 242.9 481.6 232 495.2 220.4C493.6 230 492.1 239.6 490.6 249.2C481.9 302.7 474.3 350.6 462.8 402.5C459.1 419.3 454.9 439 451.4 456.9z'
	)
	defs.appendChild( path )
	svgDefs.appendChild( defs )
	document.body.appendChild( svgDefs )
}

/**
 * ProCrownIcon
 *
 * A reusable SVG crown icon for "premium" tags.
 * Uses <use> to reference a single <path> definition for optimal performance.
 *
 * @param {Object}        props                   - Props to pass to the SVG element.
 * @param {string|number} [props.size=24]         - The width and height of the icon.
 * @param {string}        [props.color='#fdc800'] - The fill color of the crown background.
 * @param {Object}        ref                     - Forwarded ref for the SVG element.
 */
export const ProCrownIcon = forwardRef( ( {
	size = 24,
	backgroundColor = '#05f',
	color = '#fff',
	...props
}, ref ) => {
	// Ensure the <path> definition is present only once in the DOM.
	if ( typeof window !== 'undefined' ) {
		ensureCrownPathDef()
	}

	return (
		<svg
			ref={ ref }
			width={ size }
			height={ size }
			viewBox="0 0 640 640"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			focusable="false"
			className="interact-pro-crown-icon"
			style={ {
				padding: '3px',
				borderRadius: '100px',
				backgroundColor,
			} }
			{ ...props }
		>
			<use href={ `#${ crownPathId }` } fill={ color } />
		</svg>
	)
} )

ProCrownIcon.displayName = 'ProCrownIcon'

export const ProUpsell = props => {
	const {
		title,
		description,
	} = props

	return (
		<FlexLayout
			className="interact-pro-upsell"
			justifyContent="start"
		>
			<ProCrownIcon size={ 30 } color="#05f" backgroundColor="transparent" />
			<div className="interact-pro-upsell__content">
				<h4>{ title }</h4>
				<div>{ description }</div>
			</div>
			<Button
				className="interact-pro-upsell-button"
				variant="primary"
				href="https://wpinteractions.com/pricing/?utm_source=interactions&utm_medium=editor&utm_campaign=premium-interaction"
				target="_blank"
				rel="noopener noreferrer"
			>
				{ __( 'Upgrade Now', 'interactions' ) }
			</Button>
		</FlexLayout>
	)
}
