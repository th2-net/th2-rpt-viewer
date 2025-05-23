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

import React from 'react';
import { observer } from 'mobx-react-lite';
import { createBemBlock } from '../../helpers/styleCreators';
import Table from './Table';
import '../../styles/JSONviewer.scss';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import multiTokenSplit from '../../helpers/search/multiTokenSplit';
import { PanelType } from '../../stores/JSONViewer/JSONViewerStore';
import { TreeNode } from '../../stores/JSONViewer/TreeNode';

interface props {
	type: PanelType;
}

const TablePanel = ({ type }: props) => {
	const JSONViewerStore = useJSONViewerStore();
	const selectedNode = React.useMemo(
		() => JSONViewerStore.selectedTreeNode[type],
		[JSONViewerStore.selectedTreeNode[type]],
	);

	const getName = (treeNode: TreeNode) => {
		if (treeNode.displayName) return treeNode.displayName;
		if (treeNode.key && !(treeNode.isGeneratedKey && !treeNode.isRoot)) return treeNode.key;
		return 'no display name';
	};

	const getPanel = (treeNode: TreeNode) => (
		<>
			{treeNode.id !== Number.MIN_SAFE_INTEGER && (
				<>
					{treeNode.id !== Number.MIN_SAFE_INTEGER && getName(treeNode) !== '' && (
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
					<Table type={type} />
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
