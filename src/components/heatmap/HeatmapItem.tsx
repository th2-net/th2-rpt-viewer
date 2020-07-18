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
import { createBemElement } from '../../helpers/styleCreators';

const HEATMAP_ELEMENT_MIN_HEIGHT = 14;
const PINNED_MIN_HEIGHT = 21;

interface Props extends HeatmapElement {
	isSelected: boolean;
	onClick: (element: HeatmapElement) => void;
	totalCount: number;
}

const HeatmapBlock = ({
	colors,
	index,
	count,
	id,
	isSelected,
	isPinned = false,
	onClick,
	totalCount,
}: Props) => {
	const onItemClick = (event: React.MouseEvent<HTMLDivElement>) => {
		if (!id) return;
		const { height, top } = event.currentTarget.getBoundingClientRect();
		const step = (height / count);
		const clickIndex = Math.floor(index + (event.clientY - top) / step);
		onClick({
			count,
			index: clickIndex,
			id,
			colors,
		});
	};

	const pinIconClassName = createBemElement(
		'heatmap-block',
		'pin-icon',
		isPinned
			? colors.length === 1 ? 'default' : 'contoured'
			: null,
	);

	return (
		<div
			data-start={index}
			data-end={count === 1 ? index : index + count - 1}
			data-testid="heatmap-block"
			data-count={count}
			style={{
				cursor: id !== undefined ? 'pointer' : 'default',
				flexGrow: count / totalCount,
				minHeight: id ? isPinned ? PINNED_MIN_HEIGHT : `${HEATMAP_ELEMENT_MIN_HEIGHT}px` : undefined,
				backgroundColor: colors.length ? undefined : '#FFF',
				border: colors.length ? 'none' : undefined,
				borderWidth: isSelected || isPinned ? '3px' : '2px',
			}}
			key={index}
			className="heatmap-block"
			onClick={onItemClick}>
			{colors.map((color, i) =>
				<HeatmapItem
					color={color}
					key={color}
					isSelected={isSelected}
					style={{
						marginRight: colors.length && i !== colors.length - 1 ? '2px' : 0,
					}}/>)}
			{isPinned && <div className={pinIconClassName} />}
		</div>
	);
};

export default HeatmapBlock;


interface HeatmapItemProps {
	color: string;
	style?: React.CSSProperties;
	isSelected: boolean;
}
const HeatmapItem = ({ color, style, isSelected }: HeatmapItemProps) => (
	<div
		className="heatmap-element"
		style={{
			borderColor: color,
			backgroundColor: isSelected && color ? hexToRGBA(color, 17) : undefined,
			...style,
		}}>
	</div>
);
