import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { useMessagesDataStore } from '../../hooks';
import { MessageViewType } from '../../models/EventMessage';
import WorkspaceStore from '../../stores/workspace/WorkspaceStore';
import EventDetailInfoCard from '../event/EventDetailInfoCard';
import { BaseMessage } from '../message/message-card/MessageCard';

function EmbeddedWorkspace({ workspace }: { workspace: WorkspaceStore }) {
	const messagesDataStore = useMessagesDataStore();
	const [viewType, setViewType] = useState(MessageViewType.JSON);

	const eventCard = () => {
		if (workspace.eventsStore.selectedNode !== null) {
			return (
				<EventDetailInfoCard
					node={workspace.eventsStore.selectedNode}
					event={workspace.eventsStore.selectedEvent}
				/>
			);
		}
		return null;
	};

	const messageCard = () => {
		const getMessage = (id: string | null | undefined) => {
			return messagesDataStore.messages.find(msg => msg.messageId === id);
		};

		const message = getMessage(workspace.messagesStore.selectedMessageId?.toString());

		if (message !== undefined) {
			return <BaseMessage viewType={viewType} setViewType={setViewType} message={message} />;
		}
		return null;
	};

	return workspace.eventsStore.selectedEvent !== null ? (
		eventCard()
	) : workspace.messagesStore.selectedMessageId !== null ? (
		messageCard()
	) : (
		<p>Not found message ID or event ID in url</p>
	);
}

export default observer(EmbeddedWorkspace);
