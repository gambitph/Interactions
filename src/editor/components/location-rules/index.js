/* eslint-disable camelcase */
import { locationRuleTypes } from 'interactions'

import { cloneDeep } from 'lodash'

import {
	BaseControl, Button, SelectControl,
} from '@wordpress/components'
import {
	Fragment, useEffect, useState,
} from '@wordpress/element'
import { select } from '@wordpress/data'
import { __, sprintf } from '@wordpress/i18n'
import apiFetch from '@wordpress/api-fetch'

const NOOP = () => {}

const updateLocation = ( locations, index1, index2, newLocation ) => {
	const newLocations = cloneDeep( locations )
	newLocations[ index1 ][ index2 ] = newLocation
	return newLocations
}

const removeLocation = ( locations, index1, index2 ) => {
	const newLocations = cloneDeep( locations )

	// Remove key locations[index1][index2] from the array using splice
	newLocations[ index1 ].splice( index2, 1 )

	// If the group is empty, remove it from the array
	if ( newLocations[ index1 ].length === 0 ) {
		newLocations.splice( index1, 1 )
	}

	return newLocations
}

// Adds the new location in the 1st index and shifts the rest of the locations
const addLocation = ( locations, index1, index2, newLocation ) => {
	const newLocations = cloneDeep( locations )

	// Append new location to the end of if index1 is past the end of the array
	if ( index1 >= newLocations.length ) {
		newLocations.push( [ newLocation ] )
		return newLocations
	}

	// Append new location to the end of the group if index2 is past the end of the array
	if ( index2 >= newLocations[ index1 ].length ) {
		newLocations[ index1 ].push( newLocation )
		return newLocations
	}

	// Insert new location at index2
	newLocations[ index1 ].splice( index2, 0, newLocation )
	return newLocations
}

// Flatten the editor options so we can easily check them without looping
// through all the options.
const ruleEditorOptions = {}
locationRuleTypes.forEach( ( { options } ) => {
	options.forEach( ( { value, editorOptions } ) => {
		ruleEditorOptions[ value ] = editorOptions
	} )
} )

const LocationRules = props => {
	const {
		locations = [],
		onChange = NOOP,
	} = props

	const isLastLocation = locations.length === 1 && locations[ 0 ].length === 1

	// TODO: If you delete all locations, then add a new one and pick page/post, it will select the CURRENT page/post, but it will show "All posts"

	return (
		<BaseControl label={ __( 'Show this interaction if', 'interactions' ) }>
			{ locations.map( ( locationGroup, i ) => {
				return (
					<Fragment key={ i }>
						{ locationGroup.map( ( location, k ) => {
							return <LocationRule
								key={ k }
								param={ location.param }
								operator={ location.operator }
								value={ location.value }
								showRemove={ ! isLastLocation }
								onChange={ newLocation => {
									onChange( updateLocation( locations, i, k, newLocation ) )
								} }
								onRemove={ () => {
									onChange( removeLocation( locations, i, k ) )
								} }
								onClickAnd={ () => {
									const value = locations.length === 0 ? select( 'core/editor' ).getCurrentPostId() : ''
									onChange( addLocation( locations, i, k + 1, {
										param: 'post',
										operator: '==',
										value: value || '',
									} ) )
								} }
							/>
						} ) }
						<div className="interact-location-rule__or">{ __( 'or', 'interactions' ) }</div>
					</Fragment>
				)
			} ) }
			<Button
				label={ __( 'Add rule group', 'interactions' ) }
				variant="secondary"
				onClick={ () => {
					const value = locations.length === 0 ? select( 'core/editor' ).getCurrentPostId() : ''
					onChange( addLocation( locations, locations.length, 0, {
						param: 'post',
						operator: '==',
						value: value || '',
					} ) )
				} }
			>
				{ __( 'Add rule group', 'interactions' ) }
			</Button>
		</BaseControl>
	)
}

const LocationRule = props => {
	const {
		param = '',
		operator = '==',
		value = '',
		onChange = NOOP,
		onRemove = NOOP,
		onClickAnd = NOOP,
		showRemove = true,
	} = props

	const [ valueOptions, setValueOptions ] = useState( [] )
	const [ isBusy, setIsBusy ] = useState( false )

	useEffect( () => {
		setIsBusy( true )
		apiFetch( {
			path: `/interact/v1/get_location_rules/${ param }`,
			method: 'GET',
		} )
			.then( response => {
				setIsBusy( false )
				const options = response

				// If param is a post/page, then the post_id doesn't exist yet, then we need to add it near the top as "Current Post" or "Current Page"
				if ( param === 'post' || param === 'page' ) {
					const postType = select( 'core/editor' ).getCurrentPostType()
					options.some( ( { post_type, options } ) => {
						if ( post_type === postType ) {
							const currentPostId = select( 'core/editor' ).getCurrentPostId()
							// Check if the current post is already in the list
							const exists = options.some( ( { value } ) => {
								return value === currentPostId
							} )

							if ( ! exists ) {
								const currentPostOption = {
									value: currentPostId,
									label: sprintf( __( 'Current %s', 'interactions' ), postType === 'page' ? __( 'Page', 'interactions' ) : __( 'Post', 'interactions' ) ),
								}
								options.unshift( currentPostOption )
							}
							return true
						}
						return false
					} )
				}

				setValueOptions( options )
			} )
			.catch( error => {
				console.error( 'Interactions error getting location rules:', error ) // eslint-disable-line no-console
			} )
	}, [ param ] )

	const {
		hasValueControl = true,
	} = ruleEditorOptions[ param ]

	return (
		<div className="interact-location-rule">
			<SelectControl
				className="interact-location-rule__param"
				value={ param }
				onChange={ param => {
					onChange( {
						param,
						operator,
						value,
					} )
				} }
			>
				{ locationRuleTypes.map( ( { label, options } ) => {
					return (
						<optgroup key={ label } label={ label }>
							{ options.map( ( { value, label } ) => {
								return <option key={ value } value={ value }>{ label }</option>
							} ) }
						</optgroup>
					)
				} ) }
			</SelectControl>
			{ hasValueControl && (
				<SelectControl
					className="interact-location-rule__operator"
					value={ operator }
					onChange={ operator => {
						onChange( {
							param,
							operator,
							value,
						} )
					} }
				>
					<option value="==">{ __( 'is equal to', 'interactions' ) }</option>
					<option value="!=">{ __( 'is not equal to', 'interactions' ) }</option>
				</SelectControl>
			) }
			{ hasValueControl && (
				<SelectControl
					className="interact-location-rule__value"
					value={ value }
					disabled={ isBusy }
					onChange={ value => {
						onChange( {
							param,
							operator,
							value,
						} )
					} }
				>
					{ valueOptions.map( ( {
						label, value, options,
					} ) => {
						if ( ! options && value ) {
							return <option key={ value } value={ value }>{ label }</option>
						}
						const optionsJSX = options.map( ( { value, label } ) => {
							return <option key={ value } value={ value }>{ label }</option>
						} )
						return label ? <optgroup key={ label } label={ label }>{ optionsJSX }</optgroup> : optionsJSX
					} ) }
				</SelectControl>
			) }
			<div className="interact-location-rule__buttons">
				<Button
					variant="secondary"
					label={ __( 'and', 'interactions' ) }
					onClick={ onClickAnd }
				>
					{ __( 'and', 'interactions' ) }
				</Button>
				{ showRemove && (
					<Button
						className="interact-location-rule__remove-button"
						variant="tertiary"
						isDestructive
						icon="trash"
						label={ __( 'Remove rule', 'interactions' ) }
						onClick={ onRemove }
					/>
				) }
			</div>
		</div>
	)
}

export default LocationRules
