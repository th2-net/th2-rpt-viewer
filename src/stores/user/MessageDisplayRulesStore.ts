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
import { move } from '../../helpers/array';
import { MessageDisplayRule } from '../../models/EventMessage';
import { DEFAULT_ROOT_DISPLAY_RULE, UserDataStore } from './UserDataStore';

export default class MessageDisplayRulesStore {
	constructor(private userStore: UserDataStore) {
		reaction(() => this.rootRule, this.userStore.syncMessageDisplayRootRule);
		reaction(() => this.rules, this.userStore.syncMessageDisplayRules);
	}

	@observable
	public rootRule: MessageDisplayRule =
		this.userStore.userPrefs?.messageDisplayRules.rootRule || DEFAULT_ROOT_DISPLAY_RULE;

	@observable
	public rules: MessageDisplayRule[] = this.userStore.userPrefs?.messageDisplayRules.rules || [];

	public setRootDisplayRule = (rule: MessageDisplayRule) => {
		if (this.rootRule.viewType !== rule.viewType) {
			this.rootRule = rule;
		}
	};

	@action
	public setNewMessagesDisplayRule = (rule: MessageDisplayRule) => {
		if (!this.rules.find((existed: MessageDisplayRule) => existed.session === rule.session)) {
			this.rules = [rule, ...this.rules];
		}
	};

	@action
	public editMessageDisplayRule = (rule: MessageDisplayRule, newRule: MessageDisplayRule) => {
		this.rules = this.rules.map(existedRule =>
			existedRule.id === rule.id ? newRule : existedRule,
		);
	};

	@action
	public deleteMessagesDisplayRule = (rule: MessageDisplayRule) => {
		this.rules = this.rules.filter(existedRule => existedRule.id !== rule.id);
	};

	@action
	public reorderMessagesDisplayRule = (from: number, to: number) => {
		this.rules = move(this.rules, from, to);
	};
}
