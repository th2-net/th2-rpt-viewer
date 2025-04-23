/** ****************************************************************************
 * Copyright 2024-2025 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

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
					? `${dataNode.id}-${dataNode.viewType}-${JSONViewerStore.isOpenNode(dataNode.id, type)}`
					: 'lastElement' in dataNode
					? `${dataNode.chunk}-${dataNode.firstElement}-${dataNode.lastElement}-${dataNode.height}`
					: dataNode.name
			}`,
		[],
	);

	const renderTree = React.useCallback(
		(index: number, dataNode: TreeNode | NotebookNode | ChunkHeightData) => {
			if ('id' in dataNode) {
				return <TreeLeaf treeNode={dataNode} type={type} />;
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
