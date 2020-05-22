/** ****************************************************************************
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
* limitations under the License.
***************************************************************************** */

import React from 'react';
import { TScrollContainer } from 'react-virtuoso';
import MessagesHeatmap from './MessagesHeatmap';

const MessagesScrollContainer: TScrollContainer = ({
	className,
	style,
	reportScrollTop,
	scrollTo,
	children,
}) => {
	const scrollContainer = React.useRef<HTMLDivElement>(null);

	scrollTo((scrollTop: ScrollToOptions) => {
		scrollContainer.current?.scrollTo(scrollTop);
	});

	return (
		<div style={{ width: '100%', height: '100%', display: 'flex' }}>
			<div
				ref={scrollContainer}
				onScroll={(e: React.SyntheticEvent<HTMLDivElement>) =>
					reportScrollTop(e.currentTarget.scrollTop)}
				style={{
					...style,
					flexGrow: 1,
					marginRight: '11px',
				}}
				tabIndex={0}
				className={className}
			>
				{children}
			</div>
			<MessagesHeatmap />
		</div>
	);
};

export default MessagesScrollContainer;
