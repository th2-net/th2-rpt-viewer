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

import moment from 'moment';
import React from 'react';
import { getTimestampAsNumber } from '../../helpers/date';
import { isEventAction } from '../../helpers/event';
import { createBemElement } from '../../helpers/styleCreators';
import { EventAction } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';

interface GraphAttachedItemProps {
	item: EventAction | EventMessage;
	left: number;
	bottom: number;
}

const GraphAttachedItem = ({ item, left, bottom }: GraphAttachedItemProps) => {
	const [isInfoOpen, setIsInfoOpen] = React.useState(false);
	const type: 'event' | 'message' = isEventAction(item) ? 'event' : 'message';

	const itemClass = createBemElement(
		'graph-chunk',
		type,
		type === 'event' ? ((item as EventAction).successful ? 'passed' : 'failed') : null,
	);

	const itemInfoClass = createBemElement('graph-chunk', 'item-info', isInfoOpen ? 'open' : null);

	return (
		<div
			style={{
				left: `${left}%`,
				bottom,
			}}
			onMouseOver={() => setIsInfoOpen(true)}
			onMouseLeave={() => setIsInfoOpen(false)}
			className='graph-chunk__item'>
			<div className={itemClass} />
			<div className={itemInfoClass}>
				<div className='graph-chunk__item-name'>
					{type === 'event' ? (item as EventAction).eventName : (item as EventMessage).messageId}
				</div>
				<div className='graph-chunk__item-timestamp'>
					{moment(
						getTimestampAsNumber(
							type === 'event'
								? (item as EventAction).startTimestamp
								: (item as EventMessage).timestamp,
						),
					).format('DD.MM.YYYY HH:mm:ss:SSS')}
				</div>
			</div>
		</div>
	);
};

export default GraphAttachedItem;
