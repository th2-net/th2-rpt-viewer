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

import { action, computed, observable } from 'mobx';
import { matchWildcardRule } from '../../helpers/regexp';
import { MessageViewType, EventMessage } from '../../models/EventMessage';
import MessageDisplayRulesStore from '../MessageDisplayRulesStore';

export class SavedMessageViewType {
	message: EventMessage;

	messageDisplayRulesStore: MessageDisplayRulesStore;

	constructor(message: EventMessage, messageDisplayRulesStore: MessageDisplayRulesStore) {
		this.message = message;

		this.messageDisplayRulesStore = messageDisplayRulesStore;

		this.getViewTypes();
	}

	@computed
	private get displayRule() {
		const rootRule = this.messageDisplayRulesStore.rootDisplayRule;
		const declaredRule = this.messageDisplayRulesStore.messageDisplayRules.find(rule => {
			if (rule.session.length > 1 && rule.session.includes('*')) {
				return matchWildcardRule(this.message.id, rule.session);
			}
			return this.message.id.includes(rule.session);
		});
		if (!this.message.parsedMessages) {
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
	public viewTypes: Map<string, MessageViewType> = new Map();

	@action
	private getViewTypes = () => {
		this.viewTypes.set(this.message.id, MessageViewType.ASCII);
		if (this.message.parsedMessages)
			this.message.parsedMessages.forEach(parsedMessage =>
				this.viewTypes.set(parsedMessage.id, this.displayRule),
			);
	};

	@action
	public setViewType = (vt: string, id: string) => {
		this.viewTypes.set(id, vt as MessageViewType);
	};
}

function isRawViewType(viewType: MessageViewType) {
	return viewType === MessageViewType.ASCII || viewType === MessageViewType.BINARY;
}

function getRawViewType(viewType: MessageViewType) {
	return isRawViewType(viewType) ? viewType : MessageViewType.ASCII;
}
