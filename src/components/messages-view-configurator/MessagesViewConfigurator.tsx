/** *****************************************************************************
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

import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ModalPortal } from '../util/Portal';
import RulesList from './RulesList';
import BodySortConfig from './BodySortConfig';
import useTheme from '../../hooks/useTheme';
import useLocalStorage from '../../hooks/useLocalStorage';
import TogglerRow from '../filter/row/TogglerRow';
import { useMessageDisplayRulesStore } from '../../hooks';
import '../../styles/app-settings.scss';

type Props = {
	sessions: string[];
};

export enum ThemeNames {
	LIGHT = 'light',
	DARK = 'dark',
}

export enum HighlightNames {
	KEYS = 'keys',
	VALUES = 'values',
}

export type ThemeClassNames = 'light' | 'dark';

const MessageViewConfigurator = ({ sessions }: Props) => {
	const { bodyHighLight, toggleBodyHighlight } = useMessageDisplayRulesStore();
	const [theme, setTheme] = useLocalStorage<ThemeNames>('theme', ThemeNames.LIGHT);
	const [isOpen, setIsOpen] = useState(false);
	useTheme(theme);

	return (
		<>
			<button className='app-settings-open' onClick={() => setIsOpen(true)} title='App Settings' />
			<ModalPortal
				isOpen={isOpen}
				style={{
					position: 'absolute',
					width: '100%',
					top: 0,
					right: 0,
					zIndex: 500,
				}}>
				<div className='app-settings'>
					<h2 className='app-settings-header'>Settings</h2>
					<button onClick={() => setIsOpen(false)} className='app-settings-close' />
					<div className='app-settings-body'>
						<div className='app-settings-body-row'>
							<TogglerRow
								config={{
									id: 'theme',
									type: 'toggler',
									label: 'Theme',
									possibleValues: [ThemeNames.LIGHT, ThemeNames.DARK],
									value: theme === ThemeNames.LIGHT,
									toggleValue: () => {
										setTheme((v: ThemeNames) =>
											v === ThemeNames.LIGHT ? ThemeNames.DARK : ThemeNames.LIGHT,
										);
									},
								}}
							/>
							<TogglerRow
								config={{
									id: 'highlight',
									type: 'toggler',
									label: 'Message body highlight',
									possibleValues: ['keys', 'values'],
									value: bodyHighLight === 'keys',
									toggleValue: toggleBodyHighlight,
								}}
							/>
						</div>
						<div className='app-settings-body-messages'>
							<RulesList sessions={sessions} />
							<BodySortConfig />
						</div>
					</div>
				</div>
			</ModalPortal>
		</>
	);
};

export default observer(MessageViewConfigurator);
