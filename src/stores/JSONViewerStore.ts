import { action, observable } from 'mobx';
import ApiSchema from '../api/ApiSchema';
import { Tree } from '../models/JSONSchema';

export class JSONViewerStore {
	constructor(private api: ApiSchema) {}

	@observable
	public isModalOpen = false;

	@observable data: Tree = {};

	@observable node: [string, Tree] = ['', {}];

	@action
	public setIsModalOpen = (v: boolean) => (this.isModalOpen = v);

	@action setData(t: Tree) {
		this.data = t;
		this.node = ['', {}];
	}

	@action setNode(n: [string, Tree]) {
		this.node = n;
	}
}
