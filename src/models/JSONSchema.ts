export enum ViewInstruction {
	summaryAndTree = 'summary_and_tree',
	table = 'table',
}

export interface SimpleField {
	key: string;
	value: any;
}

export interface TreeNode {
	id: string;
	key: string;
	failed: boolean;
	viewInstruction: string;
	complexFields: TreeNode[];
	simpleFields: SimpleField[];
}

export interface NotebookParameter {
	name: string;
	inferred_type_name: string;
	default: string;
	help: string;
}

export interface NotebookParameters {
	[name: string]: NotebookParameter;
}

export interface Notebook {
	name: string;
	parameters: NotebookParameters;
}
