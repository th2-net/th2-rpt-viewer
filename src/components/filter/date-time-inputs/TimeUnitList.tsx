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

import React, { RefObject } from 'react';
import { createBemElement } from '../../../helpers/styleCreators';

const timeUnitsValues = Object.freeze({
	hour: [...Array(24).keys()],
	minutes: [...Array(60).keys()],
	seconds: [...Array(60).keys()],
});

interface TimeUnitListProps {
	onUnitClick: (unit: number) => void;
	unit: 'hour' | 'minutes' | 'seconds';
	selectedUnit: number | null;
	getIsBlocked: (unitValue: number) => boolean;
}

const TimeUnitList = (props: TimeUnitListProps) => {
	const { onUnitClick, selectedUnit, getIsBlocked, unit } = props;

	const [unitList, setUnitList] = React.useState(
		timeUnitsValues[unit].map(timeUnit => ({
			isBlocked: getIsBlocked(timeUnit),
			value: timeUnit,
		})),
	);

	const unitRefs = React.useRef(
		timeUnitsValues[unit].reduce<{ [k: number]: RefObject<HTMLLIElement> }>((acc, value) => {
			acc[value] = React.createRef<HTMLLIElement>();
			return acc;
		}, {}),
	);

	React.useEffect(() => {
		const interval = setInterval(() => {
			const result = timeUnitsValues[unit].map(timeUnit => ({
				isBlocked: getIsBlocked(timeUnit),
				value: timeUnit,
			}));
			setUnitList(result);
		}, 1000);

		return () => clearInterval(interval);
	}, [getIsBlocked]);

	React.useEffect(() => {
		if (selectedUnit && unitRefs.current[selectedUnit].current) {
			unitRefs.current[selectedUnit].current?.scrollIntoView({
				block: 'center',
			});
		}
		setUnitList(
			timeUnitsValues[unit].map(timeUnit => ({
				isBlocked: getIsBlocked(timeUnit),
				value: timeUnit,
			})),
		);
	}, [selectedUnit, getIsBlocked]);

	return (
		<ul className='filter-timepicker__scroll'>
			{unitList.map(unitItem => (
				<li
					ref={unitRefs.current[unitItem.value]}
					key={unitItem.value}
					className={createBemElement(
						'filter-timepicker',
						'scroll-item',
						selectedUnit === unitItem.value ? 'active' : null,
						unitItem.isBlocked ? 'blocked' : null,
					)}
					onClick={!unitItem.isBlocked ? () => onUnitClick(unitItem.value) : undefined}>
					{unitItem.value}
				</li>
			))}
		</ul>
	);
};

export default TimeUnitList;
