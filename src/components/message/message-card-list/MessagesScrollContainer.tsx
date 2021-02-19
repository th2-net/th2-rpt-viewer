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

import React from 'react';
import { ScrollerProps } from 'react-virtuoso';
import { useDebouncedCallback, useHeatmap, useCombinedRefs } from '../../../hooks';
import { MessagesHeightsContext, MessagesHeights } from './MessagesCardList';

const MessagesScrollContainer = React.forwardRef<HTMLDivElement, ScrollerProps>((props, ref) => {
	const { children, style } = props;

	const { setVisibleRange, visibleRange } = useHeatmap();

	const scrollContainer: React.RefObject<HTMLDivElement> = React.useRef(null);
	const combinedRef = useCombinedRefs<HTMLDivElement>(
		ref as React.MutableRefObject<HTMLDivElement>,
		scrollContainer as React.MutableRefObject<HTMLDivElement>,
	);

	const messagesHeights = React.useContext(MessagesHeightsContext);
	const prevHeights = React.useRef<MessagesHeights>({});

	React.useEffect(() => {
		if (!visibleRange) {
			getVisibleRange();
			return;
		}
		for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
			if (messagesHeights[i] !== prevHeights.current[i]) {
				getVisibleRange();
				break;
			}
		}
		prevHeights.current = messagesHeights;
	}, [messagesHeights]);

	const getVisibleRange = useDebouncedCallback(() => {
		if (!scrollContainer.current) return;
		const offsetTop = scrollContainer.current.offsetTop || 0;
		try {
			const renderedMessages = Array.from(scrollContainer.current.children[0].children[0].children);
			const fullyRendered = renderedMessages
				.filter(node => {
					const rect = node.getBoundingClientRect();
					const elemTop = rect.top - offsetTop + rect.height;
					const elemBottom = rect.bottom - rect.height;
					const isVisible = elemTop >= 0 && elemBottom <= window.innerHeight;
					return isVisible;
				})
				.map(node => (node as HTMLDivElement).dataset.index);

			if (fullyRendered.length > 0) {
				setVisibleRange({
					startIndex: parseInt(fullyRendered[0] as string),
					endIndex: parseInt(fullyRendered[fullyRendered.length - 1] as string),
				});
			} else {
				setVisibleRange({
					startIndex: 0,
					endIndex: 0,
				});
			}
		} catch {
			setVisibleRange({
				startIndex: 0,
				endIndex: 0,
			});
		}
	}, 5);

	const onScroll = () => {
		getVisibleRange();
	};

	return (
		<div style={{ width: '100%', height: '100%', display: 'flex' }}>
			<div
				style={{
					width: '100%',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					marginRight: '11px',
					flexGrow: 1,
				}}>
				<div
					className='messages-list__items'
					ref={combinedRef}
					onScroll={onScroll}
					style={{
						...style,
						flexGrow: 1,
						position: 'relative',
					}}
					tabIndex={0}>
					{children}
				</div>
			</div>
		</div>
	);
});

export default MessagesScrollContainer;
