import { action, computed, observable } from 'mobx';
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
	height: 0,
};

export type PanelType = 'default' | 'compare';

export class JSONViewerStore {
	public id = nanoid();

	constructor(private openTabs: (layout: WorkspacePanelsLayout) => void) {}

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

	@action setNodeHeight(id: string, height: number, type: PanelType) {
		const index = this.treeNodes[type].findIndex(tree => tree.id === id);
		this.treeNodes[type] = [
			...this.treeNodes[type].slice(0, index),
			{
				...this.treeNodes[type][index],
				height,
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
		default: (TreeNode | NotebookNode)[];
		compare: (TreeNode | NotebookNode)[];
	} {
		return {
			default: [
				...this.notebooks.default,
				...this.treeNodes.default.filter(node =>
					node.parentIds.every(parentId => this.openTreeNodes.default.has(parentId)),
				),
			],
			compare: [
				...this.notebooks.compare,
				...this.treeNodes.compare.filter(node =>
					node.parentIds.every(parentId => this.openTreeNodes.compare.has(parentId)),
				),
			],
		};
	}

	getChunkHeight = (type: PanelType) => {
		const chunks: {
			[timestamp: string]: {
				id: string;
				height: number;
				displayTimestamp: number;
				chunk: number;
			};
		} = {};
		let tempChunk: {
			id: string;
			height: number;
			displayTimestamp: number;
			chunk: number;
		} = {
			id: '',
			height: 0,
			displayTimestamp: 0,
			chunk: 0,
		};

		for (let i = 0; i < this.listData[type].length; i++) {
			const node = this.listData[type][i];
			if (isTreeNode(node) && !node.isRoot) {
				if (node.displayTimestamp) {
					if (tempChunk.displayTimestamp === 0) {
						tempChunk = {
							id: node.id,
							height: tempChunk.height + node.height,
							displayTimestamp:
								Math.floor((node.displayTimestamp || 0) / this.сhunkInterval) * this.сhunkInterval,
							chunk: Math.floor((node.displayTimestamp || 0) / this.сhunkInterval),
						};
					} else if (
						tempChunk.chunk === Math.floor((node.displayTimestamp || 0) / this.сhunkInterval)
					) {
						tempChunk = {
							...tempChunk,
							id: node.id,
							height: tempChunk.height + node.height,
						};
					} else {
						chunks[tempChunk.displayTimestamp] = { ...tempChunk };
						tempChunk = {
							id: node.id,
							height: node.height,
							displayTimestamp:
								Math.floor((node.displayTimestamp || 0) / this.сhunkInterval) * this.сhunkInterval,
							chunk: Math.floor((node.displayTimestamp || 0) / this.сhunkInterval),
						};
					}
				}
			}
		}

		return chunks;
	};

	@computed
	public get chunkHeights() {
		const chunksDefault = this.getChunkHeight('default');
		const chunksCompare = this.getChunkHeight('compare');
		return {
			default: Object.values(chunksDefault).map(chunk => ({
				...chunk,
				height: chunksCompare[chunk.displayTimestamp]
					? Math.max(chunksCompare[chunk.displayTimestamp].height - chunk.height, 0)
					: 0,
			})),
			compare: Object.values(chunksCompare).map(chunk => ({
				...chunk,
				height: chunksDefault[chunk.displayTimestamp]
					? Math.max(chunksDefault[chunk.displayTimestamp].height - chunk.height, 0)
					: 0,
			})),
		};
	}

	@action scrollToNearest(timestamp: number, type: PanelType) {
		const convertType = type === 'default' ? 'compare' : 'default';
		const chunk = Math.floor(timestamp / this.сhunkInterval);
		const nearestNode = this.treeNodes[convertType].find(
			node =>
				'displayTimestamp' in node &&
				node.displayTimestamp &&
				node.parentIds.every(parentId => this.openTreeNodes[convertType].has(parentId)) &&
				Math.floor(node.displayTimestamp / this.сhunkInterval) >= chunk,
		);
		const nearestNodeLocal = this.treeNodes[type].find(
			node =>
				'displayTimestamp' in node &&
				node.displayTimestamp &&
				node.parentIds.every(parentId => this.openTreeNodes[type].has(parentId)) &&
				Math.floor(node.displayTimestamp / this.сhunkInterval) >= chunk,
		);
		if (nearestNode && nearestNodeLocal) {
			this.selectedTreeNode[convertType] = nearestNode;
			this.scrollToId(nearestNode.id, convertType);
			this.selectedTreeNode[type] = nearestNodeLocal;
			this.scrollToId(nearestNodeLocal.id, type);
		}
	}
}
