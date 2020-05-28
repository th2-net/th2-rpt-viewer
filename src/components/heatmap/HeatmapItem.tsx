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
import { HeatmapElement } from '../../models/Heatmap';
import { hexToRGBA } from '../../helpers/color';

const HEATMAP_ELEMENT_MIN_HEIGHT = 14;
const PINNED_MIN_HEIGHT = 21;

interface Props extends HeatmapElement {
	isSelected: boolean;
	onClick: (element: HeatmapElement) => void;
	totalCount: number;
}

const HeatmapItem = ({
	color,
	index,
	count,
	id,
	isSelected,
	isPinned = false,
	onClick,
	totalCount,
}: Props) => {
	const onItemClick = (event: React.MouseEvent<HTMLDivElement>) => {
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
				borderWidth: isSelected || isPinned ? '3px' : '2px',
				backgroundColor: '#FFF',
				flexGrow: count / totalCount,
				minHeight: id ? isPinned ? PINNED_MIN_HEIGHT : `${HEATMAP_ELEMENT_MIN_HEIGHT}px` : undefined,
			}}
			key={index}
			className="heatmap__element"
			onClick={onItemClick}>
			<div style={{ backgroundColor: isSelected && color ? hexToRGBA(color, 17) : undefined }}/>
			{isPinned && <div className="heatmap__pin-icon" />}
		</div>
	);
};

export default HeatmapItem;
