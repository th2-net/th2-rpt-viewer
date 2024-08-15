import React, { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import '../../styles/JSONviewer.scss';
import { TreeNode, TreeViewType, ViewInstruction } from '../../models/JSONSchema';
import { createBemBlock } from '../../helpers/styleCreators';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import JSONView from './JSONView';
import LeafTools from './LeafTools';
import DisplayTable from './DisplayTable';
import multiTokenSplit from '../../helpers/search/multiTokenSplit';

const TreePanel = ({ treeNode }: { treeNode: TreeNode }) => {
	const JSONViewerStore = useJSONViewerStore();
	const [viewType, setViewType] = React.useState(treeNode.viewType || TreeViewType.EVENTS_LIST);
	const [open, setOpen] = React.useState(JSONViewerStore.openTreeNodes.has(treeNode.id));
	const nodeName = useMemo(() => {
		if (treeNode.displayName) return treeNode.displayName;
		if (treeNode.key && !(treeNode.isGeneratedKey && !treeNode.isRoot)) return treeNode.key;
		return 'no display name';
	}, [treeNode.displayName, treeNode.key, treeNode.isGeneratedKey]);
	const needBounding = useMemo(
		() =>
			(open && viewType === TreeViewType.DISPLAY_TABLE) ||
			viewType === TreeViewType.JSON ||
			viewType === TreeViewType.PRETTY,
		[open, viewType],
	);

	const splitContent = multiTokenSplit(nodeName, JSONViewerStore.tokens);

	useEffect(() => {
		const isChildDisplay =
			(treeNode.isRoot || viewType === TreeViewType.EVENTS_LIST) &&
			JSONViewerStore.openTreeNodes.has(treeNode.id);
		setOpen(viewType === TreeViewType.DISPLAY_TABLE || isChildDisplay);
		if (isChildDisplay) JSONViewerStore.openNode(treeNode.id);
		else JSONViewerStore.closeNode(treeNode.id);
	}, [viewType]);

	const toggleNode = () => {
		if (open) {
			setOpen(false);
			JSONViewerStore.closeNode(treeNode.id);
		} else {
			setOpen(true);
			if (viewType !== TreeViewType.DISPLAY_TABLE) JSONViewerStore.openNode(treeNode.id);
		}
	};

	const complexFieldsDisplay = () => (
		<span title={treeNode.isArray ? 'Complex Elements amount' : `Complex Fields amount`}>
			{treeNode.isArray ? '[' : '{'}
			{treeNode.childIds.length}
			{treeNode.isArray ? ']' : '}'}
		</span>
	);

	const simpleFieldsDisplay = () => (
		<span title={treeNode.isArray ? 'Simple Elements amount' : `Simple Fields amount`}>
			({treeNode.simpleFields.length})
		</span>
	);

	const changeViewType = (newType: TreeViewType) => {
		if (treeNode.isRoot) {
			JSONViewerStore.setGroupView(treeNode.id, newType);
		} else {
			JSONViewerStore.setNodeView(treeNode.id, newType);
		}
	};

	if (treeNode.viewInstruction === ViewInstruction.table) {
		return (
			<>
				<div className='leafWrapper'>
					<div style={{ width: `${20 * treeNode.parentIds.length + 23}px` }} />
					<div
						className={createBemBlock(
							'valueLeaf',
							treeNode.failed ? 'failed' : 'passed',
							treeNode.id === JSONViewerStore.selectedTreeNode.id ? 'selected' : null,
							treeNode.id === JSONViewerStore.comparableTreeNode.id ? 'compared' : null,
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
								{splitContent.map((contentPart, index) => (
									<span
										key={index}
										className={contentPart.token != null ? 'found-content' : undefined}
										style={{ backgroundColor: contentPart.token?.color }}>
										{contentPart.content}
									</span>
								))}
							</span>{' '}
							<span style={{ color: '#333333' }}>
								{complexFieldsDisplay()} {simpleFieldsDisplay()}
							</span>
						</div>
						<LeafTools
							activeViewType={viewType}
							viewTypes={[TreeViewType.EVENTS_LIST, TreeViewType.JSON, TreeViewType.PRETTY]}
							toggleViewType={setViewType}
							addNodeToCompare={() => JSONViewerStore.addNodeToCompare(treeNode)}
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
					needBounding ? 'expanded' : null,
					treeNode.id === JSONViewerStore.selectedTreeNode.id ? 'selected' : null,
					treeNode.id === JSONViewerStore.comparableTreeNode.id ? 'compared' : null,
				)}
				style={{
					marginBottom: needBounding ? '5px' : undefined,
				}}>
				<div className='leafWrapper'>
					<div
						style={{
							width: `${
								20 * treeNode.parentIds.length + (treeNode.childIds.length === 0 ? 23 : 0)
							}px`,
						}}
					/>
					{((treeNode.childIds.length > 0 && viewType === TreeViewType.EVENTS_LIST) ||
						viewType === TreeViewType.DISPLAY_TABLE) && (
						<div
							className={createBemBlock('expand-icon', open ? 'expanded' : 'hidden')}
							onClick={toggleNode}
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
								{splitContent.map((contentPart, index) => (
									<span
										key={index}
										className={contentPart.token != null ? 'found-content' : undefined}
										style={{ backgroundColor: contentPart.token?.color }}>
										{contentPart.content}
									</span>
								))}
							</span>{' '}
							<span style={{ color: '#333333' }}>
								{complexFieldsDisplay()} {simpleFieldsDisplay()}
							</span>
						</div>
						<LeafTools
							activeViewType={viewType}
							toggleViewType={changeViewType}
							viewTypes={
								treeNode.isRoot
									? [TreeViewType.DISPLAY_TABLE, TreeViewType.EVENTS_LIST, TreeViewType.JSON]
									: [
											TreeViewType.DISPLAY_TABLE,
											TreeViewType.EVENTS_LIST,
											TreeViewType.JSON,
											TreeViewType.PRETTY,
									  ]
							}
							addNodeToCompare={
								treeNode.isRoot ? undefined : () => JSONViewerStore.addNodeToCompare(treeNode)
							}
						/>
					</div>
				</div>
				{!treeNode.isRoot && open && viewType === TreeViewType.DISPLAY_TABLE && (
					<DisplayTable value={treeNode.displayTable} />
				)}
				{!treeNode.isRoot &&
					(viewType === TreeViewType.JSON || viewType === TreeViewType.PRETTY) && (
						<div className='message-card-wrapper'>
							<div className='mc__mc-body mc-body'>
								<JSONView isBeautified={viewType === TreeViewType.PRETTY} node={treeNode} />
							</div>
						</div>
					)}
			</div>
		</>
	);
};

export default observer(TreePanel);
