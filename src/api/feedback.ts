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

import { CollectionsApiPostBody } from '../models/CollectionsApi';
import { FeedbackSchema } from './ApiSchema';

export interface Feedback {
	title: string;
	descr: string;
	image?: string;
	errors: Partial<ErrorEvent>[];
	responses: Partial<Response>[];
}

export enum FeedbackCollectionsNames {
	FEEDBACK = 'rptViewerCollectedFeedback',
}

const feedbackApi: FeedbackSchema = {
	sendFeedback: async (feedback: Feedback) => {
		const preparedBody: CollectionsApiPostBody<Feedback> = {
			collection: FeedbackCollectionsNames.FEEDBACK,
			payload: feedback,
		};
		const body = JSON.stringify(preparedBody);

		const res = await fetch('http://10.44.17.234:8080/store', {
			method: 'post',
			body,
		});

		if (res.ok) {
			return res.json();
		}

		console.error(res.statusText);
		return null;
	},
};

export default feedbackApi;
