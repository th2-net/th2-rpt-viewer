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
import { usePrevious, useUserDataStore } from '../../hooks';
import Reorder from './Reorder';
import AutocompleteInput from '../util/AutocompleteInput';
import KeyCodes from '../../util/KeyCodes';

type EditableSortOrderItemProps = {
	item: string;
	index: number;
	isFirst?: boolean;
	isLast?: boolean;
};

const EditableSortOrderItem = ({ item, isFirst, isLast, index }: EditableSortOrderItemProps) => {
	const userDataStore = useUserDataStore();

	return (
		<>
			<Reorder
				isFirst={isFirst}
				isLast={isLast}
				index={index}
				move={userDataStore.reorderBodySort}
			/>
			<Editor item={item} />
			<button
				className='rule-delete'
				onClick={() => userDataStore.deleteBodySortOrderItem(item)}
				title='delete'
			/>
		</>
	);
};

export default EditableSortOrderItem;

const Editor = ({ item }: { item: string }) => {
	const userDataStore = useUserDataStore();

	const [value, setValue] = useState(item);
	const [isEditing, setIsEditing] = useState(false);

	const isEditingPrev = usePrevious(isEditing);

	React.useEffect(() => {
		if (!isEditing && isEditingPrev && value !== item) {
			userDataStore.editBodySortOrderItem(item, value);
		}
	}, [isEditing, isEditingPrev, value]);

	const editItemSession = useCallback(() => {
		setIsEditing(false);
	}, []);

	return isEditing ? (
		<AutocompleteInput
			value={value}
			autoresize={false}
			setValue={setValue}
			onSubmit={editItemSession}
			submitKeyCodes={[KeyCodes.ENTER]}
			autoFocus={true}
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
