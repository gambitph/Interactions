const LEGACY_BUILDER_EXAMPLE_KEYS = {
	gutenberg: 'serializedBlockExample',
	elementor: 'elementorExample',
	bricks: 'bricksExample',
	divi: 'diviExample',
}

/**
 * Return the builder-specific example payload for a preset.
 *
 * Supports the finalized top-level `<builder>Example` fields while still
 * falling back to the older shapes during the migration period.
 *
 * @param {Object} preset  Preset definition.
 * @param {string} builder Builder slug, for example `elementor`.
 *
 * @return {*} Builder-specific example payload.
 */
export const getPresetBuilderExample = ( preset = {}, builder = '' ) => {
	const legacyExampleKey =
		LEGACY_BUILDER_EXAMPLE_KEYS[ builder ] || `${ builder }Example`

	if ( builder === 'gutenberg' && preset?.gutenbergExample ) {
		return preset.gutenbergExample
	}

	if ( builder !== 'gutenberg' && preset?.[ `${ builder }Example` ] ) {
		return preset[ `${ builder }Example` ]
	}

	if ( preset?.builderExamples?.[ builder ] ) {
		return preset.builderExamples[ builder ]
	}

	if ( legacyExampleKey && preset?.[ legacyExampleKey ] ) {
		return preset[ legacyExampleKey ]
	}

	return null
}

/**
 * Resolve builder-aware target refs into the shape expected by the active
 * editor adapter.
 *
 * A target ref can either stay generic:
 * `button: [ "innerBlocks", 0 ]`
 * or provide per-builder data:
 * `button: { gutenberg: { blockPath: [...] }, elementor: { path: [...] } }`
 *
 * @param {Object} preset  Preset definition.
 * @param {string} builder Builder slug, for example `gutenberg` or `elementor`.
 *
 * @return {Object} Normalized target refs for the requested builder.
 */
export const getPresetBuilderTargetRefs = ( preset = {}, builder = '' ) => {
	const targetRefs = preset?.targetRefs
	if ( ! targetRefs || typeof targetRefs !== 'object' ) {
		return {}
	}

	return Object.entries( targetRefs ).reduce( ( resolvedTargetRefs, [ targetRef, targetRefConfig ] ) => {
		if (
			targetRefConfig &&
			typeof targetRefConfig === 'object' &&
			! Array.isArray( targetRefConfig ) &&
			targetRefConfig[ builder ]
		) {
			resolvedTargetRefs[ targetRef ] = targetRefConfig[ builder ]
			return resolvedTargetRefs
		}

		resolvedTargetRefs[ targetRef ] = targetRefConfig
		return resolvedTargetRefs
	}, {} )
}
