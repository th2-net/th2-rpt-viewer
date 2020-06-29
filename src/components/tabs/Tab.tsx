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
import { createStyleSelector } from '../../helpers/styleCreators';

export interface TabProps {
	children: React.ReactNode;
	tabIndex?: number;
	isSelected?: boolean;
	setActiveTab?: (index: number) => void;
	closeTab?: (index: number) => void;
	duplicateTab?: (index: number) => void;
	isClosable?: boolean;
	color?: string;
	classNames?: {
		root?: string;
		tab?: string;
		content?: string;
	};
	isDragging?: boolean;
}

export interface TabForwardedRefs {
	tabRef: HTMLDivElement | null;
	contentRef: HTMLDivElement | null;
}

const Tab: React.RefForwardingComponent<TabForwardedRefs, TabProps> = (props, ref) => {
	const {
		isSelected = false,
		tabIndex = 0,
		setActiveTab,
		closeTab,
		duplicateTab,
		children,
		isClosable = true,
		color,
		isDragging = false,
		classNames,
	} = props;
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

	const tabClassName = createStyleSelector(
		'tab',
		isSelected ? 'selected' : null,
		isDragging ? 'dragging' : null,
		classNames?.tab || null,
	);

	const dragIconClassName = createStyleSelector(
		'tab__drag-icon',
		isDragging ? 'active' : null,
	);

	return (
		<div
			className={tabClassName}
			onClick={() => setActiveTab && setActiveTab(tabIndex)}
			ref={tabRef}>
			<div className="tab__pre">
				<div className={dragIconClassName}/>
				{color && <div className="tab__color" style={{ borderColor: color }}/>}
			</div>
			<div className="tab__content-wrapper">
				<div
					className="tab__content"
					style={{
						pointerEvents: isSelected && !isDragging ? 'auto' : 'none',
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
						if (duplicateTab) {
							duplicateTab(tabIndex);
						}
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
							if (closeTab) {
								closeTab(tabIndex);
							}
						}}>
						<i className="tab__icon-close"/>
					</button>}
			</div>
		</div>
	);
};

export default observer(Tab, { forwardRef: true });
