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

/* eslint-disable no-param-reassign */

import * as React from 'react';
import { Panel } from 'models/Panel';
import { createStyleSelector } from '../../helpers/styleCreators';

const MIN_PANEL_WIDTH = 15;

export type WorkspacePanelsLayout = [number, number, number, number];

function minmax(num: number, min: number, max: number) {
	return Math.min(Math.max(num, min), max);
}

interface PanelProps {
	title: string;
	component: React.ReactNode;
	isActive: boolean;
	color: {
		default: string;
		active: string;
	};
	setActivePanel: (panel: Panel) => void;
	panel: Panel;
}

export interface Props {
	className?: string;
	splitterClassName?: string;
	panels: Array<PanelProps>;
	panelsLayout: WorkspacePanelsLayout;
	setPanelsLayout: (panelsLayout: WorkspacePanelsLayout) => void;
	togglePanel: (panel: Panel) => void;
}

function WorkspaceSplitter(props: Props) {
	const { panels, panelsLayout, setPanelsLayout, togglePanel } = props;
	const rootRef = React.useRef<HTMLDivElement>(null);
	const clickOffsetX = React.useRef(0);
	const activeSplitter = React.useRef<HTMLDivElement | null>(null);

	const [isResizing, setIsResizing] = React.useState(false);

	const panelsRefs = React.useRef(
		Array(panels.length)
			.fill(null)
			.map(() => React.createRef<HTMLDivElement>()),
	);

	const splittersRefs = React.useRef(
		Array(panels.length)
			.fill(null)
			.map(() => React.createRef<HTMLDivElement>()),
	);

	const overlaysRefs = React.useRef(
		Array(panels.length)
			.fill(null)
			.map(() => React.createRef<HTMLDivElement>()),
	);

	const splittersMinxMaxPositions = React.useRef<[number, number][]>([]);

	React.useLayoutEffect(() => {
		const rootEl = rootRef.current;
		if (!rootEl) return;

		panelsRefs.current.forEach((ref, index) => {
			const panelRef = ref.current;
			if (panelRef) {
				panelRef.style.width = `${panelsLayout[index]}%`;
				const widthInPx = (rootEl.getBoundingClientRect().width * panelsLayout[index]) / 100;
				if (Math.floor(widthInPx) <= MIN_PANEL_WIDTH * 2) {
					if (!panelRef.classList.contains('minified')) {
						panelRef.classList.add('minified');
					}
				} else if (panelRef.classList.contains('minified')) {
					panelRef.classList.remove('minified');
				}
			}
		});
	}, [panelsLayout]);

	function onMouseDown(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
		setIsResizing(true);

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);

		activeSplitter.current = event.target instanceof HTMLDivElement ? event.target : null;
		clickOffsetX.current = activeSplitter.current
			? event.pageX - activeSplitter.current.getBoundingClientRect().left
			: 0;

		calcMinMaxSplittersPositions();
		handleResize(event);

		splittersRefs.current.forEach(resizerRef => {
			if (resizerRef.current) {
				resizerRef.current.style.position = 'absolute';
				if (resizerRef.current === activeSplitter.current) {
					resizerRef.current.style.zIndex = '1002';
				}
			}
		});
	}

	function onMouseMove(e: MouseEvent) {
		e.preventDefault();

		handleResize(e);
	}

	function handleResize(e: MouseEvent | React.MouseEvent<HTMLDivElement>) {
		e.preventDefault();
		const activeSplitterEl = activeSplitter.current;
		const rootEl = rootRef.current;

		if (!activeSplitterEl || !rootEl) return;

		const { left: rootLeft, width: rootWidth } = rootEl.getBoundingClientRect();

		const activeSplitterLeftPosition = e.pageX - clickOffsetX.current - rootLeft;

		const splittersLeftPositions = getUpdatedSplittersPositions(activeSplitterLeftPosition);

		splittersRefs.current.forEach((splitter, index) => {
			if (splitter.current) {
				splitter.current.style.left = `${splittersLeftPositions[index]}px`;
			}
		});

		const splitterWidth = splittersRefs.current[0].current!.clientWidth;

		overlaysRefs.current.forEach((overlayRef, index) => {
			if (overlayRef.current) {
				overlayRef.current.style.left = `${splittersLeftPositions[index] + splitterWidth}px`;
				const overlayWidth =
					index === overlaysRefs.current.length - 1
						? rootRef.current!.offsetLeft +
						  rootWidth -
						  splittersLeftPositions[index] -
						  splitterWidth
						: splittersLeftPositions[index + 1] - splittersLeftPositions[index] - splitterWidth;
				overlayRef.current.style.width = `${overlayWidth}px`;
			}
		});
	}

	const onMouseUp = () => {
		const rootEl = rootRef.current;
		if (!rootEl) return;

		setIsResizing(false);

		document.removeEventListener('mousemove', onMouseMove);
		document.removeEventListener('mouseup', onMouseUp);

		const { width: rootWidth, left: rootOffsetLeft } = rootEl.getBoundingClientRect();

		const widths = splittersRefs.current.map((splitterRef, index) => {
			const { left, width } = splitterRef.current!.getBoundingClientRect();
			const nextSplitter = splittersRefs.current[index + 1];
			const right =
				nextSplitter && nextSplitter.current
					? nextSplitter.current.getBoundingClientRect().left
					: rootWidth + rootOffsetLeft;
			return Math.max(right - (left + width), 0);
		});

		const splitterWidth = splittersRefs.current[0].current!.clientWidth;

		setPanelsLayout(
			widths.map(w =>
				parseFloat(((w / (rootWidth - splitterWidth * panels.length)) * 100).toFixed(2)),
			) as WorkspacePanelsLayout,
		);

		splittersRefs.current.forEach(resizerRef => {
			if (resizerRef.current) {
				resizerRef.current.style.position = 'static';
				resizerRef.current.style.zIndex = '1000';
			}
		});
	};

	function calcMinMaxSplittersPositions() {
		if (!rootRef.current) return;
		const { width: rootOffsetWidth } = rootRef.current.getBoundingClientRect();

		splittersMinxMaxPositions.current = splittersRefs.current.map((splitterRef, index) => {
			if (!splitterRef.current) {
				return [0, window.innerWidth];
			}
			const min = (splitterRef.current.clientWidth + MIN_PANEL_WIDTH) * index;
			const max =
				rootOffsetWidth -
				(splitterRef.current.clientWidth + MIN_PANEL_WIDTH) *
					(splittersRefs.current.length - index);
			return [min, max];
		});
	}

	const getFreeSpaceAroundSplitter = (splitterIndex: number, splitterLeftPosition: number) => {
		const splitter = splittersRefs.current[splitterIndex].current!;
		const leftSplitter =
			splitterIndex === 1 ? null : splittersRefs.current[splitterIndex - 1]?.current;
		const rightSplitter = splittersRefs.current[splitterIndex + 1]?.current;

		return {
			left: leftSplitter
				? splitterLeftPosition - leftSplitter.offsetLeft - MIN_PANEL_WIDTH - splitter.clientWidth
				: splitterLeftPosition - MIN_PANEL_WIDTH - splitter.clientWidth,
			right: rightSplitter
				? rightSplitter.offsetLeft - splitterLeftPosition - MIN_PANEL_WIDTH - splitter.clientWidth
				: rootRef.current!.clientWidth -
				  MIN_PANEL_WIDTH -
				  splitter.clientWidth -
				  splitterLeftPosition,
		};
	};

	const getUpdatedSplittersPositions = (activeSplitterLeft: number) => {
		const activeSplitterIndex = splittersRefs.current.findIndex(
			splitter => splitter.current === activeSplitter.current,
		);

		const rootWidth = rootRef.current?.clientWidth as number;

		return splittersRefs.current
			.map((resizerRef, index) => {
				const resizer = resizerRef.current as HTMLDivElement;

				if (resizer === activeSplitter.current) {
					const { left, right } = getFreeSpaceAroundSplitter(index, activeSplitterLeft);
					let offsetLeft = activeSplitterLeft;

					if (left / rootWidth < 0.1) {
						offsetLeft = activeSplitterLeft - left;
					}

					if (right / rootWidth < 0.1) {
						offsetLeft = activeSplitterLeft + right;
					}

					return {
						resizer,
						offsetLeft,
					};
				}

				return {
					resizer,
					offsetLeft: resizer.offsetLeft,
				};
			})
			.map(({ offsetLeft, resizer }, index) => {
				if (resizer === activeSplitter.current) {
					return minmax(offsetLeft, ...splittersMinxMaxPositions.current[index]);
				}

				if (index < activeSplitterIndex) {
					const adjacentPosition =
						activeSplitterLeft -
						(MIN_PANEL_WIDTH + resizer.clientWidth) * (activeSplitterIndex - index);

					if (offsetLeft > adjacentPosition) {
						return minmax(adjacentPosition, ...splittersMinxMaxPositions.current[index]);
					}
					return minmax(offsetLeft, ...splittersMinxMaxPositions.current[index]);
				}

				const adjacentPosition =
					activeSplitterLeft +
					(MIN_PANEL_WIDTH + resizer.clientWidth) * (index - activeSplitterIndex);

				if (offsetLeft < adjacentPosition) {
					return minmax(adjacentPosition, ...splittersMinxMaxPositions.current[index]);
				}
				return minmax(offsetLeft, ...splittersMinxMaxPositions.current[index]);
			});
	};

	return (
		<div ref={rootRef} className='workspace-split-view'>
			{panels.map((panel, index) => (
				<React.Fragment key={panel.color.default}>
					<Splitter
						isResizing={isResizing}
						color={panel.isActive ? panel.color.active : panel.color.default}
						icon={<i className={`workspace-split-view__${panel.title.toLowerCase()}-icon`} />}
						onMouseDown={onMouseDown}
						disabled={index === 0}
						ref={splittersRefs.current[index]}
						isPanelActive={panel.isActive}
						setActivePanel={() => panel.setActivePanel(panel.panel)}
					/>
					<div className='workspace-split-view__pane pane' ref={panelsRefs.current[index]}>
						<div className='pane__sidebar' onClick={() => togglePanel(panel.panel)}>
							<i className={`workspace-split-view__${panel.title.toLowerCase()}-icon`} />
							<div className='pane__title'>{panel.title}</div>
							<div
								className='pane__line'
								style={{
									backgroundColor: panel.isActive ? panel.color.active : panel.color.default,
								}}
							/>
						</div>
						<div className='pane__wrapper'>
							<div
								className='pane__header'
								style={{
									backgroundColor: panel.isActive ? panel.color.active : panel.color.default,
								}}
								onClick={() => togglePanel(panel.panel)}>
								<i
									className={
										'pane__header-icon ' +
										`workspace-split-view__${panel.title.toLowerCase()}-icon-white`
									}
								/>
								<div className='pane__header-title'>{panel.title}</div>
							</div>
							<div className='pane__main'>{panel.component}</div>
						</div>
					</div>
					<Overlay
						color={panel.color.default}
						isResizing={isResizing}
						ref={overlaysRefs.current[index]}
					/>
				</React.Fragment>
			))}
		</div>
	);
}

export default React.memo(WorkspaceSplitter);

interface SplittedViewPanelProps {
	children: React.ReactNode;
}

export const SplittedViewPanel = React.forwardRef<HTMLDivElement, SplittedViewPanelProps>(
	({ children }, ref) => (
		<div className='workspace-splitter-panel' ref={ref}>
			{children}
		</div>
	),
);

SplittedViewPanel.displayName = 'SplittedViewPanel';

type SplitterProps = {
	color: string;
	icon?: React.ReactNode;
	disabled?: boolean;
	onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
	isResizing: boolean;
	isPanelActive?: boolean;
	setActivePanel?: () => void;
};

const Splitter = React.forwardRef<HTMLDivElement, SplitterProps>(
	({ onMouseDown, disabled, isPanelActive, setActivePanel }, ref) => {
		const splitterClassName = createStyleSelector(
			'workspace-splitter',
			isPanelActive ? null : 'inactive',
		);

		return (
			<div className={splitterClassName} onMouseDown={e => (disabled ? null : onMouseDown(e))}>
				<div
					ref={ref}
					onMouseDown={setActivePanel}
					className='workspace-splitter__handle'
					style={{ cursor: disabled ? 'default' : 'col-resize' }}></div>
			</div>
		);
	},
);

Splitter.displayName = 'Splitter';

interface OverlayProps {
	color: string;
	isResizing: boolean;
}

const Overlay = React.forwardRef<HTMLDivElement, OverlayProps>((props, ref) => {
	const [isVisible, setIsVisible] = React.useState(props.isResizing);
	const timer = React.useRef<NodeJS.Timeout>();

	React.useEffect(() => {
		if (props.isResizing) {
			setIsVisible(true);
		} else {
			timer.current = setTimeout(() => {
				setIsVisible(false);
			}, 200);
		}
		return () => {
			if (timer.current) {
				window.clearTimeout(timer.current);
			}
		};
	}, [props.isResizing]);

	return (
		<div
			style={{
				backgroundColor: props.color,
				visibility: isVisible ? 'visible' : 'hidden',
				opacity: props.isResizing ? 0.3 : 0,
			}}
			className='workspace-overlay'
			ref={ref}>
			<div className='workspace-overlay__minify' />
		</div>
	);
});

Overlay.displayName = 'Overlay';
