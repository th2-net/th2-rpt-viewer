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

type EditableSortOrderItemProps = {
	item: MessageSortOrderItem;
	index: number;
	isFirst: boolean | null;
	isLast: boolean | null;
};

const EditableSortOrderItem = ({ item, isFirst, isLast, index }: EditableSortOrderItemProps) => {
	const sortOrderStore = useMessageBodySortStore();
	const [currentItem, setCurrentItem] = useState(item.item);
	const [itemIsEditing, setItemIsEditing] = useState(false);

	const deleteHandler = () => {
		sortOrderStore.deleteItem(item);
	};

	const editItemSession = useCallback(() => {
		sortOrderStore.editItem(item, { ...item, item: currentItem });
		setItemIsEditing(false);
	}, [currentItem]);

	const renderEditor = () => {
		return itemIsEditing ? (
			<AutocompleteInput
				value={currentItem}
				autoresize={false}
				setValue={setCurrentItem}
				onSubmit={editItemSession}
				autocomplete={null}
				autofocus={true}
			/>
		) : (
			<p
				onClick={() => {
					setItemIsEditing(true);
				}}>
				{currentItem}
			</p>
		);
	};

	return (
		<>
			<Reorder isFirst={isFirst} isLast={isLast} index={index} move={sortOrderStore.reorder} />
			{renderEditor()}
			<button className='order-item-delete' onClick={deleteHandler} title='delete'></button>
		</>
	);
};

export default EditableSortOrderItem;
