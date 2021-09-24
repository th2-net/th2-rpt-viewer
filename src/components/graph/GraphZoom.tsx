import * as React from 'react';
import { IntervalOption } from '../../models/Graph';
import { TimeRange } from '../../models/Timestamp';
import '../../styles/graph.scss';

interface Props {
	setInterval: (interval: IntervalOption) => void;
	setTimestamp: (timestamp: number) => void;
	windowRange: TimeRange;
}

type zoomItem = {
	value: IntervalOption;
	text: string;
	toggle: boolean;
};

const GraphZoomOptions = (props: Props) => {
	const { setInterval, setTimestamp, windowRange } = props;
	const [zoomItems, setZoomItems] = React.useState<Array<zoomItem>>([
		{ value: 15, text: '1x', toggle: true },
		{ value: 60, text: '4x', toggle: false },
		{ value: 240, text: '16x', toggle: false },
	]);

	const handleClick = (zoomValue: IntervalOption) => {
		const [from, to] = windowRange;
		const centerTimestamp = from + (to - from) / 2;
		setZoomItems(zoomItems.map(item => ({ ...item, toggle: item.value === zoomValue })));
		setInterval(zoomValue);
		setTimestamp(centerTimestamp);
	};

	return (
		<div className='zoom-list'>
			{zoomItems.map(item => (
				<button
					key={item.value}
					className={`zoom-item ${item.toggle ? 'active' : ''}`}
					onClick={() => handleClick(item.value)}>
					{item.text}
				</button>
			))}
		</div>
	);
};

export default GraphZoomOptions;
