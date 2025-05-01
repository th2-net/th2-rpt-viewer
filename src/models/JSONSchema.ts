/** ****************************************************************************
 * Copyright 2024-2025 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

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
	id: number;
	key: string;
	value: any;
	parentIds?: number[];
}

export interface BlankTreeNode {
	id: number;
	displayTimestamp: number;
	height: number;
	nextId: number;
	prevId: number;
}

export interface NotebookNode {
	name: string;
	parameters: NotebookParameter[];
	paramsValue: InputNotebookParameter[];
	results: number[];
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
	isOff: boolean;
}

export interface NotebookParameters {
	[name: string]: NotebookParameter;
}

export interface Notebook {
	name: string;
	parameters: NotebookParameters;
}
