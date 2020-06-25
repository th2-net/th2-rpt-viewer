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
import React from 'react';
import { observer } from 'mobx-react-lite';
import { useDrag } from 'react-dnd';
import { createStyleSelector } from '../../helpers/styleCreators';

export interface TabProps {
	children: React.ReactNode;
	tabIndex: number;
	windowIndex: number;
	isSelected: boolean;
	setActiveTab: (index: number) => void;
	closeTab: (index: number) => void;
	duplicateTab: (index: number) => void;
	isClosable?: boolean;
}

export const Tab = observer<TabProps, { tabRef: HTMLDivElement | null; contentRef: HTMLDivElement | null }>(({
	isSelected = false,
	tabIndex = 0,
	setActiveTab,
	closeTab,
	duplicateTab,
	children,
	isClosable = true,
}, ref) => {
	const tabClassName = createStyleSelector(
		'tab',
		isSelected ? 'selected' : null,
	);

	const tabRef = React.useRef<HTMLDivElement>(null);
	const contentRef = React.useRef<HTMLDivElement>(null);

	React.useImperativeHandle(ref, () => ({
		get tabRef() {
			return tabRef.current;
		},
		get contentRef() {
			return contentRef.current;
		},
	}));

	return (
		<div
			className="tab-wrapper"
			style={{ zIndex: !isSelected ? 0 : 1 }}>
			<div
				className={tabClassName}
				onClick={() => setActiveTab(tabIndex)}
				ref={tabRef}>
				<div className="tab__content-wrapper">
					<div
						className="tab__content"
						style={{
							pointerEvents: isSelected ? 'auto' : 'none',
						}}
						ref={contentRef}>
						{children}
					</div>
				</div>
				<div className="tab__controls">
					<button
						className="tab__button"
						title="duplicate tab"
						onClick={e => {
							e.stopPropagation();
							duplicateTab(tabIndex);
						}}>
						<i className="tab__icon-dublicate"/>
					</button>
					{isClosable
						&& 	<button
							className="tab__button"
							role="button"
							title="close tab"
							onClick={e => {
								e.stopPropagation();
								closeTab(tabIndex);
							}}>
							<i className="tab__icon-close"/>
						</button>}
				</div>
			</div>
		</div>
	);
}, { forwardRef: true });

Tab.displayName = 'Tab';
