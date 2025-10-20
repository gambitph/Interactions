/**
 * Loads and merges all preset JSON files into an array. This file is compiled
 * by webpack to include all JSON files from the library directory.
 *
 * This file is lazy loaded by util.js when the Interaction Library is opened.
 *
 * @return {Array<Object>} An array of presets.
 */
const requirePresets = require.context( './library', false, /\.json$/ )
const interactionPresets = requirePresets.keys().map( key => requirePresets( key ) )

export const loadInteractionPresets = () => interactionPresets
