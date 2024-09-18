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
import { computed } from 'mobx';
import { nanoid } from 'nanoid';
import WorkspaceSplitter from './WorkspaceSplitter';
import '../../styles/workspace.scss';
import { NotebookNode, TreeNode } from '../../models/JSONSchema';
import TablePanel from '../JSONViewer/TablePanel';
import { useJSONViewerWorkspace } from '../../hooks/useJSONViewerWorkspace';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import FileChoosing from '../JSONViewer/FileChoosing';
import { getFlatListFromTree, parseText } from '../../helpers/JSONViewer';
import { SearchInputBase } from '../search/SearchInput';
import TreeList from '../JSONViewer/TreeList';
import JSONPanel from '../JSONViewer/JSONPanel';

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
	const inputJSONRef = React.useRef<HTMLInputElement>(null);
	const inputSearchRef = React.useRef<HTMLInputElement>(null);

	const onSubmit = (nodes: TreeNode[], notebooks: NotebookNode[]) => {
		JSONViewerStore.setTreeNodes([]);
		JSONViewerStore.setNotebooks([]);
		JSONViewerStore.setTreeNodes(nodes.flatMap(node => getFlatListFromTree(node)));
		JSONViewerStore.selectTreeNode();
		if (nodes.length > 0) JSONViewerStore.selectTreeNode(nodes[0]);
		JSONViewerStore.setNotebooks(notebooks);
		JSONViewerStore.setIsModalOpen(false, JSONViewerStore.modalType);
	};

	const getFileContent = async (file: File): Promise<[string, string]> => [
		file.name,
		await file.text(),
	];

	const readFile = async (files: FileList) => {
		const promises: Promise<[string, string]>[] = [];
		for (let i = 0; i < files.length; i++) {
			const file = files.item(i);
			if (file) {
				promises.push(getFileContent(file));
			}
		}
		const nodes: TreeNode[] = (await Promise.all(promises)).map(([fileName, text]) => {
			const node: TreeNode = {
				id: nanoid(),
				parentIds: [],
				key: fileName,
				failed: false,
				viewInstruction: '',
				simpleFields: [],
				complexFields: [],
				childIds: [],
				isGeneratedKey: true,
				isRoot: true,
			};
			try {
				node.complexFields.push(...parseText(text, '0', true));
			} catch {
				const lines = text.split('\n');
				for (let i = 0; i < lines.length; i++) {
					if (lines[i] !== '') node.complexFields.push(...parseText(lines[i], String(i), true));
				}
			}
			return node;
		});
		JSONViewerStore.setTreeNodes(nodes.flatMap(node => getFlatListFromTree(node)));
		JSONViewerStore.setNotebooks([]);
		JSONViewerStore.selectTreeNode();
		if (nodes.length > 0) JSONViewerStore.selectTreeNode(nodes[0]);
	};

	const readSearchFile = async (files: FileList) => {
		const file = files.item(0);
		if (!file) return;
		const fileContent = await file.text();
		JSONViewerStore.updateTokensFromText(fileContent);
	};

	const treePanel = React.useMemo(
		() =>
			computed(() => ({
				title: 'Tree',
				color: panelColors.tree,
				component: (
					<div
						className='JSON-wrapper'
						style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
						<div className='JSON-header-wrapper'>
							<div className='JSON-buttons-wrapper'>
								<button
									className='load-JSON-button'
									title='Load Executable(s) From Server'
									onClick={() =>
										JSONViewerStore.setIsModalOpen(!JSONViewerStore.isModalOpen, 'notebooks')
									}>
									Load Executable(s) From Server
								</button>
								<button
									className='load-JSON-button'
									title='Load Result(s) From Server'
									onClick={() =>
										JSONViewerStore.setIsModalOpen(!JSONViewerStore.isModalOpen, 'results')
									}>
									Load Result(s) From Server
								</button>
								<button
									className='load-JSON-button'
									title='Load Local Result(s)'
									onClick={() => inputJSONRef.current?.click()}>
									Load Local Result(s)
								</button>
								<button className='load-JSON-button' onClick={() => JSONViewerStore.toggleMode()}>
									Switch mode to {JSONViewerStore.isCompare ? 'table' : 'compare'}
								</button>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
									}}>
									<label htmlFor='chunk-size'>Chunk interval:</label>
									<select
										name='intervals'
										id='chunk-size'
										onChange={e => {
											e.preventDefault();
											JSONViewerStore.updateInterval(Number(e.target.value));
										}}
										value={JSONViewerStore.chunkInterval}>
										<option value={10}>1 millisec</option>
										<option value={1000}>1 sec</option>
										<option value={60000}>1 min</option>
										<option value={600000}>10 min</option>
									</select>
								</div>
							</div>
							<div className='JSON-search-wrapper'>
								<SearchInputBase
									searchTokens={JSONViewerStore.tokens}
									resultsCount={0}
									currentIndex={JSONViewerStore.scrolledIndex}
									isLoading={false}
									updateSearchTokens={JSONViewerStore.updateTokens}
									nextSearchResult={JSONViewerStore.blankMethod}
									prevSearchResult={JSONViewerStore.blankMethod}
									clear={JSONViewerStore.clear}
									value={JSONViewerStore.inputValue}
									setValue={JSONViewerStore.setInputValue}
									disabled={true}
								/>
								<div
									className='import-JSON-button'
									onClick={() => inputSearchRef.current?.click()}
									title='Import Search'
								/>
								<div
									className='export-JSON-button'
									onClick={JSONViewerStore.exportSearch}
									title='Export Search'
								/>
							</div>
						</div>
						<input
							hidden
							ref={inputJSONRef}
							style={{ marginBottom: 10 }}
							type='file'
							accept='.jsonl'
							multiple
							onChange={ev => {
								if (ev.target.files) {
									readFile(ev.target.files);
									if (inputJSONRef.current) inputJSONRef.current.value = '';
								}
							}}
						/>
						<input
							hidden
							ref={inputSearchRef}
							style={{ marginBottom: 10 }}
							type='file'
							accept='.json'
							onChange={ev => {
								if (ev.target.files) {
									readSearchFile(ev.target.files);
									if (inputSearchRef.current) inputSearchRef.current.value = '';
								}
							}}
						/>
						{JSONViewerStore.isModalOpen && (
							<FileChoosing
								type={JSONViewerStore.modalType}
								multiple={true}
								onSubmit={onSubmit}
								close={() => JSONViewerStore.setIsModalOpen(false, JSONViewerStore.modalType)}
							/>
						)}
						{JSONViewerStore.isCompare ? (
							<div className='JSON-wrapper' style={{ gap: '1px' }}>
								<JSONPanel type='left' />
							</div>
						) : (
							<TreeList type='left' />
						)}
					</div>
				),
				isActive: true,
			})),
		[
			JSONViewerStore.treeNodes,
			JSONViewerStore.notebooks,
			JSONViewerStore.isModalOpen,
			JSONViewerStore.selectedTreeNode,
			JSONViewerStore.comparableTreeNode,
			JSONViewerStore.openTreeNodes,
			JSONViewerStore.tokens,
		],
	).get();

	const viewerWorkspacePanels = React.useMemo(
		() => [
			treePanel,
			{
				title: JSONViewerStore.isCompare ? `Compare` : `Table`,
				color: panelColors.table,
				component: JSONViewerStore.isCompare ? (
					<div className='JSON-wrapper' style={{ gap: '1px' }}>
						<JSONPanel type='right' />
					</div>
				) : (
					<TablePanel type='left' />
				),
				isActive: true,
			},
		],
		[
			treePanel,
			JSONViewerStore.isCompare,
			JSONViewerStore.comparableTreeNode,
			JSONViewerStore.openComparableNodes,
		],
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
