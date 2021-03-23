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
import { nanoid } from 'nanoid';
import { move } from 'helpers/array';
import { MessageDisplayRule, MessageViewType } from 'models/EventMessage';
import localStorageWorker from 'util/LocalStorageWorker';

class MessageDisplayRulesStore {
	constructor() {
		if (!localStorageWorker.getRootDisplayRule()) {
			localStorageWorker.setRootDisplayRule({
				id: nanoid(),
				session: '*',
				viewType: MessageViewType.JSON,
				removable: false,
				fullyEditable: false,
			});
			this.rootDisplayRule = localStorageWorker.getRootDisplayRule();
			return;
		}
		this.rootDisplayRule = localStorageWorker.getRootDisplayRule();

		reaction(() => this.messageDisplayRules, this.onRulesChange);
		reaction(() => this.rootDisplayRule, this.onRootRuleChange);
	}

	@observable
	public messageDisplayRules: MessageDisplayRule[] = localStorageWorker.getMessageDisplayRules();

	@observable
	public rootDisplayRule: MessageDisplayRule | null;

	@action
	public setRootDisplayRule = (rule: MessageDisplayRule): void => {
		if (this.rootDisplayRule?.viewType !== rule.viewType) {
			this.rootDisplayRule = rule;
		}
	};

	@action
	public setNewMessagesDisplayRule = (rule: MessageDisplayRule): void => {
		const hasSame = this.messageDisplayRules.find(existed => existed.session === rule.session);
		if (!hasSame) {
			this.messageDisplayRules = [rule, ...this.messageDisplayRules];
		}
	};

	@action
	public editMessageDisplayRule = (rule: MessageDisplayRule, newRule: MessageDisplayRule): void => {
		this.messageDisplayRules = this.messageDisplayRules.map(existedRule => {
			if (existedRule === rule) {
				return newRule;
			}
			return existedRule;
		});
	};

	@action
	public deleteMessagesDisplayRule = (rule: MessageDisplayRule): void => {
		this.messageDisplayRules = this.messageDisplayRules.filter(existedRule => existedRule !== rule);
	};

	@action
	public reorderMessagesDisplayRule = (from: number, to: number): void => {
		this.messageDisplayRules = move(this.messageDisplayRules, from, to);
	};

	private onRulesChange = (rules: MessageDisplayRule[]) => {
		localStorageWorker.setMessageDisplayRules(rules);
	};

	private onRootRuleChange = (rule: MessageDisplayRule | null) => {
		if (rule) {
			localStorageWorker.setRootDisplayRule(rule);
		}
	};
}

export default MessageDisplayRulesStore;
