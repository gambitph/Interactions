import TargetSVG from '~interact/editor/assets/target.svg'

import { GridLayout, FlexLayout } from '~interact/editor/components'
import { getOrGenerateBlockAnchor, getOrGenerateBlockClass } from '~interact/editor/util'
import {
	SelectControl,
	Button,
	TextControl,
} from '@wordpress/components'
import { __ } from '@wordpress/i18n'
import { select, subscribe } from '@wordpress/data'
import {
	useState, useRef, useEffect,
} from '@wordpress/element'
import BlockPickerPopover from './picker-popover'
import { getTargetSelectorWarning, maybeInvalidSelector } from './util'
import BlockPickerControl, { getFirstBlockOption } from './block-picker-control'
import { isEqual, throttle } from 'lodash'

export { default as BlockPickerPopover } from './picker-popover'

const NOOP = () => {}

const TargetSelector = props => {
	const {
		label = __( 'Element Trigger', 'interactions' ),
		value = { type: 'block', value: '' },
		targets = null,
		horizontalTypes = 'all', // 'all' or an array of types that should be horizontal
		hasTrigger = false,
		hasPickerPopover = true,
		onChange = NOOP,
		onBlockSelectClick = NOOP, // Triggered when the block select button is clicked
		onBlockSelectDone = NOOP, // Triggered when block selection ended
		anchor = null,
		offset = 24,
		noArrow = false,
	} = props

	const [ isPopoverOpen, setIsPopoverOpen ] = useState( false )
	const [ buttonRef, setButtonRef ] = useState( null )
	const prevValueRef = useRef( {} )

	const targetButton = (
		<>
			<Button
				className="interact-target-block-button"
				icon={ <TargetSVG width="16" height="16" /> }
				variant="secondary"
				ref={ setButtonRef }
				onClick={ () => {
					onBlockSelectClick()
					if ( hasPickerPopover && ! isPopoverOpen ) {
						setIsPopoverOpen( true )
					} else if ( hasPickerPopover && isPopoverOpen ) {
						setIsPopoverOpen( false )
					}
				} }
			/>
			{ hasPickerPopover && isPopoverOpen && (
				<BlockPickerPopover
					anchor={ anchor || buttonRef }
					placement="left"
					offset={ offset }
					noArrow={ noArrow }
					isSmall
					onBlockSelect={ ( clientId, blockName ) => {
						const valueArgs = {
							...value,
							blockName,
						}

						let pickerMode = value.type === 'block' ? 'id' : 'class'
						if ( pickerMode === 'id' ) {
							// If id, use the block id as the anchor. If the
							// block doesn't support anchors is not supported,
							// then use picker mode class.
							const hasAnchorAttribute = !! select( 'core/blocks' ).getBlockType( blockName )?.attributes?.anchor
							if ( hasAnchorAttribute ) {
								valueArgs.value = getOrGenerateBlockAnchor( clientId, true )
							} else {
								pickerMode = 'class'
							}
						}

						if ( pickerMode === 'class' ) {
							// If class, use the first class name if there is one, or create a new one.
							valueArgs.value = getOrGenerateBlockClass( clientId, true )
							valueArgs.type = 'class'
						}

						onChange( valueArgs )
						setIsPopoverOpen( false )
						onBlockSelectDone()
					} }
					onClose={ () => {
						setIsPopoverOpen( false )
						onBlockSelectDone()
					} }
				/>
			) }
		</>
	)

	const isHorizontal = horizontalTypes === 'all' || horizontalTypes.includes( value.type )
	let columns = isHorizontal ? '0.8fr 1fr' : '1fr'
	let labelPosition = 'top'
	if ( value.type !== 'block' && value.type !== 'selector' && value.type !== 'block-name' && value.type !== 'class' ) {
		columns = '1fr'
		labelPosition = 'edge'
	}

	let targetOptions = [
		...( hasTrigger ? [ { value: 'trigger', label: __( 'Interaction Trigger', 'interactions' ) } ] : [] ),
		{ value: 'block', label: __( 'Block', 'interactions' ) },
		{ value: 'block-name', label: __( 'Block Name', 'interactions' ) },
		{ value: 'class', label: __( 'CSS Class', 'interactions' ) },
		{ value: 'selector', label: __( 'CSS Selector', 'interactions' ) },
	]

	if ( Array.isArray( targets ) && targets.length ) {
		targetOptions = targets.map( target => {
			// Supply labels for the target options if they are not already set.
			if ( ! target.label ) {
				if ( target.value === 'trigger' ) {
					return { ...target, label: __( 'Interaction Trigger', 'interactions' ) }
				} else if ( target.value === 'block' ) {
					return { ...target, label: __( 'Block', 'interactions' ) }
				} else if ( target.value === 'block-name' ) {
					return { ...target, label: __( 'Block Name', 'interactions' ) }
				} else if ( target.value === 'class' ) {
					return { ...target, label: __( 'CSS Class', 'interactions' ) }
				} else if ( target.value === 'selector' ) {
					return { ...target, label: __( 'CSS Selector', 'interactions' ) }
				} else if ( target.value === 'window' ) {
					return { ...target, label: __( 'Window', 'interactions' ) }
				} else if ( target.value === 'document' ) {
					return { ...target, label: __( 'Document', 'interactions' ) }
				}
			}
			return target
		} )
	}

	// If hasTrigger is set to false, we'll need to remove it from the options
	// since it can be supplied by the action config.
	if ( ! hasTrigger ) {
		targetOptions = targetOptions.filter( target => target.value !== 'trigger' )
	}

	// Watch for warnings, we need to throttle this because we are subscribed to
	// the editor and changes can be fast.
	const [ targetWarning, setTargetWarning ] = useState( getTargetSelectorWarning( value.type, value.value ) )
	useEffect( () => {
		const updateTarget = () => {
			setTargetWarning( prevValue => {
				const newValue = getTargetSelectorWarning( value.type, value.value )
				return isEqual( prevValue, newValue ) ? prevValue : newValue
			} )
		}
		updateTarget()
		// We need to watch for editor changes.
		const unsubscribe = subscribe( throttle( updateTarget, 500 ) )
		return () => unsubscribe()
	}, [ value.type, value.value ] )

	return (
		<>
			<GridLayout columns={ columns } alignItems="start">
				<SelectControl
					label={ label }
					labelPosition={ labelPosition }
					options={ targetOptions }
					value={ value.type }
					onChange={ type => {
						const newTarget = { ...value, type }

						// Use any previous values we may have already entered.
						if ( type === 'block-name' ) {
							if ( prevValueRef.current[ type ] ) {
								newTarget.value = prevValueRef.current[ type ]
							} else {
								newTarget.value = getFirstBlockOption()
							}
						}

						// If we are switching from block-name to another type,
						// we should use the other value.
						if ( type !== 'block-name' && value.type === 'block-name' ) {
							if ( prevValueRef.current.other ) {
								newTarget.value = prevValueRef.current.other
							}
						}

						// Keep in mind the previous value.
						const prevType = value.type === 'block-name' ? 'block-name' : 'other'
						prevValueRef.current[ prevType ] = value.value

						onChange( newTarget )
					} }
					id="interact-target-type-select"
				/>
				{ value.type === 'block' && (
					<FlexLayout justifyContent="start">
						{ isHorizontal && targetButton }
						<TextControl
							id="interact-target-block-input"
							label={ __( 'Block Anchor / ID', 'interactions' ) }
							value={ value.value }
							// When typing, the previous blockName should be invalid
							onChange={ targetValue => onChange( {
								...value, blockName: '', value: targetValue,
							} ) }
							onBlur={ () => {
								// Cleanup any '.' or '#' characters at the start.
								if ( value.value ) {
									const targetValue = value.value.replace( /^[.#]/, '' )
									if ( targetValue !== value.value ) {
										onChange( { ...value, value: targetValue } )
									}
								}
							} }
							placeholder={ __( 'Select block or enter block anchor id', 'interactions' ) }
						/>
						{ ! isHorizontal && targetButton }
					</FlexLayout>
				) }
				{ value.type === 'class' && (
					<FlexLayout justifyContent="start">
						{ isHorizontal && targetButton }
						<TextControl
							label={ __( 'CSS Class', 'interactions' ) }
							value={ value.value }
							// When typing, the previous blockName should be invalid
							onChange={ targetValue => onChange( {
								...value, blockName: '', value: targetValue,
							} ) }
							onBlur={ () => {
								// Cleanup any '.' or '#' characters at the start.
								if ( value.value ) {
									const targetValue = value.value.replace( /^[.#]/, '' )
									if ( targetValue !== value.value ) {
										onChange( { ...value, value: targetValue } )
									}
								}
							} }
						/>
						{ ! isHorizontal && targetButton }
					</FlexLayout>
				) }
				{ value.type === 'block-name' && (
					<BlockPickerControl
						label={ __( 'Block Name', 'interactions' ) }
						value={ value.value }
						onChange={ targetValue => onChange( { ...value, value: targetValue } ) }
					/>
				) }
				{ value.type === 'selector' && (
					<TextControl
						label={ __( 'CSS Selector', 'interactions' ) }
						value={ value.value }
						// When typing, the previous blockName should be invalid
						onChange={ targetValue => onChange( {
							...value, blockName: '', value: targetValue,
						} ) }
					/>
				) }
			</GridLayout>
			{ value.type === 'trigger' && (
				<label className="interact-target-selector__help" htmlFor="interact-target-type-select">
					{ __( 'This action will be applied to the element that initially triggered the interaction.', 'interactions' ) }
								&nbsp;
					<a href="https://docs.wpinteractions.com/article/573-what-is-the-element-picker" target="_docs">{ __( 'Learn more', 'interactions' ) }</a>
				</label>
			) }
			{ value.type === 'block' && (
				<label className="interact-target-selector__help" htmlFor="interact-target-block-input">
					{ __( 'Enter the block id of the block that will trigger the interaction.', 'interactions' ) }
								&nbsp;
					<a href="https://docs.wpinteractions.com/article/573-what-is-the-element-picker" target="_docs">{ __( 'Learn more', 'interactions' ) }</a>
				</label>
			) }
			{ value.type === 'block-name' && (
				<label className="interact-target-selector__help" htmlFor="interact-target-block-input">
					{ __( 'Select the type of block that will trigger the interaction, this can match multiple blocks.', 'interactions' ) }
								&nbsp;
					<a href="https://docs.wpinteractions.com/article/573-what-is-the-element-picker" target="_docs">{ __( 'Learn more', 'interactions' ) }</a>
				</label>
			) }
			{ value.type === 'class' && (
				<label className="interact-target-selector__help" htmlFor="interact-target-block-input">
					{ __( 'Enter the class of the elements that will trigger the interaction, this can match multiple elements.', 'interactions' ) }
								&nbsp;
					<a href="https://docs.wpinteractions.com/article/573-what-is-the-element-picker" target="_docs">{ __( 'Learn more', 'interactions' ) }</a>
				</label>
			) }
			{ value.type === 'selector' && (
				<label className="interact-target-selector__help" htmlFor="interact-target-block-input">
					{ __( 'Enter the CSS selector of the elements that will trigger the interaction, this can match mutiple elements.', 'interactions' ) }
								&nbsp;
					<a href="https://docs.wpinteractions.com/article/573-what-is-the-element-picker" target="_docs">{ __( 'Learn more', 'interactions' ) }</a>
				</label>
			) }
			{ value.type === 'selector' && maybeInvalidSelector( value.value ) && (
				// Show a warning if the selector might be invalid.
				<label className="interact-target-selector__help interact-target-selector__warn" htmlFor="interact-target-block-input">
					{ __( 'You may have forgotten to add a "." or "#" in front of your selector.', 'interactions' ) }
				</label>
			) }
			{ targetWarning && (
				<span className="interact-warning-text">{ targetWarning.message }</span>
			) }
		</>
	)
}

export default TargetSelector
