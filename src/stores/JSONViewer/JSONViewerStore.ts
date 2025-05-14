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

import { action, computed, observable, trace } from 'mobx';
import { nanoid } from 'nanoid';
import { BlankTreeNode, NotebookNode, TreeViewType } from '../../models/JSONSchema';
import { WorkspacePanelsLayout } from '../../components/workspace/WorkspaceSplitter';
import {
	getChunkId,
	getFlatListFromTree,
	getFlatListFromTreeWSimple,
} from '../../helpers/JSONViewer';
import SearchToken from '../../models/search/SearchToken';
import notificationsStore from '../NotificationsStore';
import { downloadTxtFile } from '../../helpers/files/downloadTxt';
import multiTokenSplit from '../../helpers/search/multiTokenSplit';
import { getKeyValueTokens } from '../../helpers/search/getSpecificTokens';
import SearchSplitResult from '../../models/search/SearchSplitResult';
import { TreeNode, TreeNodeHolder } from './TreeNode';
import { SimpleField } from './SimpleField';
import { Chunk } from './Chunk';

const SEARCH_COLOR = 'black';

export interface ChunkHeightData {
	chunk: number;
	firstElement: number;
	lastElement: number;
	height: number;
}

export interface BaseReaderSearchResult {
	type: 'name' | 'table' | 'body';
	id: number;
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

	@observable treeNodeHolders: {
		default: TreeNodeHolder;
		compare: TreeNodeHolder;
	} = {
		default: {
			nodes: [],
			idToIndex: new Map<number, number>(),
		},
		compare: {
			nodes: [],
			idToIndex: new Map<number, number>(),
		},
	};

	@observable selectedTreeNode: {
		default: TreeNode;
		compare: TreeNode;
	} = {
		default: TreeNode.EMPTY,
		compare: TreeNode.EMPTY,
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
		const findInDisplayName = (id: number, displayName?: string): boolean => {
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

		const findInDisplayTable = (id: number, displayTable?: string[][]): boolean => {
			if (!displayTable) return false;
			for (let rowIndex = 0; rowIndex < displayTable.length; rowIndex++) {
				const row = displayTable[rowIndex];
				for (let cellIndex = 0; cellIndex < row.length; cellIndex++) {
					const cell = row[cellIndex];
					const content = typeof cell === 'string' ? `"${cell}"` : String(cell);
					const contentIndex = multiTokenSplit(content, searchTokens).findIndex(
						result => result.token,
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

		const findInSimpleFields = (id: number, simpleFields: SimpleField[]): boolean => {
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
				if (node.isLevel1) {
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
		if (!searchNode.isLevel1) {
			console.error(`Node with '${id}' id hasn't got single parent id - ${searchNode.level} level`);
			return;
		}
		const rootNode = searchNode.root;

		switch (searchResult.type) {
			case 'table': {
				if (searchNode.viewType !== TreeViewType.DISPLAY_TABLE) {
					searchNode.viewType = TreeViewType.DISPLAY_TABLE;
				}
				break;
			}
			case 'body': {
				if (
					searchNode?.viewType !== TreeViewType.JSON &&
					searchNode.viewType !== TreeViewType.PRETTY
				) {
					searchNode.viewType = TreeViewType.JSON;
				}
				break;
			}
			default:
				break;
		}

		if (!rootNode.isOpen) {
			this.openRootNodeOnly(rootNode, type);
		}

		if ((searchResult.type === 'table' || searchResult.type === 'body') && !searchNode.isOpen) {
			searchNode.isOpen = true;
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

	compareNameResults = (type: PanelType, id: number, results: SearchSplitResult[]) =>
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
		id: number,
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
		id: number,
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
		this.model = this.createModel();
	};

	@action
	updateIntervalSize = (newInterval: number) => {
		this.intervalSize = newInterval;
		this.model = this.createModel();
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
		console.error('unexpected method call');
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
		this.model = this.createModel();
		this.selectedTreeNode[type] = TreeNode.EMPTY;
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
			this.selectedTreeNode[type] = TreeNode.EMPTY;
			this.selectedFlatTreeNode[type] = [];
		}
	}

	private getNodeHolder(type: PanelType) {
		return this.treeNodeHolders[type];
	}

	private static getNodeById(id: number, nodeHolder: TreeNodeHolder) {
		const index = nodeHolder.idToIndex.get(id);
		if (index === undefined) {
			return undefined;
		}
		return nodeHolder.nodes[index];
	}

	// TODO: move to TreeNode class
	private static updateNodeView(node: TreeNode, viewType: TreeViewType, recursively: boolean) {
		if (node.viewType !== viewType) {
			// eslint-disable-next-line no-param-reassign
			node.viewType = viewType;
			if (recursively) {
				node.children.forEach(childNode => {
					JSONViewerStore.updateNodeView(childNode, viewType, recursively);
				});
			}
			return node;
		}
		return node;
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
		this.model = this.createModel();
		this.deactivateSearch(type);
	}

	private static collectRelatedIndexes(
		ids: number[],
		result: Set<number>,
		nodeHolder: TreeNodeHolder,
	) {
		ids.forEach(id => {
			result.add(id);
			const node = JSONViewerStore.getNodeById(id, nodeHolder);
			if (node)
				JSONViewerStore.collectRelatedIndexes(
					node.children.map(child => child.id),
					result,
					nodeHolder,
				);
		});
		return result;
	}

	@action removeNodesById(ids: number[], type: PanelType) {
		const nodeHolder = this.getNodeHolder(type);
		const relatedIds = new Set<number>();
		JSONViewerStore.collectRelatedIndexes(ids, relatedIds, nodeHolder);
		nodeHolder.nodes = nodeHolder.nodes.filter(node => !relatedIds.has(node.id));
		relatedIds.forEach(id => nodeHolder.idToIndex.delete(id));
	}

	@action updateNodeHeight(id: number, height: number, type: PanelType) {
		const nodeHolder = this.getNodeHolder(type);
		const current = JSONViewerStore.getNodeById(id, nodeHolder);
		if (current) {
			current.height = height;
		}
	}

	@action openRootNodeOnly(rootNode: TreeNode, type: PanelType) {
		if (!rootNode.isRoot) {
			console.error(`Node '${rootNode.id}' isn't root`);
			return;
		}
		const nodeHolder = this.getNodeHolder(type);
		nodeHolder.nodes.forEach(node => {
			if (node.isRoot && node.id !== rootNode.id) {
				// eslint-disable-next-line no-param-reassign
				node.isOpen = false;
			}
		});
		// eslint-disable-next-line no-param-reassign
		rootNode.isOpen = true;
	}

	@action scrollToId(id: number, type: PanelType) {
		this.activeIndex[type] = this.visibleData[type].findIndex(
			node => node instanceof TreeNode && node.id === id,
		);
	}

	@action setGroupView(node: TreeNode, viewType: TreeViewType, type: PanelType) {
		node.updateViewTypeRecursively(viewType);

		if (node.isRoot) this.openRootNodeOnly(node, type);
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

		if (newResult.children.length > 0) {
			this.addNodes(getFlatListFromTree(newResult), type);
			if (newResults.length > resultCount) {
				this.removeNodesById(newResults.slice(resultCount), type);
			}
			notebook.results = newResults.slice(0, resultCount);
			this.selectTreeNode(type, newResult);
			this.openRootNodeOnly(newResult, type);
		}
		notebook.open = false;
		this.notebooks[type] = [
			...this.notebooks[type].slice(0, index),
			notebook,
			...this.notebooks[type].slice(index + 1),
		];
	}

	@action updateNotebookResultCount(name: string, newCount: string, type: PanelType) {
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
			default: this.selectedFlatTreeNode.default.slice(1).filter(field => field.isOpenInTree),
			compare: this.selectedFlatTreeNode.compare.slice(1).filter(field => field.isOpenInTree),
		};
	}

	private createModel() {
		const chunksHeights = this.createChunks();
		return {
			default: this.createPanelModel(chunksHeights, 'default'),
			compare: this.createPanelModel(chunksHeights, 'compare'),
		};
	}

	private createPanelModel(
		chunksHeights: {
			default: Chunk[];
			compare: Chunk[];
		},
		type: PanelType,
	) {
		const nodeHolder = this.getNodeHolder(type);
		const result = [
			...this.notebooks[type],
			...nodeHolder.nodes.flatMap(node => {
				if (this.isCompare) {
					return [
						...chunksHeights[type].filter(chunk => chunk.nextNodeId === node.id),
						node,
						...chunksHeights[type].filter(
							chunk => chunk.previousNodeId === node.id || chunk.lastNodeId === node.id,
						),
					];
				}
				return [node];
			}),
		];
		return result;
	}

	@observable model: {
		default: (TreeNode | NotebookNode | Chunk)[];
		compare: (TreeNode | NotebookNode | Chunk)[];
	} = {
		default: [],
		compare: [],
	};

	private filterVisibleData(type: PanelType) {
		trace();
		return this.model[type].filter(node => {
			if (node instanceof TreeNode && !node.isOpenInTree) {
				return false;
			}
			if (node instanceof Chunk && !node.isVisible) {
				return false;
			}
			return true;
		});
	}

	@computed public get visibleData(): {
		default: (TreeNode | NotebookNode | Chunk)[];
		compare: (TreeNode | NotebookNode | Chunk)[];
	} {
		return {
			default: this.filterVisibleData('default'),
			compare: this.filterVisibleData('compare'),
		};
	}

	@computed
	public get intervalsColor() {
		const chunks = new Set<number>();
		[...this.visibleData.default, ...this.visibleData.compare].forEach(node => {
			if (node instanceof TreeNode) {
				chunks.add(getChunkId(node.displayTimestamp, this.chunkInterval));
			} else if (node instanceof Chunk) {
				chunks.add(node.chunkId);
			}
		});
		const result = Object.fromEntries(
			Array.from(chunks)
				.sort((a, b) => a - b)
				.map((interval, index) => [interval, index % 2]),
		);
		return result;
	}

	public createPanelChunks(type: PanelType) {
		// FIXME: can't work with multiple lists
		const level1Nodes = Array.from(this.getNodeHolder(type).nodes.filter(node => node.isLevel1));
		const chunks: Map<number, Chunk> = new Map();
		for (const node of level1Nodes.values()) {
			const chunkNum = getChunkId(node.displayTimestamp, this.chunkInterval);
			let chunk = chunks.get(chunkNum);
			if (!chunk) {
				chunk = new Chunk(chunkNum);
				chunks.set(chunkNum, chunk);
			}
			chunk?.add(node);
		}
		return chunks;
	}

	public createChunks() {
		const defaultChunks = this.createPanelChunks('default');
		const compareChunks = this.createPanelChunks('compare');
		const defaultKeys = Array.from(defaultChunks.keys());
		const compareKeys = Array.from(compareChunks.keys());
		const defaultReverseKeys = Array.from(defaultKeys).reverse();
		const compareReverseKeys = Array.from(compareKeys).reverse();
		const defaultValues = Array.from(defaultChunks.values());
		const compareValues = Array.from(compareChunks.values());
		const resultDefaultChunks: Chunk[] = [];
		const resultCompareChunks: Chunk[] = [];

		const combine = (chunkNum: number, currentChunk?: Chunk, relatedChunk?: Chunk): Chunk => {
			const chunk: Chunk = currentChunk ?? new Chunk(chunkNum);
			if (relatedChunk) {
				chunk.relatedChunk = relatedChunk;
			}
			return chunk;
		};

		for (const chunkNum of defaultKeys.filter(key => compareKeys.includes(key))) {
			const defaultChunk = defaultChunks.get(chunkNum);
			const compareChunk = compareChunks.get(chunkNum);
			if (defaultChunk === undefined || compareChunk === undefined) {
				console.error(`Chunks for ${chunkNum} num can't be undefined`);
				break;
			}
			resultDefaultChunks.push(combine(chunkNum, defaultChunk, compareChunk));
			resultCompareChunks.push(combine(chunkNum, compareChunk, defaultChunk));
		}

		const pushExclusive = (
			currentChunks: Chunk[],
			relatedChunkIds: number[],
			collection: Chunk[],
		) => {
			for (const chunk of currentChunks) {
				if (!relatedChunkIds.includes(chunk.chunkId)) {
					collection.push(chunk);
				}
			}
		};

		const pushNew = (
			relatedChunks: Chunk[],
			currentChunks: Map<number, Chunk>,
			currentChunkIds: number[],
			currentReverseChunkIds: number[],
			collection: Chunk[],
		) => {
			for (const chunk of relatedChunks) {
				if (!currentChunkIds.includes(chunk.chunkId)) {
					const previous = currentChunks.get(
						currentReverseChunkIds.find(key => key < chunk.chunkId) ?? Number.MIN_SAFE_INTEGER,
					);
					const next = currentChunks.get(
						currentChunkIds.find(key => key > chunk.chunkId) ?? Number.MIN_SAFE_INTEGER,
					);
					const newChunk = new Chunk(
						chunk.chunkId,
						previous?.rootNode ?? next?.rootNode,
						previous?.lastNodeId,
						previous === undefined ? next?.firstNodeId : undefined,
					);
					newChunk.relatedChunk = chunk;
					collection.push(newChunk);
				}
			}
		};

		pushExclusive(defaultValues, compareKeys, resultDefaultChunks);
		pushExclusive(compareValues, defaultKeys, resultCompareChunks);

		pushNew(compareValues, defaultChunks, defaultKeys, defaultReverseKeys, resultDefaultChunks);
		pushNew(defaultValues, compareChunks, compareKeys, compareReverseKeys, resultCompareChunks);

		return {
			default: resultDefaultChunks.sort((a, b) => a.chunkId - b.chunkId),
			compare: resultCompareChunks.sort((a, b) => a.chunkId - b.chunkId),
		};
	}

	@action scrollToNearest(timestamp: number, type: PanelType) {
		const convertType = type === 'default' ? 'compare' : 'default';
		const chunk = getChunkId(timestamp, this.chunkInterval);
		const nearestNodeIndex = this.visibleData[convertType].findIndex(node =>
			node instanceof Chunk
				? node.chunkId >= chunk
				: node instanceof TreeNode &&
				  node.displayTimestamp &&
				  node.isOpenInTree &&
				  getChunkId(node.displayTimestamp, this.chunkInterval) >= chunk,
		);
		const nearestNodeLocalIndex = this.visibleData[type].findIndex(node =>
			node instanceof Chunk
				? node.chunkId >= chunk
				: node instanceof TreeNode &&
				  node.displayTimestamp &&
				  node.isOpenInTree &&
				  getChunkId(node.displayTimestamp, this.chunkInterval) >= chunk,
		);
		if (nearestNodeIndex && nearestNodeLocalIndex) {
			const nearestNode = this.visibleData[convertType][nearestNodeIndex];
			if (nearestNode instanceof TreeNode) this.selectedTreeNode[convertType] = nearestNode;
			this.activeIndex[convertType] = nearestNodeIndex;
			const nearestNodeLocal = this.visibleData[type][nearestNodeLocalIndex];
			if (nearestNodeLocal instanceof TreeNode) this.selectedTreeNode[type] = nearestNodeLocal;
			this.activeIndex[type] = nearestNodeLocalIndex;
		}
	}
}
