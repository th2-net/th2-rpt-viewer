import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { BACKGROUND_COLORS, COLORS } from '../search/SearchInput';
import { ChunkHeightData, PanelType } from '../../stores/JSONViewer/JSONViewerStore';
import { getChunk } from '../../helpers/JSONViewer';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';

const EmptyLeaf = ({
	chunkNode,
	type,
	nextNodeTimestamp,
	nextNodeChunk,
}: {
	chunkNode: ChunkHeightData;
	type: PanelType;
	nextNodeTimestamp?: number;
	nextNodeChunk?: number;
}) => {
	const JSONViewerStore = useJSONViewerStore();
	const borderSide = type === 'default' ? 'Right' : 'Left';
	const otherBorderSide = type === 'default' ? 'Left' : 'Right';

	const nextChunk = useMemo(
		() => nextNodeChunk || getChunk(nextNodeTimestamp, JSONViewerStore.сhunkInterval),
		[nextNodeChunk, nextNodeTimestamp, JSONViewerStore.сhunkInterval],
	);

	const chunkColor = useMemo(() => chunkNode.chunk % COLORS.length, [chunkNode.chunk]);
	const nextChunkColor = useMemo(() => nextChunk % COLORS.length, [nextChunk]);

	const isNextDifferentChunk = useMemo(
		() =>
			nextChunkColor === chunkColor &&
			nextChunk !== chunkNode.chunk &&
			chunkNode.chunk !== -1 &&
			nextChunk !== -1,
		[chunkNode.chunk, nextChunk, chunkColor, nextChunkColor],
	);

	return (
		<div
			className='leaf'
			style={{
				height: chunkNode.height,
				backgroundColor: BACKGROUND_COLORS[chunkNode.chunk % BACKGROUND_COLORS.length],
				[`border${borderSide}Color`]: COLORS[chunkColor],
				[`border${borderSide}Width`]: '5px',
				[`borderTop${borderSide}Radius`]: '0px',
				[`borderBottom${borderSide}Radius`]: '0px',
				[`borderBottomColor`]: COLORS[chunkColor],
				[`borderBottomWidth`]: isNextDifferentChunk ? '4px' : undefined,
				[`borderBottom${otherBorderSide}Radius`]: isNextDifferentChunk ? '0px' : undefined,
			}}
		/>
	);
};

export default observer(EmptyLeaf);
