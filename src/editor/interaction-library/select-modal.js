/**
 * Internal deprendencies
 */
import getVideoUrl from './videos'
import { addLoopDelayToPreview } from './util'

/**
 * External deprendencies
 */
import classNames from 'classnames'

/**
 * WordPress deprendencies
 */
import { Button, Tooltip } from '@wordpress/components'
import {
	Icon, info, lockOutline,
} from '@wordpress/icons'
import { useState, useMemo } from '@wordpress/element'
import { __ } from '@wordpress/i18n'

/**
 * Internal deprendencies
 */
import { ProCrownIcon } from '~interact/editor/components/pro-crown'

const NOOP = () => {}

export const SelectModal = props => {
	const {
		presets = [],
		categories = [],
		favorites = [],
		setFavorites = NOOP,
		onSelect = NOOP,
		searchQuery = '',
		mode = 'insert',
	} = props
	const [ selectedCategory, setSelectedCategory ] = useState( 'all' )

	const adjustedPresets = useMemo( () => (
		presets.map( preset => {
			if ( mode === 'apply' && preset.apply ) {
				return {
					...preset,
					...preset.apply,
				}
			}
			return preset
		} )
	), [ presets, mode ] )

	const filteredPresets = useMemo( () => {
		let result = []

		// Filter presets based on selected category.
		if ( selectedCategory === 'all' ) {
			result = adjustedPresets
		} else if ( selectedCategory === 'favorites' ) {
			result = adjustedPresets.filter( preset => favorites.includes( preset.id ) )
		} else {
			result = adjustedPresets.filter( preset => (
				preset.category === selectedCategory
			) )
		}

		// Further filter presets based on search query.
		if ( searchQuery ) {
			const query = searchQuery.toLowerCase()
			result = result.filter( preset =>
				preset?.name?.toLowerCase()?.includes( query ) ?? false
			)
		}

		return result
	}, [ adjustedPresets, selectedCategory, searchQuery, favorites ] )

	const handlePresetSelect = preset => {
		onSelect( preset )
	}

	return (
		<div className="interact-interaction-library__select-wrapper">
			<aside className="interact-interaction-library__select__sidebar">
				<ul
					className="interact-interaction-library__select__categories"
					aria-label={ __( 'Categories', 'interactions' ) }
				>
					{ categories.map( category => (
						<li key={ category.value }>
							<Tooltip text={ category.description }>
								<Button
									type="button"
									className={ classNames(
										'interact-interaction-library__select__category',
										{ active: selectedCategory === category.value }
									) }
									onClick={ () => setSelectedCategory( category.value ) }
								>
									{ category.name }
								</Button>
							</Tooltip>
						</li>
					) ) }
				</ul>
			</aside>

			<div className="interact-interaction-library__select__content">
				<div className="interact-interaction-library__select__presets">
					{ filteredPresets.map( preset => {
						const isApplicable = mode !== 'apply' || preset.isApplicable
						const isPremium = ! preset.interactionSetup

						return <div
							key={ preset.id }
							className={ classNames( 'interact-interaction-library__select__preset-card', { 'interact-premium-preset': isPremium } ) }
						>
							<div className="interact-interaction-library__select__preset-wrapper">
								<video
									autoPlay
									muted
									className="interact-interaction-library__select__preset-preview"
									onEnded={ e => addLoopDelayToPreview( e, 1000 ) }
								>
									<source src={ getVideoUrl( preset.preview ) } type="video/mp4" />
								</video>
								{ isPremium && (
									<ProCrownIcon />
								) }
								<div className={ classNames(
									'interact-interaction-library__select__buttons-overlay',
									{ 'interact-show-overlay': ! isApplicable }
								) }>
									{ ! isPremium && (
										<>
											{ isApplicable
												? <>
													<Button
														variant="primary"
														onClick={ () => handlePresetSelect( { ...preset, skipConfig: true } ) }
													>
														{ mode === 'insert'
															? __( 'Insert', 'interactions' )
															: __( 'Apply', 'interactions' )
														}
													</Button>
													{ preset.configurableOptions &&
														<Button
															variant="primary"
															onClick={ () => handlePresetSelect( preset ) }
														>
															{ __( 'Customize', 'interactions' ) }
														</Button>
													}
												</>
												: <p>{ __( 'Can not apply to current block', 'interactions' ) }</p>
											}
										</>
									) }
									{ isPremium && (
										<>
											<Icon icon={ lockOutline } className="interact-interaction-library__select__premium-icon" />
											<h4>{ __( 'Premium Template', 'interactions' ) }</h4>
											<div>{ __( 'Upgrade to unlock', 'interactions' ) }</div>
											<Button
												className="interact-pro-upsell-button"
												variant="primary"
												as="a"
												href="https://wpinteractions.com/pricing/?utm_source=interactions&utm_medium=library&utm_campaign=premium-template"
												target="_blank"
												rel="noopener noreferrer"
											>
												{ __( 'Upgrade Now', 'interactions' ) }
											</Button>
										</>
									) }
								</div>
							</div>
							<div className="interact-interaction-library__select__title-wrapper">
								<h3 className={ classNames( { 'interact-greyed-out': ! isApplicable } ) }>
									{ preset.name ?? '' }
								</h3>
								<Tooltip text={ preset.description ?? '' } placement="top" >
									<Icon icon={ info } size={ 20 } fill="#777" />
								</Tooltip>
								<Button
									className="interact-interaction-library__select__favorites-button"
									size="small"
									icon={
										favorites.includes( preset.id )
											? <Icon icon={ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M305 151.1L320 171.8L335 151.1C360 116.5 400.2 96 442.9 96C516.4 96 576 155.6 576 229.1L576 231.7C576 343.9 436.1 474.2 363.1 529.9C350.7 539.3 335.5 544 320 544C304.5 544 289.2 539.4 276.9 529.9C203.9 474.2 64 343.9 64 231.7L64 229.1C64 155.6 123.6 96 197.1 96C239.8 96 280 116.5 305 151.1z" /></svg> } color="#fd3997" />
											: <Icon icon={ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M442.9 144C415.6 144 389.9 157.1 373.9 179.2L339.5 226.8C335 233 327.8 236.7 320.1 236.7C312.4 236.7 305.2 233 300.7 226.8L266.3 179.2C250.3 157.1 224.6 144 197.3 144C150.3 144 112.2 182.1 112.2 229.1C112.2 279 144.2 327.5 180.3 371.4C221.4 421.4 271.7 465.4 306.2 491.7C309.4 494.1 314.1 495.9 320.2 495.9C326.3 495.9 331 494.1 334.2 491.7C368.7 465.4 419 421.3 460.1 371.4C496.3 327.5 528.2 279 528.2 229.1C528.2 182.1 490.1 144 443.1 144zM335 151.1C360 116.5 400.2 96 442.9 96C516.4 96 576 155.6 576 229.1C576 297.7 533.1 358 496.9 401.9C452.8 455.5 399.6 502 363.1 529.8C350.8 539.2 335.6 543.9 320 543.9C304.4 543.9 289.2 539.2 276.9 529.8C240.4 502 187.2 455.5 143.1 402C106.9 358.1 64 297.7 64 229.1C64 155.6 123.6 96 197.1 96C239.8 96 280 116.5 305 151.1L320 171.8L335 151.1z" /></svg> } color="#777" />
									}
									iconSize={ 24 }
									onClick={ () => {
										setFavorites(
											favorites.includes( preset.id )
												? favorites.filter( id => id !== preset.id )
												: [ ...favorites, preset.id ]
										)
									} }
									label={ __( 'Add to favorites', 'interactions' ) }
								/>
							</div>
						</div>
					} ) }
				</div>
			</div>
		</div>
	)
}
