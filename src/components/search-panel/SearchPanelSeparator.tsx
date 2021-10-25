import React from 'react';
import moment from 'moment';

interface Props {
	timestamp: number;
}

const SearchPanelSeparator = (props: Props) => {
	const { timestamp } = props;
	const time = moment(timestamp).utc();
	return (
		<div className={'search-result-separator'}>
			<span className={'search-result-separator__text'}>
				No Data for
				<b>
					{time.hour() > 0 && ` ${time.hour()}h`}
					{time.minute() > 0 && ` ${time.minute()}min`}
					{time.second() > 0 && ` ${time.second()}sec`}
				</b>
			</span>
		</div>
	);
};

export default SearchPanelSeparator;
