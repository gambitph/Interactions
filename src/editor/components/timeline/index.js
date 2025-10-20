/* eslint-disable @wordpress/no-unsafe-wp-apis */

import EasingOptions from './easing-options'
import { PropertyControl } from './property-control'
import { useInitialStyleTag } from './use-initial-style-tag'
import {
	AddActionButton,
	FlexLayout, GridLayout, Separator, TargetSelector,
} from '..'
import TimelineSVG from '~interact/editor/assets/timeline.svg'
import {
	createNewAction,
	duplicateAction,
	changeActionType,
} from '~interact/editor/util'
import {
	useDeviceType,
	useWithControl,
	useWithShift,
	useWithOnShortcut,
} from '~interact/editor/hooks'
import classNames from 'classnames'
import { animate, createTimeline } from '~interact/editor/animejs'
import { actions as actionsConfig, interactions as interactionsConfig } from 'interactions'
import {
	first,
	last,
	range,
	cloneDeep,
} from 'lodash'

import {
	__, _n, sprintf,
} from '@wordpress/i18n'
import { upload } from '@wordpress/icons'
import { dispatch } from '@wordpress/data'
import {
	PanelBody,
	Button,
	BaseControl,
	ToggleControl,
	TextControl,
	SelectControl,
	Popover,
	__experimentalNumberControl as NumberControl,
	Dashicon,
	Tooltip,
} from '@wordpress/components'
import {
	useState,
	useEffect,
	useRef,
	Fragment,
	createInterpolateElement,
} from '@wordpress/element'
import { useTimelineRunnerRef } from './runner'
import {
	formDynamicName, getActionWarning, getTimelineWarnings,
} from './util'
import './with-tracked-anchors'

const NOOP = () => {}
const EMPTYOBJ = {}
const EMPTYARR = []

// Some constants for the timeline for animating the preview highlight.
const ACTION_TOP_OFFSET = 10 // This is the padding top of the timeline.
const SINGLE_ACTION_HEIGHT = 40 // This is the height of a single action in the timeline (include spacing to the next action)
const CONNECTED_ACTION_HEIGHT = 31 - 1 // This is the height of a single action when it's connected to the previous action. We have a -1 because the borders are stuck together.

const getTimeAnimationData = actions => {
	const startTimes = []
	const translateY = []

	let prevTranslateY = -SINGLE_ACTION_HEIGHT + ACTION_TOP_OFFSET // We have a 10 here because the first action is 10px from the top.
	let nextTranslateY = 0

	// Add the offset from the starting state actions.
	prevTranslateY += actions.reduce( ( startingStateOFfset, { timing } ) => {
		if ( timing.isStartingState ) {
			startingStateOFfset += startingStateOFfset === 0 ? SINGLE_ACTION_HEIGHT : CONNECTED_ACTION_HEIGHT
		}
		return startingStateOFfset
	}, 0 )

	actions.forEach( ( { timing } ) => {
		if ( ! timing.isStartingState ) {
			if ( ! startTimes.includes( timing.start * 1000 ) ) {
				prevTranslateY += SINGLE_ACTION_HEIGHT + nextTranslateY
				translateY.push( prevTranslateY )
				startTimes.push( timing.start * 1000 )
				nextTranslateY = 0
			} else {
				nextTranslateY += CONNECTED_ACTION_HEIGHT
			}
		}
	} )

	return {
		startTimes,
		translateY,
	}
}

let timelineInstance = 1

const Timeline = props => {
	const {
		type = 'time', // time, percentage
		actions = [],
		onChange = NOOP,
		interaction = EMPTYOBJ,
		timelineIndex = 0,
		onOpenImportExportModal = NOOP,
		onImportTimeline = NOOP,
	} = props

	const [ selectedAction, setSelectedAction ] = useState( null ) // Holds the key of the selected action
	const [ highlightedActions, setHighlightedActions ] = useState( [] ) // Holds the keys of the highlighted actions for copy/pasting
	const [ arrowHighlightIndex, setArrowHighlightIndex ] = useState( -1 ) // Holds the index when higlighting actions using the up/down key
	const [ isPreviewing, setIsPreviewing ] = useState( false )
	const [ isTimelineFocused, setIsTimelineFocused ] = useState( false )
	const [ draggedAction, setDraggedAction ] = useState( null )
	const [ showTimelineHightlight, setShowTimelineHightlight ] = useState( false )
	const timeHighlightRef = useRef()
	const timelineWrapperRef = useRef()
	const deviceType = useDeviceType()
	const isControlKey = useWithControl()
	const isShiftKey = useWithShift()
	const instance = useRef( timelineInstance++ )
	const lastSelectedAction = useRef() // Holds the last highlighted action, we insert new actions on this same start time of this.

	// TODO: we need to have a right click context with (duplicate, copy, paste, delete)

	const onCopy = () => {
		// Copy only on the timeline that's focused.
		if ( ! isTimelineFocused ) {
			return
		}

		if ( highlightedActions.length ) {
			const actionsToCopy = actions.filter( ( { key } ) => highlightedActions.includes( key ) )
			localStorage.setItem( 'interact-copied-actions', JSON.stringify( actionsToCopy ) )

			dispatch( 'core/notices' ).createNotice(
				'success',
				sprintf( _n( 'Copied %d action to clipboard.', 'Copied %d actions to clipboard', highlightedActions.length, 'interactions' ), highlightedActions.length ),
				{
					type: 'snackbar',
					isDismissible: true,
					id: 'COPY_ACTIONS',
				}
			)
		}
	}

	const onPaste = () => {
		// Paste only on the timeline that's focused.
		if ( ! isTimelineFocused ) {
			return
		}

		const actionsToPaste = JSON.parse( localStorage.getItem( 'interact-copied-actions' ) || null )

		if ( ! actionsToPaste ) {
			dispatch( 'core/notices' ).createNotice(
				'error',
				__( 'No actions to paste.', 'interactions' ),
				{
					type: 'snackbar',
					isDismissible: true,
					id: 'PASTE_ERROR_ACTIONS',
				}
			)
			return
		}

		const newActions = actionsToPaste.map( duplicateAction ).reverse()
		const indexToInsert = actions.findIndex( action => action.key === last( highlightedActions ) ) || actions.length - 1
		const lastHighlighted = actions.findIndex( action => action.key === last( highlightedActions ) )

		// Get the start time
		const startTime = actions[ lastHighlighted ]?.timing.start
		if ( startTime ) {
			newActions.forEach( action => {
				action.timing.start = action.timing.start === -1 ? action.timing.start : startTime
			} )
		}

		// Add all newActions in the indexToInsert
		const newActionsToInsert = [ ...actions ]
		newActionsToInsert.splice( indexToInsert + 1, 0, ...newActions )
		onChange( newActionsToInsert )

		// Change the selected & highlighted actions.
		setHighlightedActions( newActions.map( action => action.key ) )
		setSelectedAction( first( newActions )?.key || null )

		// Show notice.
		dispatch( 'core/notices' ).createNotice(
			'success',
			sprintf( _n( 'Pasted %d action.', 'Pasted %d actions', newActions.length, 'interactions' ), newActions.length ),
			{
				type: 'snackbar',
				isDismissible: true,
				id: 'PASTE_ACTIONS',
			}
		)
	}

	const onDelete = () => {
		// Delete only on the timeline that's focused.
		if ( ! isTimelineFocused ) {
			return
		}

		if ( highlightedActions.length ) {
			// Ask if delete.
			// eslint-disable-next-line no-alert
			if ( window.confirm( sprintf( _n( 'Are you sure you want to delete %d action?', 'Are you sure you want to delete %d actions?', highlightedActions.length, 'interactions' ), highlightedActions.length ) ) ) {
				const newActions = [ ...actions ]
				highlightedActions.forEach( actionKey => {
					const actionIndex = newActions.findIndex( action => action.key === actionKey )
					newActions.splice( actionIndex, 1 )
				} )
				setHighlightedActions( [] )
				onChange( newActions )

				timelineWrapperRef.current.focus()
			}
		}
	}

	const onSelectAll = ev => {
		// Paste only on the timeline that's focused.
		if ( isTimelineFocused ) {
			ev.preventDefault()
			setHighlightedActions( actions.map( ( { key } ) => key ) )
		}
	}

	const onEscape = ev => {
		if ( isTimelineFocused ) {
			ev.preventDefault()
			setHighlightedActions( [] )
		}
	}

	useWithOnShortcut( {
		onCopy,
		onPaste,
		onDelete,
		onSelectAll,
		onEscape,
	} )

	const previewType = type === 'time' ? 'button' : 'live'

	// Reset the preview when the device type changes because the editor might
	// do an iframe and we need to re-render the preview.
	useEffect( () => {
		setIsPreviewing( false )
	}, [ deviceType ] )

	useEffect( () => {
		if ( isPreviewing && timeHighlightRef.current ) {
			// Animate the seconds time timeline.
			if ( previewType === 'button' ) {
				const { startTimes, translateY } = getTimeAnimationData( actions )

				const timeHighlightEl = timeHighlightRef.current
				const animDuration = 400

				const animation = createTimeline( {
					defaults: {
						ease: 'easeOutCirc',
					},
					onUpdate: anim => {
						timeHighlightEl.innerHTML = parseFloat( parseInt( anim.currentTime ) / 1000 ).toFixed( 2 )
					},
				} )

				startTimes.forEach( ( startTime, i ) => {
					const startY = translateY[ i - 1 ] || ACTION_TOP_OFFSET
					animation.add( timeHighlightEl, {
						duration: animDuration,
						translateY: [ startY, translateY[ i ] ], // This is a pair, from and to.
					}, startTime - animDuration )
				} )

				setShowTimelineHightlight( true )

				return () => {
					// Stop animation
					try {
						animation.cancel()
					} catch ( err ) {}
				}
			}

			// previewType === 'live'
			const animation = createTimeline( {
				defaults: { ease: 'easeOutCirc' },
				autoplay: false,
				onUpdate: anim => {
					timeHighlightEl.innerHTML = parseInt( anim.currentTime ) + '%'
				},
			} )

			const timeHighlightEl = timeHighlightRef.current
			const timeElements = Array.from( timeHighlightEl.parentElement.querySelectorAll( '.interact-timeline__item:not(.interact-timeline__item--secondary), .interact-timeline__drop-gap.is-force-label' ) )

			timeElements.forEach( ( el, i ) => {
				if ( i === timeElements.length - 1 ) {
					return
				}
				const start = parseInt( el.dataset.start || el.dataset.label )
				const nextEl = timeElements[ i + 1 ]
				const end = parseInt( nextEl.dataset.start || nextEl.dataset.label )

				const parentRect = timeHighlightEl.parentElement.getBoundingClientRect()
				const startRect = el.getBoundingClientRect()
				const endRect = nextEl.getBoundingClientRect()

				const startTop = startRect.top - parentRect.top + ( startRect.height / 2 ) - ( timeHighlightEl.offsetHeight / 2 )
				const endTop = endRect.top - parentRect.top + ( endRect.height / 2 ) - ( timeHighlightEl.offsetHeight / 2 )

				animation.add( timeHighlightEl, {
					duration: end - start,
					translateY: [ startTop, endTop ], // This is a pair, from and to.
				}, start )
			} )

			const animationUpdateHandler = ev => {
				// TODO: there is a blink at the start when the animation hasn't seeked properly yet.
				const { animation: interactionAnimation } = ev.detail
				// animation.seek( parseInt( interactionAnimation.currentTime / interactionAnimation.duration * 100 ) )
				if ( typeof interactionAnimation.currentTime !== 'undefined' ) {
					const duration = animation._lastTime === animation._elapsedTime ? 1 : 120 // This is so we instantaneously move for the very first run.
					animate( animation, {
						progress: interactionAnimation.currentTime / interactionAnimation.duration,
						duration,
						ease: 'outQuad',
						composition: 'blend',
					} )
					setShowTimelineHightlight( true )
				}
			}
			window.addEventListener( `interact/timeline/animation-update/${ timelineIndex }`, animationUpdateHandler )

			return () => {
				window.removeEventListener( `interact/timeline/animation-update/${ timelineIndex }`, animationUpdateHandler )
				// Stop animation
				try {
					animation.cancel()
				} catch ( err ) {}
			}
		}
	}, [ isPreviewing, previewType, actions, timelineIndex ] )

	useEffect( () => {
		const onMouseDownOutside = ev => {
			// Unselect the timeline if clicked outside.
			if ( ! ev.target.closest( `.instance-${ instance.current }` ) ) {
				setIsTimelineFocused( false )
			}

			if ( ! highlightedActions.length ) {
				return
			}
			if ( ev.target.closest( '.interact-popover' ) ) {
				return
			}
			if ( ev.target.closest( '.interact-timeline__box' ) && ev.target.closest( `.instance-${ instance.current }` ) ) {
				return
			}
			setHighlightedActions( [] )
		}
		document.addEventListener( 'mousedown', onMouseDownOutside )
		return () => document.removeEventListener( 'mousedown', onMouseDownOutside )
	}, [ highlightedActions ] )

	// Change the focus even when navigating with the keyboard and things are changing focus.
	useEffect( () => {
		if ( isTimelineFocused ) {
			window?.dispatchEvent( new window.CustomEvent( 'interact/timeline-focused', { detail: { instance: instance.current } } ) )
		}

		const timelineFocused = ev => {
			if ( ev.detail.instance !== instance.current ) {
				setIsTimelineFocused( false )
			}
		}

		window?.addEventListener( 'interact/timeline-focused', timelineFocused )
		return () => window?.removeEventListener( 'interact/timeline-focused', timelineFocused )
	}, [ isTimelineFocused ] )

	// Add the initial state styles of the actions.
	const [ runnerRef, initialStyles ] = useTimelineRunnerRef( interaction, actions, timelineIndex )
	useInitialStyleTag( initialStyles )

	// If the preview is stopped, reset the preview.
	useEffect( () => {
		const reset = () => {
			setShowTimelineHightlight( false )
			runnerRef.current?.stopPreview( timelineIndex )
		}
		if ( ! isPreviewing ) {
			reset()
		}
		return () => {
			if ( isPreviewing ) {
				reset()
			}
		}
	}, [ isPreviewing, runnerRef, timelineIndex ] )

	// Preview the actions when the selected action changes.
	useEffect( () => {
		if ( selectedAction ) {
			runnerRef.current?.editPreview( selectedAction, timelineIndex )
		} else {
			runnerRef.current?.stopPreview( timelineIndex )
		}
	}, [ selectedAction, actions, runnerRef, timelineIndex ] )

	// If a timeline setting has changed, restart the preview if it's on.
	useEffect( () => {
		const restartPreview = () => {
			if ( isPreviewing ) {
				runnerRef.current?.stopPreview( timelineIndex )
				setTimeout( () => runnerRef.current?.playPreview( timelineIndex ) )
			}
		}

		window?.addEventListener( 'interact/timeline-restart-preview', restartPreview )
		return () => window?.removeEventListener( 'interact/timeline-restart-preview', restartPreview )
	}, [ isPreviewing, runnerRef, timelineIndex ] )

	// TODO: If percentage, then there should be a "warning" icon if: 1) the actionItem is the only one with this type, and 2) the actionItem's target doesn't have another action with the identical target (same type as well)
	// TODO: regardless of type, display "warning" icon if target is block/class/selector and no value is filled.
	// This creates the actionItem component for the timeline.
	const actionItem = props => {
		const {
			action,
			index,
			interactionType,
			isSecondary,
			stepProvidedValues,
			warningMessage = '',
		} = props
		return <ActionItem
			key={ action.key }
			type={ type }
			action={ action }
			hasTrigger={ interactionType !== 'page' }
			isSelected={ selectedAction === action.key }
			isHighlighted={ highlightedActions.includes( action.key ) }
			isSecondary={ isSecondary }
			warningMessage={ warningMessage }
			stepProvidedValues={ stepProvidedValues }
			onDrag={ setDraggedAction }
			onSelect={ () => {
				setSelectedAction( action.key )
				setArrowHighlightIndex( -1 )
				setIsPreviewing( false )
				setHighlightedActions( [ action.key ] )
			} }
			onDeselect={ () => {
				setSelectedAction( null )
				setArrowHighlightIndex( -1 )
				if ( ! isShiftKey && ! isControlKey ) {
					// setHighlightedActions( [] )
				}
			} }
			onDelete={ () => {
				// Remove the action in index and update the actions.
				const newActions = [ ...actions ]
				newActions.splice( index, 1 )
				setSelectedAction( null )
				setIsPreviewing( false )
				onChange( newActions )
			} }
			onChange={ newAction => {
				const newActions = [ ...actions ]
				newActions[ index ] = newAction
				setIsPreviewing( false )

				// If the action is a starting state, and we're not at the start, move it to the start.
				const moveToStart = index !== 0 && ! actions[ index - 1 ]?.timing.isStartingState && newAction.timing.isStartingState
				if ( moveToStart ) {
					newActions.splice( index, 1 )
					newActions.unshift( newAction )
				}

				onChange( newActions )
			} }
			onStartTimeFocus={ () => setIsPreviewing( false ) }
			onStartTimeChange={ newStart => {
				// If changing the start of a grouped action, we
				// should change the start of all the actions in
				// the group.
				const newActions = [ ...actions ]
				const oldStartTime = actions[ index ].timing.start
				const isStartOfGroup = index === 0 || actions[ index ].timing.start !== actions[ index - 1 ].timing.start
				newActions[ index ].timing.start = newStart

				// Adjust the start of all the actions that have
				// the same start time.
				if ( isStartOfGroup ) {
					for ( let i = index + 1; i < actions.length; i++ ) {
						if ( newActions[ i ].timing.start === oldStartTime ) {
							newActions[ i ].timing.start = newStart
						} else {
							break
						}
					}
				}

				setIsPreviewing( false )
				onChange( newActions )
			} }
			onDrop={ ( actionKey, dropLocation ) => {
				const newActions = [ ...actions ]
				const newStartTime = actions[ index ].timing.start

				// Look for actionKey, and set the new start time.
				const actionIndex = newActions.findIndex( action => action.key === actionKey )

				// If the action cannot have a starting state, then do not do
				// anything if dragged to be a starting state.
				const actionConfig = actionsConfig[ newActions[ actionIndex ].type ]
				if ( ! actionConfig.hasStartingState && newStartTime < 0 ) {
					return
				}

				if ( actionIndex !== -1 ) {
					newActions[ actionIndex ].timing.start = newStartTime
				}

				// If the new start time is less than 0, then the user dragged it to be a starting state.
				if ( newStartTime < 0 ) {
					newActions[ actionIndex ].timing.isStartingState = true
				} else {
					newActions[ actionIndex ].timing.isStartingState = false
				}
				// The dropLocation is either 'top' or
				// 'bottom'.  If top, move the action before
				// the current index. If bottom, move the
				// action after the current action. Take
				// into account that the current index might
				// change after the action is moved.

				// Remove the action first
				const actionToMove = newActions.splice( actionIndex, 1 )[ 0 ]

				// Get the index of this current action based on action.key
				const newIndex = newActions.findIndex( ( { key } ) => key === action.key )

				if ( dropLocation === 'top' ) {
					newActions.splice( newIndex, 0, actionToMove )
				} else {
					newActions.splice( newIndex + 1, 0, actionToMove )
				}

				// setSelectedAction( actionKey )
				onChange( newActions )
			} }
			onMouseDown={ () => {
				// Selecting actions for copy/paste.
				if ( isControlKey ) {
					setHighlightedActions( actionKeys => {
						if ( ! actionKeys.includes( action.key ) ) {
							return [ ...actionKeys, action.key ]
						}
						return actionKeys.filter( key => key !== action.key )
					} )
				} else if ( isShiftKey ) {
					if ( ! highlightedActions.length ) {
						return setHighlightedActions( [ action.key ] )
					}
					const newHighlightedActions = []
					const startIndex = actions.findIndex( ( { key } ) => key === highlightedActions[ 0 ] )
					const endIndex = actions.findIndex( ( { key } ) => key === action.key )
					const increment = startIndex < endIndex ? 1 : -1
					for ( let i = startIndex; i !== endIndex + increment; i += increment ) {
						newHighlightedActions.push( actions[ i ].key )
					}
					setHighlightedActions( newHighlightedActions )
				}
			} }
			onKeyDown={ ev => {
				// Navigating up and down the different actions in the timeline with the arrow keys.
				if ( ! isShiftKey ) {
					if ( ev.key === 'ArrowUp' || ev.key === 'ArrowDown' ) {
						ev.preventDefault()
						const el = ev.target.closest( '.interact-timeline__item' )
						if ( ev.key === 'ArrowUp' ) {
							if ( el?.previousElementSibling && el.previousElementSibling.classList.contains( 'interact-timeline__item' ) ) {
								el.previousElementSibling.querySelector( '.interact-timeline__box' ).focus()
							} else if ( el?.previousElementSibling.previousElementSibling && el.previousElementSibling.previousElementSibling.classList.contains( 'interact-timeline__item' ) ) {
								el.previousElementSibling.previousElementSibling.querySelector( '.interact-timeline__box' ).focus()
							} else {
								timelineWrapperRef.current.querySelector( '.interact-timeline__box' )?.focus()
							}
						} else if ( ev.key === 'ArrowDown' ) {
							if ( el?.nextElementSibling && el.nextElementSibling.classList.contains( 'interact-timeline__item' ) ) {
								el.nextElementSibling.querySelector( '.interact-timeline__box' ).focus()
							} else if ( el?.nextElementSibling.nextElementSibling && el.nextElementSibling.nextElementSibling.classList.contains( 'interact-timeline__item' ) ) {
								el.nextElementSibling.nextElementSibling.querySelector( '.interact-timeline__box' ).focus()
							} else {
								last( timelineWrapperRef.current.querySelectorAll( '.interact-timeline__box' ) )?.focus()
							}
						}
					}
					return
				}

				if ( isShiftKey && highlightedActions.length ) {
					ev.preventDefault()
					setIsTimelineFocused( true )
					// If up/down arrow, select the next/prev action.
					if ( ev.key === 'ArrowUp' || ev.key === 'ArrowDown' ) {
						const highlightedKey = highlightedActions[ 0 ]
						let currentIndex = actions.findIndex( ( { key } ) => key === highlightedKey )
						if ( arrowHighlightIndex !== -1 ) {
							currentIndex = arrowHighlightIndex
						}
						if ( ev.key === 'ArrowUp' ) {
							currentIndex = currentIndex > 0 ? currentIndex - 1 : 0
						} else {
							currentIndex = currentIndex < actions.length - 1 ? currentIndex + 1 : actions.length - 1
						}
						setArrowHighlightIndex( currentIndex )
						const startIndex = currentIndex < index ? currentIndex : index
						const endIndex = currentIndex > index ? currentIndex : index
						const newHighlightedActions = []
						for ( let i = startIndex; i <= endIndex; i++ ) {
							newHighlightedActions.push( actions[ i ].key )
						}
						setHighlightedActions( newHighlightedActions )
					}
				}
			} }
			onFocus={ () => {
				// setSelectedAction( null )
				setArrowHighlightIndex( -1 )
				setIsPreviewing( false )
				setHighlightedActions( [ action.key ] )
				setIsTimelineFocused( true )
			} }
		/>
	}

	const interactionType = interactionsConfig[ interaction.type ]?.type === 'page' ? 'page' : 'element'

	// Place all values that are provided by previous steps, here. We will pass
	// them to each actionItem.
	const stepProvidedValues = []

	// TODO: What if we're dragging an action and the timeline is a percentage timeline.
	return (
		<BaseControl
			className="interact-list-control"
			label={ __( 'Action Timeline', 'interactions' ) }
			help={ /Mac|iPod|iPhone|iPad/i.test( window.navigator?.platform || '' )
				? __( 'Command+C to copy, Command+V to paste. Shift+click for multiple selections.', 'interactions' )
				: __( 'Ctrl+C to copy, Ctrl+V to paste. Shift+click for multiple selections.', 'interactions' )
			}
		>
			<div className="interact-timeline-side-buttons">
				<Button
					label={ __( 'Import and Export Timeline', 'interactions' ) }
					icon={ upload }
					onClick={ () => {
						onOpenImportExportModal( {
							title: __( 'Import or Export Timeline', 'interactions' ),
							description: ( <>
								<p>{ __( 'To export, simply copy the timeline JSON shown below and save it for later use or sharing.', 'interactions' ) }</p>
								<p>{ __( 'To import, paste a valid interaction or timeline JSON into the field and click “Import timeline” to load it into your current interaction.', 'interactions' ) }</p>
								<p>{ createInterpolateElement(
									__( 'Need help? <a>Visit our documentation</a> to see examples of interactions you can import.', 'interactions' ),
									// eslint-disable-next-line jsx-a11y/anchor-has-content
									{ a: <a href="https://docs.wpinteractions.com/collection/656-interaction-examples" target="_blank" rel="noopener noreferrer" /> }
								) }</p>
							</> ),
							mode: 'timeline',
							interaction,
							timelineIndex,
							importLabel: __( 'Import timeline', 'interactions' ),
							hasExport: true,
							onImport: ( timelineIndex, timeline ) => {
								// Create new actions based on import to regenerate action key
								// and fill missing properties with defaults.
								const actionsToImport = timeline.actions || []
								const newActions = actionsToImport.map( action => (
									createNewAction( {
										actionType: action.type ?? '',
										start: action.timing?.start ?? 0,
										targetType: action.target?.type ?? ( interactionType === 'element' ? 'trigger' : 'block' ),
										props: { ...action },
									} )
								) )

								onImportTimeline( timelineIndex, { ...timeline, actions: newActions } )
							},
						} )
					} }
				/>

				<AddActionButton
					type={ type }
					onClick={ () => {
						lastSelectedAction.current = last( highlightedActions )
						setIsPreviewing( false )
					} }
					onAddAction={ actionType => {
						let startTime = 50

						if ( type === 'time' ) {
							startTime = 0
							if ( lastSelectedAction.current ) {
								startTime = actions.find( ( { key } ) => key === lastSelectedAction.current )?.timing.start || 0
							}

							if ( ! startTime ) {
								startTime = actions.reduce( ( max, { timing } ) => {
								// Make sure this is a 2 decimal number, not a string
									const startingTime = parseFloat( timing.start )
									if ( startingTime > max ) {
										return startingTime
									}
									return max
								}, 0 ) + 0.5
							}
						} else { // type === 'percentage'
							startTime = 50
							if ( lastSelectedAction.current ) {
								startTime = actions.find( ( { key } ) => key === lastSelectedAction.current )?.timing.start || 0
							}

							// If there are no actions of the same type, we need to add it at 0%
							// If there is an action of the same type, add it at 50%
							const numSameType = actions.reduce( ( numFound, action ) => {
								return numFound + ( action.type === actionType ? 1 : 0 )
							}, 0 )
							if ( ! numSameType ) {
								startTime = 0
							} else if ( numSameType === 1 ) {
								startTime = 50
							}
						}

						const newAction = createNewAction( {
							actionType,
							start: ! actions.length ? 0 : startTime,
							targetType: interactionType === 'element' ? 'trigger' : 'block',
						} )

						const newActions = [ ...actions, newAction ]

						onChange( newActions )
						setSelectedAction( newAction.key )
					} }
				/>
			</div>
			<div
				className={ classNames(
					'interact-timeline',
					`interact-timeline--${ type }`,
					`instance-${ instance.current }`,
					{ 'is--empty': ! actions.length }
				) }
				onMouseDown={ () => {
					setIsTimelineFocused( true )
				} }
				role="button"
				tabIndex={ 0 }
				ref={ timelineWrapperRef }
			>
				{ isPreviewing && (
					<div
						className="interact-timeline-time-highlight"
						ref={ timeHighlightRef }
						style={ {
							// We need to show it after a delay because it jumps
							// since the animation hasn't initiliazed yet.
							visibility: showTimelineHightlight ? '' : 'hidden',
						} }
					>{ type === 'time' ? '0.00' : '0%' }</div>
				) }

				{ /*
				// For percentage timelines, each percentage 0-100 is either
				// displayed as a gap or an action. This is so that the user can
				// drop an action on any percentage.
				*/ }
				{ type === 'percentage' && !! actions.length && range( -1, 101 ).reduce( ( elements, time ) => {
					// If no starting state, no gap before starting state either
					if ( time === -1 && ! actions[ 0 ]?.timing.isStartingState ) {
						return elements
					}

					// If there's no action at 0%, then show the "0%" label.
					let hasNoStartAction = false
					if ( time === 0 ) {
						const foundAction = actions.find( action => action.timing.start === 0 )
						if ( ! foundAction ) {
							hasNoStartAction = true
						}
					}

					if ( time <= 0 ) {
						elements.push( <ActionDropGap
							forceLabel={ hasNoStartAction }
							key={ `gap-${ time }` }
							time={ time }
							label={ time < 0 ? '«' : `${ time }%` }
							onDrop={ actionKey => {
								const newActions = [ ...actions ]
								const actionIndex = newActions.findIndex( action => action.key === actionKey )

								// Set the new start time of the action
								newActions[ actionIndex ].timing.start = time
								newActions[ actionIndex ].timing.isStartingState = false

								let index = 0
								if ( time === -1 && newActions[ 0 ].timing.isStartingState ) {
									newActions[ actionIndex ].timing.start = -1
									newActions[ actionIndex ].timing.isStartingState = true
								}

								// If we're at 0% time, we need to move the action to the top but before all the starting states.
								if ( time === 0 ) {
									actions.some( action => {
										if ( action.timing.isStartingState ) {
											index++
											return false
										}
										return true
									} )
								}

								// Move the action to the new place
								newActions.splice( index, 0, newActions.splice( actionIndex, 1 )[ 0 ] )

								onChange( newActions )
							} }
						/> )
					}

					// Create the action item if there are one or more actions at this time.
					let foundAction = false
					let isSecondary = false
					actions.forEach( ( action, index ) => {
						let doAction = false
						if ( time === -1 && action.timing.isStartingState ) {
							doAction = true
						} else if ( time >= 0 && action.timing.start === time ) {
							doAction = true
						}

						if ( doAction ) {
							foundAction = true
							elements.push( actionItem( {
								action,
								index,
								interactionType,
								isSecondary,
								stepProvidedValues: cloneDeep( stepProvidedValues ),
								warningMessage: getTimelineWarnings( action, index, actions, type, interactionType ),
							} ) )
							isSecondary = true
						}

						// Keep track of all the values that can be referenced by future actions.
						const actionType = actions[ index ].type
						const { provides } = ( actionType ? actionsConfig[ actionType ] : null ) || []
						provides?.forEach( id => {
							const providedId = actions[ index ]?.value[ id ]
							if ( providedId ) {
								stepProvidedValues.push( providedId )
							}
						} )
					} )

					// If there's no action, we need to create a gap.
					if ( time > 0 && time < 100 && ! foundAction ) {
						elements.push( <ActionDropGap
							key={ `gap-${ time }` }
							label={ `${ time }%` }
							onDrop={ actionKey => {
								const newActions = [ ...actions ]
								const actionIndex = newActions.findIndex( action => action.key === actionKey )

								// Set the new start time of the action
								newActions[ actionIndex ].timing.start = time
								newActions[ actionIndex ].timing.isStartingState = false

								// We need to look for the index of the action right before this time.
								let index = 0
								actions.some( action => {
									if ( action.timing.start < time ) {
										index++
										return false
									}
									return true
								} )

								// Move the action to the new place
								newActions.splice( index, 0, newActions.splice( actionIndex, 1 )[ 0 ] )

								onChange( newActions )
							} }
						/> )
					}

					return elements
				}, [] ) }

				{ /*
				// For time timelines, each action is displayed with a gap
				// between them so actions are can be dropped between any two
				// actions.
				   */ }
				{ type === 'time' && actions.map( ( action, index ) => {
					const prevStart = actions[ index - 1 ]?.timing.start
					const isSecondary = prevStart === action.timing?.start

					const ret = (
						<Fragment key={ action.key || index }>
							{ ! isSecondary && (
								<ActionDropGap
									label={ ( () => {
										// Hide the label when dragging an action to just an adjacent gap.
										if ( draggedAction ) {
											if ( draggedAction?.key === action.key ) {
												return ''
											} else if ( actions[ index - 1 ]?.key === draggedAction?.key ) {
												return ''
											}
										}

										let newStartTime = 0
										if ( index > 0 ) {
											const currentStartTime = parseFloat( actions[ index ].timing.start )
											newStartTime = parseFloat( actions[ index - 1 ].timing.start )
											if ( newStartTime + 0.5 < currentStartTime ) {
												newStartTime += 0.5
											} else {
												newStartTime = newStartTime + ( ( currentStartTime - newStartTime ) / 2 )
											}
											if ( newStartTime < 0 ) {
												newStartTime = 0
											}
										}

										// If being dragged as a starting state,
										// show the starting state label.
										if ( index === 0 ) {
											if ( actions[ 0 ].timing.isStartingState ) {
												return '«'
											}
										}

										return newStartTime.toFixed( 2 )
									} )() }
									onDrop={ actionKey => {
										const newActions = [ ...actions ]
										const actionIndex = newActions.findIndex( action => action.key === actionKey )

										// If the action doesn't support
										// starting state, do not do anything if
										// dragged to be as a starting state.
										const actionConfig = actionsConfig[ newActions[ actionIndex ].type ]
										if ( ! actionConfig.hasStartingState && index === 0 ) {
											return
										}

										// Check if the previous action has the same time
										const isConnectedAction = actions[ actionIndex - 1 ]?.timing.start === actions[ actionIndex ].timing.start || actions[ actionIndex + 1 ]?.timing.start === actions[ actionIndex ].timing.start
										// If you've moving an action just before or after it, do not do anything.
										if ( ! isConnectedAction ) {
											if ( actionKey === action.key || actionKey === actions[ index - 1 ]?.key ) {
												return
											}
										}

										// TODO: after a drop, highlight the moved item because it's hard to see where it went.
										// Note: this drop is before the current
										// action. So the time should be the
										// start time of the previous action +
										// 0.5s
										let newStartTime = 0
										if ( index > 0 ) {
											const currentStartTime = parseFloat( actions[ index ].timing.start )
											newStartTime = parseFloat( actions[ index - 1 ].timing.start )
											if ( newStartTime + 0.5 < currentStartTime ) {
												newStartTime += 0.5
											} else {
												newStartTime = newStartTime + ( ( currentStartTime - newStartTime ) / 2 )
											}
											if ( newStartTime < 0 ) {
												newStartTime = 0
											}
										}

										// Set the new start time of the action
										newActions[ actionIndex ].timing.start = newStartTime
										newActions[ actionIndex ].timing.isStartingState = false

										if ( index === 0 && newActions[ index ].timing.isStartingState ) {
											newActions[ actionIndex ].timing.start = -1
											newActions[ actionIndex ].timing.isStartingState = true
										}

										// Move the action to the new place
										newActions.splice( index, 0, newActions.splice( actionIndex, 1 )[ 0 ] )

										onChange( newActions )
									} }
								/>
							) }
							{ actionItem( {
								action,
								index,
								interactionType,
								isSecondary,
								stepProvidedValues: cloneDeep( stepProvidedValues ),
								warningMessage: getTimelineWarnings( action, index, actions, type, interactionType ),
							} ) }
						</Fragment>
					)

					// Keep track of all the values that can be referenced by future actions.
					const actionType = actions[ index ].type
					const { provides } = ( actionType ? actionsConfig[ actionType ] : null ) || []
					provides?.forEach( id => {
						const providedId = actions[ index ]?.value[ id ]
						if ( providedId ) {
							stepProvidedValues.push( providedId )
						}
					} )

					return ret
				} ) }
				{ !! actions.length && (
					<ActionDropGap
						isTall
						forceLabel={ ( () => {
							if ( type === 'time' ) {
								return false
							}
							// For percentage, if there's no action in the end, show the "100%" label.
							return ! actions.find( action => action.timing.start === 100 )
						} )() }
						label={ ( () => {
							if ( type === 'percentage' ) {
								return '100%'
							}

							// If dragging an action, we need to hide the label if we're just dragging the last action to the end.
							if ( type === 'time' && last( actions )?.key === draggedAction?.key ) {
								return ''
							}

							return ( parseFloat( actions[ actions.length - 1 ].timing.start ) + 0.5 ).toFixed( 2 )
						} )() }
						onDrop={ actionKey => {
							// Get the last time
							const newActions = [ ...actions ]
							const lastStartTime = parseFloat( actions[ actions.length - 1 ].timing.start )

							const actionIndex = newActions.findIndex( action => action.key === actionKey )

							// Check if the previous action has the same time
							const isConnectedAction = actions[ actionIndex - 1 ]?.timing.start === actions[ actionIndex ].timing.start || actions[ actionIndex + 1 ]?.timing.start === actions[ actionIndex ].timing.start

							// If we're moving the last index to the end, do not do anything, unless it's connected.
							if ( ! isConnectedAction && actionIndex === actions.length - 1 ) {
								if ( type !== 'percentage' ) { // This is okay for percentages.
									return
								}
							}

							if ( type === 'time' ) {
								newActions[ actionIndex ].timing.start = lastStartTime + 0.5
								newActions[ actionIndex ].timing.isStartingState = false
							} else { // type === 'percentage'
								newActions[ actionIndex ].timing.start = 100
								newActions[ actionIndex ].timing.isStartingState = false
							}

							// Move the action to the end
							newActions.push( newActions.splice( actionIndex, 1 )[ 0 ] )

							onChange( newActions )
						} }
					/>
				) }
				{ ! actions.length && (
					<div className="interact-list-control__empty-description">
						<TimelineSVG width="32" height="32" />
						<p>{ __( 'Add an action by clicking on the + above to start building your timeline sequence.', 'interactions' ) }</p>
					</div>
				) }
			</div>
			{ previewType === 'button' && (
				<>
					{ ! isPreviewing && (
						<Button
							label={ __( 'Preview Timeline', 'interactions' ) }
							icon="controls-play"
							onClick={ () => {
								runnerRef.current.playPreview( timelineIndex )
								setIsPreviewing( true )
							} }
							disabled={ ! actions.length }
						>
							{ __( 'Preview', 'interactions' ) }
						</Button>
					) }
					{ isPreviewing && (
						<Button
							label={ __( 'Stop Preview', 'interactions' ) }
							icon="controls-pause"
							onClick={ () => setIsPreviewing( false ) }
							isBusy
							disabled={ ! actions.length }
						>
							{ __( 'Stop Preview', 'interactions' ) }
						</Button>
					) }
				</>
			) }
			{ previewType === 'live' && (
				<ToggleControl
					label={ __( 'Live Preview', 'interactions' ) }
					icon="controls-play"
					checked={ isPreviewing }
					onChange={ () => {
						setIsPreviewing( value => {
							if ( ! value ) {
								runnerRef.current.playPreview( timelineIndex )
							}
							return ! value
						} )
					} }
				>
					{ __( 'Live Preview', 'interactions' ) }
				</ToggleControl>
			) }
		</BaseControl>
	)
}

export default Timeline

const ActionDropGap = props => {
	const {
		isTall = false,
		onDrop = NOOP,
		label = '',
		forceLabel = false,
	} = props

	const [ isHighlighted, setIsHighlighted ] = useState( false )

	const onDragOverHandler = () => {
		setIsHighlighted( true )
	}
	const onDragLeaveHandler = () => {
		setIsHighlighted( false )
	}
	const onDragDropHandler = ev => {
		const actionKeyDrop = ev.dataTransfer.getData( 'text/plain' )
		onDrop( actionKeyDrop )
		setIsHighlighted( false )
	}

	return (
		<div
			className={ classNames(
				'interact-timeline__drop-gap',
				{
					'interact-timeline__box--highlight': isHighlighted,
					'is-tall': isTall,
					'is-force-label': forceLabel,
					[ `time-${ isNaN( parseInt( label ) ) ? 'initial' : parseInt( label ) }` ]: label,
				}
			) }
			onDragOver={ onDragOverHandler }
			onDragLeave={ onDragLeaveHandler }
			onDrop={ onDragDropHandler }
			data-label={ label }
		/>
	)
}

const CHANGE_ACTION_PROPS = {
	size: 'small',
	icon: 'update-alt',
	variant: 'tertiary',
	label: __( 'Change Action', 'interactions' ),
}

const ActionItem = props => {
	const {
		action = {},
		type = 'time', // time, percentage
		isSecondary = false,
		isSelected = false,
		isHighlighted = false, // Highlighted is for when we are picking the action for copy/paste.
		hasTrigger = true,
		warningMessage: _warningMessage = null,
		onSelect = NOOP,
		onDeselect = NOOP,
		onDelete = NOOP,
		onChange = NOOP,
		onStartTimeFocus = NOOP,
		onStartTimeChange = NOOP,
		onDrop = NOOP,
		onMouseDown = NOOP,
		onKeyDown = NOOP,
		onFocus = NOOP,
		onDrag = NOOP,
		stepProvidedValues = EMPTYARR,
	} = props

	const classnames = classNames( 'interact-timeline__item', {
		'interact-timeline__item--secondary': isSecondary,
		'interact-timeline__item--selected': isSelected || isHighlighted,
		'interact-timeline__item--is-initial': action.timing.isStartingState,
	} )

	const actionConfig = actionsConfig[ action.type ]
	const hasTarget = typeof actionConfig?.hasTarget === 'undefined' ? true : actionConfig.hasTarget
	const hasStartingState = typeof actionConfig?.hasStartingState === 'undefined' ? true : actionConfig.hasStartingState
	const hasDuration = typeof actionConfig?.hasDuration === 'undefined' ? true : actionConfig.hasDuration
	const hasEasing = typeof actionConfig?.hasEasing === 'undefined' ? true : actionConfig.hasEasing
	const isRequiredTarget = typeof actionConfig?.isRequiredTarget === 'undefined' ? true : actionConfig.isRequiredTarget

	let hasStagger = typeof actionConfig?.hasStagger === 'undefined' ? true : actionConfig.hasStagger
	// Check if the action configuration says that this is action performs an animation.
	// This property is set by the class-action in the initActionAnimation function
	if ( ! actionConfig?.isAnimation ) {
		hasStagger = false
	}

	const [ popoverRef, setPopoverRef ] = useState()
	const dragItemRef = useRef()
	const closeButtonRef = useRef()
	const [ highlightLocation, setHighlightLocation ] = useState( null )
	const [ isDragging, setIsDragging ] = useState( false )
	const [ isSelectingBlock, setIsSelectingBlock ] = useState( false )

	const isControlKey = useWithControl()
	const isShiftKey = useWithShift()

	const onDragStartHandler = ev => {
		ev.dataTransfer.setDragImage( dragItemRef.current, 0, 0 )
		ev.dataTransfer.setData( 'text/plain', action.key )
		onDeselect()
		onDrag( action )
		setIsDragging( true )
	}

	const onDragEndHandler = () => {
		onDrag( false )
		setIsDragging( false )
	}

	const onDragOverHandler = ev => {
		const rect = dragItemRef.current.getBoundingClientRect()
		if ( ev.clientY < rect.top + ( rect.height / 2 ) ) {
			setHighlightLocation( 'top' )
		} else {
			setHighlightLocation( 'bottom' )
		}
	}

	const onDragLeaveHandler = () => {
		setHighlightLocation( null )
	}

	const onDragDropHandler = ev => {
		const actionKeyDrop = ev.dataTransfer.getData( 'text/plain' )
		onDrop( actionKeyDrop, highlightLocation )
		setHighlightLocation( null )
	}

	useEffect( () => {
		return () => {
			if ( action.target.type === 'block' && action.target.value !== '' ) {
				window?.dispatchEvent( new window.CustomEvent( 'interact/highlight-block', { detail: { anchor: null } } ) )
			}
		}
	}, [ action.target.type, action.target.value ] )

	useEffect( () => {
		setIsSelectingBlock( null )
	}, [ isSelected ] )

	// When the popover is open, focus on the close button. Do this manually
	// because the popover focusOnMount moves the scrollbar.
	useEffect( () => {
		if ( isSelected ) {
			setTimeout( () => closeButtonRef.current?.focus( { preventScroll: true } ) )
		}
	}, [ isSelected ] )

	const startTime = type === 'time' ? parseFloat( action.timing.start ).toFixed( 2 ) : parseInt( action.timing.start )

	// The label name is either the shortName, name, or the value of the dynamicName.
	const labelNameNotAvailable = ! actionConfig?.shortName && ! actionConfig?.name
	let labelName = actionConfig?.shortName || actionConfig?.name || action.type || __( 'Unknown', 'interactions' )
	const dynamicName = actionConfig?.dynamicName
	if ( dynamicName ) {
		const propertyValues = { ...action.value }

		// Fix the values so that if it's an option, we get the corresponding label.
		Object.keys( propertyValues ).forEach( key => {
			const value = propertyValues[ key ]
			const property = actionConfig?.properties[ key ]
			if ( property?.type === 'select' ) {
				propertyValues[ key ] = property.options[ 0 ]?.label || value
				property.options.some( option => {
					if ( option.value === value ) {
						propertyValues[ key ] = option.label
						return true
					}
					return false
				} )
			}
		} )

		const dynamicLabelName = formDynamicName( dynamicName, propertyValues )

		// If blank, then it means there's a value that's not filled up yet,
		// then fallback to original name.
		if ( dynamicLabelName ) {
			labelName = dynamicLabelName
		}
	}

	// Check if the action has any issues.
	const warningMessage = getActionWarning( action, {
		hasTrigger, hasTarget, isRequiredTarget,
	} ) || _warningMessage

	const matchingLabel = action.target.type === 'selector'
		? __( 'elements', 'interactions' )
		: __( 'blocks', 'interactions' )
	const matchingLabelSingular = action.target.type === 'selector'
		? __( 'element', 'interactions' )
		: __( 'block', 'interactions' )

	return (
		<div
			className={ classnames }
			data-start={ action.timing.start }
		>
			<NumberControl
				className={ classNames( 'interact-timeline__time-input', { 'is--starting-state': action.timing.isStartingState } ) }
				spinControls="none"
				size="small"
				isDragEnabled={ false }
				type={ action.timing.isStartingState ? 'text' : 'number' }
				value={ action.timing.isStartingState ? '«' : startTime }
				onFocus={ () => onStartTimeFocus() }
				onChange={ value => {
					const newValue = type === 'time' ? parseFloat( parseFloat( value ).toFixed( 2 ) ) : parseInt( value )

					// Ensure values are within range.
					if ( type === 'percentage' && ( newValue < 0 || newValue > 100 ) ) {
						return
					}
					if ( type === 'time' && newValue < 0 ) {
						return
					}

					// If changing the time of a starting state, we should toggle it off.
					if ( action.timing.isStartingState ) {
						if ( ! isNaN( newValue ) || value === '' ) {
							const newAction = { ...action }
							newAction.timing.start = value === '' ? 0 : newValue
							newAction.timing.isStartingState = false
							onChange( newAction )
							return
						}
					}

					onStartTimeChange( newValue || 0 )
				} }
				suffix={ type === 'time' ? '' : '%' }
			/>
			<div className="interact-timeline__dot"></div>
			<div
				className={ classNames(
					'interact-timeline__box',
					{
						[ `interact-timeline__box--${ highlightLocation }` ]: highlightLocation,
						'interact-timeline__box--dragging': isDragging,
						'interact-timeline__box--has-warning': warningMessage,
					}
				) }
				onMouseDown={ ev => {
					onMouseDown( ev )

					// Only do this if we're selecting the action to edit.
					if ( isControlKey || isShiftKey ) {
						return
					}

					if ( ev.target.closest( '.interact-timeline__item' ) ) {
						if ( isSelected ) {
							onDeselect()
						} else {
							onSelect()
						}
					}
				} }
				onKeyDown={ ev => {
					onKeyDown( ev )

					// Only do this if we're selecting the action to edit.
					if ( isControlKey || isShiftKey ) {
						return
					}

					if ( ev.target.closest( '.interact-timeline__item' ) ) {
						if ( ev.key === 'Enter' || ev.key === ' ' ) {
							if ( isSelected ) {
								onDeselect()
							} else {
								onSelect()
							}
							ev.preventDefault()
						}
					}
				} }
				role="button"
				tabIndex="0"
				draggable="true"
				onDragStart={ onDragStartHandler }
				onDragEnd={ onDragEndHandler }
				onDragOver={ onDragOverHandler }
				onDragLeave={ onDragLeaveHandler }
				onDrop={ onDragDropHandler }
				ref={ dragItemRef }
				// TODO: when hovering over this and we are a block, we should show a highlight over the block.
				onMouseEnter={ () => {
					if ( action.target.type === 'block' && action.target.value !== '' ) {
						setTimeout( () => {
							dispatch( 'core/block-editor' ).clearSelectedBlock()
							window?.dispatchEvent( new window.CustomEvent( 'interact/highlight-block', { detail: { anchor: action.target.value } } ) )
						} )
					}
				} }
				onMouseLeave={ () => {
					if ( action.target.type === 'block' && action.target.value !== '' ) {
						setTimeout( () => {
							window?.dispatchEvent( new window.CustomEvent( 'interact/highlight-block', { detail: { anchor: null } } ) )
						} )
					}
				} }
				onFocus={ ev => {
					if ( ! isControlKey && ! isShiftKey ) {
						onFocus( ev )
					}
				} }
			>
				{ warningMessage && <Tooltip delay={ 0 } text={ warningMessage.message }><Dashicon icon="warning" /></Tooltip> }
				{
					hasTarget ? (
						<span className="interact-timeline__target">
							{ action.target.type === 'trigger' ? __( 'Block', 'interactions' )
								: action.target.type === 'window' ? __( 'Window', 'interactions' )
									: action.target.type === 'block-name' ? action.target.value
										: ( action.target.blockName || action.target.value )
							}
						</span>
					) : <div />
				}

				<span
					className={ classNames( [
						'interact-timeline__type',
						{ 'interact-timeline__type--unknown': labelNameNotAvailable },
					] ) }
					title={ labelNameNotAvailable ? __( 'Unknown Action Type', 'interactions' ) : undefined }
				>{ labelName }</span>
			</div>

			{ ! actionConfig && isSelected && (
				// Warn that the action configuration is not present.
				<Popover
					placement="left"
					offset={ 8 }
					noArrow={ isSelectingBlock ? undefined : false }
					className="interact-popover interact-action-popover"
					onClose={ isSelectingBlock ? NOOP : onDeselect }
					ref={ setPopoverRef }
					focusOnMount={ false }
					resize={ false }
					shift={ true }
				>
					<PanelBody>
						<FlexLayout alignItems="start">
							<Dashicon icon="warning" />
							<div>
								<h4 style={ { marginTop: 0 } }>
									{ __( 'Action configuration not found.', 'interactions' ) }
								</h4>
								<p style={ { marginBottom: 0 } }>{ __( 'What happened? Either the interaction contains invalid configuration, or this action is not available in your plan, or it has been removed from the plugin.', 'interactions' ) }</p>
							</div>
						</FlexLayout>
						<FlexLayout>
							<Button
								variant="tertiary"
								isDestructive
								icon="trash"
								label={ __( 'Remove action', 'interactions' ) }
								style={ { marginLeft: 'auto' } }
								onClick={ onDelete }
							/>
						</FlexLayout>
					</PanelBody>
				</Popover>
			) }

			{ !! actionConfig && isSelected && (
				<Popover
					placement="left"
					offset={ 8 }
					noArrow={ isSelectingBlock ? undefined : false }
					className="interact-popover interact-action-popover"
					onClose={ isSelectingBlock ? NOOP : onDeselect }
					ref={ setPopoverRef }
					focusOnMount={ false }
					resize={ false }
					shift={ true }
				>
					<div
						style={ {
							// We hide the content when we are selecting a block.
							width: isSelectingBlock ? 0 : undefined,
							height: isSelectingBlock ? 0 : undefined,
							overflow: isSelectingBlock ? 'hidden' : undefined,
						} }
					>
						<PanelBody>
							<Button
								className="interact-add-action-popover__close-button"
								size="small"
								variant="tertiary"
								icon="no-alt"
								label={ __( 'Close Action', 'interactions' ) }
								showTooltip={ false }
								onClick={ () => {
									onDeselect()
									// When the popover is closed, focus on the action so we can re-open it quickly.
									dragItemRef.current.focus()
								} }
								onKeyDown={ ev => {
									// Since onmount we are focused on the close button, forward up/down keys.
									if ( ev.key === 'ArrowUp' || ev.key === 'ArrowDown' ) {
										onKeyDown( ev )
									}
								} }
								ref={ closeButtonRef }
							/>
							<FlexLayout justifyContent="start">
								<h4 style={ { margin: 0 } }>{ actionConfig?.name || __( 'Unknown Action', 'interactions' ) }</h4>
								<AddActionButton
									buttonProps={ CHANGE_ACTION_PROPS }
									onAddAction={ actionType => {
										const newAction = changeActionType( action, actionType )
										onChange( newAction )
									} }
								/>
							</FlexLayout>
							<p style={ { marginTop: 8 } }>
								{ actionConfig?.description }
								<Button
									className="interact-list-control__title-tip"
									icon="info-outline"
									iconSize="16"
									size="small"
									variant="tertiary"
									label={ __( 'Learn more', 'interactions' ) }
									onClick={ () => window?.open( 'https://docs.wpinteractions.com/article/574-what-are-the-types-of-actions', '_docs' ) }
								/>
							</p>

							{ Object.keys( actionConfig?.properties || {} ).map( propertyKey => {
								const property = actionConfig.properties[ propertyKey ]
								const value = action.value[ propertyKey ]

								// For percentage timelines, data provided by
								// previous actions should not be shown because
								// they do not work due to the nature of seeking
								// in the timeline. Hide the reference id fields.
								if ( type === 'percentage' ) {
									if ( actionConfig.provides.includes( propertyKey ) ) {
										return null
									}
								}

								let hasDynamic = type === 'time' ? actionConfig.hasDynamic : false
								// For starting states, do not allow dynamic values.
								if ( action.timing.isStartingState ) {
									hasDynamic = false
								}

								return (
									<PropertyControl
										key={ propertyKey }
										property={ property }
										value={ value }
										hasDynamic={ hasDynamic }
										stepProvidedValues={ stepProvidedValues }
										properties={ action.value }
										onChange={ newValue => {
											const newAction = { ...action }
											// If we add a new property in the future, this can turn into an array, fix it.
											if ( Array.isArray( newAction.value ) && ! newAction.length ) {
												newAction.value = {}
											}
											newAction.value[ propertyKey ] = newValue
											onChange( newAction )
										} }
									/>
								)
							} ) }

							<Separator />

							{ hasTarget && (
								<>
									<TargetSelector
										horizontalTypes={ [ 'block', 'class', 'selector' ] }
										label={ actionConfig.labelAppliedTo || __( 'Applied to', 'interactions' ) }
										targets={ actionConfig?.targets || null }
										assignBlockIdOnPick
										hasTrigger={ hasTrigger }
										anchor={ popoverRef }
										offset={ 0 }
										value={ action.target }
										onChange={ target => {
											setIsSelectingBlock( false )
											const newAction = {
												...action,
												target: {
													...action.target,
													...target,
												},
											}

											// Remove stagger if the target cannot select multiple elements.
											if ( target.type !== 'block-name' && target.type !== 'selector' && target.type !== 'class' ) {
												delete newAction.timing.stagger
											}

											onChange( newAction )
										} }
										onBlockSelectClick={ () => setIsSelectingBlock( true ) }
										onBlockSelectDone={ () => setIsSelectingBlock( false ) }
									/>
									{ [ 'selector', 'block-name', 'class' ].includes( action.target.type ) && (
										<SelectControl
											label={ __( 'Matching', 'interactions' ) }
											labelPosition="edge"
											options={ [
												{
													label: sprintf( __( 'All matching %s', 'interactions' ), matchingLabel ),
													value: '',
												},
												{
													label: sprintf( __( 'Only match %s in the main content area', 'interactions' ), matchingLabel ),
													value: 'content-area',
												},
												{
													label: sprintf( __( 'Only match %s that are not the interaction trigger', 'interactions' ), matchingLabel ),
													value: 'not-trigger',
												},
												{
													label: sprintf( __( 'Only match %s that are children of the interaction trigger', 'interactions' ), matchingLabel ),
													value: 'children',
												},
												{
													label: __( 'Only match siblings of the interaction trigger', 'interactions' ),
													value: 'siblings',
												},
												{
													label: __( 'Only match siblings and the interaction trigger', 'interactions' ),
													value: 'siblings-with-trigger',
												},
												{
													label: sprintf( __( 'Only match %s with the same parent as the interaction trigger', 'interactions' ), matchingLabel ),
													value: 'parent',
												},
												{
													label: sprintf( __( 'Only match %s with the same index as the current interaction trigger', 'interactions' ), matchingLabel ),
													value: 'same-index',
													disabled: hasStartingState,
												},
												{
													label: sprintf( __( 'Only match %s with the same index as the current interaction trigger including the trigger', 'interactions' ), matchingLabel ),
													value: 'same-index-with-trigger',
													disabled: hasStartingState,
												},
												{
													label: sprintf( __( 'Only match %s that do not have the same index as the current interaction trigger', 'interactions' ), matchingLabel ),
													value: 'not-same-index',
													disabled: hasStartingState,
												},
												{
													label: sprintf( __( 'Only match the first matching %s', 'interactions' ), matchingLabelSingular ),
													value: 'first',
													disabled: hasStartingState,
												},
												{
													label: sprintf( __( 'Only match the last matching %s', 'interactions' ), matchingLabelSingular ),
													value: 'last',
													disabled: hasStartingState,
												},
											] }
											value={ action.target.options || '' }
											onChange={ options => {
												const newAction = {
													...action,
													target: {
														...action.target,
														options, // TODO: implement this
												 },
												}
												onChange( newAction )
											} }
										/>
									) }
									{ warningMessage?.type === 'no-target' && (
										<span className="interact-warning-text">{ warningMessage.message }</span>
									) }
									<Separator />
								</>
							) }

							{ hasStartingState && (
								<ToggleControl
									label={ __( 'Set as starting state', 'interactions' ) }
									checked={ action.timing.isStartingState }
									onChange={ value => {
										const newAction = { ...action }
										newAction.timing.start = value ? -1 : 0
										newAction.timing.isStartingState = value
										onChange( newAction )
									} }
								/>
							) }

							{ ! action.timing.isStartingState && (
								<>
									{ type === 'time' && (
										<NumberControl
											__unstableInputWidth="90px"
											label={ __( 'Starting Time', 'interactions' ) }
											isShiftStepEnabled
											isDragEnabled
											labelPosition="edge"
											shiftStep={ 0.1 }
											step={ 0.01 }
											min={ 0 }
											disableUnits
											placeholder="0.0"
											suffix="s"
											value={ action.timing.start }
											onChange={ value => {
												const newAction = { ...action }
												const newValue = parseFloat( value )
												if ( ! isNaN( newValue ) && newValue >= 0 ) {
													newAction.timing.start = parseFloat( value )
													onChange( newAction )
												}
											} }
										/>
									) }
									{ type === 'percentage' && (
										<NumberControl
											__unstableInputWidth="90px"
											label={ __( 'Position', 'interactions' ) }
											isShiftStepEnabled
											isDragEnabled
											labelPosition="edge"
											shiftStep={ 5 }
											step={ 1 }
											min={ 0 }
											disableUnits
											placeholder="0"
											suffix="%"
											value={ action.timing.start }
											onChange={ value => {
												const newAction = { ...action }
												const newValue = parseInt( value )
												if ( ! isNaN( newValue ) && newValue >= 0 && newValue <= 100 ) {
													newAction.timing.start = newValue
													onChange( newAction )
												}
											} }
										/>
									) }
									{ hasDuration && type === 'time' && (
										<NumberControl
											__unstableInputWidth="90px"
											label={ __( 'Duration', 'interactions' ) }
											isShiftStepEnabled
											isDragEnabled
											labelPosition="edge"
											shiftStep={ 0.1 }
											step={ 0.01 }
											min={ 0 }
											disableUnits
											placeholder="0.5"
											suffix="s"
											value={ action.timing.duration }
											onChange={ value => {
												const newAction = { ...action }
												newAction.timing.duration = parseFloat( value )
												onChange( newAction )
											} }
										/>
									) }

									{ hasEasing && (
										<>
											<GridLayout columns={ action.timing.easing === 'custom' ? '1fr 1fr' : '1fr' }>
												<SelectControl
													labelPosition="edge"
													label={ __( 'Easing', 'interactions' ) }
													value={ action.timing.easing }
													onChange={ value => {
														const newAction = { ...action }
														newAction.timing.easing = value
														onChange( newAction )
													} }
												>
													<EasingOptions />
												</SelectControl>
												{ action.timing.easing === 'custom' && (
													<TextControl
														placeholder={ __( 'linear', 'interactions' ) }
														value={ action.timing.customEasing }
														onChange={ value => {
															const newAction = { ...action }
															newAction.timing.customEasing = value
															onChange( newAction )
														} }
													/>
												) }
											</GridLayout>
											{ action.timing.easing === 'custom' && (
												<p className="interact-timeline__easing-help">
													{ __( 'Enter a custom easing value.', 'interactions' ) }
													&nbsp;
													<a href="https://docs.wpinteractions.com/article/575-how-to-add-a-custom-easing-value" target="_docs">{ __( 'Learn more', 'interactions' ) }</a>
												</p>
											) }
										</>
									) }
									{ hasStagger && ( action.target.type === 'block-name' || action.target.type === 'selector' || action.target.type === 'class' ) && (
										<NumberControl
											__unstableInputWidth="90px"
											label={ __( 'Stagger', 'interactions' ) }
											isShiftStepEnabled
											isDragEnabled
											labelPosition="edge"
											shiftStep={ 0.1 }
											step={ 0.01 }
											min={ 0 }
											disableUnits
											placeholder="0"
											suffix="s"
											value={ action.timing.stagger || 0 }
											onChange={ value => {
												const newAction = { ...action }
												newAction.timing.stagger = parseFloat( value )
												onChange( newAction )
											} }
											help={ __( 'Delays the animation for each element.', 'interactions' ) }
										/>
									) }
									{ /* <GridLayout columns="auto 90px">
									<ToggleControl
										label={ __( 'Staggered Delay', 'interactions' ) }
									// checked
									>
										{ __( 'Staggered Delay', 'interactions' ) }
									</ToggleControl>
									<NumberControl
										__unstableInputWidth="90px"
										// label={ __( 'Duration', 'interactions' ) }
										isShiftStepEnabled
										// spinControls="none"
										isDragEnabled
										labelPosition="edge"
										shiftStep={ 0.1 }
										step={ 0.01 }
										min={ 0 }
										disableUnits
										placeholder="0.1"
										suffix="s"
									/>
								</GridLayout> */ }
								</>
							) }
							<FlexLayout>
								{ /* { hasPreview && (
								<Button
									label={ __( 'Preview Timeline', 'interactions' ) }
									icon="controls-play"
								>
									{ __( 'Preview', 'interactions' ) }
								</Button>
							) } */ }
								<Button
									variant="tertiary"
									isDestructive
									icon="trash"
									label={ __( 'Remove action', 'interactions' ) }
									style={ { marginLeft: 'auto' } }
									onClick={ onDelete }
								/>
							</FlexLayout>
						</PanelBody>
					</div>
				</Popover>
			) }
		</div>
	)
}
