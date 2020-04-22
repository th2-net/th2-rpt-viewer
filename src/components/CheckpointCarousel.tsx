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
import SelectionCarousel from './SelectionCarousel';
import { nextCyclicItemByIndex, prevCyclicItemByIndex } from '../helpers/array';

const CheckpointCarousel = observer(() => {
	const { selectedStore } = useStores();
	const index = selectedStore.checkpointActions.findIndex(cp => cp.id === selectedStore.checkpointActionId);
	return <SelectionCarousel
		currentIndex={index + 1}
		next={() => {
			selectedStore.selectCheckpointAction(nextCyclicItemByIndex(selectedStore.checkpointActions, index));
		}}
		prev={() => {
			selectedStore.selectCheckpointAction(prevCyclicItemByIndex(selectedStore.checkpointActions, index));
		}}
		itemsCount={selectedStore.checkpointActions.length}
		isEnabled={selectedStore.checkpointActions.length > 0} />;
});

export default CheckpointCarousel;
