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

import React, { useState, useCallback } from 'react';
import { useMessageBodySortStore } from '../../hooks';
import Reorder from './Reorder';
import AutocompleteInput from '../util/AutocompleteInput';
import { MessageSortOrderItem } from '../../models/EventMessage';
import KeyCodes from '../../util/KeyCodes';

type EditableSortOrderItemProps = {
	item: MessageSortOrderItem;
	index: number;
	isFirst?: boolean;
	isLast?: boolean;
};

const EditableSortOrderItem = ({ item, isFirst, isLast, index }: EditableSortOrderItemProps) => {
	const sortOrderStore = useMessageBodySortStore();

	return (
		<>
			<Reorder isFirst={isFirst} isLast={isLast} index={index} move={sortOrderStore.reorder} />
			<Editor item={item} />
			<Delete item={item} />
		</>
	);
};

export default EditableSortOrderItem;

const Editor = ({ item }: { item: MessageSortOrderItem }) => {
	const sortOrderStore = useMessageBodySortStore();

	const [value, setValue] = useState(item.item);
	const [isEditing, setIsEditing] = useState(false);

	const editItemSession = useCallback(() => {
		sortOrderStore.editItem(item, { ...item, item: value });
		setIsEditing(false);
	}, [value]);

	return isEditing ? (
		<AutocompleteInput
			value={value}
			autoresize={false}
			setValue={setValue}
			onSubmit={editItemSession}
			submitKeyCodes={[KeyCodes.ENTER]}
			autocomplete={null}
			autofocus={true}
		/>
	) : (
		<p
			onClick={() => {
				setIsEditing(true);
			}}>
			{value}
		</p>
	);
};

const Delete = ({ item }: { item: MessageSortOrderItem }) => {
	const sortOrderStore = useMessageBodySortStore();

	return (
		<button
			className='rule-delete'
			onClick={() => {
				sortOrderStore.deleteItem(item);
			}}
			title='delete'
		/>
	);
};
