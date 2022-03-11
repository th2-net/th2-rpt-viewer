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

import { action, computed } from 'mobx';
import { PersistedDataApiSchema } from '../../api/ApiSchema';
import { move } from '../../helpers/array';
import { MessageDisplayRule, MessageViewType } from '../../models/EventMessage';
import {
	PersistedDataCollectionsNames,
	persistedDataLimits,
	PersistedDataTypes,
} from '../../models/PersistedData';
import PersistedStore from './PerstistedStore';

export const DEFAULT_ROOT_RULE: MessageDisplayRule = {
	editableSession: false,
	editableType: true,
	id: 'root',
	removable: false,
	session: '*',
	viewType: MessageViewType.JSON,
};

export default class extends PersistedStore<
	PersistedDataTypes[PersistedDataCollectionsNames.MESSAGE_DISPLAY_RULES]
> {
	constructor(id: string, api: PersistedDataApiSchema) {
		super(id, PersistedDataCollectionsNames.MESSAGE_DISPLAY_RULES, api);
	}

	@computed
	private get isLimitReached() {
		return (
			this.data?.rules.length ===
			persistedDataLimits[PersistedDataCollectionsNames.MESSAGE_DISPLAY_RULES]
		);
	}

	@action
	public setRootDisplayRule = (rootRule: MessageDisplayRule) => {
		if (!this.data) {
			return;
		}
		if (this.data.rootRule.viewType !== rootRule.viewType) {
			this.data = {
				...this.data,
				rootRule,
			};
		}
	};

	@action
	public setNewMessagesDisplayRule = (rule: MessageDisplayRule) => {
		if (!this.data) {
			return;
		}
		const hasSame = this.data.rules.find(
			(existed: MessageDisplayRule) => existed.session === rule.session,
		);
		if (hasSame) return;

		this.data = {
			...this.data,
			rules: this.isLimitReached
				? [rule, ...this.data.rules.slice(0, -1)]
				: [rule, ...this.data.rules],
		};
	};

	@action
	public editMessageDisplayRule = (rule: MessageDisplayRule, newRule: MessageDisplayRule) => {
		if (!this.data) {
			return;
		}
		this.data = {
			...this.data,
			rules: this.data.rules.map(existedRule =>
				existedRule.id === rule.id ? newRule : existedRule,
			),
		};
	};

	@action
	public deleteMessagesDisplayRule = (rule: MessageDisplayRule) => {
		if (!this.data) {
			return;
		}
		this.data = {
			...this.data,
			rules: this.data.rules.filter(existedRule => existedRule.id !== rule.id),
		};
	};

	@action
	public reorderMessagesDisplayRule = (from: number, to: number) => {
		if (!this.data) {
			return;
		}
		this.data = {
			...this.data,
			rules: move(this.data.rules, from, to),
		};
	};
}
