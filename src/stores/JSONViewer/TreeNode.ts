/* eslint-disable no-underscore-dangle */
/*
 * Copyright 2025 Exactpro (Exactpro Systems Limited)
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
 */

import { observable } from 'mobx';
import { SimpleField, TreeViewType } from '../../models/JSONSchema';

export interface TreeNodeHolder {
	nodes: TreeNode[];
	idToIndex: Map<number, number>;
}

export class TreeNode {
	private _id: number;

	private _key: string;

	private _parentIds: number[];

	private _childIds: number[];

	private _displayName?: string;

	private _displayTimestamp?: number;

	private _displayTable?: string[][];

	private _viewInstruction: string;

	private _complexFields: TreeNode[];

	private _simpleFields: SimpleField[];

	private _failed: boolean;

	private _isArray?: boolean;

	private _isGeneratedKey?: boolean;

	private _isRoot?: boolean;

	@observable private _viewType?: TreeViewType;

	public constructor(
		id: number,
		key: string,
		parentIds: number[],
		childIds: number[],
		complexFields: TreeNode[],
		simpleFields: SimpleField[],
		failed: boolean,
		viewInstruction: string,
		displayName?: string,
		displayTimestamp?: number,
		displayTable?: string[][],
		isArray?: boolean,
		isGeneratedKey?: boolean,
		isRoot?: boolean,
		viewType?: TreeViewType,
	) {
		this._id = id;
		this._key = key;
		this._parentIds = parentIds;
		this._childIds = childIds;
		this._displayName = displayName;
		this._displayTimestamp = displayTimestamp;
		this._displayTable = displayTable;
		this._viewInstruction = viewInstruction;
		this._complexFields = complexFields;
		this._simpleFields = simpleFields;
		this._failed = failed;
		this._isArray = isArray;
		this._isGeneratedKey = isGeneratedKey;
		this._isRoot = isRoot;
		this._viewType = viewType;
	}

	public get id(): number {
		return this._id;
	}

	public get key(): string {
		return this._key;
	}

	public get parentIds(): number[] {
		return this._parentIds;
	}

	public get childIds(): number[] {
		return this._childIds;
	}

	public get displayName(): string | undefined {
		return this._displayName;
	}

	public get displayTimestamp(): number | undefined {
		return this._displayTimestamp;
	}

	public get displayTable(): string[][] | undefined {
		return this._displayTable;
	}

	public get viewInstruction(): string {
		return this._viewInstruction;
	}

	public get complexFields(): TreeNode[] {
		return this._complexFields;
	}

	public get simpleFields(): SimpleField[] {
		return this._simpleFields;
	}

	public get failed(): boolean {
		return this._failed;
	}

	public get isArray(): boolean | undefined {
		return this._isArray;
	}

	public get isGeneratedKey(): boolean | undefined {
		return this._isGeneratedKey;
	}

	public get isRoot(): boolean | undefined {
		return this._isRoot;
	}

	public get viewType(): TreeViewType | undefined {
		return this._viewType;
	}

	public with(
		update: Partial<{
			id: number;
			key: string;
			parentIds: number[];
			childIds: number[];
			complexFields: TreeNode[];
			simpleFields: SimpleField[];
			failed: boolean;
			viewInstruction: string;
			displayName?: string;
			displayTimestamp?: number;
			displayTable?: string[][];
			isArray?: boolean;
			isGeneratedKey?: boolean;
			isRoot?: boolean;
			viewType?: TreeViewType;
		}>,
	): TreeNode {
		return new TreeNode(
			update.id ?? this._id,
			update.key ?? this._key,
			update.parentIds ?? this._parentIds,
			update.childIds ?? this._childIds,
			update.complexFields ?? this._complexFields,
			update.simpleFields ?? this._simpleFields,
			update.failed ?? this._failed,
			update.viewInstruction ?? this._viewInstruction,
			update.displayName ?? this._displayName,
			update.displayTimestamp ?? this._displayTimestamp,
			update.displayTable ?? this._displayTable,
			update.isArray ?? this._isArray,
			update.isGeneratedKey ?? this._isGeneratedKey,
			update.isRoot ?? this._isRoot,
			update.viewType ?? this._viewType,
		);
	}

	public static createComplex(
		id: number,
		key: string,
		complexFields: TreeNode[],
		failed: boolean,
		isGeneratedKey: boolean,
		isRoot: boolean,
		viewType?: TreeViewType,
	): TreeNode {
		return new TreeNode(
			id,
			key,
			[],
			[],
			complexFields,
			[],
			failed,
			'',
			undefined,
			undefined,
			undefined,
			undefined,
			isGeneratedKey,
			isRoot,
			viewType,
		);
	}

	public static create(
		id: number,
		key: string,
		complexFields: TreeNode[],
		simpleFields: SimpleField[],
		failed: boolean,
		isGeneratedKey: boolean,
		isRoot: boolean,
		viewType?: TreeViewType,
	): TreeNode {
		return new TreeNode(
			id,
			key,
			[],
			[],
			complexFields,
			simpleFields,
			failed,
			'',
			undefined,
			undefined,
			undefined,
			undefined,
			isGeneratedKey,
			isRoot,
			viewType,
		);
	}
}
