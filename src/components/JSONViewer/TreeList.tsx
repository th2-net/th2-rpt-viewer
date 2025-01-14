import React, { useEffect } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { observer } from 'mobx-react-lite';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import StateSaverProvider from '../util/StateSaverProvider';
import { NotebookNode, TreeNode } from '../../models/JSONSchema';
import TreeLeaf from './TreeLeaf';
import NotebookParamsCell from './NotebookParamsCell';
import { ChunkHeightData, PanelType } from '../../stores/JSONViewer/JSONViewerStore';
import EmptyLeaf from './EmptyLeaf';

const TreeList = ({ type }: { type: PanelType }) => {
	const JSONViewerStore = useJSONViewerStore();

	const virtuoso = React.useRef<VirtuosoHandle>(null);

	const computeTreeKey = React.useCallback(
		(index: number, dataNode: TreeNode | NotebookNode | ChunkHeightData) =>
			`${
				'id' in dataNode
					? `${dataNode.id}-${dataNode.viewType}-${JSONViewerStore.openTreeNodes[type].has(
							dataNode.id,
					  )}`
					: 'lastElement' in dataNode
					? `${dataNode.chunk}-${dataNode.firstElement}-${dataNode.lastElement}-${dataNode.height}`
					: dataNode.name
			}`,
		[],
	);

	const renderTree = React.useCallback(
		(index: number, dataNode: TreeNode | NotebookNode | ChunkHeightData) => {
			if ('id' in dataNode) {
				const nextNode = JSONViewerStore.listData[type][index + 1];
				const nextTimestamp = nextNode && 'id' in nextNode ? nextNode.displayTimestamp : undefined;
				const nextChunk = nextNode && 'lastElement' in nextNode ? nextNode.chunk : undefined;
				return (
					<TreeLeaf
						treeNode={dataNode}
						type={type}
						nextNodeTimestamp={nextTimestamp}
						nextNodeChunk={nextChunk}
					/>
				);
			}
			if ('lastElement' in dataNode) {
				const nextNode = JSONViewerStore.listData[type][index + 1];
				const nextTimestamp = nextNode && 'id' in nextNode ? nextNode.displayTimestamp : undefined;
				const nextChunk = nextNode && 'lastElement' in nextNode ? nextNode.chunk : undefined;
				return (
					<EmptyLeaf
						chunkNode={dataNode}
						type={type}
						nextNodeTimestamp={nextTimestamp}
						nextNodeChunk={nextChunk}
					/>
				);
			}
			return <NotebookParamsCell notebookProp={dataNode} type={type} />;
		},
		[],
	);

	useEffect(() => {
		if (JSONViewerStore.activeIndex[type] !== -1) {
			virtuoso.current?.scrollToIndex(JSONViewerStore.activeIndex[type]);
			JSONViewerStore.activeIndex = {
				...JSONViewerStore.activeIndex,
				[type]: -1,
			};
		}
	}, [JSONViewerStore.activeIndex[type]]);

	return (
		<StateSaverProvider>
			<Virtuoso
				ref={virtuoso}
				className='JSON-virtuoso'
				data={JSONViewerStore.listData[type]}
				totalCount={JSONViewerStore.listData[type].length}
				computeItemKey={computeTreeKey}
				overscan={3}
				itemContent={renderTree}
			/>
		</StateSaverProvider>
	);
};

export default observer(TreeList);
