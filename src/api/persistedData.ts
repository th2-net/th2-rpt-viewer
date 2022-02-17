/** *****************************************************************************
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

import { createURLSearchParams } from '../helpers/url';
import { CollectionsApiPostBody } from '../models/CollectionsApi';
import { PersistedDataCollectionsNames } from '../models/PersistedData';
import { PersistedDataApiSchema } from './ApiSchema';

const persistedDataApi: PersistedDataApiSchema = {
	getPersistedData: async <T>(collection: PersistedDataCollectionsNames, id: string) => {
		const params = createURLSearchParams({
			collection,
			id,
		});

		const res = await fetch(`http://10.44.17.234:8080/getById?${params}`);
		if (res.ok) {
			return (res.json() as unknown) as T;
		}

		console.error(res.statusText);
		return null;
	},
	setPersistedData: async <T>(
		collection: PersistedDataCollectionsNames,
		payload: T,
		id?: string,
	) => {
		const preparedBody: CollectionsApiPostBody<T> = id
			? {
					collection,
					payload,
					id,
			  }
			: { collection, payload };

		const body = JSON.stringify(preparedBody);

		const res = await fetch(`http://10.44.17.234:8080/${id ? 'update' : 'store'}`, {
			method: 'post',
			body,
		});

		if (res.ok) {
			return [collection, await res.text()];
		}

		console.error(res.statusText);
		return [collection, 'null'];
	},
};

export default persistedDataApi;
