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

import { observer } from 'mobx-react-lite';
import React from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useMessageBodySortStore } from '../../hooks';
import NewSortOrderItem from './NewSortOrderItem';
import EditableSortOrderItem from './EditableSortOrderItem';

const BodySortConfig = () => {
	const { sortOrder } = useMessageBodySortStore();

	const computeKey = (index: number) => {
		return sortOrder[index].id;
	};

	const renderSortRule = (index: number) => {
		const item = sortOrder[index];
		return (
			<div className='order-item editable'>
				<EditableSortOrderItem
					item={item}
					index={index}
					isLast={index === sortOrder.length - 1}
					isFirst={index === 0}
				/>
			</div>
		);
	};

	return (
		<Virtuoso
			itemContent={renderSortRule}
			computeItemKey={computeKey}
			totalCount={sortOrder.length}
			style={{ height: '120px' }}
			components={{
				Header: function Header() {
					return <NewSortOrderItem />;
				},
			}}
		/>
	);
};

export default observer(BodySortConfig);
