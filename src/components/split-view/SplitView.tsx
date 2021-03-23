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

import * as React from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import { createStyleSelector } from '../../helpers/styleCreators';
import '../../styles/splitter.scss';

export interface Props {
	/**
	 * Panel for components : first child - for left panel, second child - for right panel,
	 * other children will be ignored
	 */
	children: [React.ReactNode, React.ReactNode];
	className?: string;
	panelArea: number;
	onPanelAreaChange: (panelArea: number) => void;
	splitterClassName?: string;
}

interface State {
	isDragging: boolean;
	previewPanelArea: number;
	rootWidth: number;
	rootHeight: number;
	isVertical: boolean;
}

export default class SplitView extends React.Component<Props, State> {
	private leftPanel = React.createRef<HTMLDivElement>();

	private root = React.createRef<HTMLDivElement>();

	private splitter = React.createRef<HTMLDivElement>();

	private splitterThickness = 32;

	private lastPosition = {
		x: 0,
		y: 0,
	};

	private resizeObserver = new ResizeObserver(this.onResize.bind(this));

	constructor(props: Props) {
		super(props);
		this.state = {
			isDragging: false,
			previewPanelArea: props.panelArea,
			rootWidth: 0,
			rootHeight: 0,
			isVertical: false,
		};
	}

	componentDidMount() {
		if (this.root.current) {
			this.resizeObserver.observe(this.root.current);
		}
	}

	componentWillUnmount() {
		if (this.root.current) {
			this.resizeObserver.unobserve(this.root.current);
		}
	}

	get panelsAvailableWidth() {
		return (this.root.current?.offsetWidth || window.innerWidth) - this.splitterThickness;
	}

	get panelsAvailableHeight() {
		return (this.root.current?.offsetHeight || window.innerHeight) - this.splitterThickness;
	}

	private splitterMouseDown = (e: React.MouseEvent) => {
		if (this.root.current) {
			this.root.current.addEventListener('mousemove', this.onMouseMove);
			this.root.current.addEventListener('mouseleave', this.onMouseUpOrLeave);
			this.root.current.addEventListener('mouseup', this.onMouseUpOrLeave);

			this.lastPosition.x = e.clientX - this.root.current.getBoundingClientRect().left;
			this.lastPosition.y = e.clientY - this.root.current.getBoundingClientRect().top;
		}

		this.setState({
			isDragging: true,
		});
	};

	private onMouseUpOrLeave = () => {
		if (this.root.current) {
			this.root.current.removeEventListener('mousemove', this.onMouseMove);
			this.root.current.removeEventListener('mouseup', this.onMouseUpOrLeave);
			this.root.current.removeEventListener('mouseleave', this.onMouseUpOrLeave);
		}

		this.stopDragging();
	};

	private onMouseMove = (e: MouseEvent) => {
		if (this.root.current) {
			this.resetPosition({
				x: e.clientX - this.root.current.getBoundingClientRect().left,
				y: e.clientY - this.root.current.getBoundingClientRect().top,
			});
		}
	};

	private onResize(elements: ResizeObserverEntry[]) {
		if (elements[0]) {
			const nextRootWidth = elements[0].contentRect.width;
			const nextRootHeight = elements[0].contentRect.height;

			const isVerticalNext = nextRootWidth < 500;

			this.setState({
				rootWidth: nextRootWidth,
				rootHeight: nextRootHeight,
				isVertical: isVerticalNext,
			});
		}
	}

	resetPosition(newPosition: { x: number; y: number }) {
		this.lastPosition = { ...newPosition };

		let previewPanelArea: number;

		if (this.state.isVertical) {
			previewPanelArea =
				((newPosition.y - this.splitterThickness / 2) / this.panelsAvailableHeight) * 100;
		} else {
			previewPanelArea =
				((newPosition.x - this.splitterThickness / 2) / this.panelsAvailableWidth) * 100;
		}

		previewPanelArea = Math.max(Math.min(previewPanelArea, 100), 0);
		previewPanelArea = Math.round(previewPanelArea / 5) * 5;

		this.setState({
			previewPanelArea,
		});
	}

	private stopDragging() {
		this.props.onPanelAreaChange(this.state.previewPanelArea);

		this.setState({
			isDragging: false,
		});
	}

	private getPanelsWidthByArea(area: number): [number, number] {
		const availableWidth = this.panelsAvailableWidth;

		return [(area / 100) * availableWidth, availableWidth - (area / 100) * availableWidth];
	}

	private getPanelsHeightByArea(area: number): [number, number] {
		const availableHeight = this.panelsAvailableHeight;

		return [(area / 100) * availableHeight, availableHeight - (area / 100) * availableHeight];
	}

	render() {
		const { children, panelArea, className } = this.props;
		const { isDragging, previewPanelArea, isVertical } = this.state;

		let rootStyle: React.CSSProperties = {};
		let previewStyle: React.CSSProperties = {};
		let splitterStyle: React.CSSProperties = {};

		// during first render we can't calculate panel's sizes
		if (this.root.current) {
			if (isVertical) {
				const [topHeight, bottomHeight] = this.getPanelsHeightByArea(panelArea);
				rootStyle = { gridTemplateRows: `${topHeight}px auto ${bottomHeight}px` };

				const [topPreviewHeight, bottomPreviewHeight] = this.getPanelsHeightByArea(
					previewPanelArea,
				);
				previewStyle = {
					gridTemplateRows: `${topPreviewHeight}px auto ${bottomPreviewHeight}px`,
				};

				splitterStyle = {
					top: isDragging ? (previewPanelArea * this.panelsAvailableHeight) / 100 : undefined,
				};
			} else {
				const [leftWidth, rightWidth] = this.getPanelsWidthByArea(panelArea);
				rootStyle = { gridTemplateColumns: `${leftWidth}px auto ${rightWidth}px` };

				const [leftPreviewWidth, rightPreviewWidth] = this.getPanelsWidthByArea(previewPanelArea);
				previewStyle = {
					gridTemplateColumns: `${leftPreviewWidth}px auto ${rightPreviewWidth}px`,
				};

				splitterStyle = {
					left: isDragging ? (previewPanelArea * this.panelsAvailableWidth) / 100 : undefined,
				};
			}
		}

		const leftClassName = createStyleSelector(
			'splitter-pane-left',
			isDragging ? 'dragging' : null,
			panelArea === 0 ? 'hidden' : null,
		);
		const rightClassName = createStyleSelector(
			'splitter-pane-right',
			isDragging ? 'dragging' : null,
			panelArea === 100 ? 'hidden' : null,
		);
		const splitterClassName = createStyleSelector(
			'splitter-bar',
			isDragging ? 'dragging' : null,
			this.props.splitterClassName || null,
		);
		const rootClassName = createStyleSelector(
			'splitter',
			isDragging ? 'dragging' : null,
			isVertical ? 'vertical' : null,
		);

		return (
			<div className={`${rootClassName} ${className ?? ''}`} ref={this.root} style={rootStyle}>
				{isDragging ? (
					<div className='splitter-preview' style={previewStyle}>
						<div className='splitter-preview-left' />
						<div className='splitter-preview-right' />
					</div>
				) : null}
				<div className={leftClassName} ref={this.leftPanel}>
					{children[0]}
				</div>
				<div className={rightClassName}>{children[1]}</div>
				<div
					className={splitterClassName}
					style={splitterStyle}
					onMouseDown={this.splitterMouseDown}
					ref={this.splitter}>
					<div className='splitter-bar-button'>
						<div className='splitter-bar-icon' />
					</div>
				</div>
			</div>
		);
	}
}
