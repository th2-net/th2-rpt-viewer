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

import { action, computed, observable } from 'mobx';
import { nanoid } from 'nanoid';
import {
	BlankTreeNode,
	NotebookNode,
	SimpleField,
	TreeNode,
	TreeNodeHolder,
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
		isActive: false,
		isScrollable: true,
		isCaseSensitive: true,
	},
	{
		pattern: 'FAIL',
		color: 'red',
		isActive: false,
		isScrollable: true,
		isCaseSensitive: true,
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

	private defaultHeight: {
		default: number;
		compare: number;
	} = {
		default: 30,
		compare: 30,
	};

	@observable treeNodeHolders: {
		default: TreeNodeHolder;
		compare: TreeNodeHolder;
	} = {
		default: {
			nodes: [],
			idToIndex: new Map<string, number>(),
		},
		compare: {
			nodes: [],
			idToIndex: new Map<string, number>(),
		},
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
	public get chunkInterval() {
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
		const findInDisplayName = (id: string, displayName?: string): boolean => {
			if (!displayName) return false;
			const index = multiTokenSplit(displayName, searchTokens).findIndex(result => result.token);
			if (index !== -1) {
				this.searchResults[type].push({
					type: 'name',
					id,
					contentIndex: index,
				});
				return true;
			}
			return false;
		};

		const findInDisplayTable = (id: string, displayTable?: string[][]): boolean => {
			if (!displayTable) return false;
			for (let rowIndex = 0; rowIndex < displayTable.length; rowIndex++) {
				const row = displayTable[rowIndex];
				for (let cellIndex = 0; cellIndex < row.length; cellIndex++) {
					const cell = row[cellIndex];
					const content = typeof cell === 'string' ? `"${cell}"` : String(cell);
					const contentIndex = multiTokenSplit(content, searchTokens).findIndex(
						content => content.token,
					);
					if (contentIndex !== -1) {
						this.searchResults[type].push({
							type: 'table',
							id,
							contentIndex,
							rowIndex,
							cellIndex,
						});
						return true;
					}
				}
			}
			return false;
		};

		const findInSimpleFields = (id: string, simpleFields: SimpleField[]): boolean => {
			const keyValueTokens = getKeyValueTokens(searchTokens, true);

			for (const { key, value } of simpleFields) {
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
				const keyContentIndex = multiTokenSplit(`${key}: `, keyTokens).findIndex(
					result => result.token,
				);
				if (keyContentIndex !== -1) {
					this.searchResults[type].push({
						type: 'body',
						id,
						contentIndex: keyContentIndex,
						row: `${key}:${value}`,
						position: 'key',
					});
					return true;
				}

				const valueTokens = keyValueTokensFiltered.map(({ valueToken }) => valueToken);
				const valueContentIndex = multiTokenSplit(valueString, valueTokens).findIndex(
					result => result.token,
				);
				if (valueContentIndex !== -1) {
					this.searchResults[type].push({
						type: 'body',
						id,
						contentIndex: valueContentIndex,
						row: `${key}:${value}`,
						position: 'value',
					});
					return true;
				}
			}
			return false;
		};

		const nodeHolder = this.getNodeHolder(type);
		nodeHolder.nodes.forEach(node => {
			if (!node.isRoot) {
				if (node.parentIds.length === 1) {
					if (!findInDisplayName(node.id, node.displayName)) {
						if (!findInDisplayTable(node.id, node.displayTable)) {
							findInSimpleFields(node.id, node.simpleFields);
						}
					}
				}
			}
		});
		this.currentSearchResult[type] = 0;
	};

	@action
	moveToNextSearchResult = (type: PanelType) => {
		const searchResult = this.searchResults[type][this.currentSearchResult[type]];
		const id = searchResult.id;
		const searchNode = JSONViewerStore.getNodeById(id, this.getNodeHolder(type));

		if (!searchNode) {
			console.error(`Node for '${id}' id isn't found`);
			return;
		}
		if (searchNode.parentIds.length !== 1) {
			console.error(`Node with '${id}' id hasn't got single parent id - ${searchNode.parentIds}`);
			return;
		}
		const rootId = searchNode.parentIds[0];

		switch (searchResult.type) {
			case 'table': {
				if (searchNode.viewType !== TreeViewType.DISPLAY_TABLE) {
					this.setNodeView(id, TreeViewType.DISPLAY_TABLE, type);
				}
				break;
			}
			case 'body': {
				if (
					searchNode?.viewType !== TreeViewType.JSON &&
					searchNode.viewType !== TreeViewType.PRETTY
				) {
					this.setNodeView(id, TreeViewType.JSON, type);
				}
				break;
			}
			default:
				break;
		}

		if (!this.isOpenNode(rootId, type)) {
			this.openNodeAndCloseOthers([rootId], type);
		}

		if (
			(searchResult.type === 'table' || searchResult.type === 'body') &&
			!this.isOpenNode(id, type)
		) {
			this.openNode(id, type);
		}

		this.scrollToId(id, type);
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
		const max = this.searchResults[type].length - 1;
		const current = this.currentSearchResult[type];
		this.currentSearchResult[type] = current >= max ? 0 : current + 1;
		this.moveToNextSearchResult(type);
	};

	@action
	prevSearchResult = (type: PanelType) => {
		const max = this.searchResults[type].length - 1;
		const current = this.currentSearchResult[type];
		this.currentSearchResult[type] = current <= 0 ? max : current - 1;
		this.moveToNextSearchResult(type);
	};

	private getCurrentResult = (type: PanelType) => {
		const results = this.searchResults[type];
		const resultIndex = this.currentSearchResult[type];
		if (results.length > 0 && results.length < resultIndex) {
			return results[resultIndex];
		}
		return undefined;
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
						isCaseSensitive: false,
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

	@action setTreeNodes(nodes: TreeNode[], type: PanelType) {
		this.clearHeights(type);
		const nodeHolder = this.getNodeHolder(type);
		nodeHolder.nodes = nodes.slice();
		nodeHolder.idToIndex.clear();
		nodeHolder.nodes.forEach((n, i) => nodeHolder.idToIndex.set(n.id, i));
		if (nodeHolder.nodes.length !== nodeHolder.idToIndex.size) {
			throw new Error(
				// eslint-disable-next-line max-len
				`Number of nodes '${nodeHolder.nodes.length}' isn't matched to number of unique ids '${nodeHolder.idToIndex.size}'`,
			);
		}
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

	private getNodeHolder(type: PanelType) {
		return this.treeNodeHolders[type];
	}

	private static getNodeById(id: string, nodeHolder: TreeNodeHolder) {
		const index = nodeHolder.idToIndex.get(id);
		if (index === undefined) {
			return undefined;
		}
		return nodeHolder.nodes[index];
	}

	private static updateNodeView(id: string, viewType: TreeViewType, nodeHolder: TreeNodeHolder) {
		const index = nodeHolder.idToIndex.get(id);
		if (index === undefined) return undefined;

		const oldNode = nodeHolder.nodes[index];
		if (oldNode && oldNode.viewType !== viewType) {
			const newNode = {
				...oldNode,
				viewType,
			};
			// eslint-disable-next-line no-param-reassign
			nodeHolder.nodes[index] = newNode;
			return newNode;
		}
		return oldNode;
	}

	@action addNodes(tree: TreeNode[], type: PanelType) {
		const nodeHolder = this.getNodeHolder(type);
		const previousLength = nodeHolder.nodes.length;
		nodeHolder.nodes = nodeHolder.nodes.concat(tree);
		tree.forEach((n, i) => nodeHolder.idToIndex.set(n.id, i + previousLength));
		if (nodeHolder.nodes.length !== nodeHolder.idToIndex.size) {
			throw new Error(
				// eslint-disable-next-line max-len
				`Number of nodes '${nodeHolder.nodes.length}' isn't matched to number of unique ids '${nodeHolder.idToIndex.size}'`,
			);
		}
		this.initHeightsData(type);
		this.deactivateSearch(type);
	}

	private static collectRelatedIndexes(
		ids: string[],
		result: Set<string>,
		nodeHolder: TreeNodeHolder,
	) {
		ids.forEach(id => {
			result.add(id);
			const node = JSONViewerStore.getNodeById(id, nodeHolder);
			if (node) JSONViewerStore.collectRelatedIndexes(node.childIds, result, nodeHolder);
		});
		return result;
	}

	@action removeNodesById(ids: string[], type: PanelType) {
		const nodeHolder = this.getNodeHolder(type);
		const relatedIds = new Set<string>();
		JSONViewerStore.collectRelatedIndexes(ids, relatedIds, nodeHolder);
		nodeHolder.nodes = nodeHolder.nodes.filter(node => !relatedIds.has(node.id));
		relatedIds.forEach(id => nodeHolder.idToIndex.delete(id));
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

	@action updateDefaultHeight(height: number, type: PanelType) {
		const defaultHeight = this.defaultHeight[type];
		if (height !== defaultHeight) {
			const heights = this.heights[type];
			for (const [key, value] of heights) {
				if (value.height === defaultHeight) {
					heights.delete(key);
				}
			}
			this.defaultHeight[type] = height;
			this.initHeightsData(type);
		}
	}

	@action initHeightsData(type: PanelType) {
		const defaultHeight = this.defaultHeight[type];
		this.getNodeHolder(type).nodes.forEach(node => {
			if (isTreeNode(node) && !this.heights[type].has(node.id)) {
				this.setNodeHeight(node.id, node.displayTimestamp, defaultHeight, node.parentIds, type);
			}
		});
	}

	@action openNode(id: string, type: PanelType) {
		this.openTreeNodes[type].add(id);
	}

	isOpenNode(id: string, type: PanelType): boolean {
		return this.openTreeNodes[type].has(id);
	}

	@action closeNode(id: string, type: PanelType) {
		this.openTreeNodes[type].delete(id);
	}

	@action openNodeAndCloseOthers(ids: string[], type: PanelType) {
		if (!ids.every(id => this.isOpenNode(id, type))) {
			this.openTreeNodes[type].clear();
			for (let i = 0; i < ids.length; i++) this.openTreeNodes[type].add(ids[i]);
		}
	}

	@action scrollToId(id: string, type: PanelType) {
		this.activeIndex[type] = this.listData[type].findIndex(node => 'id' in node && node.id === id);
	}

	@action setNodeView(id: string, viewType: TreeViewType, type: PanelType) {
		JSONViewerStore.updateNodeView(id, viewType, this.getNodeHolder(type));
	}

	@action setGroupView(id: string, viewType: TreeViewType, type: PanelType) {
		const node = JSONViewerStore.updateNodeView(id, viewType, this.getNodeHolder(type));
		if (node === undefined) return;

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

	private createListData(type: PanelType) {
		const nodeHolder = this.getNodeHolder(type);
		const result = [
			...this.notebooks[type],
			...nodeHolder.nodes
				.filter(node => {
					const parentId = node.parentIds.at(-1);
					if (parentId) {
						const parent = JSONViewerStore.getNodeById(parentId, nodeHolder);
						return (
							node.parentIds.every(parentId => this.isOpenNode(parentId, type)) &&
							(parent?.isRoot || parent?.viewType === TreeViewType.EVENTS_LIST)
						);
					}
					return true;
				})
				.flatMap(node => [
					...this.chunksHeights[type].filter(
						chunkData =>
							this.isCompare &&
							chunkData.height > 0 &&
							chunkData.lastElement === '' &&
							chunkData.firstElement === node.id,
					),
					node,
					...this.chunksHeights[type].filter(
						chunkData =>
							this.isCompare && chunkData.height > 0 && chunkData.lastElement === node.id,
					),
				]),
		];
		return result;
	}

	@computed
	public get listData(): {
		default: (TreeNode | NotebookNode | ChunkHeightData)[];
		compare: (TreeNode | NotebookNode | ChunkHeightData)[];
	} {
		// console.log("Hello, world!");
		return {
			default: this.createListData('default'),
			compare: this.createListData('compare'),
		};
	}

	@computed
	public get intervalsColor() {
		const chunks = new Set<number>();
		[
			...this.treeNodeHolders.default.nodes.filter(node =>
				node.parentIds.every(parentId => this.isOpenNode(parentId, 'default')),
			),
			...this.treeNodeHolders.compare.nodes.filter(node =>
				node.parentIds.every(parentId => this.isOpenNode(parentId, 'compare')),
			),
		].forEach(({ displayTimestamp }) => chunks.add(getChunk(displayTimestamp, this.chunkInterval)));
		return Object.fromEntries(
			Array.from(chunks)
				.sort((a, b) => a - b)
				.map((interval, index) => [interval, index % 2]),
		);
	}

	public getChunksHeight = (type: PanelType) => {
		const heightsFiltered = Array.from(this.heights[type].entries()).filter(([_id, data]) =>
			data.parentIds.every(parentId => this.isOpenNode(parentId, type)),
		);
		const chunks: {
			[chunk: string]: {
				height: number;
				lastElement: string;
				firstElement: string;
			};
		} = {};
		for (let i = 0; i < heightsFiltered.length; i++) {
			const chunk = getChunk(heightsFiltered[i][1].displayTimestamp, this.chunkInterval);
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
		const chunk = getChunk(timestamp, this.chunkInterval);
		const nearestNodeIndex = this.listData[convertType].findIndex(node =>
			!('paramsValue' in node) && 'lastElement' in node
				? node.chunk >= chunk
				: isTreeNode(node) &&
				  node.displayTimestamp &&
				  node.parentIds.every(parentId => this.isOpenNode(parentId, convertType)) &&
				  getChunk(node.displayTimestamp, this.chunkInterval) >= chunk,
		);
		const nearestNodeLocalIndex = this.listData[type].findIndex(node =>
			!('paramsValue' in node) && 'lastElement' in node
				? node.chunk >= chunk
				: isTreeNode(node) &&
				  node.displayTimestamp &&
				  node.parentIds.every(parentId => this.isOpenNode(parentId, type)) &&
				  getChunk(node.displayTimestamp, this.chunkInterval) >= chunk,
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
