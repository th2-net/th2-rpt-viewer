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

import { action, computed, observable, reaction } from 'mobx';
import { move } from '../../helpers/array';
import { UserDataStore, userDataStoreLimits } from './UserDataStore';

export default class MessageBodySortOrderStore {
	constructor(private userStore: UserDataStore) {
		reaction(() => this.sortOrder, this.userStore.syncMessageBodySortOrder);
	}

	@observable
	public sortOrder: string[] = this.userStore.userPrefs?.messageBodySortOrder || [];

	@computed
	private get isLimitReached() {
		return this.sortOrder.length === userDataStoreLimits.messageBodySort;
	}

	@action
	public setNewBodySortOrderItem = (orderItem: string) => {
		const hasSame = this.sortOrder.find((item: string) => item === orderItem);
		if (hasSame) return;
		if (this.isLimitReached) {
			const newSortOrder = this.sortOrder.slice(0, -1);
			this.sortOrder = [orderItem, ...newSortOrder];
			return;
		}
		this.sortOrder = [...this.sortOrder, orderItem];
	};

	@action
	public editBodySortOrderItem = (orderItem: string, newOrderItem: string) => {
		this.sortOrder = this.sortOrder.map(existedOrderItem =>
			existedOrderItem === orderItem ? newOrderItem : existedOrderItem,
		);
	};

	@action
	public deleteBodySortOrderItem = (orderItem: string) => {
		this.sortOrder = this.sortOrder.filter(existedItem => existedItem !== orderItem);
	};

	@action
	public reorderBodySort = (from: number, to: number) => {
		this.sortOrder = move(this.sortOrder, from, to);
	};
}
