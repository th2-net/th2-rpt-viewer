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

import { observable, action } from 'mobx';
import Report from '../models/Report';
import { createReport, createTestCaseMetadata } from '../__tests__/util/creators';
import viewStore from './ViewStore';

export class ReportStore {
	@observable report: Report | null = null;

	@action
	loadReport = () => {
		this.report = createReport(
			new Date().toString(),
			[createTestCaseMetadata(1, new Date().toString(), 100)],
		);
		viewStore.isLoading = false;
	};
}

const reportStore = new ReportStore();

export default reportStore;
