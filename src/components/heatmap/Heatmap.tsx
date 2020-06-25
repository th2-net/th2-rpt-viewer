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
import { inRange } from '../../helpers/heatmapCreator';
import { HeatmapElement } from '../../models/Heatmap';
import { useHeatmap } from '../../hooks/useHeatmap';
import HeatmapItem from './HeatmapItem';
import '../../styles/heatmap.scss';

interface Props {
	onElementClick: (element: HeatmapElement) => void;
	selectedIndex: number | null;
}

const Heatmap = ({
	onElementClick,
	selectedIndex,
}: Props) => {
	const heatmapRef = React.useRef<HTMLDivElement>(null);
	const scrollIndicatorRef = React.useRef<HTMLDivElement>(null);

	const { visibleRange, fullRange, heatmapElements } = useHeatmap();

	const updateScrollIndicatorPosition = () => {
		if (!heatmapRef.current || !visibleRange || !scrollIndicatorRef.current) return;
		const { startIndex, endIndex } = visibleRange;

		const {
			top: heatmapOffsetTop,
			bottom: heatmapOffsetBottom,
		} = heatmapRef.current.getBoundingClientRect();
		let scrollIndicatorTop = heatmapOffsetTop;
		let scrollIndicatorHeight = 0;

		Array
			.from(heatmapRef.current.children)
			.filter(isDivElement)
			.forEach(heatmapEl => {
				const { start, end } = heatmapEl.dataset as { end: string; start: string };
				if (startIndex >= parseInt(start) && startIndex <= parseInt(end)) {
					scrollIndicatorTop = getCoordinates(heatmapEl, startIndex);
				}
				if (endIndex >= parseInt(start) && endIndex <= parseInt(end)) {
					scrollIndicatorHeight = getCoordinates(heatmapEl, endIndex, false) - scrollIndicatorTop;
				}
			});

		if (scrollIndicatorHeight === 0) {
			scrollIndicatorHeight = heatmapOffsetBottom - scrollIndicatorRef.current.getBoundingClientRect().top;
		}
		scrollIndicatorRef.current.style.transform = `translate3d(0, ${scrollIndicatorTop - heatmapOffsetTop}px, 0)`;
		scrollIndicatorRef.current.style.height = `${scrollIndicatorHeight}px`;

		function getCoordinates(el: HTMLDivElement, index: number, isStart = true) {
			const { top, height } = el.getBoundingClientRect();
			const step = height / parseInt(el.dataset.count as string);
			let y = top + (index - parseInt(el.dataset.start as string)) * step;
			if (!isStart) {
				y += step;
			}
			return y;
		}
	};

	React.useLayoutEffect(() => {
		updateScrollIndicatorPosition();
	}, [visibleRange, fullRange, heatmapElements]);

	const heatmapElementsInRange = heatmapElements.filter(el => inRange(el, fullRange));
	const totalCount = heatmapElementsInRange.reduce((acc: number, curr: HeatmapElement) => acc + curr.count, 0);

	return (
		<div className="heatmap">
			<div
				className="heatmap__scroller"
				ref={heatmapRef}>
				{heatmapElementsInRange
					.map((element: HeatmapElement, index: number) =>
						<HeatmapItem
							key={index}
							{...element}
							isSelected={element.index === selectedIndex}
							onClick={onElementClick}
							totalCount={totalCount} />)}
			</div>
			<div
				ref={scrollIndicatorRef}
				className="heatmap__scroll-indicatior"/>
		</div>
	);
};

export default Heatmap;

const isDivElement = (el: Element): el is HTMLDivElement => el instanceof HTMLDivElement;
