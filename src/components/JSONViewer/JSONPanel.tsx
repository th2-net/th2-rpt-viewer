import React from 'react';
import { observer } from 'mobx-react-lite';
import { nanoid } from 'nanoid';
import { PanelType } from '../../stores/JSONViewer/JSONViewerStore';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import { getFlatListFromTree, parseText } from '../../helpers/JSONViewer';
import { NotebookNode, TreeNode } from '../../models/JSONSchema';
import FileChoosing from './FileChoosing';
import JSONView from './JSONView';
import TreeList from './TreeList';

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
		if (nodes.length > 0) {
			JSONViewerStore.selectTreeNode(type, nodes[0]);
			nodes.forEach(node => JSONViewerStore.addLoadedIntervals(type, node.id, [0]));
		}
		JSONViewerStore.setNotebooks(notebooks, type);
		JSONViewerStore.setIsModalOpen(false, JSONViewerStore.modalType, type);
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
					{!JSONViewerStore.activeSearch[type] && (
						<>
							<button
								className='JSON-load-button'
								title='Previous search result'
								disabled={JSONViewerStore.treeNodes[type].length === 0}
								onClick={() => JSONViewerStore.activateSearch(type)}>
								Search
							</button>
						</>
					)}
					{JSONViewerStore.activeSearch[type] && (
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
