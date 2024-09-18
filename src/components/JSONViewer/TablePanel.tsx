import React from 'react';
import { observer } from 'mobx-react-lite';
import { createBemBlock } from '../../helpers/styleCreators';
import Table from './Table';
import '../../styles/JSONviewer.scss';
import { TreeNode } from '../../models/JSONSchema';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import multiTokenSplit from '../../helpers/search/multiTokenSplit';

interface props {
	type: 'left' | 'right';
}

const TablePanel = ({ type }: props) => {
	const JSONViewerStore = useJSONViewerStore();
	const selectedNode = React.useMemo(
		() =>
			type === 'left' ? JSONViewerStore.selectedTreeNode : JSONViewerStore.selectedCompareNode,
		[JSONViewerStore.selectedTreeNode, JSONViewerStore.selectedCompareNode],
	);

	const getName = (treeNode: TreeNode) => {
		if (treeNode.displayName) return treeNode.displayName;
		if (treeNode.key && !(treeNode.isGeneratedKey && !treeNode.isRoot)) return treeNode.key;
		return 'no display name';
	};

	const getPanel = (treeNode: TreeNode) => (
		<>
			{treeNode.id !== '' && (
				<>
					{treeNode.id !== '' && getName(treeNode) !== '' && (
						<div
							className={createBemBlock('valueLeaf', 'header', 'selected')}
							style={{ cursor: 'default' }}
							title={getName(treeNode)}>
							<div
								className={createBemBlock(
									'event-status-icon',
									treeNode.failed ? 'failed' : 'passed',
								)}
							/>
							<div className={'title'} title={treeNode.key}>
								{multiTokenSplit(getName(treeNode), JSONViewerStore.tokens).map(
									(contentPart, index) => (
										<span
											key={index}
											className={contentPart.token != null ? 'found-content' : undefined}
											style={{ backgroundColor: contentPart.token?.color }}>
											{contentPart.content}
										</span>
									),
								)}
							</div>
						</div>
					)}
					<Table type={type === 'left' ? 'select' : 'compare'} />
					<br />
				</>
			)}
		</>
	);

	const selectedPanel = React.useMemo(
		() => getPanel(selectedNode),
		[selectedNode, type, JSONViewerStore.tokens],
	);

	return <div className='JSON-wrapper tableView'>{selectedPanel}</div>;
};

export default observer(TablePanel);
