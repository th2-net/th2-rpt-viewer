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

import { computed } from 'mobx';
import { TreeNode } from './TreeNode';
import { nextid } from '../../helpers/JSONViewer';

export class Chunk {
	private _id: number;

	private _previousNodeId?: number;

	private _nextNodeId?: number;

	private _chunkId: number;

	private _rootNode: TreeNode | undefined;

	private _level1Nodes: TreeNode[];

	private _nodes: TreeNode[];

	private _relatedChunk?: Chunk;

	constructor(chunkNum: number, rootNode?: TreeNode, previousNodeId?: number, nextNodeId?: number) {
		this._id = nextid();
		this._chunkId = chunkNum;
		this._level1Nodes = [];
		this._nodes = [];
		this._rootNode = rootNode;
		this._previousNodeId = previousNodeId;
		this._nextNodeId = nextNodeId;
	}

	public get id(): number {
		return this._id;
	}

	public get chunkId(): number {
		return this._chunkId;
	}

	public get rootNode(): TreeNode | undefined {
		return this._rootNode;
	}

	public get previousNodeId(): number | undefined {
		return this._previousNodeId;
	}

	public get nextNodeId(): number | undefined {
		return this._nextNodeId;
	}

	public get nodes(): TreeNode[] {
		return this._nodes;
	}

	@computed get height(): number {
		return this._nodes
			.filter(node => node.isOpenInTree)
			.reduce((sum, nodes) => sum + nodes.height, 0);
	}

	@computed get visibleHeight(): number {
		return this._rootNode === undefined || this._rootNode.isOpen
			? Math.max(this.height, this._relatedChunk === undefined ? 0 : this._relatedChunk.height) -
					this.height
			: 0;
	}

	@computed get isVisible(): boolean {
		return this.visibleHeight > 0;
	}

	@computed get firstNodeId(): number {
		return this._nodes[0]?.id ?? Number.MIN_SAFE_INTEGER;
	}

	@computed get lastNodeId(): number {
		return this._nodes[this._nodes.length - 1]?.id ?? Number.MIN_SAFE_INTEGER;
	}

	public set relatedChunk(chunk: Chunk) {
		this._relatedChunk = chunk;
	}

	public add(node: TreeNode) {
		if (!node?.parent?.isRoot) {
			throw new Error(
				`Chunk ${this._chunkId}: ` +
					`the ${node.key}(${node.id}) node is ${node.level} level instead of level 1`,
			);
		}
		if (this._rootNode === undefined) {
			this._rootNode = node.parent;
		} else if (this._rootNode.id !== node.parent.id) {
			throw new Error(
				`Chunk ${this._chunkId}: ` +
					`new ${node.parent.key}(${node.id}) root isn't match to ` +
					`${this._rootNode.key}(${this._rootNode.id}) current`,
			);
		}
		this._level1Nodes.push(node);
		this._nodes.push(node);
		this.addAll(node.children);
	}

	public toString(): string {
		return `chunk:${this._chunkId}`;
	}

	private addAll(nodes: TreeNode[]) {
		this._nodes.push(...nodes);
	}
}
