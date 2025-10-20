import { Popover } from '@wordpress/components'

const ActionPopover = props => {
	return (
		<Popover
			placement="right"
			offset={ 50 }
			noArrow={ false }
			className="interact-popover interact-action-popover"
		>
			{ props.children }
		</Popover>
	)
}

export default ActionPopover
