import { __, sprintf } from '@wordpress/i18n'
import { isEqual } from 'lodash'
import { actions as actionsConfig } from 'interactions'

export const objectSprintf = ( format, objectValues ) => {
	return format.replace( /{\s*([^}\s]+)\s*}/g, ( match, propName ) => {
		return objectValues[ propName.trim() ] || match
	} )
}

export const formDynamicName = ( dynamicName, objectValues ) => {
	let format = dynamicName
	if ( ! dynamicName.includes( '{' ) ) {
		format = '{' + format + '}'
	}

	const name = objectSprintf( format, objectValues )

	// If the curly brackets are still there, it means we are missing a value.
	if ( name.match( /{\s*([^}\s]+)\s*}/g ) ) {
		return ''
	}
	return name
}

/**
 * Checks whether there are any errors to show in the action.
 *
 * @param {Object} action  Action data object (not an Action class instance)
 * @param {Object} options Options object that's relevant to the action
 *
 * @return {mixed} null or an error object.
 */
export const getActionWarning = ( action, options ) => {
	const {
		// hasTrigger,
		hasTarget,
		isRequiredTarget,
	} = options
	if ( isRequiredTarget && hasTarget && action.target?.type !== 'trigger' && action.target?.type !== 'window' ) {
		if ( ! action.target?.value ) {
			return {
				type: 'no-target',
				message: __( 'Please select a target.', 'interactions' ),
			}
		}
	}
	return null
}

/**
 * Checks whether there are any errors to show for the action based on the
 * current actions in the timeline.
 *
 * @param {Object}  action  Action data object (not an Action class instance)
 * @param {integer} index   The index of the current action
 * @param {Array}   actions All actions in this timeline
 * @param {string}  type    Whether the timeline is a time or percentage timeline
 *
 * @return {mixed} null or an error object.
 */
export const getTimelineWarnings = ( action, index, actions, type ) => {
	// For percentage interactions, we need at least two animation actions of the same type
	if ( type === 'percentage' ) {
		const currentType = action.type
		const isAnimation = actionsConfig[ currentType ]?.isAnimation

		if ( isAnimation ) {
			// We need to have at least two actions of the same type for the same target.
			if ( ! action.timing.isStartingState ) {
				const { options: _options, ...currentTarget } = action.target
				const totalSameType = actions.reduce( ( acc, currentAction ) => {
					if ( currentAction.type === currentType ) {
						const { options: _options, ...target } = currentAction.target
						if ( isEqual( target, currentTarget ) ) {
							return acc + 1
						}
					}
					return acc
				}, 0 )

				if ( totalSameType <= 1 ) {
					return {
						type: 'need-another-action',
						message: sprintf( __( 'You need another %s action with the same target for this animation effect to work.', 'interactions' ), currentType ),
					}
				}
			}
		}
	}
	return null
}
