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
import { UserFeedback, UserPrefs } from '../models/User';
import { UserApiSchema } from './ApiSchema';

const userApi: UserApiSchema = {
	sendUserFeedback: async (feeback: UserFeedback) => {
		const res = await fetch('http://10.44.17.234:8080/store', {
			method: 'post',
			body: JSON.stringify({ rptViewerCollectedFeedback: feeback }),
		});

		if (res.ok) {
			return res.text();
		}

		console.error(res.statusText);
		return null;
	},
	getUserPrefs: async (id: string) => {
		const params = createURLSearchParams({
			collection: 'userPreferences',
			id,
		});
		const res = await fetch(`http://10.44.17.234:8080/getById/?${params}`);
		if (res.ok) {
			return res.json();
		}

		console.error(res.statusText);
		return null;
	},
	addNewUserPrefs: async (prefs: UserPrefs) => {
		const res = await fetch('http://10.44.17.234:8080/store', {
			method: 'post',
			body: JSON.stringify({
				userPreferences: prefs,
			}),
		});

		if (res.ok) {
			return res.text();
		}

		console.error(res.statusText);
		return 'null';
	},
	editUserPrefs: async (userId: string, prefs: UserPrefs) => {
		const res = await fetch('http://10.44.17.234:8080/store', {
			method: 'post',
			body: JSON.stringify({
				userPreferences: {
					[userId]: prefs,
				},
			}),
		});

		if (res.ok) {
			return res.text();
		}

		console.error(res.statusText);
		return null;
	},
};

export default userApi;
