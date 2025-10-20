import classnames from 'classnames'
import {
	BaseControl,
	ColorIndicator,
	Dropdown,
	FlexItem,
	Button,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components'
import {
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
} from '@wordpress/block-editor'
import { applyFilters } from '@wordpress/hooks'
import { ColorPalettePopup } from './color-palette-popup'

const POPOVER_PROPS = {
	placement: 'left-start',
	offset: 36,
	shift: true,
}

const renderToggle =
	settings =>
		( { onToggle, isOpen } ) => {
			const { colorValue, label } = settings

			const toggleProps = {
				onClick: onToggle,
				className: classnames(
					'block-editor-panel-color-gradient-settings__dropdown',
					{ 'is-open': isOpen }
				),
				'aria-expanded': isOpen,
			}

			return (
				<Button { ...toggleProps }>
					<LabeledColorIndicator
						colorValue={ colorValue }
						label={ label }
					/>
				</Button>
			)
		}

const NOOP = () => {}

const ColorControl = props => {
	const {
		onChange = NOOP,
		value: _value,
		...propsToPass
	} = props

	const value = applyFilters( 'stackable.color-palette-control.color-value', _value )

	// Integration with Stackable: add Stackable global colors.
	const { colors } = applyFilters( 'stackable.color-palette-control.colors', useMultipleOriginColorsAndGradients() )

	const allColors = colors.reduce( ( colors, group ) => {
		return [
			...colors,
			...group.colors,
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

	const toggleSettings = {
		colorValue: value,
		label: colorLabel,
	}

	const colorPalette = (
		<ColorPalettePopup
			value={ value }
			onChange={ onChange }
			colors={ colors }
		/>
	)

	return (
		<BaseControl
			className="interact-color-control"
			{ ...propsToPass }
		>
			<Dropdown
				popoverProps={ POPOVER_PROPS }
				className="block-editor-tools-panel-color-gradient-settings__dropdown"
				renderToggle={ renderToggle( toggleSettings ) }
				renderContent={ () => (
					<div className="interact-color-palette-control__popover-content">
						{ colorPalette }
					</div>
				) }
			/>
		</BaseControl>
	)
}

const LabeledColorIndicator = ( { colorValue, label } ) => (
	<HStack justify="flex-start">
		<ColorIndicator
			className="stk-color-indicator block-editor-panel-color-gradient-settings__color-indicator"
			colorValue={ colorValue }
		/>
		<FlexItem
			className="stk-color-name block-editor-panel-color-gradient-settings__color-name"
			title={ label }
		>
			{ label }
		</FlexItem>
	</HStack>
)

export default ColorControl
