/** ****************************************************************************
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

import React from 'react';
import { getHeatmapElements, getHeatmapRange, inRange } from '../helpers/heatmapCreator';
import { useHeatmap } from '../hooks/useHeatmap';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { lighten } from '../helpers/color';
import '../styles/heatmap.scss';

const DEFAULT_COLOR = '#987DB3';
const HEATMAP_ELEMENT_MIN_HEIGHT = 14;

interface HeatmapContextState {
	heatmapElements: HeatmapElement[];
	setHeatmapElements: (heatmapElements: HeatmapElement[]) => void;
	currentRange: ListRange | null;
	setCurrentRange: (range: ListRange) => void;
}

export const HeatmapContext = React.createContext({} as HeatmapContextState);

export interface HeatmapElement {
	count: number;
	color?: string;
	id?: string;
	index: number;
}

export interface ListRange {
	startIndex: number;
    endIndex: number;
}

interface HeatmapProps {
	onElementClick: (element: HeatmapElement) => void;
	items: string[];
	selectedItems?: string[];
	colors: string[];
	selectedIndex: number | null;
}

const MessagesHeatmap = ({
	onElementClick,
	selectedItems = [],
	selectedIndex,
	items,
}: HeatmapProps) => {
	const heatmapRef = React.useRef<HTMLDivElement>(null);
	const scrollIndicator = React.useRef<HTMLDivElement>(null);
	const heatmapContext = useHeatmap();
	const { currentRange, setHeatmapElements, heatmapElements } = heatmapContext;

	const [range, setRange] = React.useState<ListRange>(getHeatmapRange(heatmapElements));

	const updateScrollIndicatorPosition = useDebouncedCallback(() => {
		if (!heatmapRef.current || !currentRange || !scrollIndicator.current) return;
		const { startIndex, endIndex } = currentRange;

		const heatmapOffsetTop = heatmapRef.current.getBoundingClientRect().top || 98;
		let scrollIndicatorTop = heatmapOffsetTop;
		let scrollIndicatorHeight = 0;
		Array
			.from(heatmapRef.current.children)
			.filter(isDivElement)
			.forEach(heatmapEl => {
				const { start, end } = heatmapEl.dataset;
				if (
					startIndex >= parseInt(start as string)
					&& startIndex <= parseInt(end as string)
				) {
					scrollIndicatorTop = getCoordinates(heatmapEl, startIndex);
				}
				if (
					endIndex >= parseInt(start as string)
					&& endIndex <= parseInt(end as string)
				) {
					scrollIndicatorHeight = getCoordinates(heatmapEl, endIndex) - scrollIndicatorTop;
				}
			});
		scrollIndicator.current.style.transform = `translate3d(0, ${scrollIndicatorTop - heatmapOffsetTop}px, 0)`;
		scrollIndicator.current.style.height = `${
			scrollIndicatorHeight
			|| scrollIndicator.current.getBoundingClientRect().bottom - scrollIndicatorTop + heatmapOffsetTop
		}px`;

		function getCoordinates(el: HTMLDivElement, index: number) {
			const { top, height } = el.getBoundingClientRect();
			const step = height / parseInt(el.dataset.count as string);
			const y = top + (index - parseInt(el.dataset.start as string)) * step;
			return y;
		}
	}, 50);

	React.useEffect(() => {
		const updatedHeatmap = getHeatmapElements(
			items,
			selectedItems,
			DEFAULT_COLOR,
		);
		const updatedRange = getHeatmapRange(updatedHeatmap, selectedItems.length === 1);
		const firstHeatmap = updatedHeatmap.find(heatmapEl => heatmapEl.id !== undefined);
		if (firstHeatmap) onElementClick(firstHeatmap);
		setHeatmapElements(updatedHeatmap);
		setRange(updatedRange);
	}, [items, selectedItems]);

	React.useEffect(() => {
		if (
			currentRange && (
				(currentRange.startIndex + 1) < range.startIndex
				|| (currentRange.endIndex - 1) > range.endIndex)
		) {
			setRange(getHeatmapRange(heatmapElements, true));
		}
	}, [currentRange]);

	React.useEffect(() => {
		updateScrollIndicatorPosition();
	}, [heatmapContext.currentRange, range]);

	const heatmapInRange = heatmapElements.filter(el => inRange(el, range));
	const totalCount = heatmapInRange.reduce((acc: number, curr: HeatmapElement) => acc + curr.count, 0);

	return (
		<div className="heatmap">
			<div
				className="heatmap__scroller"
				ref={heatmapRef}>
				{heatmapInRange
					.map((element: HeatmapElement, index: number) =>
						<HeatmapElement
							key={index}
							{...element}
							isSelected={element.index === selectedIndex}
							onClick={onElementClick}
							totalCount={totalCount} />)}
			</div>
			<div
				ref={scrollIndicator}
				className="heatmap__scroll-indicatior"/>
		</div>
	);
};

export default MessagesHeatmap;


interface HeatmapElementProps extends HeatmapElement {
	isSelected: boolean;
	onClick: (element: HeatmapElement) => void;
	totalCount: number;
}

const HeatmapElement = ({
	color,
	index,
	count,
	id,
	isSelected,
	onClick,
	totalCount,
}: HeatmapElementProps) => {
	const onElementClick = (event: React.MouseEvent<HTMLDivElement>) => {
		const { height, top } = event.currentTarget.getBoundingClientRect();
		const step = (height / count);
		const elementIndex = Math.floor(index + (event.clientY - top) / step);
		onClick({
			count,
			index: elementIndex,
			id,
			color,
		});
	};

	return (
		<div
			data-start={index}
			data-end={count === 1 ? index : index + count - 1}
			data-count={count}
			style={{
				borderColor: color,
				borderWidth: isSelected ? '3px' : '2px',
				backgroundColor: isSelected && color ? lighten(color, 47) : '#FFF',
				flexGrow: count / totalCount,
				minHeight: id ? `${HEATMAP_ELEMENT_MIN_HEIGHT}px` : undefined,
			}}
			key={index}
			className="heatmap__element"
			onClick={onElementClick}/>
	);
};

const isDivElement = (el: Element): el is HTMLDivElement => el instanceof HTMLDivElement;
