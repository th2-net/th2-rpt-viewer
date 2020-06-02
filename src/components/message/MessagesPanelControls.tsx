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
import KeyCodes from '../../util/KeyCodes';
import PinButton from '../PinButton';
import { useHeatmap } from '../../hooks/useHeatmap';
import { useEventWindowStore } from '../../hooks/useEventWindowStore';
import { useMessagesStore } from '../../hooks/useMessagesStore';
import { useEventWindowViewStore } from '../../hooks/useEventWindowViewStore';
import MessagesFilter from '../filter/MessagesFilterPanel';

const MessagePanelControls = () => {
	const { heatmapElements } = useHeatmap();
	const messagesStore = useMessagesStore();
	const windowViewStore = useEventWindowViewStore();

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
		'messages-panel__button',
		messagesStore.selectedMessagesIds.length < 0 ? 'disabled' : null,
	);

	return (
		<div className="messages-panel__header">
			<div className="messages-panel__group">
				<PinButton isDisabled={true} />
				<MessagesFilter />
			</div>
			<div className="messages-panel__group">
				<h2 className="messages-panel__title">
					Messages
				</h2>
				<div className="messages-panel__controls">
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
					<div className="messages-panel__counter">
						{getStep()}
					</div>
					<div
						className="messages-panel__close-button"
						role="button"
						title="close"
						onClick={() => windowViewStore.showMessages = false}/>
				</div>
			</div>

		</div>
	);
};

export default observer(MessagePanelControls);
