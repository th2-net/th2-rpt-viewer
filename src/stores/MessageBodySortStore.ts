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

import { action, observable, reaction, runInAction, computed, toJS } from 'mobx';
import moment from 'moment';
import { nanoid } from 'nanoid';
import { move } from '../helpers/array';
import {
	MessageSortOrderItem,
	isMessageBodySortOrderItem,
	isOrderRule,
} from '../models/EventMessage';
import RootStore from './RootStore';
import { IndexedDB, IndexedDbStores, indexedDbLimits, DbData } from '../api/indexedDb';
import { OrderRule, RULES_ORDER_ID } from './MessageDisplayRulesStore';
import notificationsStore from './NotificationsStore';

class MessageBodySortOrderStore {
	constructor(private rootStore: RootStore, private indexedDb: IndexedDB) {
		this.init();
		reaction(() => this.rulesOrder, this.saveRulesOrder);
	}

	@observable
	private isInitializing = true;

	@observable
	public sortOrder: MessageSortOrderItem[] = [];

	@computed
	public get isDisplayRulesFull(): boolean {
		return this.sortOrder.length >= indexedDbLimits[IndexedDbStores.MESSAGE_BODY_SORT_ORDER];
	}

	@computed
	public get rulesOrder(): OrderRule {
		return {
			id: RULES_ORDER_ID,
			order: this.sortOrder.map(({ item }) => item),
			timestamp: moment.utc().valueOf(),
		};
	}

	@action
	public setNewItem = (orderItem: MessageSortOrderItem) => {
		const hasSame = this.sortOrder.find(({ item }) => item === orderItem.item);
		if (!hasSame) {
			this.sortOrder = [orderItem, ...this.sortOrder];
			this.saveRule(orderItem);
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
		this.updateRule(newOrderItem);
	};

	@action
	public deleteItem = (orderItem: MessageSortOrderItem) => {
		this.sortOrder = this.sortOrder.filter(existedItem => existedItem !== orderItem);
		this.indexedDb.deleteDbStoreItem(IndexedDbStores.MESSAGE_BODY_SORT_ORDER, orderItem.id);
	};

	@action
	public reorder = (from: number, to: number) => {
		this.sortOrder = move(this.sortOrder, from, to);
	};

	private init = async () => {
		const sortOrder = await this.indexedDb.getStoreValues<MessageSortOrderItem | OrderRule>(
			IndexedDbStores.MESSAGE_BODY_SORT_ORDER,
		);
		const order = sortOrder.find(isOrderRule)?.order || [];
		const orderRules = sortOrder.filter(isMessageBodySortOrderItem).sort((ruleA, ruleB) => {
			let indexA = order.indexOf(ruleA.item);
			let indexB = order.indexOf(ruleB.item);

			indexA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
			indexB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;

			if (indexA > indexB) {
				return 1;
			}

			if (indexB > indexA) {
				return -1;
			}

			return 0;
		});

		runInAction(() => {
			this.sortOrder = orderRules;
			this.isInitializing = false;
		});
	};

	private saveRulesOrder = (orderRule: OrderRule) => {
		if (!this.isInitializing) {
			this.updateRule(orderRule);
		}
	};

	private saveRule = async (rule: MessageSortOrderItem) => {
		try {
			await this.indexedDb.addDbStoreItem(IndexedDbStores.MESSAGE_BODY_SORT_ORDER, toJS(rule));
		} catch (error) {
			if (error.name === 'QuotaExceededError') {
				this.rootStore.handleQuotaExceededError(rule);
			} else {
				notificationsStore.addMessage({
					errorType: 'genericError',
					type: 'error',
					header: `Failed to save order rule ${rule.id}`,
					description: '',
					id: nanoid(),
				});
			}
		}
	};

	private updateRule = async (rule: MessageSortOrderItem | OrderRule) => {
		try {
			await this.indexedDb.updateDbStoreItem(IndexedDbStores.MESSAGE_BODY_SORT_ORDER, toJS(rule));
		} catch (error) {
			if (error.name === 'QuotaExceededError') {
				this.rootStore.handleQuotaExceededError(rule);
			} else {
				notificationsStore.addMessage({
					errorType: 'genericError',
					type: 'error',
					header: isMessageBodySortOrderItem(rule)
						? `Failed to update order rule ${rule.id}`
						: 'Failed to update rules order',
					description: '',
					id: nanoid(),
				});
			}
		}
	};

	public syncData = async (unsavedData?: DbData) => {
		await this.init();
		if (isMessageBodySortOrderItem(unsavedData)) {
			await this.saveRule(unsavedData);
		}
	};
}

export default MessageBodySortOrderStore;
