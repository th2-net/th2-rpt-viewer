import { action, computed, observable } from 'mobx';
import { nanoid } from 'nanoid';
import { NotebookNode, SimpleField, TreeNode, TreeViewType } from '../../models/JSONSchema';
import { WorkspacePanelsLayout } from '../../components/workspace/WorkspaceSplitter';
import { getFlatListFromTree, getFlatListFromTreeWSimple } from '../../helpers/JSONViewer';
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

export class JSONViewerStore {
	public id = nanoid();

	constructor(private openTabs: (layout: WorkspacePanelsLayout) => void) {}

	@observable
	public isModalOpen = false;

	@observable
	public modalType: 'notebooks' | 'results' = 'results';

	@observable notebooks: NotebookNode[] = [];

	@observable treeNodes: TreeNode[] = [];

	@observable openTreeNodes: Set<string> = new Set();

	@observable selectedTreeNode: TreeNode = nullTreeNode;

	@observable selectedFlatTreeNode: (TreeNode | SimpleField)[] = [];

	@observable openSelectedRows: Set<string> = new Set();

	@observable comparableTreeNode: TreeNode = nullTreeNode;

	@observable comparableFlatTreeNode: (TreeNode | SimpleField)[] = [];

	@observable openComparableRows: Set<string> = new Set();

	@observable
	public tokens: SearchToken[] = [];

	@observable
	public scrolledIndex: number | null = null;

	@observable
	public inputValue = '';

	@action
	updateTokens = (nextTokens: SearchToken[]) => {
		const tokens = nextTokens.filter(
			(token, index, newTokens) => newTokens.findIndex(t => t.pattern === token.pattern) === index,
		);

		this.tokens = tokens;
	};

	@action
	updateTokensFromText = (text: string) => {
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
		this.updateTokens(newTokens);
		this.inputValue = '';
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

		downloadTxtFile(
			[
				JSON.stringify(
					this.tokens.map(token => ({ pattern: token.pattern, color: token.color })),
					null,
					'	',
				),
			],
			`${fileName}.json`,
		);
	};

	@action
	blankMethod = () => {
		console.log('unexpected method call');
	};

	@action
	clear = () => {
		this.tokens = [];
	};

	@action
	setInputValue = (value: string) => {
		this.inputValue = value;
	};

	@action
	public setIsModalOpen = (v: boolean, type: 'notebooks' | 'results') => {
		this.isModalOpen = v;
		this.modalType = type;
	};

	@action setTreeNodes(n: TreeNode[]) {
		this.treeNodes = n.slice();
		this.comparableTreeNode = nullTreeNode;
		this.comparableFlatTreeNode = [];
		this.openComparableRows.clear();
	}

	@action setNotebooks(n: NotebookNode[]) {
		this.notebooks = n.slice();
	}

	@action selectTreeNode(tree?: TreeNode) {
		if (tree) {
			this.selectedTreeNode = tree;
			this.selectedFlatTreeNode = getFlatListFromTreeWSimple(tree);
		} else {
			this.selectedTreeNode = nullTreeNode;
			this.selectedFlatTreeNode = [];
		}
		this.openSelectedRows.clear();
		if (this.selectedFlatTreeNode.length > 0) {
			this.openSelectedRows.add(this.selectedFlatTreeNode[0].id);
		}
	}

	@action addNodes(tree: TreeNode[]) {
		this.treeNodes = this.treeNodes.concat(tree);
	}

	@action removeNodesById(ids: string[]) {
		for (let i = 0; i < ids.length; i++) {
			const index = this.treeNodes.findIndex(tree => tree.id === ids[i]);
			this.removeNodesById(this.treeNodes[index].childIds);
		}
		this.treeNodes = this.treeNodes.filter(node => !ids.includes(node.id));
	}

	@action openNode(id: string) {
		this.openTreeNodes.add(id);
	}

	@action closeNode(id: string) {
		this.openTreeNodes.delete(id);
	}

	@action openNodeAndCloseOthers(id: string) {
		this.openTreeNodes.clear();
		this.openTreeNodes.add(id);
	}

	@action setNodeView(id: string, viewType: TreeViewType) {
		const index = this.treeNodes.findIndex(tree => tree.id === id);
		this.treeNodes = [
			...this.treeNodes.slice(0, index),
			{
				...this.treeNodes[index],
				viewType,
			},
			...this.treeNodes.slice(index + 1),
		];
	}

	@action setGroupView(id: string, viewType: TreeViewType) {
		const index = this.treeNodes.findIndex(tree => tree.id === id);
		const node = {
			...this.treeNodes[index],
			viewType,
		};
		this.treeNodes = [...this.treeNodes.slice(0, index), node, ...this.treeNodes.slice(index + 1)];
		for (let i = 0; i < node.childIds.length; i++) {
			this.setGroupView(node.childIds[i], viewType);
		}
		if (node.isRoot) this.openNode(node.id);
	}

	@action getNotebook(name: string, defaultNotebook: NotebookNode) {
		const notebook = this.notebooks.find(n => n.name === name);
		return notebook || defaultNotebook;
	}

	@action addNotebookResult(name: string, newResult: TreeNode, resultCount: number) {
		const index = this.notebooks.findIndex(n => n.name === name);
		if (index < 0) return;
		const notebook = this.notebooks[index];
		notebook.resultsCount = String(resultCount);
		const newResults = [newResult.id, ...notebook.results];

		if (newResult.complexFields.length > 0) {
			this.addNodes(getFlatListFromTree(newResult));
			if (newResults.length > resultCount) {
				this.removeNodesById(newResults.slice(resultCount));
			}
			notebook.results = newResults.slice(0, resultCount);
			this.selectTreeNode(newResult);
			this.openNodeAndCloseOthers(newResult.id);
		}
		notebook.open = false;
		this.notebooks = [
			...this.notebooks.slice(0, index),
			notebook,
			...this.notebooks.slice(index + 1),
		];
	}

	@action updateotebookResultCount(name: string, newCount: string) {
		const index = this.notebooks.findIndex(n => n.name === name);
		if (index < 0) return;
		this.notebooks = [
			...this.notebooks.slice(0, index),
			{
				...this.notebooks[index],
				resultsCount: newCount,
			},
			...this.notebooks.slice(index + 1),
		];
	}

	@action addNodeToCompare(node: TreeNode) {
		this.comparableTreeNode = node;
		this.comparableFlatTreeNode = getFlatListFromTreeWSimple(node);
		this.openComparableRows.clear();
		this.openComparableRows.add(this.comparableFlatTreeNode[0].id);
	}

	@computed
	public get getShownSelectRows() {
		return this.selectedFlatTreeNode
			.slice(1)
			.filter(field => field.parentIds?.every(id => this.openSelectedRows.has(id)));
	}

	@action openSelectRow(id: string) {
		this.openSelectedRows.add(id);
	}

	@action closeSelectRow(id: string) {
		this.openSelectedRows.delete(id);
	}

	@computed
	public get getShownCompareRows() {
		return this.comparableFlatTreeNode
			.slice(1)
			.filter(field => field.parentIds?.every(id => this.openComparableRows.has(id)));
	}

	@action openCompareRow(id: string) {
		this.openComparableRows.add(id);
	}

	@action closeCompareRow(id: string) {
		this.openComparableRows.delete(id);
	}
	/*
	@action updateNotebookParameters(name: string, newParameters: TreeNode) {
		const notebook = this.notebooks.find(n => n.name === name);
		if (!notebook) return;
		const newResults = [newResult.id, ...notebook.results];

		if (newResult.complexFields.length > 0) {
			this.addNodes(getFlatListFromTree(newResult));
			if (newResults.length > notebook.resultsCount) {
				this.removeNodesById(newResults.slice(notebook.resultsCount));
			}
			notebook.results = newResults.slice(0, notebook.resultsCount);
			this.selectTreeNode(newResult);
		}
	} */
}
