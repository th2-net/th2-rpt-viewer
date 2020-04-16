/** ****************************************************************************
 * Copyright 2009-2019 Exactpro (Exactpro Systems Limited)
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

import * as React from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import { StatusType } from '../../models/Status';
import { createStyleSelector } from '../../helpers/styleCreators';
import { rangeSum } from '../../helpers/range';
import { ScrollHint } from '../../models/util/ScrollHint';

interface SmartHeatmapProps {
    elementsCount: number;
    selectedElements: Map<number, StatusType>;
    elementHeightMapper: (index: number) => number;
    scrollHints?: ScrollHint[];
}

function SmartHeatmap({ selectedElements, ...props }: SmartHeatmapProps) {
	const [rootHeight, setRootHeight] = React.useState<number>(0);
	const root = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		const resizeObserver = new ResizeObserver(elements => {
			const nextRootHeight = elements[0]?.contentRect.height;

			if (nextRootHeight !== rootHeight) {
				setRootHeight(nextRootHeight);
			}
		});

		resizeObserver.observe(root.current as Element);

		return () => {
			resizeObserver.unobserve(root.current as Element);
		};
	}, []);

	return (
		<div className="heatmap-scrollbar smart" ref={root}>
			{
				Array.from(selectedElements).map(([index, status]) => (
					<SmartHeatmapElement
						{...props}
						rootHeight={rootHeight}
						key={index}
						index={index}
						status={status}
						scrollHint={null}
					/>
				))
			}
		</div>
	);
}

interface SmartHeatmapElementProps extends Omit<SmartHeatmapProps, 'selectedElements'> {
    index: number;
    status: StatusType;
    rootHeight: number;
    scrollHint: ScrollHint | null;
}

const SmartHeatmapElement = ({
	index, elementHeightMapper, elementsCount, rootHeight, status,
}: SmartHeatmapElementProps) => {
	const topOffset = rangeSum(0, index - 1, elementHeightMapper);
	const elementHeight = elementHeightMapper(index);
	const totalHeight = rangeSum(0, elementsCount, elementHeightMapper);
	const scale = rootHeight / totalHeight;
	const topOffsetScaled = topOffset * scale;
	const elementHeightScaled = elementHeight * scale;

	const className = createStyleSelector('heatmap-scrollbar-item', 'smart', status);
	const style: React.CSSProperties = {
		top: topOffsetScaled,
		height: elementHeightScaled,
		right: 0,
		left: 0,
		position: 'absolute',
	};

	return (
		<div style={style}>
			<div className={className} />
		</div>
	);
};

export default SmartHeatmap;
