import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { ChunkHeightData, PanelType } from '../../stores/JSONViewer/JSONViewerStore';
import { getChunk } from '../../helpers/JSONViewer';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import { LEAF_BACKGROUND_COLORS, LEAF_COLORS } from './TreeLeaf';

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
		() => nextNodeChunk || getChunk(nextNodeTimestamp, JSONViewerStore.chunkInterval),
		[nextNodeChunk, nextNodeTimestamp, JSONViewerStore.chunkInterval],
	);

	const chunkColor = useMemo(
		() => JSONViewerStore.intervalsColor[chunkNode.chunk],
		[chunkNode.chunk],
	);
	const nextChunkColor = useMemo(() => JSONViewerStore.intervalsColor[nextChunk], [nextChunk]);

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
				backgroundColor: LEAF_BACKGROUND_COLORS[chunkColor],
				[`border${borderSide}Color`]: LEAF_COLORS[chunkColor],
				[`border${borderSide}Width`]: '5px',
				[`borderTop${borderSide}Radius`]: '0px',
				[`borderBottom${borderSide}Radius`]: '0px',
				[`borderBottomColor`]: LEAF_COLORS[chunkColor],
				[`borderBottomWidth`]: isNextDifferentChunk ? '4px' : undefined,
				[`borderBottom${otherBorderSide}Radius`]: isNextDifferentChunk ? '0px' : undefined,
				padding: '5px',
				flexDirection: 'row',
				justifyContent: borderSide === 'Left' ? 'flex-start' : 'flex-end',
				alignItems: 'center',
			}}>
			{/*
			{JSONViewerStore.isCompare && borderSide === 'Left' && (
				<div
					title='Move to nearest chunk in other panel'
					className={`timestamp-pointer-left`}
					onClick={e => {
						e.preventDefault();
						JSONViewerStore.scrollToNearest(chunkNode.chunk * JSONViewerStore.сhunkInterval, type);
					}}
				/>
			)}
			{JSONViewerStore.isCompare && borderSide === 'Right' && (
				<div
					title='Move to nearest chunk in other panel'
					className={`timestamp-pointer-right`}
					onClick={e => {
						e.preventDefault();
						JSONViewerStore.scrollToNearest(chunkNode.chunk * JSONViewerStore.сhunkInterval, type);
					}}
				/>
			)} 
			*/}
		</div>
	);
};

export default observer(EmptyLeaf);
