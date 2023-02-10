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

import { action, observable, reaction, runInAction, computed } from 'mobx';
import { indexedDbLimits, IndexedDbStores } from '../../api/indexedDb';
import { sortByTimestamp } from '../../helpers/date';
import { Book } from '../../models/Books';
import ApiSchema from '../../api/ApiSchema';
import BooksStore from '../BooksStore';

export interface Session {
	session: string;
	timestamp: number;
}

export class SessionsStore {
	// Session submitted by user
	@observable.ref sessions: Session[] = [];

	// session list for book
	@observable messageSessions: Array<string> = [];

	@observable isLoadingSessions = true;

	constructor(private api: ApiSchema, private booksStore: BooksStore) {
		this.init();

		reaction(
			() => this.sessions,
			sessions => {
				const sessionsToDelete = sessions.slice(indexedDbLimits['sessions-history']);

				if (sessionsToDelete.length !== 0) {
					sessionsToDelete.forEach(session => {
						this.api.indexedDb.deleteDbStoreItem(IndexedDbStores.SESSIONS_HISTORY, session.session);
					});
					this.sessions = sessions.filter(s => !sessionsToDelete.includes(s));
				}
			},
		);

		reaction(() => this.booksStore.selectedBook, this.loadMessageSessions, {
			fireImmediately: true,
		});
	}

	@computed
	public get bookStreams() {
		const userSubmittedSessions = this.sessions
			.filter(session => this.messageSessions.includes(session.session))
			.map(s => s.session);
		return [...new Set([...userSubmittedSessions, ...this.messageSessions])];
	}

	private loadMessageSessions = async (book: Book) => {
		runInAction(() => {
			this.messageSessions = [];
			this.isLoadingSessions = true;
		});
		try {
			const messageSessions = await this.api.messages.getMessageSessions(book.name);
			runInAction(() => {
				this.messageSessions = messageSessions;
			});
		} catch (error) {
			console.error("Couldn't fetch sessions");
		} finally {
			runInAction(() => (this.isLoadingSessions = false));
		}
	};

	@action
	public saveSessions = (sessions: string[]) => {
		const newSessions: Session[] = sessions
			.filter(session => this.messageSessions.includes(session))
			.map(session => ({ session, timestamp: Date.now() }));

		this.sessions = sortByTimestamp([
			...newSessions,
			...this.sessions.filter(session => !sessions.includes(session.session)),
		]);
		newSessions.forEach(session => {
			this.api.indexedDb.updateDbStoreItem(IndexedDbStores.SESSIONS_HISTORY, session);
		});
	};

	@action
	private init = async () => {
		try {
			const sessions = await this.api.indexedDb.getStoreValues<Session>(
				IndexedDbStores.SESSIONS_HISTORY,
			);
			this.sessions = sortByTimestamp(sessions);
		} catch (error) {
			console.error(error);
		}
	};
}
