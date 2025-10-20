import { useWithShift } from '~interact/editor/hooks'
import { actions as actionsConfig, interactions as interactionsConfig } from 'interactions'
import classNames from 'classnames'
import {
	useState,
	useEffect,
	forwardRef,
} from '@wordpress/element'
import { Button } from '@wordpress/components'
import { __ } from '@wordpress/i18n'

const NOOP = () => {}

const UnforwardedInteractionButton = ( props, ref ) => {
	const {
		onClick = NOOP,
		onDelete = NOOP,
		highlightEnabled = false,
		interaction = {},
		isHighlighted: _isHighlighted = false,
	} = props
	const [ isBusy, setIsBusy ] = useState( false )
	const [ isMouseOver, setIsMouseOver ] = useState( false )
	const [ isHighlighted, setIsHighlighted ] = useState( highlightEnabled ? _isHighlighted : false )
	const isShiftKey = useWithShift()

	// Pulse highlight the entry when it's focused.
	useEffect( () => {
		if ( ! highlightEnabled ) {
			return
		}
		setIsHighlighted( _isHighlighted )
	}, [ _isHighlighted, highlightEnabled ] )

	// If the button is hovered on, highlight the block that corresponds to it.
	useEffect( () => {
		if ( ! highlightEnabled ) {
			return
		}
		if ( interaction.target.type === 'block' ) {
			if ( isMouseOver ) {
				setTimeout( () => {
					window?.dispatchEvent( new window.CustomEvent( 'interact/highlight-block', { detail: { anchor: interaction.target.value } } ) )
				} )
				// Make sure the highlight disappears.
				return () => window?.dispatchEvent( new window.CustomEvent( 'interact/highlight-block', { detail: { anchor: null } } ) )
			}
			window?.dispatchEvent( new window.CustomEvent( 'interact/highlight-block', { detail: { anchor: null } } ) )
		}
	}, [ isMouseOver, interaction.target.type, interaction.target.value, highlightEnabled ] )

	const interactionLabel = interactionsConfig[ interaction.type ]?.name || interaction.type
	const actionLabel = interaction.timelines[ 0 ].actions.map( action => {
		return actionsConfig[ action.type ]?.name || action.type
	} ).join( ', ' ) || __( 'None', 'interactions' )
	const subLabel = interactionLabel + ' / ' + actionLabel

	const className = classNames(
		'interact-list__item-button',
		`interact-list__item-button--${ interaction.key }`,
		{
			'is--highlighted': isHighlighted,
			'is--highlight-enabled': highlightEnabled,
			'is--inactive': ! interaction.active,
		}
	)

	// TODO: We have buttons nested in each other, create a wrapper, then have
	// the 2 buttons be siblings.
	return (
		<Button
			className={ className }
			ref={ ref }
			variant="secondary"
			onClick={ onClick }
			disabled={ isBusy }
			onMouseEnter={ () => setIsMouseOver( true ) }
			onMouseLeave={ () => setIsMouseOver( false ) }
		>
			{ highlightEnabled && <div className="interact-list__item-button__icon" /> }
			<div className="interact-list__item-button__grid-label">
				<div className="interact-list__item-button__title">{ interaction.title }</div>
				{ ! interaction.active && <span className="interact-list__item-button__label">{ __( 'inactive', 'interactions' ) }</span> }
				<div className="interact-list__item-button__bottom-line">
					{ subLabel }
				</div>
			</div>
			<Button
				variant="tertiary"
				className="interact-list__item-button__delete"
				icon="trash"
				size="small"
				iconSize="16"
				isDestructive
				isBusy={ isBusy }
				disabled={ isBusy }
				onClick={ ev => {
					ev.preventDefault()
					ev.stopPropagation()
					setIsBusy( true )
					if ( isShiftKey || confirm( __( 'Are you sure you want to delete this interaction? To delete without prompting, hold down the shift key when deleting.', 'interactions' ) ) ) { // eslint-disable-line no-alert
						onDelete()
					} else {
						setIsBusy( false )
					}
				} }
			/>
		</Button>
	)
}

const InteractionButton = forwardRef( UnforwardedInteractionButton )

export default InteractionButton
