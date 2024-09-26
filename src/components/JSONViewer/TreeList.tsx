import React from 'react';
import { Virtuoso } from 'react-virtuoso';
import { observer } from 'mobx-react-lite';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import StateSaverProvider from '../util/StateSaverProvider';
import { NotebookNode, TreeNode } from '../../models/JSONSchema';
import TreeLeaf from './TreeLeaf';
import NotebookParamsCell from './NotebookParamsCell';

const TreeList = ({ type }: { type: 'left' | 'right' }) => {
	const JSONViewerStore = useJSONViewerStore();

	const computeTreeKey = React.useCallback(
		(index: number, dataNode: TreeNode | NotebookNode) =>
			`${
				'id' in dataNode
					? `${dataNode.id}-${dataNode.viewType}-${JSONViewerStore.openTreeNodes.has(dataNode.id)}`
					: dataNode.name
			}`,
		[],
	);

	const renderTree = React.useCallback((index: number, dataNode: TreeNode | NotebookNode) => {
		if ('id' in dataNode) return <TreeLeaf treeNode={dataNode} type={type} />;
		return <NotebookParamsCell notebookProp={dataNode} />;
	}, []);

	return (
		<StateSaverProvider>
			<Virtuoso
				className='JSON-virtuoso'
				data={
					type === 'left'
						? [
								...JSONViewerStore.notebooks,
								...JSONViewerStore.treeNodes.filter(node =>
									node.parentIds.every(parentId => JSONViewerStore.openTreeNodes.has(parentId)),
								),
						  ]
						: [
								...JSONViewerStore.comparableFlatTreeNode.filter(node =>
									node.parentIds.every(parentId =>
										JSONViewerStore.openComparableNodes.has(parentId),
									),
								),
						  ]
				}
				totalCount={
					type === 'left'
						? JSONViewerStore.notebooks.length + JSONViewerStore.treeNodes.length
						: JSONViewerStore.treeNodes.length
				}
				computeItemKey={computeTreeKey}
				overscan={3}
				itemContent={renderTree}
			/>
		</StateSaverProvider>
	);
};

export default observer(TreeList);
