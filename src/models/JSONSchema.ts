export enum ViewInstruction {
	summaryAndTree = 'summary_and_tree',
	table = 'table',
}

export enum TreeViewType {
	DISPLAY_TABLE = 'Table',
	EVENTS_LIST = 'Tree',
	JSON = 'Json',
	PRETTY = 'Formatted Json',
	ASCII = 'ASCII',
	BINARY = 'binary',
	ORIGIN = 'Origin',
}

export interface SimpleField {
	id: string;
	key: string;
	value: any;
	parentIds?: string[];
}

export interface TreeNode {
	id: string;
	key: string;
	parentIds: string[];
	displayName?: string;
	displayTimestamp?: number;
	displayTable?: string[][];
	failed: boolean;
	viewInstruction: string;
	complexFields: TreeNode[];
	childIds: string[];
	simpleFields: SimpleField[];
	isArray?: boolean;
	isGeneratedKey?: boolean;
	isRoot?: boolean;
	viewType?: TreeViewType;
}

export interface NotebookNode {
	name: string;
	parameters: NotebookParameter[];
	paramsValue: InputNotebookParameter[];
	results: string[];
	resultsCount: string;
	open: boolean;
}

export interface NotebookParameter {
	name: string;
	inferred_type_name: string;
	default: string;
	help: string;
}

export interface InputNotebookParameter {
	name: string;
	type: string;
	value: string;
	isValid: boolean;
}

export interface NotebookParameters {
	[name: string]: NotebookParameter;
}

export interface Notebook {
	name: string;
	parameters: NotebookParameters;
}
