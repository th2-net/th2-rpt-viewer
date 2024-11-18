import React, { useEffect, useMemo, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import '../../styles/JSONviewer.scss';
import { TreeNode, TreeViewType } from '../../models/JSONSchema';
import { createBemBlock } from '../../helpers/styleCreators';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import JSONView from './JSONViewSimpleField';
import LeafTools from './LeafTools';
import DisplayTable from './DisplayTable';
import multiTokenSplit from '../../helpers/search/multiTokenSplit';
import { BACKGROUND_COLORS, COLORS } from '../search/SearchInput';
import { formatTime } from '../../helpers/date';
import { Chip } from '../Chip';
import { PanelType } from '../../stores/JSONViewer/JSONViewerStore';

const TreeLeaf = ({ treeNode, type }: { treeNode: TreeNode; type: PanelType }) => {
	const JSONViewerStore = useJSONViewerStore();
	const isSelected = treeNode.id === JSONViewerStore.selectedTreeNode[type].id;
	const viewType = treeNode.viewType || TreeViewType.EVENTS_LIST;
	const [open, setOpen] = React.useState(
		viewType === TreeViewType.DISPLAY_TABLE || JSONViewerStore.openTreeNodes[type].has(treeNode.id),
	);
	const convertType = type === 'default' ? 'compare' : 'default';

	const closeDisplayed = React.useMemo(
		() =>
			JSONViewerStore.displayedLeafs[convertType].find(leaf =>
				type === 'default' ? leaf.prevId === treeNode.id : leaf.nextId === treeNode.id,
			),
		[JSONViewerStore.displayedLeafs[convertType]],
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
				? Math.floor(treeNode.displayTimestamp / JSONViewerStore.сhunkInterval) % COLORS.length
				: null,
		[treeNode.displayTimestamp, JSONViewerStore.сhunkInterval],
	);

	const closeChunk = React.useMemo(
		() =>
			closeDisplayed
				? Math.floor(closeDisplayed.displayTimestamp / JSONViewerStore.сhunkInterval) %
				  COLORS.length
				: null,
		[closeDisplayed, JSONViewerStore.сhunkInterval],
	);

	const leafRef = useRef<HTMLDivElement>(null);
	const borderSide = type === 'default' ? 'Right' : 'Left';

	const borderStyle = {
		[`border${borderSide}Color`]: chunk !== null ? COLORS[chunk] : undefined,
		[`border${borderSide}Width`]: chunk !== null ? '5px' : undefined,
		[`borderTop${borderSide}Radius`]: chunk !== null ? '0px' : undefined,
		[`borderBottom${borderSide}Radius`]: chunk !== null ? '0px' : undefined,
	};

	const splitContent = multiTokenSplit(nodeName, JSONViewerStore.tokens[type]);

	useEffect(() => {
		const isChildDisplay =
			(treeNode.isRoot || viewType === TreeViewType.EVENTS_LIST) &&
			JSONViewerStore.openTreeNodes[type].has(treeNode.id);
		if (isChildDisplay) {
			JSONViewerStore.openNode(treeNode.id, type);
		} else JSONViewerStore.closeNode(treeNode.id, type);
		setOpen(viewType === TreeViewType.DISPLAY_TABLE || isChildDisplay);
	}, [viewType]);

	useEffect(() => {
		setOpen(
			viewType === TreeViewType.DISPLAY_TABLE ||
				JSONViewerStore.openTreeNodes[type].has(treeNode.id),
		);
	}, [JSONViewerStore.openTreeNodes[type].values]);

	useEffect(() => {
		if (treeNode.displayTimestamp)
			JSONViewerStore.addDisplayed(
				treeNode.id,
				treeNode.displayTimestamp,
				leafRef.current ? leafRef.current.clientHeight : 0,
				type,
			);

		return () => {
			if (treeNode.displayTimestamp) JSONViewerStore.removeDisplayed(treeNode.id, type);
		};
	}, []);

	useEffect(() => {
		if (treeNode.displayTimestamp) {
			JSONViewerStore.updateDisplayed(
				treeNode.id,
				leafRef.current ? leafRef.current.clientHeight : 0,
				type,
			);
		}
	}, [leafRef]);

	const toggleNode = () => {
		if (open) {
			setOpen(false);
			JSONViewerStore.closeNode(treeNode.id, type);
		} else {
			setOpen(true);
			if (viewType !== TreeViewType.DISPLAY_TABLE) {
				JSONViewerStore.openNode(treeNode.id, type);
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
			JSONViewerStore.setGroupView(treeNode.id, newType, type);
		} else JSONViewerStore.setNodeView(treeNode.id, newType, type);
	};

	const selectNode = () => {
		JSONViewerStore.selectTreeNode(type, treeNode);
	};

	return (
		<>
			{closeDisplayed && type === 'compare' && closeDisplayed.nextId === treeNode.id && (
				<div
					className='leaf'
					style={{
						height: closeDisplayed.height,
						backgroundColor: closeChunk !== null ? BACKGROUND_COLORS[closeChunk] : undefined,
						[`border${borderSide}Color`]: closeChunk !== null ? COLORS[closeChunk] : undefined,
						[`border${borderSide}Width`]: closeChunk !== null ? '5px' : undefined,
						[`borderTop${borderSide}Radius`]: closeChunk !== null ? '0px' : undefined,
						[`borderBottom${borderSide}Radius`]: closeChunk !== null ? '0px' : undefined,
					}}
				/>
			)}
			<div
				ref={leafRef}
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
					{JSONViewerStore.isCompare && treeNode.displayTimestamp && borderSide === 'Left' && (
						<div
							title='Move to nearest chunk in other panel'
							className={`timestamp-pointer-left`}
							onClick={e => {
								e.preventDefault();
								JSONViewerStore.scrollToNearest(treeNode.displayTimestamp || -1, type);
							}}
						/>
					)}
					<div
						style={{
							width: `${
								20 * treeNode.parentIds.length +
								(treeNode.childIds.length === 0 && viewType !== TreeViewType.DISPLAY_TABLE
									? 23
									: 0) -
								(JSONViewerStore.isCompare && treeNode.displayTimestamp && borderSide === 'Left'
									? 12
									: 0)
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
					{JSONViewerStore.isCompare && treeNode.displayTimestamp && borderSide === 'Right' && (
						<div
							title='Move to nearest chunk in other panel'
							className={`timestamp-pointer-right`}
							onClick={e => {
								e.preventDefault();
								JSONViewerStore.scrollToNearest(treeNode.displayTimestamp || -1, type);
							}}
						/>
					)}
				</div>
				{!treeNode.isRoot && open && viewType === TreeViewType.DISPLAY_TABLE && (
					<DisplayTable value={treeNode.displayTable} type={type} />
				)}
				{!treeNode.isRoot &&
					(viewType === TreeViewType.JSON || viewType === TreeViewType.PRETTY) && (
						<div className='message-card-wrapper'>
							<div className='mc__mc-body mc-body'>
								<JSONView
									isBeautified={viewType === TreeViewType.PRETTY}
									node={treeNode}
									tokens={JSONViewerStore.tokens[type]}
								/>
							</div>
						</div>
					)}
			</div>
			{closeDisplayed && type === 'default' && closeDisplayed.prevId === treeNode.id && (
				<div
					className='leaf'
					style={{
						height: closeDisplayed.height,
						backgroundColor: closeChunk !== null ? BACKGROUND_COLORS[closeChunk] : undefined,
						[`border${borderSide}Color`]: closeChunk !== null ? COLORS[closeChunk] : undefined,
						[`border${borderSide}Width`]: closeChunk !== null ? '5px' : undefined,
						[`borderTop${borderSide}Radius`]: closeChunk !== null ? '0px' : undefined,
						[`borderBottom${borderSide}Radius`]: closeChunk !== null ? '0px' : undefined,
					}}
				/>
			)}
		</>
	);
};

export default observer(TreeLeaf);
