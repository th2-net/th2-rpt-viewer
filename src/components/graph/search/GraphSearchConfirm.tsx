/** *****************************************************************************
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
 *  limitations under the License.
 ***************************************************************************** */

import React from 'react';

interface Props {
	onConfirm: () => void;
	onDecline: () => void;
}

const GraphSearchConfirm = ({ onConfirm, onDecline }: Props) => {
	const [countdown, setCountdown] = React.useState(5);
	const timeoutRef = React.useRef<NodeJS.Timeout>();
	const intervalRef = React.useRef<NodeJS.Timeout>();

	React.useEffect(() => {
		timeoutRef.current = setTimeout(onDecline, 5000);
		intervalRef.current = setInterval(() => {
			setCountdown(c => c - 1);
		}, 1000);
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			if (intervalRef.current) {
				setCountdown(0);
				clearInterval(intervalRef.current);
			}
		};
	}, []);

	return (
		<div className='graph-search-confirm'>
			<p className='graph-search-confirm__text'>Do you want to refresh panels?</p>
			<div className='graph-search-confirm__controls'>
				<button className='graph-search-confirm__button' onClick={onConfirm}>
					Yes
				</button>
				<button className='graph-search-confirm__button' onClick={onDecline}>
					No ({countdown})
				</button>
			</div>
		</div>
	);
};

export default GraphSearchConfirm;
