import { useSelect } from '@wordpress/data'

const useDeviceType = () => {
	return useSelect( select => {
		// In some editors, there is no edit-post / preview device type. If that
		// happens, we just set our own internal device type.
		return select( 'core/edit-site' )?.__experimentalGetPreviewDeviceType() ||
			select( 'core/edit-post' )?.__experimentalGetPreviewDeviceType() ||
			'Desktop'
	}, [] )
}

export default useDeviceType
