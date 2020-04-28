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
import { Virtuoso, TScrollContainer, VirtuosoMethods } from 'react-virtuoso';
import ResizeObserver from 'resize-observer-polyfill';
import { StatusType } from '../models/Status';
import HeatmapScrollbar from './heatmap/HeatmapScrollbar';
import { raf } from '../helpers/raf';
import { ScrollHint } from '../models/util/ScrollHint';

const DEFAULT_ITEM_HEIGHT = 60;

const { Provider, Consumer } = React.createContext({
	rowCount: 0,
	rowHeightMap: {} as { [index: number]: number },
	selectedElements: new Map<number, StatusType>(),
	scrollHints: [],
});

interface Props {
    renderElement: (idx: number) => React.ReactElement;
    computeItemKey?: (idx: number) => number;
    rowCount: number;

    // for heatmap scrollbar
    selectedElements: Map<number, StatusType>;
    scrollHints?: ScrollHint[];

	/*
		Number objects is used here because in some cases (eg one message / action was selected several times
		by diferent entities)
		We can't understand that we need to scroll to the selected entity again when we are comparing primitive numbers.
		Objects and reference comparison is the only way to handle numbers changing in this case.
	*/
    // eslint-disable-next-line @typescript-eslint/ban-types
    scrolledIndex: Number | null;
}

type State = { [index: number]: number };

export class VirtualizedList extends React.Component<Props, State> {
	state: State = {};

	resizeObserver = new ResizeObserver(entries => {
		const stateUpdate: State = {};

		entries.forEach(entry => {
			const { index } = (entry.target as HTMLDivElement).dataset;
			const { height } = entry.contentRect;
			if (index !== undefined
				&& this.state[parseInt(index)] !== height) {
				stateUpdate[parseInt(index)] = height;
			}
		});
		if (Object.entries(stateUpdate).length > 0) {
			this.setState(stateUpdate);
		}
	});

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
			this.virtuoso.current?.scrollToIndex({ index: +this.props.scrolledIndex, align: 'center' });
		}
	}

	componentDidMount() {
		if (this.props.scrolledIndex != null) {
			// we need raf here, because in componentDidMount virtualized list is not complete its render

			raf(() => {
				this.virtuoso.current?.scrollToIndex({ index: Number(this.props.scrolledIndex), align: 'center' });
			}, 3);
		}
	}

	render() {
		const {
			rowCount, selectedElements, computeItemKey,
		} = this.props;

		return (
			<Provider value={{
				selectedElements, rowCount, rowHeightMap: this.state, scrollHints: [],
			}}>
				<Virtuoso
					totalCount={rowCount}
					ref={this.virtuoso}
					overscan={3}
					ScrollContainer={ScrollContainer as TScrollContainer}
					computeItemKey={computeItemKey}
					item={this.itemRenderer} />
			</Provider>
		);
	}

	private itemRenderer = (index: number) => (
		<ElementWrapper
			index={index}
			onMount={ref => this.resizeObserver.observe(ref.current as Element)}
			onUnmount={ref => this.resizeObserver.unobserve(ref.current as Element)}>
			{this.props.renderElement(index)}
		</ElementWrapper>
	);
}

type WrapperProps = React.PropsWithChildren<{
    onMount: (ref: React.MutableRefObject<HTMLDivElement | null>) => void;
    onUnmount: (ref: React.MutableRefObject<HTMLDivElement | null>) => void;
    index: number;
}>;

function ElementWrapper({
	onMount, onUnmount, children
}: WrapperProps) {
	const ref = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		onMount(ref);

		return () => onUnmount(ref);
	}, []);

	return (
		<div ref={ref}>
			{children}
		</div>
	);
}


interface ScrollContanerProps {
	children: React.ReactNode;
    reportScrollTop: (scrollTop: number) => void;
    scrollTo: (callback: (scrollTop: ScrollToOptions) => void) => void;
}

const ScrollContainer = ({ reportScrollTop, scrollTo, children }: ScrollContanerProps) => {
	const elRef = React.useRef<HeatmapScrollbar>(null);

	scrollTo((scrollOptions: ScrollToOptions) => {
		elRef.current?.scrollTop(scrollOptions);
	});

	return (
		<Consumer>
			{
				({
					rowCount, rowHeightMap, selectedElements, scrollHints,
				}) => (
					<HeatmapScrollbar
						ref={elRef}
						heightMapper={index => rowHeightMap[index] ?? DEFAULT_ITEM_HEIGHT}
						onScroll={(e: any) => reportScrollTop(e.target.scrollTop)}
						selectedElements={selectedElements}
						elementsCount={rowCount}
						scrollHints={scrollHints}>
						{children}
					</HeatmapScrollbar>
				)
			}
		</Consumer>
	);
};
