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

import React from 'react';
import { observer } from 'mobx-react-lite';
import { createStyleSelector } from '../../helpers/styleCreators';
import { useHeatmap } from '../../hooks/useHeatmap';
import { useMessagesWindowStore } from '../../hooks/useMessagesStore';
import MessagesFilter from '../filter/MessagesFilterPanel';
import { useStores } from '../../hooks/useStores';

const MessagesWindowHeader = () => {
	const { heatmapElements } = useHeatmap();
	const { windowsStore } = useStores();
	const messagesStore = useMessagesWindowStore();

	const getStep = () => {
		const messagesIndexes = heatmapElements
			.filter(m => m.id !== undefined)
			.map(m => m.index);
		const step = messagesStore.scrolledIndex
			? messagesIndexes.indexOf(messagesStore.scrolledIndex.valueOf()) + 1
			: 0;
		return `${step} of ${messagesIndexes.length}`;
	};

	const navButtonClass = createStyleSelector(
		'messages-window-header__button',
		windowsStore.eventsAttachedMessages.length > 0 || windowsStore.pinnedMessagesIds.length > 0
			? null : 'disabled',
	);

	return (
		<div className="messages-window-header">
			<div className="messages-window-header__group">
				<MessagesFilter />
			</div>
			<div className="messages-window-header__group">
				<h2 className="messages-window-header__title">
					Messages
				</h2>
				<div className="messages-window-header__steps">
					<div
						className={navButtonClass}
						role="button"
						title="previous"
						onClick={messagesStore.selectPrevMessage}/>
					<div
						className={navButtonClass}
						role="button"
						title="next"
						onClick={messagesStore.selectNextMessage}/>
					<div className="messages-window-header__steps-count">
						{getStep()}
					</div>
				</div>
			</div>
		</div>
	);
};

export default observer(MessagesWindowHeader);
