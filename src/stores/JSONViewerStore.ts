import { action, observable } from 'mobx';
import { TreeNode, TreeViewType } from '../models/JSONSchema';

export class JSONViewerStore {
	constructor(private openTableTab: () => void) {}

	@observable
	public isModalOpen = false;

	@observable
	public modalType: 'notebooks' | 'results' = 'results';

	@observable viewType: string = TreeViewType.EVENTS_LIST;

	@observable notebooks: string[] = [];

	@observable treeNodes: TreeNode[] = [];

	@observable selectedTreeNode: TreeNode = {
		id: '',
		key: '',
		failed: false,
		viewInstruction: '',
		complexFields: [],
		simpleFields: [],
	};

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

	@action selectTreeNode(tree: TreeNode) {
		this.selectedTreeNode = tree;
		if (tree.id !== '') {
			this.openTableTab();
		}
	}

	@action addNodes(tree: TreeNode[]) {
		this.treeNodes = this.treeNodes.concat(tree);
	}

	@action setView(v: string) {
		this.viewType = v;
		if (v !== TreeViewType.EVENTS_LIST) {
			this.selectTreeNode({
				id: '',
				key: '',
				failed: false,
				viewInstruction: '',
				complexFields: [],
				simpleFields: [],
			});
		} else if (this.treeNodes.length > 0) {
			this.selectTreeNode(this.treeNodes[0]);
		}
	}
}
