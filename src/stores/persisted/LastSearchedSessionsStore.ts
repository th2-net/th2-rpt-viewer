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

import { action } from 'mobx';
import { PersistedDataApiSchema } from '../../api/ApiSchema';
import { sortByTimestamp } from '../../helpers/date';
import {
	PersistedDataCollectionsNames,
	persistedDataLimits,
	PersistedDataTypes,
} from '../../models/PersistedData';
import PersistedStore from './PerstistedStore';

export interface Session {
	session: string;
	timestamp: number;
}

export default class extends PersistedStore<
	PersistedDataTypes[PersistedDataCollectionsNames.LAST_SEARCHED_SESSIONS]
> {
	constructor(id: string, api: PersistedDataApiSchema) {
		super(id, PersistedDataCollectionsNames.LAST_SEARCHED_SESSIONS, api);
	}

	@action
	public addSessions = (sessions: string[]) => {
		if (!this.data) {
			return;
		}
		const currentSessionNames = this.data.map(({ session }) => session);

		const sessionsToAdd: Session[] = sessions
			.map(session => ({ session, timestamp: Date.now() }))
			.filter(({ session }) => !currentSessionNames.includes(session));

		const newSessions = [...sessionsToAdd, ...this.data];

		const sortedNewSessions = sortByTimestamp(newSessions);

		this.data = sortedNewSessions.slice(
			0,
			persistedDataLimits[PersistedDataCollectionsNames.LAST_SEARCHED_SESSIONS],
		);
	};
}
