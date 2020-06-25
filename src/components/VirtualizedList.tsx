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

import * as React from 'react';
import { Virtuoso, VirtuosoMethods, TScrollContainer } from 'react-virtuoso';
import { raf } from '../helpers/raf';

interface Props {
    computeItemKey?: (idx: number) => React.Key;
    rowCount: number;
	itemRenderer: (index: number) => React.ReactElement;
	/*
		Number objects is used here because in some cases (eg one message / action was selected several times
		by different entities)
		We can't understand that we need to scroll to the selected entity again when we are comparing primitive numbers.
		Objects and reference comparison is the only way to handle numbers changing in this case.
	*/
    // eslint-disable-next-line @typescript-eslint/ban-types
	scrolledIndex: Number | null;
	className?: string;
	ScrollContainer?: TScrollContainer;
	overscan?: number;
}

export class VirtualizedList extends React.Component<Props> {
	private virtuoso = React.createRef<VirtuosoMethods>();

	componentDidUpdate(prevProps: Props) {
		/*
			Here we handle a situation, when primitive value of Number object doesn't changed
			and passing new index value in List doesn't make any effect (because it requires primitive value).
			So we need to scroll List manually.
		*/
		if (prevProps.scrolledIndex !== this.props.scrolledIndex && this.props.scrolledIndex != null) {
			/*
				We need raf here because in some cases scrolling happened before remeasuring row heights,
				so we need to wait until component is complete rerender after remeasuring changed rows,
				and then scroll to selected row.
				Without it List will calculate wrong scrollTop because it contains outdated information
				about row's heights.
			*/
			this.virtuoso.current?.scrollToIndex({ index: +this.props.scrolledIndex, align: 'start' });
		}
	}

	componentDidMount() {
		if (this.props.scrolledIndex !== null) {
			// we need raf here, because in componentDidMount virtualized list is not complete its render

			raf(() => {
				this.virtuoso.current?.scrollToIndex({ index: Number(this.props.scrolledIndex), align: 'start' });
			}, 3);
		}
	}

	render() {
		const {
			rowCount,
			computeItemKey,
			className,
			ScrollContainer,
			overscan = 3,
		} = this.props;

		return (
			<Virtuoso
				totalCount={rowCount}
				ref={this.virtuoso}
				overscan={overscan}
				computeItemKey={computeItemKey}
				item={this.props.itemRenderer}
				style={{ height: '100%', width: '100%' }}
				className={className}
				ScrollContainer={ScrollContainer} />
		);
	}
}
