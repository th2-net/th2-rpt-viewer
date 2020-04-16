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

/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable no-new-wrappers */

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../hooks/useStores';
import Message from '../../models/Message';
import { messagesHeatmap } from '../../helpers/heatmapCreator';
import StateSaverProvider from '../util/StateSaverProvider';
import { VirtualizedList } from '../VirtualizedList';
import { createBemElement } from '../../helpers/styleCreators';
import SkeletonedMessageCardListItem from './SkeletonedMessageCardListItem';
import '../../styles/messages.scss';

export const MessageCardList = observer(() => {
	const getScrolledIndex = (scrolledMessageId: Number, messages: Message[]): Number | null => {
		const scrolledIndex = messages.findIndex(message => message.id === +scrolledMessageId);

		return scrolledIndex !== -1 ? new Number(scrolledIndex) : null;
	};
	// Number objects is used here because in some cases (eg one message / action was selected several
	// times by different entities)
	// We can't understand that we need to scroll to the selected entity again when we are comparing
	// primitive numbers.
	// Objects and reference comparison is the only way to handle numbers changing in this case.
	const [scrolledIndex, setScrolledIndex] = React.useState<Number | null>(null);
	const { filterStore, selectedStore } = useStores();

	React.useEffect(() => {
		if (selectedStore.scrolledMessageId != null) {
			setScrolledIndex(getScrolledIndex(selectedStore.scrolledMessageId, selectedStore.messages));
		}
	}, [selectedStore.scrolledMessageId]);

	const scrollToTop = () => {
		setScrolledIndex(new Number(0));
	};

	const renderMessage = (index: number) => (
		<SkeletonedMessageCardListItem index={index} />
	);

	const computeKey = (index: number) => selectedStore.messages[index]?.id ?? index;

	const listClassName = createBemElement(
		'messages',
		'list',
		filterStore.isFilterApplied ? 'filter-applied' : null,
	);

	return (
		<div className="messages">
			<div className={listClassName}>
				{
					filterStore.isFilterApplied ? (
						<div className="messages__filter-info">
							{selectedStore.messages} Messages Filtered
						</div>
					) : null
				}
				<StateSaverProvider>
					<VirtualizedList
						selectedElements={
							messagesHeatmap(
								selectedStore.messages,
								selectedStore.messagesId,
								selectedStore.selectedActionStatus,
							)
						}
						rowCount={selectedStore.messages.length}
						renderElement={renderMessage}
						computeItemKey={computeKey}
						scrolledIndex={scrolledIndex}
						scrollHints={[]}
					/>
				</StateSaverProvider>
			</div>
		</div>
	);
}, {
	forwardRef: true,
});
