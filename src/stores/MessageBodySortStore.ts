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

import { action, observable, reaction } from 'mobx';
import { move } from '../helpers/array';
import localStorageWorker from '../util/LocalStorageWorker';
import { MessageSortOrderItem } from '../models/EventMessage';

class MessageBodySortOrderStore {
	constructor() {
		reaction(() => this.sortOrder, this.onChange);
	}

	@observable
	public sortOrder: MessageSortOrderItem[] = localStorageWorker.getMessageBodySortOrder();

	@action
	public setNewItem = (orderItem: MessageSortOrderItem) => {
		const hasSame = this.sortOrder.find(({ item }) => item === orderItem.item);
		if (!hasSame) {
			this.sortOrder = [orderItem, ...this.sortOrder];
		}
	};

	@action
	public editItem = (orderItem: MessageSortOrderItem, newOrderItem: MessageSortOrderItem) => {
		this.sortOrder = this.sortOrder.map(existedOrderItem => {
			if (existedOrderItem === orderItem) {
				return newOrderItem;
			}
			return existedOrderItem;
		});
	};

	@action
	public deleteItem = (orderItem: MessageSortOrderItem) => {
		this.sortOrder = this.sortOrder.filter(existedItem => existedItem !== orderItem);
	};

	@action
	public reorder = (from: number, to: number) => {
		this.sortOrder = move(this.sortOrder, from, to);
	};

	private onChange = (rules: MessageSortOrderItem[]) => {
		localStorageWorker.setMessageBodySortOrder(rules);
	};
}

export default MessageBodySortOrderStore;
