/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
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

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import WorkspaceSplitter from './WorkspaceSplitter';
import '../../styles/workspace.scss';
import { Tree } from '../../models/JSONSchema';
import TreePanel from '../JSONViewer/TreePanel';
import TablePanel from '../JSONViewer/TablePanel';
import useJSONViewerWorkspace from '../../hooks/useJSONViewerWorkspace';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import FileChoosing from '../JSONViewer/FileChoosing';

const panelColors = {
	tree: {
		default: '#ADC2EB',
		active: '#5C85D6',
	},
	table: {
		default: '#CCA3F5',
		active: '#A65CD6',
	},
} as const;

function JSONViewerWorkspace() {
	const JSONViewerWorkspaceStore = useJSONViewerWorkspace();
	const { panelsLayout, setPanelsLayout, resetToDefaulLayout, collapsePanel } =
		JSONViewerWorkspaceStore.viewStore;
	const JSONViewerStore = useJSONViewerStore();

	const onSubmit = (tree: Tree) => {
		JSONViewerStore.setData(tree);
		JSONViewerStore.setIsModalOpen(false);
	};

	const treePanel = React.useMemo(
		() => ({
			title: 'Tree',
			color: panelColors.tree,
			component: (
				<div className='JSON-wrapper' style={{ gap: '1px' }}>
					<button
						className='load-JSON-button'
						onClick={() => JSONViewerStore.setIsModalOpen(!JSONViewerStore.isModalOpen)}>
						Load File
					</button>
					{JSONViewerStore.isModalOpen && (
						<FileChoosing onSubmit={onSubmit} close={() => JSONViewerStore.setIsModalOpen(false)} />
					)}
					<TreePanel
						node={JSONViewerStore.data}
						setNode={(nodeKey: string, nodeTree: Tree) =>
							JSONViewerStore.setNode([nodeKey, nodeTree])
						}
						parentsPath={''}
						parentKey={''}
						selectedNode={JSONViewerStore.node}
					/>
				</div>
			),
			isActive: false,
		}),
		[JSONViewerStore.data, JSONViewerStore.isModalOpen, JSONViewerStore.node],
	);

	const tablePanel = React.useMemo(
		() => ({
			title: `Table`,
			color: panelColors.table,
			component: (
				<div className='JSON-wrapper tableView'>
					<TablePanel node={JSONViewerStore.node} />
				</div>
			),
			isActive: false,
		}),
		[JSONViewerStore.node],
	);

	const viewerWorkspacePanels = React.useMemo(
		() => [treePanel, tablePanel],
		[treePanel, tablePanel],
	);

	return (
		<div className='workspace'>
			<WorkspaceSplitter
				panelsLayout={panelsLayout}
				setPanelsLayout={setPanelsLayout}
				panels={viewerWorkspacePanels}
				resetToDefaulLayout={resetToDefaulLayout}
				collapsePanel={collapsePanel}
			/>
		</div>
	);
}

export default observer(JSONViewerWorkspace);
