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

import { action, observable, reaction } from 'mobx';
import { sortByTimestamp } from '../../helpers/date';
import UserDataStore, { userDataStoreLimits } from './UserDataStore';

export interface Session {
	session: string;
	timestamp: number;
}

export default class LastSearchedSessionsStore {
	constructor(private userStore: UserDataStore) {
		reaction(() => this.sessions, this.userStore.syncLastSessions);
	}

	@observable
	public sessions: Session[] = this.userStore.userPrefs?.lastSearchedSessions || [];

	@action
	public addSessions = (sessions: string[]) => {
		const currentSessionNames = this.sessions.map(({ session }) => session);

		const sessionsToAdd: Session[] = sessions
			.map(session => ({ session, timestamp: Date.now() }))
			.filter(({ session }) => !currentSessionNames.includes(session));

		const newSessions = [...sessionsToAdd, ...this.sessions];

		const sortedNewSessions = sortByTimestamp(newSessions);

		this.sessions = sortedNewSessions.slice(0, userDataStoreLimits.lastSearchedSessions);
	};
}
