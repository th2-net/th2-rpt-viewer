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
import 'styles/messages.scss';

interface Props {
	isExpanded: boolean;
	setExpanded?: (state: boolean) => void;
}

const MessageExpandButton = (props: Props) => {
	const { isExpanded, setExpanded } = props;

	const buttonClass = createBemElement('expand', 'button', isExpanded ? 'expanded' : null);

	const warningClass = createBemElement('expand', 'raw-data-only');

	return (
		<div className='expand'>
			{setExpanded ? (
				<div className={buttonClass} onClick={() => setExpanded(!isExpanded)}>
					{isExpanded ? 'Show Less' : 'Show More'}
				</div>
			) : (
				<div className={warningClass}>
					<div className='expand__raw-data-only-icon' />
					<p>Only Raw Data Available</p>
				</div>
			)}
		</div>
	);
};

export default MessageExpandButton;
