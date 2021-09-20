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

enum ThemeNames {
	LIGHT = 'light',
	DARK = 'dark',
}

function invertColor(str: string) {
	let hex = str;
	if (hex.indexOf('#') === 0) {
		hex = hex.slice(1);
	}
	// convert 3-digit hex to 6-digits.
	if (hex.length === 3) {
		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
	}
	if (hex.length !== 6) {
		throw new Error('Invalid HEX color.');
	}
	// invert color components
	const r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16);
	const g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16);
	const b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
	// pad each with zeros and return
	return `#${padZero(r, r.length)}${padZero(g, g.length)}${padZero(b, g.length)}`;
}

function padZero(str: string, len = 2) {
	const zeros = new Array(len).join('0');
	return (zeros + str).slice(-len);
}

const themes: { [k: string]: Theme } = {
	light: {
		'app-background-color': '#bdccdb',
		'graph-background-color': '#dee5ed',
		'panel-background-color': '#ffffff',
		'workspace-background-color': '#eef2f6',
		'workspace-tab-background': '#cce6ff',
		'workspace-active-tab-background': '#4d80b2',
	},
	dark: {
		'app-background-color': invertColor('#bdccdb'),
		'graph-background-color': invertColor('#dee5ed'),
		'panel-background-color': invertColor('#ffffff'),
		'workspace-background-color': invertColor('#eef2f6'),
		'workspace-tab-background': invertColor('#cce6ff'),
		'workspace-active-tab-background': invertColor('#4d80b2'),
	},
};

const MessageViewConfigurator = ({ sessions }: Props) => {
	const [theme, setTheme] = useLocalStorage<ThemeNames>('theme', ThemeNames.LIGHT);
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
					<TogglerRow
						config={{
							id: 'theme',
							type: 'toggler',
							possibleValues: [ThemeNames.LIGHT, ThemeNames.DARK],
							value: theme === ThemeNames.LIGHT,
							toggleValue: () => {
								setTheme(v => (v === ThemeNames.LIGHT ? ThemeNames.DARK : ThemeNames.LIGHT));
							},
						}}
					/>
					<div className='app-settings-body'>
						<div className='app-settings-body-row'>
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
