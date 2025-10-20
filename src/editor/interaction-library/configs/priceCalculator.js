const priceCalculator = ( selectedPreset, optionValues, interactionSetup ) => {
	const prices = [ 30, 40, 50 ]
	const totalVar = `Interact__price_calculator_${ Date.now().toString( 36 ) + Math.random().toString( 36 ).slice( 2, 5 ) }`

	interactionSetup.forEach( ( interaction, index ) => {
		interaction.timelines[ 0 ].actions[ 1 ].value = {
			code: `
				window.${ totalVar } = (window.${ totalVar } || 0) + ${ prices[ index ] };
				currencyValue = window.${ totalVar }.toLocaleString('en-US',{style: 'currency', currency: 'USD'})
			`,
			id: 'total',
		}
		interaction.timelines[ 1 ].actions[ 0 ].value = {
			code: `
				window.${ totalVar } = (window.${ totalVar } || 0) - ${ prices[ index ] };
				currencyValue = window.${ totalVar }.toLocaleString('en-US',{style: 'currency', currency: 'USD'})
			`,
			id: 'total',
		}
	} )

	return true
}

export default priceCalculator
