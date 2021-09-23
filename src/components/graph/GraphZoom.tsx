import * as React from 'react';
import { IntervalOption } from '../../models/Graph';
import '../../styles/graph.scss';

interface Props {
	setInterval: ((interval: IntervalOption) => void) | null;
}

type zoomItem = {
	value: IntervalOption;
	text: string;
};

const GraphZoom = (props: Props) => {
	const { setInterval } = props;
	const zoomItems: zoomItem[] = [
		{ value: 15, text: '1x' },
		{ value: 60, text: '4x' },
		{ value: 240, text: '16x' },
	];

	return (
		<div className='zoom-list'>
			{setInterval
				? zoomItems.map((item, index) => (
						<button
							key={`zoom-item-${index}`}
							className='zoom-item'
							onClick={() => setInterval(item.value)}>
							{item.text}
						</button>
				  ))
				: null}
		</div>
	);
};

export default GraphZoom;
