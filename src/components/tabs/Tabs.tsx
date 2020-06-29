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
import '../../styles/tabs.scss';

interface InjectedProps {
	activeTabIndex: number;
	closeTab: (tabIndex: number) => void;
	duplicateTab: (tabIndex: number) => void;
	setActiveTab: (tabIndex: number) => void;
}

interface Props {
	tabList: (props: InjectedProps) => React.ReactNode[];
	tabPanels: React.ReactNode[];
	activeIndex: number;
	onChange: (tabIndex: number) => void;
	closeTab: (tabIndex: number) => void;
	duplicateTab: (tabIndex: number) => void;
}

const Tabs = ({
	tabList,
	tabPanels,
	activeIndex,
	onChange,
	closeTab,
	duplicateTab,
}: Props) => {
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
		duplicateTab,
		setActiveTab,
	});

	return (
		<div className="tabs__wrapper">
			<div className="tabs">
				<div className="tabs__list">
					{tabs}
				</div>
				<div className="tabs__content">
					{tabPanels.map((content, index) => (
						<div
							className="tabs__content-window"
							key={index}
							style={{ zIndex: index === activeIndex ? 1 : 0 }}>
							{content}
						</div>
					))}
				</div>
			</div>

		</div>
	);
};

export default observer(Tabs);
