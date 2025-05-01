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
import { PanelType } from '../../stores/JSONViewer/JSONViewerStore';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import { getFlatListFromTree, parseText, nextid } from '../../helpers/JSONViewer';
import { NotebookNode } from '../../models/JSONSchema';
import FileChoosing from './FileChoosing';
import JSONView from './JSONView';
import TreeList from './TreeList';
import Select from '../util/Select';
import SearchToken from '../../models/search/SearchToken';
import { TreeNode } from '../../stores/JSONViewer/TreeNode';

const JSONPanel = ({ type }: { type: PanelType }) => {
	const JSONViewerStore = useJSONViewerStore();
	const inputJSONRef = React.useRef<HTMLInputElement>(null);

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
			const complexFields: TreeNode[] = [];
			try {
				complexFields.push(...parseText(text, '0', true));
			} catch {
				const lines = text.split('\n');
				for (let i = 0; i < lines.length; i++) {
					if (lines[i] !== '') complexFields.push(...parseText(lines[i], String(i), true));
				}
			}
			return TreeNode.createComplex(
				nextid(), // id
				fileName, // key
				complexFields,
				false, // failed
				true, // isGeneratedKey
				true, // isRoot
			);
		});
		JSONViewerStore.setTreeNodes(
			nodes.flatMap(node => getFlatListFromTree(node)),
			type,
		);
		JSONViewerStore.setNotebooks([], type);
		JSONViewerStore.selectTreeNode(type);
		if (nodes.length > 0) JSONViewerStore.selectTreeNode(type, nodes[0]);
	};

	const onSubmit = (nodes: TreeNode[], notebooks: NotebookNode[]) => {
		JSONViewerStore.setTreeNodes([], type);
		JSONViewerStore.setNotebooks([], type);
		JSONViewerStore.setTreeNodes(
			nodes.flatMap(node => getFlatListFromTree(node)),
			type,
		);
		JSONViewerStore.selectTreeNode(type);
		if (nodes.length > 0) JSONViewerStore.selectTreeNode(type, nodes[0]);
		JSONViewerStore.setNotebooks(notebooks, type);
		JSONViewerStore.setIsModalOpen(false, JSONViewerStore.modalType, type);
	};

	const onChange = (pattern: string) => {
		const token = JSONViewerStore.tokens.find((token: SearchToken) => token.pattern === pattern);
		if (token) {
			JSONViewerStore.activateSearch(token, type);
		} else {
			JSONViewerStore.deactivateSearch(type);
		}
	};

	return (
		<div className='JSON-wrapper' style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
			<div className='JSON-header-wrapper'>
				<div className='JSON-buttons-wrapper'>
					<button
						className='JSON-load-button'
						title='Load Executable(s) From Server'
						onClick={() =>
							JSONViewerStore.setIsModalOpen(!JSONViewerStore.isModalOpen[type], 'notebooks', type)
						}>
						Load Notebook(s)
					</button>
					<button
						className='JSON-load-button'
						title='Load Result(s) From Server'
						onClick={() =>
							JSONViewerStore.setIsModalOpen(!JSONViewerStore.isModalOpen[type], 'results', type)
						}>
						Load Server Result(s)
					</button>
					<button
						className='JSON-load-button'
						title='Load Local Result(s)'
						onClick={() => inputJSONRef.current?.click()}>
						Load Local Result(s)
					</button>
					<div className='JSON-search-control'>Search:</div>
					<Select
						className='JSON-search-select'
						onChange={onChange}
						options={JSONViewerStore.tokens.map((token: SearchToken) => token.pattern)}
						selected={JSONViewerStore.searchToken[type]?.pattern || ''}
					/>
					{JSONViewerStore.searchToken[type] !== null && (
						<div className='JSON-search-control'>
							<button
								className='search-controls__prev'
								title='Previous search result'
								onClick={() => JSONViewerStore.prevSearchResult(type)}
							/>
							{Math.min(
								JSONViewerStore.currentSearchResult[type] + 1,
								JSONViewerStore.searchResults[type].length,
							)}{' '}
							of {JSONViewerStore.searchResults[type].length}
							<button
								className='search-controls__next'
								title='Next search result'
								onClick={() => JSONViewerStore.nextSearchResult(type)}
							/>
						</div>
					)}
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
			{JSONViewerStore.isModalOpen[type] && (
				<FileChoosing
					type={JSONViewerStore.modalType}
					multiple={true}
					onSubmit={onSubmit}
					close={() => JSONViewerStore.setIsModalOpen(false, JSONViewerStore.modalType, type)}
				/>
			)}
			{JSONViewerStore.isCompare ? (
				<div className='JSON-wrapper' style={{ gap: '1px' }}>
					<JSONView type={type} />
				</div>
			) : (
				<TreeList type={type} />
			)}
		</div>
	);
};

export default observer(JSONPanel);
