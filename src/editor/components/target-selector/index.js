import TargetSVG from '~interact/editor/assets/target.svg'

import { GridLayout, FlexLayout } from '~interact/editor/components'
import {
	getSelectedBlockAnchor,
	isBricksEditor,
	isElementorEditor,
	startEditorElementPicker,
} from '~interact/editor/editors'
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

	const isBuilder = isBricksEditor() || isElementorEditor()
	const isElementor = isElementorEditor()
	const hasBlockEditor = !! select( 'core/block-editor' )?.getSelectedBlockClientId
	const [ isPopoverOpen, setIsPopoverOpen ] = useState( false )
	const [ pendingBuilderTarget, setPendingBuilderTarget ] = useState( null )
	const [ buttonRef, setButtonRef ] = useState( null )
	// Keep Elementor's "Elementor Element" as a local display mode only so the
	// saved target remains a normal selector/class target.
	const [ elementorUiType, setElementorUiType ] = useState(
		isElementor && value.type === 'selector' ? 'elementor-element' : null
	)
	const prevValueRef = useRef( {} )
	const elementPickerStopRef = useRef( null )
	const displayType = isElementor && elementorUiType === 'elementor-element'
		? 'elementor-element'
		: value.type

	const targetButton = (
		<>
			<Button
				className={ `interact-target-block-button${ isBuilder && isPopoverOpen && ! pendingBuilderTarget ? ' is-picking' : '' }` }
				icon={ <TargetSVG width="16" height="16" /> }
				variant="secondary"
				ref={ setButtonRef }
				onClick={ () => {
					onBlockSelectClick()
					if ( isBuilder ) {
						elementPickerStopRef.current?.()
						setPendingBuilderTarget( null )
						setIsPopoverOpen( true )
						elementPickerStopRef.current = startEditorElementPicker( {
							targetType: displayType === 'class' ? 'class' : 'selector',
							onPick: target => {
								setPendingBuilderTarget( target )
							},
							onCancel: () => {
								setIsPopoverOpen( false )
								setPendingBuilderTarget( null )
								onBlockSelectDone()
							},
						} )
					} else if ( hasPickerPopover && ! isPopoverOpen ) {
						setIsPopoverOpen( true )
					} else if ( hasPickerPopover && isPopoverOpen ) {
						setIsPopoverOpen( false )
					}
				} }
			/>
			{ hasPickerPopover && isPopoverOpen && ! isBuilder && (
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
			{ isBuilder && isPopoverOpen && (
				<BlockPickerPopover
					anchor={ anchor || buttonRef }
					placement="left"
					offset={ offset }
					noArrow={ noArrow }
					isSmall
					description={ __( 'Please select an element in the editor area to add this interaction to.', 'interactions' ) }
					primaryLabel={ __( 'Select Element', 'interactions' ) }
					primaryDisabled={ ! pendingBuilderTarget }
					enableBlockSelectMode={ false }
					onBlockSelect={ () => {
						onChange( pendingBuilderTarget )
						setIsPopoverOpen( false )
						setPendingBuilderTarget( null )
						onBlockSelectDone()
					} }
					onClose={ () => {
						elementPickerStopRef.current?.()
						elementPickerStopRef.current = null
						setIsPopoverOpen( false )
						setPendingBuilderTarget( null )
						onBlockSelectDone()
					} }
				/>
			) }
		</>
	)

	const isHorizontal = horizontalTypes === 'all' || horizontalTypes.includes( value.type )
	let columns = isHorizontal ? '0.8fr 1fr' : '1fr'
	let labelPosition = 'top'
	if ( displayType !== 'block' && displayType !== 'selector' && displayType !== 'block-name' && displayType !== 'class' && displayType !== 'elementor-element' ) {
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

	if ( isElementorEditor() ) {
		targetOptions.unshift( { value: 'elementor-element', label: __( 'Elementor Element', 'interactions' ) } )
		const elementorTargetTypes = [ 'trigger', 'class', 'selector', 'window', 'elementor-element' ]
		targetOptions = targetOptions.filter( target => elementorTargetTypes.includes( target.value ) )
	}

	if ( isBricksEditor() ) {
		const bricksTargetTypes = [ 'trigger', 'selector', 'window' ]
		targetOptions = targetOptions.filter( target => bricksTargetTypes.includes( target.value ) )
	}

	useEffect( () => {
		return () => {
			elementPickerStopRef.current?.()
			setPendingBuilderTarget( null )
		}
	}, [] )

	// Watch for warnings, we need to throttle this because we are subscribed to
	// the editor and changes can be fast.
	const [ targetWarning, setTargetWarning ] = useState( getTargetSelectorWarning( value.type, value.value ) )
	useEffect( () => {
		const updateTarget = () => {
			setTargetWarning( prevValue => {
				if ( displayType === 'elementor-element' ) {
					return null
				}
				const newValue = getTargetSelectorWarning( value.type, value.value )
				return isEqual( prevValue, newValue ) ? prevValue : newValue
			} )
		}
		updateTarget()
		// We need to watch for editor changes.
		const unsubscribe = subscribe( throttle( updateTarget, 500 ) )
		return () => unsubscribe()
	}, [ displayType, value.type, value.value ] )

	return (
		<>
			<GridLayout columns={ columns } alignItems="start">
				<SelectControl
					label={ label }
					labelPosition={ labelPosition }
					options={ targetOptions }
					value={ displayType }
					onChange={ type => {
						const newTarget = {
							...value,
							type: type === 'elementor-element' ? 'selector' : type,
						}
						setElementorUiType( type === 'elementor-element' ? 'elementor-element' : null )

						// Use any previous values we may have already entered.
						if ( type === 'block-name' && hasBlockEditor ) {
							if ( prevValueRef.current[ type ] ) {
								newTarget.value = prevValueRef.current[ type ]
							} else {
								newTarget.value = getFirstBlockOption()
							}
						}

						// If we are switching from block-name to another type,
						// we should use the other value.
						if ( type !== 'block-name' && displayType === 'block-name' ) {
							if ( prevValueRef.current.other ) {
								newTarget.value = prevValueRef.current.other
							}
						}

						// Keep in mind the previous value.
						const prevType = displayType === 'block-name' ? 'block-name' : 'other'
						prevValueRef.current[ prevType ] = value.value

						onChange( newTarget )
					} }
					id="interact-target-type-select"
				/>
				{ displayType === 'block' && (
					<FlexLayout justifyContent="start">
						{ isHorizontal && targetButton }
						<TextControl
							className="interact-target-block-input"
							id="interact-target-block-input"
							label={ __( 'Block Anchor / ID', 'interactions' ) }
							value={ value.value || ( isBuilder ? '' : getSelectedBlockAnchor() || '' ) }
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
				{ displayType === 'class' && (
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
				{ displayType === 'block-name' && (
					<BlockPickerControl
						label={ __( 'Block Name', 'interactions' ) }
						value={ value.value }
						onChange={ targetValue => onChange( { ...value, value: targetValue } ) }
					/>
				) }
				{ displayType === 'selector' && (
					<FlexLayout justifyContent="start">
						{ isHorizontal && isBuilder && targetButton }
						<TextControl
							label={ __( 'CSS Selector', 'interactions' ) }
							value={ value.value }
							// When typing, the previous blockName should be invalid
							onChange={ targetValue => onChange( {
								...value, blockName: '', value: targetValue,
							} ) }
						/>
						{ ! isHorizontal && isBuilder && targetButton }
					</FlexLayout>
				) }
				{ displayType === 'elementor-element' && (
					<FlexLayout justifyContent="start">
						{ isHorizontal && isBuilder && targetButton }
						<TextControl
							label={ __( 'Elementor Element', 'interactions' ) }
							value={ value.blockName || '' }
							disabled
						/>
						{ ! isHorizontal && isBuilder && targetButton }
					</FlexLayout>
				) }
			</GridLayout>
			{ displayType === 'trigger' && (
				<label className="interact-target-selector__help" htmlFor="interact-target-type-select">
					{ __( 'This action will be applied to the element that initially triggered the interaction.', 'interactions' ) }
								&nbsp;
					<a href="https://docs.wpinteractions.com/article/573-what-is-the-element-picker" target="_docs">{ __( 'Learn more', 'interactions' ) }</a>
				</label>
			) }
			{ displayType === 'block' && (
				<label className="interact-target-selector__help" htmlFor="interact-target-block-input">
					{ __( 'Enter the block id of the block that will trigger the interaction.', 'interactions' ) }
								&nbsp;
					<a href="https://docs.wpinteractions.com/article/573-what-is-the-element-picker" target="_docs">{ __( 'Learn more', 'interactions' ) }</a>
				</label>
			) }
			{ displayType === 'block-name' && (
				<label className="interact-target-selector__help" htmlFor="interact-target-block-input">
					{ __( 'Select the type of block that will trigger the interaction, this can match multiple blocks.', 'interactions' ) }
								&nbsp;
					<a href="https://docs.wpinteractions.com/article/573-what-is-the-element-picker" target="_docs">{ __( 'Learn more', 'interactions' ) }</a>
				</label>
			) }
			{ displayType === 'class' && (
				<label className="interact-target-selector__help" htmlFor="interact-target-block-input">
					{ __( 'Enter the class of the elements that will trigger the interaction, this can match multiple elements.', 'interactions' ) }
								&nbsp;
					<a href="https://docs.wpinteractions.com/article/573-what-is-the-element-picker" target="_docs">{ __( 'Learn more', 'interactions' ) }</a>
				</label>
			) }
			{ displayType === 'selector' && (
				<label className="interact-target-selector__help" htmlFor="interact-target-block-input">
					{ __( 'Enter the CSS selector of the elements that will trigger the interaction, this can match mutiple elements.', 'interactions' ) }
								&nbsp;
					<a href="https://docs.wpinteractions.com/article/573-what-is-the-element-picker" target="_docs">{ __( 'Learn more', 'interactions' ) }</a>
				</label>
			) }
			{ displayType === 'selector' && maybeInvalidSelector( value.value ) && (
				// Show a warning if the selector might be invalid.
				<label className="interact-target-selector__help interact-target-selector__warn" htmlFor="interact-target-block-input">
					{ __( 'You may have forgotten to add a "." or "#" in front of your selector.', 'interactions' ) }
				</label>
			) }
			{ displayType === 'elementor-element' && (
				<label className="interact-target-selector__help" htmlFor="interact-target-block-input">
					{ __( 'Use the picker button to select an Elementor element.', 'interactions' ) }
				</label>
			) }
			{ targetWarning && (
				<span className="interact-warning-text">{ targetWarning.message }</span>
			) }
		</>
	)
}

export default TargetSelector
