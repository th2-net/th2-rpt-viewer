import { action, observable } from 'mobx';
import ApiSchema from '../api/ApiSchema';
import { TreeNode } from '../models/JSONSchema';

export class JSONViewerStore {
	constructor(private api: ApiSchema) {}

	@observable
	public isModalOpen = false;

	@observable notebooks: string[] = [];

	@observable treeNodes: TreeNode[] = [];

	@observable selectedTreeNode: TreeNode = {
		id: '',
		key: '',
		viewInstruction: '',
		complexFields: [],
		simpleFields: [],
	};

	@action
	public setIsModalOpen = (v: boolean) => (this.isModalOpen = v);

	@action setTreeNodes(n: TreeNode[]) {
		this.treeNodes = n.slice();
	}

	@action setNotebooks(n: string[]) {
		this.notebooks = n.slice();
	}

	@action selectTreeNode(tree: TreeNode) {
		this.selectedTreeNode = tree;
	}

	@action addNodes(tree: TreeNode[]) {
		this.treeNodes = this.treeNodes.concat(tree);
	}
}
