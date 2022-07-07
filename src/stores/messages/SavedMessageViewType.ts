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
import { matchWildcardRule } from '../../helpers/regexp';
import { MessageViewType, EventMessage } from '../../models/EventMessage';
import MessageDisplayRulesStore from '../MessageDisplayRulesStore';

export class SavedMessageViewType {
	message: EventMessage;

	parsedMessageId?: string;

	messageDisplayRulesStore: MessageDisplayRulesStore;

	constructor(
		message: EventMessage,
		messageDisplayRulesStore: MessageDisplayRulesStore,
		parsedMessageId?: string,
	) {
		this.message = message;
		this.parsedMessageId = parsedMessageId;

		this.messageDisplayRulesStore = messageDisplayRulesStore;
		reaction(() => this.displayRule, this.setViewType);
	}

	@computed
	private get displayRule() {
		const rootRule = this.messageDisplayRulesStore.rootDisplayRule;
		const declaredRule = this.messageDisplayRulesStore.messageDisplayRules.find(rule => {
			if (rule.session.length > 1 && rule.session.includes('*')) {
				return matchWildcardRule(
					this.parsedMessageId ? this.parsedMessageId : this.message.id,
					rule.session,
				);
			}
			return this.parsedMessageId
				? this.parsedMessageId.includes(rule.session)
				: this.message.id.includes(rule.session);
		});
		if (!this.message || !this.message.parsedMessages) {
			return declaredRule
				? getRawViewType(declaredRule.viewType)
				: rootRule
				? getRawViewType(rootRule.viewType)
				: MessageViewType.ASCII;
		}
		return declaredRule
			? declaredRule.viewType
			: rootRule
			? rootRule.viewType
			: MessageViewType.JSON;
	}

	@observable
	public viewType: MessageViewType = this.displayRule;

	@action
	public setViewType = (vt: MessageViewType) => {
		this.viewType = vt;
	};
}

function isRawViewType(viewType: MessageViewType) {
	return viewType === MessageViewType.ASCII || viewType === MessageViewType.BINARY;
}

function getRawViewType(viewType: MessageViewType) {
	return isRawViewType(viewType) ? viewType : MessageViewType.ASCII;
}
