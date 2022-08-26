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
import { useMessagesDataStore } from '../hooks/useMessagesDataStore';
import MessagesFilterPanel from './filter/MessagesFilterPanel';
import MessagesUpdateButton from './MessagesUpdateButton';
import MessagesViewConfigurator from './messages-view-configurator/MessagesViewConfigurator';
import 'styles/messages.scss';

interface Props {
	saveMessagesFilter?: (filter: MessagesFilter) => void;
	messagesFilterHistory?: FiltersHistoryType<MessagesFilter>[];
}

function MessagesPanelHeader(props: Props) {
	const { updateStore } = useMessagesDataStore();

	return (
		<div className='messages-window-header'>
			<MessagesUpdateButton
				isShow={updateStore.canActivate}
				isLoading={updateStore.isActive}
				subscribeOnChanges={updateStore.subscribeOnChanges}
				stopSubscription={updateStore.stopSubscription}
			/>
			<MessagesFilterPanel {...props} />
			<MessagesViewConfigurator />
		</div>
	);
}

export default observer(MessagesPanelHeader);
