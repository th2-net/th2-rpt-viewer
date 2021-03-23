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
import { createStyleSelector } from 'helpers/styleCreators';
import { useOutsideClickListener } from 'hooks';
import { ModalPortal } from './Portal';

interface PopoverProps {
	isOpen: boolean;
	anchorEl?: HTMLElement | null;
	onClickOutside: (e: MouseEvent) => void;
	children: React.ReactNode;
	className?: string;
	maxWidth?: number;
}

export default function Popover(props: PopoverProps) {
	const { isOpen, onClickOutside, anchorEl, className = '', children, maxWidth = 500 } = props;

	const rootRef = React.useRef<HTMLDivElement>(null);

	const anchorElement = anchorEl || rootRef.current;

	useOutsideClickListener(rootRef, onClickOutside);

	const getAnchorOffset = React.useCallback(() => {
		if (anchorElement instanceof Node && rootRef.current) {
			const anchorRect = anchorElement.getBoundingClientRect();
			let menuOffsetLeft = anchorRect.right + 10;
			const { width } = rootRef.current.getBoundingClientRect();

			if (
				window.innerWidth < menuOffsetLeft + width ||
				window.innerWidth < menuOffsetLeft + maxWidth
			) {
				menuOffsetLeft = anchorRect.left - 10 - (width > maxWidth ? maxWidth : width);
			}

			return {
				top: anchorRect.top - 2,
				left: menuOffsetLeft,
			};
		}

		return null;
	}, [anchorEl]);

	const setPositioningStyles = React.useCallback(() => {
		const offset = getAnchorOffset();
		if (offset && rootRef.current) {
			rootRef.current.style.left = `${offset.left}px`;
			rootRef.current.style.top = `${offset.top}px`;
		}
	}, [getAnchorOffset]);

	React.useEffect(() => {
		if (rootRef.current) {
			rootRef.current.scrollLeft = 0;
			rootRef.current.scrollTop = 0;
		}
		if (isOpen) {
			setPositioningStyles();
		}
	}, [isOpen, setPositioningStyles]);

	const rootClassName = createStyleSelector('popover', className);

	return (
		<ModalPortal isOpen={isOpen}>
			<div
				ref={rootRef}
				className={rootClassName}
				style={{ visibility: !isOpen ? 'hidden' : 'visible', maxWidth }}>
				{children}
			</div>
		</ModalPortal>
	);
}
