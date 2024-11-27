import { action, computed, observable, reaction } from 'mobx';
import { nanoid } from 'nanoid';
import {
	BlankTreeNode,
	NotebookNode,
	SimpleField,
	TreeNode,
	TreeViewType,
} from '../../models/JSONSchema';
import { WorkspacePanelsLayout } from '../../components/workspace/WorkspaceSplitter';
import {
	getChunk,
	getFlatListFromTree,
	getFlatListFromTreeWSimple,
	isTreeNode,
} from '../../helpers/JSONViewer';
import SearchToken from '../../models/search/SearchToken';
import notificationsStore from '../NotificationsStore';
import { downloadTxtFile } from '../../helpers/files/downloadTxt';

const nullTreeNode: TreeNode = {
	id: '',
	parentIds: [],
	key: '',
	failed: false,
	viewInstruction: '',
	complexFields: [],
	childIds: [],
	simpleFields: [],
};
export interface ChunkHeightData {
	chunk: number;
	firstElement: string;
	lastElement: string;
	height: number;
}

export type PanelType = 'default' | 'compare';

export class JSONViewerStore {
	public id = nanoid();

	constructor(private openTabs: (layout: WorkspacePanelsLayout) => void) {
		reaction(
			() => this.intervalUnit,
			() => {
				this.initChunksData('default');
				this.initChunksData('compare');
			},
		);

		reaction(
			() => this.intervalSize,
			() => {
				this.initChunksData('default');
				this.initChunksData('compare');
			},
		);

		reaction(
			() => this.openTreeNodes.default.values(),
			() => {
				this.initChunksData('default');
				this.initChunksData('compare', false);
			},
		);

		reaction(
			() => this.openTreeNodes.compare.values(),
			() => {
				this.initChunksData('default', false);
				this.initChunksData('compare');
			},
		);
	}

	@observable
	public isModalOpen: { default: boolean; compare: boolean } = {
		default: false,
		compare: false,
	};

	@observable
	public modalType: 'notebooks' | 'results' = 'results';

	@observable notebooks: {
		default: NotebookNode[];
		compare: NotebookNode[];
	} = {
		default: [],
		compare: [],
	};

	@observable treeNodes: {
		default: TreeNode[];
		compare: TreeNode[];
	} = {
		default: [],
		compare: [],
	};

	@observable openTreeNodes: {
		default: Set<string>;
		compare: Set<string>;
	} = {
		default: new Set(),
		compare: new Set(),
	};

	@observable openSelectedRows: {
		default: Set<string>;
		compare: Set<string>;
	} = {
		default: new Set(),
		compare: new Set(),
	};

	@observable selectedTreeNode: {
		default: TreeNode;
		compare: TreeNode;
	} = {
		default: nullTreeNode,
		compare: nullTreeNode,
	};

	@observable selectedFlatTreeNode: {
		default: (TreeNode | SimpleField)[];
		compare: (TreeNode | SimpleField)[];
	} = {
		default: [],
		compare: [],
	};

	@observable openRows: {
		default: Set<string>;
		compare: Set<string>;
	} = {
		default: new Set(),
		compare: new Set(),
	};

	@observable intervalSize = 1;

	@observable intervalUnit = 1000;

	@computed
	public get сhunkInterval() {
		return this.intervalSize * this.intervalUnit;
	}

	@observable isCompare = false;

	@observable
	public tokens: {
		default: SearchToken[];
		compare: SearchToken[];
	} = {
		default: [],
		compare: [],
	};

	@observable
	public scrolledIndex: number | null = null;

	@observable
	public displayedLeafs: {
		default: BlankTreeNode[];
		compare: BlankTreeNode[];
	} = {
		default: [],
		compare: [],
	};

	@observable
	public searchInputValue: {
		default: string;
		compare: string;
	} = {
		default: '',
		compare: '',
	};

	@observable
	public activeIndex: {
		default: number;
		compare: number;
	} = {
		default: 0,
		compare: 0,
	};

	@observable
	public chunks: {
		default: Map<number, Map<string, number>>;
		compare: Map<number, Map<string, number>>;
	} = {
		default: new Map(),
		compare: new Map(),
	};

	@action
	updateTokens = (nextTokens: SearchToken[], type: PanelType) => {
		const tokens = nextTokens.filter(
			(token, index, newTokens) => newTokens.findIndex(t => t.pattern === token.pattern) === index,
		);

		this.tokens[type] = tokens;
	};

	@action
	updateIntervalUnit = (newInterval: number) => {
		this.intervalUnit = newInterval;
	};

	@action
	updateIntervalSize = (newInterval: number) => {
		this.intervalSize = newInterval;
	};

	@action
	updateTokensFromText = (text: string, type: PanelType) => {
		const newTokens: SearchToken[] = [];
		try {
			const json = JSON.parse(text);
			for (let i = 0; i < json.length; i++) {
				if (
					json[i].pattern &&
					json[i].color &&
					newTokens.findIndex(token => token.pattern === json[i].pattern) === -1
				)
					newTokens.push({
						pattern: json[i].pattern,
						color: json[i].color,
						isActive: false,
						isScrollable: true,
					});
			}
		} catch (error) {
			notificationsStore.addMessage({
				type: 'error',
				notificationType: 'genericError',
				header: 'Failed to parse search data',
				id: nanoid(),
				description: String(error),
			});
			return;
		}
		this.updateTokens(newTokens, type);
		this.searchInputValue[type] = '';
		this.scrolledIndex = 0;
	};

	@action
	exportSearch = (type: PanelType) => {
		const tokensConverted = this.tokens[type].map(token => ({
			pattern: token.pattern,
			color: token.color,
		}));
		const fileName = `search_${tokensConverted.map(token => token.pattern).join('_')}`.slice(
			0,
			251,
		);

		downloadTxtFile([JSON.stringify(tokensConverted)], `${fileName}.json`);
	};

	@action toggleMode = () => {
		this.isCompare = !this.isCompare;
	};

	@action
	blankMethod = () => {
		console.log('unexpected method call');
	};

	@action
	clearSearchField = (type: PanelType) => {
		this.tokens[type] = [];
	};

	@action
	setInputValue = (value: string, type: PanelType) => {
		this.searchInputValue[type] = value;
	};

	@action
	public setIsModalOpen = (v: boolean, modalType: 'notebooks' | 'results', type: PanelType) => {
		this.isModalOpen[type] = v;
		this.modalType = modalType;
	};

	@action setTreeNodes(n: TreeNode[], type: PanelType) {
		this.treeNodes[type] = n.slice();
		this.selectedTreeNode[type] = nullTreeNode;
		this.initChunksData(type);
	}

	@action setNotebooks(n: NotebookNode[], type: PanelType) {
		this.notebooks[type] = n.slice();
	}

	@action selectTreeNode(type: PanelType, tree?: TreeNode) {
		if (tree) {
			this.selectedTreeNode[type] = tree;
			this.selectedFlatTreeNode[type] = getFlatListFromTreeWSimple(tree);
		} else {
			this.selectedTreeNode[type] = nullTreeNode;
			this.selectedFlatTreeNode[type] = [];
		}
		this.openSelectedRows[type].clear();
		if (this.selectedFlatTreeNode[type].length > 0) {
			this.openSelectedRows[type].add(this.selectedFlatTreeNode[type][0].id);
		}
	}

	@action addNodes(tree: TreeNode[], type: PanelType) {
		this.treeNodes[type] = this.treeNodes[type].concat(tree);
	}

	@action removeNodesById(ids: string[], type: PanelType) {
		for (let i = 0; i < ids.length; i++) {
			const index = this.treeNodes[type].findIndex(tree => tree.id === ids[i]);
			this.removeNodesById(this.treeNodes[type][index].childIds, type);
		}
		this.treeNodes[type] = this.treeNodes[type].filter(node => !ids.includes(node.id));
	}

	@action clearChunksData(type: PanelType) {
		this.chunks[type].clear();
	}

	@action setChunkElement(chunk: number, id: string, height: number, type: PanelType) {
		if (chunk === -1) return;
		if (this.chunks[type].has(chunk)) {
			const newValue = this.chunks[type].get(chunk);
			if (newValue) newValue.set(id, height);
		} else {
			this.chunks[type].set(chunk, new Map<string, number>());
			const newValue = this.chunks[type].get(chunk);
			if (newValue) newValue.set(id, height);
		}
	}

	@action initChunksData(type: PanelType, clear = true) {
		if (clear) this.clearChunksData(type);
		this.treeNodes[type]
			.filter(node => node.parentIds.every(parentId => this.openTreeNodes[type].has(parentId)))
			.forEach(node => {
				if (isTreeNode(node))
					this.setChunkElement(
						getChunk(node.displayTimestamp, this.сhunkInterval),
						node.id,
						22,
						type,
					);
			});
	}

	@action openNode(id: string, type: PanelType) {
		this.openTreeNodes[type].add(id);
	}

	@action closeNode(id: string, type: PanelType) {
		this.openTreeNodes[type].delete(id);
	}

	@action openNodeAndCloseOthers(ids: string[], type: PanelType) {
		this.openTreeNodes[type].clear();
		for (let i = 0; i < ids.length; i++) this.openTreeNodes[type].add(ids[i]);
	}

	@action scrollToId(id: string, type: PanelType) {
		this.activeIndex[type] = this.listData[type].findIndex(node => 'id' in node && node.id === id);
	}

	@action setNodeView(id: string, viewType: TreeViewType, type: PanelType) {
		const index = this.treeNodes[type].findIndex(tree => tree.id === id);
		this.treeNodes[type] = [
			...this.treeNodes[type].slice(0, index),
			{
				...this.treeNodes[type][index],
				viewType,
			},
			...this.treeNodes[type].slice(index + 1),
		];
	}

	@action setGroupView(id: string, viewType: TreeViewType, type: PanelType) {
		const index = this.treeNodes[type].findIndex(tree => tree.id === id);
		const node = {
			...this.treeNodes[type][index],
			viewType,
		};
		this.treeNodes[type] = [
			...this.treeNodes[type].slice(0, index),
			node,
			...this.treeNodes[type].slice(index + 1),
		];
		for (let i = 0; i < node.childIds.length; i++) {
			this.setGroupView(node.childIds[i], viewType, type);
		}
		if (node.isRoot) this.openNode(node.id, type);
	}

	@action getNotebook(name: string, defaultNotebook: NotebookNode, type: PanelType) {
		const notebook = this.notebooks[type].find(n => n.name === name);
		return notebook || defaultNotebook;
	}

	@action setNotebook(notebook: NotebookNode, type: PanelType) {
		const index = this.notebooks[type].findIndex(n => n.name === notebook.name);
		this.notebooks[type] = [
			...this.notebooks[type].slice(0, index),
			notebook,
			...this.notebooks[type].slice(index + 1),
		];
	}

	@action addNotebookResult(
		name: string,
		newResult: TreeNode,
		resultCount: number,
		type: PanelType,
	) {
		const index = this.notebooks[type].findIndex(n => n.name === name);
		if (index < 0) return;
		const notebook = this.notebooks[type][index];
		notebook.resultsCount = String(resultCount);
		const newResults = [newResult.id, ...notebook.results];

		if (newResult.complexFields.length > 0) {
			this.addNodes(getFlatListFromTree(newResult), type);
			if (newResults.length > resultCount) {
				this.removeNodesById(newResults.slice(resultCount), type);
			}
			notebook.results = newResults.slice(0, resultCount);
			this.selectTreeNode(type, newResult);
			this.openNodeAndCloseOthers([newResult.id, ...newResult.parentIds], type);
		}
		notebook.open = false;
		this.notebooks[type] = [
			...this.notebooks[type].slice(0, index),
			notebook,
			...this.notebooks[type].slice(index + 1),
		];
	}

	@action updateotebookResultCount(name: string, newCount: string, type: PanelType) {
		const index = this.notebooks[type].findIndex(n => n.name === name);
		if (index < 0) return;
		this.notebooks[type] = [
			...this.notebooks[type].slice(0, index),
			{
				...this.notebooks[type][index],
				resultsCount: newCount,
			},
			...this.notebooks[type].slice(index + 1),
		];
	}

	@computed
	public get shownSelectRows() {
		return {
			default: this.selectedFlatTreeNode.default
				.slice(1)
				.filter(field => field.parentIds?.every(id => this.openSelectedRows.default.has(id))),
			compare: this.selectedFlatTreeNode.compare
				.slice(1)
				.filter(field => field.parentIds?.every(id => this.openSelectedRows.compare.has(id))),
		};
	}

	@action openSelectRow(id: string, type: PanelType) {
		this.openSelectedRows[type].add(id);
	}

	@action closeSelectRow(id: string, type: PanelType) {
		this.openSelectedRows[type].delete(id);
	}

	public getCloseIndex = (timestamp: number, type: PanelType) =>
		this.listData[type].findIndex(
			node => 'parentIds' in node && node.displayTimestamp && node.displayTimestamp >= timestamp,
		);

	@computed
	public get listData(): {
		default: (TreeNode | NotebookNode | ChunkHeightData)[];
		compare: (TreeNode | NotebookNode | ChunkHeightData)[];
	} {
		return {
			default: [
				...this.notebooks.default,
				...this.treeNodes.default
					.filter(node =>
						node.parentIds.every(parentId => this.openTreeNodes.default.has(parentId)),
					)
					.flatMap(node => [
						...this.chunksHeights.default.filter(
							chunkData =>
								chunkData.height > 0 &&
								chunkData.lastElement === '' &&
								chunkData.firstElement === node.id,
						),
						node,
						...this.chunksHeights.default.filter(
							chunkData => chunkData.height > 0 && chunkData.lastElement === node.id,
						),
					]),
			],
			compare: [
				...this.notebooks.compare,
				...this.treeNodes.compare
					.filter(node =>
						node.parentIds.every(parentId => this.openTreeNodes.compare.has(parentId)),
					)
					.flatMap(node => [
						...this.chunksHeights.compare.filter(
							chunkData =>
								chunkData.height > 0 &&
								chunkData.lastElement === '' &&
								chunkData.firstElement === node.id,
						),
						node,
						...this.chunksHeights.compare.filter(
							chunkData => chunkData.height > 0 && chunkData.lastElement === node.id,
						),
					]),
			],
		};
	}

	public getChunksHeight = (type: PanelType) => {
		const chunks = Array.from(this.chunks[type].entries());
		return Object.fromEntries(
			chunks.map(([key, value]) => {
				const firstElement = Array.from(value.keys()).shift();
				const lastElement = Array.from(value.keys()).pop();
				return [
					key,
					{
						firstElement: firstElement || '',
						lastElement: lastElement || '',
						height: Array.from(value.values()).reduce(
							(accumulator, height) => accumulator + height,
							0,
						),
					},
				];
			}),
		);
	};

	public fixChunksHeight = (type: PanelType) => {
		const chunks1 = this.getChunksHeight(type);
		const chunks2 = this.getChunksHeight(type === 'default' ? 'compare' : 'default');
		const chunkFixed = [];
		const keys1 = Object.keys(chunks1);
		const keys2 = Object.keys(chunks2);
		const sameKeys = keys1.filter(key => keys2.includes(key));
		const exclusiveKeys = keys1.filter(key => !keys2.includes(key));
		const newKeys = keys2.filter(key => !keys1.includes(key));

		for (let i = 0; i < sameKeys.length; i++) {
			chunkFixed.push({
				chunk: Number(sameKeys[i]),
				firstElement: chunks1[sameKeys[i]].firstElement,
				lastElement: chunks1[sameKeys[i]].lastElement,
				height: Math.max(chunks2[sameKeys[i]].height - chunks1[sameKeys[i]].height, 0),
			});
		}
		exclusiveKeys.forEach(key =>
			chunkFixed.push({
				chunk: Number(key),
				firstElement: chunks1[key].firstElement,
				lastElement: chunks1[key].lastElement,
				height: 0,
			}),
		);
		for (let i = 0; i < newKeys.length; i++) {
			const lastExisting =
				[...keys1].reverse().find(key => Number(key) <= Number(newKeys[i])) || '';
			const firstExisting = keys1.find(key => Number(key) >= Number(newKeys[i])) || '';
			chunkFixed.push({
				chunk: Number(newKeys[i]),
				firstElement: chunks1[firstExisting]?.firstElement || '',
				lastElement: chunks1[lastExisting]?.lastElement || '',
				height: chunks2[newKeys[i]].height,
			});
		}
		return chunkFixed.sort((a, b) => a.chunk - b.chunk);
	};

	@computed
	public get chunksHeights(): { default: ChunkHeightData[]; compare: ChunkHeightData[] } {
		return {
			default: this.fixChunksHeight('default'),
			compare: this.fixChunksHeight('compare'),
		};
	}

	@action scrollToNearest(timestamp: number, type: PanelType) {
		const convertType = type === 'default' ? 'compare' : 'default';
		const chunk = getChunk(timestamp, this.сhunkInterval);
		const nearestNodeIndex = this.listData[convertType].findIndex(node =>
			!('paramsValue' in node) && 'lastElement' in node
				? node.chunk >= chunk
				: isTreeNode(node) &&
				  node.displayTimestamp &&
				  node.parentIds.every(parentId => this.openTreeNodes[convertType].has(parentId)) &&
				  getChunk(node.displayTimestamp, this.сhunkInterval) >= chunk,
		);
		const nearestNodeLocalIndex = this.listData[type].findIndex(node =>
			!('paramsValue' in node) && 'lastElement' in node
				? node.chunk >= chunk
				: isTreeNode(node) &&
				  node.displayTimestamp &&
				  node.parentIds.every(parentId => this.openTreeNodes[type].has(parentId)) &&
				  getChunk(node.displayTimestamp, this.сhunkInterval) >= chunk,
		);
		if (nearestNodeIndex && nearestNodeLocalIndex) {
			const nearestNode = this.listData[convertType][nearestNodeIndex];
			if (isTreeNode(nearestNode)) this.selectedTreeNode[convertType] = nearestNode;
			this.activeIndex[convertType] = nearestNodeIndex;
			const nearestNodeLocal = this.listData[type][nearestNodeLocalIndex];
			if (isTreeNode(nearestNodeLocal)) this.selectedTreeNode[type] = nearestNodeLocal;
			this.activeIndex[type] = nearestNodeLocalIndex;
		}
	}
}
