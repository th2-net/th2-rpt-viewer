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
import { Virtuoso } from 'react-virtuoso';
import { computed } from 'mobx';
import WorkspaceSplitter from './WorkspaceSplitter';
import '../../styles/workspace.scss';
import { TreeNode, TreeViewType } from '../../models/JSONSchema';
import TablePanel from '../JSONViewer/TablePanel';
import useJSONViewerWorkspace from '../../hooks/useJSONViewerWorkspace';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import FileChoosing from '../JSONViewer/FileChoosing';
import NotebookParamsCell from '../JSONViewer/NotebookParamsCell';
import TreePanel from '../JSONViewer/TreePanel';
import { parseText } from '../../helpers/JSONViewer';
import StateSaverProvider from '../util/StateSaverProvider';

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

const JSONViewerWorkspace = () => {
	const JSONViewerWorkspaceStore = useJSONViewerWorkspace();
	const { panelsLayout, setPanelsLayout, resetToDefaulLayout, collapsePanel } =
		JSONViewerWorkspaceStore.viewStore;
	const JSONViewerStore = useJSONViewerStore();
	const inputRef = React.useRef<HTMLInputElement>(null);

	const onSubmit = (trees: TreeNode[], notebooks: string[]) => {
		JSONViewerStore.setTreeNodes(trees);
		if (JSONViewerStore.viewType === TreeViewType.EVENTS_LIST && trees.length > 0)
			JSONViewerStore.selectTreeNode(trees[0]);
		JSONViewerStore.setNotebooks(notebooks);
		JSONViewerStore.setIsModalOpen(false);
	};

	const readFile = async (files: FileList) => {
		const promises: Promise<string>[] = [];
		for (let i = 0; i < files.length; i++) {
			const file = files.item(i);
			if (file) {
				promises.push(file.text());
			}
		}
		const nodes: TreeNode[][] = (await Promise.all(promises)).map((text, ind) => {
			try {
				const file = files.item(ind);
				return parseText(text, file ? file.name : '');
			} catch {
				const lines = text.split('\n');
				const data: TreeNode[] = [];
				for (let i = 0; i < lines.length; i++) {
					if (lines[i] !== '') data.push(...parseText(lines[i]));
				}
				return data;
			}
		});
		const reduced = nodes.reduce((result, current) => result.concat(current), []);
		JSONViewerStore.setTreeNodes(reduced);
		if (JSONViewerStore.viewType === TreeViewType.EVENTS_LIST && reduced.length > 0)
			JSONViewerStore.selectTreeNode(reduced[0]);
	};

	const computeTreeKey = React.useCallback(
		(index: number, dataNode: TreeNode | string) =>
			`${index}/${typeof dataNode === 'string' ? dataNode : dataNode.id}`,
		[],
	);

	const renderTree = React.useCallback((index: number, dataNode: TreeNode | string) => {
		if (typeof dataNode === 'string') return <NotebookParamsCell notebook={dataNode} />;
		return <TreePanel nest={0} treeNode={dataNode} prevKey={`${index}/${dataNode.key}`} />;
	}, []);

	const setView = (v: string) => {
		JSONViewerStore.setView(v);
		if (v !== TreeViewType.EVENTS_LIST) {
			setPanelsLayout([100, 0]);
		} else setPanelsLayout([50, 50]);
	};

	const treePanel = React.useMemo(
		() =>
			computed(() => ({
				title: 'Tree',
				color: panelColors.tree,
				component: (
					<div className='JSON-wrapper' style={{ gap: '1px' }}>
						<div className='JSON-buttons-wrapper'>
							<button
								className='load-JSON-button'
								onClick={() => JSONViewerStore.setIsModalOpen(!JSONViewerStore.isModalOpen)}>
								Load File(s) From Server
							</button>
							<button className='load-JSON-button' onClick={() => inputRef.current?.click()}>
								Load Local File(s)
							</button>
							<div style={{ display: 'flex', flexDirection: 'column' }}>
								<label htmlFor='TreeViewType'>Display Type</label>
								<select id='TreeViewType' onChange={e => setView(e.target.value)}>
									<option value={TreeViewType.EVENTS_LIST}>{TreeViewType.EVENTS_LIST}</option>
									<option value={TreeViewType.JSON}>{TreeViewType.JSON}</option>
									<option value={TreeViewType.PRETTY}>{TreeViewType.PRETTY}</option>
								</select>
							</div>
						</div>
						<input
							hidden
							ref={inputRef}
							style={{ marginBottom: 10 }}
							type='file'
							accept='.json'
							multiple
							onChange={ev => {
								if (ev.target.files) {
									readFile(ev.target.files);
									if (inputRef.current) inputRef.current.value = '';
								}
							}}
						/>
						{JSONViewerStore.isModalOpen && (
							<FileChoosing
								onSubmit={onSubmit}
								close={() => JSONViewerStore.setIsModalOpen(false)}
							/>
						)}
						<StateSaverProvider>
							<Virtuoso
								className='JSON-virtuoso'
								data={[...JSONViewerStore.notebooks, ...JSONViewerStore.treeNodes]}
								totalCount={JSONViewerStore.notebooks.length + JSONViewerStore.treeNodes.length}
								computeItemKey={computeTreeKey}
								overscan={3}
								itemContent={renderTree}
								style={{ height: 'calc(100% - 47px)' }}
							/>
						</StateSaverProvider>
					</div>
				),
				isActive: false,
			})),
		[
			JSONViewerStore.treeNodes,
			JSONViewerStore.notebooks,
			JSONViewerStore.isModalOpen,
			JSONViewerStore.selectedTreeNode,
		],
	).get();

	const tablePanel = React.useMemo(
		() =>
			computed(() => ({
				title: `Table`,
				color: panelColors.table,
				component: (
					<div className='JSON-wrapper tableView'>
						<TablePanel node={JSONViewerStore.selectedTreeNode} />
					</div>
				),
				isActive: false,
			})),
		[JSONViewerStore.selectTreeNode],
	).get();

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
};

export default observer(JSONViewerWorkspace);
