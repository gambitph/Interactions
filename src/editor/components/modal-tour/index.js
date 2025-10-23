/**
 * Internal dependencies
 */
import {
	setActiveTour,
	clearActiveTour,
	getActiveTourId,
} from '../guided-modal-tour/util'
import { TOUR_STEPS } from './tour-steps'

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n'
import classNames from 'classnames'
import confetti from 'canvas-confetti'

/**
 * WordPress dependencies
 */
import {
	Modal, Flex, Button,
} from '@wordpress/components'
import {
	Icon, arrowRight, arrowLeft, info,
} from '@wordpress/icons'
import {
	useEffect, useState, useCallback, useRef, useMemo, memo,
} from '@wordpress/element'

const NOOP = () => {}

const ModalTour = memo( props => {
	const {
		tourId,
		onClose = NOOP,
	} = props

	const [ currentStep, setCurrentStep ] = useState( 0 )
	const [ isVisible, setIsVisible ] = useState( false )
	const [ isVisibleDelayed, setIsVisibleDelayed ] = useState( false )
	const [ forceRefresh, setForceRefresh ] = useState( 0 )
	const [ isTransitioning, setIsTransitioning ] = useState( false )
	const [ direction, setDirection ] = useState( 'forward' )
	const modalRef = useRef( null )
	const glowElementRef = useRef( null )

	const {
		steps = [],
		hasConfetti = true,
		initialize = NOOP,
	} = useMemo( () =>
		TOUR_STEPS[ tourId ] || {},
	[ tourId ] )

	const step = ( steps && steps[ currentStep ] ) || {}

	const {
		title,
		description,
		help = null, // If provided, a help text will be shown below the description.
		ctaLabel = null, // If provided, a button will be shown with this label.
		ctaOnClick = NOOP, // This will be called when the button is clicked, we will move to the next step after.
		size = 'small', // Size of the modal. Can be 'small', 'medium', 'large'.
		anchor = null, // This is a selector for the element to anchor the modal to. Defaults to middle of the screen.
		position = 'center', // This is the position to place the modal relative to the anchor. Can be 'left', 'right', 'top', 'bottom', 'center'.
		offsetX = '0px', // This is the X offset of the modal relative to the anchor.
		offsetY = '0px', // This is the Y offset of the modal relative to the anchor.
		showNext = true, // If true, a "Next" button will be shown.
		nextEventTarget = null, // If provided, this is a selector for the element to trigger the next event if there is one.
		nextEvent = 'click', // This is the event to listen for to trigger the next step.
		glowTarget = null, // If provided, this is a selector for the element to glow when the step is active.
		// eslint-disable-next-line no-unused-vars
		preStep = NOOP, // If provided, this is a function to run before the step is shown.
		// eslint-disable-next-line no-unused-vars
		postStep = NOOP, // If provided, this is a function to run after the step is shown.
		skipIf = NOOP, // If provided, this is a function to check if the step should be skipped.
	} = step

	useEffect( () => {
		setTimeout( () => {
			initialize()
		}, 50 )
	}, [ initialize ] )

	// Set active tour when modal becomes visible
	useEffect( () => {
		if ( isVisible ) {
			setActiveTour( tourId )
		}
	}, [ isVisible, tourId ] )

	// Clear active tour when component unmounts
	useEffect( () => {
		return () => {
			if ( getActiveTourId() === tourId ) {
				clearActiveTour()
			}
		}
	}, [ tourId ] )

	// While the modal is visible, just keep on force refreshing the modal in an interval to make sure the modal is always in the correct position.
	useEffect( () => {
		let interval
		if ( isVisible && ! isTransitioning ) {
			interval = setInterval( () => {
				setForceRefresh( forceRefresh => forceRefresh + 1 )
			}, 500 )
		}
		return () => clearInterval( interval )
	}, [ isVisible, isVisibleDelayed, isTransitioning ] )

	// Create a stable function reference for the event listener
	const handleNextEvent = useCallback( () => {
		// Hide modal during transition
		setIsVisible( false )
		setIsVisibleDelayed( false )
		setIsTransitioning( true )
		setDirection( 'forward' )

		// If at the last step, just close
		if ( currentStep === steps.length - 1 ) {
			steps[ currentStep ]?.postStep?.( currentStep )
			if ( hasConfetti ) {
				throwConfetti()
			}
			onClose()
			return
		}

		setTimeout( () => {
			setCurrentStep( currentStep => {
				setTimeout( () => {
					steps[ currentStep ]?.postStep?.( currentStep )
				}, 50 )
				const nextStep = currentStep + 1
				setTimeout( () => {
					steps[ nextStep ]?.preStep?.( nextStep )
				}, 50 )
				return nextStep
			} )

			// Show modal after 200ms delay
			setTimeout( () => {
				setIsVisible( true )
				setTimeout( () => {
					setIsVisibleDelayed( true )
					setIsTransitioning( false )
				}, 150 )
			}, 200 )
		}, 100 )

		setTimeout( () => {
			setForceRefresh( forceRefresh => forceRefresh + 1 )
		}, 350 )
		setTimeout( () => {
			setForceRefresh( forceRefresh => forceRefresh + 1 )
		}, 650 )
	}, [ currentStep, steps, hasConfetti ] )

	const handleBackEvent = useCallback( () => {
		// Hide modal during transition
		setIsVisible( false )
		setIsVisibleDelayed( false )
		setIsTransitioning( true )
		setDirection( 'backward' )

		setTimeout( () => {
			setCurrentStep( currentStep => {
				// steps[ currentStep ]?.postStep?.( currentStep )
				const nextStep = currentStep - 1
				steps[ nextStep ]?.preStep?.( nextStep )
				return nextStep
			} )

			// Show modal after 200ms delay
			setTimeout( () => {
				setIsVisible( true )
				setTimeout( () => {
					setIsVisibleDelayed( true )
					setIsTransitioning( false )
				}, 150 )
			}, 200 )
		}, 100 )

		setTimeout( () => {
			setForceRefresh( forceRefresh => forceRefresh + 1 )
		}, 350 )
		setTimeout( () => {
			setForceRefresh( forceRefresh => forceRefresh + 1 )
		}, 650 )
	}, [ currentStep, steps ] )

	// If we just moved to this step, even before showing it check if we should skip it, if so, move to the next/prev step.
	useEffect( () => {
		if ( skipIf() ) {
			if ( direction === 'forward' ) {
				handleNextEvent()
			} else {
				handleBackEvent()
			}
		}
	}, [ currentStep, direction ] )

	// Show modal after 1 second delay
	useEffect( () => {
		const timer = setTimeout( () => {
			setIsVisible( true )
			setTimeout( () => {
				setIsVisibleDelayed( true )
			}, 150 )
		}, 1050 )

		return () => clearTimeout( timer )
	}, [] )

	useEffect( () => {
		let clickListener = null

		if ( nextEventTarget ) {
			if ( nextEvent === 'click' || nextEvent === 'mousedown' || nextEvent === 'mouseup' ) {
				clickListener = event => {
					// Check if the event target matches the selector or is inside an element that matches
					if (
						event.target.matches( nextEventTarget ) ||
						event.target.closest( nextEventTarget )
					) {
						handleNextEvent()
					}
				}
				// Use ownerDocument instead of document directly
				const doc = modalRef.current?.ownerDocument || document
				doc.addEventListener( nextEvent, clickListener )
			} else {
				const elements = document.querySelectorAll( nextEventTarget )
				for ( let i = 0; i < elements.length; i++ ) {
					elements[ i ].addEventListener( nextEvent, handleNextEvent )
				}
			}
		}

		return () => {
			if ( nextEventTarget ) {
				if ( ( nextEvent === 'click' || nextEvent === 'mousedown' || nextEvent === 'mouseup' ) && clickListener ) {
					// Use ownerDocument instead of document directly
					const doc = modalRef.current?.ownerDocument || document
					doc.removeEventListener( nextEvent, clickListener )
				} else {
					const elements = document.querySelectorAll( nextEventTarget )
					for ( let i = 0; i < elements.length; i++ ) {
						elements[ i ].removeEventListener( nextEvent, handleNextEvent )
					}
				}
			}
		}
	}, [ currentStep, nextEventTarget, nextEvent, handleNextEvent ] )

	// Create the glow element while this component is mounted.
	useEffect( () => {
		// Create the element.
		const element = document.createElement( 'div' )
		element.className = `interact-tour-modal__glow interact-tour-modal__glow--hidden`
		document.body.appendChild( element )

		// Keep track of the element.
		glowElementRef.current = element

		return () => {
			glowElementRef.current = null
			element.remove()
		}
	}, [] )

	// These are the X and Y offsets of the modal relative to the anchor. This will be
	const [ modalOffsetX, modalOffsetY ] = useMemo( () => {
		if ( ! modalRef.current ) {
			return [ '', '' ] // This is for the entire screen.
		}

		const modalEl = modalRef.current?.querySelector?.( '.interact-tour-modal' )
		if ( ! modalEl ) {
			return [ '', '' ]
		}
		const modalRect = modalEl.getBoundingClientRect()

		const defaultOffset = [ `${ ( window.innerWidth / 2 ) - ( modalRect.width / 2 ) }px`, `${ ( window.innerHeight / 2 ) - ( modalRect.height / 2 ) }px` ]

		if ( ! anchor ) {
			return defaultOffset // This is for the entire screen.
		}

		// Based on the anchor and position, calculate the X and Y offsets of the modal relative to the anchor.
		// We have the modalRef.current which we can use to get the modal's bounding client rect.
		const anchorRect = document.querySelector( anchor )?.getBoundingClientRect()

		if ( ! anchorRect ) {
			return defaultOffset
		}

		switch ( position ) {
			case 'left':
				// Left, middle
				return [ `${ anchorRect.left - modalRect.width - 16 }px`, `${ anchorRect.top + ( anchorRect.height / 2 ) - ( modalRect.height / 2 ) }px` ]
			case 'left-top':
				return [ `${ anchorRect.left - modalRect.width - 16 }px`, `${ anchorRect.top + 16 }px` ]
			case 'left-bottom':
				return [ `${ anchorRect.left - modalRect.width - 16 }px`, `${ anchorRect.bottom - modalRect.height - 16 }px` ]
			case 'right':
				// Right, middle
				return [ `${ anchorRect.right + 16 }px`, `${ anchorRect.top + ( anchorRect.height / 2 ) - ( modalRect.height / 2 ) }px` ]
			case 'right-top':
				return [ `${ anchorRect.right + 16 }px`, `${ anchorRect.top + 16 }px` ]
			case 'right-bottom':
				return [ `${ anchorRect.right + 16 }px`, `${ anchorRect.bottom - modalRect.height - 16 }px` ]
			case 'top':
				// Center, top
				return [ `${ anchorRect.left + ( anchorRect.width / 2 ) - ( modalRect.width / 2 ) }px`, `${ anchorRect.top - modalRect.height - 16 }px` ]
			case 'top-left':
				return [ `${ anchorRect.left + 16 }px`, `${ anchorRect.top - modalRect.height - 16 }px` ]
			case 'top-right':
				return [ `${ anchorRect.right - modalRect.width - 16 }px`, `${ anchorRect.top - modalRect.height - 16 }px` ]
			case 'bottom':
				// Center, bottom
				return [ `${ anchorRect.left + ( anchorRect.width / 2 ) - ( modalRect.width / 2 ) }px`, `${ anchorRect.bottom + 16 }px` ]
			case 'bottom-left':
				return [ `${ anchorRect.left + 16 }px`, `${ anchorRect.bottom + 16 }px` ]
			case 'bottom-right':
				return [ `${ anchorRect.right - modalRect.width - 16 }px`, `${ anchorRect.bottom + 16 }px` ]
			case 'center':
				return [ `${ anchorRect.left + ( anchorRect.width / 2 ) - ( modalRect.width / 2 ) }px`, `${ anchorRect.top + ( anchorRect.height / 2 ) - ( modalRect.height / 2 ) }px` ]
			case 'center-top':
				return [ `${ anchorRect.left + ( anchorRect.width / 2 ) - ( modalRect.width / 2 ) }px`, `${ anchorRect.top + 16 }px` ]
			case 'center-bottom':
				return [ `${ anchorRect.left + ( anchorRect.width / 2 ) - ( modalRect.width / 2 ) }px`, `${ anchorRect.bottom - modalRect.height - 16 }px` ]
			default:
				return defaultOffset
		}
	}, [ anchor, position, modalRef.current, isVisible, isVisibleDelayed, isTransitioning, forceRefresh ] )

	// If we have a glow target, create a new element in the body, placed on the top of the target, below the modal.
	useEffect( () => {
		if ( glowTarget && isVisibleDelayed ) {
			// Get the top, left, width, and height of the target.
			const target = document.querySelector( glowTarget )
			if ( target ) {
				const targetRect = target.getBoundingClientRect()

				// Estimate the size of the glow target based on the size of the target.
				const glowTargetSize = targetRect.width > 300 || targetRect.height > 200 ? 'large'
					: targetRect.width > 300 || targetRect.height > 100 ? 'medium'
						: 'small'

				// Create the element.
				if ( glowElementRef.current ) {
					glowElementRef.current.className = `interact-tour-modal__glow interact-tour-modal__glow--${ glowTargetSize }`
					glowElementRef.current.style.top = `${ targetRect.top - 8 }px`
					glowElementRef.current.style.left = `${ targetRect.left - 8 }px`
					glowElementRef.current.style.width = `${ targetRect.width + 16 }px`
					glowElementRef.current.style.height = `${ targetRect.height + 16 }px`
				}
			}
		} else if ( glowElementRef.current ) {
			glowElementRef.current.className = `interact-tour-modal__glow interact-tour-modal__glow--hidden`
		}
	}, [ glowTarget, currentStep, isVisible, isVisibleDelayed, isTransitioning, forceRefresh ] )

	// When unmounted, do not call onClose. So we need to do this handler on our own.
	useEffect( () => {
		const handleHeaderClick = () => {
			onClose()
		}
		if ( modalRef.current ) {
			modalRef.current.querySelector( '.components-modal__header > .components-button' ).addEventListener( 'click', handleHeaderClick )
		}
		return () => {
			if ( modalRef.current ) {
				modalRef.current.querySelector( '.components-modal__header > .components-button' ).removeEventListener( 'click', handleHeaderClick )
			}
		}
	}, [ modalRef.current, onClose ] )

	if ( ! isVisible ) {
		return null
	}

	return (
		<Modal
			title={ title }
			overlayClassName="interact-tour-modal--overlay"
			shouldCloseOnClickOutside={ false }
			size={ size }
			// onRequestClose={ onClose } // Do not use onRequestClose, it will cause the tour finish
			className={ classNames(
				'interact-tour-modal',
				`interact-tour-modal--${ position.replace( /-.*$/, '' ) }`,
				`interact-tour-modal--${ position }`,
				{
					'interact-tour-modal--visible': isVisible,
					'interact-tour-modal--visible-delayed': isVisibleDelayed,
				} ) }
			ref={ modalRef }
		>
			<style>
				{ `.interact-tour-modal {
					--offset-x: ${ offsetX };
					--offset-y: ${ offsetY };
					--left: ${ modalOffsetX };
					--top: ${ modalOffsetY };
				}` }
			</style>
			{ description }
			{ help && (
				<div className="interact-tour-modal__help">
					<Icon icon={ info } size={ 16 } />
					{ help }
				</div>
			) }
			{ ctaLabel && (
				<Button
					onClick={ () => {
						ctaOnClick()
						handleNextEvent()
					} }
					variant="primary"
					className="interact-tour-modal__cta"
				>
					{ ctaLabel }
				</Button>
			) }
			<Flex className="interact-tour-modal__footer">
				<Steps
					numSteps={ steps.length }
					currentStep={ currentStep }
				/>
				{ currentStep > 0 && (
					<Button
						variant="tertiary"
						onClick={ handleBackEvent }
					>
						<Icon icon={ arrowLeft } size={ 20 } />
						&nbsp;
						{ __( 'Back', 'interactions' ) }
					</Button>
				) }
				{ showNext && (
					<Button
						variant="primary"
						onClick={ handleNextEvent }
					>
						{ currentStep === steps.length - 1 ? (
							__( 'Finish', 'interactions' )
						) : (
							<>
								{ __( 'Next', 'interactions' ) }
								&nbsp;
								<Icon icon={ arrowRight } size={ 20 } />
							</>
						) }
					</Button>
				) }
			</Flex>
		</Modal>
	)
} )

const throwConfetti = () => {
	confetti( {
		particleCount: 50,
		angle: 60,
		spread: 70,
		origin: { x: 0 },
		zIndex: 100000,
		disableForReducedMotion: true,
	} )
	confetti( {
		particleCount: 50,
		angle: 120,
		spread: 70,
		origin: { x: 1 },
		zIndex: 100000,
		disableForReducedMotion: true,
	} )
	setTimeout( () => {
		confetti( {
			particleCount: 50,
			angle: -90,
			spread: 90,
			origin: { y: -0.3 },
			zIndex: 100000,
			disableForReducedMotion: true,
		} )
	}, 150 )
}

const Steps = memo( props => {
	const {
		numSteps = 3,
		currentStep = 0,
	} = props

	if ( numSteps === 1 ) {
		return null
	}

	return (
		<div className="interact-tour-modal__steps">
			{ Array.from( { length: numSteps } ).map( ( _, index ) => {
				const classes = classNames( [
					'interact-tour-modal__step',
					currentStep === index && 'interact-tour-modal__step--active',
				] )

				return (
					<div
						className={ classes }
						key={ index }
					/>
				)
			} ) }
		</div>
	)
} )

export default ModalTour
