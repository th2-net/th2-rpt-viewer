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

import { action, observable } from 'mobx';
import { MessageDisplayRule, MessageViewType } from '../models/EventMessage';
import localStorageWorker from '../util/LocalStorageWorker';

function getDefaultMessageDisplayRules() {
	let rules: MessageDisplayRule[];
	const firstTry = localStorageWorker.getMessageDisplayRules();
	if (firstTry.length) {
		rules = firstTry;
	} else {
		localStorageWorker.setMessageDisplayRules([
			{
				session: '*',
				viewType: MessageViewType.JSON,
				removable: false,
				fullyEditable: false,
			},
		]);
		rules = localStorageWorker.getMessageDisplayRules();
	}
	return rules;
}

class MessageDisplayRulesStore {
	@observable
	public messageDisplayRules: MessageDisplayRule[] = getDefaultMessageDisplayRules();

	@action
	public setNewMessagesDisplayRule = (rule: MessageDisplayRule) => {
		const hasSame = this.messageDisplayRules.find(existed => existed.session === rule.session);
		if (!hasSame) {
			this.messageDisplayRules = [...this.messageDisplayRules, rule];
			localStorageWorker.setMessageDisplayRules(this.messageDisplayRules);
		}
	};

	@action
	public editMessageDisplayRule = (rule: MessageDisplayRule, newRule: MessageDisplayRule) => {
		this.messageDisplayRules = this.messageDisplayRules.map(existedRule => {
			if (existedRule === rule) {
				return newRule;
			}
			return existedRule;
		});
		localStorageWorker.setMessageDisplayRules(this.messageDisplayRules);
	};

	@action
	public deleteMessagesDisplayRule = (rule: MessageDisplayRule) => {
		this.messageDisplayRules = this.messageDisplayRules.filter(existedRule => existedRule !== rule);
		localStorageWorker.setMessageDisplayRules(this.messageDisplayRules);
	};
}

const messageDisplayRulesStore = new MessageDisplayRulesStore();

export default messageDisplayRulesStore;
