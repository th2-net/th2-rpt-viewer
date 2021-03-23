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
 *  limitations under the License.
 ***************************************************************************** */

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { isEventAction } from '../../../helpers/event';
import { BookmarkItem } from '../../BookmarksPanel';
import { useActiveWorkspace } from '../../../hooks';
import { EventMessage } from '../../../models/EventMessage';
import { EventAction } from '../../../models/EventAction';
import Empty from '../../util/Empty';

interface Props {
	history: Array<EventAction | EventMessage>;
	onHistoryItemDelete: (historyItem: EventAction | EventMessage) => void;
}

const GraphSearchHistory = (props: Props) => {
	const { history, onHistoryItemDelete } = props;
	const activeWorkspace = useActiveWorkspace();

	const computeKey = (item: EventAction | EventMessage) =>
		isEventAction(item) ? item.eventId : item.messageId;

	if (!history.length) {
		return (
			<div className='graph-search-history'>
				<Empty description='Search history is empty' />
			</div>
		);
	}

	return (
		<div className='graph-search-history'>
			<h4 className='graph-search-history__title'>Search history</h4>
			<hr />
			<div className='graph-search-history__list'>
				{history.map((item, index) => (
					<BookmarkItem
						key={`${computeKey(item)}-${index}`}
						item={item}
						onClick={activeWorkspace.onSavedItemSelect}
						onRemove={() => onHistoryItemDelete(item)}
					/>
				))}
			</div>
		</div>
	);
};

export default observer(GraphSearchHistory);
