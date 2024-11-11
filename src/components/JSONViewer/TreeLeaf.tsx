import React, { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import '../../styles/JSONviewer.scss';
import { TreeNode, TreeViewType } from '../../models/JSONSchema';
import { createBemBlock } from '../../helpers/styleCreators';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import JSONView from './JSONView';
import LeafTools from './LeafTools';
import DisplayTable from './DisplayTable';
import multiTokenSplit from '../../helpers/search/multiTokenSplit';
import { BACKGROUND_COLORS, COLORS } from '../search/SearchInput';
import { formatTime } from '../../helpers/date';
import { Chip } from '../Chip';

const TreeLeaf = ({ treeNode, type }: { treeNode: TreeNode; type: 'left' | 'right' }) => {
	const JSONViewerStore = useJSONViewerStore();
	const isDefault = type === 'left';
	const isSelected = isDefault
		? treeNode.id === JSONViewerStore.selectedTreeNode.id
		: treeNode.id === JSONViewerStore.selectedCompareNode.id;
	const viewType = treeNode.viewType || TreeViewType.EVENTS_LIST;
	const [open, setOpen] = React.useState(
		viewType === TreeViewType.DISPLAY_TABLE || isDefault
			? JSONViewerStore.openTreeNodes.has(treeNode.id)
			: JSONViewerStore.openComparableNodes.has(treeNode.id),
	);

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

	const chunk = useMemo(
		() =>
			treeNode.displayTimestamp
				? Math.floor(treeNode.displayTimestamp / JSONViewerStore.getChunkSize) % COLORS.length
				: null,
		[treeNode.displayTimestamp, JSONViewerStore.getChunkSize],
	);

	const borderSide = isDefault ? 'Right' : 'Left';

	const borderStyle = {
		[`border${borderSide}Color`]: chunk !== null ? COLORS[chunk] : undefined,
		[`border${borderSide}Width`]: chunk !== null ? '5px' : undefined,
		[`borderTop${borderSide}Radius`]: chunk !== null ? '0px' : undefined,
		[`borderBottom${borderSide}Radius`]: chunk !== null ? '0px' : undefined,
	};

	const splitContent = multiTokenSplit(nodeName, JSONViewerStore.tokens);

	useEffect(() => {
		const isChildDisplay =
			(treeNode.isRoot || viewType === TreeViewType.EVENTS_LIST) &&
			(isDefault
				? JSONViewerStore.openTreeNodes.has(treeNode.id)
				: JSONViewerStore.openComparableNodes.has(treeNode.id));
		if (isChildDisplay) {
			if (isDefault) JSONViewerStore.openNode(treeNode.id);
			else JSONViewerStore.openCompareNode(treeNode.id);
		} else if (isDefault) JSONViewerStore.closeNode(treeNode.id);
		else JSONViewerStore.closeCompareNode(treeNode.id);
		setOpen(viewType === TreeViewType.DISPLAY_TABLE || isChildDisplay);
	}, [viewType]);

	useEffect(() => {
		setOpen(
			viewType === TreeViewType.DISPLAY_TABLE ||
				(isDefault
					? JSONViewerStore.openTreeNodes.has(treeNode.id)
					: JSONViewerStore.openComparableNodes.has(treeNode.id)),
		);
	}, [JSONViewerStore.openTreeNodes.values, JSONViewerStore.openComparableNodes.values]);

	const toggleNode = () => {
		if (open) {
			setOpen(false);
			if (isDefault) JSONViewerStore.closeNode(treeNode.id);
			else JSONViewerStore.closeCompareNode(treeNode.id);
		} else {
			setOpen(true);
			if (viewType !== TreeViewType.DISPLAY_TABLE) {
				if (isDefault) JSONViewerStore.openNode(treeNode.id);
				else JSONViewerStore.openCompareNode(treeNode.id);
			}
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
			if (isDefault) JSONViewerStore.setGroupView(treeNode.id, newType);
			else JSONViewerStore.setCompareGroupView(treeNode.id, newType);
		} else if (isDefault) JSONViewerStore.setNodeView(treeNode.id, newType);
		else JSONViewerStore.setCompareNodeView(treeNode.id, newType);
	};

	const selectNode = () => {
		if (isDefault) {
			JSONViewerStore.selectTreeNode(treeNode);
		} else {
			JSONViewerStore.selectCompareNode(treeNode);
		}
	};

	return (
		<>
			<div
				className={createBemBlock(
					'leaf',
					needBounding ? 'expanded' : null,
					isSelected ? 'selected' : null,
				)}
				style={{
					marginBottom: needBounding ? '5px' : undefined,
					backgroundColor: chunk !== null ? BACKGROUND_COLORS[chunk] : undefined,
					...borderStyle,
				}}>
				<div className='leafWrapper'>
					<div
						style={{
							width: `${
								20 * treeNode.parentIds.length +
								(treeNode.childIds.length === 0 && viewType !== TreeViewType.DISPLAY_TABLE ? 23 : 0)
							}px`,
						}}
					/>
					{((treeNode.childIds.length > 0 &&
						(treeNode.isRoot || viewType === TreeViewType.EVENTS_LIST)) ||
						viewType === TreeViewType.DISPLAY_TABLE) && (
						<div
							className={createBemBlock('expand-icon', open ? 'expanded' : 'hidden')}
							onClick={toggleNode}
						/>
					)}
					<div className={createBemBlock('valueLeaf')} title={nodeName} onClick={selectNode}>
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
						<div
							style={{ display: 'flex', minWidth: treeNode.displayTimestamp ? '135px' : '20px' }}>
							{treeNode.displayTimestamp && <Chip text={formatTime(treeNode.displayTimestamp)} />}
							<LeafTools
								activeViewType={viewType}
								toggleViewType={changeViewType}
								isRoot={treeNode.isRoot}
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
							/>
						</div>
					</div>
				</div>
				{!treeNode.isRoot && open && viewType === TreeViewType.DISPLAY_TABLE && (
					<DisplayTable value={treeNode.displayTable} />
				)}
				{!treeNode.isRoot &&
					(viewType === TreeViewType.JSON || viewType === TreeViewType.PRETTY) && (
						<div className='message-card-wrapper'>
							<div className='mc__mc-body mc-body'>
								<JSONView
									isBeautified={viewType === TreeViewType.PRETTY}
									node={treeNode}
									tokens={JSONViewerStore.tokens}
								/>
							</div>
						</div>
					)}
			</div>
		</>
	);
};

export default observer(TreeLeaf);
