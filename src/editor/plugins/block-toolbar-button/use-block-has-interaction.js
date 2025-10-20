import { useSelect } from '@wordpress/data'
import { isInteractionShown } from '../../hooks/use-interactions'

const useBlockHasInteraction = blockAnchor => {
	return useSelect( select => {
		const interactions = select( 'interact/interactions' ).getInteractions()
		const interactionsFiltered = interactions.filter( interaction => isInteractionShown( interaction, select ) )

		return interactionsFiltered.reduce( ( keys, interaction ) => {
			if ( interaction.target.type === 'block' && interaction.target.value === blockAnchor ) {
				keys.push( interaction.key )
			}
			return keys
		}, [] )
	}, [ blockAnchor ] )
}

export default useBlockHasInteraction
