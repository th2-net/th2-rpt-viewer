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

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../hooks/useStores';
import Action from '../../models/Action';
import { StatusType } from '../../models/Status';
import Message from '../../models/Message';
import ChipsList from '../ChipsList';
import { Chip } from '../Chip';
import '../../styles/messages.scss';

interface Props {
    message: Message;
}

export const MessageCardActionChips = observer(({ message }: Props) => {
	const { selectedStore } = useStores();
	const actionsList = message.relatedActions
		.reduce((actions, actionId) =>
			(selectedStore.actionsMap.get(actionId)
				? [...actions, selectedStore.actionsMap.get(actionId)!] : actions), [] as Action[]);
	const selectedStatus = selectedStore.messagesId.includes(message.id)
		? selectedStore.selectedActionStatus : null;
	return (
		<div className="mc-header__info">
			{
				actionsList.length ? (
					<ChipsList
						actions={actionsList}
						selectedStatus={selectedStatus}
						onStatusSelect={(status: StatusType) => selectedStore.selectMessage(message, status)}/>
				) : (
					<Chip text='0' title='No related actions'/>
				)
			}
		</div>
	);
});
