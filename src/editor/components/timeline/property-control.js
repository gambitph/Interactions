/* eslint-disable @wordpress/no-unsafe-wp-apis */
import {
	BaseControl,
	Button,
	Dropdown,
	MenuGroup,
	MenuItemsChoice,
	RangeControl,
	SelectControl,
	TextControl,
	TextareaControl,
	ToggleControl,
	__experimentalNumberControl as NumberControl,
	__experimentalHStack as HStack,
} from '@wordpress/components'
import { __ } from '@wordpress/i18n'
import { clamp } from 'lodash'
import ColorControl from '../color-control'
import SVGBolt from './images/bolt.svg'
import { plan } from 'interactions'

const NOOP = () => {}
const EMPTYARR = []

const POPOVER_PROPS = {
	placement: 'bottom-end',
	shift: true,
}

const EMPTY_PROVIDED_VALUES = [ {
	label: __( 'No values available', 'interactions' ),
	value: '',
	disabled: true,
} ]

export const PropertyControl = props => {
	const {
		property = {},
		properties = {}, // Holds the values of all the properties.
		value = '',
		onChange = NOOP,
		hasDynamic: _configHasDynamic = false,
		stepProvidedValues = EMPTYARR,
	} = props

	// Render help as dangerous html to render html tags such as links to the
	// docs.
	let help = property.help ? (
		<span dangerouslySetInnerHTML={ { __html: property.help } } />
	) : null

	// Allow the property to override the config for if the option is dynamic.
	const {
		hasDynamic: _propertyHasDynamic = true,
	} = property

	const _hasDynamic = _configHasDynamic ? _propertyHasDynamic : false
	// Dynamic referencign is only available in some plans.
	const hasDynamic = ( plan === 'professional' || plan === 'agency' ) ? _hasDynamic : false

	// If the property has a condition, we need to check if it is met in order
	// to display this property.
	if ( property.condition ) {
		const { property: conditionProperty, value: conditionValue } = property.condition
		// If conditionValue is an array, check if the value is in the array.
		if ( Array.isArray( conditionValue ) ) {
			if ( ! conditionValue.includes( properties[ conditionProperty ] ) ) {
				return null
			}
		} else if ( properties[ conditionProperty ] !== conditionValue ) {
			return null
		}
	}

	if ( property.type === 'number' ) {
		return (
			<BaseControl
				className="interact-property-control interact-property-control--number"
				label={ property.name }
				help={ help }
			>
				<HStack>
					<RangeControl
						value={ clamp( value, property.min || 0, property.max || 100 ) }
						onChange={ onChange }
						min={ property.min || 0 }
						max={ property.max || 100 }
						step={ property.step || 1 }
						withInputField={ false }
					/>
					<NumberControl
						value={ value }
						onChange={ onChange }
						step={ property.step || 1 }
						min={ property.enforceMinMax ? property.min || -Infinity : -Infinity }
						max={ property.enforceMinMax ? property.max || Infinity : Infinity }
					/>
				</HStack>
			</BaseControl>
		)
	}

	if ( property.type === 'select' ) {
		return (
			<SelectControl
				label={ property.name }
				value={ value }
				onChange={ onChange }
				options={ property.options }
				help={ help }
			/>
		)
	}

	if ( property.type === 'note' ) {
		return (
			<p>{ property.name }</p>
		)
	}

	if ( property.type === 'color' ) {
		return (
			<ColorControl
				label={ property.name }
				value={ value }
				onChange={ onChange }
				help={ help }
			/>
		)
	}

	if ( property.type === 'toggle' ) {
		return (
			<ToggleControl
				label={ property.name }
				checked={ value }
				onChange={ onChange }
				help={ help }
			/>
		)
	}

	// TODO: Add "code" type for custom JS & PHP
	const Tag = property.type === 'textarea' || property.type === 'code' ? TextareaControl
		: TextControl

	// If id type, turn into a slug on blur.
	const propsToPass = {}
	if ( property.type === 'id' ) {
		const idHelp = __( 'Give this data a unique name to make it available to other actions. Can only be lowercase letters, numbers and underscore.', 'interactions' )
		if ( property.help ) {
			help = <>{ help } { idHelp }</>
		} else {
			help = idHelp
		}
		propsToPass.hasDynamic = false
		propsToPass.onBlur = () => {
			const newValue = value.toLowerCase().replace( /[^\d\w]+/g, '_' ).replace( /[^a-z0-9_]/gi, '' )
			if ( newValue !== value ) {
				onChange( newValue )
			}
		}
	}

	return (
		<BaseControl
			className="interact-property-control interact-property-control--text"
			label={ property.name }
			help={ help }
		>
			<HStack alignment="top">
				<Tag
					value={ value }
					onChange={ onChange }
					placeholder={ property.placeholder || '' }
					{ ...propsToPass }
				/>
				{ hasDynamic && (
					<Dropdown
						popoverProps={ POPOVER_PROPS }
						focusOnMount={ true }
						renderToggle={ ( { isOpen, onToggle } ) => (
							<Button
								className="interact-property-control__dynamic-button"
								variant="secondary"
								onClick={ onToggle }
								aria-expanded={ isOpen }
								label={ __( 'Use value from earlier step', 'interactions' ) }
							>
								<SVGBolt />
							</Button>
						) }
						renderContent={ ( { onToggle } ) => (
							<div className="interact-property-control__dynamic-popover-content">
								<h4 style={ { marginTop: 0 } }>{ __( 'Use a Value From an Earlier Step', 'interactions' ) }</h4>
								<p>{ __( 'This list shows all previously acquired data in your timeline.', 'interactions' ) }</p>
								<MenuGroup>
									<MenuItemsChoice
										choices={ stepProvidedValues.length
											? stepProvidedValues.map( name => {
												return {
													label: name,
													value: name,
												}
											} )
											: EMPTY_PROVIDED_VALUES
										}
										onSelect={ value => {
											if ( value ) {
												if ( property.language === 'php' ) {
													onChange( `$data->${ value }` )
												} else {
													onChange( `data.${ value }` )
												}
												onToggle()
											}
										} }
									/>
								</MenuGroup>
							</div>
						) }
					/>
				) }
			</HStack>
		</BaseControl>
	)
}
