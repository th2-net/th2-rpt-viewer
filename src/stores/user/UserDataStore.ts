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

import moment from 'moment';
import { action, computed, observable, reaction, runInAction, toJS } from 'mobx';
import { nanoid } from 'nanoid';
import { UserApiSchema } from '../../api/ApiSchema';
import { IndexedDB, IndexedDbStores } from '../../api/indexedDb';
import { MessageDisplayRule, MessageViewType } from '../../models/EventMessage';
import { User, UserPrefs } from '../../models/User';
import api from '../../api';
import notificationsStore from '../NotificationsStore';
import MessageBodySortStore from './MessageBodySortStore';
import MessageDisplayRulesStore from './MessageDisplayRulesStore';

const DEFAULT_USER_NAME = 'defaultUser';

const DEFAULT_USER: User = {
	name: DEFAULT_USER_NAME,
	id: DEFAULT_USER_NAME,
	timestamp: moment.utc().valueOf(),
};

const DEFAULT_USER_PREFS: UserPrefs = {
	messageDisplayRules: {
		rootRule: {
			editableSession: false,
			editableType: true,
			id: 'root',
			removable: false,
			session: '*',
			viewType: MessageViewType.JSON,
		},
		rules: [],
	},
	messageBodySortOrder: [],
};

export class UserDataStore {
	public messageDisplayRules!: MessageDisplayRulesStore;

	public messageBodySort!: MessageBodySortStore;

	constructor(
		// eslint-disable-next-line no-shadow
		private api: { user: UserApiSchema; indexedDb: IndexedDB },
	) {
		this.init();
		reaction(() => this.userPrefs, this.saveUserPrefs);
	}

	@observable
	public user: User = DEFAULT_USER;

	@observable
	public userPrefs: UserPrefs = DEFAULT_USER_PREFS;

	@computed
	public get isDefaultUser() {
		return this.user.name === DEFAULT_USER_NAME;
	}

	@action
	public setUserName = async (name: string) => {
		this.user = {
			...this.user,
			name,
		};
	};

	@action
	public saveNewUser = async () => {
		if (this.isDefaultUser) {
			const defaultUserPrefs = await this.api.user.getUserPrefs(DEFAULT_USER_NAME);
			this.userPrefs = defaultUserPrefs;
			this.user = {
				...this.user,
				name: DEFAULT_USER_NAME,
				id: DEFAULT_USER_NAME,
			};
			await this.saveUser();
			return;
		}

		if (this.userPrefs) {
			const newUserId = await this.api.user.addNewUserPrefs(this.userPrefs);
			this.setUserId(newUserId);
		}
		await this.saveUser();
	};

	@action
	public syncMessageDisplayRootRule = (rootRule: MessageDisplayRule) => {
		this.userPrefs = {
			...this.userPrefs,
			messageDisplayRules: {
				...this.userPrefs.messageDisplayRules,
				rootRule,
			},
		};
	};

	@action
	public syncMessageDisplayRules = (rules: MessageDisplayRule[]) => {
		this.userPrefs = {
			...this.userPrefs,
			messageDisplayRules: {
				...this.userPrefs.messageDisplayRules,
				rules,
			},
		};
	};

	@action
	public syncMessageBodySortOrder = (messageBodySortOrder: string[]) => {
		this.userPrefs = {
			...this.userPrefs,
			messageBodySortOrder,
		};
	};

	@action
	private setUserId = (id: string) => {
		this.user = {
			...this.user,
			id,
		};
		this.saveUser();
	};

	private saveUserPrefs = (userPrefs: UserPrefs) => {
		if (!this.isDefaultUser) {
			this.api.user.editUserPrefs(this.user.id, userPrefs);
		}
	};

	private saveUser = async () => {
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

	private init = async () => {
		const user =
			(await this.api.indexedDb.getStoreValues<User>(IndexedDbStores.USER))[0] || DEFAULT_USER;

		await this.api.indexedDb.addDbStoreItem(IndexedDbStores.USER, user);

		const userPrefs = (await this.api.user.getUserPrefs(user.id)) || DEFAULT_USER_PREFS;

		runInAction(() => {
			this.user = user;
			this.userPrefs = userPrefs;
		});

		this.messageDisplayRules = new MessageDisplayRulesStore(this);

		this.messageBodySort = new MessageBodySortStore(this);
	};
}

const userDataStore = new UserDataStore({
	user: api.userApi,
	indexedDb: api.indexedDb,
});

export default userDataStore;
