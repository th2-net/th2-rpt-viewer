import { observer } from 'mobx-react-lite';
import React from 'react';
import WorkspaceStore from '../../stores/workspace/WorkspaceStore';
import EventDetailInfoCard from '../event/EventDetailInfoCard';
import EmbeddedMessageCard from './EmbeddedMessageCard';

function EmbeddedWorkspace({ workspace }: { workspace: WorkspaceStore }) {
	if (workspace.eventsStore.selectedEvent !== null && workspace.eventsStore.selectedNode !== null) {
		return (
			<EventDetailInfoCard
				node={workspace.eventsStore.selectedNode}
				event={workspace.eventsStore.selectedEvent}
				isEmbedded
			/>
		);
	}

	if (workspace.messagesStore.selectedMessageId !== null) {
		return <EmbeddedMessageCard workspace={workspace} />;
	}

	return <p>Not found message ID or event ID in url</p>;
}

export default observer(EmbeddedWorkspace);
