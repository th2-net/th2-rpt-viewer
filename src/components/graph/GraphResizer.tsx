import * as React from 'react';
import { useActiveWorkspace } from '../../hooks';
import { isWorkspaceStore } from '../../helpers/workspace';

export const GraphResizer = () => {
	const activeWorkspace = useActiveWorkspace();

	const changeInterval = (interval: number) => {
		if (isWorkspaceStore(activeWorkspace)) activeWorkspace.graphStore.setGraphInterval(interval);
		setActiveButton(interval);
	};

	const [activeButton, setActiveButton] = React.useState(
		(isWorkspaceStore(activeWorkspace) && activeWorkspace.graphStore.graphInterval) || 15,
	);

	return isWorkspaceStore(activeWorkspace) ? (
		<div className='graph-resizer'>
			<button
				className='graph-button'
				disabled={activeButton === 15}
				onClick={() => changeInterval(15)}>
				X1
			</button>
			<button
				className='graph-button'
				disabled={activeButton === 3}
				onClick={() => changeInterval(3)}>
				X5
			</button>
			<button
				className='graph-button'
				disabled={activeButton === 1.5}
				onClick={() => changeInterval(1.5)}>
				X10
			</button>
		</div>
	) : (
		<div />
	);
};
