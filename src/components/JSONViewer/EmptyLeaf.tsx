import React from 'react';
import { observer } from 'mobx-react-lite';
import { BACKGROUND_COLORS, COLORS } from '../search/SearchInput';
import { ChunkHeightData, PanelType } from '../../stores/JSONViewer/JSONViewerStore';

const EmptyLeaf = ({ chunkNode, type }: { chunkNode: ChunkHeightData; type: PanelType }) => {
	const borderSide = type === 'default' ? 'Right' : 'Left';

	return (
		<div
			className='leaf'
			style={{
				height: chunkNode.height,
				backgroundColor: BACKGROUND_COLORS[chunkNode.chunk % BACKGROUND_COLORS.length],
				[`border${borderSide}Color`]: COLORS[chunkNode.chunk % COLORS.length],
				[`border${borderSide}Width`]: '5px',
				[`borderTop${borderSide}Radius`]: '0px',
				[`borderBottom${borderSide}Radius`]: '0px',
			}}
		/>
	);
};

export default observer(EmptyLeaf);
