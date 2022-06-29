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
import { IndexedDB, indexedDbLimits, IndexedDbStores } from '../../api/indexedDb';
import { sortByTimestamp } from '../../helpers/date';

export interface Session {
	session: string;
	timestamp: number;
}

export class SessionsStore {
	@observable.ref
	public sessions: Session[] = [];

	constructor(private indexedDb: IndexedDB) {
		this.init();

		reaction(
			() => this.sessions,
			sessions => {
				const sessionsToDelete = sessions.slice(indexedDbLimits['sessions-history']);

				if (sessionsToDelete.length !== 0) {
					sessionsToDelete.forEach(session => {
						this.indexedDb.deleteDbStoreItem(IndexedDbStores.SESSIONS_HISTORY, session.session);
					});
					this.sessions = sessions.filter(s => !sessionsToDelete.includes(s));
				}
			},
		);
	}

	@computed
	get sessionNames() {
		return this.sessions.map(({ session }) => session);
	}

	@action
	public saveSessions = (sessions: string[]) => {
		const newSessions: Session[] = sessions.map(session => ({ session, timestamp: Date.now() }));

		this.sessions = sortByTimestamp([
			...newSessions,
			...this.sessions.filter(session => !sessions.includes(session.session)),
		]);
		newSessions.forEach(session => {
			this.indexedDb.updateDbStoreItem(IndexedDbStores.SESSIONS_HISTORY, session);
		});
	};

	@action
	private init = async () => {
		try {
			const sessions = await this.indexedDb.getStoreValues<Session>(
				IndexedDbStores.SESSIONS_HISTORY,
			);
			this.sessions = sortByTimestamp(sessions);
		} catch (error) {
			console.error(error);
		}
	};
}
