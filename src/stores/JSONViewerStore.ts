import { action, observable } from 'mobx';
import { TreeNode } from '../models/JSONSchema';

const nullTreeNode: TreeNode = {
	id: '',
	key: '',
	failed: false,
	viewInstruction: '',
	complexFields: [],
	simpleFields: [],
};

export class JSONViewerStore {
	constructor(private openTableTab: () => void) {}

	@observable
	public isModalOpen = false;

	@observable
	public modalType: 'notebooks' | 'results' = 'results';

	@observable notebooks: string[] = [];

	@observable treeNodes: TreeNode[] = [];

	@observable selectedTreeNode: TreeNode = nullTreeNode;

	@action
	public setIsModalOpen = (v: boolean, type: 'notebooks' | 'results') => {
		this.isModalOpen = v;
		this.modalType = type;
	};

	@action setTreeNodes(n: TreeNode[]) {
		this.treeNodes = n.slice();
	}

	@action setNotebooks(n: string[]) {
		this.notebooks = n.slice();
	}

	@action selectTreeNode(tree?: TreeNode) {
		if (tree) {
			this.selectedTreeNode = tree;
			if (tree.id !== '') {
				this.openTableTab();
			}
		} else {
			this.selectedTreeNode = nullTreeNode;
		}
	}

	@action addNodes(tree: TreeNode[]) {
		this.treeNodes = this.treeNodes.concat(tree);
	}

	@action removeNodesById(ids: string[]) {
		this.treeNodes = this.treeNodes.filter(node => !ids.includes(node.id));
	}
}
