/** *****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
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

import { MessageIcon } from 'components/icons/MessageIcon';
import { StatusIcon } from 'components/icons/StatusIcon';
import { ToggleButtonGroup, ToggleButton } from 'components/buttons/ToggleButton';
import { BookmarkType } from '../models/Bookmarks';

interface Props {
	value: BookmarkType | null;
	setValue: (value: BookmarkType | null) => void;
	label: string;
}

const BookmarkTypeSwitcher = ({ value, setValue }: Props) => {
	const selectedType = value || 'All';
	const setType = (type: string) => {
		setValue(type === 'All' ? null : (type as BookmarkType));
	};

	return (
		<div className='bookmark-panel-header__row'>
			<ToggleButtonGroup value={selectedType} onChange={setType}>
				<ToggleButton style={{ padding: '8px 24px' }} value='All'>
					All
				</ToggleButton>
				<ToggleButton value='event'>
					<StatusIcon />
					Events
				</ToggleButton>
				<ToggleButton value='message'>
					<MessageIcon />
					Messages
				</ToggleButton>
			</ToggleButtonGroup>
		</div>
	);
};

export default BookmarkTypeSwitcher;
