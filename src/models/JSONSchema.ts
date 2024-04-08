export enum ViewInstruction {
	summaryAndTree = 'summary_and_tree',
	table = 'table',
}

export interface Tree {
	[name: string]: string | number | string[] | Tree | undefined;
	view_instruction?: ViewInstruction;
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
