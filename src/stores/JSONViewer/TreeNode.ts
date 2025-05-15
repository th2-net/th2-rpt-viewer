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

import { action, computed, observable } from 'mobx';
import { TreeViewType } from '../../models/JSONSchema';
import { SimpleField } from './SimpleField';
import { nextid } from '../../helpers/JSONViewer';

export interface TreeNodeHolder {
	nodes: TreeNode[];
	idToIndex: Map<number, number>;
}

export class TreeNode {
	public static readonly EMPTY = new TreeNode(Number.MIN_SAFE_INTEGER, '', [], [], false, '');

	public static readonly DISPLAY_NAME_FIELD = '#display-name';

	public static readonly DISPLAY_TIMESTAMP_FIELD = '#display-timestamp';

	public static readonly DISPLAY_TABLE_FIELD = '#display-table';

	public static readonly VIEW_INSTRUCTION_FIELD = '#view-instruction';

	public static readonly TECHNICAL_FIELDS = new Set([
		TreeNode.DISPLAY_NAME_FIELD,
		TreeNode.DISPLAY_TIMESTAMP_FIELD,
		TreeNode.DISPLAY_TABLE_FIELD,
		TreeNode.VIEW_INSTRUCTION_FIELD,
	]);

	public static readonly a = '';

	private _id: number;

	private _key: string;

	@observable private _height: number;

	@observable private _isOpenInTree: boolean;

	@observable private _isOpenInTable: boolean;

	private _parent?: TreeNode;

	private _children: TreeNode[];

	private _displayName?: string;

	private _displayTimestamp?: number;

	private _displayTable?: string[][];

	private _viewInstruction: string;

	private _simpleFields: SimpleField[];

	private _failed: boolean;

	private _isArray?: boolean;

	private _isGeneratedKey?: boolean;

	@observable private _viewType?: TreeViewType;

	private constructor(
		id: number,
		key: string,
		children: TreeNode[],
		simpleFields: SimpleField[],
		failed: boolean,
		viewInstruction: string,
		parent?: TreeNode,
		isOpenInTree?: boolean,
		isOpenInTable?: boolean,
		height?: number,
		displayName?: string,
		displayTimestamp?: number,
		displayTable?: string[][],
		isArray?: boolean,
		isGeneratedKey?: boolean,
		viewType?: TreeViewType,
	) {
		this._id = id;
		this._key = key;
		this._height = height ?? 30;
		this._isOpenInTree = isOpenInTree ?? false;
		this._isOpenInTable = isOpenInTable ?? false;
		this._parent = parent;
		this._children = children;
		this._displayName = displayName;
		this._displayTimestamp = displayTimestamp;
		this._displayTable = displayTable;
		this._viewInstruction = viewInstruction;
		this._simpleFields = simpleFields;
		this._failed = failed;
		this._isArray = isArray;
		this._isGeneratedKey = isGeneratedKey;
		this._viewType = viewType;
	}

	public get id(): number {
		return this._id;
	}

	public get key(): string {
		return this._key;
	}

	public get height(): number {
		return this._height;
	}

	public set height(height: number) {
		this._height = height;
	}

	public get isOpenInTree(): boolean {
		return this._isOpenInTree;
	}

	public set isOpenInTree(isOpen: boolean) {
		this._isOpenInTree = isOpen;
	}

	@computed public get isVisibleInTree(): boolean {
		return (this.parent?.isOpenInTree ?? true) && (this.parent?.isVisibleInTree ?? true);
	}

	public get isOpenInTable(): boolean {
		return this._isOpenInTable;
	}

	public set isOpenInTable(isOpen: boolean) {
		this._isOpenInTable = isOpen;
	}

	public get parent(): TreeNode | undefined {
		return this._parent;
	}

	public get root(): TreeNode {
		return this._parent === undefined ? this : this._parent.root;
	}

	public get isRoot(): boolean {
		return this._parent === undefined;
	}

	public get level(): number {
		let result = 0;
		for (let parent = this.parent; parent !== undefined; parent = parent.parent) {
			result++;
		}
		return result;
	}

	public get isLevel1(): boolean {
		return this._parent !== undefined && this._parent.isRoot;
	}

	public get children(): TreeNode[] {
		return this._children;
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

	public get viewType(): TreeViewType | undefined {
		return this._viewType;
	}

	public set viewType(viewType: TreeViewType | undefined) {
		this._viewType = viewType;
	}

	@action public updateViewTypeRecursively(viewType: TreeViewType) {
		this.viewType = viewType;
		this._children.forEach(childNode => {
			childNode.updateViewTypeRecursively(viewType);
		});
	}

	public static createComplex(key: string, viewType?: TreeViewType): TreeNode {
		return new TreeNode(
			nextid(),
			key,
			[],
			[],
			false,
			'',
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			true,
			viewType,
		);
	}

	public addComplex(
		obj: object,
		key = '',
		isGeneratedKey = false,
		viewType = TreeViewType.EVENTS_LIST,
		index?: number,
	) {
		const filed = TreeNode.parse(obj, this, key, isGeneratedKey, viewType, index);
		this._failed = this._failed && filed.failed;
		this._children.push(filed);
	}

	public addSimple(key: string, value: unknown) {
		// TODO: check because code maybe incorrect
		// if (!failed && typeof item === 'string') {
		// 	failed = TreeNode.isValueFailed(item);
		// }
		if (this._failed && typeof value === 'string' && !TreeNode.isValueFailed(value)) {
			this._failed = false;
		}
		this._simpleFields.push(new SimpleField(nextid(), key, value, this));
	}

	public toString(): string {
		const path: string[] = [this._key];
		for (let parent = this.parent; parent !== undefined; parent = parent.parent) {
			const text = parent._key;
			path.push(text.length > 10 ? `${text.slice(0, 7)}…` : text);
		}
		return `node:${path.reverse().join('/')}`;
	}

	private static parse(
		obj: object,
		parent: TreeNode,
		key = '',
		isGeneratedKey = false,
		viewType = TreeViewType.EVENTS_LIST,
		index?: number,
	): TreeNode {
		const id = nextid();
		const isArray = Array.isArray(obj);
		const failed = TreeNode.isKeyFailed(key);
		const viewInstruction = TreeNode.extractViewInstruction(obj);
		const displayName = TreeNode.extractDisplayName(
			obj,
			typeof index !== 'undefined' ? String(index) : undefined,
		);
		const displayTimestamp = TreeNode.extractDisplayTimestamp(obj);
		const displayTable = TreeNode.extractDisplayTable(obj);

		const result = new TreeNode(
			id, // id
			key, // key
			[], // children
			[], // simpleFields
			failed, // failed
			viewInstruction, // viewInstruction
			parent, // parent
			parent === undefined, // isOpenInTree
			parent === undefined, // isOpenInTable
			undefined, // height
			displayName, // displayName
			displayTimestamp, // displayTimestamp
			displayTable, // displayTable
			isArray, // isArray
			isGeneratedKey, // isGeneratedKey
			viewType, // viewType
		);
		if (isArray) {
			for (let i = 0; i < obj.length; i++) {
				const item = obj[i];
				if (
					typeof item === 'object' &&
					!(
						(key.endsWith('-table') || (displayName && displayName.endsWith('-table'))) &&
						Array.isArray(item)
					)
				) {
					result.addComplex(item, i.toString(), true, viewType, i);
				} else {
					result.addSimple(i.toString(), item);
				}
			}
		} else {
			for (const [entryKey, value] of Object.entries(obj)) {
				// if (entryKey === )
				if (!(entryKey in TreeNode.TECHNICAL_FIELDS)) {
					if (typeof value === 'object' && value !== null) {
						result.addComplex(value, entryKey, false, viewType);
					} else {
						result.addSimple(entryKey, value);
					}
				}
			}
		}

		return result;
	}

	private static isKeyFailed(key: string): boolean {
		return key.includes('[fail]') || key.trim().startsWith('#');
	}

	private static isValueFailed(value: string): boolean {
		return value.trim().startsWith('#') || value.trim().startsWith('!#');
	}

	private static extractField(obj: unknown, key: string): unknown {
		if (typeof obj !== 'object') return undefined;
		if (Array.isArray(obj)) return undefined;
		if (obj === null) return undefined;
		if (!(key in obj)) return undefined;
		return (obj as Record<string, unknown>)[key];
	}

	private static extractViewInstruction(obj: unknown): string {
		const key = TreeNode.VIEW_INSTRUCTION_FIELD;
		const value = TreeNode.extractField(obj, key);
		if (value === undefined) return '';
		if (typeof value !== 'string') {
			console.error(`Unexpected '${typeof value}' type of '${key}' filed: ${value}`);
			return '';
		}
		return value;
	}

	private static extractDisplayName(
		obj: unknown,
		defaultValue: string | undefined,
	): string | undefined {
		const key = TreeNode.DISPLAY_NAME_FIELD;
		const value = TreeNode.extractField(obj, key);
		if (value === undefined) return defaultValue;
		if (typeof value !== 'string') {
			console.error(`Unexpected '${typeof value}' type of '${key}' filed: ${value}`);
			return defaultValue;
		}
		return value;
	}

	private static extractDisplayTimestamp(obj: unknown): number | undefined {
		const key = TreeNode.DISPLAY_TIMESTAMP_FIELD;
		const value = TreeNode.extractField(obj, key);
		if (value === undefined) return undefined;
		if (typeof value === 'string') return Number(value) / 1_000_000;
		if (typeof value === 'number') return value / 1_000_000;
		console.error(`Unexpected '${typeof value}' type of '${key}' filed: ${value}`);
		return undefined;
	}

	private static extractDisplayTable(obj: unknown): string[][] | undefined {
		const key = TreeNode.DISPLAY_TABLE_FIELD;
		const value = TreeNode.extractField(obj, key);
		if (value === undefined) return undefined;
		if (
			!(
				Array.isArray(value) &&
				value.every(
					item => Array.isArray(item) && item.every(subItem => typeof subItem === 'string'),
				)
			)
		) {
			console.error(`Unexpected '${typeof value}' type of '${key}' filed: ${value}`);
			return undefined;
		}
		return value;
	}
}
