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

import { action, observable } from 'mobx';

export class HeightsMetadata {
	@observable private _height: number;

	@observable private _displayTimestamp: number;

	@observable private _parentIds: number[];

	public constructor(height: number, displayTimestamp: number, parentIds: number[]) {
		this._height = height;
		this._displayTimestamp = displayTimestamp;
		this._parentIds = parentIds;
	}

	public get height(): number {
		return this._height;
	}

	public set height(height: number) {
		this._height = height;
	}

	public get displayTimestamp(): number {
		return this._displayTimestamp;
	}

	public get parentIds(): number[] {
		return this._parentIds;
	}

	@action public update(height: number, displayTimestamp: number, parentIds: number[]) {
		this._height = height;
		this._displayTimestamp = displayTimestamp;
		this._parentIds = parentIds;
	}
}
