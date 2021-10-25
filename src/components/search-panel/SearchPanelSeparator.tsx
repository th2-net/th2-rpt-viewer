import React from 'react';
import moment from 'moment';

interface Props {
	prevElement: number;
	nextElement: number;
}

const SearchPanelSeparator = (props: Props) => {
	const { prevElement, nextElement } = props;
	const time = moment(Math.abs(nextElement - prevElement)).utc();
	return (
		<div className={'search-result-separator'}>
			<span className={'search-result-separator__text'}>
				No Data for
				<b>
					{time.hour() > 0 && ` ${time.hour()}h`}
					{time.minute() > 0 && ` ${time.minute()}min`}
					{time.second() > 0 && ` ${time.second()}sec`}
					{time.millisecond() > 0 && ` ${time.millisecond()}ms`}
				</b>
			</span>
		</div>
	);
};

export default SearchPanelSeparator;
