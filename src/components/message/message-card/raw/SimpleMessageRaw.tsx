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
 * limitations under the License.
 ***************************************************************************** */

import * as React from 'react';
import { splitOnReadableParts } from '../../../../helpers/stringUtils';

interface Props {
	rawContent: string;
}

export default function SimpleMessageRaw({ rawContent }: Props) {
	const contentRef = React.useRef<HTMLDivElement>(null);

	const humanReadableContent = atob(rawContent);
	const convertedArr = splitOnReadableParts(humanReadableContent);

	return (
		<div className='mc-raw__asci' ref={contentRef}>
			{convertedArr.map((part, index) =>
				part.isPrintable ? (
					<span key={index} style={{ display: '' }}>
						{part.text}
					</span>
				) : (
					<span key={index} className='mc-raw__non-printing-character'>
						SOH
					</span>
				),
			)}
		</div>
	);
}
