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

import { TreeNode } from './TreeNode';

export class SimpleField {
	private _id: number;

	private _key: string;

	private _value: any;

	private _parent: TreeNode;

	public constructor(id: number, key: string, value: any, parent: TreeNode) {
		this._id = id;
		this._key = key;
		this._value = value;
		this._parent = parent;
	}

	public get id(): number {
		return this._id;
	}

	public get key(): string {
		return this._key;
	}

	public get value(): string {
		return this._value;
	}

	public get parent(): TreeNode | undefined {
		return this._parent;
	}

	public get level(): number {
		let result = 0;
		for (let parent = this.parent; parent !== undefined; parent = parent.parent) {
			result++;
		}
		return result;
	}

	public toString(): string {
		const path: string[] = [this._key];
		for (let parent = this.parent; parent !== undefined; parent = parent.parent) {
			const text = parent.key;
			path.push(text.length > 10 ? `${text.slice(0, 7)}…` : text);
		}
		return `simple:${path.reverse().join('/')}`;
	}
}
