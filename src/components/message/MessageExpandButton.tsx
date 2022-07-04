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
import React from 'react';
import { createBemElement } from '../../helpers/styleCreators';
import '../../styles/messages.scss';

interface Props {
	isExpandedMessages: boolean;
	setIsExpandedMessages: React.Dispatch<React.SetStateAction<boolean>>;
}

const MessageExpandButton = (props: Props) => {
	const { isExpandedMessages, setIsExpandedMessages } = props;

	const buttonClass = createBemElement(
		'message-card-expand-wrapper',
		'expand-button',
		isExpandedMessages ? 'expanded' : null,
	);

	const changeExpandState = () => {
		setIsExpandedMessages(!isExpandedMessages);
	};

	return (
		<div className='message-card-expand-wrapper'>
			<div className={buttonClass} onClick={changeExpandState}>
				{isExpandedMessages ? 'Show Less' : 'Show More'}
			</div>
		</div>
	);
};

export default MessageExpandButton;
