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
import { createStyleSelector } from '../../helpers/styleCreators';
import '../../styles/tabs.scss';

export interface TabsInjectedProps {
	activeTabIndex: number;
	closeTab: (tabIndex: number) => void;
	setActiveTab: (tabIndex: number) => void;
}

export type TabListRenderProps = (props: TabsInjectedProps) => React.ReactNode;

interface Props {
	tabList: TabListRenderProps;
	tabPanels: React.ReactNode[];
	activeIndex: number;
	onChange: (tabIndex: number) => void;
	closeTab: (tabIndex: number) => void;
	classNames?: {
		root?: string;
		tabsList?: string;
		content?: string;
	};
}

const Tabs = (props: Props) => {
	const { tabList, tabPanels, activeIndex, onChange, closeTab, classNames = {} } = props;
	const [activeTabIndex, setActiveTabIndex] = React.useState(0);

	React.useEffect(() => {
		if (activeIndex !== activeTabIndex) {
			setActiveTabIndex(activeIndex);
		}
	}, [activeIndex]);

	const setActiveTab = (tabIndex: number) => {
		setActiveTabIndex(tabIndex);
		onChange(tabIndex);
	};

	const tabs = tabList({
		activeTabIndex,
		closeTab,
		setActiveTab,
	});

	const tabsListClassName = createStyleSelector('tabs__list', classNames.tabsList || null);

	return (
		<div className='tabs__wrapper'>
			<div className='tabs'>
				<div className={tabsListClassName}>{tabs}</div>
				<div className='tabs__content'>
					{tabPanels.map((content, index) => (
						<div
							className='tabs__content-window'
							key={index}
							style={{
								zIndex: index === activeIndex ? 1 : 0,
								opacity: index === activeIndex ? 1 : 0,
							}}>
							{content}
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default Tabs;
