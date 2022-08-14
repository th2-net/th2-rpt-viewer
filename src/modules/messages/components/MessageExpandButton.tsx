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

import { createBemElement, createBemBlock } from 'helpers/styleCreators';
import { ParsedMessage } from 'models/EventMessage';
import 'styles/messages.scss';

interface Props {
	isExpanded: boolean;
	isDisplayRuleRaw: boolean;
	isHighlighted?: boolean;
	setExpanded: (state: boolean) => void;
	parsedMessages: ParsedMessage[] | null;
}

const MessageExpandButton = (props: Props) => {
	const { isExpanded, isHighlighted, isDisplayRuleRaw, setExpanded, parsedMessages } = props;

	const rootClass = createBemBlock(
		'message-card-expand-wrapper',
		isHighlighted ? 'highlighted' : null,
	);

	const buttonClass = createBemElement(
		'message-card-expand-wrapper',
		'expand-button',
		isExpanded ? 'expanded' : null,
	);

	const warningClass = createBemElement('message-card-expand-wrapper', 'warning');

	const changeExpandState = () => {
		setExpanded(!isExpanded);
	};

	return (
		<div className={rootClass}>
			{!isDisplayRuleRaw ? (
				<>
					{parsedMessages ? (
						<div className={buttonClass} onClick={changeExpandState}>
							{isExpanded ? 'Show Less' : 'Show More'}
						</div>
					) : (
						<div className={warningClass}>
							<div className={'message-card-expand-wrapper__warning-icon'} />
							<p>Only Raw Data Available</p>
						</div>
					)}
				</>
			) : null}
		</div>
	);
};

export default MessageExpandButton;
