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

import React, { useEffect, useMemo, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import '../../styles/JSONviewer.scss';
import { TreeViewType } from '../../models/JSONSchema';
import { createBemBlock } from '../../helpers/styleCreators';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import JSONView from './JSONViewSimpleField';
import LeafTools from './LeafTools';
import DisplayTable from './DisplayTable';
import multiTokenSplit from '../../helpers/search/multiTokenSplit';
import { formatTime } from '../../helpers/date';
import { Chip } from '../Chip';
import { PanelType } from '../../stores/JSONViewer/JSONViewerStore';
import { getChunkId } from '../../helpers/JSONViewer';
import { TreeNode } from '../../stores/JSONViewer/TreeNode';

export const LEAF_COLORS = ['lightgray', 'black'];
export const LEAF_BACKGROUND_COLORS = ['white', 'gainsboro'];

const TreeLeaf = ({ treeNode, type }: { treeNode: TreeNode; type: PanelType }) => {
	const jsonViewerStore = useJSONViewerStore();
	const isSelected = treeNode.id === jsonViewerStore.selectedTreeNode[type].id;
	const viewType = treeNode.viewType || TreeViewType.EVENTS_LIST;
	const [open, setOpen] = React.useState(
		viewType === TreeViewType.DISPLAY_TABLE ||
			viewType === TreeViewType.JSON ||
			treeNode.isOpenInTree,
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

	const chunkId = useMemo(
		() => getChunkId(treeNode.displayTimestamp, jsonViewerStore.chunkInterval),
		[jsonViewerStore.chunkInterval],
	);

	const chunkColor = useMemo(
		() => jsonViewerStore.intervalsColor[chunkId],
		[chunkId, jsonViewerStore.intervalsColor],
	);

	const leafRef = useRef<HTMLDivElement>(null);
	const borderSide = type === 'default' ? 'Right' : 'Left';

	const borderStyle = {
		[`border${borderSide}Color`]: chunkId !== -1 ? LEAF_COLORS[chunkColor] : undefined,
		[`border${borderSide}Width`]: chunkId !== -1 ? '5px' : undefined,
		[`borderTop${borderSide}Radius`]: chunkId !== -1 ? '0px' : undefined,
		[`borderBottom${borderSide}Radius`]: chunkId !== -1 ? '0px' : undefined,
	};

	const splitContent = jsonViewerStore.compareNameResults(
		type,
		treeNode.id,
		multiTokenSplit(nodeName, jsonViewerStore.tokens),
	);

	useEffect(() => {
		setOpen(treeNode.isOpenInTree);
		if (viewType !== TreeViewType.EVENTS_LIST) {
			// eslint-disable-next-line no-param-reassign
			treeNode.children.forEach(child => (child.isOpenInTree = false));
		}
	}, [viewType]);

	useEffect(() => {
		setOpen(
			viewType === TreeViewType.DISPLAY_TABLE ||
				viewType === TreeViewType.JSON ||
				treeNode.isOpenInTree,
		);
	}, [treeNode.isOpenInTree]);

	useEffect(() => {
		const resizeObserver = new ResizeObserver(entries => {
			const height =
				entries[0].borderBoxSize?.length > 0
					? entries[0].borderBoxSize[0].blockSize
					: entries[0].contentRect.height;
			jsonViewerStore.updateNodeHeight(treeNode.id, height, type);
		});
		if (leafRef.current) {
			resizeObserver.observe(leafRef.current);
		}
		return () => {
			if (leafRef.current) resizeObserver.unobserve(leafRef.current);
		};
	}, []);

	const toggleNode = () => {
		if (open) {
			setOpen(false);
			// eslint-disable-next-line no-param-reassign
			treeNode.isOpenInTree = false;
		} else {
			setOpen(true);
			if (treeNode.isRoot) {
				// eslint-disable-next-line no-param-reassign
				treeNode.isOpenInTree = true;
				jsonViewerStore.openRootNodeOnly(treeNode, type);
				jsonViewerStore.scrollToId(treeNode.id, type);
				// eslint-disable-next-line no-param-reassign
			} else treeNode.isOpenInTree = true;
		}
	};

	const complexFieldsDisplay = () => (
		<span title={treeNode.isArray ? 'Complex Elements amount' : `Complex Fields amount`}>
			{treeNode.isArray ? '[' : '{'}
			{treeNode.children.length}
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
			jsonViewerStore.setGroupView(treeNode, newType, type);
			// eslint-disable-next-line no-param-reassign
		} else treeNode.viewType = newType;
	};

	const selectNode = () => {
		jsonViewerStore.selectTreeNode(type, treeNode);
	};

	return (
		<div
			ref={leafRef}
			className={createBemBlock(
				'leaf',
				needBounding ? 'expanded' : null,
				isSelected ? 'selected' : null,
			)}
			style={{
				backgroundColor: chunkId !== -1 ? LEAF_BACKGROUND_COLORS[chunkColor] : undefined,
				...borderStyle,
			}}>
			<div className={borderSide === 'Left' ? 'leafWrapper-right' : 'leafWrapper'}>
				{jsonViewerStore.isCompare && treeNode.displayTimestamp && borderSide === 'Left' && (
					<div
						title='Move to nearest chunk in other panel'
						className={`timestamp-pointer-left`}
						onClick={e => {
							e.preventDefault();
							jsonViewerStore.scrollToNearest(treeNode.displayTimestamp || -1, type);
						}}
					/>
				)}
				<div
					style={{
						width: `${
							20 * treeNode.level +
							(treeNode.children.length === 0 && viewType === TreeViewType.EVENTS_LIST ? 23 : 0) -
							(jsonViewerStore.isCompare && treeNode.displayTimestamp && borderSide === 'Left'
								? 12
								: 0)
						}px`,
					}}
				/>
				{((treeNode.children.length > 0 &&
					(treeNode.isRoot || viewType === TreeViewType.EVENTS_LIST)) ||
					viewType !== TreeViewType.EVENTS_LIST) && (
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
							{/* {treeNode.id} ={'>'} {treeNode.parentIds.join(', ')}{' '} */}
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
					<div style={{ display: 'flex', minWidth: treeNode.displayTimestamp ? '135px' : '20px' }}>
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
				{jsonViewerStore.isCompare && treeNode.displayTimestamp && borderSide === 'Right' && (
					<div
						title='Move to nearest chunk in other panel'
						className={`timestamp-pointer-right`}
						onClick={e => {
							e.preventDefault();
							jsonViewerStore.scrollToNearest(treeNode.displayTimestamp || -1, type);
						}}
					/>
				)}
			</div>
			{!treeNode.isRoot && open && viewType === TreeViewType.DISPLAY_TABLE && (
				<DisplayTable id={treeNode.id} value={treeNode.displayTable} type={type} />
			)}
			{!treeNode.isRoot &&
				open &&
				(viewType === TreeViewType.JSON || viewType === TreeViewType.PRETTY) && (
					<div className='message-card-wrapper'>
						<div className='mc__mc-body mc-body'>
							<JSONView
								type={type}
								isBeautified={viewType === TreeViewType.PRETTY}
								node={treeNode}
								tokens={jsonViewerStore.tokens}
							/>
						</div>
					</div>
				)}
		</div>
	);
};

export default observer(TreeLeaf);
