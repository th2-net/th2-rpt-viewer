/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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

import { observable, action, computed } from 'mobx';
import { SubmittedData, PredictionData } from '../models/MlServiceResponse';
import selectedStore from './SelectedStore';
import { StatusType } from '../models/Status';
import { isAction } from '../models/Action';

export class MLStore {
	@observable token: string | null = null;

	@observable submittedData: SubmittedData[] = [];

	@observable predictionData: PredictionData[] = [];

	@observable predictionsEnabled = true;

	@action
	setMlToken = (token: string) => {
		this.token = token;
	};

	@action
	setSubmittedMlData = (submittedData: SubmittedData[]) => {
		this.submittedData = submittedData;
	};

	@action
	addSubmittedMlData = (submittedData: SubmittedData) => {
		this.submittedData.push(submittedData);
	};

	@action
	removeSubmittedMlData = (data: SubmittedData) => {
		this.submittedData = this.submittedData.filter(entry =>
			!(entry.actionId === data.actionId && entry.messageId === data.messageId));
	};

	@action
	saveSubmittedData = (data: PredictionData[]) => {
		this.submittedData = this.submittedData.concat(
			data.filter(newItem =>
				(!this.predictionData.some(existingItem =>
					(existingItem.actionId === newItem.actionId && existingItem.messageId === newItem.messageId))
				)),
		);
	};

	@action
	togglePredictions = () => {
		this.predictionsEnabled = !this.predictionsEnabled;
	};

	@computed get isPredictionsAvailable() {
		return this.token != null
			&& selectedStore.messages.length > 0
			// eslint-disable-next-line no-confusing-arrow
			&& selectedStore.actions.some(act => isAction(act) && act.status.status === StatusType.FAILED);
	}

	@action
	fetchPredictions = (actionId: number) => {
		console.log('fetchPredictions', actionId);
	};
}

const mlStore = new MLStore();

export default mlStore;
