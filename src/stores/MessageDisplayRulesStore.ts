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

import { action, observable, runInAction } from 'mobx';
import { IndexedDB, IndexedDbStores } from '../api/indexedDb';
import { move } from '../helpers/array';
import { MessageDisplayRule, MessageViewType } from '../models/EventMessage';

export const ROOT_DISPLAY_NAME_ID = 'root';

export function isRootDisplayRule(displayRule: MessageDisplayRule) {
	return displayRule.id === ROOT_DISPLAY_NAME_ID;
}

class MessageDisplayRulesStore {
	constructor(private indexedDb: IndexedDB) {
		this.init();
	}

	@observable
	public messageDisplayRules: MessageDisplayRule[] = [];

	@observable
	public rootDisplayRule: MessageDisplayRule | null = null;

	@action
	public setRootDisplayRule = (rule: MessageDisplayRule) => {
		if (this.rootDisplayRule?.viewType !== rule.viewType) {
			this.rootDisplayRule = rule;
			this.indexedDb.updateDbStoreItem(IndexedDbStores.DISPLAY_RULES, rule);
		}
	};

	@action
	public setNewMessagesDisplayRule = (rule: MessageDisplayRule) => {
		const hasSame = this.messageDisplayRules.find(existed => existed.session === rule.session);
		if (!hasSame) {
			this.messageDisplayRules = [rule, ...this.messageDisplayRules];
			this.indexedDb.addDbStoreItem(IndexedDbStores.DISPLAY_RULES, rule);
		}
	};

	@action
	public editMessageDisplayRule = (rule: MessageDisplayRule, newRule: MessageDisplayRule) => {
		this.messageDisplayRules = this.messageDisplayRules.map(existedRule =>
			existedRule.id === rule.id ? newRule : existedRule,
		);
		this.indexedDb.updateDbStoreItem(IndexedDbStores.DISPLAY_RULES, newRule);
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
		const displayRules = await this.indexedDb.getStoreValues<MessageDisplayRule>(
			IndexedDbStores.DISPLAY_RULES,
		);
		const rootRuleIndex = displayRules.findIndex(isRootDisplayRule);
		let rootDisplayRule: MessageDisplayRule;
		if (rootRuleIndex === -1) {
			rootDisplayRule = {
				id: ROOT_DISPLAY_NAME_ID,
				session: '*',
				viewType: MessageViewType.JSON,
				removable: false,
				fullyEditable: false,
			};
			this.indexedDb.addDbStoreItem(IndexedDbStores.DISPLAY_RULES, rootDisplayRule);
		} else {
			rootDisplayRule = displayRules.splice(rootRuleIndex, 1)[0];
		}

		runInAction(() => {
			this.rootDisplayRule = rootDisplayRule;
			this.messageDisplayRules = displayRules;
		});
	};
}

export default MessageDisplayRulesStore;
