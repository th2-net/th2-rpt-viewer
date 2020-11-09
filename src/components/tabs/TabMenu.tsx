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
import { observer } from 'mobx-react-lite';
import { ModalPortal } from '../Portal';
import { createBemElement, createStyleSelector } from '../../helpers/styleCreators';

interface Props {
	tabRect?: DOMRect;
	menuWidth?: number;
	children: React.ReactNode;
	isDuplicable: boolean;
	isClosable: boolean;
	duplicateTab: () => void;
	closeTab: () => void;
	isSelected: boolean;
}

const TabMenu: React.RefForwardingComponent<HTMLDivElement, Props> = (props, menuRef) => {
	const {
		tabRect,
		menuWidth,
		children,
		isDuplicable,
		isClosable,
		duplicateTab,
		closeTab,
		isSelected,
	} = props;

	const getMenuStyles = () => {
		if (!tabRect) {
			return {
				left: 0,
				width: 0,
				top: 0,
			};
		}
		const { left, right, width, bottom } = tabRect;

		const finalWidth = !menuWidth ? width : menuWidth;
		const clientWidth = document.documentElement.clientWidth;
		const widthDiff = Math.round(finalWidth - width);
		let widthRemainder = widthDiff;
		let startX = Math.max(8, left - widthDiff / 2);
		widthRemainder -= left - startX;
		const endX = Math.min(clientWidth - 8, right + widthRemainder);
		widthRemainder -= endX - right;

		if (widthRemainder > 0) {
			startX = Math.max(10, startX - widthRemainder);
		}

		return {
			left: startX,
			width: finalWidth,
			top: bottom - 1,
		};
	};

	const onDuplicate = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		event.stopPropagation();
		if (isDuplicable) {
			duplicateTab();
		}
	};

	const onClose = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		event.stopPropagation();
		if (isClosable) {
			closeTab();
		}
	};

	const rootClassName = createStyleSelector('tab-menu', isSelected ? 'selected' : null);

	const duplicateButtonClassName = createBemElement(
		'tab-menu',
		'button',
		isDuplicable ? 'active' : 'disabled',
	);

	const closeButtonClassName = createBemElement(
		'tab-menu',
		'button',
		isClosable ? 'active' : 'disabled',
	);

	const menuStyles = getMenuStyles();

	return (
		<ModalPortal isOpen={true}>
			<div className={rootClassName} ref={menuRef} style={menuStyles}>
				{tabRect && (
					<div
						className='tab-menu__box-shadow-overlay'
						style={{
							left: tabRect?.left - menuStyles.left,
							width: tabRect.width,
						}}
					/>
				)}
				{children}
				<div className='tab-menu__controls'>
					<button className={duplicateButtonClassName} title='duplicate tab' onClick={onDuplicate}>
						<i className='tab-menu__icon-duplicate' />
					</button>
					<button
						className={closeButtonClassName}
						role='button'
						title='close tab'
						onClick={onClose}>
						<i className='tab-menu__icon-close' />
					</button>
				</div>
			</div>
		</ModalPortal>
	);
};

export default observer(TabMenu, { forwardRef: true });
