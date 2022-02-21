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

import { observable, reaction, runInAction } from 'mobx';
import { PersistedDataApiSchema } from '../../api/ApiSchema';
import { PersistedDataCollectionsNames } from '../../models/PersistedData';

export default class PersistedStore<T> {
	constructor(
		private id: string,
		private collection: PersistedDataCollectionsNames,
		private api: PersistedDataApiSchema,
	) {
		this.init();
		reaction(() => this.data, this.syncData);
	}

	@observable
	public data: T | null = null;

	private init = async () => {
		try {
			const data = await this.api.getPersistedData<T>(this.collection, this.id);
			runInAction(() => {
				this.data = data;
			});
		} catch (error) {
			console.error(`Unable to load ${this.collection}`);
		}
	};

	private syncData = (payload: T | null) => {
		if (payload) {
			this.api.setPersistedData(this.collection, payload, this.id);
		}
	};
}
