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

import { observer } from 'mobx-react-lite';
import MessagesFilter from 'models/filter/MessagesFilter';
import { FiltersHistoryType } from 'stores/FiltersHistoryStore';
import { ViewMode } from 'components/ViewModeProvider';
import useViewMode from 'hooks/useViewMode';
import { useMessagesDataStore } from '../../hooks/useMessagesDataStore';
import MessageExport from './MessageExport';
import MessagesFilterPanel from '../filter/MessagesFilterPanel';
import { useMessagesStore } from '../../hooks/useMessagesStore';
import MessagesUpdateButton from './MessagesUpdateButton';
import MessagesViewConfigurator from './messages-view-configurator/MessagesViewConfigurator';
import ReportViewerLink from './ReportViewerLink';
import ReplayModal from './ReplayModal';
import 'styles/messages.scss';

interface Props {
	saveMessagesFilter?: (filter: MessagesFilter) => void;
	messagesFilterHistory?: FiltersHistoryType<MessagesFilter>[];
}

function MessagesPanelHeader(props: Props) {
	const { updateStore } = useMessagesDataStore();
	const messagesStore = useMessagesStore();
	const viewMode = useViewMode();

	return (
		<div className='messages-window-header'>
			{updateStore.canActivate && (
				<MessagesUpdateButton
					isLoading={updateStore.isActive}
					subscribeOnChanges={updateStore.subscribeOnChanges}
					stopSubscription={updateStore.stopSubscription}
				/>
			)}
			<MessagesFilterPanel {...props} />
			<MessagesViewConfigurator />
			{viewMode === ViewMode.Full && <ReplayModal />}
			<MessageExport
				isExporting={messagesStore.exportStore.isExport}
				enableExport={messagesStore.exportStore.enableExport}
				disableExport={messagesStore.exportStore.disableExport}
				endExport={messagesStore.exportStore.endExport}
				exportedCount={messagesStore.exportStore.exportMessages.length}
			/>
			{viewMode === ViewMode.EmbeddedMessages && <ReportViewerLink />}
		</div>
	);
}

export default observer(MessagesPanelHeader);
