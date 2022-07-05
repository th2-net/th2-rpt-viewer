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

import moment from 'moment';

interface Props {
	prevElement: number;
	nextElement: number;
}

const SearchPanelSeparator = (props: Props) => {
	const { prevElement, nextElement } = props;
	const time = moment(Math.abs(nextElement - prevElement)).utc();
	return (
		<div className='search-result-separator'>
			<span className='search-result-separator__text'>
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
