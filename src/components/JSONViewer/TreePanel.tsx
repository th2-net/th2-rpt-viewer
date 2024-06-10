import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import '../../styles/JSONviewer.scss';
import { TreeNode, TreeViewType, ViewInstruction } from '../../models/JSONSchema';
import { createBemBlock } from '../../helpers/styleCreators';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import JSONView from './JSONView';
import LeafTools from './LeafTools';

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
	const [viewType, setViewType] = React.useState(TreeViewType.EVENTS_LIST);
	const [open, setOpen] = React.useState(false);
	const nodeName = useMemo(() => {
		if (treeNode.displayName) return treeNode.displayName;
		if (treeNode.key && !(treeNode.isGeneratedKey && !treeNode.isRoot)) return treeNode.key;
		return 'no display name';
	}, [treeNode.displayName, treeNode.key, treeNode.isGeneratedKey]);

	const complexFieldsDisplay = () => (
		<span title={treeNode.isArray ? 'Complex Elements amount' : `Complex Fields amount`}>
			{treeNode.isArray ? '[' : '{'}
			{treeNode.complexFields.length}
			{treeNode.isArray ? ']' : '}'}
		</span>
	);

	const simpleFieldsDisplay = () => (
		<span title={treeNode.isArray ? 'Simple Elements amount' : `Simple Fields amount`}>
			({treeNode.simpleFields.length})
		</span>
	);

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
						title={nodeName}
						onClick={() => {
							JSONViewerStore.selectTreeNode(treeNode);
						}}>
						<div
							style={{
								display: 'flex',
								gap: 5,
								alignItems: 'center',
							}}>
							<div className={createBemBlock('event-status-icon')} />
							<span style={{ color: treeNode.isGeneratedKey ? '#333333' : undefined }}>
								{nodeName}
							</span>{' '}
							<span style={{ color: '#333333' }}>
								{complexFieldsDisplay()} {simpleFieldsDisplay()}
							</span>
						</div>
						<LeafTools
							activeViewType={viewType}
							toggleViewType={setViewType}
							viewTypes={[TreeViewType.EVENTS_LIST, TreeViewType.JSON, TreeViewType.PRETTY]}
						/>
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<div
				className={createBemBlock(
					'leaf',
					viewType === TreeViewType.JSON || viewType === TreeViewType.PRETTY ? 'expanded' : null,
					treeNode.id === JSONViewerStore.selectedTreeNode.id ? 'selected' : null,
				)}>
				<div className='leafWrapper'>
					<div
						style={{ width: `${20 * nest + (treeNode.complexFields.length === 0 ? 23 : 0)}px` }}
					/>
					{treeNode.complexFields.length > 0 && (
						<div
							className={createBemBlock('expand-icon', open ? 'expanded' : 'hidden')}
							onClick={() => setOpen(!open)}
						/>
					)}
					<div
						className={createBemBlock('valueLeaf')}
						title={nodeName}
						onClick={() => {
							JSONViewerStore.selectTreeNode(treeNode);
						}}>
						<div
							style={{
								display: 'flex',
								gap: 5,
								alignItems: 'center',
							}}>
							<div className={createBemBlock('event-status-icon')} />
							<span style={{ color: treeNode.isGeneratedKey ? '#333333' : undefined }}>
								{nodeName}
							</span>{' '}
							<span style={{ color: '#333333' }}>
								{complexFieldsDisplay()} {simpleFieldsDisplay()}
							</span>
						</div>
						{!(treeNode.isRoot && treeNode.isGeneratedKey) && (
							<LeafTools
								activeViewType={viewType}
								toggleViewType={setViewType}
								viewTypes={[TreeViewType.EVENTS_LIST, TreeViewType.JSON, TreeViewType.PRETTY]}
							/>
						)}
					</div>
				</div>
				{(viewType === TreeViewType.JSON || viewType === TreeViewType.PRETTY) && (
					<div className='message-card-wrapper'>
						<div className='mc__mc-body mc-body'>
							<JSONView isBeautified={viewType === TreeViewType.PRETTY} node={treeNode} />
						</div>
					</div>
				)}
			</div>
			{open &&
				treeNode.complexFields.map(field => (
					<TreePanel
						nest={nest + 1}
						treeNode={field}
						key={`${field.id}`}
						prevKey={prevKey ? prevKey + field.key : treeNode.key + field.key}
					/>
				))}
		</>
	);
};

export default observer(TreePanel);
