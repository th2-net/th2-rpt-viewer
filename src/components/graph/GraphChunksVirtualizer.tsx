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
import { useDebouncedCallback } from '../../hooks';
import { isClickEventInElement, isDivElement } from '../../helpers/dom';
import { raf } from '../../helpers/raf';
import { Chunk, GraphPanelType, PanelRange, PanelsRangeMarker } from '../../models/Graph';
import { TimeRange } from '../../models/Timestamp';
import { usePointerTimestampUpdate } from '../../contexts/pointerTimestampContext';
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
	const initialPosition = leftPadding + toleranceWidth - itemWidth / 2;

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
	timestamp: Number;
	interval: number;
	range: TimeRange;
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
		setRange,
		getChunk,
		panelsRange,
		range,
	} = props;

	const viewportElementRef = React.useRef<HTMLDivElement>(null);
	const rangeElementRef = React.useRef<HTMLDivElement>(null);
	const prevItemsRef = React.useRef<HTMLDivElement>(null);
	const nextItemsRef = React.useRef<HTMLDivElement>(null);

	const [state] = React.useState<State>(setInitialState(settings));
	const [centerTimestamp, setCenterTimestamp] = React.useState<number | null>(null);

	const [anchorTimestamp, setAnchorTimestamp] = React.useState(
		moment
			.utc(timestamp.valueOf())
			.subtract(interval / 2, 'minutes')
			.startOf('minute')
			.valueOf(),
	);

	const [chunks, setChunks] = React.useState<Array<[Chunk, number]>>([]);

	const startX = React.useRef(0);
	const scrollLeft = React.useRef(0);
	const isDown = React.useRef(false);
	const innerRange = React.useRef<null | TimeRange>(null);

	const [panels, setPanels] = React.useState<Array<PanelsRangeMarker | null>>([]);

	React.useLayoutEffect(() => {
		if (!chunks.length) {
			setPanels([]);
			return;
		}
		const firstChunk = viewportElementRef.current?.querySelector(`[data-index="${chunks[0][1]}"]`);
		if (firstChunk && firstChunk instanceof HTMLDivElement) {
			const firstChunkRange = getDivRange(firstChunk);
			const offset = firstChunk.offsetLeft;

			if (firstChunkRange) {
				const panelsMarkerPositions = panelsRange.map(({ range: panelRange, type }) => {
					if (!panelRange) return null;
					const widthPerMs = chunkWidth / (interval * 60 * 1000);
					const panelWidth = (panelRange[1] - panelRange[0]) * widthPerMs;
					const diff = (panelRange[0] - firstChunkRange[0]) * widthPerMs;

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
	}, [panelsRange, chunks, timestamp]);

	React.useEffect(() => {
		setAnchorTimestamp(
			moment
				.utc(timestamp.valueOf())
				.subtract(interval / 2, 'minutes')
				.startOf('minute')
				.valueOf(),
		);
		setCenterTimestamp(timestamp.valueOf());
	}, [timestamp]);

	React.useEffect(() => {
		getCurrentChunks(state.initialPosition);
		raf(() => {
			if (viewportElementRef.current) {
				viewportElementRef.current.scrollLeft = state.initialPosition;
			}
		}, 3);
	}, [anchorTimestamp]);

	React.useLayoutEffect(() => {
		raf(() => {
			if (viewportElementRef.current && centerTimestamp) {
				const offset = (centerTimestamp - anchorTimestamp) * (chunkWidth / (interval * 60 * 1000));
				viewportElementRef.current.scrollLeft = state.initialPosition;
				viewportElementRef.current.scrollLeft = state.initialPosition - chunkWidth / 2 + offset;
			}
		}, 3);
	}, [centerTimestamp]);

	React.useEffect(() => {
		document.addEventListener('mousedown', handleMouseDown);

		return () => {
			document.removeEventListener('mousedown', handleMouseDown);
		};
	}, []);

	React.useEffect(() => {
		getTimeRange();
	}, [chunkWidth]);

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

		const updatedChunks: [Chunk, number][] = data.map(i => [getChunk(anchorTimestamp, i), i]);
		const isUpdated =
			chunks.length === 0 ||
			updatedChunks.some(
				([chunk, virtualizerIndex], i) =>
					chunk !== chunks[i][0] && virtualizerIndex !== chunks[i][1],
			);

		if (isUpdated) {
			setChunks(data.map(i => [getChunk(anchorTimestamp, i), i]));
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
				const { left } = intervalDiv.getBoundingClientRect();

				return left >= rangeBlockRect.left && left <= rangeBlockRect.right;
			});

		const targetDiv = divsInInterval.find(getDivRange);
		const timestamps = targetDiv && getDivRange(targetDiv);

		if (targetDiv && timestamps) {
			const [from] = timestamps;
			const pixelsDiff = rangeBlockRect.left - targetDiv.getBoundingClientRect().left;
			const secondsDiff = (pixelsDiff / chunkWidth) * (interval * 60);

			const intervalStart = moment.utc(from).add(secondsDiff, 'seconds');
			const intervalEnd = moment
				.utc(intervalStart)
				.add((rangeBlockRect.width / chunkWidth) * interval, 'minutes');

			if (intervalStart.isValid() && intervalEnd.isValid()) {
				const updatedRange: TimeRange = [intervalStart.valueOf(), intervalEnd.valueOf()];
				innerRange.current = updatedRange;
				setRange(updatedRange);
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
				key={anchorTimestamp}
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
			{panelsRange.map(panel => (
				<TimeSelector
					key={panel.type}
					windowTimeRange={range}
					onClick={panel.setRange}
					panelType={panel.type}
				/>
			))}
			<div className='graph-virtualizer__dragging-zone' ref={rangeElementRef} />
		</div>
	);
};

export default React.memo(GraphChunksVirtualizer);

interface TimeSelectorProps {
	onClick: (clickedTimestamp: number) => void;
	windowTimeRange: TimeRange;
	panelType: GraphPanelType;
}

function TimeSelector(props: TimeSelectorProps) {
	const { onClick, windowTimeRange, panelType } = props;

	const delayedSetState = React.useRef<NodeJS.Timeout | null>(null);
	const rootRef = React.useRef<HTMLDivElement>(null);
	const pointerRef = React.useRef<HTMLSpanElement>(null);
	const dashedLineRef = React.useRef<HTMLDivElement>(null);

	const updatePointerTimestamp = usePointerTimestampUpdate();

	function handleClick(e: React.MouseEvent<HTMLSpanElement>) {
		const clickedTime = getTimeOffset(e.pageX);
		onClick(clickedTime);
	}

	function handleMouseEnter() {
		if (!delayedSetState.current) {
			delayedSetState.current = setTimeout(() => {
				const pointerEl = pointerRef.current;
				const dashedLineEl = dashedLineRef.current;
				if (pointerEl && dashedLineEl) {
					pointerEl.style.display = 'block';
					dashedLineEl.style.display = 'block';
				}
			}, 60);
		}
	}

	function handleMouseOut() {
		if (delayedSetState.current) {
			clearTimeout(delayedSetState.current);
			delayedSetState.current = null;
		}
		const pointerEl = pointerRef.current;
		const dashedLineEl = dashedLineRef.current;
		if (pointerEl && dashedLineEl) {
			pointerEl.style.display = 'none';
			dashedLineEl.style.display = 'none';
		}
		updatePointerTimestamp(null);
	}

	function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
		const pointerEl = pointerRef.current;
		if (pointerEl) {
			const leftOffset = e.clientX - pointerEl.offsetWidth / 2;
			pointerEl.style.left = `${leftOffset}px`;
			const clickedTime = getTimeOffset(leftOffset);
			updatePointerTimestamp(clickedTime);
		}
	}

	function getTimeOffset(pageX: number) {
		if (!rootRef.current || !pointerRef.current) return 0;

		const [from, to] = windowTimeRange;
		const { left, width } = rootRef.current.getBoundingClientRect();
		const pointerWidth = pointerRef.current.getBoundingClientRect().width;
		const clickPoint = pageX - left + pointerWidth / 2;

		return Math.floor(from + (to - from) * (clickPoint / width));
	}

	return (
		<div
			className={`time-picker ${panelType}`}
			ref={rootRef}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseOut}
			onMouseMove={handleMouseMove}>
			<div ref={dashedLineRef} className={`time-picker__dashed-line ${panelType}`} />
			<span
				className={`time-picker__pointer ${panelType}`}
				ref={pointerRef}
				onClick={handleClick}
			/>
		</div>
	);
}

function getDivRange(intervalDiv: HTMLDivElement): null | TimeRange {
	const from = parseInt(intervalDiv.dataset.from || '');
	const to = parseInt(intervalDiv.dataset.to || '');

	if (from && to) return [from, to];
	return null;
}
