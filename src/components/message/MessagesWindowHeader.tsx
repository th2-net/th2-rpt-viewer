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
import React from 'react';
import { useMessagesDataStore } from '../../hooks';
import MessagesFilter from '../filter/MessagesFilterPanel';
import MessagesUpdateButton from './MessagesUpdateButton';

function MessagesWindowHeader() {
	const { updateStore } = useMessagesDataStore();

	return (
		<div className='messages-window-header'>
			<div className='messages-window-header__group'>
				<MessagesUpdateButton
					isShow={updateStore.canActivate}
					isLoading={updateStore.isActive}
					subscribeOnChanges={updateStore.subscribeOnChanges}
					stopSubscription={updateStore.stopSubscription}
				/>
				<MessagesFilter />
			</div>
		</div>
	);
}

export default observer(MessagesWindowHeader);
