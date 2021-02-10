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
import { Virtuoso } from 'react-virtuoso';
import localStorageWorker from '../../../util/LocalStorageWorker';
import { isEventAction } from '../../../helpers/event';
import { BookmarkItem } from '../../BookmarksPanel';
import { useActiveWorkspace } from '../../../hooks';
import { EventMessage } from '../../../models/EventMessage';
import { EventAction } from '../../../models/EventAction';

interface Props {
	history: Array<EventAction | EventMessage>
}

const TimestampHistory = (props: Props) => {
	const { history } = props;
	const activeWorkspace = useActiveWorkspace();

	const computeKey = (item: EventMessage | EventAction) =>
		isEventAction(item) ? item.eventId : item.messageId;
	return (
		<div className='timestamp-input__history'>
			{history.length !== 0 && (
				<>
					<p>history</p>
					<hr />
					{history.map(item => (
						<BookmarkItem
							key={computeKey(item)}
							item={item}
							onClick={activeWorkspace.onSavedItemSelect}
							onRemove={() => {
								localStorageWorker.saveGOTOTimestampHistory(
									history.filter(historyItem => historyItem !== item),
								);
							}}
						/>
					))}
				</>
			)}
		</div>
	);
};

export default observer(TimestampHistory);
