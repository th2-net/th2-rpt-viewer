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
	getChunk,
	getFlatListFromTree,
	getFlatListFromTreeWSimple,
	isTreeNode,
} from '../../helpers/JSONViewer';
import SearchToken from '../../models/search/SearchToken';
import notificationsStore from '../NotificationsStore';
import { downloadTxtFile } from '../../helpers/files/downloadTxt';
import multiTokenSplit from '../../helpers/search/multiTokenSplit';
import { getKeyValueTokens } from '../../helpers/search/getSpecificTokens';
import SearchSplitResult from '../../models/search/SearchSplitResult';

const SEARCH_COLOR = 'black';

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

export interface BaseReaderSearchResult {
	type: 'name' | 'table' | 'body';
	id: string;
	contentIndex: number;
}

export interface NameReaderSearchResult extends BaseReaderSearchResult {
	type: 'name';
}

export interface TableReaderSearchResult extends BaseReaderSearchResult {
	type: 'table';
	rowIndex: number;
	cellIndex: number;
}
export interface BodyReaderSearchResult extends BaseReaderSearchResult {
	type: 'body';
	row: string;
	position: 'key' | 'value';
}

const defaultSearchTokens: SearchToken[] = [
	{
		pattern: 'PASS',
		color: 'green',
		isScrollable: true,
		isActive: false,
	},
	{
		pattern: 'FAIL',
		color: 'red',
		isScrollable: true,
		isActive: false,
	},
];

type ReaderSearchResult = NameReaderSearchResult | TableReaderSearchResult | BodyReaderSearchResult;

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

	@observable searchResults: {
		default: Array<ReaderSearchResult>;
		compare: Array<ReaderSearchResult>;
	} = {
		default: [],
		compare: [],
	};

	@observable intervalSize = 1;

	@observable intervalUnit = 1000;

	@computed
	public get сhunkInterval() {
		return this.intervalSize * this.intervalUnit;
	}

	@observable isCompare = false;

	@observable
	public tokens: SearchToken[] = [...defaultSearchTokens];

	@observable
	public searchToken: {
		default: SearchToken | null;
		compare: SearchToken | null;
	} = {
		default: null,
		compare: null,
	};

	@observable
	public currentSearchResult: {
		default: number;
		compare: number;
	} = {
		default: 0,
		compare: 0,
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

	@observable lastViewType: TreeViewType = TreeViewType.EVENTS_LIST;

	@observable
	public searchInputValue = '';

	@observable
	public activeIndex: {
		default: number;
		compare: number;
	} = {
		default: 0,
		compare: 0,
	};

	@observable
	public heights: {
		default: Map<string, { height: number; displayTimestamp: number; parentIds: string[] }>;
		compare: Map<string, { height: number; displayTimestamp: number; parentIds: string[] }>;
	} = {
		default: new Map(),
		compare: new Map(),
	};

	@action
	updateTokens = (nextTokens: SearchToken[]) => {
		const tokens = nextTokens.filter(
			(token, index, newTokens) => newTokens.findIndex(t => t.pattern === token.pattern) === index,
		);

		this.tokens = tokens;
		this.deactivateSearchAll();
	};

	@action
	updateSearchResults = (token: SearchToken, type: PanelType) => {
		this.searchResults[type] = [];
		const searchTokens = [token];
		const findInDisplayTable = (id: string, displayTable?: string[][]) => {
			if (!displayTable) return;
			displayTable.forEach((row, rowIndex) =>
				row.forEach((cell, cellIndex) =>
					multiTokenSplit(
						typeof cell === 'string' ? `"${cell}"` : String(cell),
						searchTokens,
					).forEach((content, contentIndex) => {
						if (content.token)
							this.searchResults[type].push({
								type: 'table',
								id,
								contentIndex,
								rowIndex,
								cellIndex,
							});
					}),
				),
			);
		};

		const findInSimpleFields = (id: string, simpleFields: SimpleField[]) => {
			const keyValueTokens = getKeyValueTokens(searchTokens, true);

			simpleFields.forEach(field => {
				const { key, value } = field;
				const valueString =
					typeof value === 'object'
						? JSON.stringify(value)
						: typeof value === 'string'
						? `"${value}"`
						: String(value);

				const keyValueTokensFiltered = keyValueTokens.filter(
					({ isOne, keyToken, valueToken }) =>
						!isOne ||
						(`${key}:`.endsWith(keyToken.pattern) && valueString.startsWith(valueToken.pattern)),
				);

				const keyTokens = keyValueTokensFiltered.map(({ keyToken }) => keyToken);
				const valueTokens = keyValueTokensFiltered.map(({ valueToken }) => valueToken);

				multiTokenSplit(`${key}: `, keyTokens).forEach((content, contentIndex) => {
					if (content.token)
						this.searchResults[type].push({
							type: 'body',
							id,
							contentIndex,
							row: `${key}:${value}`,
							position: 'key',
						});
				});

				multiTokenSplit(valueString, valueTokens).forEach((content, contentIndex) => {
					if (content.token)
						this.searchResults[type].push({
							type: 'body',
							id,
							contentIndex,
							row: `${key}:${value}`,
							position: 'value',
						});
				});
			});
		};

		const results: Array<ReaderSearchResult> = [];
		for (let nodeIndex = 0; nodeIndex < this.treeNodes[type].length; nodeIndex++) {
			const node = this.treeNodes[type][nodeIndex];
			const nodeName = node.displayName
				? node.displayName
				: node.key && !(node.isGeneratedKey && !node.isRoot)
				? node.key
				: 'no display name';
			const nameSplitContent = multiTokenSplit(nodeName, searchTokens);
			nameSplitContent.forEach((content, contentIndex) => {
				if (content.token) results.push({ type: 'name', id: node.id, contentIndex });
			});
			if (node.viewType === TreeViewType.JSON) {
				const simpleFields = node.simpleFields;
				findInSimpleFields(node.id, simpleFields);

				const displayTable = node.displayTable;
				findInDisplayTable(node.id, displayTable);
			} else {
				const displayTable = node.displayTable;
				findInDisplayTable(node.id, displayTable);

				const simpleFields = node.simpleFields;
				findInSimpleFields(node.id, simpleFields);
			}
		}
		this.currentSearchResult[type] = 0;
	};

	@action
	moveToNextSearchResult = (type: PanelType) => {
		const index = this.treeNodes[type].findIndex(
			tree => tree.id === this.searchResults[type][this.currentSearchResult[type]].id,
		);

		if (
			this.searchResults[type][this.currentSearchResult[type]].type === 'table' &&
			this.treeNodes[type][index].viewType !== TreeViewType.DISPLAY_TABLE
		) {
			this.setNodeView(
				this.searchResults[type][this.currentSearchResult[type]].id,
				TreeViewType.DISPLAY_TABLE,
				type,
			);
		}

		if (
			this.searchResults[type][this.currentSearchResult[type]].type === 'body' &&
			this.treeNodes[type][index].viewType !== TreeViewType.JSON &&
			this.treeNodes[type][index].viewType !== TreeViewType.PRETTY
		) {
			this.setNodeView(
				this.searchResults[type][this.currentSearchResult[type]].id,
				TreeViewType.JSON,
				type,
			);
		}

		if (!this.treeNodes[type][index].parentIds.every(id => this.openTreeNodes[type].has(id))) {
			this.treeNodes[type][index].parentIds.forEach(id => {
				if (this.treeNodes[type].find(tree => tree.id === id)?.isRoot) {
					this.openNodeAndCloseOthers([id], type);
				} else {
					this.setNodeView(id, TreeViewType.EVENTS_LIST, type);
					this.openNode(id, type);
				}
			});
		}

		if (!this.openTreeNodes[type].has(this.treeNodes[type][index].id)) {
			this.openNode(this.treeNodes[type][index].id, type);
		}

		this.scrollToId(this.searchResults[type][this.currentSearchResult[type]].id, type);
	};

	@action
	deactivateSearchAll = () => {
		this.searchToken.default = null;
		this.searchToken.compare = null;
	};

	@action
	deactivateSearch = (type: PanelType) => {
		this.searchToken[type] = null;
	};

	@action
	activateSearch = (token: SearchToken, type: PanelType) => {
		this.updateSearchResults(token, type);
		this.searchToken[type] = token;
		this.moveToNextSearchResult(type);
	};

	@action
	nextSearchResult = (type: PanelType) => {
		this.currentSearchResult[type] = Math.min(
			this.currentSearchResult[type] + 1,
			this.searchResults[type].length - 1,
		);

		this.moveToNextSearchResult(type);
	};

	@action
	prevSearchResult = (type: PanelType) => {
		this.currentSearchResult[type] = Math.max(this.currentSearchResult[type] - 1, 0);

		this.moveToNextSearchResult(type);
	};

	getCurrentResult = (type: PanelType) => this.searchResults[type][this.currentSearchResult[type]];

	compareResults = (result1?: ReaderSearchResult, result2?: ReaderSearchResult) => {
		if (!result1) return false;
		if (!result2) return false;

		switch (result1.type) {
			case 'name': {
				return (
					result2.type === 'name' &&
					result1.id === result2.id &&
					result1.contentIndex === result2.contentIndex
				);
			}
			case 'table': {
				return (
					result2.type === 'table' &&
					result1.id === result2.id &&
					result1.contentIndex === result2.contentIndex &&
					result1.rowIndex === result2.rowIndex &&
					result1.cellIndex === result2.cellIndex
				);
			}
			case 'body': {
				return (
					result2.type === 'body' &&
					result1.id === result2.id &&
					result1.contentIndex === result2.contentIndex &&
					result1.row === result2.row &&
					result1.position === result2.position
				);
			}
			default: {
				return false;
			}
		}
	};

	compareResult = (type: PanelType, result: ReaderSearchResult) =>
		JSON.stringify(result) === JSON.stringify(this.getCurrentResult(type));

	compareNameResults = (type: PanelType, id: string, results: SearchSplitResult[]) =>
		results.map((content, index) =>
			this.compareResult(type, {
				type: 'name',
				id,
				contentIndex: index,
			})
				? {
						...content,
						token: {
							...content.token,
							color: SEARCH_COLOR,
						},
				  }
				: content,
		);

	compareBodyResults = (
		type: PanelType,
		id: string,
		row: string,
		position: 'key' | 'value',
		results: SearchSplitResult[],
	) =>
		results.map((content, index) =>
			this.compareResult(type, {
				type: 'body',
				id,
				contentIndex: index,
				row,
				position,
			})
				? {
						...content,
						token: {
							...content.token,
							color: SEARCH_COLOR,
						},
				  }
				: content,
		);

	compareTableResults = (
		type: PanelType,
		id: string,
		rowIndex: number,
		cellIndex: number,
		results: SearchSplitResult[],
	) =>
		results.map((content, index) =>
			this.compareResult(type, {
				type: 'table',
				id,
				contentIndex: index,
				rowIndex,
				cellIndex,
			})
				? {
						...content,
						token: {
							...content.token,
							color: SEARCH_COLOR,
						},
				  }
				: content,
		);

	@action
	updateIntervalUnit = (newInterval: number) => {
		this.intervalUnit = newInterval;
	};

	@action
	updateIntervalSize = (newInterval: number) => {
		this.intervalSize = newInterval;
	};

	@action
	updateTokensFromText = (text: string) => {
		const newTokens: SearchToken[] = [...defaultSearchTokens];
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
		this.updateTokens(newTokens);
		this.searchInputValue = '';
		this.scrolledIndex = 0;
	};

	@action
	exportSearch = () => {
		const tokensConverted = this.tokens.map(token => ({
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
	clearSearchField = () => {
		this.tokens = [...defaultSearchTokens];
	};

	@action
	setInputValue = (value: string) => {
		this.searchInputValue = value;
	};

	@action
	public setIsModalOpen = (v: boolean, modalType: 'notebooks' | 'results', type: PanelType) => {
		this.isModalOpen[type] = v;
		this.modalType = modalType;
	};

	@action setTreeNodes(n: TreeNode[], type: PanelType) {
		this.clearHeights(type);
		this.treeNodes[type] = n.slice();
		this.selectedTreeNode[type] = nullTreeNode;
		this.initHeightsData(type);
		this.deactivateSearch(type);
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
		this.initHeightsData(type);
		this.deactivateSearch(type);
	}

	@action removeNodesById(ids: string[], type: PanelType) {
		for (let i = 0; i < ids.length; i++) {
			const index = this.treeNodes[type].findIndex(tree => tree.id === ids[i]);
			this.removeNodesById(this.treeNodes[type][index].childIds, type);
		}
		this.treeNodes[type] = this.treeNodes[type].filter(node => !ids.includes(node.id));
	}

	@action setNodeHeight(
		id: string,
		displayTimestamp: number | undefined,
		height: number,
		parentIds: string[],
		type: PanelType,
	) {
		if (displayTimestamp) this.heights[type].set(id, { displayTimestamp, height, parentIds });
	}

	@action clearHeights(type: PanelType) {
		this.heights[type].clear();
	}

	@action initHeightsData(type: PanelType) {
		this.treeNodes[type].forEach(node => {
			if (isTreeNode(node) && !this.heights[type].has(node.id))
				this.setNodeHeight(node.id, node.displayTimestamp, 30, node.parentIds, type);
		});
	}

	@action openNode(id: string, type: PanelType) {
		this.openTreeNodes[type].add(id);
	}

	@action closeNode(id: string, type: PanelType) {
		this.openTreeNodes[type].delete(id);
	}

	@action openNodeAndCloseOthers(ids: string[], type: PanelType) {
		if (!ids.every(id => this.openTreeNodes[type].has(id))) {
			this.openTreeNodes[type].clear();
			for (let i = 0; i < ids.length; i++) this.openTreeNodes[type].add(ids[i]);
		}
	}

	@action scrollToId(id: string, type: PanelType) {
		this.activeIndex[type] = this.listData[type].findIndex(node => 'id' in node && node.id === id);
	}

	@action setNodeView(id: string, viewType: TreeViewType, type: PanelType) {
		const index = this.treeNodes[type].findIndex(tree => tree.id === id);
		if (this.treeNodes[type][index].viewType !== viewType)
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
		if (node.isRoot) this.openNodeAndCloseOthers([node.id], type);
		this.lastViewType = viewType;
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
		// TODO: remove copy past
		const defaultList = [
			...this.notebooks.default,
			...this.treeNodes.default
				.filter(node => {
					const parentId = node.parentIds.at(-1);
					if (parentId) {
						const parent = this.treeNodes.default.find(tree => tree.id === parentId);
						return (
							node.parentIds.every(parentId => this.openTreeNodes.default.has(parentId)) &&
							(parent?.isRoot || parent?.viewType === TreeViewType.EVENTS_LIST)
						);
					}
					return true;
				})
				.flatMap(node => [
					...this.chunksHeights.default.filter(
						chunkData =>
							this.isCompare &&
							chunkData.height > 0 &&
							chunkData.lastElement === '' &&
							chunkData.firstElement === node.id,
					),
					node,
					...this.chunksHeights.default.filter(
						chunkData =>
							this.isCompare && chunkData.height > 0 && chunkData.lastElement === node.id,
					),
				]),
		];
		const compareList = [
			...this.notebooks.compare,
			...this.treeNodes.compare
				.filter(node => {
					const parentId = node.parentIds.at(-1);
					if (parentId) {
						const parent = this.treeNodes.compare.find(tree => tree.id === parentId);
						return (
							node.parentIds.every(parentId => this.openTreeNodes.compare.has(parentId)) &&
							(parent?.isRoot || parent?.viewType === TreeViewType.EVENTS_LIST)
						);
					}
					return true;
				})
				.flatMap(node => [
					...this.chunksHeights.compare.filter(
						chunkData =>
							this.isCompare &&
							chunkData.height > 0 &&
							chunkData.lastElement === '' &&
							chunkData.firstElement === node.id,
					),
					node,
					...this.chunksHeights.compare.filter(
						chunkData =>
							this.isCompare && chunkData.height > 0 && chunkData.lastElement === node.id,
					),
				]),
		];
		return {
			default: defaultList,
			compare: compareList,
		};
	}

	@computed
	public get intervalsColor() {
		const chunks = new Set<number>();
		[
			...this.treeNodes.default.filter(node =>
				node.parentIds.every(parentId => this.openTreeNodes.default.has(parentId)),
			),
			...this.treeNodes.compare.filter(node =>
				node.parentIds.every(parentId => this.openTreeNodes.compare.has(parentId)),
			),
		].forEach(({ displayTimestamp }) => chunks.add(getChunk(displayTimestamp, this.сhunkInterval)));
		return Object.fromEntries(
			Array.from(chunks)
				.sort((a, b) => a - b)
				.map((interval, index) => [interval, index % 2]),
		);
	}

	public getChunksHeight = (type: PanelType) => {
		const heightsFiltered = Array.from(this.heights[type].entries()).filter(([_id, data]) =>
			data.parentIds.every(parentId => this.openTreeNodes[type].has(parentId)),
		);
		const chunks: {
			[chunk: string]: {
				height: number;
				lastElement: string;
				firstElement: string;
			};
		} = {};
		for (let i = 0; i < heightsFiltered.length; i++) {
			const chunk = getChunk(heightsFiltered[i][1].displayTimestamp, this.сhunkInterval);
			if (chunks[chunk]) {
				chunks[chunk] = {
					height: chunks[chunk].height + heightsFiltered[i][1].height,
					lastElement: heightsFiltered[i][0],
					firstElement: chunks[chunk].firstElement,
				};
			} else {
				chunks[chunk] = {
					height: heightsFiltered[i][1].height,
					lastElement: heightsFiltered[i][0],
					firstElement: heightsFiltered[i][0],
				};
			}
		}
		return chunks;
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
