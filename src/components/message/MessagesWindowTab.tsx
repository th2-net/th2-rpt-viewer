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
import { useStores } from '../../hooks/useStores';
import DraggableTab, { DraggableTabProps } from '../tabs/DraggableTab';
import Tab from '../tabs/Tab';

const MessagesWindowTab = (tabProps: Omit<DraggableTabProps, 'children'>) => {
	const { windowsStore } = useStores();
	const attachedMessages = [...windowsStore.attachedMessagesIds.entries()];

	return (
		<DraggableTab {...tabProps} classNames={{ root: 'messages-tab' }}>
			Messages
			{
				attachedMessages.map(([color, ids]) => (
					<span
						key={color}
						className="messages-tab__count"
						style={{ borderColor: color }}>
						{ids.length}
					</span>
				))}
		</DraggableTab>
	);
};

export default observer(MessagesWindowTab);

interface MessagesWindowTabPreviewProps {
	isSelected: boolean;
}
export const MessagesWindowTabPreview = ({ isSelected }: MessagesWindowTabPreviewProps) => {
	const { windowsStore } = useStores();
	const attachedMessages = [...windowsStore.attachedMessagesIds.entries()];
	return (
		<Tab isDragging={true} isSelected={isSelected}>
			Messages
			{
				attachedMessages.map(([color, ids]) => (
					<span
						key={color}
						className="messages-tab__count"
						style={{ borderColor: color }}>
						{ids.length}
					</span>
				))}
		</Tab>
	);
};
