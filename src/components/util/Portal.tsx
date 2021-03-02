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

import React, { CSSProperties, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const modalRoot = document.getElementById('modal-root');

interface Props {
	children: React.ReactNode;
}

export const Portal = ({ children }: Props) => {
	const el = useRef(document.createElement('div'));

	useEffect(() => {
		modalRoot?.appendChild(el.current);
		return () => {
			modalRoot?.removeChild(el.current);
		};
	}, []);

	return createPortal(children, el.current);
};

interface ModalPortalProps {
	closeDelay?: number;
	children: React.ReactNode;
	isOpen: boolean;
	style?: CSSProperties;
}

export const ModalPortal = React.forwardRef<HTMLDivElement, ModalPortalProps>(
	({ closeDelay = 0, children, isOpen, style }, ref) => {
		const [isShown, setIsShown] = React.useState(false);

		React.useEffect(() => {
			if (!isOpen && closeDelay !== 0) {
				setTimeout(() => {
					setIsShown(isOpen);
				}, closeDelay);
				return;
			}

			setIsShown(isOpen);
		}, [isOpen]);

		return (
			<Portal>
				<div ref={ref} style={{ ...style, visibility: isShown ? 'visible' : 'hidden' }}>
					{children}
				</div>
			</Portal>
		);
	},
);

ModalPortal.displayName = 'ModalPortal';
