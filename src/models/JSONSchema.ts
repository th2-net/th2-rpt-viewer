export enum ViewInstruction {
	summaryAndTree = 'summary_and_tree',
	table = 'table',
}

export interface Tree {
	[name: string]: string | string[] | Tree | undefined;
	view_instruction?: ViewInstruction;
}
