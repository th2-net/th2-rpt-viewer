/** ****************************************************************************
 * Copyright 2009-2019 Exactpro (Exactpro Systems Limited)
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

import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStores } from '../hooks/useStores';
import { StatusType } from '../models/Status';
import { nextCyclicItemByIndex, prevCyclicItemByIndex } from '../helpers/array';
import SelectionCarousel from './SelectionCarousel';
import { isTestCaseMetadata } from '../models/TestcaseMetadata';

export const FailedTestCaseCarousel = observer(() => {
	const { selectedStore, reportStore } = useStores();
	const failedTestCases = (reportStore.report?.metadata || [])
		.filter(isTestCaseMetadata)
		.filter(item => item.status.status === StatusType.FAILED)
		.map(tc => tc.id);
	const index = failedTestCases.indexOf(selectedStore.selectedTestCaseId as string);

	return <SelectionCarousel
		currentIndex={index + 1}
		next={() => {
			selectedStore.setSelectedTestCase(nextCyclicItemByIndex(failedTestCases, index));
		}}
		prev={() => {
			selectedStore.setSelectedTestCase(prevCyclicItemByIndex(failedTestCases, index));
		}}
		itemsCount={failedTestCases.length}
		isEnabled={failedTestCases.length > 0} />;
});
