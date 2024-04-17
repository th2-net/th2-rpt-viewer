import React from 'react';
import { observer } from 'mobx-react-lite';
import '../../styles/JSONviewer.scss';
import { TreeNode, TreeViewType, ViewInstruction } from '../../models/JSONSchema';
import { createBemBlock } from '../../helpers/styleCreators';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import JSONView from './JSONView';

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

	if (JSONViewerStore.viewType !== TreeViewType.EVENTS_LIST) {
		return (
			<div className='message-card-wrapper'>
				<div className='mc__mc-body mc-body'>
					<JSONView
						isBeautified={JSONViewerStore.viewType === TreeViewType.PRETTY}
						node={treeNode}
					/>
				</div>
			</div>
		);
	}

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

	const complexFieldsDisplay = () => {
		if (treeNode.complexFields.length === 0) return '';
		return (
			<span title={treeNode.isArray ? 'Elements amount' : `Complex Fields amount`}>
				{treeNode.isArray ? '[' : '{'}
				{treeNode.complexFields.length}
				{treeNode.isArray ? ']' : '}'}
			</span>
		);
	};

	const simpleFieldsDisplay = () => {
		if (treeNode.simpleFields.length === 0) return '';
		return <span title={`Simple Fields amount`}>({treeNode.simpleFields.length})</span>;
	};

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
					{treeNode.key} {complexFieldsDisplay()} {simpleFieldsDisplay()}
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
