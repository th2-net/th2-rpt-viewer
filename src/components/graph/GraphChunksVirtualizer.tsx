/** ****************************************************************************
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

import React from 'react';
import moment from 'moment';
import { useDebouncedCallback, usePrevious } from '../../hooks';
import { isClickEventInElement, isDivElement } from '../../helpers/dom';
import { raf } from '../../helpers/raf';
import { Chunk, PanelRange, PanelsRangeMarker } from '../../models/Graph';
import { TimeRange } from '../../models/Timestamp';
import '../../styles/graph.scss';

const setInitialState = (settings: Settings): State => {
	const { itemWidth, amount, tolerance, minIndex, maxIndex, startIndex } = settings;
	const viewportWidth = amount * itemWidth;
	const totalWidth = (maxIndex - minIndex + 1) * itemWidth;
	const toleranceWidth = tolerance * itemWidth;
	const bufferWidth = viewportWidth + 2 * toleranceWidth;
	const bufferedItems = amount + 2 * tolerance;
	const itemsAbove = startIndex - tolerance - minIndex;
	const leftPadding = itemsAbove * itemWidth;
	const rightPadding = totalWidth - leftPadding;
	const initialPosition = leftPadding + toleranceWidth;

	return {
		settings,
		viewportWidth,
		totalWidth,
		toleranceWidth,
		bufferWidth,
		bufferedItems,
		leftPadding,
		rightPadding,
		initialPosition,
		data: [],
	};
};

export interface Settings {
	itemWidth: number;
	amount: number;
	tolerance: number;
	minIndex: number;
	maxIndex: number;
	startIndex: number;
}

interface Props {
	settings: Settings;
	renderChunk: (chunk: Chunk, index: number) => JSX.Element;
	chunkWidth: number;
	timestamp: number;
	interval: number;
	onRangeChanged: (range: TimeRange) => void;
	setRange: (range: TimeRange) => void;
	getChunk: (timestamp: number, index: number) => Chunk;
	panelsRange: Array<PanelRange>;
}

interface State {
	settings: Settings;
	viewportWidth: number;
	totalWidth: number;
	toleranceWidth: number;
	bufferWidth: number;
	bufferedItems: number;
	leftPadding: number;
	rightPadding: number;
	initialPosition: number;
	data: number[];
}

const GraphChunksVirtualizer = (props: Props) => {
	const {
		settings,
		chunkWidth,
		timestamp,
		interval,
		onRangeChanged,
		setRange,
		getChunk,
		panelsRange,
	} = props;

	const viewportElementRef = React.useRef<HTMLDivElement>(null);
	const rangeElementRef = React.useRef<HTMLDivElement>(null);
	const prevItemsRef = React.useRef<HTMLDivElement>(null);
	const nextItemsRef = React.useRef<HTMLDivElement>(null);

	const initialRangeCalculation = React.useRef(true);

	const [state, setState] = React.useState<State>(setInitialState(settings));

	const [acnhorTimestamp, setAnchorTimestamp] = React.useState(timestamp);

	const [chunks, setChunks] = React.useState<Array<[Chunk, number]>>([]);

	const startX = React.useRef(0);
	const scrollLeft = React.useRef(0);
	const isDown = React.useRef(false);

	const [panels, setPanels] = React.useState<Array<PanelsRangeMarker | null>>([]);

	React.useLayoutEffect(() => {
		if (!chunks.length) {
			setPanels([]);
			return;
		}
		const firstChunk = viewportElementRef.current?.querySelector(`[data-index="${chunks[0][1]}"]`);
		if (firstChunk && firstChunk instanceof HTMLDivElement) {
			const firstChunkRange = getDivInterval(firstChunk);
			const offset = firstChunk.offsetLeft;
			if (firstChunkRange) {
				const panelsMarkerPositions = panelsRange.map(({ range, type }) => {
					if (!range) return null;
					const widthPerMs = chunkWidth / (interval * 60 * 1000);
					const panelWidth = (range[1] - range[0]) * widthPerMs;
					const diff = (range[0] - firstChunkRange[0]) * (chunkWidth / (interval * 60 * 1000));

					return {
						left: diff + offset,
						type,
						width: panelWidth,
					};
				});
				setPanels(panelsMarkerPositions);
			}
		} else {
			setPanels([]);
		}
	}, [panelsRange, chunks]);

	React.useEffect(() => {
		getCurrentChunks(state.initialPosition);
		raf(() => {
			if (viewportElementRef.current) {
				const offset =
					(timestamp - moment(timestamp).startOf('minute').valueOf()) *
					(chunkWidth / (interval * 60 * 1000));
				viewportElementRef.current.scrollLeft = state.initialPosition - chunkWidth + offset;
			}
		}, 2);
	}, []);

	React.useEffect(() => {
		document.addEventListener('mousedown', handleMouseDown);

		return () => {
			document.removeEventListener('mousedown', handleMouseDown);
		};
	}, []);

	React.useEffect(() => {
		getTimeRange();
	}, [chunkWidth]);

	const prevInterval = usePrevious(interval);

	React.useEffect(() => {
		if (viewportElementRef.current && prevInterval && prevInterval !== interval) {
			getCurrentChunks(viewportElementRef.current.scrollLeft);
			getTimeRange();
		}
	}, [interval]);

	const handleMouseDown = (event: MouseEvent) => {
		if (
			!rangeElementRef.current ||
			!viewportElementRef.current ||
			event.target instanceof HTMLInputElement
		)
			return;

		if (isClickEventInElement(event, rangeElementRef.current)) {
			viewportElementRef.current.style.cursor = 'grabbing';
			isDown.current = true;
			startX.current = event.pageX - (viewportElementRef.current?.offsetLeft || 0);
			scrollLeft.current = viewportElementRef.current.scrollLeft;

			document.addEventListener('mouseup', handleMouseUp);
			document.addEventListener('mousemove', handleMouseMove);
		}
	};

	const handleMouseUp = () => {
		isDown.current = false;
		if (viewportElementRef.current) {
			viewportElementRef.current.style.cursor = 'default';
		}
		document.removeEventListener('mouseup', handleMouseUp);
		document.removeEventListener('mousemove', handleMouseMove);
	};

	const handleMouseMove = (event: MouseEvent) => {
		if (!viewportElementRef.current || !isDown.current) return;
		event.preventDefault();
		const x = event.pageX - viewportElementRef.current.offsetLeft;
		viewportElementRef.current.scrollLeft = scrollLeft.current - (x - startX.current) * 2;
	};

	const getCurrentChunks = (_scrollLeft: number) => {
		const {
			totalWidth,
			toleranceWidth,
			bufferedItems,
			settings: { itemWidth, minIndex },
		} = state;
		const index = minIndex + Math.floor((_scrollLeft - toleranceWidth) / itemWidth);
		const data = getIndexes(index, bufferedItems);
		const leftPadding = Math.max((index - minIndex) * itemWidth, 0);
		const rightPadding = Math.max(totalWidth - leftPadding - data.length * itemWidth, 0);

		if (prevItemsRef.current && nextItemsRef.current) {
			prevItemsRef.current.style.width = `${leftPadding}px`;
			nextItemsRef.current.style.width = `${rightPadding}px`;
		}

		const updatedChunks: [Chunk, number][] = data.map(i => [getChunk(acnhorTimestamp, i), i]);
		const isUpdated =
			chunks.length === 0 ||
			updatedChunks.some(
				([chunk, virtualizerIndex], i) =>
					chunk !== chunks[i][0] && virtualizerIndex !== chunks[i][1],
			);

		if (isUpdated) {
			setChunks(data.map(i => [getChunk(acnhorTimestamp, i), i]));
		}
	};

	const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
		if (
			viewportElementRef.current &&
			event.target instanceof Node &&
			viewportElementRef.current.contains(event.target)
		) {
			viewportElementRef.current.scrollLeft += event.deltaY * 2;
		}
	};

	const getTimeRange = useDebouncedCallback(() => {
		if (!viewportElementRef.current || !rangeElementRef.current) return;

		const rangeBlockRect = rangeElementRef.current.getBoundingClientRect();
		const divsInInterval = Array.from(viewportElementRef.current.children)
			.filter(isDivElement)
			.filter(intervalDiv => {
				const { left, right } = intervalDiv.getBoundingClientRect();

				return (
					(left >= rangeBlockRect.left && left <= rangeBlockRect.right) ||
					(right >= rangeBlockRect.left && right <= rangeBlockRect.right)
				);
			});

		const targetDiv = divsInInterval.find(getDivInterval);
		const timestamps = targetDiv && getDivInterval(targetDiv);

		if (targetDiv && timestamps) {
			const [from] = timestamps;
			const pixelsDiff = rangeBlockRect.left - targetDiv.getBoundingClientRect().left;
			const secondsDiff = (pixelsDiff / chunkWidth) * (interval * 60);

			const intervalStart = moment(from).utc().add(secondsDiff, 'seconds');
			const intervalEnd = moment(intervalStart).utc().add(interval, 'minutes');

			if (intervalStart.isValid() && intervalEnd.isValid()) {
				const updatedRange: TimeRange = [intervalStart.valueOf(), intervalEnd.valueOf()];
				setRange(updatedRange);

				// TODO: temporary workaround to ignore initial range calculation
				// in order to avoid refetching data;
				if (initialRangeCalculation.current) {
					initialRangeCalculation.current = false;
				} else {
					onRangeChanged(updatedRange);
				}
			}
		}
	}, 50);

	const getIndexes = (offset: number, limit: number) => {
		const data = [];
		const start = Math.max(settings.minIndex, offset);
		const end = Math.min(offset + limit - 1, settings.maxIndex);
		if (start <= end) {
			for (let i = start; i <= end; i++) {
				data.push(i);
			}
		}
		return data;
	};

	const scrollHalfInterval = (direction: -1 | 1 = 1) => {
		if (viewportElementRef.current) {
			viewportElementRef.current.scrollLeft -= (chunkWidth * direction) / 2;
		}
	};

	const onScroll = (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
		if (
			viewportElementRef.current &&
			event.target instanceof Node &&
			!viewportElementRef.current.contains(event.target)
		) {
			return;
		}

		getTimeRange();

		if (viewportElementRef.current) {
			const isStartReached = event.currentTarget.scrollLeft === 0;
			const isEndReached =
				event.currentTarget.scrollLeft + viewportElementRef.current.offsetWidth ===
				viewportElementRef.current.scrollWidth;

			if (isStartReached) {
				const firstChunk = chunks[0][0];
				setAnchorTimestamp(firstChunk.from);
				getCurrentChunks(state.initialPosition);
				viewportElementRef.current.scrollLeft = state.initialPosition;
				scrollLeft.current = state.initialPosition;
			} else if (isEndReached) {
				const lastChunk = chunks[chunks.length - 1][0];
				setAnchorTimestamp(lastChunk.from);
				getCurrentChunks(state.initialPosition - chunkWidth * 0.5);
				viewportElementRef.current.scrollLeft = state.initialPosition - chunkWidth * 0.5;
				scrollLeft.current = state.initialPosition - chunkWidth * 0.5;
			} else {
				getCurrentChunks(event.currentTarget.scrollLeft);
			}
		}
	};

	return (
		<div className='graph-virtualizer'>
			<div
				className='graph-virtualizer__list'
				ref={viewportElementRef}
				onScroll={onScroll}
				onWheel={onWheel}>
				<div ref={prevItemsRef} style={{ flexShrink: 0 }} />
				{chunks.map(([chunk, index]) => props.renderChunk(chunk, index))}
				<div ref={nextItemsRef} style={{ flexShrink: 0 }} />
				{panels.map(
					(panel, index) =>
						panel && (
							<div
								key={panel.type}
								className={`graph-virtualizer__panel-marker ${panel.type}`}
								style={{ left: panel.left, bottom: index * 6, width: panel.width }}
							/>
						),
				)}
			</div>
			<div
				className='graph-virtualizer__dragging-zone'
				style={{ width: chunkWidth, left: (window.innerWidth - chunkWidth) / 2 }}
				ref={rangeElementRef}
			/>
			<div
				className='graph-virtualizer__arrow-button left'
				style={{ left: chunkWidth / 2 }}
				onClick={() => scrollHalfInterval()}>
				<i className='graph-virtualizer__arrow-icon'></i>
			</div>
			<div
				className='graph-virtualizer__arrow-button right'
				style={{ left: chunkWidth * 1.5 }}
				onClick={() => scrollHalfInterval(-1)}>
				<i className='graph-virtualizer__arrow-icon'></i>
			</div>
		</div>
	);
};

export default React.memo(GraphChunksVirtualizer);

function getDivInterval(intervalDiv: HTMLDivElement): null | TimeRange {
	const from = parseInt(intervalDiv.dataset.from || '');
	const to = parseInt(intervalDiv.dataset.to || '');

	if (from && to) return [from, to];
	return null;
}
