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

import { action, computed, observable, reaction, runInAction, toJS } from 'mobx';
import moment from 'moment';
import { nanoid } from 'nanoid';
import { DbData, IndexedDB, indexedDbLimits, IndexedDbStores } from '../../../api/indexedDb';
import { move } from '../../../helpers/array';
import {
	isMessageDisplayRule,
	isOrderRule,
	MessageDisplayRule,
	MessageViewType,
} from '../../../models/EventMessage';
import notificationsStore from '../../../stores/NotificationsStore';
import RootStore from '../../../stores/RootStore';

export const ROOT_DISPLAY_NAME_ID = 'root';

export const RULES_ORDER_ID = 'order';

export interface OrderRule {
	id: typeof RULES_ORDER_ID;
	order: string[];
	timestamp: number;
}

export function isRootDisplayRule(displayRule: MessageDisplayRule) {
	return displayRule.id === ROOT_DISPLAY_NAME_ID;
}

class MessageDisplayRulesStore {
	constructor(private rootStore: RootStore, private indexedDb: IndexedDB) {
		this.init();

		reaction(() => this.rulesOrder, this.saveRulesOrder);
	}

	@computed
	public get isDisplayRulesFull(): boolean {
		return this.messageDisplayRules.length >= indexedDbLimits[IndexedDbStores.DISPLAY_RULES];
	}

	@computed
	public get rulesOrder(): OrderRule {
		return {
			id: RULES_ORDER_ID,
			order: this.messageDisplayRules.map(({ session }) => session),
			timestamp: moment.utc().valueOf(),
		};
	}

	@observable
	private isInitializingRules = true;

	@observable
	public messageDisplayRules: MessageDisplayRule[] = [];

	@observable
	public rootDisplayRule: MessageDisplayRule | null = null;

	@action
	public setRootDisplayRule = (rule: MessageDisplayRule) => {
		if (this.rootDisplayRule?.viewType !== rule.viewType) {
			this.rootDisplayRule = rule;
			this.updateRule(rule);
		}
	};

	@action
	public setNewMessagesDisplayRule = async (rule: MessageDisplayRule): Promise<void> => {
		if (this.isDisplayRulesFull) {
			notificationsStore.addMessage({
				notificationType: 'genericError',
				type: 'error',
				header: `Display rules limit of ${indexedDbLimits['display-rules']} reached`,
				description: 'Delete old rules',
				id: nanoid(),
			});
			return;
		}

		if (!this.messageDisplayRules.find(existed => existed.session === rule.session)) {
			this.messageDisplayRules = [rule, ...this.messageDisplayRules];
			this.saveRule(rule);
		}
	};

	@action
	public editMessageDisplayRule = (rule: MessageDisplayRule, newRule: MessageDisplayRule) => {
		this.messageDisplayRules = this.messageDisplayRules.map(existedRule =>
			existedRule.id === rule.id ? newRule : existedRule,
		);
		this.updateRule(newRule);
	};

	@action
	public deleteMessagesDisplayRule = (rule: MessageDisplayRule) => {
		this.messageDisplayRules = this.messageDisplayRules.filter(existedRule => existedRule !== rule);
		this.indexedDb.deleteDbStoreItem(IndexedDbStores.DISPLAY_RULES, rule.id);
	};

	@action
	public reorderMessagesDisplayRule = (from: number, to: number) => {
		this.messageDisplayRules = move(this.messageDisplayRules, from, to);
	};

	private init = async () => {
		const rules = await this.indexedDb.getStoreValues<MessageDisplayRule | OrderRule>(
			IndexedDbStores.DISPLAY_RULES,
		);

		const displayRules = rules.filter(isMessageDisplayRule);
		const orderRule = rules.find(isOrderRule);
		const order = orderRule?.order || [];
		const rootRuleIndex = displayRules.findIndex(isRootDisplayRule);

		let rootDisplayRule: MessageDisplayRule;
		if (rootRuleIndex === -1) {
			rootDisplayRule = {
				id: ROOT_DISPLAY_NAME_ID,
				session: '*',
				viewType: MessageViewType.JSON,
				removable: false,
				editableSession: false,
				editableType: true,
				timestamp: moment.utc().valueOf(),
			};
			this.indexedDb.addDbStoreItem(IndexedDbStores.DISPLAY_RULES, rootDisplayRule);
		} else {
			rootDisplayRule = displayRules.splice(rootRuleIndex, 1)[0];
		}

		displayRules.sort((ruleA, ruleB) => {
			let indexA = order.indexOf(ruleA.session);
			let indexB = order.indexOf(ruleB.session);

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
			this.rootDisplayRule = rootDisplayRule;
			this.messageDisplayRules = displayRules;
			this.isInitializingRules = false;
		});
	};

	private saveRulesOrder = (orderRule: OrderRule) => {
		if (!this.isInitializingRules) {
			this.updateRule(orderRule);
		}
	};

	private saveRule = async (rule: MessageDisplayRule) => {
		try {
			await this.indexedDb.addDbStoreItem(IndexedDbStores.DISPLAY_RULES, toJS(rule));
		} catch (error) {
			if (error.name === 'QuotaExceededError') {
				this.rootStore.handleQuotaExceededError(rule);
			} else {
				notificationsStore.addMessage({
					notificationType: 'genericError',
					type: 'error',
					header: `Failed to save rule ${rule.session}`,
					description: '',
					id: nanoid(),
				});
			}
		}
	};

	private updateRule = async (rule: MessageDisplayRule | OrderRule) => {
		try {
			await this.indexedDb.updateDbStoreItem(IndexedDbStores.DISPLAY_RULES, toJS(rule));
		} catch (error) {
			if (error.name === 'QuotaExceededError') {
				this.rootStore.handleQuotaExceededError(rule);
			} else {
				notificationsStore.addMessage({
					notificationType: 'genericError',
					type: 'error',
					header: isMessageDisplayRule(rule)
						? `Failed to update rule ${rule.session}`
						: 'Failed to update rules order',
					description: '',
					id: nanoid(),
				});
			}
		}
	};

	public syncData = async (unsavedData?: DbData) => {
		await this.init();
		if (isMessageDisplayRule(unsavedData)) {
			await this.saveRule(unsavedData);
		}
	};
}

export default MessageDisplayRulesStore;
