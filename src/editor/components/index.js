export { default as ColorControl } from './color-control'
export { default as LocationRules } from './location-rules'
export { default as Timeline } from './timeline'
export { default as InteractionPanel } from './interaction-panel'
export { default as InteractionButton } from './interaction-button'
export { default as AddInteractionPopover } from './add-interaction-popover'
export { default as AddInteractionButton } from './add-interaction-button'
export { default as AddActionButton } from './add-action-button'
export { default as TargetSelector } from './target-selector'
export { default as ImportExportModal } from './import-export-modal'
export { default as GuidedModalTour } from './guided-modal-tour'

export const GridLayout = props => {
	const {
		columns,
		alignItems = 'center',
		...rest
	} = props
	return (
		<div
			{ ...rest }
			style={ {
				display: 'grid',
				gridGap: '8px',
				gridTemplateColumns: columns || '1fr 1fr',
				alignItems,
			} }
		/>
	)
}

const EMPTYOBJ = {}
export const FlexLayout = props => {
	const {
		justifyContent = 'space-between',
		alignItems = 'center',
		gridGap = '8px',
		style = EMPTYOBJ,
		...rest
	} = props
	return (
		<div
			{ ...rest }
			style={ {
				display: 'flex',
				justifyContent,
				alignItems,
				gridGap,
				...style,
			} }
		/>
	)
}

export const Separator = () => {
	return <div
		style={ {
			height: '1px',
			backgroundColor: '#ddd',
			margin: '16px -16px',
		} }
	/>
}
