import { action, observable } from 'mobx';
import ApiSchema from '../api/ApiSchema';
import { Tree } from '../models/JSONSchema';

export class JSONViewerStore {
	constructor(private api: ApiSchema) {}

	@observable
	public isModalOpen = false;

	@observable.shallow data: Tree[] = [];

	@observable notebooks: string[] = [];

	@observable node: [string, Tree] = ['', {}];

	@action
	public setIsModalOpen = (v: boolean) => (this.isModalOpen = v);

	@action setData(t: Tree[]) {
		this.data = t.slice();
		this.node = ['', {}];
	}

	@action addData(t: Tree) {
		this.data.push(t);
	}

	@action setNotebooks(n: string[]) {
		this.notebooks = n.slice();
	}

	@action setNode(n: [string, Tree]) {
		this.node = n;
	}
}
