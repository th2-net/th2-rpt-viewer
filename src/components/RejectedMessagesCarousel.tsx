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
import SelectionCarousel from './SelectionCarousel';
import { isRejected } from '../helpers/message';
import { nextCyclicItemByIndex, prevCyclicItemByIndex } from '../helpers/array';
import { useStores } from '../hooks/useStores';

const RejectedMessagesCarousel = observer(() => {
	const { selectedStore } = useStores();
	const rejectedMessages = selectedStore.testCase!.messages
		.filter(isRejected)
		.map(msg => msg.id);
	const index = rejectedMessages.indexOf(selectedStore.rejectedMessageId as number);

	return <SelectionCarousel
		currentIndex={index + 1}
		next={() => {
			selectedStore.selectRejectedMessage(nextCyclicItemByIndex(rejectedMessages, index));
		}}
		prev={() => {
			selectedStore.selectRejectedMessage(prevCyclicItemByIndex(rejectedMessages, index));
		}}
		itemsCount={rejectedMessages.length}
		isEnabled={rejectedMessages.length > 0} />;
});

export default RejectedMessagesCarousel;
