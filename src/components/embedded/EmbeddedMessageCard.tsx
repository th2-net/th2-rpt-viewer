import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { useMessagesDataStore } from '../../hooks';
import { MessageViewType } from '../../models/EventMessage';
import WorkspaceStore from '../../stores/workspace/WorkspaceStore';
import { MessageCardBase } from '../message/message-card/MessageCard';

function EmbeddedMessageCard({ workspace }: { workspace: WorkspaceStore }) {
	const messagesDataStore = useMessagesDataStore();
	const [viewType, setViewType] = useState(MessageViewType.JSON);

	const getMessage = (id: string | null | undefined) => {
		return messagesDataStore.messages.find(msg => msg.messageId === id);
	};

	const message = getMessage(workspace.messagesStore.selectedMessageId?.toString());

	if (message !== undefined) {
		return <MessageCardBase viewType={viewType} setViewType={setViewType} message={message} />;
	}
	return <p>Message not found</p>;
}

export default observer(EmbeddedMessageCard);
