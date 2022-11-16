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

import { forwardRef } from 'react';
import { Panel } from 'models/Panel';
import MessagesFilter from 'models/filter/MessagesFilter';
import { useActivePanel } from 'hooks/useActivePanel';
import { createStyleSelector } from 'helpers/styleCreators';
import { FiltersHistoryType } from 'stores/FiltersHistoryStore';
import useViewMode from 'hooks/useViewMode';
import MessagesPanelHeader from './header/MessagesPanelHeader';
import MessagesCardList from './message-card-list/MessagesCardList';
import AttachedMessagesSelection from './AttachedMessagesSelection';

export const MessagesPanelBase = forwardRef<HTMLDivElement, MessagesPanelProps>((props, ref) => {
	const viewMode = useViewMode();

	const rootClassname = createStyleSelector('window', 'messages-panel', viewMode);

	return (
		<div className={rootClassname} ref={ref}>
			<div className='window__controls'>
				<MessagesPanelHeader {...props} />
				<AttachedMessagesSelection />
			</div>
			<div className='window__body'>
				<MessagesCardList />
			</div>
		</div>
	);
});

MessagesPanelBase.displayName = 'MessagesPanelBase';

interface MessagesPanelProps {
	saveMessagesFilter?: (filter: MessagesFilter) => void;
	messagesFilterHistory?: FiltersHistoryType<MessagesFilter>[];
}

const MessagesPanel = (props: MessagesPanelProps) => {
	const { ref: panelRef } = useActivePanel(Panel.Messages);

	return <MessagesPanelBase ref={panelRef} {...props} />;
};

export default MessagesPanel;
