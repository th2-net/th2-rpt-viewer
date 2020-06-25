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
import { TabProps, Tab } from '../tabs/Tab';

const MessagesWindowTab = (tabProps: Omit<TabProps, 'children'>) => {
	const { windowsStore } = useStores();
	const attachedMessagesCount = [...windowsStore.attachedMessagesIds.values()].flat().length;
	return (
		<Tab {...tabProps}>
			Messages
			<span className="messages-tab__count">
				{attachedMessagesCount}
			</span>
		</Tab>
	);
};

export default observer(MessagesWindowTab);
