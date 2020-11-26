/* eslint-disable max-len */
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
import { observer } from 'mobx-react-lite';
import { useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useGraphStore } from '../../hooks/useGraphStore';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';
import { isClickEventInElement, isDivElement } from '../../helpers/dom';
import { rangeSelectorStyles } from './Graph';
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
	row: (index: number) => JSX.Element;
	chunkWidth: number;
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

const GraphChunksScrollContainer = (props: Props, ref: any) => {
	const { settings, chunkWidth } = props;

	const graphStore = useGraphStore();

	const viewportElementRef = React.useRef<HTMLDivElement>(null);
	const rangeElementRef = React.useRef<HTMLDivElement>(null);
	const prevItemsRef = React.useRef<HTMLDivElement>(null);
	const nextItemsRef = React.useRef<HTMLDivElement>(null);

	const [state, setState] = React.useState<State>(setInitialState(settings));

	const startX = React.useRef(0);
	const scrollLeft = React.useRef(0);
	const isDown = React.useRef(false);

	const motion = useMotionValue(state.initialPosition + chunkWidth / 2);
	const spring = useSpring(motion, { stiffness: 300, damping: 40 });

	React.useEffect(() => {
		spring.onChange(value => (viewportElementRef.current!.scrollLeft = value));
	}, []);

	React.useEffect(() => {
		if (!viewportElementRef.current) return;
		viewportElementRef.current.scrollLeft = state.initialPosition + chunkWidth / 2;
		if (!state.initialPosition) {
			runScroller(0);
		}
	}, []);

	React.useEffect(() => {
		document.addEventListener('mousedown', handleMouseDown);

		return () => {
			document.removeEventListener('mousedown', handleMouseDown);
		};
	}, []);

	const handleMouseDown = (event: MouseEvent) => {
		if (!rangeElementRef.current || !viewportElementRef.current) return;
		if (isClickEventInElement(event, rangeElementRef.current)) {
			isDown.current = true;
			startX.current = event.pageX - (viewportElementRef.current?.offsetLeft || 0);
			scrollLeft.current = viewportElementRef.current.scrollLeft;

			document.addEventListener('mouseup', handleMouseUp);
			document.addEventListener('mousemove', handleMouseMove);
		}
	};

	const handleMouseUp = () => {
		isDown.current = false;

		document.removeEventListener('mouseup', handleMouseUp);
		document.removeEventListener('mousemove', handleMouseMove);
	};

	const handleMouseMove = (event: MouseEvent) => {
		if (!viewportElementRef.current || !isDown.current) return;
		event.preventDefault();
		const x = event.pageX - viewportElementRef.current.offsetLeft;
		const walk = (x - startX.current) * 3;
		// viewportElementRef.current.scrollLeft = scrollLeft.current - walk;
		motion.set(scrollLeft.current - walk);
	};

	const runScroller = (sl: number) => {
		const {
			totalWidth,
			toleranceWidth,
			bufferedItems,
			settings: { itemWidth, minIndex },
		} = state;
		const index = minIndex + Math.floor((sl - toleranceWidth) / itemWidth);
		const data = getIndexes(index, bufferedItems);
		const leftPadding = Math.max((index - minIndex) * itemWidth, 0);
		const rightPadding = Math.max(totalWidth - leftPadding - data.length * itemWidth, 0);

		setState({
			...state,
			leftPadding,
			rightPadding,
			data,
		});

		getTimeRange();
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
			const secondsDiff = (pixelsDiff / chunkWidth) * (graphStore.interval * 60);

			const intervalStart = moment(from).add(secondsDiff, 'seconds');
			const intervalEnd = moment(intervalStart).add(graphStore.interval, 'minutes');
			if (intervalStart.isValid() && intervalEnd.isValid()) {
				graphStore.timestamp = intervalStart.valueOf();
			}
		}

		function getDivInterval(intervalDiv: HTMLDivElement): null | [number, number] {
			const from = parseInt(intervalDiv.dataset.from || '');
			const to = parseInt(intervalDiv.dataset.to || '');

			if (from && to) return [from, to];
			return null;
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

	const { viewportWidth, leftPadding, rightPadding, data } = state;

	const scrollLeftHalfInterval = () => {
		if (viewportElementRef.current) {
			motion.set(viewportElementRef.current?.scrollLeft - chunkWidth / 2);
		}
	};

	const scrollRightHalfInterval = () => {
		if (viewportElementRef.current) {
			motion.set(viewportElementRef.current?.scrollLeft + chunkWidth / 2);
		}
	};

	return (
		<div
			className='graph-timeline'
			ref={viewportElementRef}
			onScroll={e => runScroller(e.currentTarget.scrollLeft)}
			style={{ width: viewportWidth }}>
			<div ref={prevItemsRef} style={{ width: leftPadding, flexShrink: 0 }} />
			{data.map(index => props.row(index))}
			<div ref={nextItemsRef} style={{ width: rightPadding, flexShrink: 0 }} />
			<div style={{ ...rangeSelectorStyles, visibility: 'hidden' }} ref={rangeElementRef} />
			<button
				style={{ position: 'absolute', transform: 'translate(-121%, 6px)', left: '24%' }}
				onClick={scrollLeftHalfInterval}>
				Left
			</button>
			<button
				style={{ position: 'absolute', transform: 'translate(121%, 6px)', left: '74%' }}
				onClick={scrollRightHalfInterval}>
				Right
			</button>
		</div>
	);
};

export default observer(GraphChunksScrollContainer);
