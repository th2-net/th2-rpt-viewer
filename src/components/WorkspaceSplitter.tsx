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

interface Panel {
	title: string;
	component: React.ReactNode;
	color?: string;
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
			const panelDefaultWidth = ((rootWidth - splittersRefs.current.length * 4) / rootWidth) * 100;
			panelsRefs.current.forEach((panelRef, index) => {
				if (panelRef.current) {
					// eslint-disable-next-line no-param-reassign
					panelRef.current.style.width = `${index === 0 ? panelDefaultWidth : 0}%`;
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
			}
		});

		splittersRefs.current.forEach(resizerRef => {
			if (resizerRef.current) {
				resizerRef.current.style.position = 'static';
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
			const min = splitterRef.current.clientWidth * index;
			const max =
				rootOffsetWidth - splitterRef.current.clientWidth * (splittersRefs.current.length - index);
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

			if (
				index < activeSplitterIndex &&
				left - rootOffsetLeft + width * (activeSplitterIndex - index) > activeSplitterLeft
			) {
				return minmax(
					activeSplitterLeft - (activeSplitterIndex - index) * width,
					...splittersMinxMaxPositions.current[index],
				);
			}
			if (
				index > activeSplitterIndex &&
				activeSplitterLeft + (index - activeSplitterIndex) * width > left - rootOffsetLeft
			) {
				return minmax(
					activeSplitterLeft + (index - activeSplitterIndex) * width,
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

			splittersRefs.current.forEach((resizer, index) => {
				if (resizer.current) {
					resizer.current.style.left = `${splittersLeftPositions[index]}px`;
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
					const minWidth = props.panels[index].minWidth;
					if (minWidth && overlayWidth < minWidth) {
						overlayRef.current.classList.add('minimize');
					} else {
						overlayRef.current.classList.remove('minimize');
					}
				}
			});
		}
	};

	return (
		<div ref={rootRef} className='workspace-splitter'>
			{props.panels.map((panel, index) => (
				<>
					<Resizer
						color={panel.color}
						title={panel.title}
						onMouseDown={onMouseDown}
						disabled={index === 0}
						ref={splittersRefs.current[index]}
					/>
					<div className='workspace-splitter-panel' ref={panelsRefs.current[index]}>
						{panel.component}
					</div>
					<Overlay
						color={panel.color || '#CCC'}
						isActive={isResizing}
						ref={overlaysRefs.current[index]}
					/>
				</>
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

type ResizerProps = {
	color: string;
	title: string;
	disabled?: boolean;
	onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
};

const Resizer: any = React.forwardRef<HTMLDivElement, ResizerProps>(
	({ color, title, onMouseDown, disabled = false }, ref) => (
		<div
			className='workspace-splitter-resizer__root'
			onMouseDown={e => (disabled ? null : onMouseDown(e))}>
			<div
				ref={ref}
				className='workspace-splitter-resizer'
				style={{ backgroundColor: color, cursor: disabled ? 'default' : 'col-resize' }}>
				{/* <h3 className='workspace-splitter-resizer__title'>{title}</h3> */}
				<div
					style={{
						width: '5px',
						height: '5px',
						borderRadius: '50%',
						backgroundColor: '#fff',
					}}
				/>
			</div>
		</div>
	),
);

Resizer.displayName = 'Resizer';

interface OverlayProps {
	color: string;
	isActive: boolean;
}

const Overlay = React.forwardRef<HTMLDivElement, OverlayProps>((props, ref) => {
	const [isVisible, setIsVisible] = React.useState(props.isActive);
	const timer = React.useRef<NodeJS.Timeout>();

	React.useEffect(() => {
		if (props.isActive) {
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
	}, [props.isActive]);

	return (
		<div
			style={{
				backgroundColor: props.color,
				visibility: isVisible ? 'visible' : 'hidden',
				display: 'block',
				opacity: props.isActive ? 0.3 : 0,
			}}
			className='workspace-splitter__overlay'
			ref={ref}>
			<div className='workspace-splitter__overlay-minify' />
		</div>
	);
});

Overlay.displayName = 'Overlay';
