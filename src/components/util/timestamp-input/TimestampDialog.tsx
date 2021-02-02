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
import { isEventAction } from '../../../helpers/event';
import { useActiveWorkspace } from '../../../hooks';
import { EventAction } from '../../../models/EventAction';
import { EventMessage } from '../../../models/EventMessage';
import { BookmarkItem } from '../../BookmarksPanel';
import { ModalPortal } from '../Portal';

interface Props {
	className: string;
	rect: DOMRect | null;
	isOpen: boolean;
	foundedObject: EventAction | EventMessage | null;
}

const TimestampDialog = (props: Props) => {
	const { className, rect, isOpen, foundedObject } = props;
	const style: React.CSSProperties = {
		position: 'absolute',
		width: rect ? `${rect.width}px` : 0,
		top: rect ? `${rect.y + rect.height + 1}px` : 0,
		left: rect ? `${rect.x}px` : 0,
		zIndex: 5,
	};

	const activeWorkspace = useActiveWorkspace();

	return (
		<ModalPortal isOpen={isOpen} style={style}>
			<div className={className}>
				{foundedObject ? (
					<p>{isEventAction(foundedObject) ? foundedObject.eventId : foundedObject.messageId}</p>
				) : null}

				{foundedObject && (
					<BookmarkItem
						item={foundedObject}
						onClick={() => {
							activeWorkspace.onSavedItemSelect(foundedObject);
						}}
					/>
				)}
			</div>
		</ModalPortal>
	);
};

export default TimestampDialog;
