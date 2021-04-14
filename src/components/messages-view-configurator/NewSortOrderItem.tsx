/** *****************************************************************************
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

import React, { useState } from 'react';
import { nanoid } from 'nanoid';
import { useMessageBodySortStore } from '../../hooks';
import StringFilterRow from '../filter/row/StringRow';

const NewSortOrderItem = () => {
	const sortOrder = useMessageBodySortStore();
	const [newItem, setNewItem] = useState('');

	const submitHandler = (e: React.MouseEvent) => {
		e.stopPropagation();
		const hasSame = sortOrder.sortOrder.findIndex(({ item }) => item === newItem) !== -1;
		if (!hasSame) {
			sortOrder.setNewItem({ id: nanoid(), item: newItem });
		}
	};

	return (
		<>
			<StringFilterRow
				config={{
					className: 'order-item',
					id: 'new-order-item',
					type: 'string',
					placeholder: 'Enter field name',
					value: newItem,
					setValue: setNewItem,
				}}
			/>
			<button
				className='rule-button'
				onClick={submitHandler}
				title='submit'
				disabled={newItem === ''}>
				add
			</button>
		</>
	);
};

export default NewSortOrderItem;
