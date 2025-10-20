import { __, sprintf } from '@wordpress/i18n'

const EasingOptions = () => {
	return (
		<>
			<optgroup label="Default">
				<option value="linear">{ __( 'Linear (None)', 'interactions' ) }</option>
				<option value="custom">{ __( 'Custom', 'interactions' ) }</option>
			</optgroup>
			<optgroup label="Ease In">
				<option value="inQuad">{ sprintf( __( 'Ease In %s', 'interactions' ), __( 'Quad', 'interactions' ) ) }</option>
				<option value="inCubic">{ sprintf( __( 'Ease In %s', 'interactions' ), __( 'Cubic', 'interactions' ) ) }</option>
				<option value="inQuart">{ sprintf( __( 'Ease In %s', 'interactions' ), __( 'Quart', 'interactions' ) ) }</option>
				<option value="inQuint">{ sprintf( __( 'Ease In %s', 'interactions' ), __( 'Quint', 'interactions' ) ) }</option>
				<option value="inSine">{ sprintf( __( 'Ease In %s', 'interactions' ), __( 'Sine', 'interactions' ) ) }</option>
				<option value="inExpo">{ sprintf( __( 'Ease In %s', 'interactions' ), __( 'Expo', 'interactions' ) ) }</option>
				<option value="inCirc">{ sprintf( __( 'Ease In %s', 'interactions' ), __( 'Circ', 'interactions' ) ) }</option>
				<option value="inBack">{ sprintf( __( 'Ease In %s', 'interactions' ), __( 'Back', 'interactions' ) ) }</option>
				<option value="inBounce">{ sprintf( __( 'Ease In %s', 'interactions' ), __( 'Bounce', 'interactions' ) ) }</option>
			</optgroup>
			<optgroup label="Ease Out">
				<option value="outQuad">{ sprintf( __( 'Ease Out %s', 'interactions' ), __( 'Quad', 'interactions' ) ) }</option>
				<option value="outCubic">{ sprintf( __( 'Ease Out %s', 'interactions' ), __( 'Cubic', 'interactions' ) ) }</option>
				<option value="outQuart">{ sprintf( __( 'Ease Out %s', 'interactions' ), __( 'Quart', 'interactions' ) ) }</option>
				<option value="outQuint">{ sprintf( __( 'Ease Out %s', 'interactions' ), __( 'Quint', 'interactions' ) ) }</option>
				<option value="outSine">{ sprintf( __( 'Ease Out %s', 'interactions' ), __( 'Sine', 'interactions' ) ) }</option>
				<option value="outExpo">{ sprintf( __( 'Ease Out %s', 'interactions' ), __( 'Expo', 'interactions' ) ) }</option>
				<option value="outCirc">{ sprintf( __( 'Ease Out %s', 'interactions' ), __( 'Circ', 'interactions' ) ) + ' (' + __( 'default', 'interactions' ) + ')' }</option>
				<option value="outBack">{ sprintf( __( 'Ease Out %s', 'interactions' ), __( 'Back', 'interactions' ) ) }</option>
				<option value="outBounce">{ sprintf( __( 'Ease Out %s', 'interactions' ), __( 'Bounce', 'interactions' ) ) }</option>
			</optgroup>
			<optgroup label="Ease In Out">
				<option value="inOutQuad">{ sprintf( __( 'Ease In Out %s', 'interactions' ), __( 'Quad', 'interactions' ) ) }</option>
				<option value="inOutCubic">{ sprintf( __( 'Ease In Out %s', 'interactions' ), __( 'Cubic', 'interactions' ) ) }</option>
				<option value="inOutQuart">{ sprintf( __( 'Ease In Out %s', 'interactions' ), __( 'Quart', 'interactions' ) ) }</option>
				<option value="inOutQuint">{ sprintf( __( 'Ease In Out %s', 'interactions' ), __( 'Quint', 'interactions' ) ) }</option>
				<option value="inOutSine">{ sprintf( __( 'Ease In Out %s', 'interactions' ), __( 'Sine', 'interactions' ) ) }</option>
				<option value="inOutExpo">{ sprintf( __( 'Ease In Out %s', 'interactions' ), __( 'Expo', 'interactions' ) ) }</option>
				<option value="inOutCirc">{ sprintf( __( 'Ease In Out %s', 'interactions' ), __( 'Circ', 'interactions' ) ) }</option>
				<option value="inOutBack">{ sprintf( __( 'Ease In Out %s', 'interactions' ), __( 'Back', 'interactions' ) ) }</option>
				<option value="inOutBounce">{ sprintf( __( 'Ease In Out %s', 'interactions' ), __( 'Bounce', 'interactions' ) ) }</option>
			</optgroup>
			<optgroup label="Ease Out In">
				<option value="outInQuad">{ sprintf( __( 'Ease Out In %s', 'interactions' ), __( 'Quad', 'interactions' ) ) }</option>
				<option value="outInCubic">{ sprintf( __( 'Ease Out In %s', 'interactions' ), __( 'Cubic', 'interactions' ) ) }</option>
				<option value="outInQuart">{ sprintf( __( 'Ease Out In %s', 'interactions' ), __( 'Quart', 'interactions' ) ) }</option>
				<option value="outInQuint">{ sprintf( __( 'Ease Out In %s', 'interactions' ), __( 'Quint', 'interactions' ) ) }</option>
				<option value="outInSine">{ sprintf( __( 'Ease Out In %s', 'interactions' ), __( 'Sine', 'interactions' ) ) }</option>
				<option value="outInExpo">{ sprintf( __( 'Ease Out In %s', 'interactions' ), __( 'Expo', 'interactions' ) ) }</option>
				<option value="outInCirc">{ sprintf( __( 'Ease Out In %s', 'interactions' ), __( 'Circ', 'interactions' ) ) }</option>
				<option value="outInBack">{ sprintf( __( 'Ease Out In %s', 'interactions' ), __( 'Back', 'interactions' ) ) }</option>
				<option value="outInBounce">{ sprintf( __( 'Ease Out In %s', 'interactions' ), __( 'Bounce', 'interactions' ) ) }</option>
			</optgroup>
		</>
	)
}

export default EasingOptions
