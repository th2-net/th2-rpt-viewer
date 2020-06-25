/** *****************************************************************************
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
 *  limitations under the License.
 ***************************************************************************** */

import React from 'react';

interface Props {
	color: string;
	className?: string;
}

const Bookmark = ({ color, className }: Props) => (
	<i style={{ marginRight: 12, display: 'flex' }}>
		<svg
			width="10"
			height="19"
			viewBox="0 0 10 19"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}>
			{/* eslint-disable-next-line max-len */}
			<path d="M9.16629 0.5H0.834853C0.400757 0.5 0.0488281 0.851929 0.0488281 1.28602V17.714C0.0488281 18.0074 0.212321 18.2765 0.472862 18.4117C0.73335 18.5468 1.0475 18.5256 1.28744 18.3566L5.00057 15.7417L8.71375 18.3566C8.84874 18.4517 9.0072 18.5 9.1664 18.5C9.29017 18.5 9.41436 18.4708 9.52828 18.4117C9.78882 18.2765 9.95232 18.0075 9.95232 17.714V1.28602C9.95232 0.851929 9.60039 0.5 9.16629 0.5ZM8.38027 16.1991L5.45316 14.1378C5.31744 14.0422 5.15898 13.9944 5.00057 13.9944C4.84216 13.9944 4.68375 14.0422 4.54798 14.1378L1.62088 16.1991V2.07205H8.38027V16.1991Z"
				fill={color}/>
		</svg>
	</i>
);

export default Bookmark;
