import React from 'react';
import { observer } from 'mobx-react-lite';
import '../../styles/JSONviewer.scss';
import { TreeNode, ViewInstruction } from '../../models/JSONSchema';
import { createBemBlock } from '../../helpers/styleCreators';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';

const TreePanel = ({
	nest,
	treeNode,
	prevKey,
}: {
	nest: number;
	treeNode: TreeNode;
	prevKey?: string;
}) => {
	const JSONViewerStore = useJSONViewerStore();
	const [open, setOpen] = React.useState(false);

	if (treeNode.viewInstruction === ViewInstruction.table) {
		return (
			<>
				<div className='leafWrapper'>
					<div style={{ width: `${20 * nest + 23}px` }} />
					<div
						className={createBemBlock(
							'valueLeaf',
							treeNode.failed ? 'failed' : 'passed',
							treeNode.id === JSONViewerStore.selectedTreeNode.id ? 'selected' : null,
						)}
						title={treeNode.key}
						onClick={() => {
							JSONViewerStore.selectTreeNode(treeNode);
						}}>
						<div className={createBemBlock('event-status-icon')} />
						{treeNode.key}
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<div className='leafWrapper'>
				<div style={{ width: `${20 * nest + (treeNode.complexFields.length === 0 ? 23 : 0)}px` }} />
				{treeNode.complexFields.length > 0 && (
					<div
						className={createBemBlock('expand-icon', open ? 'expanded' : 'hidden')}
						onClick={() => setOpen(!open)}
					/>
				)}
				<div
					className={createBemBlock(
						'valueLeaf',
						treeNode.failed ? 'failed' : 'passed',
						treeNode.id === JSONViewerStore.selectedTreeNode.id ? 'selected' : null,
					)}
					title={treeNode.key}
					onClick={() => {
						JSONViewerStore.selectTreeNode(treeNode);
					}}>
					<div
						className={createBemBlock('event-status-icon', treeNode.failed ? 'failed' : 'passed')}
					/>
					{treeNode.key}
				</div>
			</div>
			{open &&
				treeNode.complexFields.map(field => (
					<TreePanel
						nest={nest + 1}
						treeNode={field}
						key={prevKey ? prevKey + field.key : treeNode.key + field.key}
						prevKey={prevKey ? prevKey + field.key : treeNode.key + field.key}
					/>
				))}
		</>
	);
};

export default observer(TreePanel);
