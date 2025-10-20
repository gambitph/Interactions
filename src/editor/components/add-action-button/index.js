import classNames from 'classnames'
import { actionCategories, actions as actionsConfig } from 'interactions'
import { isEmpty, cloneDeep } from 'lodash'

import {
	Button,
	Popover,
	PanelBody,
	MenuGroup,
	MenuItem,
	TextControl,
	Dashicon,
} from '@wordpress/components'
import {
	useState, useRef, useEffect,
} from '@wordpress/element'
import { __, sprintf } from '@wordpress/i18n'
import { FlexLayout } from '..'
import { ProUpsell } from '../pro-crown'

const NOOP = () => {}

// Gather all the actions for fast access.
const ALL_TIME_ACTIONS = []
const ALL_PERCENT_ACTIONS = []

actionCategories.forEach( category => {
	category.actions.forEach( actionName => {
		const { type: actionType } = actionsConfig[ actionName ]
		if ( actionType === 'time' || actionType === 'all' ) {
			ALL_TIME_ACTIONS.push( actionName )
		}
		if ( actionType === 'percentage' || actionType === 'all' ) {
			ALL_PERCENT_ACTIONS.push( actionName )
		}
	} )
} )

const AddActionButton = props => {
	const {
		onAddAction = NOOP,
		onClick = NOOP,
		type = 'time', // time, percentage
		buttonProps = {},
	} = props

	const [ isPopoverOpen, setIsPopoverOpen ] = useState( false )
	const [ search, setSearch ] = useState( '' )
	const [ showDescription, setShowDescription ] = useState( null )
	const buttonRef = useRef()
	const searchRef = useRef()

	const [ searchMatches, setSearchMatches ] = useState( cloneDeep( type === 'time' ? ALL_TIME_ACTIONS : ALL_PERCENT_ACTIONS ) )
	const [ focusedIndex, setFocusedIndex ] = useState( -1 )

	const onPopoverClose = () => {
		setIsPopoverOpen( false )
		buttonRef.current.focus()
	}

	useEffect( () => {
		setSearch( '' )
		if ( isPopoverOpen ) {
			setTimeout( () => searchRef.current.focus(), 1 )
		}
	}, [ isPopoverOpen ] )

	// Update the search matches.
	useEffect( () => {
		// Get all the search match results.
		let searchMatches = cloneDeep( type === 'time' ? ALL_TIME_ACTIONS : ALL_PERCENT_ACTIONS )
		if ( search ) {
			searchMatches = searchMatches.filter( actionName => {
				const { name, keywords } = actionsConfig[ actionName ]
				const isSearchMatch = name.toLowerCase().includes( search.toLowerCase() ) ||
					keywords.some( keyword => keyword.toLowerCase().includes( search.toLowerCase() ) )

				return isSearchMatch
			} )
		}
		setSearchMatches( searchMatches )
		setFocusedIndex( search && searchMatches.length ? 0 : null )
	}, [ search, type ] )

	return (
		<div>
			<Button
				label={ __( 'Add Action', 'interactions' ) }
				icon="plus-alt2"
				ref={ buttonRef }
				{ ...buttonProps }
				onClick={ () => {
					setIsPopoverOpen( value => ! value )
					onClick()
				} }
				onMouseDown={ ev => ev.preventDefault() }
				onKeyDown={ ev => {
					if ( ev.key === 'Enter' || ev.key === ' ' ) {
						setIsPopoverOpen( value => ! value )
						onClick()
						ev.preventDefault()
					}
				} }
			/>
			{ isPopoverOpen && (
				<Popover
					className={ classNames( 'interact-popover', 'interact-action-list-popover' ) }
					placement="left"
					onClose={ onPopoverClose }
					focusOnMount={ false }
					resize={ false }
					shift={ true }
				>
					<PanelBody>
						<Button
							className="interact-add-action-popover__close-button"
							size="small"
							variant="tertiary"
							icon="no-alt"
							label={ __( 'Cancel', 'interactions' ) }
							showTooltip={ false }
							onClick={ onPopoverClose }
						/>
						<FlexLayout style={ { marginBottom: '16px' } } justifyContent="start" gridGap="0">
							<h4 style={ { margin: 0 } }>{ __( 'Add Action', 'interactions' ) }</h4>
							<Button
								className="interact-list-control__title-tip"
								icon="info-outline"
								iconSize="16"
								size="small"
								variant="tertiary"
								label={ __( 'Learn more', 'interactions' ) }
								onClick={ () => window?.open( 'https://docs.wpinteractions.com/article/572-what-is-an-action', '_docs' ) }
							/>
						</FlexLayout>
						<TextControl
							label={ __( 'Search actions', 'interactions' ) }
							hideLabelFromVision
							placeholder={ __( 'Search actions', 'interactions' ) }
							value={ search }
							ref={ searchRef }
							onChange={ search => {
								setSearch( search )
							} }
							onKeyDown={ ev => {
								/**
								 * These are all about searching and allowing the user to select an action.
								 */

								// On enter, add the first match.
								if ( ev.key === 'Enter' && focusedIndex !== -1 ) {
									onAddAction( searchMatches[ focusedIndex ] )
									setIsPopoverOpen( false )
								// On up and down arrow, focus on the next searchMatchesRef
								} else if ( ev.key === 'ArrowDown' ) {
									ev.preventDefault()
									setFocusedIndex( index => {
										return index === null ? 0
											: index + 1 > searchMatches.length - 1 ? 0 : index + 1
									} )
								} else if ( ev.key === 'ArrowUp' ) {
									ev.preventDefault()
									setFocusedIndex( index => {
										return index === null ? searchMatches.length - 1
											: index - 1 < 0 ? searchMatches.length - 1 : index - 1
									} )
								}
							} }
						/>
						<div style={ { marginTop: '24px' } } />
						<div className="interact-action-list-wrapper interact-interaction-list">
							{ actionCategories.map( category => {
								// Check if we have any actions to show, if not, skip this category.
								const hasActions = category.actions.reduce( ( numVisible, actionName ) => {
									// Only show the actions that match the type: time or percent.
									const actionsToDisplay = type === 'time' ? ALL_TIME_ACTIONS : ALL_PERCENT_ACTIONS
									if ( actionsToDisplay.includes( actionName ) ) {
										numVisible++
									}
									return numVisible
								}, 0 )

								if ( ! hasActions ) {
									return null
								}

								return (
									<MenuGroup key={ category.name } label={ category.name }>
										{ category.actions
											.map( actionName => {
												// Only show the actions that match the type: time or percent.
												const actionsToDisplay = type === 'time' ? ALL_TIME_ACTIONS : ALL_PERCENT_ACTIONS
												if ( ! actionsToDisplay.includes( actionName ) ) {
													return null
												}

												const isSearchMatch = searchMatches.includes( actionName )
												const isFocused = focusedIndex !== -1 && searchMatches.indexOf( actionName ) === focusedIndex

												return (
													<MenuItem
														key={ actionName }
														className={ classNames(
															'interact-action-list-item',
															{ 'interact-action-list-item--focused': isFocused }
														) }
														onClick={ () => {
															onAddAction( actionName )
															setIsPopoverOpen( false )
														} }
														style={ {
															opacity: search && isSearchMatch ? 1 : ( ! search ? 1 : 0.3 ),
															fontWeight: search && isSearchMatch ? 'bold' : 'normal',
														} }
														onMouseEnter={ () => setShowDescription( actionName ) }
														onMouseLeave={ () => setShowDescription( null ) }
													>
														{ actionsConfig[ actionName ].name }
														{ type === 'time' && ! isEmpty( actionsConfig[ actionName ].provides ) &&
															<span className="interact-action-list-item-data">{ __( 'data', 'interactions' ) }</span>
														}
													</MenuItem>
												)
											} ) }
									</MenuGroup>
								)
							} ) }
						</div>
						<div style={ { marginTop: '24px' } } />
						<FlexLayout
							className="interact-popover-help"
							justifyContent="start"
						>
							<Dashicon icon="info-outline" /> { showDescription ? actionsConfig[ showDescription ].description : __( 'Hover over an action to show a description of what it does', 'interactions' ) }
						</FlexLayout>

						{ BUILD_TYPE === 'free' && <>
							<div style={ { marginTop: '16px' } } />
							<ProUpsell
								// TODO: hardcode to 27 for now
								title={ sprintf( __( 'Unlock %s+ Premium Actions', 'interactions' ), '27' ) } //PREMIUM_ACTIONS_NUM ) }
								description={ __( 'Rotate 3D, video scrubbing, custom JavaScript and more', 'interactions' ) }
							/>
						</> }
					</PanelBody>
				</Popover>
			) }
		</div>
	)
}

export default AddActionButton
