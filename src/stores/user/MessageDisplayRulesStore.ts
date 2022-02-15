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
import { MessageDisplayRule } from '../../models/EventMessage';
import UserDataStore, { DEFAULT_ROOT_DISPLAY_RULE, userDataStoreLimits } from './UserDataStore';

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

	@computed
	private get isLimitReached() {
		return this.rules.length === userDataStoreLimits.messageDisplayRules;
	}

	@action
	public setRootDisplayRule = (rule: MessageDisplayRule) => {
		if (this.rootRule.viewType !== rule.viewType) {
			this.rootRule = rule;
		}
	};

	@action
	public setNewMessagesDisplayRule = (rule: MessageDisplayRule) => {
		const hasSame = this.rules.find(
			(existed: MessageDisplayRule) => existed.session === rule.session,
		);
		if (hasSame) return;
		if (this.isLimitReached) {
			const newRules = this.rules.slice(0, -1);
			this.rules = [rule, ...newRules];
			return;
		}
		this.rules = [rule, ...this.rules];
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
