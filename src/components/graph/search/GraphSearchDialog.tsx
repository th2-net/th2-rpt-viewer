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

import TimeAgo from 'react-timeago';
import { timestampToNumber } from 'helpers/date';
import { isEventAction } from 'helpers/event';
import { EventAction } from 'models/EventAction';
import { EventMessage } from 'models/EventMessage';
import { BookmarkItem } from 'components/BookmarksPanel';

interface Props {
	className: string;
	isLoading: boolean;
	isError: boolean;
	foundObject: EventAction | EventMessage | null;
}

const GraphSearchDialog = (props: Props) => {
	const { className, isLoading, foundObject, isError } = props;

	const time = isEventAction(foundObject) ? foundObject.startTimestamp : foundObject?.timestamp;

	return (
		<div className={className}>
			{isLoading && <div className='spinner' />}
			{!isLoading && isError && <div className='error' />}
			{!isLoading && foundObject && (
				<>
					<p>{isEventAction(foundObject) ? foundObject.eventId : foundObject.messageId}</p>
					<BookmarkItem item={foundObject} />
					{time && <TimeAgo date={timestampToNumber(time)} />}
				</>
			)}
		</div>
	);
};

export default GraphSearchDialog;
