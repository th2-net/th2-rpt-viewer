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
import { nanoid } from 'nanoid';
import WorkspaceSplitter from './WorkspaceSplitter';
import '../../styles/workspace.scss';
import { NotebookNode, TreeNode } from '../../models/JSONSchema';
import TablePanel from '../JSONViewer/TablePanel';
import useJSONViewerWorkspace from '../../hooks/useJSONViewerWorkspace';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import FileChoosing from '../JSONViewer/FileChoosing';
import NotebookParamsCell from '../JSONViewer/NotebookParamsCell';
import TreePanel from '../JSONViewer/TreePanel';
import { getFlatListFromTree, parseText } from '../../helpers/JSONViewer';
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
			node.failed = node.complexFields.some(v => v.failed);
			return node;
		});
		JSONViewerStore.setTreeNodes(nodes.flatMap(node => getFlatListFromTree(node)));
		JSONViewerStore.setNotebooks([]);
		JSONViewerStore.selectTreeNode();
		if (nodes.length > 0) JSONViewerStore.selectTreeNode(nodes[0]);
	};

	const computeTreeKey = React.useCallback(
		(index: number, dataNode: TreeNode | NotebookNode) =>
			`${'id' in dataNode ? `${dataNode.id}-${dataNode.viewType}` : dataNode.name}`,
		[],
	);

	const renderTree = React.useCallback((index: number, dataNode: TreeNode | NotebookNode) => {
		if ('id' in dataNode) return <TreePanel treeNode={dataNode} />;
		return <NotebookParamsCell notebookProp={dataNode} />;
	}, []);

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
								onClick={() => inputRef.current?.click()}>
								Load Local Result(s)
							</button>
						</div>
						<input
							hidden
							ref={inputRef}
							style={{ marginBottom: 10 }}
							type='file'
							accept='.jsonl'
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
								type={JSONViewerStore.modalType}
								multiple={true}
								onSubmit={onSubmit}
								close={() => JSONViewerStore.setIsModalOpen(false, JSONViewerStore.modalType)}
							/>
						)}
						<StateSaverProvider>
							<Virtuoso
								className='JSON-virtuoso'
								data={[
									...JSONViewerStore.notebooks,
									...JSONViewerStore.treeNodes.filter(node =>
										node.parentIds.every(parentId => JSONViewerStore.openTreeNodes.has(parentId)),
									),
								]}
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
			JSONViewerStore.openTreeNodes,
		],
	).get();

	const [compareArea, setCompareArea] = React.useState(100);

	const tablePanel = React.useMemo(
		() =>
			computed(() => ({
				title: `Table`,
				color: panelColors.table,
				component: (
					<div className='JSON-wrapper tableView'>
						<TablePanel
							panelArea={compareArea}
							setPanelArea={setCompareArea}
							selectedNode={JSONViewerStore.selectedTreeNode}
							compareNode={JSONViewerStore.comparableTreeNode}
						/>
					</div>
				),
				isActive: false,
			})),
		[JSONViewerStore.selectTreeNode, JSONViewerStore.comparableTreeNode, compareArea],
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
