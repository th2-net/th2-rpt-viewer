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

import { createBemElement } from 'helpers/styleCreators';

type MessagesUpdateButtonProps = {
	isLoading: boolean;
	subscribeOnChanges: () => void;
	stopSubscription: () => void;
};

const MessagesUpdateButton = ({
	isLoading,
	subscribeOnChanges,
	stopSubscription,
}: MessagesUpdateButtonProps) => {
	const updateButtonClass = createBemElement(
		'messages-window-header',
		'realtime-button',
		isLoading ? 'active' : null,
	);

	const toggleSubscribe = isLoading ? stopSubscription : subscribeOnChanges;

	return (
		<button onClick={toggleSubscribe} className={updateButtonClass}>
			<i className='messages-window-header__realtime-button-icon' />
		</button>
	);
};

export default MessagesUpdateButton;
