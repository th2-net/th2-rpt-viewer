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
import React from 'react';
import { createBemElement } from '../../helpers/styleCreators';
import { BookmarkType } from '../../models/Bookmarks';

type Props = {
	value: BookmarkType | null;
	setValue: (value: BookmarkType | null) => void;
	label: string;
};

const BookmarkTypeSwitcher = ({ value, setValue, label }: Props) => {
	const setType = (type: string) => {
		setValue(type === 'any' ? null : (type as BookmarkType));
	};

	return (
		<div className='bookmark-panel-header__row'>
			<div className='bookmark-panel-header__row-label'>{label}</div>
			<div className='bookmark-type-switcher'>
				{['event', 'message', 'any'].map(type => {
					const buttonClassName = createBemElement(
						'bookmark-type-switcher',
						'switch-bookmark-type-button',
						'switch-bookmark-type-button',
						type,
						value === type || (type === 'any' && value === null) ? 'active' : null,
					);

					const iconClassName = createBemElement(
						'switch-bookmark-type-button',
						'icon',
						type,
						value === type ? 'active' : null,
					);

					return (
						<button key={type} className={buttonClassName} onClick={() => setType(type)}>
							<i className={iconClassName} />
							<div className='switch-bookmark-type-button__label'>{type}</div>
						</button>
					);
				})}
			</div>
		</div>
	);
};

export default BookmarkTypeSwitcher;
