/**
 * Internal dependencies
 */
// import { TOUR_STEPS } from './tour-steps'
import { TOUR_CONDITIONS } from './tour-conditions'
import {
	clearActiveTour,
	isTourActive,
	getActiveTourId,
	addTourStateListener,
} from './util'

/**
 * External dependencies
 */
import { editorMode, guidedTourStates } from 'interactions'

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch'
import {
	useEffect, useState, lazy, Suspense, memo,
} from '@wordpress/element'

// Only lazy-load ModalTour when we're actually going to render it
const ModalTour = lazy( () => import( /* webpackChunkName: "modal-tour" */ '../modal-tour' ) )

// The main tour component.
const GuidedModalTourContent = props => {
	const {
		tourId = '', // This is the ID of the tour, this will be used to store the tour state in the database and to get the steps.
	} = props

	// On mount, check if the tour has been completed, if so, don't show it.
	const [ isDone, setIsDone ] = useState( guidedTourStates.includes( tourId ) )

	// We need this to prevent the tour from being shown again if it's just completed.
	const [ justCompleted, setJustCompleted ] = useState( false )

	// Check if another tour is already active
	const [ isAnotherTourActive, setIsAnotherTourActive ] = useState( isTourActive() && getActiveTourId() !== tourId )

	// Listen for tour state changes
	useEffect( () => {
		const removeListener = addTourStateListener( activeId => {
			setIsAnotherTourActive( activeId !== null && activeId !== tourId )
		} )
		return removeListener
	}, [ tourId ] )

	if ( justCompleted ) {
		return null
	}

	// If another tour is already active, don't show this tour
	if ( isAnotherTourActive ) {
		return null
	}

	// If there is a condition, check if it's met, if not, don't show the tour.
	// condition can be true, false, or null. true will show the tour (even if
	// it's already done), false will not show the tour, null will show the tour
	// only once (normal behavior).
	const condition = TOUR_CONDITIONS[ tourId ]
	const conditionResult = condition ? condition() : null
	if ( conditionResult === false ) {
		return null
	} else if ( conditionResult === null ) {
		if ( isDone ) {
			return null
		}
	}

	return (
		<Suspense fallback={ null }>
			<ModalTour
				tourId={ tourId }
				onClose={ () => {
					setIsDone( true )
					setJustCompleted( true )

					// Clear the active tour
					clearActiveTour()

					// Persist through our route because /wp/v2/settings is admin-only.
					if ( ! guidedTourStates.includes( tourId ) ) {
						apiFetch( {
							path: '/interact/v1/guided_tour_states',
							method: 'POST',
							data: { states: [ ...guidedTourStates, tourId ] },
						} ).catch( error => {
							console.error( 'Error saving guided tour state:', error ) // eslint-disable-line no-console
						} )
					}

					// Soft update the global variable to prevent the tour from being shown again.
					guidedTourStates.push( tourId )

					// Remove the "tour" GET parameter from the URL so conditions won't get triggered again.
					const url = new URL( window.location.href )
					url.searchParams.delete( 'tour' )
					window.history.replaceState( null, '', url.toString() )
				} }
			/>
		</Suspense>
	)
}

const GuidedModalTour = memo( props => {
	if ( editorMode !== 'gutenberg' ) {
		return null
	}

	return <GuidedModalTourContent { ...props } />
} )

export default GuidedModalTour
