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
 *  limitations under the License.
 ***************************************************************************** */

import * as React from 'react';
import moment from 'moment';
import { TimeInputType } from '../../../models/filter/FilterInputs';
import { DATE_TIME_MASK } from './GraphSearchInput';

import FilterDatetimePicker from '../../filter/date-time-inputs/FilterDatetimePicker';

interface Props {
	timestamp: number | null;
	setTimestamp: (timestamp: number | null) => void;
}

export function GraphSearchTimePicker(props: Props) {
	const { timestamp, setTimestamp } = props;

	return (
		<div className='graph-search-picker'>
			<p className='graph-search-picker__timestamp'>
				{typeof timestamp === 'number' && moment.utc(timestamp).format(DATE_TIME_MASK)}
			</p>
			<FilterDatetimePicker
				setValue={setTimestamp}
				type={TimeInputType.DATE_TIME}
				value={timestamp}
			/>
		</div>
	);
}
