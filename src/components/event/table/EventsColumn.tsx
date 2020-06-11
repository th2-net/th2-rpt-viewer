/* eslint-disable react/no-children-prop */
/** *****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { Virtuoso } from 'react-virtuoso';
import { EventIdNode } from '../../../stores/EventWindowStore';
import TableEventCard from './TableEventCard';
import CardDisplayType from '../../../util/CardDisplayType';
import { createBemElement } from '../../../helpers/styleCreators';


interface Props {
	nodesList: EventIdNode[];
	displayType: CardDisplayType;
}

function EventsColumn({ nodesList, displayType }: Props) {
	const renderEvent = (index: number) => (
		<TableEventCard
			displayType={displayType}
			idNode={nodesList[index]}/>
	);

	const rootClassName = createBemElement(
		'event-table-window',
		'column',
		displayType,
	);

	return (
		<div className={rootClassName}>
			<Virtuoso
				style={{ height: '100%', width: '100%' }}
				className='event-table-window__scrollbar'
				computeItemKey={index => nodesList[index].id}
				overscan={3}
				totalCount={nodesList.length}
				item={renderEvent}/>
		</div>
	);
}

export default observer(EventsColumn);
