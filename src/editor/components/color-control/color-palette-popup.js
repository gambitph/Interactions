/**
 * A popup of a color palette.
 */

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n'
import { getColorObjectByColorValue } from '@wordpress/block-editor'
import { applyFilters } from '@wordpress/hooks'
import {
	ColorPalette,
	ColorPicker,
} from '@wordpress/components'

const NOOP = () => {}
const PASSTHRU = v => v

const defaultProps = {
	value: '',
	onChange: NOOP,
	preOnChange: PASSTHRU,

	colors: [],

	isGradient: false,
}

export const ColorPalettePopup = props => {
	const {
		onChange,
		preOnChange,
		value,
		colors,
	} = { ...defaultProps, ...props }

	const allColors = colors.reduce( ( colors, group ) => {
		return [
			...colors,
			...( group.colors || group.gradients ),
		]
	}, [] )

	let colorLabel,
		colorName = value
	allColors.some( color => {
		if ( color.color === value || color.gradient === value ) {
			colorName = color.name
			colorLabel = color.name
			return true
		}
		return false
	} )

	colorLabel = colorName || ( value === 'transparent' ? 'Transparent' : value )

	return (
		<>
			<ColorPicker
				onChange={ newValue => {
					onChange( preOnChange( newValue, value ) )
				} }
				color={ value }
				enableAlpha={ true }
			/>
			<ColorPalette
				value={ value }
				onChange={ newValue => {
					const colorObject = getColorObjectByColorValue( allColors, newValue )
					onChange( preOnChange( applyFilters( 'stackable.color-palette-control.change', newValue, colorObject ), value ) )
				} }
				disableCustomColors={ true }
				label={ colorLabel }
				clearable={ false }
				colors={ colors }
				__experimentalHasMultipleOrigins={ true }
			/>
		</>
	)
}
