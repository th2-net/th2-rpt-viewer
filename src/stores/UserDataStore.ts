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

import { action, computed, observable, runInAction, toJS } from 'mobx';
import moment from 'moment';
import { nanoid } from 'nanoid';
import api from '../api';
import { CollectionsNames, SSESchema, UserApiSchema } from '../api/ApiSchema';
import { IndexedDB, IndexedDbStores } from '../api/indexedDb';
import { move } from '../helpers/array';
import { MessageDisplayRule } from '../models/EventMessage';
import { UserPrefs } from '../models/User';
import notificationsStore from './NotificationsStore';

const DEFAULT_USER_NAME = 'defaultUser';

export interface User {
	id: string;
	name: string;
	timestamp: number;
}

export class UserDataStore {
	constructor(
		// eslint-disable-next-line no-shadow
		private api: { user: UserApiSchema; sse: SSESchema; indexedDb: IndexedDB },
	) {
		this.init();
	}

	@observable
	private usersIds: string[] = [];

	@observable
	public user: User | null = null;

	@observable
	public userPrefs: UserPrefs | null = null;

	@computed
	public get isDefaultUser() {
		return this.user && this.user.name === DEFAULT_USER_NAME;
	}

	@action
	public setUserName = async (name: string) => {
		if (!this.user) return;

		this.user = {
			...this.user,
			name,
		};
	};

	@action
	public saveNewUser = async () => {
		await this.saveUser();

		if (this.userPrefs) {
			const newUserId = await this.api.user.addNewUserPrefs(this.userPrefs);
			this.setUserId(newUserId);
		}
	};

	public setRootDisplayRule = (rule: MessageDisplayRule) => {
		if (!this.userPrefs || !this.user) return;
		if (this.userPrefs?.messageDisplayRules.rootRule.viewType !== rule.viewType) {
			this.userPrefs = {
				...this.userPrefs,
				messageDisplayRules: {
					...this.userPrefs.messageDisplayRules,
					rootRule: rule,
				},
			};
		}
		this.api.user.editUserPrefs(this.user.id, this.userPrefs);
	};

	@action
	public setNewMessagesDisplayRule = (rule: MessageDisplayRule) => {
		if (!this.userPrefs || !this.user) return;
		if (
			!this.userPrefs.messageDisplayRules.rules.find(
				(existed: MessageDisplayRule) => existed.session === rule.session,
			)
		) {
			this.userPrefs = {
				...this.userPrefs,
				messageDisplayRules: {
					...this.userPrefs.messageDisplayRules,
					rules: [rule, ...this.userPrefs.messageDisplayRules.rules],
				},
			};
		}
		this.api.user.editUserPrefs(this.user.id, this.userPrefs);
	};

	@action
	public editMessageDisplayRule = (rule: MessageDisplayRule, newRule: MessageDisplayRule) => {
		if (!this.userPrefs || !this.user) return;

		this.userPrefs = {
			...this.userPrefs,
			messageDisplayRules: {
				...this.userPrefs.messageDisplayRules,
				rules: this.userPrefs.messageDisplayRules.rules.map(existedRule =>
					existedRule.id === rule.id ? newRule : existedRule,
				),
			},
		};
		this.api.user.editUserPrefs(this.user.id, this.userPrefs);
	};

	@action
	public deleteMessagesDisplayRule = (rule: MessageDisplayRule) => {
		if (!this.userPrefs || !this.user) return;

		this.userPrefs = {
			...this.userPrefs,
			messageDisplayRules: {
				...this.userPrefs.messageDisplayRules,
				rules: this.userPrefs.messageDisplayRules.rules.filter(
					existedRule => existedRule.id !== rule.id,
				),
			},
		};
		this.api.user.editUserPrefs(this.user.id, this.userPrefs);
	};

	@action
	public reorderMessagesDisplayRule = (from: number, to: number) => {
		if (!this.userPrefs || !this.user) return;

		this.userPrefs = {
			...this.userPrefs,
			messageDisplayRules: {
				...this.userPrefs.messageDisplayRules,
				rules: move(this.userPrefs.messageDisplayRules.rules, from, to),
			},
		};
		this.api.user.editUserPrefs(this.user.id, this.userPrefs);
	};

	private saveUser = async () => {
		if (!this.user) return;

		try {
			await this.api.indexedDb.updateDbStoreItem(IndexedDbStores.USER, toJS(this.user));
		} catch (error) {
			notificationsStore.addMessage({
				notificationType: 'genericError',
				type: 'error',
				header: 'Failed to update user data',
				description: '',
				id: nanoid(),
			});
		}
	};

	@action
	private setUserId = (id: string) => {
		if (!this.user) return;

		this.user = {
			...this.user,
			id,
		};
		this.saveUser();
	};

	@action
	private onIdsChannelResponse = (e: MessageEvent) => {
		this.usersIds = [...new Set([...this.usersIds, e.data])];
	};

	private init = async () => {
		// const idsChannel = this.api.sse.getCollectionIds(CollectionsNames.USER_PREFERENCES);
		// idsChannel.addEventListener('message', this.onIdsChannelResponse);
		// idsChannel.addEventListener('close', (e: Event) => {
		// 	console.log(e);
		// 	idsChannel.close();
		// });

		let user: User;
		const savedUser = await this.api.indexedDb.getStoreValues<User>(IndexedDbStores.USER);
		user = savedUser[0];
		if (!user) {
			user = { id: DEFAULT_USER_NAME, name: DEFAULT_USER_NAME, timestamp: moment.utc().valueOf() };
			await this.api.indexedDb.addDbStoreItem(IndexedDbStores.USER, user);
		}
		const userPrefs = await this.api.user.getUserPrefs(user.id);
		runInAction(() => {
			this.user = user;
			this.userPrefs = userPrefs;
		});
	};
}

const userDataStore = new UserDataStore({
	user: api.userApi,
	sse: api.sse,
	indexedDb: api.indexedDb,
});

export default userDataStore;
