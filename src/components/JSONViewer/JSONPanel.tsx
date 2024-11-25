import React from 'react';
import { observer } from 'mobx-react-lite';
import { nanoid } from 'nanoid';
import { PanelType } from '../../stores/JSONViewer/JSONViewerStore';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import { SearchInputBase } from '../search/SearchInput';
import SearchToken from '../../models/search/SearchToken';
import { getFlatListFromTree, parseText } from '../../helpers/JSONViewer';
import { NotebookNode, TreeNode } from '../../models/JSONSchema';
import FileChoosing from './FileChoosing';
import JSONView from './JSONView';
import TreeList from './TreeList';

const JSONPanel = ({ type }: { type: PanelType }) => {
	const JSONViewerStore = useJSONViewerStore();
	const inputJSONRef = React.useRef<HTMLInputElement>(null);
	const inputSearchRef = React.useRef<HTMLInputElement>(null);

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
				height: 22,
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
		JSONViewerStore.setTreeNodes(
			nodes.flatMap(node => getFlatListFromTree(node)),
			type,
		);
		JSONViewerStore.setNotebooks([], type);
		JSONViewerStore.selectTreeNode(type);
		if (nodes.length > 0) JSONViewerStore.selectTreeNode(type, nodes[0]);
	};

	const readSearchFile = async (files: FileList) => {
		const file = files.item(0);
		if (!file) return;
		const fileContent = await file.text();
		JSONViewerStore.updateTokensFromText(fileContent, type);
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

	return (
		<div className='JSON-wrapper' style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
			<div className='JSON-header-wrapper'>
				<div className='JSON-buttons-wrapper'>
					<button
						className='load-JSON-button'
						title='Load Executable(s) From Server'
						onClick={() =>
							JSONViewerStore.setIsModalOpen(!JSONViewerStore.isModalOpen[type], 'notebooks', type)
						}>
						Load Executable(s) From Server
					</button>
					<button
						className='load-JSON-button'
						title='Load Result(s) From Server'
						onClick={() =>
							JSONViewerStore.setIsModalOpen(!JSONViewerStore.isModalOpen[type], 'results', type)
						}>
						Load Result(s) From Server
					</button>
					<button
						className='load-JSON-button'
						title='Load Local Result(s)'
						onClick={() => inputJSONRef.current?.click()}>
						Load Local Result(s)
					</button>
					{type === 'default' && (
						<>
							<button className='load-JSON-button' onClick={() => JSONViewerStore.toggleMode()}>
								Switch mode to {JSONViewerStore.isCompare ? 'table' : 'compare'}
							</button>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 5,
								}}>
								<label htmlFor='chunk-size'>Chunk interval:</label>
								<input
									style={{
										border: '1px solid black',
										borderRadius: '5px',
										maxWidth: 50,
									}}
									value={JSONViewerStore.intervalSize}
									onChange={e => {
										e.preventDefault();
										JSONViewerStore.updateIntervalSize(Number(e.target.value));
									}}
								/>
								<select
									name='intervals'
									id='chunk-size'
									onChange={e => {
										e.preventDefault();
										JSONViewerStore.updateIntervalUnit(Number(e.target.value));
									}}
									value={JSONViewerStore.intervalUnit}>
									<option value={10}>millisec</option>
									<option value={1000}>sec</option>
									<option value={60000}>min</option>
								</select>
							</div>
						</>
					)}
				</div>
				<div className='JSON-search-wrapper'>
					<SearchInputBase
						searchTokens={JSONViewerStore.tokens[type]}
						resultsCount={0}
						currentIndex={JSONViewerStore.scrolledIndex}
						isLoading={false}
						updateSearchTokens={(nextTokens: SearchToken[]) =>
							JSONViewerStore.updateTokens(nextTokens, type)
						}
						nextSearchResult={JSONViewerStore.blankMethod}
						prevSearchResult={JSONViewerStore.blankMethod}
						clear={() => JSONViewerStore.clearSearchField(type)}
						value={JSONViewerStore.searchInputValue[type]}
						setValue={(newValue: string) => JSONViewerStore.setInputValue(newValue, type)}
						disabled={true}
					/>
					<div
						className='import-JSON-button'
						onClick={() => inputSearchRef.current?.click()}
						title='Import Search'
					/>
					<div
						className='export-JSON-button'
						onClick={() => JSONViewerStore.exportSearch(type)}
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
