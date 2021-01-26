/* eslint-disable no-param-reassign */
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
import { createStyleSelector } from '../../helpers/styleCreators';
import { useWorkspaceStore } from '../../hooks';
import { useWorkspaceViewStore } from '../../hooks/useWorkspaceViewStore';

const MIN_PANEL_WIDTH = 15;

interface Panel {
	title: string;
	component: React.ReactNode;
	isActive: boolean;
	color: string;
	minWidth?: number;
}

export interface Props {
	className?: string;
	splitterClassName?: string;
	panels: Array<Panel>;
}

function WorkspaceSplitter(props: Props) {
	const rootRef = React.useRef<HTMLDivElement>(null);
	const clickStartX = React.useRef(0);
	const activeSplitter = React.useRef<HTMLDivElement | null>(null);
	const [isResizing, setIsResizing] = React.useState(false);

	const panelsRefs = React.useRef(
		Array(props.panels.length)
			.fill(null)
			.map(() => React.createRef<HTMLDivElement>()),
	);

	const splittersRefs = React.useRef(
		Array(props.panels.length)
			.fill(null)
			.map(() => React.createRef<HTMLDivElement>()),
	);

	const overlaysRefs = React.useRef(
		Array(props.panels.length)
			.fill(null)
			.map(() => React.createRef<HTMLDivElement>()),
	);

	const splittersMinxMaxPositions = React.useRef<[number, number][]>([]);

	React.useLayoutEffect(() => {
		if (rootRef.current) {
			const rootWidth = rootRef.current.clientWidth;
			const panelDefaultWidth = ((rootWidth - splittersRefs.current.length * 3) / rootWidth) * 100;
			panelsRefs.current.forEach((panelRef, index) => {
				if (panelRef.current) {
					panelRef.current.style.width = `${index !== 2 ? panelDefaultWidth : 0}%`;
				}
			});
		}
	}, []);

	const onMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		if (rootRef.current) {
			setIsResizing(true);

			document.addEventListener('mousemove', onMouseMove);
			document.addEventListener('mouseup', onMouseUp);

			clickStartX.current = event.pageX;
			activeSplitter.current = event.target instanceof HTMLDivElement ? event.target : null;
			getMinMaxSplittersPositions();
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
	};

	const onMouseMove = (e: MouseEvent) => {
		e.preventDefault();

		handleResize(e);
	};

	const onMouseUp = () => {
		if (rootRef.current) {
			setIsResizing(false);
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
		}

		const widths = splittersRefs.current.map((splitterRef, index) => {
			const { left, width } = splitterRef.current!.getBoundingClientRect();
			const nextSplitter = splittersRefs.current[index + 1];
			const right =
				nextSplitter && nextSplitter.current
					? nextSplitter.current.getBoundingClientRect().left
					: rootRef.current!.getBoundingClientRect().width +
					  rootRef.current!.getBoundingClientRect().left;
			return right - (left + width);
		});

		panelsRefs.current.forEach((panelRef, index) => {
			if (panelRef.current) {
				panelRef.current.style.width = `${widths[index]}px`;

				if (widths[index] === MIN_PANEL_WIDTH) {
					if (!panelRef.current.classList.contains('minified')) {
						panelRef.current.classList.add('minified');
					}
				} else if (panelRef.current.classList.contains('minified')) {
					panelRef.current.classList.remove('minified');
				}
			}
		});

		splittersRefs.current.forEach(resizerRef => {
			if (resizerRef.current) {
				resizerRef.current.style.position = 'static';
				resizerRef.current.style.zIndex = '1000';
			}
		});
	};

	function minmax(num: number, min: number, max: number) {
		return Math.min(Math.max(num, min), max);
	}

	const getMinMaxSplittersPositions = () => {
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
	};

	const getUpdatedSplittersPositions = (activeSplitterLeft: number) => {
		const activeSplitterIndex = splittersRefs.current.findIndex(
			splitter => splitter.current === activeSplitter.current,
		);

		const { left: rootOffsetLeft } = rootRef.current!.getBoundingClientRect();

		return splittersRefs.current.map((resizerRef, index) => {
			if (resizerRef.current === activeSplitter.current)
				return minmax(activeSplitterLeft, ...splittersMinxMaxPositions.current[index]);
			const { left, width } = resizerRef.current!.getBoundingClientRect();
			const fullWidth = width + MIN_PANEL_WIDTH;

			if (
				index < activeSplitterIndex &&
				left - rootOffsetLeft + fullWidth * (activeSplitterIndex - index) > activeSplitterLeft
			) {
				return minmax(
					activeSplitterLeft - (activeSplitterIndex - index) * fullWidth,
					...splittersMinxMaxPositions.current[index],
				);
			}
			if (
				index > activeSplitterIndex &&
				activeSplitterLeft + (index - activeSplitterIndex) * fullWidth > left - rootOffsetLeft
			) {
				return minmax(
					activeSplitterLeft + (index - activeSplitterIndex) * fullWidth,
					...splittersMinxMaxPositions.current[index],
				);
			}
			return left - rootRef.current!.getBoundingClientRect().left;
		});
	};

	const handleResize = (e: MouseEvent | React.MouseEvent<HTMLDivElement>) => {
		if (activeSplitter.current) {
			const diffX = e.pageX - clickStartX.current;
			clickStartX.current = e.pageX;

			const rootOffsetLeft = rootRef.current?.getBoundingClientRect().left || 0;

			const activeSplitterOffsetLeft = activeSplitter.current.getBoundingClientRect().left;
			const activeSplitterLeftPostion = activeSplitterOffsetLeft + diffX - rootOffsetLeft;

			const splittersLeftPositions = getUpdatedSplittersPositions(activeSplitterLeftPostion);

			splittersRefs.current.forEach((splitter, index) => {
				if (splitter.current) {
					splitter.current.style.left = `${splittersLeftPositions[index]}px`;
				}
			});

			const spliiterWidth = splittersRefs.current[0].current!.clientWidth;

			overlaysRefs.current.forEach((overlayRef, index) => {
				if (overlayRef.current) {
					overlayRef.current.style.left = `${splittersLeftPositions[index] + spliiterWidth}px`;
					const overlayWidth =
						index === overlaysRefs.current.length - 1
							? rootRef.current!.offsetLeft +
							  rootRef.current!.offsetWidth -
							  splittersLeftPositions[index] -
							  spliiterWidth
							: splittersLeftPositions[index + 1] - splittersLeftPositions[index] - spliiterWidth;
					overlayRef.current.style.width = `${overlayWidth}px`;
				}
			});
		}
	};

	return (
		<div ref={rootRef} className='workspace-split-view'>
			{props.panels.map((panel, index) => (
				<React.Fragment key={panel.title}>
					<Splitter
						isResizing={isResizing}
						color={panel.color}
						icon={<i className={`workspace-split-view__${panel.title.toLowerCase()}-icon`} />}
						title={panel.title}
						onMouseDown={onMouseDown}
						disabled={index === 0}
						ref={splittersRefs.current[index]}
						isPanelActive={panel.isActive}
					/>
					<div className='workspace-split-view__pane pane' ref={panelsRefs.current[index]}>
						<div className='pane__sidebar'>
							<i className={`workspace-split-view__${panel.title.toLowerCase()}-icon`} />
							{panel.title}
							<div className='pane__line' style={{ backgroundColor: panel.color }}></div>
						</div>
						<div className='pane__wrapper'>
							<div className='pane__header-white-background'>
								<div className='pane__header' style={{ backgroundColor: panel.color }}>
									<i className={`workspace-split-view__${panel.title.toLowerCase()}-icon-white`} />
									{panel.title}
								</div>
							</div>
							<div className='pane__main'>{panel.component}</div>
						</div>
					</div>
					<Overlay color={panel.color} isResizing={isResizing} ref={overlaysRefs.current[index]} />
				</React.Fragment>
			))}
		</div>
	);
}

export default WorkspaceSplitter;

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
	title: string;
	disabled?: boolean;
	onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
	isResizing: boolean;
	isPanelActive?: boolean;
};

const Splitter = React.forwardRef<HTMLDivElement, SplitterProps>(
	({ title, onMouseDown, disabled = false, isPanelActive = false }, ref) => {
		const viewStore = useWorkspaceViewStore();
		const workspaceStore = useWorkspaceStore();

		const setActivePanel = () => {
			viewStore.setActivePanel(
				title === 'Events'
					? workspaceStore.eventsStore
					: title === 'Messages'
					? workspaceStore.messagesStore
					: null,
			);
		};

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
