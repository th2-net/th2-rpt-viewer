import { action, observable } from 'mobx';
import ApiSchema from '../api/ApiSchema';
import { Tree } from '../models/JSONSchema';

export class JSONViewerStore {
	constructor(private api: ApiSchema) {}

	@observable data: Tree = {};

	@observable node: [string, Tree] = ['', {}];

	@action setData(t: Tree) {
		this.data = t;
	}

	@action setNode(n: [string, Tree]) {
		this.node = n;
	}
}
