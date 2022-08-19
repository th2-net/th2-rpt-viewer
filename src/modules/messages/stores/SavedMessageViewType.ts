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
import { matchWildcardRule } from 'helpers/regexp';
import { MessageViewType, EventMessage } from 'models/EventMessage';
import MessageDisplayRulesStore from './MessageDisplayRulesStore';
import { getDefaultRawViewType, getDefaultViewTypesMap, isRawViewType } from '../helpers/message';

export class SavedMessageViewType {
	constructor(
		private message: EventMessage,
		private messageDisplayRulesStore?: MessageDisplayRulesStore,
	) {
		this.message = message;

		this.messageDisplayRulesStore = messageDisplayRulesStore;

		reaction(() => this.displayRule, this.onDisplayRuleChange, { fireImmediately: true });
	}

	@computed
	public get displayRule() {
		const rootRule = this.messageDisplayRulesStore?.rootDisplayRule;
		const declaredRule = this.messageDisplayRulesStore?.messageDisplayRules.find(rule => {
			if (rule.session.length > 1 && rule.session.includes('*')) {
				return matchWildcardRule(this.message.id, rule.session);
			}
			return this.message.sessionId === rule.session;
		});
		if (!this.message.parsedMessages) {
			return declaredRule
				? getDefaultRawViewType(declaredRule.viewType)
				: rootRule
				? getDefaultRawViewType(rootRule.viewType)
				: MessageViewType.ASCII;
		}

		return declaredRule
			? declaredRule.viewType
			: rootRule
			? rootRule.viewType
			: MessageViewType.JSON;
	}

	@observable
	public viewTypes: Map<string, MessageViewType> = getDefaultViewTypesMap(
		this.message,
		this.displayRule,
	);

	@action
	private onDisplayRuleChange = (vt: MessageViewType) => {
		if (!isRawViewType(vt)) {
			this.message.parsedMessages?.forEach(parsedMessage => {
				this.viewTypes.set(parsedMessage.id, vt);
			});
		} else {
			this.viewTypes.set(this.message.id, vt);
		}
	};

	@action
	public setViewType = (id: string, vt: MessageViewType) => {
		this.viewTypes = this.viewTypes.set(id, vt);
	};
}
