import * as React from 'react';
import { createBemBlock } from '../../helpers/styleCreators';
import { IntervalOption } from '../../models/Graph';
import { TimeRange } from '../../models/Timestamp';
import '../../styles/graph.scss';

interface Props {
	setInterval: (interval: IntervalOption) => void;
	setTimestamp: (timestamp: number) => void;
	windowRange: TimeRange;
	interval: number;
}

type zoomItem = {
	value: IntervalOption;
	text: string;
};

const GraphZoomOptions = (props: Props) => {
	const { setInterval, setTimestamp, windowRange, interval } = props;
	const zoomItems: Array<zoomItem> = [
		{ value: 15, text: '1x' },
		{ value: 60, text: '4x' },
		{ value: 240, text: '16x' },
	];

	const handleClick = (zoomValue: IntervalOption) => {
		const [from, to] = windowRange;
		const centerTimestamp = from + (to - from) / 2;
		setInterval(zoomValue);
		setTimestamp(centerTimestamp);
	};

	return (
		<div className='zoom-list'>
			{zoomItems.map(item => (
				<button
					key={item.value}
					className={createBemBlock('zoom-item', item.value === interval ? 'active' : null)}
					onClick={() => handleClick(item.value)}>
					{item.text}
				</button>
			))}
		</div>
	);
};

export default GraphZoomOptions;
