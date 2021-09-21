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
import { ModalPortal } from '../util/Portal';
import '../../styles/app-settings.scss';
import RulesList from './RulesList';
import BodySortConfig from './BodySortConfig';
import useTheme, { Theme } from '../../hooks/useTheme';
import useLocalStorage from '../../hooks/useLocalStorage';
import TogglerRow from '../filter/row/TogglerRow';

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

const themes: { [k: string]: Theme } = {
	light: {
		'app-background-color': '#bdccdb',
		'graph-background-color': '#dee5ed',
		'panel-background-color': '#ffffff',
		'workspace-background-color': '#eef2f6',
		'workspace-tab-background': '#cce6ff',
		'workspace-active-tab-background': '#4d80b2',
		// ...
	},
	// waiting for color scheme
	dark: {
		'app-background-color': '#bdccdb',
		'graph-background-color': '#dee5ed',
		'panel-background-color': '#ffffff',
		'workspace-background-color': '#eef2f6',
		'workspace-tab-background': '#cce6ff',
		'workspace-active-tab-background': '#4d80b2',
		// ...
	},
};

const MessageViewConfigurator = ({ sessions }: Props) => {
	const [theme, setTheme] = useLocalStorage<ThemeNames>('theme', ThemeNames.LIGHT);
	const [highlight, setHighlight] = useLocalStorage<HighlightNames>(
		'message-body-highlight',
		HighlightNames.KEYS,
	);
	const [isOpen, setIsOpen] = useState(false);
	useTheme(themes[theme]);

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
									possibleValues: [HighlightNames.KEYS, HighlightNames.VALUES],
									value: highlight === HighlightNames.KEYS,
									toggleValue: () => {
										setHighlight((v: HighlightNames) =>
											v === HighlightNames.KEYS ? HighlightNames.VALUES : HighlightNames.KEYS,
										);
									},
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

export default MessageViewConfigurator;
