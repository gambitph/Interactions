import columnsSlideInStagger from './configs/columns-slide-in-stagger'
import columnsFadeInStagger from './configs/columns-fade-in-stagger'
import parallax from './configs/parallax'
import priceCalculator from './configs/priceCalculator'

const configRegistry = {
	bouncingButtonBounceFactor: value => 1 - ( value * 0.02 ),
	growingButtonScaleFactor: value => 1 + ( value * 0.02 ),
	imageSlideInDirection: value => ( {
		x: value === 'horizontal' ? -100 : 0, y: value === 'vertical' ? -100 : 0, z: 0,
	} ),
	imageZoomScaleFactor: value => 1 + ( value * 0.025 ),
	pulsingButtonScaleStrength: value => 1 + ( value * 0.025 ),
	shakingButtonShakeFactorPositive2: value => value * 2,
	shakingButtonShakeFactorNegative2: value => -( value * 2 ),
	shakingButtonShakeFactorNegative: value => -( value ),
	spreadingTextSpread: value => `${ value }px`,
	growOnScrollScaleFactor: value => 1 + ( value * 0.02 ),
	countingUp: value => Math.round( value ) - 1,
	columnsSlideInStagger,
	columnsFadeInStagger,
	parallax,
	priceCalculator,
}

const getConfig = configName => {
	if ( ! configName || ! configRegistry[ configName ] ) {
		return null
	}
	return configRegistry[ configName ]
}

export default getConfig
