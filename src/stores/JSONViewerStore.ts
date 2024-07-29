import { action, observable } from 'mobx';
import { NotebookNode, TreeNode, TreeViewType } from '../models/JSONSchema';
import { WorkspacePanelsLayout } from '../components/workspace/WorkspaceSplitter';
import { getFlatListFromTree } from '../helpers/JSONViewer';

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
	constructor(private openTabs: (layout: WorkspacePanelsLayout) => void) {}

	@observable
	public isModalOpen = false;

	@observable
	public modalType: 'notebooks' | 'results' = 'results';

	@observable notebooks: NotebookNode[] = [];

	@observable treeNodes: TreeNode[] = [];

	@observable openTreeNodes: Set<string> = new Set();

	@observable selectedTreeNode: TreeNode = nullTreeNode;

	@action
	public setIsModalOpen = (v: boolean, type: 'notebooks' | 'results') => {
		this.isModalOpen = v;
		this.modalType = type;
	};

	@action setTreeNodes(n: TreeNode[]) {
		this.treeNodes = n.slice();
	}

	@action setNotebooks(n: NotebookNode[]) {
		this.notebooks = n.slice();
	}

	@action selectTreeNode(tree?: TreeNode) {
		if (tree) {
			this.selectedTreeNode = tree;
		} else {
			this.selectedTreeNode = nullTreeNode;
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
