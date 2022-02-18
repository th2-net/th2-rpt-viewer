/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
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

import { action, computed } from 'mobx';
import { PersistedDataApiSchema } from '../../api/ApiSchema';
import { move } from '../../helpers/array';
import { MessageBodyField, MessageBodyFields } from '../../models/MessageBody';
import {
	PersistedDataCollectionsNames,
	persistedDataLimits,
	PersistedDataTypes,
} from '../../models/PersistedData';
import PersistedStore from './PerstistedStore';

export default class extends PersistedStore<
	PersistedDataTypes[PersistedDataCollectionsNames.MESSAGE_BODY_SORT_ORDER]
> {
	constructor(id: string, api: PersistedDataApiSchema) {
		super(id, PersistedDataCollectionsNames.MESSAGE_BODY_SORT_ORDER, api);
	}

	@computed
	private get isLimitReached() {
		return (
			this.data?.length ===
			persistedDataLimits[PersistedDataCollectionsNames.MESSAGE_BODY_SORT_ORDER]
		);
	}

	@action
	public setNewBodySortOrderItem = (orderItem: string) => {
		if (!this.data) {
			return;
		}
		const hasSame = this.data.find((item: string) => item === orderItem);
		if (hasSame) return;

		this.data = this.isLimitReached
			? [...this.data.slice(1), orderItem]
			: [...this.data, orderItem];
	};

	@action
	public editBodySortOrderItem = (orderItem: string, newOrderItem: string) => {
		if (!this.data) {
			return;
		}
		this.data = this.data.map(existedOrderItem =>
			existedOrderItem === orderItem ? newOrderItem : existedOrderItem,
		);
	};

	@action
	public deleteBodySortOrderItem = (orderItem: string) => {
		if (!this.data) {
			return;
		}
		this.data = this.data.filter(existedItem => existedItem !== orderItem);
	};

	@action
	public reorderBodySort = (from: number, to: number) => {
		if (!this.data) {
			return;
		}
		this.data = move(this.data, from, to);
	};

	getSortedFields = (fields: MessageBodyFields) => {
		if (!this.data) {
			return [];
		}
		const primarySortedFields: [string, MessageBodyField][] = Object.entries(
			this.data.reduce(
				(prev, curr) => (fields[curr] ? { ...prev, [curr]: fields[curr] } : prev),
				{},
			),
		);

		const secondarySortedFields: [string, MessageBodyField][] = Object.entries(fields)
			.filter(([key]) => !this.data?.includes(key))
			.sort((a: [string, MessageBodyField], b: [string, MessageBodyField]) => {
				const [keyA] = a;
				const [keyB] = b;
				return keyA.toLowerCase() > keyB.toLowerCase() ? 1 : -1;
			});

		return [...primarySortedFields, ...secondarySortedFields];
	};
}
