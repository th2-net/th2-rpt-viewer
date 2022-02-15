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
import { EventBookmark, MessageBookmark } from '../../components/bookmarks/BookmarksPanel';
import { User, UserPrefs } from '../../models/User';
import notificationsStore from '../NotificationsStore';
import MessageBodySortStore from './MessageBodySortStore';
import MessageDisplayRulesStore from './MessageDisplayRulesStore';
import PinnedItemsStore from './PinnedItemsStore';
import LastSearchedSessionsStore, { Session } from './LastSearchedSessionsStore';
import RootStore from '../RootStore';

export const DEFAULT_ROOT_DISPLAY_RULE = {
	editableSession: false,
	editableType: true,
	id: 'root',
	removable: false,
	session: '*',
	viewType: MessageViewType.JSON,
};

export const DEFAULT_USER_NAME = 'defaultUser';

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
	pinned: {
		events: [],
		messages: [],
	},
	lastSearchedSessions: [],
};

export const userDataStoreLimits = {
	bookmarks: 1000,
	filtersHistory: 40,
	messageDisplayRules: 100,
	messageBodySort: 100,
	searchHistory: 5,
	graphSearchHistory: 1000,
	lastSearchedSessions: 20,
} as const;

export default class {
	public messageDisplayRules!: MessageDisplayRulesStore;

	public messageBodySort!: MessageBodySortStore;

	public pinnedItemsStore!: PinnedItemsStore;

	public lastSearchedSessionsStore!: LastSearchedSessionsStore;

	constructor(private api: { user: UserApiSchema; indexedDb: IndexedDB }, private root: RootStore) {
		this.init();

		reaction(() => this.userPrefs, this.saveUserPrefs);
	}

	public get searchStore() {
		return this.root.workspacesStore.searchWorkspace.searchStore;
	}

	@observable
	public isInitializing = true;

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
		if (this.user)
			this.user = {
				...this.user,
				name,
			};
	};

	@action
	public saveNewUser = async () => {
		if (this.user && this.isDefaultUser) {
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
		if (this.userPrefs)
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
		if (this.userPrefs)
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
		if (this.userPrefs)
			this.userPrefs = {
				...this.userPrefs,
				messageBodySortOrder,
			};
	};

	@action
	public syncPinned = (pinned: { events: EventBookmark[]; messages: MessageBookmark[] }) => {
		if (this.userPrefs)
			this.userPrefs = {
				...this.userPrefs,
				pinned,
			};
	};

	@action
	public syncLastSessions = (sessions: Session[]) => {
		if (this.userPrefs)
			this.userPrefs = {
				...this.userPrefs,
				lastSearchedSessions: sessions,
			};
	};

	@action
	private setUserId = (id: string) => {
		if (this.user)
			this.user = {
				...this.user,
				id,
			};
		this.saveUser();
	};

	@action
	private init = async () => {
		let user = (await this.api.indexedDb.getStoreValues<User>(IndexedDbStores.USER))[0];
		if (!user) {
			user = DEFAULT_USER;
			await this.api.indexedDb.addDbStoreItem(IndexedDbStores.USER, user);
		}

		const userPrefs = (await this.api.user.getUserPrefs(user.id)) || DEFAULT_USER_PREFS;

		runInAction(() => {
			this.user = user;
			this.userPrefs = userPrefs;
		});

		this.messageDisplayRules = new MessageDisplayRulesStore(this);

		this.messageBodySort = new MessageBodySortStore(this);

		this.pinnedItemsStore = new PinnedItemsStore(this);

		this.lastSearchedSessionsStore = new LastSearchedSessionsStore(this);

		this.isInitializing = false;
	};

	private saveUserPrefs = (userPrefs: UserPrefs | null) => {
		if (userPrefs && this.user && !this.isDefaultUser) {
			this.api.user.editUserPrefs(this.user.id, userPrefs);
		}
	};

	private saveUser = async () => {
		if (this.user)
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
}
