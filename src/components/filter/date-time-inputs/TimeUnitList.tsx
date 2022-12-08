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
import { createBemElement, createStyleSelector } from '../../../helpers/styleCreators';

const timeUnitsValues = Object.freeze({
	hour: [...Array(24).keys()],
	minutes: [...Array(60).keys()],
	seconds: [...Array(60).keys()],
});

interface TimeUnitListProps {
	onUnitChange: (unit: number) => void;
	unit: 'hour' | 'minutes' | 'seconds';
	selectedUnit: number | null;
	getIsBlocked: (unitValue: number) => boolean;
}

const TimeUnitList = (props: TimeUnitListProps) => {
	const { onUnitChange, selectedUnit, getIsBlocked, unit } = props;

	const [unitList, setUnitList] = React.useState(
		timeUnitsValues[unit].map(timeUnit => ({
			isBlocked: getIsBlocked(timeUnit),
			value: timeUnit,
		})),
	);

	const [isScrolling, setIsScrolling] = React.useState(false);

	const scrollerRef = React.useRef<HTMLUListElement>(null);

	const unitRefs = React.useRef(
		timeUnitsValues[unit].reduce<{ [k: number]: RefObject<HTMLLIElement> }>((acc, value) => {
			acc[value] = React.createRef<HTMLLIElement>();
			return acc;
		}, {}),
	);

	const isUnitFar = (unitItemValue: number, isBlocked: boolean) =>
		selectedUnit !== null &&
		!isBlocked &&
		(selectedUnit >= unitItemValue + 2 || selectedUnit <= unitItemValue - 2);

	const selectUnit = () => {
		if (scrollerRef.current) {
			const parentHeight = scrollerRef.current.clientHeight;
			const parentOffset = scrollerRef.current.getBoundingClientRect().top;

			unitList.forEach(unitItem => {
				const boxRect = unitRefs.current[unitItem.value].current?.getBoundingClientRect();

				if (boxRect) {
					const inViewport =
						boxRect.top - parentOffset > parentHeight / 2 - boxRect.height &&
						boxRect.top - parentOffset < parentHeight / 2;

					if (inViewport && !unitItem.isBlocked) {
						onUnitChange(unitItem.value);
					}
				}
			});
		}
	};

	const onScroll = () => {
		setIsScrolling(true);

		setTimeout(() => {
			if (isScrolling) selectUnit();
		}, 100);

		return setTimeout(() => {
			if (isScrolling) selectUnit();
		}, 700);
	};

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
		if (!isScrolling && selectedUnit !== null && unitRefs.current[selectedUnit].current) {
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
		setIsScrolling(false);
	}, [selectedUnit, getIsBlocked]);

	return (
		<ul className='filter-timepicker__scroll' onWheel={onScroll} ref={scrollerRef}>
			<li className='filter-timepicker__scroll-item empty' />
			{unitList.map(unitItem => (
				<li
					ref={unitRefs.current[unitItem.value]}
					key={unitItem.value}
					className={createBemElement(
						'filter-timepicker',
						'scroll-item',
						isUnitFar(unitItem.value, unitItem.isBlocked) ? 'far' : null,
						selectedUnit === unitItem.value ? 'active' : null,
						unitItem.isBlocked ? 'blocked' : null,
					)}
					onClick={!unitItem.isBlocked ? () => onUnitChange(unitItem.value) : undefined}>
					{unitItem.value}
				</li>
			))}
			<li
				className={createStyleSelector(
					'filter-timepicker__scroll-item empty',
					unitList[unitList.length - 1].isBlocked ? 'blocked' : null,
				)}
			/>
		</ul>
	);
};

export default TimeUnitList;
