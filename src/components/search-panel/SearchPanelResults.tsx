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

import React from 'react';
import moment from 'moment';
import { isEventAction } from '../../helpers/event';
import { createBemElement } from '../../helpers/styleCreators';
import { getTimestampAsNumber } from '../../helpers/date';
import { EventMessage } from '../../models/EventMessage';
import { EventAction } from '../../models/EventAction';

export interface Result {
	value: EventMessage | EventAction;
	type: ResultTypes;
}

export enum ResultTypes {
	MESSAGE = 'message',
	EVENT = 'event',
}

const getResultWithType = (item: EventAction) => ({
	value: item,
	type: isEventAction(item) ? ResultTypes.EVENT : ResultTypes.MESSAGE,
});

interface SearchPanelResultsProps {
	results: EventAction[];
}

const SearchPanelResults = (props: SearchPanelResultsProps) => {
	const { results } = props;
	return (
		<div className='search-panel__results'>
			{results.map(getResultWithType).map((item: Result) => {
				return (
					<div
						key={isEventAction(item.value) ? item.value.eventId : item.value.messageId}
						className={createBemElement(
							'bookmarks-panel',
							'item',
							item.type,
							isEventAction(item.value) ? (item.value.successful ? 'passed' : 'failed') : null,
						)}>
						<i
							className={createBemElement(
								'bookmarks-panel',
								'item-icon',
								`${item.type}-icon`,
								isEventAction(item.value) ? (item.value.successful ? 'passed' : 'failed') : null,
							)}
						/>
						<div className='bookmarks-panel__item-info'>
							<div
								className='bookmarks-panel__item-name'
								title={isEventAction(item.value) ? item.value.eventName : item.value.messageId}>
								{isEventAction(item.value) ? item.value.eventName : item.value.messageId}
							</div>
							<div className='bookmarks-panel__item-timestamp'>
								{moment(
									getTimestampAsNumber(
										isEventAction(item.value) ? item.value.startTimestamp : item.value.timestamp,
									),
								).format('DD.MM.YYYY HH:mm:ss:SSS')}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default SearchPanelResults;
