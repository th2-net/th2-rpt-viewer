import React, { useEffect } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { observer } from 'mobx-react-lite';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import StateSaverProvider from '../util/StateSaverProvider';
import { NotebookNode, TreeNode } from '../../models/JSONSchema';
import TreeLeaf from './TreeLeaf';
import NotebookParamsCell from './NotebookParamsCell';
import { PanelType } from '../../stores/JSONViewer/JSONViewerStore';

const TreeList = ({ type }: { type: PanelType }) => {
	const JSONViewerStore = useJSONViewerStore();

	const virtuoso = React.useRef<VirtuosoHandle>(null);

	const computeTreeKey = React.useCallback(
		(index: number, dataNode: TreeNode | NotebookNode) =>
			`${
				'id' in dataNode
					? `${dataNode.id}-${dataNode.viewType}-${JSONViewerStore.openTreeNodes[type].has(
							dataNode.id,
					  )}`
					: dataNode.name
			}`,
		[],
	);

	const renderTree = React.useCallback((index: number, dataNode: TreeNode | NotebookNode) => {
		if ('id' in dataNode) return <TreeLeaf treeNode={dataNode} type={type} />;
		return <NotebookParamsCell notebookProp={dataNode} type={type} />;
	}, []);

	useEffect(() => {
		virtuoso.current?.scrollToIndex(JSONViewerStore.activeIndex[type]);
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
