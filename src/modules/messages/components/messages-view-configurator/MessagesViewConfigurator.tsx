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

import { useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useOutsideClickListener } from 'hooks/useOutsideClickListener';
import { IconButton } from 'components/buttons/IconButton';
import { ToggleButtonGroup, ToggleButton } from 'components/buttons/ToggleButton';
import { useMessagesFilterConfigStore } from '../../hooks/useFilterConfigStore';
import { ModalPortal } from '../../../../components/util/Portal';
import RulesList from './RulesList';
import BodySortConfig from './BodySortConfig';
import 'styles/messages-view-configurator.scss';

const MessageViewConfigurator = () => {
	const { messageSessions } = useMessagesFilterConfigStore();

	const [isOpen, setIsOpen] = useState(false);
	const [mode, setMode] = useState<'display-rules' | 'body-sort'>('display-rules');

	const modalRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	useOutsideClickListener(modalRef, (e: MouseEvent) => {
		const isFromAutocomplete = Boolean((e.target as HTMLElement).closest('.rules-autocomplete'));
		const isFromSelect = Boolean((e.target as HTMLElement).closest('.rules-select-options-list'));
		if (
			!buttonRef.current?.contains(e.target as HTMLElement) &&
			!isFromAutocomplete &&
			!isFromSelect
		) {
			setIsOpen(false);
		}
	});

	const offsetTop = buttonRef.current?.getBoundingClientRect().top;
	const offsetRight = buttonRef.current?.getBoundingClientRect().left;

	return (
		<>
			<IconButton ref={buttonRef} onClick={() => setIsOpen(open => !open)}>
				<i className='messages-window-header__settings-icon' />
			</IconButton>
			<ModalPortal
				isOpen={isOpen}
				ref={modalRef}
				style={{
					position: 'absolute',
					width: '320px',
					top: `calc(35px + ${offsetTop}px)`,
					right: `calc(100% - ${offsetRight}px - 14px)`,
					zIndex: 500,
				}}>
				<div className='messages-view-configurator'>
					<div className='messages-view-configurator-header'>
						<p>{mode === 'display-rules' ? 'Message Display Rules' : 'Message Body Sort'}</p>
					</div>
					<div className='messages-view-configurator-body'>
						{mode === 'display-rules' ? (
							<RulesList sessions={messageSessions} />
						) : (
							<BodySortConfig />
						)}
					</div>
					{mode === 'display-rules' ? (
						<p className='hint'>
							<i>Use * character to match an unknown substring as part of session name</i>
						</p>
					) : null}

					<ToggleButtonGroup
						value={mode}
						onChange={setMode}
						className='messages-view-configurator__togglers'>
						<ToggleButton value='display-rules'>Display rules</ToggleButton>
						<ToggleButton value='body-sort'>Body sort</ToggleButton>
					</ToggleButtonGroup>
				</div>
			</ModalPortal>
		</>
	);
};

export default observer(MessageViewConfigurator);
